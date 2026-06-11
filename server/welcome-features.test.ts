import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", async () => {
  const actual = await vi.importActual("./db") as any;
  return {
    ...actual,
    createOrderIssue: vi.fn().mockResolvedValue(1),
    listOrderIssuesByCustomer: vi.fn().mockResolvedValue([
      { id: 1, customerId: 1, branchId: 1, deliveryApp: "shopee", orderId: "2966366660490752985", category: "wrong_order", description: "ได้เมนูผิดจากที่สั่ง", status: "open", slaResponseDeadline: new Date(Date.now() + 86400000), slaResolutionDeadline: new Date(Date.now() + 172800000), createdAt: new Date() },
    ]),
    listOrderIssues: vi.fn().mockResolvedValue([
      { issue: { id: 1, customerId: 1, branchId: 1, deliveryApp: "shopee", orderId: "2966366660490752985", category: "wrong_order", description: "ได้เมนูผิดจากที่สั่ง", status: "open", slaResponseDeadline: new Date(Date.now() + 86400000), slaResolutionDeadline: new Date(Date.now() + 172800000), createdAt: new Date() }, customerName: "ลูกค้าทดสอบ", customerPhone: "0812345678" },
    ]),
    getOrderIssueById: vi.fn().mockResolvedValue({
      id: 1, customerId: 1, branchId: 1, deliveryApp: "shopee", orderId: "2966366660490752985", category: "wrong_order", description: "ได้เมนูผิดจากที่สั่ง", status: "open", slaResponseDeadline: new Date(Date.now() + 86400000), slaResolutionDeadline: new Date(Date.now() + 172800000), createdAt: new Date(),
    }),
    updateOrderIssue: vi.fn().mockResolvedValue(undefined),
    getOverdueSlaIssues: vi.fn().mockResolvedValue([]),
    createContactInquiry: vi.fn().mockResolvedValue(1),
    listContactInquiries: vi.fn().mockResolvedValue([
      { id: 1, type: "franchise", name: "สมชาย", phone: "0812345678", email: "test@example.com", company: "บริษัท ทดสอบ", message: "สนใจซื้อแฟรนไชส์ Hibi Matcha", budget: "500,000-1,000,000", province: "กรุงเทพ", status: "new", createdAt: new Date() },
    ]),
    getContactInquiryById: vi.fn().mockResolvedValue({
      id: 1, type: "franchise", name: "สมชาย", phone: "0812345678", email: "test@example.com", company: "บริษัท ทดสอบ", message: "สนใจซื้อแฟรนไชส์ Hibi Matcha", budget: "500,000-1,000,000", province: "กรุงเทพ", status: "new", createdAt: new Date(),
    }),
    updateContactInquiry: vi.fn().mockResolvedValue(undefined),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
    addOrderIssueImages: vi.fn().mockResolvedValue(undefined),
    listBranches: vi.fn().mockResolvedValue([
      { id: 1, name: "สาขาสยาม", address: "สยามสแควร์", phone: "021234567", isActive: 1 },
    ]),
    // Free Drink Campaign mocks
    createFreeDrinkCampaign: vi.fn().mockResolvedValue(1),
    listFreeDrinkCampaigns: vi.fn().mockResolvedValue([
      { id: 1, name: "แคมเปญรีวิว มี.ค.", description: "รีวิวรับแก้วฟรี", menuOptions: JSON.stringify([{code:"ML",name:"Matcha Latte",sizes:[{code:"L",name:"L"}],milkOptions:[{code:"OAT",name:"นมโอ๊ต"}]}]), maxCodesPerCustomer: 2, validFrom: new Date(), validUntil: new Date(Date.now() + 30*86400000), isActive: 1, createdAt: new Date() },
    ]),
    getFreeDrinkCampaignById: vi.fn().mockResolvedValue({
      id: 1, name: "แคมเปญรีวิว มี.ค.", description: "รีวิวรับแก้วฟรี", menuOptions: [{code:"ML",name:"Matcha Latte",sizes:[{code:"L",name:"L"}],milkOptions:[{code:"OAT",name:"นมโอ๊ต"}]}], maxCodesPerCustomer: 2, validFrom: new Date(), validUntil: new Date(Date.now() + 30*86400000), isActive: 1, createdAt: new Date(),
    }),
    updateFreeDrinkCampaign: vi.fn().mockResolvedValue(undefined),
    createFreeDrinkCode: vi.fn().mockResolvedValue(1),
    getFreeDrinkCodeByCode: vi.fn().mockResolvedValue({
      id: 1, campaignId: 1, customerId: 1, code: "HIBI-ML-L-OAT-A7K2", menuCode: "ML", menuName: "Matcha Latte", sizeCode: "L", sizeName: "L", milkCode: "OAT", milkName: "นมโอ๊ต", status: "issued", expiresAt: new Date(Date.now() + 30*86400000), createdAt: new Date(),
    }),
    listFreeDrinkCodesByCustomer: vi.fn().mockResolvedValue([
      { id: 1, campaignId: 1, customerId: 1, code: "HIBI-ML-L-OAT-A7K2", menuCode: "ML", menuName: "Matcha Latte", sizeCode: "L", sizeName: "L", milkCode: "OAT", milkName: "นมโอ๊ต", status: "issued", expiresAt: new Date(Date.now() + 30*86400000), createdAt: new Date() },
    ]),
    countCustomerCodesInCampaign: vi.fn().mockResolvedValue(0),
    updateFreeDrinkCode: vi.fn().mockResolvedValue(undefined),
    // Branch Loyalty mocks
    getBranchLoyaltyPoints: vi.fn().mockResolvedValue({ id: 1, customerId: 1, branchId: 1, totalPoints: 100, usedPoints: 20 }),
    upsertBranchLoyaltyPoints: vi.fn().mockResolvedValue(undefined),
    listCustomerBranchPoints: vi.fn().mockResolvedValue([
      { branchId: 1, branchName: "สาขาสยาม", totalPoints: 100, usedPoints: 20 },
    ]),
    listBranchLoyaltyByCustomer: vi.fn().mockResolvedValue([
      { id: 1, customerId: 1, branchId: 1, totalPoints: 100, usedPoints: 20 },
    ]),
    // Consent mocks
    getCustomerConsent: vi.fn().mockResolvedValue(null),
    upsertCustomerConsent: vi.fn().mockResolvedValue(undefined),
    hasAcceptedConsent: vi.fn().mockResolvedValue(false),
    createCustomerConsent: vi.fn().mockResolvedValue(1),
    getCustomerConsents: vi.fn().mockResolvedValue([]),
    checkBookingIdApproved: vi.fn().mockResolvedValue(false),
    checkBookingIdPending: vi.fn().mockResolvedValue(false),
    checkShopeeOrderIdApproved: vi.fn().mockResolvedValue(false),
    checkShopeeOrderIdPending: vi.fn().mockResolvedValue(false),
    checkLinemanOrderIdApproved: vi.fn().mockResolvedValue(false),
    checkLinemanOrderIdPending: vi.fn().mockResolvedValue(false),
    getStaffByEmployeeCode: vi.fn().mockResolvedValue(undefined),
    getIssueStats: vi.fn().mockResolvedValue({
      byCategory: [{ category: "wrong_order", count: 5 }, { category: "quality", count: 3 }],
      byBranch: [{ branchId: 1, branchName: "สาขาสยาม", count: 8 }],
      byStatus: [{ status: "open", count: 2 }, { status: "resolved", count: 6 }],
      sla: { totalResponse: 8, metResponse: 7, totalResolution: 6, metResolution: 5 },
      total: 8,
      recentTrend: [
        { date: "2026-02-13", count: 1 }, { date: "2026-02-14", count: 0 },
        { date: "2026-02-15", count: 2 }, { date: "2026-02-16", count: 1 },
        { date: "2026-02-17", count: 0 }, { date: "2026-02-18", count: 3 },
        { date: "2026-02-19", count: 1 },
      ],
    }),
    // Announcement mocks
    listAnnouncements: vi.fn().mockResolvedValue([
      { id: 1, title: "โปรวันเกิด!", content: "ลด 20% ทุกเมนู", type: "promotion", targetGroup: "all", imageUrl: null, promoCode: "MATCHA20", discountText: "ลด 20%", startDate: new Date(), endDate: null, isActive: 1, isPinned: 0, createdAt: new Date(), updatedAt: new Date() },
    ]),
    createAnnouncement: vi.fn().mockResolvedValue(1),
    updateAnnouncement: vi.fn().mockResolvedValue(undefined),
    deleteAnnouncement: vi.fn().mockResolvedValue(undefined),
    getAnnouncementById: vi.fn().mockResolvedValue({ id: 1, title: "โปรวันเกิด!", content: "ลด 20%", type: "promotion", targetGroup: "all", imageUrl: null, promoCode: "MATCHA20", discountText: "ลด 20%", startDate: new Date(), endDate: null, isActive: 1, isPinned: 0, createdAt: new Date(), updatedAt: new Date() }),
    // Delete reward mock
    getRewardById: vi.fn().mockResolvedValue({ id: 1, name: "Matcha Latte", description: "Free matcha latte", pointsCost: 100, category: "drink", imageUrl: null, stock: 50, isActive: 1 }),
    deleteReward: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock jose for session verification
vi.mock("jose", () => ({
  jwtVerify: vi.fn().mockImplementation(async (token: string) => {
    if (token === "customer-token") {
      return {
        payload: {
          type: "customer",
          id: 1,
          phone: "0812345678",
          name: "ลูกค้าทดสอบ",
          email: null,
          role: "customer",
          branchId: null,
          branchName: null,
        },
      };
    }
    // Default: super admin
    return {
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
    };
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

// Mock storagePut
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ key: "test", url: "https://cdn.example.com/test" }),
}));

function createCustomerContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {
        cookie: "hibi_session=customer-token",
      },
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
      cookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

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

// ── Order ID Validation Tests ──
describe("Order ID Validation", () => {
  it("accepts valid Shopee order ID (13-19 digits)", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.submit({
      branchId: 1,
      deliveryApp: "shopee",
      orderId: "2966366660490752985",
      category: "wrong_order",
      description: "ได้เมนูผิดจากที่สั่ง ต้องการ matcha latte แต่ได้ green tea",
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
  });

  it("rejects invalid Shopee order ID (too short)", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orderIssues.submit({
        branchId: 1,
        deliveryApp: "shopee",
        orderId: "12345",
        category: "wrong_order",
        description: "ได้เมนูผิดจากที่สั่ง ต้องการ matcha latte แต่ได้ green tea",
      })
    ).rejects.toThrow();
  });

  it("rejects Shopee order ID with letters", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orderIssues.submit({
        branchId: 1,
        deliveryApp: "shopee",
        orderId: "ABC123DEF456789",
        category: "wrong_order",
        description: "ได้เมนูผิดจากที่สั่ง ต้องการ matcha latte แต่ได้ green tea",
      })
    ).rejects.toThrow();
  });

  it("accepts valid Grab order ID (A-XXXXXXXXX)", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.submit({
      branchId: 1,
      deliveryApp: "grab",
      orderId: "A-9WERMBQGW4SJAV",
      category: "missing_item",
      description: "ของขาดไม่ครบตามที่สั่ง ขาดไป 1 แก้ว matcha latte",
    });

    expect(result).toHaveProperty("id");
  });

  it("rejects Grab order ID without A- prefix", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orderIssues.submit({
        branchId: 1,
        deliveryApp: "grab",
        orderId: "9WERMBQGW4SJAV",
        category: "missing_item",
        description: "ของขาดไม่ครบตามที่สั่ง ขาดไป 1 แก้ว matcha latte",
      })
    ).rejects.toThrow();
  });

  it("accepts valid LINE MAN order ID (LMF-YYMMDD-XXXXXXXXX)", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.submit({
      branchId: 1,
      deliveryApp: "lineman",
      orderId: "LMF-260218-234745909",
      category: "quality",
      description: "เครื่องดื่มมีรสชาติผิดปกติ ไม่เหมือนที่เคยสั่ง",
    });

    expect(result).toHaveProperty("id");
  });

  it("rejects invalid LINE MAN order ID format", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orderIssues.submit({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "LM-12345",
        category: "quality",
        description: "เครื่องดื่มมีรสชาติผิดปกติ ไม่เหมือนที่เคยสั่ง",
      })
    ).rejects.toThrow();
  });

  it("accepts valid GPOS receipt number (13 digits)", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.submit({
      branchId: 1,
      deliveryApp: "gpos",
      orderId: "0105536123457",
      category: "wrong_order",
      description: "ออเดอร์หน้าร้านได้เมนูผิด สั่ง matcha latte แต่ได้ green tea",
    });

    expect(result).toHaveProperty("id");
  });

  it("rejects GPOS receipt number that is not 13 digits", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orderIssues.submit({
        branchId: 1,
        deliveryApp: "gpos",
        orderId: "12345",
        category: "wrong_order",
        description: "ออเดอร์หน้าร้านได้เมนูผิด สั่ง matcha latte แต่ได้ green tea",
      })
    ).rejects.toThrow();
  });

  it("rejects GPOS receipt number with letters", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orderIssues.submit({
        branchId: 1,
        deliveryApp: "gpos",
        orderId: "010553612ABC7",
        category: "wrong_order",
        description: "ออเดอร์หน้าร้านได้เมนูผิด สั่ง matcha latte แต่ได้ green tea",
      })
    ).rejects.toThrow();
  });

  it("allows walk-in without order ID", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.submit({
      branchId: 1,
      deliveryApp: "walk_in",
      category: "other",
      description: "ปัญหาเกี่ยวกับการบริการหน้าร้าน ต้องการแจ้งให้ทราบ",
    });

    expect(result).toHaveProperty("id");
  });
});

