import { describe, it, expect } from "vitest";

// ── Test: Bug fix - auto-fill compensation menu from claim menu (same_menu mode) ──
describe("Auto-fill compensation menu from claim menu (same_menu mode)", () => {
  function resolveCompensation(input: {
    compensationMenuCode?: string;
    compensationMenuName?: string;
    claimMenuCode?: string;
    claimMenuName?: string;
  }) {
    const finalCompMenuCode = input.compensationMenuCode || input.claimMenuCode || null;
    const finalCompMenuName = input.compensationMenuName || input.claimMenuName || null;
    return { finalCompMenuCode, finalCompMenuName };
  }

  it("auto-fills from claim menu when compensation is empty (same_menu mode)", () => {
    const result = resolveCompensation({
      claimMenuCode: "HBC01M10C",
      claimMenuName: "Clear Matcha Saemidori",
    });
    expect(result.finalCompMenuCode).toBe("HBC01M10C");
    expect(result.finalCompMenuName).toBe("Clear Matcha Saemidori");
  });

  it("uses explicit compensation menu when provided (select/custom mode)", () => {
    const result = resolveCompensation({
      claimMenuCode: "HBC01M10C",
      claimMenuName: "Clear Matcha Saemidori",
      compensationMenuCode: "M05",
      compensationMenuName: "Matcha Latte",
    });
    expect(result.finalCompMenuCode).toBe("M05");
    expect(result.finalCompMenuName).toBe("Matcha Latte");
  });

  it("returns null when both claim and compensation are empty", () => {
    const result = resolveCompensation({});
    expect(result.finalCompMenuCode).toBeNull();
    expect(result.finalCompMenuName).toBeNull();
  });

  it("handles partial data (only name, no code)", () => {
    const result = resolveCompensation({
      claimMenuName: "Matcha Latte",
    });
    expect(result.finalCompMenuCode).toBeNull();
    expect(result.finalCompMenuName).toBe("Matcha Latte");
  });
});

// ── Test: copyText includes orderId + orderDate ──
describe("copyText includes orderId and orderDate", () => {
  function buildCopyText(input: {
    code: string;
    finalCompMenuCode: string | null;
    finalCompMenuName: string | null;
    compensationRemark?: string;
    claimOrderId?: string;
    orderDate?: string;
    claimError: string;
  }) {
    const compParts: string[] = [];
    if (input.finalCompMenuCode) compParts.push(input.finalCompMenuCode);
    if (input.finalCompMenuName) compParts.push(input.finalCompMenuName);
    const compText = compParts.length > 0 ? compParts.join(" - ") : "ไม่ระบุ";
    const remarkText = input.compensationRemark ? " (" + input.compensationRemark + ")" : "";
    const orderIdText = input.claimOrderId ? " | เลขออเดอร์: " + input.claimOrderId : "";
    const orderDateText = input.orderDate ? " | วันที่สั่ง: " + new Date(input.orderDate).toLocaleDateString("th-TH") : "";
    return input.code + " | เมนูชดเชย: " + compText + remarkText + orderIdText + orderDateText + " | สาเหตุ: " + input.claimError;
  }

  it("includes orderId in copyText", () => {
    const text = buildCopyText({
      code: "HIBI-CL-TEST01",
      finalCompMenuCode: "M01",
      finalCompMenuName: "Matcha Latte",
      claimOrderId: "GF-677",
      claimError: "ทำผิดเมนู",
    });
    expect(text).toContain("เลขออเดอร์: GF-677");
    expect(text).toContain("M01 - Matcha Latte");
  });

  it("includes orderDate in copyText", () => {
    const text = buildCopyText({
      code: "HIBI-CL-TEST02",
      finalCompMenuCode: null,
      finalCompMenuName: "Hojicha",
      orderDate: "2026-03-27",
      claimError: "ใส่น้ำตาลผิด",
    });
    expect(text).toContain("วันที่สั่ง:");
    expect(text).toContain("Hojicha");
  });

  it("includes both orderId and orderDate", () => {
    const text = buildCopyText({
      code: "HIBI-CL-TEST03",
      finalCompMenuCode: "HBC01",
      finalCompMenuName: "Clear Matcha",
      compensationRemark: "หวานน้อย เย็น",
      claimOrderId: "LM-12345",
      orderDate: "2026-03-25",
      claimError: "หกระหว่างทาง",
    });
    expect(text).toContain("เลขออเดอร์: LM-12345");
    expect(text).toContain("วันที่สั่ง:");
    expect(text).toContain("(หวานน้อย เย็น)");
    expect(text).toContain("HBC01 - Clear Matcha");
  });

  it("omits orderId and orderDate when not provided", () => {
    const text = buildCopyText({
      code: "HIBI-CL-TEST04",
      finalCompMenuCode: null,
      finalCompMenuName: null,
      claimError: "ไม่ได้รับออเดอร์",
    });
    expect(text).not.toContain("เลขออเดอร์:");
    expect(text).not.toContain("วันที่สั่ง:");
    expect(text).toContain("ไม่ระบุ");
  });
});

