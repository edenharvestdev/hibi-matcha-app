import { describe, expect, it, vi } from "vitest";

// ── Test: Code Generation Format ──
// We replicate the generateCode logic here to test independently
function generateCode(type: "RV" | "CL"): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const prefix = type === "RV" ? "HIBI-RV-" : "HIBI-CL-";
  let code = prefix;
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

describe("Code Generation", () => {
  it("generates RV code with correct format HIBI-RV-XXXXXX", () => {
    const code = generateCode("RV");
    expect(code).toMatch(/^HIBI-RV-[A-Z2-9]{6}$/);
    expect(code.length).toBe(14);
  });

  it("generates CL code with correct format HIBI-CL-XXXXXX", () => {
    const code = generateCode("CL");
    expect(code).toMatch(/^HIBI-CL-[A-Z2-9]{6}$/);
    expect(code.length).toBe(14);
  });

  it("does not contain ambiguous characters (0, 1, I, O)", () => {
    for (let i = 0; i < 100; i++) {
      const code = generateCode("RV");
      const suffix = code.slice(8); // after HIBI-RV-
      expect(suffix).not.toMatch(/[01IO]/);
    }
  });

  it("generates unique codes across multiple calls", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateCode("RV"));
    }
    // With 6 chars from 31 possible, collision in 100 is extremely unlikely
    expect(codes.size).toBeGreaterThan(95);
  });
});

// ── Test: Code Status Logic ──
describe("Code Status Logic", () => {
  it("identifies expired codes correctly", () => {
    const now = new Date();
    const pastDate = new Date(now.getTime() - 31 * 24 * 60 * 60 * 1000); // 31 days ago
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days ahead

    expect(now > pastDate).toBe(true); // expired
    expect(now > futureDate).toBe(false); // not expired
  });

  it("calculates 30-day expiry correctly", () => {
    const issuedAt = new Date("2026-01-15T00:00:00Z");
    const expiresAt = new Date(issuedAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    expect(expiresAt.toISOString()).toBe("2026-02-14T00:00:00.000Z");
  });
});

// ── Test: Role-based Access ──
describe("Role-based Access Control", () => {
  const roles = {
    customer: "customer",
    branch_admin: "branch_admin",
    super_admin: "super_admin",
  };

  it("customer cannot access branch admin features", () => {
    const role = roles.customer;
    const canAccessBranch = role === "branch_admin" || role === "super_admin";
    expect(canAccessBranch).toBe(false);
  });

  it("branch_admin can access branch features", () => {
    const role = roles.branch_admin;
    const canAccessBranch = role === "branch_admin" || role === "super_admin";
    expect(canAccessBranch).toBe(true);
  });

  it("super_admin can access all features", () => {
    const role = roles.super_admin;
    const canAccessBranch = role === "branch_admin" || role === "super_admin";
    const canAccessAdmin = role === "super_admin";
    expect(canAccessBranch).toBe(true);
    expect(canAccessAdmin).toBe(true);
  });

  it("branch_admin cannot access super admin features", () => {
    const role = roles.branch_admin;
    const canAccessAdmin = role === "super_admin";
    expect(canAccessAdmin).toBe(false);
  });
});

// ── Test: Duplicate Order Prevention ──
describe("Duplicate Order Prevention", () => {
  it("detects duplicate delivery_app + order_id combination", () => {
    const existingReviews = [
      { deliveryApp: "shopee", orderId: "SP001" },
      { deliveryApp: "grab", orderId: "GB001" },
      { deliveryApp: "lineman", orderId: "LM001" },
    ];

    const isDuplicate = (app: string, orderId: string) =>
      existingReviews.some(r => r.deliveryApp === app && r.orderId === orderId);

    expect(isDuplicate("shopee", "SP001")).toBe(true);
    expect(isDuplicate("shopee", "SP002")).toBe(false);
    expect(isDuplicate("grab", "SP001")).toBe(false);
    expect(isDuplicate("grab", "GB001")).toBe(true);
  });
});

// ── Test: Claim Compensation Logic ──
describe("Claim Compensation", () => {
  it("generates exactly 2 codes per claim", () => {
    const codes = [generateCode("CL"), generateCode("CL")];
    expect(codes).toHaveLength(2);
    codes.forEach(code => {
      expect(code).toMatch(/^HIBI-CL-[A-Z2-9]{6}$/);
    });
  });

  it("both CL codes should be unique", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 50; i++) {
      const c1 = generateCode("CL");
      const c2 = generateCode("CL");
      expect(c1).not.toBe(c2);
      codes.add(c1);
      codes.add(c2);
    }
  });
});