// ── Order Issues CRUD Tests ──
describe("orderIssues.myIssues", () => {
  it("returns customer's own issues", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.myIssues();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("category");
    expect(result[0]).toHaveProperty("status");
  });
});

describe("orderIssues.list (admin)", () => {
  it("returns all issues for super admin", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.list();

    expect(Array.isArray(result)).toBe(true);
  });

  it("filters by status", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.list({ status: "open" });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("orderIssues.acknowledge", () => {
  it("acknowledges an issue", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.acknowledge({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("orderIssues.resolve", () => {
  it("resolves an issue with resolution text", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.resolve({
      id: 1,
      resolution: "ส่งออเดอร์ใหม่ให้ลูกค้าเรียบร้อย",
    });

    expect(result).toEqual({ success: true });
  });

  it("rejects resolve without resolution text", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orderIssues.resolve({ id: 1, resolution: "" })
    ).rejects.toThrow();
  });
});

describe("orderIssues.escalate", () => {
  it("escalates an issue (super admin only)", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.escalate({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("orderIssues.close", () => {
  it("closes an issue", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.close({ id: 1 });

    expect(result).toEqual({ success: true });
  });
});

describe("orderIssues.overdue", () => {
  it("returns overdue SLA issues for super admin", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.overdue();

    expect(Array.isArray(result)).toBe(true);
  });
});

// ── Contact Inquiries Tests ──
describe("inquiries.submit", () => {
  it("submits a franchise inquiry (public, no login)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.submit({
      type: "franchise",
      name: "สมชาย ใจดี",
      phone: "0812345678",
      email: "somchai@example.com",
      company: "บริษัท ทดสอบ จำกัด",
      message: "สนใจซื้อแฟรนไชส์ Hibi Matcha ในพื้นที่กรุงเทพ",
      budget: "500,000-1,000,000",
      province: "กรุงเทพมหานคร",
    });

    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("message");
    expect(result.id).toBe(1);
  });

  it("submits a wholesale inquiry", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.submit({
      type: "wholesale",
      name: "ร้านชาไทย",
      phone: "0898765432",
      message: "ต้องการสั่งชา matcha ราคาส่ง จำนวน 50 กิโลกรัม",
    });

    expect(result).toHaveProperty("id");
  });

  it("submits an event inquiry", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.submit({
      type: "event",
      name: "บริษัท ABC",
      phone: "0876543210",
      email: "events@abc.com",
      message: "ต้องการจัดบูธ matcha ในงาน corporate event 200 คน",
      budget: "50,000-100,000",
    });

    expect(result).toHaveProperty("id");
  });

  it("rejects inquiry with short message", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.inquiries.submit({
        type: "franchise",
        name: "Test",
        phone: "0812345678",
        message: "สนใจ",
      })
    ).rejects.toThrow();
  });

  it("rejects inquiry with invalid phone", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.inquiries.submit({
        type: "franchise",
        name: "Test",
        phone: "123",
        message: "สนใจซื้อแฟรนไชส์ Hibi Matcha ในพื้นที่กรุงเทพ",
      })
    ).rejects.toThrow();
  });
});

