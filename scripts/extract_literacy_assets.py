#!/usr/bin/env python3
"""
Extract candidate SVG assets for early-literacy worksheets.

Default source: nyuuzyou/openclipart on Hugging Face Dataset Viewer.
The dataset is CC0 and exposes OpenClipart metadata plus SVG content, so this
script can fetch small search result slices instead of downloading the dataset.
"""

import argparse
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Callable


DATASET_SERVER = "https://datasets-server.huggingface.co/search"
DATASET_NAME = "nyuuzyou/openclipart"
DATASET_CONFIG = "default"
DATASET_SPLIT = "train"
SOURCE_NAME = "OpenClipart via Hugging Face dataset nyuuzyou/openclipart"
SOURCE_LICENSE = "CC0"
OPENCLIPART_BASE = "https://openclipart.org"


@dataclass(frozen=True)
class AssetWord:
    key: str
    word: str
    syllables: list[str]
    queries: list[str]
    tags: list[str]


@dataclass(frozen=True)
class Candidate:
    source_id: str
    title: str
    description: str
    tags: list[str]
    page_url: str
    svg_url: str
    thumbnail_url: str
    license: str
    artist_name: str
    svg_content: str

    @staticmethod
    def from_hf_row(payload: dict) -> "Candidate":
        row = payload.get("row", payload)
        source_id = str(payload.get("row_idx") or extract_id(row.get("page_url", "")) or row.get("title", "asset"))
        image_urls = row.get("image_urls") if isinstance(row.get("image_urls"), dict) else {}
        raw_tags = row.get("tags") if isinstance(row.get("tags"), list) else []
        return Candidate(
            source_id=source_id,
            title=str(row.get("title") or "untitled"),
            description=str(row.get("description") or ""),
            tags=[str(tag) for tag in raw_tags],
            page_url=str(row.get("page_url") or ""),
            svg_url=str(image_urls.get("svg") or ""),
            thumbnail_url=str(row.get("thumbnail_url") or image_urls.get("png_small") or ""),
            license=str(row.get("license") or SOURCE_LICENSE),
            artist_name=str(row.get("artist_name") or ""),
            svg_content=str(row.get("svg_content") or ""),
        )


DEFAULT_WORDS = [
    AssetWord("vaca", "VACA", ["VA", "CA"], ["cow", "cow outline", "farm cow"], ["cow", "farm", "animal"]),
    AssetWord("pato", "PATO", ["PA", "TO"], ["duck", "duck outline", "farm duck"], ["duck", "farm", "animal"]),
    AssetWord("galo", "GALO", ["GA", "LO"], ["rooster", "chicken outline", "farm rooster"], ["rooster", "chicken", "farm", "animal"]),
    AssetWord("porco", "PORCO", ["POR", "CO"], ["pig", "pig outline", "farm pig"], ["pig", "farm", "animal"]),
    AssetWord("cavalo", "CAVALO", ["CA", "VA", "LO"], ["horse", "horse outline", "farm horse"], ["horse", "farm", "animal"]),
    AssetWord("ovelha", "OVELHA", ["O", "VE", "LHA"], ["sheep", "sheep outline", "farm sheep"], ["sheep", "farm", "animal"]),
    AssetWord("bola", "BOLA", ["BO", "LA"], ["ball outline", "soccer ball"], ["ball", "toy", "school"]),
    AssetWord("bolo", "BOLO", ["BO", "LO"], ["cake outline", "birthday cake"], ["cake", "food"]),
    AssetWord("casa", "CASA", ["CA", "SA"], ["house outline", "simple house"], ["house", "home"]),
    AssetWord("uva", "UVA", ["U", "VA"], ["grapes outline", "grape"], ["grape", "fruit"]),
]


def normalize(value: str) -> str:
    return re.sub(r"\s+", " ", re.sub(r"[^a-z0-9]+", " ", value.lower())).strip()


def slugify(value: str, fallback: str = "asset") -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", normalize(value)).strip("-")
    return slug[:70] or fallback