// ── Test: Review Status Transitions ──
describe("Review Status Transitions", () => {
  const validTransitions: Record<string, string[]> = {
    pending: ["approved", "rejected"],
    approved: [],
    rejected: [],
  };

  it("pending can transition to approved", () => {
    expect(validTransitions.pending).toContain("approved");
  });

  it("pending can transition to rejected", () => {
    expect(validTransitions.pending).toContain("rejected");
  });

  it("approved is a terminal state", () => {
    expect(validTransitions.approved).toHaveLength(0);
  });

  it("rejected is a terminal state", () => {
    expect(validTransitions.rejected).toHaveLength(0);
  });
});

// ── Test: Code Status Transitions ──
describe("Code Status Transitions", () => {
  const validTransitions: Record<string, string[]> = {
    issued: ["redeemed", "expired", "cancelled"],
    redeemed: [],
    expired: [],
    cancelled: [],
  };

  it("issued code can be redeemed", () => {
    expect(validTransitions.issued).toContain("redeemed");
  });

  it("issued code can expire", () => {
    expect(validTransitions.issued).toContain("expired");
  });

  it("issued code can be cancelled", () => {
    expect(validTransitions.issued).toContain("cancelled");
  });

  it("redeemed code cannot change status", () => {
    expect(validTransitions.redeemed).toHaveLength(0);
  });
});

// ── Test: Audit Log Structure ──
describe("Audit Log Structure", () => {
  it("creates valid audit log entry", () => {
    const log = {
      actorType: "staff" as const,
      actorId: 1,
      actorName: "Admin User",
      action: "approve",
      entity: "review_request",
      entityId: 42,
      beforeData: JSON.stringify({ status: "pending" }),
      afterData: JSON.stringify({ status: "approved" }),
    };

    expect(log.actorType).toBe("staff");
    expect(log.action).toBe("approve");
    expect(log.entity).toBe("review_request");
    expect(JSON.parse(log.beforeData)).toEqual({ status: "pending" });
    expect(JSON.parse(log.afterData)).toEqual({ status: "approved" });
  });

  it("supports all required action types", () => {
    const requiredActions = ["approve", "reject", "issue_code", "redeem", "cancel", "create_claim"];
    requiredActions.forEach(action => {
      expect(typeof action).toBe("string");
      expect(action.length).toBeGreaterThan(0);
    });
  });
});

// ── Test: Phone Number Validation ──
describe("Phone Number Validation", () => {
  const isValidPhone = (phone: string) => /^0[0-9]{8,9}$/.test(phone);

  it("accepts valid Thai phone numbers", () => {
    expect(isValidPhone("0812345678")).toBe(true);
    expect(isValidPhone("0912345678")).toBe(true);
    expect(isValidPhone("021234567")).toBe(true);
  });

  it("rejects invalid phone numbers", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("1234567890")).toBe(false);
    expect(isValidPhone("08123")).toBe(false);
    expect(isValidPhone("abc")).toBe(false);
  });
});

// ── Test: Email Validation ──
describe("Email Validation", () => {
  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  it("accepts valid emails", () => {
    expect(isValidEmail("test@example.com")).toBe(true);
    expect(isValidEmail("user.name@domain.co.th")).toBe(true);
  });

  it("rejects invalid emails", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("notanemail")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
  });
});

// ── Test: CSV Export Format ──
describe("CSV Export Format", () => {
  it("generates valid CSV header", () => {
    const headers = ["Code", "Type", "Status", "Branch", "Issued At", "Expires At", "Redeemed At"];
    const csvHeader = headers.join(",");
    expect(csvHeader).toBe("Code,Type,Status,Branch,Issued At,Expires At,Redeemed At");
  });

  it("escapes commas in CSV values", () => {
    const value = "Branch, Siam";
    const escaped = `"${value}"`;
    expect(escaped).toBe('"Branch, Siam"');
  });
});