describe("inquiries.list (admin)", () => {
  it("returns all inquiries for super admin", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("type");
    expect(result[0]).toHaveProperty("name");
  });

  it("filters by type", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.list({ type: "franchise" });

    expect(Array.isArray(result)).toBe(true);
  });
});

describe("inquiries.updateStatus", () => {
  it("updates inquiry status to contacted", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.updateStatus({
      id: 1,
      status: "contacted",
      notes: "โทรติดต่อแล้ว นัดคุยรายละเอียดเพิ่มเติม",
    });

    expect(result).toEqual({ success: true });
  });

  it("closes an inquiry", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.inquiries.updateStatus({
      id: 1,
      status: "closed",
    });

    expect(result).toEqual({ success: true });
  });
});

// ── Order Issue Image Upload Tests ──
describe("orderIssues.submit with image", () => {
  it("accepts issue submission with image attachment", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    // A minimal 1x1 white pixel JPEG in base64
    const tinyImageBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRFJiY3LwJE0VhxEzgScKUzN0YkNUlJCSmBwmNJFUxdoYGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4ePk5ebn6Onq8fLz9PX29/j5+v/aAAwDAQACEQMRAD8A/9k=";

    const result = await caller.orderIssues.submit({
      branchId: 1,
      deliveryApp: "walk_in",
      category: "damaged",
      description: "สินค้าเสียหายระหว่างการจัดส่ง แก้วแตกและเครื่องดื่มหก",
      imageBase64: tinyImageBase64,
      imageType: "image/jpeg",
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
  });

  it("accepts issue submission without image (optional)", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.submit({
      branchId: 1,
      deliveryApp: "shopee",
      orderId: "2966366660490752985",
      category: "wrong_order",
      description: "ได้เมนูผิดจากที่สั่ง ต้องการ matcha latte แต่ได้ green tea",
    });

    expect(result).toHaveProperty("id");
  });

  it("rejects issue with description too short", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.orderIssues.submit({
        branchId: 1,
        deliveryApp: "walk_in",
        category: "other",
        description: "สั้น",
      })
    ).rejects.toThrow();
  });

  it("accepts issue submission with multiple images (up to 5)", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    // Clear mocks before this test
    const { addOrderIssueImages } = await import("./db");
    (addOrderIssueImages as any).mockClear();

    // Make storagePut return unique URLs per call
    const { storagePut } = await import("./storage");
    let callCount = 0;
    (storagePut as any).mockImplementation(async () => {
      callCount++;
      return { key: `test-${callCount}`, url: `https://cdn.example.com/test-${callCount}` };
    });

    const tinyImageBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRFJiY3LwJE0VhxEzgScKUzN0YkNUlJCSmBwmNJFUxdoYGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4ePk5ebn6Onq8fLz9PX29/j5+v/aAAwDAQACEQMRAD8A/9k=";

    const result = await caller.orderIssues.submit({
      branchId: 1,
      deliveryApp: "walk_in",
      category: "damaged",
      description: "สินค้าเสียหายระหว่างการจัดส่ง แก้วแตกและเครื่องดื่มหก",
      images: [
        { base64: tinyImageBase64, type: "image/jpeg" },
        { base64: tinyImageBase64, type: "image/png" },
        { base64: tinyImageBase64, type: "image/jpeg" },
      ],
    });

    expect(result).toHaveProperty("id");
    expect(result.id).toBe(1);
    // Verify addOrderIssueImages was called with 3 URLs
    expect(addOrderIssueImages).toHaveBeenCalledTimes(1);
    const [issueId, urls] = (addOrderIssueImages as any).mock.calls[0];
    expect(issueId).toBe(1);
    expect(urls).toHaveLength(3);
    expect(urls[0]).toContain("https://");

    // Restore storagePut mock
    (storagePut as any).mockResolvedValue({ key: "test", url: "https://cdn.example.com/test" });
  });

  it("rejects more than 5 images", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    const tinyImageBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRFJiY3LwJE0VhxEzgScKUzN0YkNUlJCSmBwmNJFUxdoYGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4ePk5ebn6Onq8fLz9PX29/j5+v/aAAwDAQACEQMRAD8A/9k=";

    await expect(
      caller.orderIssues.submit({
        branchId: 1,
        deliveryApp: "walk_in",
        category: "other",
        description: "สินค้าเสียหายระหว่างการจัดส่งหลายจุดมาก",
        images: [
          { base64: tinyImageBase64, type: "image/jpeg" },
          { base64: tinyImageBase64, type: "image/jpeg" },
          { base64: tinyImageBase64, type: "image/jpeg" },
          { base64: tinyImageBase64, type: "image/jpeg" },
          { base64: tinyImageBase64, type: "image/jpeg" },
          { base64: tinyImageBase64, type: "image/jpeg" },
        ],
      })
    ).rejects.toThrow();
  });

});

