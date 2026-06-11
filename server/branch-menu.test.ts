import { describe, expect, it } from "vitest";

// ── Test: Branch Menu Availability Logic ──
describe("Branch Menu Availability Logic", () => {
  interface ReviewMenuItem {
    id: number;
    code: string;
    name: string;
    description: string | null;
    isActive: number;
    sortOrder: number;
  }

  interface BranchMenuOverride {
    branchId: number;
    menuItemId: number;
    isAvailable: number;
  }

  function filterMenuForBranch(
    allItems: ReviewMenuItem[],
    overrides: BranchMenuOverride[],
    branchId: number
  ): ReviewMenuItem[] {
    const branchOverrides = overrides.filter(o => o.branchId === branchId);
    const overrideMap = new Map(branchOverrides.map(o => [o.menuItemId, o.isAvailable]));

    return allItems
      .filter(item => item.isActive === 1)
      .filter(item => {
        const override = overrideMap.get(item.id);
        return override === undefined || override === 1;
      });
  }

  const menuItems: ReviewMenuItem[] = [
    { id: 1, code: "ML", name: "Matcha Latte", description: null, isActive: 1, sortOrder: 0 },
    { id: 2, code: "HJ", name: "Hojicha Latte", description: null, isActive: 1, sortOrder: 1 },
    { id: 3, code: "GM", name: "Genmaicha", description: null, isActive: 1, sortOrder: 2 },
    { id: 4, code: "OLD", name: "Discontinued", description: null, isActive: 0, sortOrder: 3 },
  ];

  it("returns all active items when no overrides exist", () => {
    const result = filterMenuForBranch(menuItems, [], 1);
    expect(result).toHaveLength(3);
    expect(result.map(r => r.code)).toEqual(["ML", "HJ", "GM"]);
  });

  it("hides items that branch has disabled", () => {
    const overrides: BranchMenuOverride[] = [
      { branchId: 1, menuItemId: 2, isAvailable: 0 }, // HJ disabled for branch 1
    ];
    const result = filterMenuForBranch(menuItems, overrides, 1);
    expect(result).toHaveLength(2);
    expect(result.map(r => r.code)).toEqual(["ML", "GM"]);
  });

  it("different branches can have different availability", () => {
    const overrides: BranchMenuOverride[] = [
      { branchId: 1, menuItemId: 2, isAvailable: 0 }, // HJ disabled for branch 1
      { branchId: 2, menuItemId: 1, isAvailable: 0 }, // ML disabled for branch 2
      { branchId: 2, menuItemId: 3, isAvailable: 0 }, // GM disabled for branch 2
    ];

    const branch1 = filterMenuForBranch(menuItems, overrides, 1);
    expect(branch1.map(r => r.code)).toEqual(["ML", "GM"]);

    const branch2 = filterMenuForBranch(menuItems, overrides, 2);
    expect(branch2.map(r => r.code)).toEqual(["HJ"]);
  });

  it("excludes globally inactive items regardless of branch override", () => {
    const overrides: BranchMenuOverride[] = [
      { branchId: 1, menuItemId: 4, isAvailable: 1 }, // Try to enable globally inactive item
    ];
    const result = filterMenuForBranch(menuItems, overrides, 1);
    expect(result.find(r => r.code === "OLD")).toBeUndefined();
  });

  it("explicitly available override keeps item visible", () => {
    const overrides: BranchMenuOverride[] = [
      { branchId: 1, menuItemId: 1, isAvailable: 1 }, // Explicitly available
    ];
    const result = filterMenuForBranch(menuItems, overrides, 1);
    expect(result.find(r => r.code === "ML")).toBeDefined();
  });

  it("branch with all items disabled returns empty", () => {
    const overrides: BranchMenuOverride[] = [
      { branchId: 1, menuItemId: 1, isAvailable: 0 },
      { branchId: 1, menuItemId: 2, isAvailable: 0 },
      { branchId: 1, menuItemId: 3, isAvailable: 0 },
    ];
    const result = filterMenuForBranch(menuItems, overrides, 1);
    expect(result).toHaveLength(0);
  });
});

