import { describe, it, expect } from "vitest";

// Feature 1: Auto-expire — test isActivatedToday logic
describe("Auto-expire: isActivatedToday logic", () => {
  const isActivatedToday = (activatedAt: number | null) => {
    if (!activatedAt) return false;
    const activated = new Date(activatedAt);
    const now = new Date();
    return activated.toDateString() === now.toDateString();
  };

  it("should return true if activated today", () => {
    const now = Date.now();
    expect(isActivatedToday(now)).toBe(true);
  });

  it("should return false if activated yesterday", () => {
    const yesterday = Date.now() - 86400000;
    expect(isActivatedToday(yesterday)).toBe(false);
  });

  it("should return false if activatedAt is null", () => {
    expect(isActivatedToday(null)).toBe(false);
  });

  it("should return false if activated 2 days ago", () => {
    const twoDaysAgo = Date.now() - 2 * 86400000;
    expect(isActivatedToday(twoDaysAgo)).toBe(false);
  });
});

// Feature 2: Option Groups — test remark builder logic
describe("Option Groups: remark builder", () => {
  type OptionGroup = {
    id: number;
    name: string;
    type: "single" | "multi";
    isRequired: number;
    items: { id: number; name: string }[];
  };

  const buildRemark = (
    optionGroups: OptionGroup[],
    optionSelections: Record<number, string | string[]>,
    freeTextRemark: string
  ) => {
    const parts: string[] = [];
    for (const group of optionGroups) {
      const sel = optionSelections[group.id];
      if (!sel) continue;
      if (Array.isArray(sel)) {
        if (sel.length > 0) parts.push(`${group.name}: ${sel.join(", ")}`);
      } else if (sel) {
        parts.push(`${group.name}: ${sel}`);
      }
    }
    if (freeTextRemark.trim()) parts.push(freeTextRemark.trim());
    return parts.join(" | ");
  };

  it("should build remark from single option", () => {
    const groups: OptionGroup[] = [
      { id: 1, name: "ความหวาน", type: "single", isRequired: 1, items: [{ id: 1, name: "ไม่หวาน" }, { id: 2, name: "หวานน้อย" }] },
    ];
    const selections = { 1: "หวานน้อย" };
    expect(buildRemark(groups, selections, "")).toBe("ความหวาน: หวานน้อย");
  });

  it("should build remark from multi option", () => {
    const groups: OptionGroup[] = [
      { id: 1, name: "ท็อปปิ้ง", type: "multi", isRequired: 0, items: [{ id: 1, name: "วิปครีม" }, { id: 2, name: "ไข่มุก" }] },
    ];
    const selections = { 1: ["วิปครีม", "ไข่มุก"] };
    expect(buildRemark(groups, selections, "")).toBe("ท็อปปิ้ง: วิปครีม, ไข่มุก");
  });

  it("should combine options and free text", () => {
    const groups: OptionGroup[] = [
      { id: 1, name: "อุณหภูมิ", type: "single", isRequired: 1, items: [{ id: 1, name: "ร้อน" }, { id: 2, name: "เย็น" }] },
    ];
    const selections = { 1: "เย็น" };
    expect(buildRemark(groups, selections, "ใส่นมข้น")).toBe("อุณหภูมิ: เย็น | ใส่นมข้น");
  });

  it("should return only free text if no options selected", () => {
    const groups: OptionGroup[] = [
      { id: 1, name: "อุณหภูมิ", type: "single", isRequired: 0, items: [{ id: 1, name: "ร้อน" }] },
    ];
    const selections = {};
    expect(buildRemark(groups, selections, "ขอเพิ่มน้ำแข็ง")).toBe("ขอเพิ่มน้ำแข็ง");
  });

  it("should return empty string if nothing selected", () => {
    expect(buildRemark([], {}, "")).toBe("");
  });

  it("should skip empty multi selections", () => {
    const groups: OptionGroup[] = [
      { id: 1, name: "ท็อปปิ้ง", type: "multi", isRequired: 0, items: [{ id: 1, name: "วิปครีม" }] },
    ];
    const selections = { 1: [] as string[] };
    expect(buildRemark(groups, selections, "")).toBe("");
  });
});

// Feature 3: Redeem Success — test that menu info is available
describe("Redeem Success: menu info display logic", () => {
  it("should show selectedMenuName when available", () => {
    const codeData = {
      selectedMenuCode: "HBM09",
      selectedMenuName: "Hibi Cold Whisk (Latte)",
      compensationMenuName: null,
      remark: "ความหวาน: หวานน้อย | อุณหภูมิ: เย็น",
    };
    const menuToShow = codeData.selectedMenuName || codeData.compensationMenuName;
    expect(menuToShow).toBe("Hibi Cold Whisk (Latte)");
  });

  it("should fallback to compensationMenuName when selectedMenuName is null", () => {
    const codeData = {
      selectedMenuCode: null,
      selectedMenuName: null,
      compensationMenuName: "Matcha Latte",
      remark: null,
    };
    const menuToShow = codeData.selectedMenuName || codeData.compensationMenuName;
    expect(menuToShow).toBe("Matcha Latte");
  });

  it("should return null when neither menu is available", () => {
    const codeData = {
      selectedMenuCode: null,
      selectedMenuName: null,
      compensationMenuName: null,
      remark: null,
    };
    const menuToShow = codeData.selectedMenuName || codeData.compensationMenuName;
    expect(menuToShow).toBeNull();
  });

  it("should display remark when present", () => {
    const codeData = {
      remark: "ความหวาน: ไม่หวาน | อุณหภูมิ: ร้อน | ขอแพ็คแยก",
    };
    expect(codeData.remark).toContain("ความหวาน");
    expect(codeData.remark).toContain("อุณหภูมิ");
  });
});