// ── Issue Dashboard Stats Tests ──
describe("orderIssues.stats", () => {
  it("returns issue statistics for super admin", async () => {
    const ctx = createSuperAdminContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.orderIssues.stats();

    expect(result).toHaveProperty("byCategory");
    expect(result).toHaveProperty("byBranch");
    expect(result).toHaveProperty("byStatus");
    expect(result).toHaveProperty("sla");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("recentTrend");
    expect(result.total).toBe(8);
    expect(result.sla.totalResponse).toBe(8);
    expect(result.sla.metResponse).toBe(7);
    expect(result.byCategory).toHaveLength(2);
    expect(result.byBranch).toHaveLength(1);
    expect(result.recentTrend).toHaveLength(7);
  });

  it("rejects non-admin access to stats", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    await expect(caller.orderIssues.stats()).rejects.toThrow();
  });
});

describe("orderIssues.submit with legacy single image", () => {
  it("stores legacy single image in images table for consistency", async () => {
    const ctx = createCustomerContext();
    const caller = appRouter.createCaller(ctx);

    const tinyImageBase64 = "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYI4Q/SFhSRFJiY3LwJE0VhxEzgScKUzN0YkNUlJCSmBwmNJFUxdoYGBkaJicoKSo1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4ePk5ebn6Onq8fLz9PX29/j5+v/aAAwDAQACEQMRAD8A/9k=";

    // Clear previous mock calls
    const { addOrderIssueImages } = await import("./db");
    (addOrderIssueImages as any).mockClear();

    const result = await caller.orderIssues.submit({
      branchId: 1,
      deliveryApp: "walk_in",
      category: "quality",
      description: "คุณภาพเครื่องดื่มไม่ดี รสชาติแปลกไปจากที่สั่ง",
      imageBase64: tinyImageBase64,
      imageType: "image/jpeg",
    });

    expect(result).toHaveProperty("id");
    // Legacy single image should also be stored in images table
    expect(addOrderIssueImages).toHaveBeenCalledWith(1, [expect.stringContaining("https://")]);
  });
});


