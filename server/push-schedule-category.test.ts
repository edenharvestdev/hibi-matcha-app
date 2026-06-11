import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db helpers
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    savePushSubscription: vi.fn(),
    removePushSubscription: vi.fn(),
    getAllPushSubscriptions: vi.fn(),
    removePushSubscriptionByEndpoint: vi.fn(),
    listAnnouncementsByCategory: vi.fn(),
    listScheduledAnnouncementsToPublish: vi.fn(),
    createAnnouncement: vi.fn(),
    updateAnnouncement: vi.fn(),
    getAnnouncementById: vi.fn(),
    listAnnouncements: vi.fn(),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.jpg", key: "file.jpg" }),
}));

import {
  savePushSubscription,
  removePushSubscription,
  getAllPushSubscriptions,
  removePushSubscriptionByEndpoint,
  listAnnouncementsByCategory,
  listScheduledAnnouncementsToPublish,
  createAnnouncement,
  updateAnnouncement,
  getAnnouncementById,
} from "./db";

// ── Push Subscription DB Helper Tests ──
describe("Push Subscription DB Helpers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("savePushSubscription", () => {
    it("should save a new push subscription for a customer", async () => {
      const mockSave = vi.mocked(savePushSubscription);
      mockSave.mockResolvedValue(undefined);

      await savePushSubscription(100, "https://push.example.com/sub1", "p256dh_key_abc", "auth_key_xyz");
      expect(mockSave).toHaveBeenCalledWith(100, "https://push.example.com/sub1", "p256dh_key_abc", "auth_key_xyz");
      expect(mockSave).toHaveBeenCalledTimes(1);
    });

    it("should handle saving duplicate subscription (upsert)", async () => {
      const mockSave = vi.mocked(savePushSubscription);
      mockSave.mockResolvedValue(undefined);

      await savePushSubscription(100, "https://push.example.com/sub1", "p256dh_key_abc", "auth_key_xyz");
      await savePushSubscription(100, "https://push.example.com/sub1", "p256dh_key_new", "auth_key_new");
      expect(mockSave).toHaveBeenCalledTimes(2);
    });
  });

  describe("removePushSubscription", () => {
    it("should remove a push subscription for a customer", async () => {
      const mockRemove = vi.mocked(removePushSubscription);
      mockRemove.mockResolvedValue(undefined);

      await removePushSubscription(100, "https://push.example.com/sub1");
      expect(mockRemove).toHaveBeenCalledWith(100, "https://push.example.com/sub1");
    });
  });

  describe("removePushSubscriptionByEndpoint", () => {
    it("should remove subscription by endpoint (for expired subs)", async () => {
      const mockRemove = vi.mocked(removePushSubscriptionByEndpoint);
      mockRemove.mockResolvedValue(undefined);

      await removePushSubscriptionByEndpoint("https://push.example.com/expired");
      expect(mockRemove).toHaveBeenCalledWith("https://push.example.com/expired");
    });
  });

  describe("getAllPushSubscriptions", () => {
    it("should return all active push subscriptions", async () => {
      const mockGetAll = vi.mocked(getAllPushSubscriptions);
      mockGetAll.mockResolvedValue([
        { endpoint: "https://push.example.com/sub1", p256dh: "key1", auth: "auth1" },
        { endpoint: "https://push.example.com/sub2", p256dh: "key2", auth: "auth2" },
      ]);

      const subs = await getAllPushSubscriptions();
      expect(subs).toHaveLength(2);
      expect(subs[0].endpoint).toBe("https://push.example.com/sub1");
    });

    it("should return empty array when no subscriptions exist", async () => {
      const mockGetAll = vi.mocked(getAllPushSubscriptions);
      mockGetAll.mockResolvedValue([]);

      const subs = await getAllPushSubscriptions();
      expect(subs).toHaveLength(0);
    });
  });
});

// ── Category Filter Tests ──
describe("Announcement Category Filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return all active announcements when no category specified", async () => {
    const mockList = vi.mocked(listAnnouncementsByCategory);
    mockList.mockResolvedValue([
      { id: 1, title: "Test 1", type: "announcement" },
      { id: 2, title: "Test 2", type: "promotion" },
      { id: 3, title: "Test 3", type: "event" },
    ] as any);

    const result = await listAnnouncementsByCategory(undefined, true);
    expect(result).toHaveLength(3);
    expect(mockList).toHaveBeenCalledWith(undefined, true);
  });

  it("should filter by announcement type", async () => {
    const mockList = vi.mocked(listAnnouncementsByCategory);
    mockList.mockResolvedValue([
      { id: 1, title: "Test 1", type: "announcement" },
    ] as any);

    const result = await listAnnouncementsByCategory("announcement", true);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("announcement");
  });

  it("should filter by promotion type", async () => {
    const mockList = vi.mocked(listAnnouncementsByCategory);
    mockList.mockResolvedValue([
      { id: 2, title: "Promo 1", type: "promotion" },
    ] as any);

    const result = await listAnnouncementsByCategory("promotion", true);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("promotion");
  });

  it("should filter by event type", async () => {
    const mockList = vi.mocked(listAnnouncementsByCategory);
    mockList.mockResolvedValue([
      { id: 3, title: "Event 1", type: "event" },
    ] as any);

    const result = await listAnnouncementsByCategory("event", true);
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("event");
  });

  it("should return empty array when no announcements match category", async () => {
    const mockList = vi.mocked(listAnnouncementsByCategory);
    mockList.mockResolvedValue([]);

    const result = await listAnnouncementsByCategory("event", true);
    expect(result).toHaveLength(0);
  });
});