def extract_id(value: str) -> str:
    match = re.search(r"/(\d+)(?:/|$)", value or "")
    return match.group(1) if match else ""


def text_blob(candidate: Candidate) -> str:
    return normalize(" ".join([candidate.title, candidate.description, " ".join(candidate.tags)]))


def is_svg_usable(candidate: Candidate, max_svg_bytes: int = 600_000) -> bool:
    svg = candidate.svg_content.strip()
    if not svg.startswith("<svg") and "<svg" not in svg[:200]:
        return False
    if len(svg.encode("utf-8", errors="ignore")) > max_svg_bytes:
        return False
    return candidate.license.upper() == SOURCE_LICENSE


def score_candidate(candidate: Candidate, word: AssetWord, query: str) -> int:
    blob = text_blob(candidate)
    score = 0

    query_terms = [term for term in normalize(query).split() if len(term) > 1]
    for term in query_terms:
        if re.search(rf"\b{re.escape(term)}\b", blob):
            score += 6
        elif term in blob:
            score += 2

    for tag in word.tags:
        normalized_tag = normalize(tag)
        if re.search(rf"\b{re.escape(normalized_tag)}\b", blob):
            score += 4

    title = normalize(candidate.title)
    if any(re.search(rf"\b{re.escape(term)}\b", title) for term in query_terms):
        score += 5

    if any(keyword in blob for keyword in ["outline", "line art", "black white", "coloring", "colouring"]):
        score += 7

    if any(bad in blob for bad in ["photo", "photograph", "realistic", "3d", "airplane", "weapon"]):
        score -= 5

    if "<image" in candidate.svg_content[:500].lower():
        score -= 6

    if not is_svg_usable(candidate):
        score -= 100

    return score


class HuggingFaceSearchClient:
    def __init__(self, timeout: int = 40, retries: int = 4, pause_seconds: float = 3.0):
        self.timeout = timeout
        self.retries = retries
        self.pause_seconds = pause_seconds

    def search(self, query: str, limit: int) -> list[dict]:
        params = urllib.parse.urlencode(
            {
                "dataset": DATASET_NAME,
                "config": DATASET_CONFIG,
                "split": DATASET_SPLIT,
                "query": query,
                "offset": 0,
                "length": min(max(limit, 1), 100),
            }
        )
        url = f"{DATASET_SERVER}?{params}"
        last_error = None

        for attempt in range(1, self.retries + 1):
            try:
                with urllib.request.urlopen(url, timeout=self.timeout) as response:
                    payload = json.loads(response.read().decode("utf-8"))
                    return payload.get("rows", [])
            except urllib.error.HTTPError as error:
                body = error.read().decode("utf-8", errors="replace")
                last_error = f"HTTP {error.code}: {body}"
                if error.code not in (429, 500, 502, 503) and "index is loading" not in body:
                    break
            except (urllib.error.URLError, TimeoutError) as error:
                last_error = str(error)

            if attempt < self.retries:
                time.sleep(self.pause_seconds * attempt)

        raise RuntimeError(f"Could not search Hugging Face dataset for {query!r}: {last_error}")


def read_url_text(url: str, timeout: int = 40) -> str:
    request = urllib.request.Request(url, headers={"User-Agent": "EduDocsAssetExtractor/1.0"})
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return response.read().decode("utf-8", errors="replace")


def absolutize_openclipart_url(value: str) -> str:
    return urllib.parse.urljoin(OPENCLIPART_BASE, value)