// ── Email Notification Tests ──

// Mock emailNotification module
vi.mock("./emailNotification", () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
  buildAutoReplyEmail: vi.fn().mockReturnValue({ subject: "Test Subject", html: "<p>Test</p>" }),
  buildFollowUpEmail: vi.fn().mockReturnValue({ subject: "Follow-up Subject", html: "<p>Follow-up</p>" }),
  buildIssueStatusEmail: vi.fn().mockReturnValue({ subject: "Issue Status", html: "<p>Status</p>" }),
}));

describe("Email Auto-Reply for D/F/I Inquiries", () => {
  it("should send auto-reply email when inquiry has email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const { sendEmail, buildAutoReplyEmail } = await import("./emailNotification");
    (sendEmail as any).mockClear();
    (buildAutoReplyEmail as any).mockClear();

    await caller.inquiries.submit({
      type: "franchise",
      name: "ทดสอบ อีเมล",
      phone: "0812345678",
      email: "customer@example.com",
      message: "สนใจซื้อแฟรนไชส์ Hibi Matcha ครับ",
    });

    // Should build auto-reply email
    expect(buildAutoReplyEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "franchise",
        name: "ทดสอบ อีเมล",
        email: "customer@example.com",
      })
    );
    // Should send email
    expect(sendEmail).toHaveBeenCalledWith({
      to: "customer@example.com",
      subject: "Test Subject",
      html: "<p>Test</p>",
    });
  });

  it("should NOT send email when inquiry has no email", async () => {
    const caller = appRouter.createCaller(createPublicContext());
    const { sendEmail } = await import("./emailNotification");
    (sendEmail as any).mockClear();

    await caller.inquiries.submit({
      type: "wholesale",
      name: "ทดสอบ ไม่มีอีเมล",
      phone: "0812345678",
      message: "สนใจสั่งซื้อราคาส่งครับ",
    });

    // Should NOT send email
    expect(sendEmail).not.toHaveBeenCalled();
  });
});

describe("Admin Follow-Up Email", () => {
  it("should send follow-up email to inquiry customer", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    const { sendEmail, buildFollowUpEmail } = await import("./emailNotification");
    (sendEmail as any).mockClear();
    (buildFollowUpEmail as any).mockClear();

    const result = await caller.inquiries.sendEmail({
      id: 1,
      message: "ขอบคุณที่สนใจแฟรนไชส์ ทีมงานจะติดต่อกลับภายใน 2 วัน",
    });

    expect(result.success).toBe(true);
    expect(result.emailSent).toBe(true);
    expect(buildFollowUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        customerName: "สมชาย",
        inquiryType: "franchise",
        adminMessage: "ขอบคุณที่สนใจแฟรนไชส์ ทีมงานจะติดต่อกลับภายใน 2 วัน",
      })
    );
    expect(sendEmail).toHaveBeenCalledWith({
      to: "test@example.com",
      subject: "Follow-up Subject",
      html: "<p>Follow-up</p>",
    });
  });

  it("should reject email to inquiry without email address", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    const { getContactInquiryById } = await import("./db");
    // Temporarily mock inquiry without email
    (getContactInquiryById as any).mockResolvedValueOnce({
      id: 2, type: "franchise", name: "ไม่มีอีเมล", phone: "0899999999", email: null, message: "test", status: "new", createdAt: new Date(),
    });

    await expect(
      caller.inquiries.sendEmail({ id: 2, message: "ทดสอบส่งอีเมล" })
    ).rejects.toThrow("ลูกค้าไม่ได้ระบุอีเมล");
  });
});


