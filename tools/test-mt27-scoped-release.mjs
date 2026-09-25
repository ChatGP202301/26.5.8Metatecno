#!/usr/bin/env node
import assert from "node:assert/strict";
import { MT27_INDEX_SCOPE, isMt27PublicationEligible, validMt27ReleaseAuthorization, validMt27ScopedProductionPublication } from "./mt27-scoped-release.mjs";
import { readFile } from "node:fs/promises";

const policy = JSON.parse(await readFile(new URL("../site-policy.json", import.meta.url), "utf8"));
const review = JSON.parse(await readFile(new URL("../seo/mt27-release-review.json", import.meta.url), "utf8"));
assert.equal(validMt27ReleaseAuthorization(policy, review), true, "the user-authorized batch and AI review must exactly match");
assert.equal(MT27_INDEX_SCOPE.length, 12);
assert.equal(MT27_INDEX_SCOPE.filter((path) => isMt27PublicationEligible(path, policy, review)).length, 12);
assert.equal(MT27_INDEX_SCOPE.filter((path) => path.startsWith("/ar/") && isMt27PublicationEligible(path, policy, review)).length, 2, "both Arabic pages require and now have recorded RTL browser evidence");
assert.equal(isMt27PublicationEligible("/en/trust/", policy, review), false, "the scoped exception must not reach any other page");
assert.equal(validMt27ScopedProductionPublication(policy, review), true, "scoped production eligibility requires all 12 pages and recorded RTL evidence");

const alteredScope = structuredClone(policy);
alteredScope.scopedPublication.scope.push("/en/trust/");
assert.equal(validMt27ReleaseAuthorization(alteredScope, review), false, "an expanded scope must fail closed");
const pretendHumanReview = structuredClone(review);
pretendHumanReview.reviewType = "native human review";
assert.equal(validMt27ReleaseAuthorization(policy, pretendHumanReview), false, "AI review must not be represented as human native review");
console.log("mt27_scoped_release_tests_passed scenarios=8 eligible=12 held_arabic=0");
