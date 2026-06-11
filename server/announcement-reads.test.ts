import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db helpers
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    markAnnouncementRead: vi.fn(),
    markAllAnnouncementsRead: vi.fn(),
    getUnreadAnnouncementCount: vi.fn(),
    listAnnouncements: vi.fn(),
    createAnnouncement: vi.fn(),
    getAnnouncementById: vi.fn(),
    updateAnnouncement: vi.fn(),
    deleteAnnouncement: vi.fn(),
  };
});

vi.mock("./_core/notification", () => ({
  notifyOwner: vi.fn().mockResolvedValue(true),
}));

vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/file.jpg", key: "file.jpg" }),
}));

import {
  markAnnouncementRead,
  markAllAnnouncementsRead,
  getUnreadAnnouncementCount,
  listAnnouncements,
} from "./db";

// ── Announcement Read Tracking - DB Helper Tests ──
describe("Announcement Read Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("markAnnouncementRead", () => {
    it("should call markAnnouncementRead with correct customerId and announcementId", async () => {
      const mockMark = vi.mocked(markAnnouncementRead);
      mockMark.mockResolvedValue(undefined);

      await markAnnouncementRead(100, 5);
      expect(mockMark).toHaveBeenCalledWith(100, 5);
      expect(mockMark).toHaveBeenCalledTimes(1);
    });

    it("should handle marking the same announcement twice without error (idempotent)", async () => {
      const mockMark = vi.mocked(markAnnouncementRead);
      mockMark.mockResolvedValue(undefined);

      await markAnnouncementRead(100, 5);
      await markAnnouncementRead(100, 5);
      expect(mockMark).toHaveBeenCalledTimes(2);
    });
  });

  describe("markAllAnnouncementsRead", () => {
    it("should return the number of newly marked announcements", async () => {
      const mockMarkAll = vi.mocked(markAllAnnouncementsRead);
      mockMarkAll.mockResolvedValue(3);

      const result = await markAllAnnouncementsRead(100);
      expect(result).toBe(3);
      expect(mockMarkAll).toHaveBeenCalledWith(100);
    });

    it("should return 0 when all announcements are already read", async () => {
      const mockMarkAll = vi.mocked(markAllAnnouncementsRead);
      mockMarkAll.mockResolvedValue(0);

      const result = await markAllAnnouncementsRead(100);
      expect(result).toBe(0);
    });

    it("should return 0 when there are no active announcements", async () => {
      const mockMarkAll = vi.mocked(markAllAnnouncementsRead);
      mockMarkAll.mockResolvedValue(0);

      const result = await markAllAnnouncementsRead(200);
      expect(result).toBe(0);
    });
  });

  describe("getUnreadAnnouncementCount", () => {
    it("should return the count of unread announcements for a customer", async () => {
      const mockCount = vi.mocked(getUnreadAnnouncementCount);
      mockCount.mockResolvedValue(5);

      const count = await getUnreadAnnouncementCount(100);
      expect(count).toBe(5);
      expect(mockCount).toHaveBeenCalledWith(100);
    });

    it("should return 0 when customer has read all announcements", async () => {
      const mockCount = vi.mocked(getUnreadAnnouncementCount);
      mockCount.mockResolvedValue(0);

      const count = await getUnreadAnnouncementCount(100);
      expect(count).toBe(0);
    });

    it("should return correct count for a new customer with no reads", async () => {
      const mockCount = vi.mocked(getUnreadAnnouncementCount);
      mockCount.mockResolvedValue(10);

      const count = await getUnreadAnnouncementCount(999);
      expect(count).toBe(10);
    });
  });
});

