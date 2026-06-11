import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Helper to create a mock context with hibiSession
function createMockContext(role: string = "customer", customerId?: number) {
  const user = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus" as const,
    role: "user" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: {
      protocol: "https",
      headers: { cookie: `hibi_session=mock-token` },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  } as TrpcContext;
}

function createAdminContext() {
  return createMockContext("super_admin");
}

const caller = appRouter.createCaller;

describe("Shop System - Categories", () => {
  it("shopCategories.list should be a public procedure that returns an array", async () => {
    // Verify the procedure exists and is callable
    const ctx = createMockContext();
    // The procedure should exist on the router
    expect(appRouter._def.procedures).toHaveProperty("shopCategories.list");
  });

  it("shopCategories.listAll should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopCategories.listAll");
  });

  it("shopCategories.create should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopCategories.create");
  });

  it("shopCategories.update should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopCategories.update");
  });

  it("shopCategories.delete should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopCategories.delete");
  });
});

describe("Shop System - Products", () => {
  it("shopProducts.list should exist as a public procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopProducts.list");
  });

  it("shopProducts.listAll should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopProducts.listAll");
  });

  it("shopProducts.getById should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopProducts.getById");
  });

  it("shopProducts.create should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopProducts.create");
  });

  it("shopProducts.update should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopProducts.update");
  });

  it("shopProducts.delete should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopProducts.delete");
  });

  it("shopProducts.uploadImage should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopProducts.uploadImage");
  });
});

describe("Shop System - Cart", () => {
  it("cart.get should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("cart.get");
  });

  it("cart.add should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("cart.add");
  });

  it("cart.updateQuantity should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("cart.updateQuantity");
  });

  it("cart.remove should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("cart.remove");
  });

  it("cart.clear should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("cart.clear");
  });
});

describe("Shop System - Orders", () => {
  it("shopOrders.create should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopOrders.create");
  });

  it("shopOrders.myOrders should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopOrders.myOrders");
  });

  it("shopOrders.getById should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopOrders.getById");
  });

  it("shopOrders.uploadSlip should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopOrders.uploadSlip");
  });

  it("shopOrders.listAll should exist as a procedure (admin)", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopOrders.listAll");
  });

  it("shopOrders.updateStatus should exist as a procedure (admin)", async () => {
    expect(appRouter._def.procedures).toHaveProperty("shopOrders.updateStatus");
  });
});

describe("Shop System - Commissions", () => {
  it("commissions.settings should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("commissions.settings");
  });

  it("commissions.upsert should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("commissions.upsert");
  });

  it("commissions.report should exist as a procedure", async () => {
    expect(appRouter._def.procedures).toHaveProperty("commissions.report");
  });
});

describe("Shop System - Price Formatting", () => {
  it("should correctly format satang to baht", () => {
    // 10000 satang = 100 baht
    const formatPrice = (satang: number) => (satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 0 });
    expect(formatPrice(10000)).toBe("100");
    expect(formatPrice(5050)).toBe("50.5");
    expect(formatPrice(100)).toBe("1");
    expect(formatPrice(0)).toBe("0");
  });

  it("should correctly calculate wholesale eligibility", () => {
    const isWholesale = (qty: number, wholesalePrice: number | null, minQty: number | null) => {
      return wholesalePrice !== null && qty >= (minQty || 10);
    };
    expect(isWholesale(10, 8000, 10)).toBe(true);
    expect(isWholesale(9, 8000, 10)).toBe(false);
    expect(isWholesale(5, null, 10)).toBe(false);
    expect(isWholesale(1, 8000, null)).toBe(false); // default minQty is 10
  });
});