// ── Test: CreateClaim orderId validation ──
describe("CreateClaim orderId validation", () => {
  function validateCreateClaim(input: {
    claimChannel: string;
    claimOrderId?: string;
    claimError: string;
    customerPhone?: string;
  }): { valid: boolean; error?: string } {
    if (!input.claimChannel) return { valid: false, error: "กรุณาเลือกช่องทาง" };
    if (input.claimChannel !== "walk_in" && (!input.claimOrderId || !input.claimOrderId.trim())) {
      return { valid: false, error: "กรุณากรอกเลขออเดอร์" };
    }
    if (!input.claimError.trim()) return { valid: false, error: "กรุณาระบุความผิดพลาด" };
    if (!input.customerPhone) return { valid: false, error: "กรุณาระบุลูกค้า" };
    return { valid: true };
  }

  it("requires orderId for Shopee", () => {
    const result = validateCreateClaim({ claimChannel: "shopee", claimError: "ทำผิด", customerPhone: "0812345678" });
    expect(result.valid).toBe(false);
    expect(result.error).toContain("เลขออเดอร์");
  });

  it("requires orderId for Grab", () => {
    const result = validateCreateClaim({ claimChannel: "grab", claimError: "ทำผิด", customerPhone: "0812345678" });
    expect(result.valid).toBe(false);
  });

  it("requires orderId for LINE MAN", () => {
    const result = validateCreateClaim({ claimChannel: "lineman", claimError: "ทำผิด", customerPhone: "0812345678" });
    expect(result.valid).toBe(false);
  });

  it("does not require orderId for walk_in", () => {
    const result = validateCreateClaim({ claimChannel: "walk_in", claimError: "ทำผิดเมนู", customerPhone: "0812345678" });
    expect(result.valid).toBe(true);
  });

  it("passes with orderId for Shopee", () => {
    const result = validateCreateClaim({ claimChannel: "shopee", claimOrderId: "SP-12345", claimError: "ทำผิดเมนู", customerPhone: "0812345678" });
    expect(result.valid).toBe(true);
  });
});

// ── Test: Code update validation ──
describe("Code update validation", () => {
  function buildUpdateData(input: {
    claimOrderId?: string;
    orderDate?: string;
    claimMenuCode?: string;
    claimMenuName?: string;
    compensationMenuCode?: string;
    compensationMenuName?: string;
    compensationRemark?: string;
    expiryDays?: number;
  }) {
    const updateData: Record<string, any> = {};
    if (input.claimOrderId !== undefined) updateData.claimOrderId = input.claimOrderId || null;
    if (input.claimMenuCode !== undefined) updateData.claimMenuCode = input.claimMenuCode || null;
    if (input.claimMenuName !== undefined) updateData.claimMenuName = input.claimMenuName || null;
    if (input.compensationMenuCode !== undefined) updateData.compensationMenuCode = input.compensationMenuCode || null;
    if (input.compensationMenuName !== undefined) updateData.compensationMenuName = input.compensationMenuName || null;
    if (input.compensationRemark !== undefined) updateData.compensationRemark = input.compensationRemark || null;
    if (input.orderDate !== undefined) updateData.orderDate = input.orderDate ? new Date(input.orderDate) : null;
    if (input.expiryDays !== undefined) {
      updateData.expiryDays = input.expiryDays;
      // Simulate recalculate expiresAt
      const issuedAt = new Date("2026-03-20");
      const newExpires = new Date(issuedAt);
      newExpires.setDate(newExpires.getDate() + input.expiryDays);
      updateData.expiresAt = newExpires;
    }
    return updateData;
  }

  it("updates compensation menu code and name", () => {
    const data = buildUpdateData({
      compensationMenuCode: "M05",
      compensationMenuName: "Matcha Latte",
    });
    expect(data.compensationMenuCode).toBe("M05");
    expect(data.compensationMenuName).toBe("Matcha Latte");
  });

  it("updates orderDate correctly", () => {
    const data = buildUpdateData({ orderDate: "2026-03-25" });
    expect(data.orderDate).toBeInstanceOf(Date);
    expect(data.orderDate.toISOString()).toContain("2026-03-25");
  });

  it("clears orderDate when empty string", () => {
    const data = buildUpdateData({ orderDate: "" });
    expect(data.orderDate).toBeNull();
  });

  it("recalculates expiresAt when expiryDays changes", () => {
    const data = buildUpdateData({ expiryDays: 60 });
    expect(data.expiryDays).toBe(60);
    expect(data.expiresAt).toBeInstanceOf(Date);
    // 2026-03-20 + 60 days = 2026-05-19
    expect(data.expiresAt.toISOString()).toContain("2026-05-19");
  });

  it("updates remark", () => {
    const data = buildUpdateData({ compensationRemark: "หวานน้อย เย็น ไซส์ L" });
    expect(data.compensationRemark).toBe("หวานน้อย เย็น ไซส์ L");
  });

  it("clears remark when empty", () => {
    const data = buildUpdateData({ compensationRemark: "" });
    expect(data.compensationRemark).toBeNull();
  });

  it("only includes provided fields", () => {
    const data = buildUpdateData({ claimOrderId: "GF-999" });
    expect(data.claimOrderId).toBe("GF-999");
    expect(data.claimMenuCode).toBeUndefined();
    expect(data.compensationMenuCode).toBeUndefined();
  });
});