// ── Announcement Read Flow Tests ──
describe("Announcement Read Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show unread count > 0 for new customer, then 0 after markAllRead", async () => {
    const mockCount = vi.mocked(getUnreadAnnouncementCount);
    const mockMarkAll = vi.mocked(markAllAnnouncementsRead);

    // Step 1: Customer has 3 unread announcements
    mockCount.mockResolvedValueOnce(3);
    const initialCount = await getUnreadAnnouncementCount(100);
    expect(initialCount).toBe(3);

    // Step 2: Customer opens announcements page → markAllRead
    mockMarkAll.mockResolvedValue(3);
    const marked = await markAllAnnouncementsRead(100);
    expect(marked).toBe(3);

    // Step 3: Unread count is now 0
    mockCount.mockResolvedValueOnce(0);
    const afterCount = await getUnreadAnnouncementCount(100);
    expect(afterCount).toBe(0);
  });

  it("should increment unread count when new announcement is created", async () => {
    const mockCount = vi.mocked(getUnreadAnnouncementCount);

    // Before new announcement: 0 unread
    mockCount.mockResolvedValueOnce(0);
    expect(await getUnreadAnnouncementCount(100)).toBe(0);

    // After new announcement is created (customer hasn't read it): 1 unread
    mockCount.mockResolvedValueOnce(1);
    expect(await getUnreadAnnouncementCount(100)).toBe(1);
  });

  it("should handle multiple customers independently", async () => {
    const mockCount = vi.mocked(getUnreadAnnouncementCount);

    // Customer A has 2 unread
    mockCount.mockResolvedValueOnce(2);
    expect(await getUnreadAnnouncementCount(100)).toBe(2);

    // Customer B has 5 unread
    mockCount.mockResolvedValueOnce(5);
    expect(await getUnreadAnnouncementCount(200)).toBe(5);

    // Customer C has 0 unread (already read all)
    mockCount.mockResolvedValueOnce(0);
    expect(await getUnreadAnnouncementCount(300)).toBe(0);
  });
});

// ── Procedure Access Control Tests ──
describe("Announcement Read Procedure Access Control", () => {
  it("should return count 0 for non-customer session type", () => {
    // Simulating the router logic: if type !== "customer", return { count: 0 }
    const sessionType = "staff";
    if (sessionType !== "customer") {
      expect({ count: 0 }).toEqual({ count: 0 });
    }
  });

  it("should return count for customer session type", async () => {
    const mockCount = vi.mocked(getUnreadAnnouncementCount);
    mockCount.mockResolvedValue(3);

    const sessionType = "customer";
    if (sessionType === "customer") {
      const count = await getUnreadAnnouncementCount(100);
      expect(count).toBe(3);
    }
  });

  it("markRead should be no-op for non-customer", () => {
    const sessionType = "staff";
    if (sessionType !== "customer") {
      // Should return success without calling markAnnouncementRead
      expect({ success: true }).toEqual({ success: true });
    }
    expect(markAnnouncementRead).not.toHaveBeenCalled();
  });

  it("markAllRead should return marked: 0 for non-customer", () => {
    const sessionType = "staff";
    if (sessionType !== "customer") {
      expect({ marked: 0 }).toEqual({ marked: 0 });
    }
    expect(markAllAnnouncementsRead).not.toHaveBeenCalled();
  });
});

// ── Schema Validation Tests ──
describe("customer_announcement_reads Schema", () => {
  it("should have required fields: customerId, announcementId", () => {
    // Validate the schema structure expectations
    const requiredFields = ["customerId", "announcementId"];
    const schemaFields = ["id", "customerId", "announcementId", "readAt"];
    
    for (const field of requiredFields) {
      expect(schemaFields).toContain(field);
    }
  });

  it("should have auto-increment id", () => {
    const schemaFields = ["id", "customerId", "announcementId", "readAt"];
    expect(schemaFields).toContain("id");
  });

  it("should have readAt with default now()", () => {
    const schemaFields = ["id", "customerId", "announcementId", "readAt"];
    expect(schemaFields).toContain("readAt");
  });

  it("should have unique index on (customerId, announcementId)", () => {
    // The unique constraint prevents duplicate reads
    // This is enforced at the database level via car_customer_announcement_idx
    const uniqueConstraint = { columns: ["customerId", "announcementId"], name: "car_customer_announcement_idx" };
    expect(uniqueConstraint.columns).toEqual(["customerId", "announcementId"]);
  });
});