def parse_openclipart_search_results(
    page_html: str,
    query: str,
    svg_loader: Callable[[str], str],
    limit: int = 100,
) -> list[dict]:
    pattern = re.compile(
        r'<a\s+href="(?P<href>/detail/(?P<id>\d+)/(?P<slug>[^"]+))">\s*'
        r'<img\s+src="(?P<thumb>[^"]+)"\s+alt="(?P<title>[^"]*)"',
        re.IGNORECASE,
    )
    summaries = []
    seen: set[str] = set()

    for match in pattern.finditer(page_html):
        source_id = match.group("id")
        if source_id in seen:
            continue
        seen.add(source_id)

        title = html.unescape(match.group("title")).strip() or match.group("slug").replace("-", " ")
        score = score_openclipart_summary(title, query)
        if score <= 0:
            continue
        summaries.append(
            {
                "source_id": source_id,
                "title": title,
                "href": match.group("href"),
                "thumb": match.group("thumb"),
                "score": score,
            }
        )

    rows = []
    for summary in sorted(summaries, key=lambda item: (item["score"], normalize(item["title"])), reverse=True)[:limit]:
        source_id = summary["source_id"]
        title = summary["title"]
        page_url = absolutize_openclipart_url(summary["href"])
        thumb_url = absolutize_openclipart_url(summary["thumb"])
        svg_url = f"{OPENCLIPART_BASE}/download/{source_id}"
        svg_content = svg_loader(svg_url)

        rows.append(
            {
                "row_idx": source_id,
                "row": {
                    "title": title,
                    "description": title,
                    "artist_name": "",
                    "page_url": page_url,
                    "tags": list(dict.fromkeys(normalize(title).split())),
                    "license": SOURCE_LICENSE,
                    "image_urls": {
                        "svg": svg_url,
                        "png_small": thumb_url,
                        "png_medium": thumb_url,
                        "png_large": thumb_url,
                    },
                    "thumbnail_url": thumb_url,
                    "svg_content": svg_content,
                },
            }
        )

    return rows


def score_openclipart_summary(title: str, query: str) -> int:
    normalized_title = normalize(title)
    normalized_query = normalize(query)
    query_terms = [term for term in normalized_query.split() if len(term) > 1]
    descriptor_terms = {"outline", "line", "art", "black", "white", "coloring", "colouring", "farm", "simple"}
    primary_terms = [term for term in query_terms if term not in descriptor_terms] or query_terms
    if primary_terms and not any(re.search(rf"\b{re.escape(term)}\b", normalized_title) for term in primary_terms):
        return -100

    score = 0

    for term in query_terms:
        if re.search(rf"\b{re.escape(term)}\b", normalized_title):
            score += 8
        elif term in normalized_title:
            score += 2

    if normalized_title == normalized_query:
        score += 10

    if any(keyword in normalized_title for keyword in ["outline", "black and white", "black white", "line art", "coloring", "colouring"]):
        score += 25

    if any(bad in normalized_title for bad in ["neon", "angel", "moon", "skull", "computer", "surfer", "girl", "lady", "hinamatsuri", "evil"]):
        score -= 20

    if "silhouette" in normalized_title:
        score -= 5

    return score


class OpenClipartSearchClient:
    def __init__(self, timeout: int = 40, retries: int = 3, pause_seconds: float = 2.0):
        self.timeout = timeout
        self.retries = retries
        self.pause_seconds = pause_seconds

    def _read_with_retries(self, url: str) -> str:
        last_error = None
        for attempt in range(1, self.retries + 1):
            try:
                return read_url_text(url, timeout=self.timeout)
            except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as error:
                last_error = str(error)
                if attempt < self.retries:
                    time.sleep(self.pause_seconds * attempt)
        raise RuntimeError(f"Could not read {url}: {last_error}")

    def search(self, query: str, limit: int) -> list[dict]:
        params = urllib.parse.urlencode({"query": query})
        search_url = f"{OPENCLIPART_BASE}/search/?{params}"
        page_html = self._read_with_retries(search_url)
        return parse_openclipart_search_results(
            page_html,
            query=query,
            svg_loader=self._read_with_retries,
            limit=limit,
        )


class AutoSearchClient:
    def __init__(self, timeout: int = 40, retries: int = 4):
        self.huggingface = HuggingFaceSearchClient(timeout=timeout, retries=retries)
        self.openclipart = OpenClipartSearchClient(timeout=timeout, retries=max(2, min(retries, 4)))

    def search(self, query: str, limit: int) -> list[dict]:
        try:
            return self.huggingface.search(query, limit)
        except RuntimeError as error:
            print(f"  Hugging Face search failed for {query!r}; using OpenClipart HTML fallback. ({error})")
            return self.openclipart.search(query, limit)


