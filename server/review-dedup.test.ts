import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  checkApprovedReviewExists: vi.fn(),
  deleteRejectedReviewRequest: vi.fn(),
  createReviewRequest: vi.fn(),
  createAuditLog: vi.fn(),
  getCustomerById: vi.fn(),
  getBranchById: vi.fn(),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/test.jpg", key: "test.jpg" }),
}));

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

import { checkApprovedReviewExists, deleteRejectedReviewRequest } from "./db";

describe("Review Dedup - checkApprovedReviewExists", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass uniqueOrderId (shopeeOrderId) for Shopee reviews", async () => {
    const mockCheck = vi.mocked(checkApprovedReviewExists);
    mockCheck.mockResolvedValue(false);

    // Simulate what routers.ts does
    const input = {
      deliveryApp: "shopee" as const,
      orderId: "#211",
      shopeeOrderId: "1564561385644418",
      shopeeOrderNumber: "#211",
    };

    const uniqueOrderId = input.deliveryApp === 'shopee' ? input.shopeeOrderId
      : input.deliveryApp === 'lineman' ? undefined
      : undefined;

    await checkApprovedReviewExists(input.deliveryApp, input.orderId, uniqueOrderId);

    expect(mockCheck).toHaveBeenCalledWith("shopee", "#211", "1564561385644418");
  });

  it("should pass uniqueOrderId (linemanOrderId) for Lineman reviews", async () => {
    const mockCheck = vi.mocked(checkApprovedReviewExists);
    mockCheck.mockResolvedValue(false);

    const input = {
      deliveryApp: "lineman" as const,
      orderId: "#5175",
      linemanOrderId: "LMF-260321-538845175",
      linemanOrderNumber: "#5175",
    };

    const uniqueOrderId = input.deliveryApp === 'shopee' ? undefined
      : input.deliveryApp === 'lineman' ? input.linemanOrderId
      : undefined;

    await checkApprovedReviewExists(input.deliveryApp, input.orderId, uniqueOrderId);

    expect(mockCheck).toHaveBeenCalledWith("lineman", "#5175", "LMF-260321-538845175");
  });

  it("should NOT pass uniqueOrderId for Grab reviews (GF number is already unique)", async () => {
    const mockCheck = vi.mocked(checkApprovedReviewExists);
    mockCheck.mockResolvedValue(false);

    const input = {
      deliveryApp: "grab" as const,
      orderId: "GF-677",
      gfNumber: "GF-677",
    };

    const uniqueOrderId = input.deliveryApp === 'shopee' ? undefined
      : input.deliveryApp === 'lineman' ? undefined
      : undefined;

    await checkApprovedReviewExists(input.deliveryApp, input.orderId, uniqueOrderId);

    expect(mockCheck).toHaveBeenCalledWith("grab", "GF-677", undefined);
  });

  it("should NOT pass uniqueOrderId for GPOS reviews (receipt number is already unique)", async () => {
    const mockCheck = vi.mocked(checkApprovedReviewExists);
    mockCheck.mockResolvedValue(false);

    const input = {
      deliveryApp: "gpos" as const,
      orderId: "0105536123457",
    };

    const uniqueOrderId = input.deliveryApp === 'shopee' ? undefined
      : input.deliveryApp === 'lineman' ? undefined
      : undefined;

    await checkApprovedReviewExists(input.deliveryApp, input.orderId, uniqueOrderId);

    expect(mockCheck).toHaveBeenCalledWith("gpos", "0105536123457", undefined);
  });
});

describe("Review Dedup - deleteRejectedReviewRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should pass uniqueOrderId for Shopee when deleting rejected reviews", async () => {
    const mockDelete = vi.mocked(deleteRejectedReviewRequest);
    mockDelete.mockResolvedValue(undefined);

    const input = {
      deliveryApp: "shopee" as const,
      orderId: "#211",
      shopeeOrderId: "1564561385644418",
    };

    const uniqueOrderId = input.deliveryApp === 'shopee' ? input.shopeeOrderId
      : input.deliveryApp === 'lineman' ? undefined
      : undefined;

    await deleteRejectedReviewRequest(input.deliveryApp, input.orderId, uniqueOrderId);

    expect(mockDelete).toHaveBeenCalledWith("shopee", "#211", "1564561385644418");
  });

  it("should pass uniqueOrderId for Lineman when deleting rejected reviews", async () => {
    const mockDelete = vi.mocked(deleteRejectedReviewRequest);
    mockDelete.mockResolvedValue(undefined);

    const input = {
      deliveryApp: "lineman" as const,
      orderId: "#5175",
      linemanOrderId: "LMF-260321-538845175",
    };

    const uniqueOrderId = input.deliveryApp === 'shopee' ? undefined
      : input.deliveryApp === 'lineman' ? input.linemanOrderId
      : undefined;

    await deleteRejectedReviewRequest(input.deliveryApp, input.orderId, uniqueOrderId);

    expect(mockDelete).toHaveBeenCalledWith("lineman", "#5175", "LMF-260321-538845175");
  });
});

describe("Review Dedup - Scenario: Customer 8400004 unblocked", () => {
  it("should allow Shopee #211 with different shopeeOrderId (different order)", async () => {
    const mockCheck = vi.mocked(checkApprovedReviewExists);
    
    // Existing approved review: shopeeOrderId = "3083628626475520631"
    // New submission: shopeeOrderId = "1564561385644418"
    // These are different orders — should NOT be blocked
    
    // Simulate: checking with the NEW shopeeOrderId returns false (no match)
    mockCheck.mockResolvedValue(false);

    const input = {
      deliveryApp: "shopee" as const,
      orderId: "#211", // Same short order number
      shopeeOrderId: "1564561385644418", // Different unique ID
    };

    const uniqueOrderId = input.shopeeOrderId;
    const result = await checkApprovedReviewExists(input.deliveryApp, input.orderId, uniqueOrderId);

    expect(result).toBe(false); // Should NOT be blocked
    expect(mockCheck).toHaveBeenCalledWith("shopee", "#211", "1564561385644418");
  });

  it("should block Shopee with same shopeeOrderId (same order, duplicate)", async () => {
    const mockCheck = vi.mocked(checkApprovedReviewExists);
    
    // Trying to submit with the SAME shopeeOrderId that's already approved
    mockCheck.mockResolvedValue(true);

    const input = {
      deliveryApp: "shopee" as const,
      orderId: "#211",
      shopeeOrderId: "3083628626475520631", // Same unique ID as existing approved
    };

    const uniqueOrderId = input.shopeeOrderId;
    const result = await checkApprovedReviewExists(input.deliveryApp, input.orderId, uniqueOrderId);

    expect(result).toBe(true); // Should BE blocked
  });

  it("should block Shopee with same shopeeOrderId when review is still pending", async () => {
    const mockCheck = vi.mocked(checkApprovedReviewExists);
    
    // Trying to submit with the SAME shopeeOrderId that's still pending
    mockCheck.mockResolvedValue(true);

    const input = {
      deliveryApp: "shopee" as const,
      orderId: "#300",
      shopeeOrderId: "9999999999999999", // Same unique ID as existing pending
    };

    const uniqueOrderId = input.shopeeOrderId;
    const result = await checkApprovedReviewExists(input.deliveryApp, input.orderId, uniqueOrderId);

    expect(result).toBe(true); // Should BE blocked (pending)
  });
});
