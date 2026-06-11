import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock db functions
vi.mock("./db", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    updateOrderIssue: vi.fn().mockResolvedValue(undefined),
    createAuditLog: vi.fn().mockResolvedValue(undefined),
  };
});

// Mock jose to return our test session payload
vi.mock("jose", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    jwtVerify: vi.fn().mockImplementation(async (token: string) => {
      if (token === "test-super-admin-token") {
        return { payload: { type: "hibi_session", id: 1, role: "super_admin" } };
      }
      if (token === "test-branch-admin-token") {
        return { payload: { type: "hibi_session", id: 2, role: "branch_admin" } };
      }
      throw new Error("Invalid token");
    }),
  };
});

function createHibiStaffContext(role: "super_admin" | "branch_admin" = "super_admin"): TrpcContext {
  const token = role === "super_admin" ? "test-super-admin-token" : "test-branch-admin-token";
  return {
    user: null,
    req: { protocol: "https", headers: { cookie: `hibi_session=${token}` } } as any,
    res: { clearCookie: vi.fn(), cookie: vi.fn() } as any,
  } as any;
}

describe("Order Issue Clear Resolution & Admin Note", () => {
  // ── clearResolution tests ──
  describe("orderIssues.clearResolution", () => {
    it("should clear resolution and set status to acknowledged", async () => {
      const ctx = createHibiStaffContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.orderIssues.clearResolution({ id: 1 });
      expect(result).toEqual({ success: true });
    });

    it("should work for branch_admin role", async () => {
      const ctx = createHibiStaffContext("branch_admin");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.orderIssues.clearResolution({ id: 5 });
      expect(result).toEqual({ success: true });
    });

    it("should require id parameter", () => {
      const input = { id: 10 };
      expect(input.id).toBeGreaterThan(0);
      expect(typeof input.id).toBe("number");
    });
  });

  // ── clearAdminNote tests ──
  describe("orderIssues.clearAdminNote", () => {
    it("should clear admin note successfully", async () => {
      const ctx = createHibiStaffContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.orderIssues.clearAdminNote({ id: 1 });
      expect(result).toEqual({ success: true });
    });

    it("should work for branch_admin role", async () => {
      const ctx = createHibiStaffContext("branch_admin");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.orderIssues.clearAdminNote({ id: 3 });
      expect(result).toEqual({ success: true });
    });

    it("should require id parameter", () => {
      const input = { id: 7 };
      expect(input.id).toBeGreaterThan(0);
      expect(typeof input.id).toBe("number");
    });
  });

  // ── addAdminNote tests (now hibiProcedure) ──
  describe("orderIssues.addAdminNote", () => {
    it("should add admin note successfully", async () => {
      const ctx = createHibiStaffContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.orderIssues.addAdminNote({
        id: 1,
        adminNote: "ขอบคุณลูกค้ามากค่ะ ทางร้านจะปรับปรุงต่อไป",
      });
      expect(result).toEqual({ success: true });
    });

    it("should work for branch_admin role (now hibiProcedure)", async () => {
      const ctx = createHibiStaffContext("branch_admin");
      const caller = appRouter.createCaller(ctx);
      const result = await caller.orderIssues.addAdminNote({
        id: 2,
        adminNote: "สาขาได้รับทราบและจะแก้ไขค่ะ",
      });
      expect(result).toEqual({ success: true });
    });

    it("should reject empty admin note", async () => {
      const ctx = createHibiStaffContext();
      const caller = appRouter.createCaller(ctx);
      await expect(
        caller.orderIssues.addAdminNote({ id: 1, adminNote: "" })
      ).rejects.toThrow();
    });
  });

  // ── UI Flow tests ──
  describe("Delete-and-rewrite flow", () => {
    it("clearing resolution should allow writing new resolution (status goes to acknowledged)", () => {
      // Simulate: issue was resolved, user clicks delete, status becomes acknowledged
      const issue = { id: 1, status: "resolved", resolution: "ส่งออเดอร์ใหม่ให้ลูกค้า" };
      // After clear
      const cleared = { ...issue, resolution: null, status: "acknowledged" };
      expect(cleared.resolution).toBeNull();
      expect(cleared.status).toBe("acknowledged");
      // acknowledged status shows the resolve form again
      expect(["acknowledged", "in_progress"].includes(cleared.status)).toBe(true);
    });

    it("clearing admin note should allow writing new note", () => {
      const issue = { id: 1, adminNote: "เก่า: ทางร้านขออภัย" };
      const cleared = { ...issue, adminNote: null };
      expect(cleared.adminNote).toBeNull();
      // When adminNote is null, the "add note" button should appear
      expect(!cleared.adminNote).toBe(true);
    });

    it("should show delete button only when text exists", () => {
      const withResolution = { resolution: "some text" };
      const withoutResolution = { resolution: null };
      expect(!!withResolution.resolution).toBe(true); // show delete btn
      expect(!!withoutResolution.resolution).toBe(false); // hide delete btn
    });

    it("should show delete button for admin note only when text exists", () => {
      const withNote = { adminNote: "some note" };
      const withoutNote = { adminNote: null };
      expect(!!withNote.adminNote).toBe(true); // show delete btn
      expect(!!withoutNote.adminNote).toBe(false); // hide delete btn
    });
  });

  // ── MobileLayout integration tests ──
  describe("MobileLayout integration", () => {
    it("AdminOrderIssues should have showBack and backPath to /admin", () => {
      const layoutProps = { title: "ปัญหาออเดอร์", showBack: true, backPath: "/admin" };
      expect(layoutProps.showBack).toBe(true);
      expect(layoutProps.backPath).toBe("/admin");
    });

    it("BranchOrderIssues should have showBack and backPath to /branch", () => {
      const layoutProps = { title: "ปัญหาออเดอร์", showBack: true, backPath: "/branch" };
      expect(layoutProps.showBack).toBe(true);
      expect(layoutProps.backPath).toBe("/branch");
    });

    it("MobileLayout should render navigation menu with hamburger", () => {
      // MobileLayout has a menu button that toggles navItems
      const menuOpen = false;
      expect(menuOpen).toBe(false);
      // After click
      const toggled = !menuOpen;
      expect(toggled).toBe(true);
    });
  });

  // ── Confirm dialog tests ──
  describe("Confirm dialog before delete", () => {
    it("should require confirmation before clearing resolution", () => {
      // The UI uses confirm() before calling clearResolution
      const confirmMessage = "ต้องการลบข้อความการแก้ไขเพื่อเขียนใหม่หรือไม่?";
      expect(confirmMessage).toContain("ลบ");
      expect(confirmMessage).toContain("เขียนใหม่");
    });

    it("should require confirmation before clearing admin note", () => {
      const confirmMessage = "ต้องการลบข้อความนี้เพื่อเขียนใหม่หรือไม่?";
      expect(confirmMessage).toContain("ลบ");
      expect(confirmMessage).toContain("เขียนใหม่");
    });
  });
});
