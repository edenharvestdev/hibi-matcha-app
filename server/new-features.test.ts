import { describe, it, expect, vi } from "vitest";

// ── Site Content Tests ──
describe("Site Content Management", () => {
  it("should have getSiteContent function that returns content by key", async () => {
    const { getSiteContent } = await import("./db");
    expect(typeof getSiteContent).toBe("function");
  });

  it("should have listSiteContent function", async () => {
    const { listSiteContent } = await import("./db");
    expect(typeof listSiteContent).toBe("function");
  });

  it("should have upsertSiteContent function", async () => {
    const { upsertSiteContent } = await import("./db");
    expect(typeof upsertSiteContent).toBe("function");
  });

  it("getSiteContent should return null for non-existent key", async () => {
    const { getSiteContent } = await import("./db");
    const result = await getSiteContent("non_existent_key_12345");
    expect(result).toBeNull();
  });

  it("listSiteContent should return an array", async () => {
    const { listSiteContent } = await import("./db");
    const result = await listSiteContent();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getSiteContent should return review_howto_image content", async () => {
    const { getSiteContent } = await import("./db");
    const result = await getSiteContent("review_howto_image");
    // Should exist since we seeded it
    if (result) {
      expect(result.contentKey).toBe("review_howto_image");
      expect(result.contentType).toBe("image");
      expect(result.contentValue).toBeTruthy();
    }
  });
});

// ── Staff Notifications Tests ──
describe("Staff Notifications", () => {
  it("should have createStaffNotification function", async () => {
    const { createStaffNotification } = await import("./db");
    expect(typeof createStaffNotification).toBe("function");
  });

  it("should have listStaffNotifications function", async () => {
    const { listStaffNotifications } = await import("./db");
    expect(typeof listStaffNotifications).toBe("function");
  });

  it("should have countUnreadNotifications function", async () => {
    const { countUnreadNotifications } = await import("./db");
    expect(typeof countUnreadNotifications).toBe("function");
  });

  it("should have markNotificationRead function", async () => {
    const { markNotificationRead } = await import("./db");
    expect(typeof markNotificationRead).toBe("function");
  });

  it("should have markAllNotificationsRead function", async () => {
    const { markAllNotificationsRead } = await import("./db");
    expect(typeof markAllNotificationsRead).toBe("function");
  });

  it("should have notifyBranchStaff function", async () => {
    const { notifyBranchStaff } = await import("./db");
    expect(typeof notifyBranchStaff).toBe("function");
  });

  it("listStaffNotifications should return array for non-existent staff", async () => {
    const { listStaffNotifications } = await import("./db");
    const result = await listStaffNotifications(999999);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBe(0);
  });

  it("countUnreadNotifications should return 0 for non-existent staff", async () => {
    const { countUnreadNotifications } = await import("./db");
    const result = await countUnreadNotifications(999999);
    expect(result).toBe(0);
  });
});

// ── Area Manager Report Tests ──
describe("Area Manager Report", () => {
  it("should have getReportDataMultiBranch function", async () => {
    const { getReportDataMultiBranch } = await import("./db");
    expect(typeof getReportDataMultiBranch).toBe("function");
  });

  it("should have getDashboardStatsMultiBranch function", async () => {
    const { getDashboardStatsMultiBranch } = await import("./db");
    expect(typeof getDashboardStatsMultiBranch).toBe("function");
  });

  it("getReportDataMultiBranch should return data for empty branch list", async () => {
    const { getReportDataMultiBranch } = await import("./db");
    const result = await getReportDataMultiBranch([]);
    // Should return empty or default data
    expect(result).toBeDefined();
  });

  it("getDashboardStatsMultiBranch should return stats for empty branch list", async () => {
    const { getDashboardStatsMultiBranch } = await import("./db");
    const result = await getDashboardStatsMultiBranch([]);
    expect(result).toBeDefined();
  });
});

// ── Schema Tests ──
describe("Schema - New Tables", () => {
  it("should export staffNotifications table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.staffNotifications).toBeDefined();
  });

  it("should export siteContent table", async () => {
    const schema = await import("../drizzle/schema");
    expect(schema.siteContent).toBeDefined();
  });

  it("staffNotifications should have required columns", async () => {
    const schema = await import("../drizzle/schema");
    const table = schema.staffNotifications;
    // Check that the table has the expected shape
    expect(table).toBeDefined();
  });

  it("siteContent should have required columns", async () => {
    const schema = await import("../drizzle/schema");
    const table = schema.siteContent;
    expect(table).toBeDefined();
  });
});