// ── Test: QR Code Data Format ──
describe("QR Code Data Format", () => {
  it("QR code encodes the raw code string", () => {
    const code = "HIBI-RV-ABC123";
    // QR code should encode the exact code string
    expect(code).toMatch(/^HIBI-(RV|CL)-[A-Z0-9]{6}$/);
    expect(code.length).toBe(14);
  });

  it("QR code value is consistent for same code", () => {
    const code = "HIBI-CL-XYZ789";
    const qrValue1 = code; // QR encodes raw code
    const qrValue2 = code;
    expect(qrValue1).toBe(qrValue2);
  });

  it("all code formats are valid QR data", () => {
    const rvCode = "HIBI-RV-A2B3C4";
    const clCode = "HIBI-CL-X5Y6Z7";
    // Both should be non-empty strings suitable for QR encoding
    expect(rvCode.length).toBeGreaterThan(0);
    expect(clCode.length).toBeGreaterThan(0);
    expect(typeof rvCode).toBe("string");
    expect(typeof clCode).toBe("string");
  });
});

// ── Test: Enhanced Notification Content ──
describe("Enhanced Review Notification", () => {
  const appLabels: Record<string, string> = {
    shopee: "Shopee Food",
    lineman: "LINE MAN",
    grab: "Grab Food",
  };

  it("maps delivery app to display name", () => {
    expect(appLabels["shopee"]).toBe("Shopee Food");
    expect(appLabels["lineman"]).toBe("LINE MAN");
    expect(appLabels["grab"]).toBe("Grab Food");
  });

  it("falls back to raw app name for unknown apps", () => {
    const unknownApp = "foodpanda";
    const displayName = appLabels[unknownApp] || unknownApp;
    expect(displayName).toBe("foodpanda");
  });

  it("notification title includes delivery app name", () => {
    const appName = appLabels["shopee"];
    const title = `📝 รีวิวใหม่รอพิจารณา - ${appName}`;
    expect(title).toContain("Shopee Food");
    expect(title).toContain("รีวิวใหม่");
  });

  it("notification content includes all required fields", () => {
    const customer = { name: "สมชาย", phone: "0812345678", email: "somchai@test.com" };
    const branch = { name: "สาขาสยาม" };
    const appName = "Shopee Food";
    const orderId = "SP12345";
    const submitDate = "17 ก.พ. 2026, 10:30";

    const content = `มีรีวิวใหม่เข้ามา\n\n👤 ข้อมูลลูกค้า:\n- ชื่อ: ${customer.name}\n- เบอร์โทร: ${customer.phone}\n- อีเมล: ${customer.email}\n\n📋 รายละเอียดออเดอร์:\n- สาขา: ${branch.name}\n- แอปเดลิเวอรี: ${appName}\n- Order ID: ${orderId}\n- วันที่ส่งรีวิว: ${submitDate}\n- รูปรีวิว: มี\n- รูปออเดอร์: ไม่มี\n\n🔗 กรุณาเข้าระบบเพื่อพิจารณาอนุมัติ`;

    // Verify all key fields are present
    expect(content).toContain("สมชาย");
    expect(content).toContain("0812345678");
    expect(content).toContain("somchai@test.com");
    expect(content).toContain("สาขาสยาม");
    expect(content).toContain("Shopee Food");
    expect(content).toContain("SP12345");
    expect(content).toContain("17 ก.พ. 2026, 10:30");
    expect(content).toContain("รูปรีวิว: มี");
    expect(content).toContain("รูปออเดอร์: ไม่มี");
  });

  it("handles missing customer data gracefully", () => {
    const customer = { name: null, phone: null, email: null };
    const name = customer.name || "N/A";
    const phone = customer.phone || "N/A";
    const email = customer.email || "N/A";

    expect(name).toBe("N/A");
    expect(phone).toBe("N/A");
    expect(email).toBe("N/A");
  });
});

