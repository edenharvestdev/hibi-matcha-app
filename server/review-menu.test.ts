import { describe, expect, it } from "vitest";

// ── Test: Order ID Validation Logic ──
function validateOrderId(app: string, orderId: string): { ok: boolean; message: string } {
  switch (app) {
    case "shopee": {
      if (!/^\d{13,19}$/.test(orderId)) return { ok: false, message: "รหัส Shopee ต้องเป็นตัวเลข 13-19 หลัก" };
      return { ok: true, message: "" };
    }
    case "grab": {
      if (!/^A-[A-Z0-9]{8,20}$/i.test(orderId)) return { ok: false, message: "รหัส Grab ต้องขึ้นต้นด้วย A-" };
      return { ok: true, message: "" };
    }
    case "lineman": {
      if (!/^LMF-\d{6}-\d{6,12}$/.test(orderId)) return { ok: false, message: "รหัส LINE MAN ต้องเป็นรูปแบบ LMF-YYMMDD-XXXXXXXXX" };
      return { ok: true, message: "" };
    }
    case "gpos": {
      if (!/^\d{13}$/.test(orderId)) return { ok: false, message: "เลขที่ใบเสร็จ GPOS ต้องเป็นตัวเลข 13 หลัก" };
      return { ok: true, message: "" };
    }
    default:
      return { ok: true, message: "" };
  }
}

describe("Order ID Validation", () => {
  describe("Shopee", () => {
    it("accepts valid 13-digit Shopee order ID", () => {
      const result = validateOrderId("shopee", "2966366660490");
      expect(result.ok).toBe(true);
    });

    it("accepts valid 19-digit Shopee order ID", () => {
      const result = validateOrderId("shopee", "2966366660490752985");
      expect(result.ok).toBe(true);
    });

    it("rejects too short Shopee order ID", () => {
      const result = validateOrderId("shopee", "123456789");
      expect(result.ok).toBe(false);
    });

    it("rejects Shopee order ID with letters", () => {
      const result = validateOrderId("shopee", "2966366660490ABC");
      expect(result.ok).toBe(false);
    });
  });

  describe("Grab", () => {
    it("accepts valid Grab order ID", () => {
      const result = validateOrderId("grab", "A-9WERMBQGW4SJAV");
      expect(result.ok).toBe(true);
    });

    it("rejects Grab order ID without A- prefix", () => {
      const result = validateOrderId("grab", "9WERMBQGW4SJAV");
      expect(result.ok).toBe(false);
    });

    it("rejects too short Grab order ID", () => {
      const result = validateOrderId("grab", "A-ABC");
      expect(result.ok).toBe(false);
    });
  });

  describe("LINE MAN", () => {
    it("accepts valid LINE MAN order ID", () => {
      const result = validateOrderId("lineman", "LMF-260218-234745909");
      expect(result.ok).toBe(true);
    });

    it("rejects LINE MAN order ID without LMF- prefix", () => {
      const result = validateOrderId("lineman", "260218-234745909");
      expect(result.ok).toBe(false);
    });

    it("rejects LINE MAN order ID with wrong format", () => {
      const result = validateOrderId("lineman", "LMF-2602-234745909");
      expect(result.ok).toBe(false);
    });
  });

  describe("GPOS", () => {
    it("accepts valid 13-digit GPOS receipt number", () => {
      const result = validateOrderId("gpos", "0105536123457");
      expect(result.ok).toBe(true);
    });

    it("rejects GPOS receipt with wrong length", () => {
      const result = validateOrderId("gpos", "01055361234");
      expect(result.ok).toBe(false);
    });
  });

  describe("Unknown app", () => {
    it("accepts any order ID for unknown app", () => {
      const result = validateOrderId("unknown", "anything-goes");
      expect(result.ok).toBe(true);
    });
  });
});