SearchFn = Callable[[str, int], list[dict]]


def collect_candidates(word: AssetWord, search_fn: SearchFn, max_per_word: int = 8) -> list[Candidate]:
    best_by_id: dict[str, tuple[int, Candidate]] = {}
    query_limit = min(20, max(4, max_per_word))

    for query in word.queries:
        for payload in search_fn(query, query_limit):
            candidate = Candidate.from_hf_row(payload)
            score = score_candidate(candidate, word, query)
            if score <= 0:
                continue
            current = best_by_id.get(candidate.source_id)
            if current is None or score > current[0]:
                best_by_id[candidate.source_id] = (score, candidate)

    ranked = sorted(
        best_by_id.values(),
        key=lambda item: (item[0], normalize(item[1].title)),
        reverse=True,
    )
    return [candidate for _, candidate in ranked[:max_per_word]]


def load_words(manifest: Path | None, selected_words: list[str] | None = None) -> dict[str, AssetWord]:
    if manifest:
        payload = json.loads(manifest.read_text(encoding="utf-8"))
        words = [
            AssetWord(
                key=str(item["key"]),
                word=str(item["word"]).upper(),
                syllables=[str(value).upper() for value in item.get("syllables", [])],
                queries=[str(value) for value in item.get("queries", [])],
                tags=[str(value) for value in item.get("tags", [])],
            )
            for item in payload.get("words", [])
        ]
    else:
        words = DEFAULT_WORDS

    by_key = {word.key: word for word in words}
    if selected_words:
        missing = [key for key in selected_words if key not in by_key]
        if missing:
            raise ValueError(f"Unknown word keys: {', '.join(missing)}")
        return {key: by_key[key] for key in selected_words}
    return by_key


