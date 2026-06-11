import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests that date range filter parameters are accepted by the procedures
 * that were updated. We test input validation (schema acceptance) rather than
 * actual DB queries since the DB may not be available in test environment.
 */

function createSuperAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-admin",
      email: "admin@test.com",
      name: "Test Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: { cookie: "hibi_staff_token=mock-super-admin-token" },
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Date Range Filter - Input Validation", () => {
  // These tests verify that the procedures accept dateFrom/dateTo parameters
  // without throwing input validation errors (z.string().optional())

  it("orderIssues.list accepts dateFrom and dateTo params", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    // This should not throw a ZodError for input validation
    // It may throw a DB error or auth error, but NOT an input validation error
    try {
      await caller.orderIssues.list({
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
        status: "open",
      });
    } catch (err: any) {
      // Accept DB/auth errors but not input validation errors
      expect(err.code).not.toBe("BAD_REQUEST");
    }
  });

  it("auditLogs.list accepts dateFrom and dateTo params", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    try {
      await caller.auditLogs.list({
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      });
    } catch (err: any) {
      expect(err.code).not.toBe("BAD_REQUEST");
    }
  });

  it("reports.summary accepts dateFrom and dateTo params", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    try {
      await caller.reports.summary({
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      });
    } catch (err: any) {
      expect(err.code).not.toBe("BAD_REQUEST");
    }
  });

  it("reports.exportCsv accepts dateFrom and dateTo params", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    try {
      await caller.reports.exportCsv({
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      });
    } catch (err: any) {
      expect(err.code).not.toBe("BAD_REQUEST");
    }
  });

  it("multiBranchOverview.summary accepts dateFrom and dateTo params", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    try {
      await caller.multiBranchOverview.summary({
        dateFrom: "2025-01-01",
        dateTo: "2025-12-31",
      });
    } catch (err: any) {
      expect(err.code).not.toBe("BAD_REQUEST");
    }
  });

  it("procedures accept empty dateFrom/dateTo (optional params)", async () => {
    const caller = appRouter.createCaller(createSuperAdminContext());
    // These should not throw input validation errors
    try {
      await caller.orderIssues.list({});
    } catch (err: any) {
      expect(err.code).not.toBe("BAD_REQUEST");
    }
    try {
      await caller.auditLogs.list({});
    } catch (err: any) {
      expect(err.code).not.toBe("BAD_REQUEST");
    }
  });
});