// ============ Free Drink Campaign Tests ============

describe("Free Drink Campaigns", () => {
  it("should list campaigns (super admin)", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    const result = await caller.freeDrinkCampaigns.list();
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("แคมเปญรีวิว มี.ค.");
  });

  it("should create a campaign (super admin)", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    const result = await caller.freeDrinkCampaigns.create({
      name: "แคมเปญทดสอบ",
      description: "ทดสอบ",
      menuOptions: [{ code: "ML", name: "Matcha Latte", sizes: [{ code: "L", name: "L" }] }],
      maxCodesPerCustomer: 1,
      validFrom: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 86400000).toISOString(),
    });
    expect(result).toHaveProperty("id");
  });

  it("should get campaign by id (super admin)", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    const result = await caller.freeDrinkCampaigns.getById({ id: 1 });
    expect(result.name).toBe("แคมเปญรีวิว มี.ค.");
  });

  it("should update campaign (super admin)", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    await caller.freeDrinkCampaigns.update({ id: 1, isActive: 0 });
    const { updateFreeDrinkCampaign } = await import("./db");
    expect(updateFreeDrinkCampaign).toHaveBeenCalled();
  });
});

// ============ Free Drink Codes Tests ============

describe("Free Drink Codes", () => {
  it("should list customer's free drink codes", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    const result = await caller.freeDrinkCodes.myCodes();
    expect(result).toHaveLength(1);
    expect(result[0].code).toBe("HIBI-ML-L-OAT-A7K2");
  });
});

// ============ Branch Loyalty Tests ============

describe("Branch Loyalty", () => {
  it("should list customer branch points", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    const result = await caller.branchLoyalty.myBranchPoints();
    expect(result).toHaveLength(1);
    expect(result[0].branchName).toBe("สาขาสยาม");
    expect(result[0].totalPoints).toBe(100);
    expect(result[0].usedPoints).toBe(20);
  });
});

// ============ Consent Tests ============

describe("Consent", () => {
  it("should check consent status (no consent yet)", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    const result = await caller.consent.check();
    expect(result).toHaveProperty("allAccepted");
    // getCustomerConsent returns null, so allAccepted should be false
    expect(result.allAccepted).toBe(false);
  });

  it("should accept consent (pdpa)", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    const result = await caller.consent.accept({ consentType: "pdpa" });
    expect(result).toHaveProperty("success", true);
    const { createCustomerConsent } = await import("./db");
    expect(createCustomerConsent).toHaveBeenCalled();
  });
});

// ============ Grab Order ID Validation Tests ============
describe("Grab Order ID Validation", () => {
  it("should require gfNumber and bookingId for Grab claims", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    // Missing gfNumber
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "grab",
        orderId: "GF-677",
        orderAmount: 171,
      })
    ).rejects.toThrow("กรุณากรอกเลข GF");
  });

  it("should reject invalid bookingId format (too short)", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "grab",
        orderId: "GF-677",
        gfNumber: "GF-677",
        bookingId: "A-12345", // too short, needs 15 chars after A-
        orderAmount: 171,
      })
    ).rejects.toThrow("Booking ID ต้องขึ้นต้นด้วย A-");
  });

  it("should reject invalid bookingId format (no A- prefix)", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "grab",
        orderId: "GF-677",
        gfNumber: "GF-677",
        bookingId: "B-949862QGXXISAV", // wrong prefix
        orderAmount: 171,
      })
    ).rejects.toThrow("Booking ID ต้องขึ้นต้นด้วย A-");
  });

  it("should reject duplicate approved bookingId", async () => {
    const { checkBookingIdApproved } = await import("./db");
    (checkBookingIdApproved as any).mockResolvedValueOnce(true);

    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "grab",
        orderId: "GF-677",
        gfNumber: "GF-677",
        bookingId: "A-949862QGXXISAV",
        orderAmount: 171,
      })
    ).rejects.toThrow("Booking ID นี้ถูกอนุมัติไปแล้ว");
  });

  it("should reject duplicate pending bookingId", async () => {
    const { checkBookingIdPending } = await import("./db");
    (checkBookingIdPending as any).mockResolvedValueOnce(true);

    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "grab",
        orderId: "GF-677",
        gfNumber: "GF-677",
        bookingId: "A-949862QGXXISAV",
        orderAmount: 171,
      })
    ).rejects.toThrow("Booking ID นี้อยู่ระหว่างรอตรวจสอบ");
  });

  it("should not require bookingId for non-Grab apps", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    // Shopee now needs shopeeOrderNumber + shopeeOrderId, so use lineman for this test
    try {
      await caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "LMF-260218-234745909",
        orderAmount: 115,
      });
    } catch (e: any) {
      // Should NOT be a Grab-specific error
      expect(e.message).not.toContain("กรุณากรอกเลข GF");
      expect(e.message).not.toContain("Booking ID");
    }
  });
});

