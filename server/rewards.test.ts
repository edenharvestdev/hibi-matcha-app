import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock storagePut
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "rewards/test.jpg", url: "https://cdn.example.com/rewards/test.jpg" }),
}));

// Mock db functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db") as any;
  return {
    ...actual,
    createReward: vi.fn().mockResolvedValue(1),
    listRewards: vi.fn().mockResolvedValue([
      { id: 1, name: "Matcha Latte", description: "Free matcha latte", pointsCost: 100, category: "drink", imageUrl: "https://cdn.example.com/rewards/test.jpg", stock: 50, isActive: 1 },
      { id: 2, name: "Croissant", description: null, pointsCost: 50, category: "food", imageUrl: null, stock: null, isActive: 1 },
    ]),
    getRewardById: vi.fn().mockResolvedValue({ id: 1, name: "Matcha Latte", description: "Free matcha latte", pointsCost: 100, category: "drink", imageUrl: null, stock: 50, isActive: 1 }),
    updateReward: vi.fn().mockResolvedValue(undefined),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock jose for session verification
vi.mock("jose", () => ({
  jwtVerify: vi.fn().mockResolvedValue({
    payload: {
      type: "staff",
      id: 1,
      phone: "0800000000",
      name: "Admin",
      email: "admin@hibi.com",
      role: "super_admin",
      branchId: null,
      branchName: null,
    },
  }),
  SignJWT: vi.fn().mockReturnValue({
    setProtectedHeader: vi.fn().mockReturnThis(),
    setExpirationTime: vi.fn().mockReturnThis(),
    sign: vi.fn().mockResolvedValue("mock-token"),
  }),
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("hashed"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

// Mock notification
vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

function createSuperAdminContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {
        cookie: "hibi_session=mock-token",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("loyalty.uploadRewardImage", () => {
  it("uploads an image and returns the URL", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Small 1x1 red pixel PNG in base64
    const tinyPngBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==";

    const result = await caller.loyalty.uploadRewardImage({
      imageBase64: tinyPngBase64,
      imageType: "image/png",
    });

    expect(result).toHaveProperty("url");
    expect(typeof result.url).toBe("string");
    expect(result.url).toContain("https://");
  });
});

describe("loyalty.allRewards", () => {
  it("returns all rewards for super admin", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.loyalty.allRewards();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(2);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("pointsCost");
    expect(result[0]).toHaveProperty("imageUrl");
  });
});

describe("loyalty.rewards (public)", () => {
  it("returns active rewards for public access", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.loyalty.rewards();

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("loyalty.createReward", () => {
  it("creates a reward with image URL", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.loyalty.createReward({
      name: "Test Matcha Latte",
      description: "A free matcha latte",
      pointsCost: 150,
      category: "drink",
      imageUrl: "https://cdn.example.com/rewards/test.jpg",
      stock: 20,
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
  });

  it("creates a reward without image URL", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.loyalty.createReward({
      name: "Plain Croissant",
      pointsCost: 50,
      category: "food",
    });

    expect(result).toHaveProperty("id");
  });
});

describe("loyalty.updateReward", () => {
  it("updates a reward with new image URL", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.loyalty.updateReward({
      id: 1,
      name: "Updated Matcha Latte",
      imageUrl: "https://cdn.example.com/rewards/new-image.jpg",
    });

    expect(result).toHaveProperty("success", true);
  });
});