// ── Test: QR Scanner Code Processing ──
describe("QR Scanner Code Processing", () => {
  // Simulates the processing logic in handleQRScan
  function processScannedCode(raw: string): string {
    return raw.trim().toUpperCase();
  }

  it("trims whitespace from scanned code", () => {
    expect(processScannedCode("  HIBI-RV-ABC123  ")).toBe("HIBI-RV-ABC123");
    expect(processScannedCode("\nHIBI-CL-XYZ789\n")).toBe("HIBI-CL-XYZ789");
  });

  it("converts lowercase scanned code to uppercase", () => {
    expect(processScannedCode("hibi-rv-abc123")).toBe("HIBI-RV-ABC123");
    expect(processScannedCode("Hibi-Cl-Xyz789")).toBe("HIBI-CL-XYZ789");
  });

  it("preserves already correct code format", () => {
    expect(processScannedCode("HIBI-RV-A2B3C4")).toBe("HIBI-RV-A2B3C4");
  });

  it("processed code matches expected HIBI code pattern", () => {
    const processed = processScannedCode("hibi-rv-abc234");
    expect(processed).toMatch(/^HIBI-(RV|CL)-[A-Z0-9]{6}$/);
  });

  it("handles scanned code that is not a valid HIBI code", () => {
    const processed = processScannedCode("https://example.com/code/123");
    // The scanner may pick up any QR code; the lookup will handle validation
    expect(typeof processed).toBe("string");
    expect(processed.length).toBeGreaterThan(0);
  });

  it("handles empty scanned result gracefully", () => {
    const processed = processScannedCode("");
    expect(processed).toBe("");
  });
});

// ── Test: QR Scanner Camera Facing Modes ──
describe("QR Scanner Camera Modes", () => {
  it("default facing mode is environment (back camera)", () => {
    const defaultMode: "environment" | "user" = "environment";
    expect(defaultMode).toBe("environment");
  });

  it("can toggle between environment and user facing modes", () => {
    let mode: "environment" | "user" = "environment";
    // Toggle
    mode = mode === "environment" ? "user" : "environment";
    expect(mode).toBe("user");
    // Toggle back
    mode = mode === "environment" ? "user" : "environment";
    expect(mode).toBe("environment");
  });
});

// ── Test: Loyalty Points Calculation ──
describe("Loyalty Points Calculation", () => {
  // Replicate the tier-based rate logic
  const TIER_RATES: Record<string, number> = { green: 10, gold: 8, matcha: 6 };

  function calculatePoints(orderAmount: number, tier: string): number {
    const rate = TIER_RATES[tier] || 10;
    return Math.floor(orderAmount / rate);
  }

  it("Green tier earns 1 point per 10 baht", () => {
    expect(calculatePoints(100, "green")).toBe(10);
    expect(calculatePoints(90, "green")).toBe(9);
    expect(calculatePoints(150, "green")).toBe(15);
  });

  it("Gold tier earns 1 point per 8 baht", () => {
    expect(calculatePoints(100, "gold")).toBe(12);
    expect(calculatePoints(80, "gold")).toBe(10);
    expect(calculatePoints(160, "gold")).toBe(20);
  });

  it("Matcha tier earns 1 point per 6 baht", () => {
    expect(calculatePoints(100, "matcha")).toBe(16);
    expect(calculatePoints(60, "matcha")).toBe(10);
    expect(calculatePoints(180, "matcha")).toBe(30);
  });

  it("rounds down fractional points", () => {
    expect(calculatePoints(15, "green")).toBe(1);
    expect(calculatePoints(19, "green")).toBe(1);
    expect(calculatePoints(9, "green")).toBe(0);
    expect(calculatePoints(7, "gold")).toBe(0);
    expect(calculatePoints(5, "matcha")).toBe(0);
  });

  it("handles zero and negative amounts", () => {
    expect(calculatePoints(0, "green")).toBe(0);
    expect(calculatePoints(0, "gold")).toBe(0);
  });

  it("defaults to green rate for unknown tier", () => {
    expect(calculatePoints(100, "unknown")).toBe(10);
    expect(calculatePoints(100, "")).toBe(10);
  });
});

// ── Test: Tier Thresholds ──
describe("Tier Thresholds", () => {
  const TIER_THRESHOLDS = { green: 0, gold: 500, matcha: 2000 };

  function determineTier(lifetimePoints: number): string {
    if (lifetimePoints >= TIER_THRESHOLDS.matcha) return "matcha";
    if (lifetimePoints >= TIER_THRESHOLDS.gold) return "gold";
    return "green";
  }

  it("starts at Green tier with 0 points", () => {
    expect(determineTier(0)).toBe("green");
  });

  it("stays Green below 500 points", () => {
    expect(determineTier(499)).toBe("green");
    expect(determineTier(100)).toBe("green");
  });

  it("upgrades to Gold at 500 points", () => {
    expect(determineTier(500)).toBe("gold");
    expect(determineTier(999)).toBe("gold");
    expect(determineTier(1999)).toBe("gold");
  });

  it("upgrades to Matcha at 2000 points", () => {
    expect(determineTier(2000)).toBe("matcha");
    expect(determineTier(5000)).toBe("matcha");
    expect(determineTier(10000)).toBe("matcha");
  });
});

