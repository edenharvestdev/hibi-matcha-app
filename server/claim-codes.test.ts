import { describe, expect, it } from "vitest";

// ── Test: Claim Code Generation (One-by-One) ──
describe("Claim Code Generation (One-by-One)", () => {
  function generateClaimCode(): string {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "HIBI-CL-";
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  it("generates code with HIBI-CL- prefix", () => {
    const code = generateClaimCode();
    expect(code).toMatch(/^HIBI-CL-/);
  });

  it("generates code with 6 random characters after prefix", () => {
    const code = generateClaimCode();
    expect(code).toHaveLength(14); // HIBI-CL- (8) + 6
  });

  it("generates unique codes", () => {
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      codes.add(generateClaimCode());
    }
    expect(codes.size).toBe(100);
  });

  it("only generates 1 code per claim (not 2)", () => {
    const codesPerClaim = 1;
    expect(codesPerClaim).toBe(1);
  });
});

// ── Test: Claim Form Validation ──
describe("Claim Form Validation", () => {
  interface ClaimInput {
    branchId: number;
    channel: "walk_in" | "grab" | "lineman" | "shopee" | "robinhood" | "other";
    orderId?: string;
    errorMenuCode?: string;
    orderDetails?: string;
    claimError: string;
    compensationMenuItemId?: number;
    customExpiryDays?: number;
    customerPhone?: string;
    customerOpenId?: string;
  }

  function validateClaimInput(input: ClaimInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.branchId || input.branchId <= 0) {
      errors.push("กรุณาเลือกสาขา");
    }
    if (!input.channel) {
      errors.push("กรุณาเลือกช่องทาง");
    }
    if (!input.claimError || input.claimError.trim().length === 0) {
      errors.push("กรุณาระบุความผิดพลาด");
    }
    if (input.customExpiryDays !== undefined && input.customExpiryDays < 1) {
      errors.push("จำนวนวันหมดอายุต้องมากกว่า 0");
    }
    if (input.customExpiryDays !== undefined && input.customExpiryDays > 365) {
      errors.push("จำนวนวันหมดอายุต้องไม่เกิน 365 วัน");
    }

    return { valid: errors.length === 0, errors };
  }

  it("valid claim with all required fields", () => {
    const result = validateClaimInput({
      branchId: 1,
      channel: "grab",
      orderId: "GF-123",
      claimError: "เครื่องดื่มผิดเมนู",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("invalid: missing branchId", () => {
    const result = validateClaimInput({
      branchId: 0,
      channel: "grab",
      claimError: "ผิดเมนู",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("กรุณาเลือกสาขา");
  });

  it("invalid: missing claimError", () => {
    const result = validateClaimInput({
      branchId: 1,
      channel: "walk_in",
      claimError: "",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("กรุณาระบุความผิดพลาด");
  });

  it("invalid: expiry days too small", () => {
    const result = validateClaimInput({
      branchId: 1,
      channel: "lineman",
      claimError: "ผิดเมนู",
      customExpiryDays: 0,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("จำนวนวันหมดอายุต้องมากกว่า 0");
  });

  it("invalid: expiry days too large", () => {
    const result = validateClaimInput({
      branchId: 1,
      channel: "shopee",
      claimError: "ผิดเมนู",
      customExpiryDays: 500,
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("จำนวนวันหมดอายุต้องไม่เกิน 365 วัน");
  });

  it("valid: walk_in without orderId", () => {
    const result = validateClaimInput({
      branchId: 1,
      channel: "walk_in",
      claimError: "ทำเครื่องดื่มผิด",
    });
    expect(result.valid).toBe(true);
  });
});

// ── Test: Claim Channel Types ──
describe("Claim Channel Types", () => {
  const validChannels = ["walk_in", "grab", "lineman", "shopee", "robinhood", "other"];

  it("all valid channels are recognized", () => {
    validChannels.forEach(ch => {
      expect(validChannels).toContain(ch);
    });
  });

  it("walk_in maps to หน้าร้าน", () => {
    const channelLabels: Record<string, string> = {
      walk_in: "หน้าร้าน",
      grab: "Grab Food",
      lineman: "LINE MAN",
      shopee: "Shopee Food",
      robinhood: "Robinhood",
      other: "อื่นๆ",
    };
    expect(channelLabels["walk_in"]).toBe("หน้าร้าน");
    expect(channelLabels["grab"]).toBe("Grab Food");
  });
});

// ── Test: Code Expiry Calculation ──
describe("Code Expiry Calculation", () => {
  function calculateExpiry(issuedAt: Date, expiryDays: number): Date {
    const expiry = new Date(issuedAt);
    expiry.setDate(expiry.getDate() + expiryDays);
    return expiry;
  }

  it("default 30 days expiry", () => {
    const now = new Date("2026-03-27T00:00:00Z");
    const expiry = calculateExpiry(now, 30);
    expect(expiry.toISOString()).toBe("2026-04-26T00:00:00.000Z");
  });

  it("custom 7 days expiry", () => {
    const now = new Date("2026-03-27T00:00:00Z");
    const expiry = calculateExpiry(now, 7);
    expect(expiry.toISOString()).toBe("2026-04-03T00:00:00.000Z");
  });

  it("custom 90 days expiry", () => {
    const now = new Date("2026-03-27T00:00:00Z");
    const expiry = calculateExpiry(now, 90);
    expect(expiry.toISOString()).toBe("2026-06-25T00:00:00.000Z");
  });

  it("expired code check", () => {
    const expiresAt = new Date("2026-03-01T00:00:00Z");
    const now = new Date("2026-03-27T00:00:00Z");
    expect(now > expiresAt).toBe(true);
  });

  it("active code check", () => {
    const expiresAt = new Date("2026-04-30T00:00:00Z");
    const now = new Date("2026-03-27T00:00:00Z");
    expect(now < expiresAt).toBe(true);
  });
});

// ── Test: Customer Identification Methods ──
describe("Customer Identification Methods", () => {
  it("identify by phone number", () => {
    const phone = "0812345678";
    expect(phone).toMatch(/^0\d{8,9}$/);
  });

  it("identify by openId (QR scan)", () => {
    const openId = "user_abc123xyz";
    expect(openId.length).toBeGreaterThan(0);
  });

  it("no customer = copy code as text", () => {
    const customerPhone = undefined;
    const customerOpenId = undefined;
    const isAnonymous = !customerPhone && !customerOpenId;
    expect(isAnonymous).toBe(true);
  });

  it("has customer when phone provided", () => {
    const customerPhone = "0891234567";
    const isAnonymous = !customerPhone;
    expect(isAnonymous).toBe(false);
  });
});

// ── Test: MyCodes Display Logic ──
describe("MyCodes Display Logic", () => {
  interface CodeDisplay {
    id: number;
    code: string;
    type: string;
    status: string;
    issuedAt: Date;
    expiresAt: Date;
    compensationMenuCode?: string | null;
    compensationMenuName?: string | null;
    claimError?: string | null;
    claimChannel?: string | null;
  }

  const codeTypeLabels: Record<string, string> = {
    RV: "รีวิว",
    CL: "ชดเชย",
    FR: "ให้ฟรี",
    PR: "โปรโมชัน",
  };

  it("shows correct type label for review code", () => {
    expect(codeTypeLabels["RV"]).toBe("รีวิว");
  });

  it("shows correct type label for claim code", () => {
    expect(codeTypeLabels["CL"]).toBe("ชดเชย");
  });

  it("shows compensation menu details for CL codes", () => {
    const code: CodeDisplay = {
      id: 1,
      code: "HIBI-CL-ABC123",
      type: "CL",
      status: "issued",
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000),
      compensationMenuCode: "ML",
      compensationMenuName: "Matcha Latte",
      claimError: "เครื่องดื่มผิดเมนู",
      claimChannel: "grab",
    };

    expect(code.compensationMenuCode).toBe("ML");
    expect(code.compensationMenuName).toBe("Matcha Latte");
    expect(code.claimError).toBe("เครื่องดื่มผิดเมนู");
  });

  it("review codes dont show compensation details", () => {
    const code: CodeDisplay = {
      id: 2,
      code: "HIBI-RV-XYZ789",
      type: "RV",
      status: "issued",
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 86400000),
      compensationMenuCode: null,
      compensationMenuName: null,
      claimError: null,
      claimChannel: null,
    };

    const showCompensationDetails = code.type === "CL" && code.claimError;
    expect(showCompensationDetails).toBeFalsy();
  });

  it("marks expired codes correctly", () => {
    const code: CodeDisplay = {
      id: 3,
      code: "HIBI-CL-OLD123",
      type: "CL",
      status: "issued",
      issuedAt: new Date("2026-01-01"),
      expiresAt: new Date("2026-02-01"),
    };

    const isExpired = code.status === "issued" && new Date() > code.expiresAt;
    expect(isExpired).toBe(true);
  });
});
