import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


SCRIPT = Path(__file__).resolve().parents[1] / "extract_literacy_assets.py"
spec = importlib.util.spec_from_file_location("extract_literacy_assets", SCRIPT)
extractor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(extractor)


def row(idx, title, tags, svg="<svg viewBox='0 0 10 10'><path d='M1 1h8v8z'/></svg>", page_url=None):
    return {
        "row_idx": idx,
        "row": {
            "title": title,
            "description": title,
            "artist_name": "artist",
            "page_url": page_url or f"https://openclipart.org/detail/{idx}",
            "tags": tags,
            "license": "CC0",
            "image_urls": {"svg": f"https://openclipart.org/download/{idx}/asset.svg"},
            "thumbnail_url": f"https://openclipart.org/image/400px/{idx}",
            "svg_content": svg,
        },
    }


class ExtractLiteracyAssetsTest(unittest.TestCase):

    def test_scores_exact_tag_and_outline_candidates_higher(self):
        word = extractor.AssetWord(
            key="vaca",
            word="VACA",
            syllables=["VA", "CA"],
            queries=["cow"],
            tags=["farm", "animal"],
        )

        outline = extractor.Candidate.from_hf_row(row(1, "Cow outline", ["cow", "farm", "animal", "outline"]))
        generic = extractor.Candidate.from_hf_row(row(2, "Cowboy hat", ["cowboy", "hat"]))

        self.assertGreater(
            extractor.score_candidate(outline, word, "cow"),
            extractor.score_candidate(generic, word, "cow"),
        )

    def test_collect_candidates_deduplicates_and_respects_limit(self):
        word = extractor.AssetWord(
            key="pato",
            word="PATO",
            syllables=["PA", "TO"],
            queries=["duck", "duck outline"],
            tags=["farm", "animal"],
        )

        def fake_search(query, limit):
            if query == "duck":
                return [row(10, "Duck", ["duck", "animal"]), row(11, "Duck outline", ["duck", "outline"])]
            return [row(11, "Duck outline", ["duck", "outline"]), row(12, "Rubber duck", ["duck", "toy"])]

        candidates = extractor.collect_candidates(word, fake_search, max_per_word=2)

        self.assertEqual([candidate.source_id for candidate in candidates], ["11", "10"])

    def test_write_assets_creates_svg_metadata_and_review_page(self):
        word = extractor.AssetWord(
            key="galo",
            word="GALO",
            syllables=["GA", "LO"],
            queries=["rooster"],
            tags=["farm", "animal"],
        )
        candidates = [
            extractor.Candidate.from_hf_row(row(20, "Rooster outline", ["rooster", "outline"]))
        ]

        with tempfile.TemporaryDirectory() as tmp:
            output = Path(tmp)
            extractor.write_asset_bundle(output, "animais_fazenda", {word.key: word}, {word.key: candidates})

            svg_files = list((output / "animais_fazenda" / "candidates" / "galo").glob("*.svg"))
            self.assertEqual(len(svg_files), 1)

            metadata = json.loads((output / "animais_fazenda" / "metadata.json").read_text(encoding="utf-8"))
            self.assertEqual(metadata["topic"], "animais_fazenda")
            self.assertEqual(metadata["words"]["galo"]["word"], "GALO")
            self.assertEqual(metadata["words"]["galo"]["candidates"][0]["license"], "CC0")

            review = (output / "animais_fazenda" / "review.html").read_text(encoding="utf-8")
            self.assertIn("Rooster outline", review)
            self.assertIn("candidates/galo/", review)

    def test_parse_openclipart_search_results_builds_candidate_payloads(self):
        search_html = """
        <div class="artwork">
          <a href="/detail/10211/cow-outline">
            <img src="/image/800px/10211" alt="Cow Outline" />
          </a>
        </div>
        """

        results = extractor.parse_openclipart_search_results(
            search_html,
            query="cow outline",
            svg_loader=lambda url: "<svg viewBox='0 0 10 10'><path d='M1 1h8v8z'/></svg>",
        )

        self.assertEqual(results[0]["row_idx"], "10211")
        self.assertEqual(results[0]["row"]["title"], "Cow Outline")
        self.assertEqual(results[0]["row"]["license"], "CC0")
        self.assertEqual(results[0]["row"]["image_urls"]["svg"], "https://openclipart.org/download/10211")
        self.assertEqual(results[0]["row"]["thumbnail_url"], "https://openclipart.org/image/800px/10211")

    def test_parse_openclipart_search_results_prefers_outline_before_decorative_assets(self):
        search_html = """
        <div class="artwork"><a href="/detail/319690/pink-neon-angel-cow"><img src="/image/800px/319690" alt="Pink Neon Angel Cow" /></a></div>
        <div class="artwork"><a href="/detail/10211/cow-outline"><img src="/image/800px/10211" alt="Cow Outline" /></a></div>
        """

        loaded = []
        results = extractor.parse_openclipart_search_results(
            search_html,
            query="cow",
            svg_loader=lambda url: loaded.append(url) or "<svg viewBox='0 0 10 10'><path d='M1 1h8v8z'/></svg>",
            limit=1,
        )

        self.assertEqual(results[0]["row_idx"], "10211")
        self.assertEqual(loaded, ["https://openclipart.org/download/10211"])

    def test_parse_openclipart_search_results_rejects_outline_without_primary_term(self):
        search_html = """
        <div class="artwork"><a href="/detail/1/scooter-outline"><img src="/image/800px/1" alt="scooter outline" /></a></div>
        <div class="artwork"><a href="/detail/2/duck-outline"><img src="/image/800px/2" alt="Duck Outline" /></a></div>
        """

        results = extractor.parse_openclipart_search_results(
            search_html,
            query="duck outline",
            svg_loader=lambda url: "<svg viewBox='0 0 10 10'><path d='M1 1h8v8z'/></svg>",
            limit=2,
        )

        self.assertEqual([result["row_idx"] for result in results], ["2"])


if __name__ == "__main__":
    unittest.main()
