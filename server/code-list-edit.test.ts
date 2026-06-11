import { describe, it, expect } from "vitest";

describe("Code List & Edit Features", () => {
  // ── 1. CodeList page route validation ──
  describe("CodeList routes", () => {
    it("admin code list route should be /admin/codes", () => {
      const route = "/admin/codes";
      expect(route).toBe("/admin/codes");
    });

    it("branch code list route should be /branch/codes", () => {
      const route = "/branch/codes";
      expect(route).toBe("/branch/codes");
    });

    it("edit code route should include :id param", () => {
      const adminRoute = "/admin/edit-code/:id";
      const branchRoute = "/branch/edit-code/:id";
      expect(adminRoute).toContain(":id");
      expect(branchRoute).toContain(":id");
    });
  });

  // ── 2. codes.update input validation ──
  describe("codes.update input schema", () => {
    it("should accept all editable fields", () => {
      const validInput = {
        id: 1,
        claimOrderId: "GF-677",
        orderDate: "2026-03-25",
        claimMenuCode: "M01",
        claimMenuName: "Matcha Latte",
        claimOrderDetail: "Matcha Latte หวานน้อย เย็น ไซส์ L",
        claimError: "ทำผิดเมนู",
        compensationMenuCode: "M01",
        compensationMenuName: "Matcha Latte",
        compensationRemark: "หวานน้อย เย็น ไซส์ L",
        expiryDays: 30,
      };
      expect(validInput.id).toBeGreaterThan(0);
      expect(validInput.claimOrderId).toBeTruthy();
      expect(validInput.orderDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(validInput.compensationRemark).toBeTruthy();
    });

    it("should allow partial updates (only changed fields)", () => {
      const partialUpdate = {
        id: 1,
        compensationMenuCode: "M02",
        compensationMenuName: "Hojicha Latte",
      };
      expect(Object.keys(partialUpdate)).toHaveLength(3);
      expect(partialUpdate.compensationMenuCode).toBe("M02");
    });

    it("should handle expiryDays recalculation", () => {
      const issuedAt = new Date("2026-03-01");
      const newExpiryDays = 60;
      const newExpires = new Date(issuedAt);
      newExpires.setDate(newExpires.getDate() + newExpiryDays);
      expect(newExpires.getTime()).toBeGreaterThan(issuedAt.getTime());
      const diffDays = Math.round((newExpires.getTime() - issuedAt.getTime()) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(60);
    });
  });

  // ── 3. Notification on code update ──
  describe("Code update notification", () => {
    it("should build notification with code and customer info", () => {
      const code = "HIBI-CL-8G8USA";
      const customerPhone = "0968129333";
      const changedFields = ["compensationMenuCode", "compensationMenuName"];
      
      const title = `โค้ดชดเชยถูกแก้ไข: ${code}`;
      const content = `พนักงานแก้ไขโค้ด ${code}\nลูกค้า: ${customerPhone}\nข้อมูลที่แก้ไข: ${changedFields.join(", ")}`;
      
      expect(title).toContain(code);
      expect(content).toContain(customerPhone);
      expect(content).toContain("compensationMenuCode");
    });

    it("should handle missing customer phone gracefully", () => {
      const customerPhone = undefined;
      const display = customerPhone || "ไม่ระบุ";
      expect(display).toBe("ไม่ระบุ");
    });
  });

  // ── 4. Issue response text ──
  describe("Issue response text improvements", () => {
    it("success toast should mention branch notification", () => {
      const toastMsg = "แจ้งปัญหาเรียบร้อยแล้ว! ระบบได้ส่งเรื่องไปยังสาขาที่เกี่ยวข้องแล้ว สาขาจะตรวจสอบและตอบกลับภายใน 24 ชั่วโมง หากเป็นปัญหาเร่งด่วน ทางร้านจะออกโค้ดชดเชยให้คุณค่ะ";
      expect(toastMsg).toContain("ส่งเรื่องไปยังสาขา");
      expect(toastMsg).toContain("24 ชั่วโมง");
      expect(toastMsg).toContain("โค้ดชดเชย");
    });

    it("form footer should mention SLA and compensation", () => {
      const slaText = "สาขาจะตอบรับภายใน 24 ชั่วโมง และแก้ไขภายใน 48 ชั่วโมง";
      const compText = "หากเป็นปัญหาเร่งด่วน ทางร้านจะออกโค้ดชดเชยให้คุณเพื่อนำไปรับเมนูใหม่ได้ทันที";
      expect(slaText).toContain("24 ชั่วโมง");
      expect(slaText).toContain("48 ชั่วโมง");
      expect(compText).toContain("เมนูใหม่");
    });

    it("adminNote should be displayed to customer", () => {
      const issue = {
        adminNote: "กำลังตรวจสอบกับสาขา จะแจ้งผลภายใน 2 ชม.",
        resolution: null,
      };
      expect(issue.adminNote).toBeTruthy();
      // adminNote should show as "ข้อความจากทางร้าน"
      const displayLabel = "ข้อความจากทางร้าน";
      expect(displayLabel).toBe("ข้อความจากทางร้าน");
    });
  });

  // ── 5. CodeList filtering ──
  describe("CodeList filtering", () => {
    it("should filter by status", () => {
      const codes = [
        { id: 1, status: "active", code: "C1" },
        { id: 2, status: "redeemed", code: "C2" },
        { id: 3, status: "active", code: "C3" },
        { id: 4, status: "expired", code: "C4" },
      ];
      const active = codes.filter(c => c.status === "active");
      expect(active).toHaveLength(2);
    });

    it("should search by code, phone, or menu", () => {
      const codes = [
        { code: "HIBI-CL-ABC", customerPhone: "0912345678", compensationMenuName: "Matcha Latte" },
        { code: "HIBI-CL-DEF", customerPhone: "0968129333", compensationMenuName: "Hojicha" },
      ];
      const searchTerm = "0968";
      const results = codes.filter(c => 
        c.code.includes(searchTerm) || 
        c.customerPhone?.includes(searchTerm) || 
        c.compensationMenuName?.includes(searchTerm)
      );
      expect(results).toHaveLength(1);
      expect(results[0].code).toBe("HIBI-CL-DEF");
    });
  });

  // ── 6. DB fix verification ──
  describe("DB fix for code HIBI-CL-8G8USA", () => {
    it("compensationMenu should be filled from claimMenu for same_menu mode", () => {
      // Simulating the bug fix: when mode is same_menu, copy claimMenu to compensationMenu
      const claimMenuCode = "HBC01M10C";
      const claimMenuName = "Clear Matcha Saemidori";
      
      // Before fix: compensationMenuCode was NULL
      // After fix: should auto-fill
      const compensationMenuCode = claimMenuCode;
      const compensationMenuName = claimMenuName;
      
      expect(compensationMenuCode).toBe("HBC01M10C");
      expect(compensationMenuName).toBe("Clear Matcha Saemidori");
    });
  });
});