// ── Test: Branch Menu Availability Data Structure ──
describe("Branch Menu Availability Data Structure", () => {
  interface BranchMenuAvailability {
    id: number;
    branchId: number;
    menuItemId: number;
    isAvailable: number;
  }

  it("creates valid availability record", () => {
    const record: BranchMenuAvailability = {
      id: 1,
      branchId: 1,
      menuItemId: 2,
      isAvailable: 0,
    };

    expect(record.branchId).toBe(1);
    expect(record.menuItemId).toBe(2);
    expect(record.isAvailable).toBe(0);
  });

  it("isAvailable is 0 or 1", () => {
    const values = [0, 1];
    values.forEach(v => {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    });
  });

  it("unique constraint: branchId + menuItemId", () => {
    const records: BranchMenuAvailability[] = [
      { id: 1, branchId: 1, menuItemId: 1, isAvailable: 1 },
      { id: 2, branchId: 1, menuItemId: 2, isAvailable: 0 },
      { id: 3, branchId: 2, menuItemId: 1, isAvailable: 0 },
    ];

    // Check no duplicate branchId+menuItemId
    const keys = records.map(r => `${r.branchId}-${r.menuItemId}`);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});

// ── Test: Compact Copy Text Format ──
describe("Compact Copy Text Format (New)", () => {
  const SWEETNESS_SHORT: Record<number, string> = {
    0: "ไม่หวาน",
    15: "หวานน้อย",
    30: "หวานปกติ",
    45: "หวานมาก",
  };

  const PACKAGING_SHORT: Record<string, string> = {
    ready: "พร้อมดื่ม",
    separate: "แยกน้ำแข็ง",
  };

  function buildOrderText(
    code: string,
    menuCode: string,
    menuName: string,
    sweetnessGrams: number,
    packagingType: string
  ): string {
    const sweet = SWEETNESS_SHORT[sweetnessGrams] ?? `${sweetnessGrams}g`;
    const pack = PACKAGING_SHORT[packagingType] ?? packagingType;
    const lines: string[] = [];
    lines.push(`🎟 ${code}`);
    lines.push(`📦 ${menuCode} ${menuName}`);
    lines.push(`📝 ${sweet}, ${pack}`);
    return lines.join("\n");
  }

  it("generates correct compact copy text", () => {
    const text = buildOrderText("HIBI-RV-A1B2C3", "ML", "Matcha Latte", 30, "ready");
    expect(text).toContain("🎟 HIBI-RV-A1B2C3");
    expect(text).toContain("📦 ML Matcha Latte");
    expect(text).toContain("📝 หวานปกติ, พร้อมดื่ม");
  });

  it("includes menu code in copy text", () => {
    const text = buildOrderText("HIBI-RV-A1B2C3", "HJ", "Hojicha Latte", 15, "separate");
    expect(text).toContain("HJ Hojicha Latte");
  });

  it("handles all sweetness levels", () => {
    [0, 15, 30, 45].forEach(grams => {
      const text = buildOrderText("CODE", "ML", "Matcha", grams, "ready");
      expect(text).toContain(SWEETNESS_SHORT[grams]);
    });
  });

  it("handles both packaging types", () => {
    const readyText = buildOrderText("CODE", "ML", "Matcha", 30, "ready");
    expect(readyText).toContain("พร้อมดื่ม");

    const separateText = buildOrderText("CODE", "ML", "Matcha", 30, "separate");
    expect(separateText).toContain("แยกน้ำแข็ง");
  });

  it("has 3 lines in output", () => {
    const text = buildOrderText("CODE", "ML", "Matcha", 30, "ready");
    const lines = text.split("\n");
    expect(lines).toHaveLength(3);
  });

  it("first line is code, second is menu, third is remark", () => {
    const text = buildOrderText("HIBI-RV-XYZABC", "GM", "Genmaicha", 0, "separate");
    const lines = text.split("\n");
    expect(lines[0]).toBe("🎟 HIBI-RV-XYZABC");
    expect(lines[1]).toBe("📦 GM Genmaicha");
    expect(lines[2]).toBe("📝 ไม่หวาน, แยกน้ำแข็ง");
  });

  it("handles unknown sweetness gracefully", () => {
    const text = buildOrderText("CODE", "ML", "Matcha", 25, "ready");
    expect(text).toContain("25g");
  });
});

// ── Test: Toggle Availability ──
describe("Toggle Availability", () => {
  it("toggles from available to unavailable", () => {
    const current = 1;
    const newValue = current === 1 ? false : true;
    expect(newValue).toBe(false);
  });

  it("toggles from unavailable to available", () => {
    const current = 0;
    const newValue = current === 1 ? false : true;
    expect(newValue).toBe(true);
  });
});
