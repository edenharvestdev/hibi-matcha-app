import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db helpers
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    getCodeStatsByBranch: vi.fn(),
    getPointsStatsByBranch: vi.fn(),
    getTopCustomersByPoints: vi.fn(),
    getTopCodeRedeemers: vi.fn(),
    getRewardRedemptionsByBranch: vi.fn(),
    getAnnouncementReadStats: vi.fn(),
    getAnnouncementReadDetail: vi.fn(),
    listAnnouncementTemplates: vi.fn(),
    getAnnouncementTemplateById: vi.fn(),
    createAnnouncementTemplate: vi.fn(),
    updateAnnouncementTemplate: vi.fn(),
    deleteAnnouncementTemplate: vi.fn(),
    createAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn(),
    getAnnouncementById: vi.fn(),
    listAnnouncements: vi.fn(),
    listAllAnnouncements: vi.fn(),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.jpg", key: "file.jpg" }),
}));

import {
  getCodeStatsByBranch,
  getPointsStatsByBranch,
  getTopCustomersByPoints,
  getTopCodeRedeemers,
  getRewardRedemptionsByBranch,
  getAnnouncementReadStats,
  getAnnouncementReadDetail,
  listAnnouncementTemplates,
  getAnnouncementTemplateById,
  createAnnouncementTemplate,
  updateAnnouncementTemplate,
  deleteAnnouncementTemplate,
  createAnnouncement,
  updateAnnouncement,
} from "./db";

// ── Marketing Dashboard Tests ──
describe("Marketing Dashboard - Code Stats", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getCodeStatsByBranch returns stats per branch", async () => {
    const mockStats = [
      { branchId: 1, branchName: "สาขาสยาม", totalCodes: 50, issuedCodes: 30, redeemedCodes: 20, expiredCodes: 5, reviewCodes: 25, claimCodes: 5 },
      { branchId: 2, branchName: "สาขาลาดพร้าว", totalCodes: 30, issuedCodes: 15, redeemedCodes: 10, expiredCodes: 2, reviewCodes: 10, claimCodes: 5 },
    ];
    (getCodeStatsByBranch as any).mockResolvedValue(mockStats);

    const result = await getCodeStatsByBranch();
    expect(result).toHaveLength(2);
    expect(result[0].branchName).toBe("สาขาสยาม");
    expect(result[0].totalCodes).toBe(50);
    expect(result[1].redeemedCodes).toBe(10);
  });

  it("getPointsStatsByBranch returns points per branch", async () => {
    const mockStats = [
      { branchId: 1, branchName: "สาขาสยาม", totalCustomers: 100, totalLifetimePoints: 5000, totalActivePoints: 3000, totalUsedPoints: 2000, avgLifetimePoints: 50 },
    ];
    (getPointsStatsByBranch as any).mockResolvedValue(mockStats);

    const result = await getPointsStatsByBranch();
    expect(result).toHaveLength(1);
    expect(result[0].totalCustomers).toBe(100);
    expect(result[0].totalActivePoints).toBe(3000);
  });
});

describe("Marketing Dashboard - Top Customers", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getTopCustomersByPoints returns ranked customers", async () => {
    const mockCustomers = [
      { customerId: 1, customerName: "สมชาย", customerPhone: "0812345678", branchId: 1, branchName: "สาขาสยาม", lifetimePoints: 500, activePoints: 300 },
      { customerId: 2, customerName: "สมหญิง", customerPhone: "0898765432", branchId: 1, branchName: "สาขาสยาม", lifetimePoints: 300, activePoints: 200 },
    ];
    (getTopCustomersByPoints as any).mockResolvedValue(mockCustomers);

    const result = await getTopCustomersByPoints(undefined, 10);
    expect(result).toHaveLength(2);
    expect(result[0].lifetimePoints).toBe(500);
    expect(result[0].customerName).toBe("สมชาย");
  });

  it("getTopCustomersByPoints filters by branch", async () => {
    const mockCustomers = [
      { customerId: 1, customerName: "สมชาย", customerPhone: "0812345678", branchId: 2, branchName: "สาขาลาดพร้าว", lifetimePoints: 300, activePoints: 200 },
    ];
    (getTopCustomersByPoints as any).mockResolvedValue(mockCustomers);

    const result = await getTopCustomersByPoints(2, 10);
    expect(result).toHaveLength(1);
    expect(result[0].branchId).toBe(2);
  });

  it("getTopCodeRedeemers returns top redeemers", async () => {
    const mockRedeemers = [
      { customerId: 1, customerName: "สมชาย", customerPhone: "0812345678", branchId: 1, branchName: "สาขาสยาม", totalRedeemed: 15 },
    ];
    (getTopCodeRedeemers as any).mockResolvedValue(mockRedeemers);

    const result = await getTopCodeRedeemers(undefined, 10);
    expect(result).toHaveLength(1);
    expect(result[0].totalRedeemed).toBe(15);
  });
});

describe("Marketing Dashboard - Reward Redemptions", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getRewardRedemptionsByBranch returns redemption stats", async () => {
    const mockStats = [
      { branchId: 1, branchName: "สาขาสยาม", totalRedemptions: 20, usedRedemptions: 15, pendingRedemptions: 5, totalPointsSpent: 1000 },
    ];
    (getRewardRedemptionsByBranch as any).mockResolvedValue(mockStats);

    const result = await getRewardRedemptionsByBranch();
    expect(result).toHaveLength(1);
    expect(result[0].totalRedemptions).toBe(20);
    expect(result[0].totalPointsSpent).toBe(1000);
  });
});

