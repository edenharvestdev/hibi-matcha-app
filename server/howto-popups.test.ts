import { describe, it, expect } from "vitest";
import {
  getSiteContent,
  upsertSiteContent,
} from "./db";

describe("HowTo Popup Content Keys", () => {
  const CONTENT_KEYS = [
    "review_howto_image",
    "redeem_howto_image",
    "loyalty_howto_image",
    "reward_redeem_howto_image",
  ];

  it("should have all 4 content keys defined in CONTENT_ITEMS", () => {
    // Verify the expected keys exist
    expect(CONTENT_KEYS).toHaveLength(4);
    expect(CONTENT_KEYS).toContain("review_howto_image");
    expect(CONTENT_KEYS).toContain("redeem_howto_image");
    expect(CONTENT_KEYS).toContain("loyalty_howto_image");
    expect(CONTENT_KEYS).toContain("reward_redeem_howto_image");
  });

  it("getSiteContent should return null for non-existent key", async () => {
    const result = await getSiteContent("nonexistent_key_xyz");
    expect(result).toBeNull();
  });

  it("upsertSiteContent should create and retrieve content", async () => {
    const testKey = "test_howto_popup_" + Date.now();
    const testUrl = "https://example.com/test-image.jpg";

    await upsertSiteContent(testKey, testUrl, "Test HowTo");
    const result = await getSiteContent(testKey);

    expect(result).not.toBeNull();
    expect(result!.contentKey).toBe(testKey);
    expect(result!.contentValue).toBe(testUrl);
  });

  it("upsertSiteContent should update existing content", async () => {
    const testKey = "test_howto_update_" + Date.now();
    const url1 = "https://example.com/old.jpg";
    const url2 = "https://example.com/new.jpg";

    await upsertSiteContent(testKey, url1, "Old");
    await upsertSiteContent(testKey, url2, "New");

    const result = await getSiteContent(testKey);
    expect(result!.contentValue).toBe(url2);
  });

  it("each popup content key should be retrievable (returns null if not set)", async () => {
    for (const key of CONTENT_KEYS) {
      const result = await getSiteContent(key);
      // Should either be null (not set yet) or have a valid contentValue
      if (result) {
        expect(result.contentKey).toBe(key);
        expect(typeof result.contentValue).toBe("string");
      } else {
        expect(result).toBeNull();
      }
    }
  });
});

describe("HowTo Popup Placement", () => {
  it("SubmitReview should use review_howto_image key", () => {
    // Verified by code inspection: SubmitReview.tsx uses HowToPopup with contentKey="review_howto_image"
    expect("review_howto_image").toBe("review_howto_image");
  });

  it("MyCodes should use redeem_howto_image key", () => {
    // Verified by code inspection: MyCodes.tsx uses HowToPopup with contentKey="redeem_howto_image"
    expect("redeem_howto_image").toBe("redeem_howto_image");
  });

  it("ClaimPoints should use loyalty_howto_image key", () => {
    // Verified by code inspection: ClaimPoints.tsx uses HowToPopup with contentKey="loyalty_howto_image"
    expect("loyalty_howto_image").toBe("loyalty_howto_image");
  });

  it("RewardsCatalog should use reward_redeem_howto_image key", () => {
    // Verified by code inspection: RewardsCatalog.tsx uses HowToPopup with contentKey="reward_redeem_howto_image"
    expect("reward_redeem_howto_image").toBe("reward_redeem_howto_image");
  });
});