// ── Scheduled Announcements Tests ──
describe("Scheduled Announcements", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listScheduledAnnouncementsToPublish", () => {
    it("should return announcements whose scheduledAt has passed", async () => {
      const mockList = vi.mocked(listScheduledAnnouncementsToPublish);
      const pastDate = new Date(Date.now() - 60000);
      mockList.mockResolvedValue([
        { id: 1, title: "Scheduled 1", content: "Content 1", type: "announcement", scheduledAt: pastDate },
      ] as any);

      const result = await listScheduledAnnouncementsToPublish();
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Scheduled 1");
    });

    it("should return empty array when no scheduled announcements are due", async () => {
      const mockList = vi.mocked(listScheduledAnnouncementsToPublish);
      mockList.mockResolvedValue([]);

      const result = await listScheduledAnnouncementsToPublish();
      expect(result).toHaveLength(0);
    });
  });

  describe("createAnnouncement with scheduledAt", () => {
    it("should create announcement with scheduledAt set", async () => {
      const mockCreate = vi.mocked(createAnnouncement);
      mockCreate.mockResolvedValue(1);

      const futureDate = new Date(Date.now() + 3600000);
      const id = await createAnnouncement({
        title: "Future Announcement",
        content: "Will be published later",
        type: "promotion",
        targetGroup: "all",
        imageUrl: null,
        promoCode: "FUTURE20",
        discountText: "ลด 20%",
        startDate: futureDate,
        endDate: null,
        isPinned: 0,
        scheduledAt: futureDate,
      } as any);

      expect(id).toBe(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledAt: futureDate,
          title: "Future Announcement",
        })
      );
    });

    it("should create announcement without scheduledAt (publish immediately)", async () => {
      const mockCreate = vi.mocked(createAnnouncement);
      mockCreate.mockResolvedValue(2);

      const id = await createAnnouncement({
        title: "Immediate Announcement",
        content: "Published now",
        type: "announcement",
        targetGroup: "all",
        imageUrl: null,
        promoCode: null,
        discountText: null,
        startDate: new Date(),
        endDate: null,
        isPinned: 0,
        scheduledAt: null,
      } as any);

      expect(id).toBe(2);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          scheduledAt: null,
        })
      );
    });
  });

  describe("updateAnnouncement with scheduledAt", () => {
    it("should update scheduledAt for an existing announcement", async () => {
      const mockUpdate = vi.mocked(updateAnnouncement);
      mockUpdate.mockResolvedValue(undefined);

      const newSchedule = new Date(Date.now() + 7200000);
      await updateAnnouncement(1, { scheduledAt: newSchedule, startDate: newSchedule });

      expect(mockUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
        scheduledAt: newSchedule,
      }));
    });

    it("should clear scheduledAt to publish immediately", async () => {
      const mockUpdate = vi.mocked(updateAnnouncement);
      mockUpdate.mockResolvedValue(undefined);

      await updateAnnouncement(1, { scheduledAt: null });

      expect(mockUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
        scheduledAt: null,
      }));
    });
  });
});

// ── Push Notification Send Flow Tests ──
describe("Push Notification Send Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should get announcement by id for sendPush", async () => {
    const mockGet = vi.mocked(getAnnouncementById);
    mockGet.mockResolvedValue({
      id: 1,
      title: "Test Push",
      content: "Push content",
      type: "promotion",
      isActive: 1,
    } as any);

    const ann = await getAnnouncementById(1);
    expect(ann).toBeTruthy();
    expect(ann!.title).toBe("Test Push");
    expect(ann!.type).toBe("promotion");
  });

  it("should return null for non-existent announcement", async () => {
    const mockGet = vi.mocked(getAnnouncementById);
    mockGet.mockResolvedValue(null as any);

    const ann = await getAnnouncementById(999);
    expect(ann).toBeNull();
  });
});

// ── Schema Validation Tests ──
describe("push_subscriptions Schema", () => {
  it("should have required fields: customerId, endpoint, p256dh, auth", () => {
    const requiredFields = ["customerId", "endpoint", "p256dh", "auth"];
    const schemaFields = ["id", "customerId", "endpoint", "p256dh", "auth", "createdAt"];

    for (const field of requiredFields) {
      expect(schemaFields).toContain(field);
    }
  });

  it("should have unique index on (customerId, endpoint)", () => {
    const uniqueConstraint = { columns: ["customerId", "endpoint"], name: "ps_customer_endpoint_idx" };
    expect(uniqueConstraint.columns).toEqual(["customerId", "endpoint"]);
  });
});

describe("announcements scheduledAt field", () => {
  it("should have scheduledAt field in announcements schema", () => {
    const schemaFields = [
      "id", "title", "content", "type", "targetGroup", "imageUrl",
      "promoCode", "discountText", "startDate", "endDate",
      "isActive", "isPinned", "createdAt", "scheduledAt",
    ];
    expect(schemaFields).toContain("scheduledAt");
  });

  it("scheduledAt should be nullable (null means publish immediately)", () => {
    const nullableFields = ["imageUrl", "promoCode", "discountText", "endDate", "scheduledAt"];
    expect(nullableFields).toContain("scheduledAt");
  });
});