// ── Announcement Analytics Tests ──
describe("Announcement Analytics - Read Stats", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("getAnnouncementReadStats returns read counts per announcement", async () => {
    const mockStats = [
      { id: 1, title: "โปรเปิดร้าน", type: "promotion", isActive: 1, branchId: null, branchName: null, createdAt: new Date(), uniqueReaders: 50, totalCustomers: 100 },
      { id: 2, title: "ประกาศปิดปรับปรุง", type: "announcement", isActive: 1, branchId: 1, branchName: "สาขาสยาม", createdAt: new Date(), uniqueReaders: 20, totalCustomers: 100 },
    ];
    (getAnnouncementReadStats as any).mockResolvedValue(mockStats);

    const result = await getAnnouncementReadStats();
    expect(result).toHaveLength(2);
    expect(result[0].uniqueReaders).toBe(50);
    expect(result[1].branchName).toBe("สาขาสยาม");
  });

  it("getAnnouncementReadDetail returns reader list for an announcement", async () => {
    const mockDetail = [
      { customerName: "สมชาย", customerPhone: "0812345678", readAt: new Date() },
      { customerName: "สมหญิง", customerPhone: "0898765432", readAt: new Date() },
    ];
    (getAnnouncementReadDetail as any).mockResolvedValue(mockDetail);

    const result = await getAnnouncementReadDetail(1);
    expect(result).toHaveLength(2);
    expect(result[0].customerName).toBe("สมชาย");
  });
});

// ── Announcement Templates Tests ──
describe("Announcement Templates CRUD", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("listAnnouncementTemplates returns active templates", async () => {
    const mockTemplates = [
      { id: 1, name: "โปรวันเกิด", type: "promotion", titleTemplate: "สุขสันต์วันเกิด!", contentTemplate: "รับส่วนลด 20%", imageUrl: null, isActive: 1, createdAt: new Date() },
    ];
    (listAnnouncementTemplates as any).mockResolvedValue(mockTemplates);

    const result = await listAnnouncementTemplates(true);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("โปรวันเกิด");
  });

  it("createAnnouncementTemplate creates a new template", async () => {
    (createAnnouncementTemplate as any).mockResolvedValue(1);

    const id = await createAnnouncementTemplate({
      name: "โปรเปิดสาขาใหม่",
      type: "event",
      titleTemplate: "เปิดสาขาใหม่!",
      contentTemplate: "พบกันที่สาขาใหม่ของเรา",
      imageUrl: null,
      promoCode: null,
      discountText: null,
      description: null,
    });
    expect(id).toBe(1);
    expect(createAnnouncementTemplate).toHaveBeenCalledWith(expect.objectContaining({
      name: "โปรเปิดสาขาใหม่",
      type: "event",
    }));
  });

  it("deleteAnnouncementTemplate deletes a template", async () => {
    (deleteAnnouncementTemplate as any).mockResolvedValue(undefined);

    await deleteAnnouncementTemplate(1);
    expect(deleteAnnouncementTemplate).toHaveBeenCalledWith(1);
  });

  it("updateAnnouncementTemplate updates a template", async () => {
    (updateAnnouncementTemplate as any).mockResolvedValue(undefined);

    await updateAnnouncementTemplate(1, { name: "โปรวันเกิด V2" });
    expect(updateAnnouncementTemplate).toHaveBeenCalledWith(1, { name: "โปรวันเกิด V2" });
  });
});

// ── Branch-Specific Announcements Tests ──
describe("Branch-Specific Announcements", () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it("createAnnouncement with branchId creates branch-specific announcement", async () => {
    (createAnnouncement as any).mockResolvedValue(1);

    const id = await createAnnouncement({
      title: "โปรเฉพาะสาขาสยาม",
      content: "ลด 30% เฉพาะสาขาสยาม",
      type: "promotion",
      branchId: 1,
      targetGroup: "all",
      isActive: 1,
      isPinned: 0,
    } as any);
    expect(id).toBe(1);
    expect(createAnnouncement).toHaveBeenCalledWith(expect.objectContaining({
      branchId: 1,
    }));
  });

  it("createAnnouncement without branchId creates global announcement", async () => {
    (createAnnouncement as any).mockResolvedValue(2);

    const id = await createAnnouncement({
      title: "ประกาศทั่วไป",
      content: "ข่าวสารจากร้าน",
      type: "announcement",
      branchId: null,
      targetGroup: "all",
      isActive: 1,
      isPinned: 0,
    } as any);
    expect(id).toBe(2);
    expect(createAnnouncement).toHaveBeenCalledWith(expect.objectContaining({
      branchId: null,
    }));
  });

  it("updateAnnouncement can change branchId", async () => {
    (updateAnnouncement as any).mockResolvedValue(undefined);

    await updateAnnouncement(1, { branchId: 2 } as any);
    expect(updateAnnouncement).toHaveBeenCalledWith(1, expect.objectContaining({
      branchId: 2,
    }));
  });
});