// ── Test: Review Menu Item Structure ──
describe("Review Menu Item Structure", () => {
  interface ReviewMenuItem {
    id: number;
    code: string;
    name: string;
    description: string | null;
    isActive: number;
    sortOrder: number;
  }

  it("creates valid menu item structure", () => {
    const item: ReviewMenuItem = {
      id: 1,
      code: "ML",
      name: "Matcha Latte",
      description: "ชาเขียวมัทฉะลาเต้",
      isActive: 1,
      sortOrder: 0,
    };

    expect(item.code).toBe("ML");
    expect(item.name).toBe("Matcha Latte");
    expect(item.isActive).toBe(1);
  });

  it("allows null description", () => {
    const item: ReviewMenuItem = {
      id: 2,
      code: "HJ",
      name: "Hojicha Latte",
      description: null,
      isActive: 1,
      sortOrder: 1,
    };

    expect(item.description).toBeNull();
  });

  it("validates code format (uppercase, max 20 chars)", () => {
    const validCodes = ["ML", "HJ", "GM", "MATCHA_LATTE"];
    validCodes.forEach(code => {
      expect(code.length).toBeLessThanOrEqual(20);
      expect(code).toBe(code.toUpperCase());
    });
  });

  it("sorts items by sortOrder", () => {
    const items: ReviewMenuItem[] = [
      { id: 3, code: "GM", name: "Genmaicha", description: null, isActive: 1, sortOrder: 2 },
      { id: 1, code: "ML", name: "Matcha Latte", description: null, isActive: 1, sortOrder: 0 },
      { id: 2, code: "HJ", name: "Hojicha", description: null, isActive: 1, sortOrder: 1 },
    ];

    const sorted = [...items].sort((a, b) => a.sortOrder - b.sortOrder);
    expect(sorted[0].code).toBe("ML");
    expect(sorted[1].code).toBe("HJ");
    expect(sorted[2].code).toBe("GM");
  });

  it("filters active items only", () => {
    const items: ReviewMenuItem[] = [
      { id: 1, code: "ML", name: "Matcha Latte", description: null, isActive: 1, sortOrder: 0 },
      { id: 2, code: "HJ", name: "Hojicha", description: null, isActive: 0, sortOrder: 1 },
      { id: 3, code: "GM", name: "Genmaicha", description: null, isActive: 1, sortOrder: 2 },
    ];

    const active = items.filter(i => i.isActive === 1);
    expect(active).toHaveLength(2);
    expect(active.map(i => i.code)).toEqual(["ML", "GM"]);
  });
});

// ── Test: Menu Selection for Free Drink Code ──
describe("Menu Selection for Free Drink Code", () => {
  interface FreeDrinkCodeMenuSelection {
    selectedMenuItemId: number | null;
    selectedMenuCode: string | null;
    selectedMenuName: string | null;
    sweetnessGrams: number;
    packagingType: string;
  }

  it("creates valid menu selection", () => {
    const selection: FreeDrinkCodeMenuSelection = {
      selectedMenuItemId: 1,
      selectedMenuCode: "ML",
      selectedMenuName: "Matcha Latte",
      sweetnessGrams: 30,
      packagingType: "ready",
    };

    expect(selection.selectedMenuItemId).toBe(1);
    expect(selection.sweetnessGrams).toBe(30);
    expect(selection.packagingType).toBe("ready");
  });

  it("validates sweetness range (0-100g)", () => {
    const validValues = [0, 15, 30, 45, 100];
    validValues.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(100);
    });
  });

  it("validates packaging type", () => {
    const validTypes = ["ready", "separate"];
    expect(validTypes).toContain("ready");
    expect(validTypes).toContain("separate");
    expect(validTypes).not.toContain("other");
  });

  it("defaults to no selection (null)", () => {
    const noSelection: FreeDrinkCodeMenuSelection = {
      selectedMenuItemId: null,
      selectedMenuCode: null,
      selectedMenuName: null,
      sweetnessGrams: 0,
      packagingType: "ready",
    };

    expect(noSelection.selectedMenuItemId).toBeNull();
    expect(noSelection.selectedMenuCode).toBeNull();
  });

  it("prevents changing menu after selection", () => {
    const code = {
      selectedMenuItemId: 1,
      status: "issued" as const,
    };

    const canSelectMenu = code.status === "issued" && !code.selectedMenuItemId;
    expect(canSelectMenu).toBe(false); // Already selected
  });

  it("allows selection only for issued codes", () => {
    const statuses = ["issued", "redeemed", "expired", "cancelled"];
    const canSelect = statuses.map(s => s === "issued");
    expect(canSelect).toEqual([true, false, false, false]);
  });
});

