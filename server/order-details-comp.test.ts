import { describe, it, expect } from "vitest";

// ── Test: orderDetails field in order issue submission ──
describe("Order Details field validation", () => {
  interface OrderIssueInput {
    branchId: number;
    deliveryApp: "shopee" | "lineman" | "grab" | "gpos" | "walk_in";
    orderId?: string;
    orderDetails?: string;
    category: string;
    description: string;
  }

  function validateOrderIssue(input: OrderIssueInput): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!input.branchId) errors.push("กรุณาเลือกสาขา");
    if (!input.deliveryApp) errors.push("กรุณาเลือกช่องทาง");
    // orderId required for non-walk_in
    if (input.deliveryApp !== "walk_in" && (!input.orderId || !input.orderId.trim())) {
      errors.push("กรุณากรอกเลขออเดอร์");
    }
    if (!input.category) errors.push("กรุณาเลือกประเภทปัญหา");
    if (!input.description || input.description.length < 10) {
      errors.push("กรุณาอธิบายปัญหาอย่างน้อย 10 ตัวอักษร");
    }
    return { valid: errors.length === 0, errors };
  }

  it("accepts submission with orderDetails for Shopee", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "shopee",
      orderId: "2966366660490752985",
      orderDetails: "Matcha Latte เย็น 1 แก้ว, Hojicha ร้อน 1 แก้ว",
      category: "wrong_order",
      description: "ได้เมนูผิดจากที่สั่ง ต้องการ matcha latte แต่ได้ green tea",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts submission with orderDetails for LINE MAN", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "lineman",
      orderId: "LMF-260218-234745909",
      orderDetails: "Matcha Frappe 2 แก้ว",
      category: "missing_item",
      description: "ของขาดไม่ครบตามที่สั่ง ขาดไป 1 แก้ว matcha frappe",
    });
    expect(result.valid).toBe(true);
  });

  it("accepts submission with orderDetails for Grab", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "grab",
      orderId: "A-9WERMBQGW4SJAV",
      orderDetails: "Genmaicha Latte 1 แก้ว, ขนม Mochi 2 ชิ้น",
      category: "quality",
      description: "เครื่องดื่มรสชาติไม่ดี ไม่เหมือนที่เคยสั่ง",
    });
    expect(result.valid).toBe(true);
  });

  it("accepts submission with orderDetails for GPOS", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "gpos",
      orderId: "0105536123457",
      orderDetails: "Matcha Latte ร้อน 1 แก้ว",
      category: "wrong_order",
      description: "สั่ง Matcha Latte ร้อน แต่ได้เย็น",
    });
    expect(result.valid).toBe(true);
  });

  it("accepts submission with orderDetails for walk_in (no orderId required)", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "walk_in",
      orderDetails: "Matcha Latte เย็น 1 แก้ว",
      category: "quality",
      description: "เครื่องดื่มรสชาติไม่ดี ไม่เหมือนที่เคยสั่ง",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects Shopee submission without orderId", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "shopee",
      orderDetails: "Matcha Latte เย็น 1 แก้ว",
      category: "wrong_order",
      description: "ได้เมนูผิดจากที่สั่ง ต้องการ matcha latte แต่ได้ green tea",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("กรุณากรอกเลขออเดอร์");
  });

  it("rejects Grab submission without orderId", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "grab",
      orderDetails: "Hojicha 1 แก้ว",
      category: "damaged",
      description: "สินค้าเสียหายระหว่างจัดส่ง แก้วแตก",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("กรุณากรอกเลขออเดอร์");
  });

  it("rejects LINE MAN submission without orderId", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "lineman",
      orderDetails: "Matcha Frappe 1 แก้ว",
      category: "late_delivery",
      description: "จัดส่งล่าช้ามากกว่า 1 ชั่วโมง",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("กรุณากรอกเลขออเดอร์");
  });

  it("rejects GPOS submission without orderId", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "gpos",
      orderDetails: "Matcha Latte ร้อน 1 แก้ว",
      category: "wrong_order",
      description: "สั่ง Matcha Latte ร้อน แต่ได้เย็น",
    });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain("กรุณากรอกเลขออเดอร์");
  });

  it("accepts walk_in without orderId and without orderDetails", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "walk_in",
      category: "other",
      description: "มีปัญหาเรื่องบริการ พนักงานไม่สุภาพ",
    });
    expect(result.valid).toBe(true);
  });

  it("accepts submission without orderDetails (optional)", () => {
    const result = validateOrderIssue({
      branchId: 1,
      deliveryApp: "shopee",
      orderId: "2966366660490752985",
      category: "wrong_order",
      description: "ได้เมนูผิดจากที่สั่ง ต้องการ matcha latte แต่ได้ green tea",
    });
    expect(result.valid).toBe(true);
  });
});

