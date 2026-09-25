export const MT27_INDEX_SCOPE = [
  "/en/products/mt-2-7-ion-membrane-electrolyzer/", "/en/services/electrolyzer-cell-repair/",
  "/es/products/mt-2-7-ion-membrane-electrolyzer/", "/es/services/electrolyzer-cell-repair/",
  "/pt/products/mt-2-7-ion-membrane-electrolyzer/", "/pt/services/electrolyzer-cell-repair/",
  "/fr/products/mt-2-7-ion-membrane-electrolyzer/", "/fr/services/electrolyzer-cell-repair/",
  "/ru/products/mt-2-7-ion-membrane-electrolyzer/", "/ru/services/electrolyzer-cell-repair/",
  "/ar/products/mt-2-7-ion-membrane-electrolyzer/", "/ar/services/electrolyzer-cell-repair/"
].sort();

const AI_REVIEW_DIMENSIONS = ["technical-claims", "sales-scope-and-conditions", "locale-and-brand-safety"];

export function validMt27BaselineWaiver(policy) {
  return (policy?.gscGate?.scopedWaivers || []).some((waiver) =>
    waiver.id === "mt27-product-and-repair-indexing-2026-09-24"
    && waiver.authorizedByRole === "site-owner"
    && waiver.authorizedAt === "2026-09-24"
    && waiver.baselineWaived === true
    && waiver.baselineStatusRemains === "awaiting-16-month-export"
    && JSON.stringify([...(waiver.scope || [])].sort()) === JSON.stringify(MT27_INDEX_SCOPE)
  );
}

export function validMt27ReleaseAuthorization(policy, review) {
  const authorization = policy?.scopedPublication;
  const authorizedScope = [...(authorization?.scope || [])].sort();
  const reviewedScope = [...(review?.scope || [])].sort();
  return authorization?.id === "mt27-product-and-repair-2026-09-24"
    && authorization?.authorizedByRole === "site-owner"
    && authorization?.authorizedAt === "2026-09-24"
    && authorization?.publishAuthorized === true
    && JSON.stringify(authorizedScope) === JSON.stringify(MT27_INDEX_SCOPE)
    && review?.status === "ai-review-complete"
    && review?.reviewType === "AI adversarial review; not human native-language or legal approval"
    && review?.rounds === 3
    && AI_REVIEW_DIMENSIONS.every((dimension) => review?.dimensions?.includes(dimension))
    && JSON.stringify(reviewedScope) === JSON.stringify(MT27_INDEX_SCOPE);
}

export function isMt27Page(path) {
  return MT27_INDEX_SCOPE.includes(path);
}

export function isMt27PublicationEligible(path, policy, review) {
  if (!isMt27Page(path) || !validMt27ReleaseAuthorization(policy, review)) return false;
  if (path.startsWith("/ar/")) {
    return review?.arabicRtlVisualReview?.status === "passed"
      && typeof review?.arabicRtlVisualReview?.evidence === "string"
      && review.arabicRtlVisualReview.evidence.trim().length > 0;
  }
  return true;
}

export function validMt27ScopedProductionPublication(policy, review) {
  return validMt27BaselineWaiver(policy)
    && validMt27ReleaseAuthorization(policy, review)
    && MT27_INDEX_SCOPE.every((path) => isMt27PublicationEligible(path, policy, review));
}