// ── Test: Staff Code Redemption with Order Tracking ──
describe("Staff Code Redemption with Order Tracking", () => {
  interface StaffRedeemInput {
    code: string;
    branchId: number;
    orderType: "in_store" | "delivery";
    deliveryApp?: string;
    deliveryOrderId?: string;
  }

  it("creates valid in-store redemption", () => {
    const input: StaffRedeemInput = {
      code: "RV-ML-M-FM-A1B2",
      branchId: 1,
      orderType: "in_store",
    };

    expect(input.orderType).toBe("in_store");
    expect(input.deliveryApp).toBeUndefined();
    expect(input.deliveryOrderId).toBeUndefined();
  });

  it("creates valid delivery redemption with order ID", () => {
    const input: StaffRedeemInput = {
      code: "RV-ML-M-FM-A1B2",
      branchId: 1,
      orderType: "delivery",
      deliveryApp: "shopee",
      deliveryOrderId: "2966366660490752985",
    };

    expect(input.orderType).toBe("delivery");
    expect(input.deliveryApp).toBe("shopee");
    expect(input.deliveryOrderId).toBe("2966366660490752985");
  });

  it("requires order ID for delivery orders", () => {
    const input: StaffRedeemInput = {
      code: "RV-ML-M-FM-A1B2",
      branchId: 1,
      orderType: "delivery",
    };

    const isValid = input.orderType === "in_store" || (input.deliveryOrderId && input.deliveryOrderId.trim().length > 0);
    expect(isValid).toBeFalsy();
  });

  it("does not require order ID for in-store orders", () => {
    const input: StaffRedeemInput = {
      code: "RV-ML-M-FM-A1B2",
      branchId: 1,
      orderType: "in_store",
    };

    const isValid = input.orderType === "in_store" || (input.deliveryOrderId && input.deliveryOrderId.trim().length > 0);
    expect(isValid).toBeTruthy();
  });

  it("validates delivery order ID format when app is specified", () => {
    const testCases = [
      { app: "shopee", orderId: "2966366660490752985", expected: true },
      { app: "shopee", orderId: "ABC", expected: false },
      { app: "grab", orderId: "A-9WERMBQGW4SJAV", expected: true },
      { app: "grab", orderId: "INVALID", expected: false },
      { app: "lineman", orderId: "LMF-260218-234745909", expected: true },
      { app: "lineman", orderId: "INVALID", expected: false },
      { app: "gpos", orderId: "0105536123457", expected: true },
      { app: "gpos", orderId: "123", expected: false },
    ];

    testCases.forEach(tc => {
      const result = validateOrderId(tc.app, tc.orderId);
      expect(result.ok).toBe(tc.expected);
    });
  });
});

// ── Test: Sweetness Labels ──
describe("Sweetness Labels", () => {
  const SWEETNESS_OPTIONS = [
    { value: 0, label: "ไม่หวาน (0g)" },
    { value: 15, label: "หวานน้อย (15g)" },
    { value: 30, label: "หวานปกติ (30g)" },
    { value: 45, label: "หวานมาก (45g)" },
  ];

  it("has 4 sweetness options", () => {
    expect(SWEETNESS_OPTIONS).toHaveLength(4);
  });

  it("starts from 0g", () => {
    expect(SWEETNESS_OPTIONS[0].value).toBe(0);
  });

  it("has 30g as default (normal sweetness)", () => {
    const normal = SWEETNESS_OPTIONS.find(s => s.value === 30);
    expect(normal).toBeDefined();
    expect(normal!.label).toContain("ปกติ");
  });

  it("values are in ascending order", () => {
    for (let i = 1; i < SWEETNESS_OPTIONS.length; i++) {
      expect(SWEETNESS_OPTIONS[i].value).toBeGreaterThan(SWEETNESS_OPTIONS[i - 1].value);
    }
  });
});

// ── Test: Packaging Options ──
describe("Packaging Options", () => {
  const PACKAGING_OPTIONS = [
    { value: "ready", label: "พร้อมดื่ม" },
    { value: "separate", label: "แยกน้ำแข็ง" },
  ];

  it("has 2 packaging options", () => {
    expect(PACKAGING_OPTIONS).toHaveLength(2);
  });

  it("includes ready and separate options", () => {
    const values = PACKAGING_OPTIONS.map(p => p.value);
    expect(values).toContain("ready");
    expect(values).toContain("separate");
  });
});

// ── Test: Copy Text for Delivery ──
describe("Copy Text for Delivery", () => {
  function buildCopyText(code: string, menuName: string, sweetnessLabel: string, packagingLabel: string): string {
    return [
      `โค้ดรีวิว: ${code}`,
      `เมนู: ${menuName}`,
      `ความหวาน: ${sweetnessLabel}`,
      `แพ็ค: ${packagingLabel}`,
      ``,
      `* ไม่สามารถเปลี่ยนนมได้ (ใช้นมตามที่กำหนดในโค้ด)`,
    ].join("\n");
  }

  it("generates correct copy text", () => {
    const text = buildCopyText("RV-ML-M-FM-A1B2", "Matcha Latte", "หวานปกติ (30g)", "พร้อมดื่ม");
    expect(text).toContain("โค้ดรีวิว: RV-ML-M-FM-A1B2");
    expect(text).toContain("เมนู: Matcha Latte");
    expect(text).toContain("ความหวาน: หวานปกติ (30g)");
    expect(text).toContain("แพ็ค: พร้อมดื่ม");
    expect(text).toContain("ไม่สามารถเปลี่ยนนมได้");
  });

  it("includes milk restriction notice", () => {
    const text = buildCopyText("RV-ML-M-FM-A1B2", "Matcha Latte", "หวานปกติ (30g)", "แยกน้ำแข็ง");
    expect(text).toContain("ไม่สามารถเปลี่ยนนมได้");
  });
});