def write_asset_bundle(
    output_dir: Path,
    topic: str,
    words: dict[str, AssetWord],
    candidates_by_word: dict[str, list[Candidate]],
) -> None:
    bundle_dir = output_dir / topic
    candidates_dir = bundle_dir / "candidates"
    candidates_dir.mkdir(parents=True, exist_ok=True)

    metadata = {
        "topic": topic,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "source": SOURCE_NAME,
        "license": SOURCE_LICENSE,
        "words": {},
    }

    for key, word in words.items():
        word_dir = candidates_dir / key
        word_dir.mkdir(parents=True, exist_ok=True)

        word_metadata = {
            "word": word.word,
            "syllables": word.syllables,
            "queries": word.queries,
            "tags": word.tags,
            "candidates": [],
        }

        for index, candidate in enumerate(candidates_by_word.get(key, []), start=1):
            filename = f"{index:02d}-{slugify(candidate.title, candidate.source_id)}.svg"
            svg_path = word_dir / filename
            svg_path.write_text(candidate.svg_content, encoding="utf-8")
            word_metadata["candidates"].append(
                {
                    "title": candidate.title,
                    "artist": candidate.artist_name,
                    "license": candidate.license,
                    "pageUrl": candidate.page_url,
                    "svgUrl": candidate.svg_url,
                    "thumbnailUrl": candidate.thumbnail_url,
                    "relativePath": str(svg_path.relative_to(bundle_dir)).replace("\\", "/"),
                    "sourceId": candidate.source_id,
                }
            )

        metadata["words"][key] = word_metadata

    (bundle_dir / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    (bundle_dir / "review.html").write_text(build_review_html(topic, metadata), encoding="utf-8")


def build_review_html(topic: str, metadata: dict) -> str:
    sections = []
    for key, word_data in metadata["words"].items():
        cards = []
        for candidate in word_data["candidates"]:
            rel = html.escape(candidate["relativePath"])
            title = html.escape(candidate["title"])
            page_url = html.escape(candidate["pageUrl"])
            cards.append(
                f"""
                <article class="card">
                  <img src="{rel}" alt="{title}">
                  <strong>{title}</strong>
                  <span>{html.escape(candidate["license"])}</span>
                  <a href="{page_url}" target="_blank" rel="noreferrer">fonte</a>
                  <label><input type="radio" name="{html.escape(key)}"> escolher</label>
                </article>
                """
            )
        sections.append(
            f"""
            <section>
              <h2>{html.escape(word_data["word"])} <small>{html.escape("-".join(word_data["syllables"]))}</small></h2>
              <div class="grid">{''.join(cards) or '<p>Nenhum candidato encontrado.</p>'}</div>
            </section>
            """
        )

    return f"""<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <title>Curadoria de imagens - {html.escape(topic)}</title>
  <style>
    body {{ font-family: Arial, sans-serif; margin: 24px; color: #111; background: #fafafa; }}
    h1 {{ margin-bottom: 4px; }}
    section {{ margin: 28px 0; }}
    h2 {{ border-bottom: 2px solid #222; padding-bottom: 8px; }}
    small {{ color: #666; font-size: 0.7em; }}
    .grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 14px; }}
    .card {{ background: white; border: 1px solid #ddd; border-radius: 8px; padding: 12px; display: grid; gap: 8px; }}
    .card img {{ width: 100%; height: 140px; object-fit: contain; border: 1px solid #eee; background: white; }}
    .card strong {{ font-size: 14px; min-height: 36px; }}
    .card span, .card a, .card label {{ font-size: 12px; }}
  </style>
</head>
<body>
  <h1>Curadoria de imagens</h1>
  <p>Abra esta pagina, escolha visualmente as melhores imagens e depois promova os SVGs aprovados para a biblioteca final.</p>
  {''.join(sections)}
</body>
</html>
"""


def parse_words_arg(value: str | None) -> list[str] | None:
    if not value:
        return None
    return [item.strip() for item in value.split(",") if item.strip()]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Extract SVG candidates for literacy activity assets.")
    parser.add_argument("--topic", default="animais_fazenda", help="Output topic folder name.")
    parser.add_argument("--output", default="assets/alfabetizacao", type=Path, help="Output base directory.")
    parser.add_argument("--manifest", type=Path, help="Optional JSON manifest with custom words.")
    parser.add_argument("--words", help="Comma-separated word keys to fetch, e.g. vaca,pato,galo.")
    parser.add_argument("--max-per-word", type=int, default=8, help="Maximum candidates saved per word.")
    parser.add_argument("--source", choices=["auto", "huggingface", "openclipart"], default="openclipart", help="Search source.")
    parser.add_argument("--timeout", type=int, default=40, help="HTTP timeout in seconds.")
    parser.add_argument("--retries", type=int, default=4, help="Retries per search query.")
    parser.add_argument("--dry-run", action="store_true", help="Search and print summary without writing files.")
    args = parser.parse_args(argv)

    selected = parse_words_arg(args.words)
    words = load_words(args.manifest, selected)
    if args.source == "huggingface":
        client = HuggingFaceSearchClient(timeout=args.timeout, retries=args.retries)
    elif args.source == "openclipart":
        client = OpenClipartSearchClient(timeout=args.timeout, retries=args.retries)
    else:
        client = AutoSearchClient(timeout=args.timeout, retries=args.retries)

    candidates_by_word: dict[str, list[Candidate]] = {}
    for key, word in words.items():
        print(f"Searching {word.word} ({', '.join(word.queries)})...")
        candidates = collect_candidates(word, client.search, max_per_word=args.max_per_word)
        candidates_by_word[key] = candidates
        print(f"  {len(candidates)} candidates")

    if args.dry_run:
        print(json.dumps({key: [item.title for item in value] for key, value in candidates_by_word.items()}, indent=2))
        return 0

    write_asset_bundle(args.output, args.topic, words, candidates_by_word)
    print(f"Done: {(args.output / args.topic).resolve()}")
    print(f"Review: {(args.output / args.topic / 'review.html').resolve()}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