// ── Test: Compensation code from order issue (auto-fill) ──
describe("Compensation code auto-fill from order issue", () => {
  interface OrderIssue {
    id: number;
    customerId: number;
    branchId: number;
    deliveryApp: string;
    orderId: string | null;
    orderDetails: string | null;
    category: string;
    description: string;
    customerName?: string;
    customerPhone?: string;
  }

  interface CompensationInput {
    branchId: number;
    claimChannel: string;
    claimOrderId?: string;
    claimOrderDetail?: string;
    claimError: string;
    compensationMenuCode?: string;
    compensationMenuName?: string;
    customerId?: number;
    customerPhone?: string;
    expiryDays: number;
  }

  function buildCompensationFromIssue(issue: OrderIssue): CompensationInput {
    return {
      branchId: issue.branchId,
      claimChannel: issue.deliveryApp,
      claimOrderId: issue.orderId || undefined,
      claimOrderDetail: issue.orderDetails || undefined,
      claimError: issue.description,
      customerId: issue.customerId || undefined,
      customerPhone: issue.customerPhone || undefined,
      expiryDays: 30,
    };
  }

  const sampleIssue: OrderIssue = {
    id: 1,
    customerId: 42,
    branchId: 1,
    deliveryApp: "shopee",
    orderId: "2966366660490752985",
    orderDetails: "Matcha Latte เย็น 1 แก้ว, Hojicha ร้อน 1 แก้ว",
    category: "wrong_order",
    description: "ได้เมนูผิดจากที่สั่ง ต้องการ matcha latte แต่ได้ green tea",
    customerName: "สมชาย",
    customerPhone: "0812345678",
  };

  it("auto-fills branchId from issue", () => {
    const comp = buildCompensationFromIssue(sampleIssue);
    expect(comp.branchId).toBe(sampleIssue.branchId);
  });

  it("auto-fills claimChannel from issue deliveryApp", () => {
    const comp = buildCompensationFromIssue(sampleIssue);
    expect(comp.claimChannel).toBe("shopee");
  });

  it("auto-fills claimOrderId from issue orderId", () => {
    const comp = buildCompensationFromIssue(sampleIssue);
    expect(comp.claimOrderId).toBe("2966366660490752985");
  });

  it("auto-fills claimOrderDetail from issue orderDetails", () => {
    const comp = buildCompensationFromIssue(sampleIssue);
    expect(comp.claimOrderDetail).toBe("Matcha Latte เย็น 1 แก้ว, Hojicha ร้อน 1 แก้ว");
  });

  it("auto-fills claimError from issue description", () => {
    const comp = buildCompensationFromIssue(sampleIssue);
    expect(comp.claimError).toBe(sampleIssue.description);
  });

  it("auto-fills customerId from issue", () => {
    const comp = buildCompensationFromIssue(sampleIssue);
    expect(comp.customerId).toBe(42);
  });

  it("auto-fills customerPhone from issue", () => {
    const comp = buildCompensationFromIssue(sampleIssue);
    expect(comp.customerPhone).toBe("0812345678");
  });

  it("handles issue without orderId (walk_in)", () => {
    const walkInIssue: OrderIssue = {
      ...sampleIssue,
      deliveryApp: "walk_in",
      orderId: null,
      orderDetails: "Matcha Latte เย็น 1 แก้ว",
    };
    const comp = buildCompensationFromIssue(walkInIssue);
    expect(comp.claimOrderId).toBeUndefined();
    expect(comp.claimOrderDetail).toBe("Matcha Latte เย็น 1 แก้ว");
    expect(comp.claimChannel).toBe("walk_in");
  });

  it("handles issue without orderDetails", () => {
    const noDetailsIssue: OrderIssue = {
      ...sampleIssue,
      orderDetails: null,
    };
    const comp = buildCompensationFromIssue(noDetailsIssue);
    expect(comp.claimOrderDetail).toBeUndefined();
  });

  it("sets default expiryDays to 30", () => {
    const comp = buildCompensationFromIssue(sampleIssue);
    expect(comp.expiryDays).toBe(30);
  });
});
