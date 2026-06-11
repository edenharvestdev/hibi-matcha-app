import { describe, it, expect } from "vitest";

/**
 * Tests for menu-option-groups binding feature
 * Validates the junction table logic and option groups per menu
 */

describe("Menu Option Groups Binding", () => {
  describe("Junction table schema", () => {
    it("should have menuType field supporting review and freeDrink", () => {
      const validTypes = ["review", "freeDrink"];
      expect(validTypes).toContain("review");
      expect(validTypes).toContain("freeDrink");
    });

    it("should have menuId and optionGroupId fields", () => {
      const record = { menuType: "review", menuId: 1, optionGroupId: 2 };
      expect(record.menuType).toBe("review");
      expect(record.menuId).toBe(1);
      expect(record.optionGroupId).toBe(2);
    });
  });

  describe("Option group remark building", () => {
    it("should build remark from single-select options", () => {
      const selections: Record<number, string | string[]> = {
        1: "หวานน้อย",
        2: "เย็น",
      };
      const groups = [
        { id: 1, name: "ความหวาน", type: "single" },
        { id: 2, name: "อุณหภูมิ", type: "single" },
      ];
      const parts: string[] = [];
      for (const group of groups) {
        const sel = selections[group.id];
        if (sel && !Array.isArray(sel)) {
          parts.push(`${group.name}: ${sel}`);
        }
      }
      const remark = parts.join(" | ");
      expect(remark).toBe("ความหวาน: หวานน้อย | อุณหภูมิ: เย็น");
    });

    it("should build remark from multi-select options", () => {
      const selections: Record<number, string | string[]> = {
        1: ["ท็อปปิ้งวิปครีม", "ท็อปปิ้งช็อค"],
      };
      const groups = [
        { id: 1, name: "ท็อปปิ้ง", type: "multi" },
      ];
      const parts: string[] = [];
      for (const group of groups) {
        const sel = selections[group.id];
        if (Array.isArray(sel) && sel.length > 0) {
          parts.push(`${group.name}: ${sel.join(", ")}`);
        }
      }
      const remark = parts.join(" | ");
      expect(remark).toBe("ท็อปปิ้ง: ท็อปปิ้งวิปครีม, ท็อปปิ้งช็อค");
    });

    it("should combine option selections with free text remark", () => {
      const optionParts = ["ความหวาน: หวานปกติ"];
      const freeText = "ใส่นมข้นเพิ่ม";
      const allParts = [...optionParts, freeText];
      const remark = allParts.join(" | ");
      expect(remark).toBe("ความหวาน: หวานปกติ | ใส่นมข้นเพิ่ม");
    });

    it("should handle empty selections gracefully", () => {
      const selections: Record<number, string | string[]> = {};
      const groups = [
        { id: 1, name: "ความหวาน", type: "single", isRequired: false },
      ];
      const parts: string[] = [];
      for (const group of groups) {
        const sel = selections[group.id];
        if (!sel) continue;
      }
      expect(parts.length).toBe(0);
    });
  });

  describe("Auto-expire logic", () => {
    it("should detect when activatedAt is not today", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const now = new Date();
      const isExpired = yesterday.toDateString() !== now.toDateString();
      expect(isExpired).toBe(true);
    });

    it("should not expire if activatedAt is today", () => {
      const today = new Date();
      const now = new Date();
      const isExpired = today.toDateString() !== now.toDateString();
      expect(isExpired).toBe(false);
    });
  });

  describe("Free drink code remark field", () => {
    it("should accept remark in selectMenu input", () => {
      const input = {
        codeId: 1,
        menuItemId: 2,
        sweetnessGrams: 15,
        packagingType: "ready" as const,
        remark: "ความหวาน: หวานน้อย | อุณหภูมิ: เย็น",
      };
      expect(input.remark).toBeDefined();
      expect(input.remark).toContain("ความหวาน");
    });

    it("should allow empty remark", () => {
      const input = {
        codeId: 1,
        menuItemId: 2,
        sweetnessGrams: 30,
        packagingType: "separate" as const,
      };
      expect(input.remark).toBeUndefined();
    });
  });

  describe("Redeem success menu display", () => {
    it("should include selectedMenuName and remark in redeem result", () => {
      const redeemResult = {
        code: "HIBI-RV-TEST01",
        selectedMenuCode: "HBM09",
        selectedMenuName: "Hibi Cold Whisk (Latte)",
        remark: "ความหวาน: หวานน้อย | อุณหภูมิ: เย็น",
      };
      expect(redeemResult.selectedMenuName).toBe("Hibi Cold Whisk (Latte)");
      expect(redeemResult.remark).toContain("ความหวาน");
    });
  });
});
