import { describe, it, expect } from "vitest";

/**
 * GF Number Format Validation Tests
 *
 * Background: customer 4050002 submitted GF-1190 (typo for GF-119) twice in
 * 2 days, slipping past frontend with no validation. Investigation report
 * (docs/investigation-gf-orderid-anomaly.md) confirmed Grab uses 1-3 digit
 * GF numbers (1-999, recycled). Some Grab orders may have a single trailing
 * letter suffix (T, F) — accepted as valid.
 *
 * Same regex is used in:
 *   - client/src/pages/customer/SubmitReview.tsx
 *   - client/src/pages/customer/ClaimPoints.tsx
 *   - server/routers.ts (reviews.submit + loyalty.submitClaim)
 */

const GF_NUMBER_REGEX = /^GF-\d{1,3}[A-Z]?$/;

describe("Grab GF Number format validation", () => {
  describe("accepts canonical formats", () => {
    it.each([
      ["GF-1"],
      ["GF-7"],
      ["GF-119"],
      ["GF-383"],
      ["GF-677"],
      ["GF-998"],
      ["GF-999"],
    ])("accepts %s (1-3 digits)", (gf) => {
      expect(GF_NUMBER_REGEX.test(gf)).toBe(true);
    });

    it.each([
      ["GF-816T"],
      ["GF-129F"],
      ["GF-487T"],
      ["GF-977T"],
    ])("accepts %s (single uppercase letter suffix)", (gf) => {
      expect(GF_NUMBER_REGEX.test(gf)).toBe(true);
    });
  });

  describe("rejects malformed inputs (the actual bug we fixed)", () => {
    it("rejects GF-1190 (4 digits — typo for GF-119)", () => {
      expect(GF_NUMBER_REGEX.test("GF-1190")).toBe(false);
    });

    it("rejects GF-3831 (4 digits — typo for GF-383)", () => {
      expect(GF_NUMBER_REGEX.test("GF-3831")).toBe(false);
    });

    it.each([
      ["GF-10000"],
      ["GF-12345"],
    ])("rejects %s (5+ digits)", (gf) => {
      expect(GF_NUMBER_REGEX.test(gf)).toBe(false);
    });
  });

  describe("rejects structurally wrong formats", () => {
    it.each([
      [""],
      ["GF"],
      ["GF-"],
      ["677"],
      ["gf-677"],          // lowercase prefix — frontend uppercases first
      ["GF 677"],          // space instead of dash
      ["GF-677-"],         // trailing dash
      ["GF--677"],         // double dash
      ["GF-ABC"],          // letters instead of digits
      ["GF-67A7"],         // letter inside digits
      ["GF-677TT"],        // multiple letters
      ["GF-677t"],         // lowercase letter
      ["XGF-677"],         // extra prefix
      ["GF-677 "],         // trailing space (caller should trim first)
      [" GF-677"],         // leading space
    ])("rejects %j", (gf) => {
      expect(GF_NUMBER_REGEX.test(gf)).toBe(false);
    });
  });

  describe("test data record (informational — not enforced)", () => {
    it("rejects GF-TEST-001 (legacy test data)", () => {
      expect(GF_NUMBER_REGEX.test("GF-TEST-001")).toBe(false);
    });
  });
});