describe("Shopee Order ID Validation", () => {
  it("should require shopeeOrderNumber and shopeeOrderId for Shopee claims", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    // Missing shopeeOrderNumber
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "shopee",
        orderId: "#212",
        orderAmount: 89,
      })
    ).rejects.toThrow("กรุณากรอกเลขออเดอร์สั้น");
  });

  it("should require shopeeOrderId when shopeeOrderNumber is provided", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "shopee",
        orderId: "#212",
        shopeeOrderNumber: "#212",
        orderAmount: 89,
      })
    ).rejects.toThrow("กรุณากรอกเลขคำสั่งซื้อ");
  });

  it("should reject invalid shopeeOrderId format (too short)", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "shopee",
        orderId: "#212",
        shopeeOrderNumber: "#212",
        shopeeOrderId: "12345", // too short, needs 16-20 digits
        orderAmount: 89,
      })
    ).rejects.toThrow("เลขคำสั่งซื้อ Shopee ต้องเป็นตัวเลข 16-20 หลัก");
  });

  it("should reject shopeeOrderId with non-digit characters", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "shopee",
        orderId: "#212",
        shopeeOrderNumber: "#212",
        shopeeOrderId: "30113032890ABC16525", // contains letters
        orderAmount: 89,
      })
    ).rejects.toThrow("เลขคำสั่งซื้อ Shopee ต้องเป็นตัวเลข 16-20 หลัก");
  });

  it("should reject duplicate approved shopeeOrderId", async () => {
    const { checkShopeeOrderIdApproved } = await import("./db");
    (checkShopeeOrderIdApproved as any).mockResolvedValueOnce(true);

    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "shopee",
        orderId: "#212",
        shopeeOrderNumber: "#212",
        shopeeOrderId: "3011303289058816525",
        orderAmount: 89,
      })
    ).rejects.toThrow("เลขคำสั่งซื้อนี้ถูกอนุมัติไปแล้ว");
  });

  it("should reject duplicate pending shopeeOrderId", async () => {
    const { checkShopeeOrderIdPending } = await import("./db");
    (checkShopeeOrderIdPending as any).mockResolvedValueOnce(true);

    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "shopee",
        orderId: "#212",
        shopeeOrderNumber: "#212",
        shopeeOrderId: "3011303289058816525",
        orderAmount: 89,
      })
    ).rejects.toThrow("เลขคำสั่งซื้อนี้อยู่ระหว่างรอตรวจสอบ");
  });

  it("should not require shopeeOrderNumber/shopeeOrderId for non-Shopee apps", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    try {
      await caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "grab",
        orderId: "GF-100",
        gfNumber: "GF-100",
        bookingId: "A-12345678901234",
        orderAmount: 115,
      });
    } catch (e: any) {
      // Should NOT be a Shopee-specific error
      expect(e.message).not.toContain("กรุณากรอกเลขออเดอร์สั้น");
      expect(e.message).not.toContain("กรุณากรอกเลขคำสั่งซื้อ");
    }
  });
});

describe("LINE MAN Order ID Validation", () => {
  it("should require linemanOrderNumber and linemanOrderId for LINE MAN claims", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    // Missing linemanOrderNumber
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "#5175",
        linemanOrderId: "LMF-260321-538845175",
        orderAmount: 66,
      })
    ).rejects.toThrow("กรุณากรอกเลขออเดอร์สั้น");

    // Missing linemanOrderId
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "#5175",
        linemanOrderNumber: "#5175",
        orderAmount: 66,
      })
    ).rejects.toThrow("กรุณากรอกรหัสใบสั่งซื้อ");
  });

  it("should validate LINE MAN Order ID format (LMF-YYMMDD-XXXXXXXXX)", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    // Invalid format - missing LMF prefix
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "#5175",
        linemanOrderNumber: "#5175",
        linemanOrderId: "260321-538845175",
        orderAmount: 66,
      })
    ).rejects.toThrow("รหัสใบสั่งซื้อ LINE MAN ต้องอยู่ในรูปแบบ");

    // Invalid format - wrong prefix
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "#5175",
        linemanOrderNumber: "#5175",
        linemanOrderId: "ABC-260321-538845175",
        orderAmount: 66,
      })
    ).rejects.toThrow("รหัสใบสั่งซื้อ LINE MAN ต้องอยู่ในรูปแบบ");

    // Invalid format - too short number part
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "#5175",
        linemanOrderNumber: "#5175",
        linemanOrderId: "LMF-260321-123",
        orderAmount: 66,
      })
    ).rejects.toThrow("รหัสใบสั่งซื้อ LINE MAN ต้องอยู่ในรูปแบบ");
  });

  it("should accept valid LINE MAN Order ID format", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    // Valid format LMF-260321-538845175
    try {
      await caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "#5175",
        linemanOrderNumber: "#5175",
        linemanOrderId: "LMF-260321-538845175",
        orderAmount: 66,
      });
    } catch (e: any) {
      // Should NOT be a format error
      expect(e.message).not.toContain("รหัสใบสั่งซื้อ LINE MAN ต้องอยู่ในรูปแบบ");
    }
  });

  it("should reject duplicate LINE MAN Order ID (already approved)", async () => {
    const { checkLinemanOrderIdApproved } = await import("./db");
    (checkLinemanOrderIdApproved as any).mockResolvedValueOnce(true);

    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "#5175",
        linemanOrderNumber: "#5175",
        linemanOrderId: "LMF-260321-538845175",
        orderAmount: 66,
      })
    ).rejects.toThrow("รหัสใบสั่งซื้อนี้ถูกอนุมัติไปแล้ว");
  });

  it("should reject duplicate LINE MAN Order ID (already pending)", async () => {
    const { checkLinemanOrderIdPending } = await import("./db");
    (checkLinemanOrderIdPending as any).mockResolvedValueOnce(true);

    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "#5175",
        linemanOrderNumber: "#5175",
        linemanOrderId: "LMF-260321-538845175",
        orderAmount: 66,
      })
    ).rejects.toThrow("รหัสใบสั่งซื้อนี้อยู่ระหว่างรอตรวจสอบ");
  });

  it("should not require linemanOrderNumber/linemanOrderId for non-LINE MAN apps", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    try {
      await caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "shopee",
        orderId: "#212",
        shopeeOrderNumber: "#212",
        shopeeOrderId: "3011303289058816525",
        orderAmount: 89,
      });
    } catch (e: any) {
      // Should NOT be a LINE MAN-specific error
      expect(e.message).not.toContain("กรุณากรอกเลขออเดอร์สั้น (เช่น #5175)");
      expect(e.message).not.toContain("กรุณากรอกรหัสใบสั่งซื้อ");
    }
  });

  it("should uppercase LINE MAN Order ID automatically", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    try {
      await caller.loyalty.submitClaim({
        branchId: 1,
        deliveryApp: "lineman",
        orderId: "#5175",
        linemanOrderNumber: "#5175",
        linemanOrderId: "lmf-260321-538845175",
        orderAmount: 66,
      });
    } catch (e: any) {
      // Should NOT be a format error - lowercase should be auto-uppercased
      expect(e.message).not.toContain("รหัสใบสั่งซื้อ LINE MAN ต้องอยู่ในรูปแบบ");
    }
  });
});

