import assert from "node:assert/strict";

import {
  includeHeaderForDocument,
  shouldShowSchoolHeader,
} from "../src/lib/document-generation.ts";

assert.equal(shouldShowSchoolHeader("LESSON_PLAN"), false);
assert.equal(shouldShowSchoolHeader("EXAM"), true);
assert.equal(includeHeaderForDocument("LESSON_PLAN", true), false);
assert.equal(includeHeaderForDocument("EXAM", true), true);
assert.equal(includeHeaderForDocument("EXAM", false), false);
