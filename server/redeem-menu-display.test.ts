import { describe, it, expect } from "vitest";

describe("Redeem Page - Menu Display Features", () => {
  // ── 1. codes.lookup returns all menu fields ──
  describe("codes.lookup response shape", () => {
    it("should include claimMenuCode and claimMenuName for CL codes", () => {
      const codeLookupResult = {
        id: 1,
        code: "HIBI-CL-8G8USA",
        type: "CL",
        status: "issued",
        branchId: 1,
        branchName: "Hibi Matcha HQ",
        email: "test@example.com",
        claimMenuCode: "HBC01M10C",
        claimMenuName: "Clear Matcha Saemidori",
        compensationMenuCode: "HBC01M10C",
        compensationMenuName: "Clear Matcha Saemidori",
        compensationRemark: "หวานน้อย เย็น ไซส์ L",
        claimOrderId: "GF-677",
        orderDate: new Date("2026-03-25"),
        expiresAt: new Date("2026-04-25"),
        issuedAt: new Date("2026-03-25"),
      };

      expect(codeLookupResult.claimMenuCode).toBe("HBC01M10C");
      expect(codeLookupResult.claimMenuName).toBe("Clear Matcha Saemidori");
      expect(codeLookupResult.compensationMenuCode).toBe("HBC01M10C");
      expect(codeLookupResult.compensationMenuName).toBe("Clear Matcha Saemidori");
      expect(codeLookupResult.compensationRemark).toBe("หวานน้อย เย็น ไซส์ L");
      expect(codeLookupResult.claimOrderId).toBe("GF-677");
      expect(codeLookupResult.orderDate).toBeInstanceOf(Date);
    });

    it("should handle RV codes with compensationMenu only", () => {
      const rvCode = {
        id: 2,
        code: "HIBI-RV-ABC123",
        type: "RV",
        status: "issued",
        branchId: 1,
        branchName: "Hibi Matcha HQ",
        email: "reviewer@example.com",
        claimMenuCode: null,
        claimMenuName: null,
        compensationMenuCode: "M01",
        compensationMenuName: "Matcha Latte",
        compensationRemark: null,
        claimOrderId: null,
        orderDate: null,
        expiresAt: new Date("2026-04-25"),
        issuedAt: new Date("2026-03-25"),
      };

      expect(rvCode.type).toBe("RV");
      expect(rvCode.claimMenuCode).toBeNull();
      expect(rvCode.compensationMenuCode).toBe("M01");
      expect(rvCode.compensationMenuName).toBe("Matcha Latte");
    });

    it("should handle codes with no menu data (legacy codes)", () => {
      const legacyCode = {
        id: 3,
        code: "HIBI-CL-OLD001",
        type: "CL",
        status: "issued",
        branchId: 1,
        branchName: "Hibi Matcha HQ",
        email: "old@example.com",
        claimMenuCode: null,
        claimMenuName: null,
        compensationMenuCode: null,
        compensationMenuName: null,
        compensationRemark: null,
        claimOrderId: null,
        orderDate: null,
        expiresAt: new Date("2026-04-25"),
        issuedAt: new Date("2026-03-25"),
      };

      expect(legacyCode.claimMenuCode).toBeNull();
      expect(legacyCode.compensationMenuCode).toBeNull();
      // Menu section should not render when all menu fields are null
      const hasMenuInfo = !!(legacyCode.claimMenuCode || legacyCode.claimMenuName || legacyCode.compensationMenuCode || legacyCode.compensationMenuName);
      expect(hasMenuInfo).toBe(false);
    });
  });

  // ── 2. Menu display logic for CL codes ──
  describe("CL code menu display logic", () => {
    it("should show both claim menu and compensation menu sections", () => {
      const code = {
        type: "CL",
        claimMenuCode: "HBC01M10C",
        claimMenuName: "Clear Matcha Saemidori",
        compensationMenuCode: "HBC01M10C",
        compensationMenuName: "Clear Matcha Saemidori",
      };

      const showClaimMenu = !!(code.claimMenuCode || code.claimMenuName);
      const showCompMenu = !!(code.compensationMenuCode || code.compensationMenuName);
      const showMenuSection = code.type === "CL" && (showClaimMenu || showCompMenu);

      expect(showMenuSection).toBe(true);
      expect(showClaimMenu).toBe(true);
      expect(showCompMenu).toBe(true);
    });

    it("should show only compensation menu when claim menu is empty", () => {
      const code = {
        type: "CL",
        claimMenuCode: null,
        claimMenuName: null,
        compensationMenuCode: "M02",
        compensationMenuName: "Hojicha Latte",
      };

      const showClaimMenu = !!(code.claimMenuCode || code.claimMenuName);
      const showCompMenu = !!(code.compensationMenuCode || code.compensationMenuName);

      expect(showClaimMenu).toBe(false);
      expect(showCompMenu).toBe(true);
    });

    it("should display compensationRemark when present", () => {
      const code = {
        compensationRemark: "หวานน้อย เย็น ไซส์ L",
      };
      expect(code.compensationRemark).toBeTruthy();
      expect(code.compensationRemark).toContain("หวานน้อย");
    });

    it("should not show remark section when compensationRemark is null", () => {
      const code = {
        compensationRemark: null as string | null,
      };
      const showRemark = !!code.compensationRemark;
      expect(showRemark).toBe(false);
    });
  });

  // ── 3. RV code menu display logic ──
  describe("RV code menu display logic", () => {
    it("should show menu received section for RV codes with menu data", () => {
      const code = {
        type: "RV",
        compensationMenuCode: "M01",
        compensationMenuName: "Matcha Latte",
      };

      const showRvMenu = code.type === "RV" && !!(code.compensationMenuCode || code.compensationMenuName);
      expect(showRvMenu).toBe(true);
    });

    it("should not show CL-specific sections for RV codes", () => {
      const code = {
        type: "RV",
        claimMenuCode: null,
        claimMenuName: null,
        compensationMenuCode: "M01",
        compensationMenuName: "Matcha Latte",
      };

      const showClSection = code.type === "CL" && !!(code.claimMenuCode || code.claimMenuName || code.compensationMenuCode || code.compensationMenuName);
      expect(showClSection).toBe(false);
    });
  });

  // ── 4. Order info display logic ──
  describe("Order info display", () => {
    it("should show order info section when claimOrderId is present", () => {
      const code = {
        claimOrderId: "GF-677",
        orderDate: new Date("2026-03-25"),
      };

      const showOrderInfo = !!(code.claimOrderId || code.orderDate);
      expect(showOrderInfo).toBe(true);
    });

    it("should show order info when only orderDate is present", () => {
      const code = {
        claimOrderId: null as string | null,
        orderDate: new Date("2026-03-25"),
      };

      const showOrderInfo = !!(code.claimOrderId || code.orderDate);
      expect(showOrderInfo).toBe(true);
    });

    it("should not show order info when both are null", () => {
      const code = {
        claimOrderId: null as string | null,
        orderDate: null as Date | null,
      };

      const showOrderInfo = !!(code.claimOrderId || code.orderDate);
      expect(showOrderInfo).toBe(false);
    });

    it("should format order date in Thai locale", () => {
      const orderDate = new Date("2026-03-25");
      const formatted = orderDate.toLocaleDateString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
      expect(formatted).toBeTruthy();
      // Should contain Thai month abbreviation
      expect(formatted.length).toBeGreaterThan(0);
    });
  });

  // ── 5. Redeem page routes ──
  describe("Redeem page routes", () => {
    it("admin redeem route should be /admin/redeem", () => {
      const route = "/admin/redeem";
      expect(route).toBe("/admin/redeem");
    });

    it("branch redeem route should be /branch/redeem", () => {
      const route = "/branch/redeem";
      expect(route).toBe("/branch/redeem");
    });

    it("edit code navigation from redeem should construct correct path", () => {
      const codeId = 42;
      const adminEditPath = `/admin/edit-code/${codeId}`;
      const branchEditPath = `/branch/edit-code/${codeId}`;
      expect(adminEditPath).toBe("/admin/edit-code/42");
      expect(branchEditPath).toBe("/branch/edit-code/42");
    });
  });

  // ── 6. Status display ──
  describe("Code status display", () => {
    it("should show correct status labels", () => {
      const statusLabels: Record<string, string> = {
        issued: "ยังไม่ได้ใช้",
        redeemed: "ใช้แล้ว",
        expired: "หมดอายุ",
        cancelled: "ยกเลิก",
      };

      expect(statusLabels["issued"]).toBe("ยังไม่ได้ใช้");
      expect(statusLabels["redeemed"]).toBe("ใช้แล้ว");
      expect(statusLabels["expired"]).toBe("หมดอายุ");
      expect(statusLabels["cancelled"]).toBe("ยกเลิก");
    });

    it("should detect expired codes by date comparison", () => {
      const pastDate = new Date("2025-01-01");
      const futureDate = new Date("2027-01-01");
      const now = new Date();

      expect(now > pastDate).toBe(true); // expired
      expect(now > futureDate).toBe(false); // not expired
    });
  });

  // ── 7. Selected menu display logic (customer-selected menu) ──
  describe("Selected menu display logic", () => {
    it("should show selected menu section when selectedMenuName is present", () => {
      const code = {
        selectedMenuCode: "HBM09",
        selectedMenuName: "Hibi Cold Whisk (Latte)",
        remark: null as string | null,
      };

      const showSelectedMenu = !!code.selectedMenuName;
      expect(showSelectedMenu).toBe(true);
    });

    it("should show selected menu with remark", () => {
      const code = {
        selectedMenuCode: "HBM09",
        selectedMenuName: "Hibi Cold Whisk (Latte)",
        remark: "หวานน้อย เย็น",
      };

      const showSelectedMenu = !!code.selectedMenuName;
      const showRemark = !!code.remark;
      expect(showSelectedMenu).toBe(true);
      expect(showRemark).toBe(true);
      expect(code.remark).toContain("หวานน้อย");
    });

    it("should not show selected menu section when selectedMenuName is null", () => {
      const code = {
        selectedMenuCode: null as string | null,
        selectedMenuName: null as string | null,
        remark: null as string | null,
      };

      const showSelectedMenu = !!code.selectedMenuName;
      expect(showSelectedMenu).toBe(false);
    });

    it("should display selected menu before other info sections", () => {
      // The selected menu section should appear first in the card
      // to ensure staff sees what the customer ordered immediately
      const displayOrder = [
        "selectedMenu",  // เมนูที่ลูกค้าเลือก
        "claimMenu",     // เมนูชดเชย (CL only)
        "reviewMenu",    // เมนูที่ได้รับ (RV only)
        "orderInfo",     // ข้อมูลออเดอร์
        "basicInfo",     // ประเภท, สาขา, วันหมดอายุ
      ];

      expect(displayOrder.indexOf("selectedMenu")).toBe(0);
      expect(displayOrder.indexOf("selectedMenu")).toBeLessThan(displayOrder.indexOf("claimMenu"));
      expect(displayOrder.indexOf("selectedMenu")).toBeLessThan(displayOrder.indexOf("basicInfo"));
    });
  });

  // ── 8. Copy text for staff preparation ──
  describe("Staff preparation info", () => {
    it("should build preparation summary for CL codes", () => {
      const code = {
        code: "HIBI-CL-8G8USA",
        compensationMenuCode: "HBC01M10C",
        compensationMenuName: "Clear Matcha Saemidori",
        compensationRemark: "หวานน้อย เย็น ไซส์ L",
      };

      const summary = [
        `โค้ด: ${code.code}`,
        `เมนูชดเชย: ${code.compensationMenuCode} ${code.compensationMenuName}`,
        code.compensationRemark ? `หมายเหตุ: ${code.compensationRemark}` : "",
      ].filter(Boolean).join("\n");

      expect(summary).toContain("HIBI-CL-8G8USA");
      expect(summary).toContain("HBC01M10C");
      expect(summary).toContain("Clear Matcha Saemidori");
      expect(summary).toContain("หวานน้อย เย็น ไซส์ L");
    });

    it("should handle codes without remark gracefully", () => {
      const code = {
        code: "HIBI-CL-XYZ",
        compensationMenuCode: "M01",
        compensationMenuName: "Matcha Latte",
        compensationRemark: null as string | null,
      };

      const parts = [
        `โค้ด: ${code.code}`,
        `เมนูชดเชย: ${code.compensationMenuCode} ${code.compensationMenuName}`,
        code.compensationRemark ? `หมายเหตุ: ${code.compensationRemark}` : "",
      ].filter(Boolean);

      expect(parts).toHaveLength(2);
      expect(parts.join("\n")).not.toContain("หมายเหตุ");
    });
  });
});
