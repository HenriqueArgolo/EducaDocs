import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  getActivityImagePath,
  isGeneratedActivityImage,
  toActivityImageUrl,
} from "../src/lib/activity-images.ts";

assert.equal(
  getActivityImagePath({ imagemUrl: "/images/generated/7", imageUrl: "https://fallback.test/image.png" }),
  "/images/generated/7",
);
assert.equal(getActivityImagePath({ imageUrl: "/images/generated/8" }), "/images/generated/8");
assert.equal(getActivityImagePath({ figura: "vaca" }), null);

assert.equal(
  toActivityImageUrl("/images/generated/7", "http://localhost:8080"),
  "http://localhost:8080/images/generated/7",
);
assert.equal(
  toActivityImageUrl("https://cdn.test/cow.png", "http://localhost:8080"),
  "https://cdn.test/cow.png",
);
assert.equal(isGeneratedActivityImage("/images/generated/7"), true);
assert.equal(isGeneratedActivityImage("https://cdn.test/cow.png"), false);

const viewerSource = readFileSync(
  new URL("../src/app/dashboard/library/[id]/page.tsx", import.meta.url),
  "utf8",
);
assert.match(viewerSource, /getActivityImagePath\(item\)/);
assert.match(viewerSource, /isGeneratedActivityImage\(getActivityImagePath\(page\)\)/);
assert.match(viewerSource, /early-literacy-print/);
assert.match(viewerSource, /overflow-hidden print:overflow-visible/);

const globalStyles = readFileSync(
  new URL("../src/app/globals.css", import.meta.url),
  "utf8",
);
assert.match(globalStyles, /\.early-literacy-print\s*\{[^}]*zoom:\s*0\.78/s);
assert.match(globalStyles, /\.early-literacy-print\s*\{[^}]*width:\s*100%/s);

const generatorSource = readFileSync(
  new URL("../src/app/dashboard/library/page.tsx", import.meta.url),
  "utf8",
);
assert.match(generatorSource, /Criando atividade e imagens/);