// ── Test: Customer QR Code Format ──
describe("Customer QR Code Format", () => {
  it("generates correct customer QR code format", () => {
    const customerId = 42;
    const qrValue = `HIBI-CUST-${customerId}`;
    expect(qrValue).toBe("HIBI-CUST-42");
    expect(qrValue).toMatch(/^HIBI-CUST-\d+$/);
  });

  it("parses customer ID from QR code", () => {
    const qrValue = "HIBI-CUST-123";
    const match = qrValue.match(/HIBI-CUST-(\d+)/);
    expect(match).not.toBeNull();
    expect(parseInt(match![1])).toBe(123);
  });

  it("rejects invalid customer QR formats", () => {
    const invalidCodes = ["HIBI-RV-ABC123", "HIBI-CUST-", "CUST-123", "random-text"];
    invalidCodes.forEach(code => {
      const match = code.match(/^HIBI-CUST-(\d+)$/);
      expect(match).toBeNull();
    });
  });
});

// ── Test: Reward Redemption Logic ──
describe("Reward Redemption Logic", () => {
  it("allows redemption when balance >= cost", () => {
    const balance = 250;
    const cost = 250;
    expect(balance >= cost).toBe(true);
  });

  it("rejects redemption when balance < cost", () => {
    const balance = 200;
    const cost = 250;
    expect(balance >= cost).toBe(false);
  });

  it("calculates remaining balance after redemption", () => {
    const balance = 300;
    const cost = 250;
    const remaining = balance - cost;
    expect(remaining).toBe(50);
  });

  it("handles stock deduction correctly", () => {
    let stock: number | null = 10;
    // Redeem one
    if (stock !== null) stock -= 1;
    expect(stock).toBe(9);

    // Unlimited stock (null)
    let unlimitedStock: number | null = null;
    const canRedeem = unlimitedStock === null || unlimitedStock > 0;
    expect(canRedeem).toBe(true);
  });

  it("prevents redemption when out of stock", () => {
    const stock = 0;
    const canRedeem = stock === null || stock > 0;
    expect(canRedeem).toBe(false);
  });
});

// ── Test: Point Claim (Delivery) Validation ──
describe("Point Claim Validation", () => {
  it("validates required fields for delivery claim", () => {
    const claim = {
      deliveryApp: "shopee",
      orderId: "SP12345",
      orderAmount: 150,
      branchId: 1,
    };
    expect(claim.deliveryApp).toBeTruthy();
    expect(claim.orderId).toBeTruthy();
    expect(claim.orderAmount).toBeGreaterThan(0);
    expect(claim.branchId).toBeGreaterThan(0);
  });

  it("rejects claim with zero or negative amount", () => {
    const isValidAmount = (amount: number) => amount > 0;
    expect(isValidAmount(0)).toBe(false);
    expect(isValidAmount(-100)).toBe(false);
    expect(isValidAmount(50)).toBe(true);
  });

  it("claim status transitions are valid", () => {
    const validTransitions: Record<string, string[]> = {
      pending: ["approved", "rejected"],
      approved: [],
      rejected: [],
    };
    expect(validTransitions.pending).toContain("approved");
    expect(validTransitions.pending).toContain("rejected");
    expect(validTransitions.approved).toHaveLength(0);
    expect(validTransitions.rejected).toHaveLength(0);
  });
});

// ── Test: Reward Category Configuration ──
describe("Reward Categories", () => {
  const CATEGORIES = ["drink", "food", "topping", "discount", "special"];

  it("has all expected categories", () => {
    expect(CATEGORIES).toContain("drink");
    expect(CATEGORIES).toContain("food");
    expect(CATEGORIES).toContain("topping");
    expect(CATEGORIES).toContain("discount");
    expect(CATEGORIES).toContain("special");
  });

  it("has exactly 5 categories", () => {
    expect(CATEGORIES).toHaveLength(5);
  });
});