// ── Staff Login Tests ──
describe("Staff Login with Employee Code", () => {
  it("should reject login with unknown employee code", async () => {
    const { getStaffByEmployeeCode } = await import("./db");
    (getStaffByEmployeeCode as any).mockResolvedValueOnce(undefined);

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.hibiAuth.staffLogin({ employeeCode: "EMP999", password: "password123" })
    ).rejects.toThrow("ไม่พบรหัสพนักงานนี้ในระบบ");
  });

  it("should reject login with inactive staff", async () => {
    const { getStaffByEmployeeCode } = await import("./db");
    (getStaffByEmployeeCode as any).mockResolvedValueOnce({
      id: 5, phone: "0899999999", name: "Staff Inactive", employeeCode: "EMP005",
      passwordHash: "hashed", role: "branch_admin", branchId: 1, isActive: false,
    });

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.hibiAuth.staffLogin({ employeeCode: "EMP005", password: "password123" })
    ).rejects.toThrow("บัญชีนี้ถูกระงับ");
  });

  it("should reject login with wrong password", async () => {
    const bcrypt = await import("bcryptjs");
    (bcrypt.default.compare as any).mockResolvedValueOnce(false);

    const { getStaffByEmployeeCode } = await import("./db");
    (getStaffByEmployeeCode as any).mockResolvedValueOnce({
      id: 5, phone: "0899999999", name: "Staff Active", employeeCode: "EMP005",
      passwordHash: "hashed", role: "branch_admin", branchId: 1, isActive: true,
    });

    const caller = appRouter.createCaller(createPublicContext());
    await expect(
      caller.hibiAuth.staffLogin({ employeeCode: "EMP005", password: "wrongpass" })
    ).rejects.toThrow("รหัสผ่านไม่ถูกต้อง");
  });

  it("should succeed with valid employee code and password", async () => {
    const { getStaffByEmployeeCode } = await import("./db");
    (getStaffByEmployeeCode as any).mockResolvedValueOnce({
      id: 5, phone: "0899999999", name: "Staff Active", employeeCode: "EMP005",
      passwordHash: "hashed", role: "branch_admin", branchId: 1, isActive: true,
    });

    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.hibiAuth.staffLogin({ employeeCode: "EMP005", password: "password123" });
    expect(result.success).toBe(true);
    expect(result.role).toBe("branch_admin");
    expect(result.name).toBe("Staff Active");
    expect(ctx.res.cookie).toHaveBeenCalled();
  });
});


// ── Delete Reward Tests ──
describe("Delete Reward", () => {
  it("should delete reward as super admin", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    const { deleteReward } = await import("./db");
    (deleteReward as any).mockClear();
    await caller.loyalty.deleteReward({ id: 1 });
    expect(deleteReward).toHaveBeenCalledWith(1);
  });

  it("should reject delete reward for non-super-admin", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.loyalty.deleteReward({ id: 1 })
    ).rejects.toThrow();
  });
});

// ── Announcement Tests ──
describe("Announcements System", () => {
  it("should list active announcements for customers", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    const result = await caller.announcements.listActive();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].title).toBe("โปรวันเกิด!");
  });

  it("should create announcement as super admin", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    const { createAnnouncement } = await import("./db");
    (createAnnouncement as any).mockClear();
    const result = await caller.announcements.create({
      title: "โปรใหม่!",
      content: "ลด 30% ทุกเมนู matcha",
      type: "promotion",
      targetGroup: "all",
      promoCode: "NEW30",
      discountText: "ลด 30%",
      startDate: new Date(),
    });
    expect(result.id).toBe(1);
    expect(createAnnouncement).toHaveBeenCalled();
  });

  it("should reject create announcement for non-super-admin", async () => {
    const caller = appRouter.createCaller(createCustomerContext());
    await expect(
      caller.announcements.create({
        title: "Test",
        content: "Test content",
        type: "announcement",
        targetGroup: "all",
        startDate: new Date(),
      })
    ).rejects.toThrow();
  });

  it("should delete announcement as super admin", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    const { deleteAnnouncement } = await import("./db");
    (deleteAnnouncement as any).mockClear();
    await caller.announcements.delete({ id: 1 });
    expect(deleteAnnouncement).toHaveBeenCalledWith(1);
  });

  it("should list all announcements for admin", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    const result = await caller.announcements.listAll();
    expect(Array.isArray(result)).toBe(true);
  });
});