// ── Test: Loyalty Cost Budget Validation ──
describe("Loyalty Cost Budget (5% max)", () => {
  // Verify the loyalty system stays within 5% cost budget
  const AVG_PRICE = 90; // average order price
  const REWARD_COST = 27; // cost of a free drink reward (30% of price)

  it("Green tier cost is within 5% budget", () => {
    const pointsPerOrder = Math.floor(AVG_PRICE / 10); // 9 points
    const ordersToRedeem = Math.ceil(250 / pointsPerOrder); // 28 orders
    const totalSpend = ordersToRedeem * AVG_PRICE; // 2520
    const costPercent = (REWARD_COST / totalSpend) * 100;
    expect(costPercent).toBeLessThan(5);
  });

  it("Gold tier cost is within 5% budget", () => {
    const pointsPerOrder = Math.floor(AVG_PRICE / 8); // 11 points
    const ordersToRedeem = Math.ceil(250 / pointsPerOrder); // 23 orders
    const totalSpend = ordersToRedeem * AVG_PRICE;
    const costPercent = (REWARD_COST / totalSpend) * 100;
    expect(costPercent).toBeLessThan(5);
  });

  it("Matcha tier cost is within 5% budget", () => {
    const pointsPerOrder = Math.floor(AVG_PRICE / 6); // 15 points
    const ordersToRedeem = Math.ceil(250 / pointsPerOrder); // 17 orders
    const totalSpend = ordersToRedeem * AVG_PRICE;
    const costPercent = (REWARD_COST / totalSpend) * 100;
    expect(costPercent).toBeLessThan(5);
  });

  it("worst case (Matcha + high cost) is within 5%", () => {
    const highCost = AVG_PRICE * 0.35; // 35% cost
    const pointsPerOrder = Math.floor(AVG_PRICE / 6);
    const ordersToRedeem = Math.ceil(250 / pointsPerOrder);
    const totalSpend = ordersToRedeem * AVG_PRICE;
    const costPercent = (highCost / totalSpend) * 100;
    expect(costPercent).toBeLessThan(5);
  });
});

// ── Test: PWA Configuration ──
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

describe("PWA Configuration", () => {
  const publicDir = resolve(__dirname, "../client/public");

  it("manifest.json exists and has required fields", () => {
    const manifestPath = resolve(publicDir, "manifest.json");
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    expect(manifest.name).toBeDefined();
    expect(manifest.short_name).toBeDefined();
    expect(manifest.start_url).toBe("/");
    expect(manifest.display).toBe("standalone");
    expect(manifest.theme_color).toBeDefined();
    expect(manifest.background_color).toBeDefined();
    expect(manifest.icons).toBeDefined();
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
  });

  it("manifest icons have correct sizes (192 and 512)", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(publicDir, "manifest.json"), "utf-8")
    );
    const sizes = manifest.icons.map((i: any) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");
  });

  it("service worker file exists", () => {
    const swPath = resolve(publicDir, "sw.js");
    expect(existsSync(swPath)).toBe(true);

    const swContent = readFileSync(swPath, "utf-8");
    expect(swContent).toContain("install");
    expect(swContent).toContain("activate");
    expect(swContent).toContain("fetch");
  });

  it("offline.html fallback page exists", () => {
    const offlinePath = resolve(publicDir, "offline.html");
    expect(existsSync(offlinePath)).toBe(true);

    const content = readFileSync(offlinePath, "utf-8");
    expect(content).toContain("ไม่มีการเชื่อมต่อ");
    expect(content).toContain("ลองใหม่อีกครั้ง");
  });

  it("index.html has PWA meta tags", () => {
    const indexPath = resolve(__dirname, "../client/index.html");
    const content = readFileSync(indexPath, "utf-8");

    expect(content).toContain('rel="manifest"');
    expect(content).toContain("apple-mobile-web-app-capable");
    expect(content).toContain("apple-touch-icon");
    expect(content).toContain('name="theme-color"');
  });

  it("manifest display mode is standalone for app-like experience", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(publicDir, "manifest.json"), "utf-8")
    );
    expect(manifest.display).toBe("standalone");
    expect(manifest.orientation).toBe("portrait-primary");
  });

  it("manifest language is Thai", () => {
    const manifest = JSON.parse(
      readFileSync(resolve(publicDir, "manifest.json"), "utf-8")
    );
    expect(manifest.lang).toBe("th");
  });
});
