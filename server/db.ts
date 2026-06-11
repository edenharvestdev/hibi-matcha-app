import { and, asc, count, desc, eq, gte, lte, sql, inArray, like, or, isNull, isNotNull } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  customers, InsertCustomer,
  branches, InsertBranch,
  staff, InsertStaff,
  staffBranches, InsertStaffBranch,
  staffPermissions, InsertStaffPermission,
  reviewRequests, InsertReviewRequest,
  codes, InsertCode,
  auditLogs, InsertAuditLog,
  franchiseOwners, InsertFranchiseOwner,
  inStoreSales, InsertInStoreSale,
  inStoreSaleStaff, InsertInStoreSaleStaff,
  commissionRecords, InsertCommissionRecord,
  // POS tables
  posCategories, InsertPosCategory,
  posMenuItems, InsertPosMenuItem,
  posBranchMenuItems,
  posOptionGroups, InsertPosOptionGroup,
  posOptions, InsertPosOption,
  posMenuItemOptionGroups,
  posRetailProducts, InsertPosRetailProduct,
  posBranchRetailStock,
  posPaymentMethods, InsertPosPaymentMethod,
  posDiscounts, InsertPosDiscount,
  posOrders, InsertPosOrder,
  posOrderItems, InsertPosOrderItem,
  posOrderItemOptions,
  posOrderPayments, InsertPosOrderPayment,
  posKitchenTickets, InsertPosKitchenTicket,
  posDailySummaries,
  posStaffPins, InsertPosStaffPin,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ── Users (Manus OAuth) ──
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};
    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];
    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };
    textFields.forEach(assignNullable);
    if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
    if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
    else if (user.openId === ENV.ownerOpenId) { values.role = 'admin'; updateSet.role = 'admin'; }
    if (!values.lastSignedIn) values.lastSignedIn = new Date();
    if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
    await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
  } catch (error) { console.error("[Database] Failed to upsert user:", error); throw error; }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ── Customers ──
export async function createCustomer(data: InsertCustomer) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customers).values(data);
  return result[0].insertId;
}

export async function getCustomerByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.phone, phone)).limit(1);
  return result[0] ?? undefined;
}

export async function getCustomerById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(customers).where(eq(customers.id, id)).limit(1);
  return result[0] ?? undefined;
}

// ── Staff ──
export async function createStaffMember(data: InsertStaff) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(staff).values(data);
  return result[0].insertId;
}

export async function getStaffByPhone(phone: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(staff).where(eq(staff.phone, phone)).limit(1);
  return result[0] ?? undefined;
}

export async function getStaffByEmployeeCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(staff).where(eq(staff.employeeCode, code)).limit(1);
  return result[0] ?? undefined;
}

export async function getStaffById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(staff).where(eq(staff.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function listStaff(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (branchId) {
    return db.select().from(staff).where(eq(staff.branchId, branchId)).orderBy(desc(staff.createdAt));
  }
  return db.select().from(staff).orderBy(desc(staff.createdAt));
}

export async function updateStaffMember(id: number, data: Partial<InsertStaff>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(staff).set(data).where(eq(staff.id, id));
}

export async function deleteStaffMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(staff).set({ isActive: 0 }).where(eq(staff.id, id));
}
export async function reactivateStaffMember(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(staff).set({ isActive: 1 }).where(eq(staff.id, id));
}

// ── Branches ──
export async function createBranch(data: InsertBranch) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(branches).values(data);
  return result[0].insertId;
}

export async function listBranches(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(branches).where(eq(branches.isActive, 1)).orderBy(branches.name);
  }
  return db.select().from(branches).orderBy(branches.name);
}

export async function getBranchById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function updateBranch(id: number, data: Partial<InsertBranch>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(branches).set(data).where(eq(branches.id, id));
}

export async function deleteBranch(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(branches).set({ isActive: 0 }).where(eq(branches.id, id));
}

// ── Review Requests ──
export async function createReviewRequest(data: InsertReviewRequest) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviewRequests).values(data);
  return result[0].insertId;
}

export async function deleteRejectedReviewRequest(deliveryApp: string, orderId: string, uniqueOrderId?: string) {
  const db = await getDb();
  if (!db) return;
  // For Shopee/Lineman: match on unique long ID to avoid deleting unrelated rejected reviews
  if (deliveryApp === 'shopee' && uniqueOrderId) {
    await db.delete(reviewRequests).where(
      and(
        eq(reviewRequests.deliveryApp, 'shopee'),
        eq(reviewRequests.shopeeOrderId, uniqueOrderId),
        eq(reviewRequests.status, "rejected")
      )
    );
    return;
  }
  if (deliveryApp === 'lineman' && uniqueOrderId) {
    await db.delete(reviewRequests).where(
      and(
        eq(reviewRequests.deliveryApp, 'lineman'),
        eq(reviewRequests.linemanOrderId, uniqueOrderId),
        eq(reviewRequests.status, "rejected")
      )
    );
    return;
  }
  if (deliveryApp === 'grab' && uniqueOrderId) {
    // Grab: use bookingId for matching — GF numbers recycle
    await db.delete(reviewRequests).where(
      and(
        eq(reviewRequests.deliveryApp, 'grab'),
        eq(reviewRequests.bookingId, uniqueOrderId),
        eq(reviewRequests.status, "rejected")
      )
    );
    return;
  }
  // GPOS: orderId (receipt number) is unique
  await db.delete(reviewRequests).where(
    and(
      eq(reviewRequests.deliveryApp, deliveryApp as any),
      eq(reviewRequests.orderId, orderId),
      eq(reviewRequests.status, "rejected")
    )
  );
}

export async function checkApprovedReviewExists(deliveryApp: string, orderId: string, uniqueOrderId?: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  // Block if same order already has approved OR pending review
  // For Shopee/Lineman: use the unique long ID (shopeeOrderId/linemanOrderId) for dedup
  // For Grab: use bookingId (A-XXXXXXXXXXXXXX) — GF numbers are recycled and NOT unique
  // For GPOS: use orderId (13-digit receipt number) — already unique
  if (deliveryApp === 'shopee' && uniqueOrderId) {
    const result = await db.select({ id: reviewRequests.id }).from(reviewRequests).where(
      and(
        eq(reviewRequests.deliveryApp, 'shopee'),
        eq(reviewRequests.shopeeOrderId, uniqueOrderId),
        inArray(reviewRequests.status, ["approved", "pending"])
      )
    ).limit(1);
    return result.length > 0;
  }
  if (deliveryApp === 'lineman' && uniqueOrderId) {
    const result = await db.select({ id: reviewRequests.id }).from(reviewRequests).where(
      and(
        eq(reviewRequests.deliveryApp, 'lineman'),
        eq(reviewRequests.linemanOrderId, uniqueOrderId),
        inArray(reviewRequests.status, ["approved", "pending"])
      )
    ).limit(1);
    return result.length > 0;
  }
  if (deliveryApp === 'grab' && uniqueOrderId) {
    // Grab: use bookingId for dedup — GF numbers (e.g. GF-949) recycle and are NOT unique
    const result = await db.select({ id: reviewRequests.id }).from(reviewRequests).where(
      and(
        eq(reviewRequests.deliveryApp, 'grab'),
        eq(reviewRequests.bookingId, uniqueOrderId),
        inArray(reviewRequests.status, ["approved", "pending"])
      )
    ).limit(1);
    return result.length > 0;
  }
  // GPOS: use orderId (13-digit receipt number) — already unique
  const result = await db.select({ id: reviewRequests.id }).from(reviewRequests).where(
    and(
      eq(reviewRequests.deliveryApp, deliveryApp as any),
      eq(reviewRequests.orderId, orderId),
      inArray(reviewRequests.status, ["approved", "pending"])
    )
  ).limit(1);
  return result.length > 0;
}

export async function getReviewRequestById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reviewRequests).where(eq(reviewRequests.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function listReviewRequestsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(reviewRequests).where(eq(reviewRequests.customerId, customerId)).orderBy(desc(reviewRequests.createdAt));
}

export async function listReviewRequestsByBranch(branchId: number, status?: string, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(reviewRequests.branchId, branchId)];
  if (status) conditions.push(eq(reviewRequests.status, status as any));
  if (dateFrom) conditions.push(gte(reviewRequests.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(reviewRequests.createdAt, dateTo));
  return db.select().from(reviewRequests).where(and(...conditions)).orderBy(desc(reviewRequests.createdAt));
}

export async function listReviewRequestsByBranches(branchIds: number[], status?: string, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return [];
  if (branchIds.length === 0) return [];
  const conditions: any[] = [inArray(reviewRequests.branchId, branchIds)];
  if (status) conditions.push(eq(reviewRequests.status, status as any));
  if (dateFrom) conditions.push(gte(reviewRequests.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(reviewRequests.createdAt, dateTo));
  return db.select().from(reviewRequests).where(and(...conditions)).orderBy(desc(reviewRequests.createdAt));
}

export async function listAllReviewRequests(status?: string, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (status) conditions.push(eq(reviewRequests.status, status as any));
  if (dateFrom) conditions.push(gte(reviewRequests.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(reviewRequests.createdAt, dateTo));
  if (conditions.length === 0) return db.select().from(reviewRequests).orderBy(desc(reviewRequests.createdAt));
  return db.select().from(reviewRequests).where(and(...conditions)).orderBy(desc(reviewRequests.createdAt));
}

export async function updateReviewRequest(id: number, data: Partial<InsertReviewRequest>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviewRequests).set(data).where(eq(reviewRequests.id, id));
}

// ── Codes ──
export async function createCode(data: InsertCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(codes).values(data);
  return result[0].insertId;
}

export async function getCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(codes).where(eq(codes.code, code)).limit(1);
  return result[0] ?? undefined;
}

export async function listCodesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(codes).where(eq(codes.customerId, customerId)).orderBy(desc(codes.issuedAt));
}

export async function listCodesByBranch(branchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(codes).where(eq(codes.branchId, branchId)).orderBy(desc(codes.issuedAt));
}

export async function listCodesByBranches(branchIds: number[]) {
  const db = await getDb();
  if (!db || branchIds.length === 0) return [];
  return db.select().from(codes).where(inArray(codes.branchId, branchIds)).orderBy(desc(codes.issuedAt));
}

export async function listAllCodes(dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (dateFrom) conditions.push(gte(codes.issuedAt, dateFrom));
  if (dateTo) conditions.push(lte(codes.issuedAt, dateTo));
  if (conditions.length === 0) return db.select().from(codes).orderBy(desc(codes.issuedAt));
  return db.select().from(codes).where(and(...conditions)).orderBy(desc(codes.issuedAt));
}

export async function updateCode(id: number, data: Partial<InsertCode>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(codes).set(data).where(eq(codes.id, id));
}

export async function redeemCode(codeStr: string, staffId: number, staffBranchId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const codeRecord = await getCodeByCode(codeStr);
  if (!codeRecord) return { success: false, error: "ไม่พบโค้ดนี้ในระบบ" };
  if (codeRecord.status === "redeemed") return { success: false, error: "โค้ดนี้ถูกใช้ไปแล้ว" };
  if (codeRecord.status === "cancelled") return { success: false, error: "โค้ดนี้ถูกยกเลิกแล้ว" };
  if (codeRecord.status === "expired" || new Date() > codeRecord.expiresAt) return { success: false, error: "โค้ดนี้หมดอายุแล้ว" };
  // บังคับเลือกเมนูก่อนใช้โค้ด (ยกเว้น CL code — manager เลือกเมนูชดเชยตอนสร้างแล้ว)
  if (!codeRecord.selectedMenuItemId && !codeRecord.selectedMenuCode) {
    if (codeRecord.type === "CL") {
      // CL codes: อนุญาตให้ผ่านได้เสมอ — ไม่ต้องรอลูกค้าเลือกเมนู
    } else {
      return { success: false, error: "ลูกค้ายังไม่ได้เลือกเมนู กรุณาแจ้งลูกค้าเลือกเมนูก่อนใช้โค้ด" };
    }
  }
  // ตรวจสอบสาขา — โค้ดต้องใช้ที่สาขาที่ออกให้เท่านั้น
  if (staffBranchId && codeRecord.branchId && codeRecord.branchId !== staffBranchId) {
    const codeBranch = await getBranchById(codeRecord.branchId);
    const codeBranchName = codeBranch?.name || `สาขา #${codeRecord.branchId}`;
    return { success: false, error: `โค้ดนี้เป็นของ${codeBranchName} ไม่สามารถใช้ที่สาขานี้ได้ กรุณาแจ้งลูกค้าใช้ที่สาขาที่ออกโค้ดให้` };
  }
  await db.update(codes).set({
    status: "redeemed",
    redeemedAt: new Date(),
    redeemedBy: staffId,
  }).where(eq(codes.id, codeRecord.id));
  return { success: true, code: codeRecord };
}

// ── Audit Logs ──
export async function createAuditLog(data: InsertAuditLog) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(data);
}

export async function listAuditLogs(limit = 100, offset = 0, action?: string, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (action) conditions.push(eq(auditLogs.action, action));
  if (dateFrom) conditions.push(gte(auditLogs.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(auditLogs.createdAt, dateTo));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select().from(auditLogs).where(whereClause).orderBy(desc(auditLogs.createdAt)).limit(limit).offset(offset);
}

// ── Reporting ──
export async function getReportData(branchId?: number, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return { codesPerBranch: [], approvalRate: { total: 0, approved: 0, rejected: 0, rate: 0 }, rejectionReasons: [], clIssuedCount: 0 };

  // Build date conditions for codes
  const codeDateConditions: any[] = [];
  if (branchId) codeDateConditions.push(eq(codes.branchId, branchId));
  if (dateFrom) codeDateConditions.push(gte(codes.issuedAt, dateFrom));
  if (dateTo) codeDateConditions.push(lte(codes.issuedAt, dateTo));
  const codeWhere = codeDateConditions.length > 0 ? and(...codeDateConditions) : undefined;

  // Codes issued per branch
  const codesPerBranch = await db.select({
    branchId: codes.branchId,
    branchName: branches.name,
    totalIssued: count(),
    rvCount: sql<number>`SUM(CASE WHEN ${codes.type} = 'RV' THEN 1 ELSE 0 END)`,
    clCount: sql<number>`SUM(CASE WHEN ${codes.type} = 'CL' THEN 1 ELSE 0 END)`,
    redeemedCount: sql<number>`SUM(CASE WHEN ${codes.status} = 'redeemed' THEN 1 ELSE 0 END)`,
  }).from(codes)
    .leftJoin(branches, eq(codes.branchId, branches.id))
    .where(codeWhere)
    .groupBy(codes.branchId, branches.name);

  // Build date conditions for reviews
  const reviewDateConditions: any[] = [];
  if (branchId) reviewDateConditions.push(eq(reviewRequests.branchId, branchId));
  if (dateFrom) reviewDateConditions.push(gte(reviewRequests.createdAt, dateFrom));
  if (dateTo) reviewDateConditions.push(lte(reviewRequests.createdAt, dateTo));
  const reviewWhere = reviewDateConditions.length > 0 ? and(...reviewDateConditions) : undefined;

  // RV approval rate
  const [totalReviews] = await db.select({ count: count() }).from(reviewRequests).where(reviewWhere);
  const [approvedReviews] = await db.select({ count: count() }).from(reviewRequests).where(and(...[eq(reviewRequests.status, 'approved'), ...reviewDateConditions]));
  const [rejectedReviews] = await db.select({ count: count() }).from(reviewRequests).where(and(...[eq(reviewRequests.status, 'rejected'), ...reviewDateConditions]));
  const total = totalReviews?.count ?? 0;
  const approved = approvedReviews?.count ?? 0;
  const rejected = rejectedReviews?.count ?? 0;

  // Rejection reasons
  const rejectionReasons = await db.select({
    reason: reviewRequests.rejectionReason,
    count: count(),
  }).from(reviewRequests)
    .where(and(eq(reviewRequests.status, 'rejected'), sql`${reviewRequests.rejectionReason} IS NOT NULL`, ...(reviewDateConditions.length > 0 ? reviewDateConditions : [])))
    .groupBy(reviewRequests.rejectionReason)
    .orderBy(desc(count()));

  // CL issued count
  const clConditions: any[] = [eq(codes.type, 'CL')];
  if (branchId) clConditions.push(eq(codes.branchId, branchId));
  if (dateFrom) clConditions.push(gte(codes.issuedAt, dateFrom));
  if (dateTo) clConditions.push(lte(codes.issuedAt, dateTo));
  const [clIssued] = await db.select({ count: count() }).from(codes).where(and(...clConditions));

  return {
    codesPerBranch,
    approvalRate: { total, approved, rejected, rate: total > 0 ? Math.round((approved / total) * 100) : 0 },
    rejectionReasons,
    clIssuedCount: clIssued?.count ?? 0,
  };
}

export async function getAllCodesForExport(branchId?: number, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (branchId) conditions.push(eq(codes.branchId, branchId));
  if (dateFrom) conditions.push(gte(codes.issuedAt, dateFrom));
  if (dateTo) conditions.push(lte(codes.issuedAt, dateTo));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  return db.select({
    id: codes.id, code: codes.code, type: codes.type, branchId: codes.branchId,
    email: codes.email, status: codes.status, issuedAt: codes.issuedAt,
    expiresAt: codes.expiresAt, redeemedAt: codes.redeemedAt,
    claimReason: codes.claimReason, claimOrderId: codes.claimOrderId,
  }).from(codes).where(whereClause).orderBy(desc(codes.issuedAt));
}

// ── Dashboard Stats ──
export async function getDashboardStats(branchId?: number) {
  const db = await getDb();
  if (!db) return { totalPendingReviews: 0, totalApprovedToday: 0, totalCodesIssued: 0, totalCodesRedeemed: 0, totalCodesExpired: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pendingConditions = branchId
    ? and(eq(reviewRequests.status, "pending"), eq(reviewRequests.branchId, branchId))
    : eq(reviewRequests.status, "pending");

  const approvedConditions = branchId
    ? and(eq(reviewRequests.status, "approved"), gte(reviewRequests.updatedAt, today), eq(reviewRequests.branchId, branchId))
    : and(eq(reviewRequests.status, "approved"), gte(reviewRequests.updatedAt, today));

  const codeIssuedConditions = branchId
    ? and(eq(codes.status, "issued"), eq(codes.branchId, branchId))
    : eq(codes.status, "issued");

  const codeRedeemedConditions = branchId
    ? and(eq(codes.status, "redeemed"), eq(codes.branchId, branchId))
    : eq(codes.status, "redeemed");

  const codeExpiredConditions = branchId
    ? and(eq(codes.status, "expired"), eq(codes.branchId, branchId))
    : eq(codes.status, "expired");

  const [pending, approved, issued, redeemed, expired] = await Promise.all([
    db.select({ count: count() }).from(reviewRequests).where(pendingConditions),
    db.select({ count: count() }).from(reviewRequests).where(approvedConditions),
    db.select({ count: count() }).from(codes).where(codeIssuedConditions),
    db.select({ count: count() }).from(codes).where(codeRedeemedConditions),
    db.select({ count: count() }).from(codes).where(codeExpiredConditions),
  ]);

  return {
    totalPendingReviews: pending[0]?.count ?? 0,
    totalApprovedToday: approved[0]?.count ?? 0,
    totalCodesIssued: issued[0]?.count ?? 0,
    totalCodesRedeemed: redeemed[0]?.count ?? 0,
    totalCodesExpired: expired[0]?.count ?? 0,
  };
}

export async function getDashboardStatsMultiBranch(branchIds: number[]) {
  const db = await getDb();
  if (!db || branchIds.length === 0) return { totalPendingReviews: 0, totalApprovedToday: 0, totalCodesIssued: 0, totalCodesRedeemed: 0, totalCodesExpired: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [pending, approved, issued, redeemed, expired] = await Promise.all([
    db.select({ count: count() }).from(reviewRequests).where(and(eq(reviewRequests.status, "pending"), inArray(reviewRequests.branchId, branchIds))),
    db.select({ count: count() }).from(reviewRequests).where(and(eq(reviewRequests.status, "approved"), gte(reviewRequests.updatedAt, today), inArray(reviewRequests.branchId, branchIds))),
    db.select({ count: count() }).from(codes).where(and(eq(codes.status, "issued"), inArray(codes.branchId, branchIds))),
    db.select({ count: count() }).from(codes).where(and(eq(codes.status, "redeemed"), inArray(codes.branchId, branchIds))),
    db.select({ count: count() }).from(codes).where(and(eq(codes.status, "expired"), inArray(codes.branchId, branchIds))),
  ]);

  return {
    totalPendingReviews: pending[0]?.count ?? 0,
    totalApprovedToday: approved[0]?.count ?? 0,
    totalCodesIssued: issued[0]?.count ?? 0,
    totalCodesRedeemed: redeemed[0]?.count ?? 0,
    totalCodesExpired: expired[0]?.count ?? 0,
  };
}


export async function getReportDataMultiBranch(branchIds: number[]) {
  const db = await getDb();
  if (!db || branchIds.length === 0) return { codesPerBranch: [], approvalRate: { total: 0, approved: 0, rejected: 0, rate: 0 }, rejectionReasons: [], clIssuedCount: 0 };

  // Codes issued per branch (only assigned branches)
  const codesPerBranch = await db.select({
    branchId: codes.branchId,
    branchName: branches.name,
    totalIssued: count(),
    rvCount: sql<number>`SUM(CASE WHEN ${codes.type} = 'RV' THEN 1 ELSE 0 END)`,
    clCount: sql<number>`SUM(CASE WHEN ${codes.type} = 'CL' THEN 1 ELSE 0 END)`,
    redeemedCount: sql<number>`SUM(CASE WHEN ${codes.status} = 'redeemed' THEN 1 ELSE 0 END)`,
  }).from(codes)
    .leftJoin(branches, eq(codes.branchId, branches.id))
    .where(inArray(codes.branchId, branchIds))
    .groupBy(codes.branchId, branches.name);

  // RV approval rate for assigned branches
  const [totalReviews] = await db.select({ count: count() }).from(reviewRequests).where(inArray(reviewRequests.branchId, branchIds));
  const [approvedReviews] = await db.select({ count: count() }).from(reviewRequests).where(and(eq(reviewRequests.status, 'approved'), inArray(reviewRequests.branchId, branchIds)));
  const [rejectedReviews] = await db.select({ count: count() }).from(reviewRequests).where(and(eq(reviewRequests.status, 'rejected'), inArray(reviewRequests.branchId, branchIds)));
  const total = totalReviews?.count ?? 0;
  const approved = approvedReviews?.count ?? 0;
  const rejected = rejectedReviews?.count ?? 0;

  // Rejection reasons for assigned branches
  const rejectionReasons = await db.select({
    reason: reviewRequests.rejectionReason,
    count: count(),
  }).from(reviewRequests)
    .where(and(eq(reviewRequests.status, 'rejected'), sql`${reviewRequests.rejectionReason} IS NOT NULL`, inArray(reviewRequests.branchId, branchIds)))
    .groupBy(reviewRequests.rejectionReason)
    .orderBy(desc(count()));

  // CL issued count for assigned branches
  const [clIssued] = await db.select({ count: count() }).from(codes).where(and(eq(codes.type, 'CL'), inArray(codes.branchId, branchIds)));

  return {
    codesPerBranch,
    approvalRate: { total, approved, rejected, rate: total > 0 ? Math.round((approved / total) * 100) : 0 },
    rejectionReasons,
    clIssuedCount: clIssued?.count ?? 0,
  };
}

// ── Customer Database ──
export async function listAllCustomers(search?: string, limitNum: number = 200, branchFilter?: number) {
  const db = await getDb();
  if (!db) return [];
  
  const baseQuery = db.select({
    id: customers.id,
    phone: customers.phone,
    name: customers.name,
    email: customers.email,
    createdAt: customers.createdAt,
    totalReviews: sql<number>`(SELECT COUNT(*) FROM review_requests WHERE review_requests.customerId = customers.id)`,
    approvedReviews: sql<number>`(SELECT COUNT(*) FROM review_requests WHERE review_requests.customerId = customers.id AND review_requests.status = 'approved')`,
    totalCodes: sql<number>`(SELECT COUNT(*) FROM codes WHERE codes.customerId = customers.id)`,
    redeemedCodes: sql<number>`(SELECT COUNT(*) FROM codes WHERE codes.customerId = customers.id AND codes.codeStatus = 'redeemed')`,
    primaryBranchId: sql<number | null>`(SELECT rr.branchId FROM review_requests rr WHERE rr.customerId = customers.id GROUP BY rr.branchId ORDER BY COUNT(*) DESC LIMIT 1)`,
    primaryBranchName: sql<string | null>`(SELECT b.name FROM branches b WHERE b.id = (SELECT rr2.branchId FROM review_requests rr2 WHERE rr2.customerId = customers.id GROUP BY rr2.branchId ORDER BY COUNT(*) DESC LIMIT 1))`,
    branchNames: sql<string | null>`(SELECT GROUP_CONCAT(DISTINCT b2.name ORDER BY b2.name SEPARATOR ', ') FROM review_requests rr3 INNER JOIN branches b2 ON b2.id = rr3.branchId WHERE rr3.customerId = customers.id)`,
  }).from(customers);

  const conditions: any[] = [];
  
  if (search && search.trim()) {
    const s = `%${search.trim()}%`;
    conditions.push(sql`(${customers.name} LIKE ${s} OR ${customers.phone} LIKE ${s} OR ${customers.email} LIKE ${s})`);
  }
  
  if (branchFilter) {
    conditions.push(sql`customers.id IN (SELECT DISTINCT rr4.customerId FROM review_requests rr4 WHERE rr4.branchId = ${branchFilter})`);
  }
  
  if (conditions.length > 0) {
    const combined = conditions.length === 1 ? conditions[0] : sql`${conditions[0]} AND ${conditions[1]}`;
    return baseQuery.where(combined).orderBy(desc(customers.createdAt)).limit(limitNum);
  }
  
  return baseQuery.orderBy(desc(customers.createdAt)).limit(limitNum);
}

export async function getCustomerStats() {
  const db = await getDb();
  if (!db) return { totalCustomers: 0, newToday: 0, newThisWeek: 0, newThisMonth: 0 };
  
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [total] = await db.select({ count: count() }).from(customers);
  const [today] = await db.select({ count: count() }).from(customers).where(gte(customers.createdAt, todayStart));
  const [week] = await db.select({ count: count() }).from(customers).where(gte(customers.createdAt, weekStart));
  const [month] = await db.select({ count: count() }).from(customers).where(gte(customers.createdAt, monthStart));

  return {
    totalCustomers: total?.count ?? 0,
    newToday: today?.count ?? 0,
    newThisWeek: week?.count ?? 0,
    newThisMonth: month?.count ?? 0,
  };
}

// ── Loyalty Points ──
import {
  loyaltyPoints, InsertLoyaltyPoint,
  pointTransactions, InsertPointTransaction,
  pointClaims, InsertPointClaim,
  rewards, InsertReward,
  rewardRedemptions, InsertRewardRedemption,
} from "../drizzle/schema";

/// Points rate: flat rate for all customers (no tier differentiation)
const POINTS_RATE = 10; // 10 baht = 1 point for everyone

export function calculatePoints(amountBaht: number, _tier?: string): number {
  return Math.floor(amountBaht / POINTS_RATE);
}

export async function getOrCreateLoyaltyPoints(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(loyaltyPoints).where(eq(loyaltyPoints.customerId, customerId)).limit(1);
  if (existing[0]) return existing[0];
  await db.insert(loyaltyPoints).values({ customerId, totalPoints: 0, usedPoints: 0, tier: "green", lifetimePoints: 0 });
  const created = await db.select().from(loyaltyPoints).where(eq(loyaltyPoints.customerId, customerId)).limit(1);
  return created[0];
}

export async function addPoints(customerId: number, points: number, type: "earn_store" | "earn_delivery", orderAmount: number, description: string, branchId?: number, staffId?: number, referenceType?: string, referenceId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const lp = await getOrCreateLoyaltyPoints(customerId);
  const newTotal = lp.totalPoints + points;
  const newLifetime = lp.lifetimePoints + points;
  // No tier system - keep tier as current value (backward compatible)
  await db.update(loyaltyPoints).set({ totalPoints: newTotal, lifetimePoints: newLifetime }).where(eq(loyaltyPoints.customerId, customerId));
  await db.insert(pointTransactions).values({
    customerId, type, points, balanceAfter: newTotal, orderAmount,
    description, referenceType: referenceType || null, referenceId: referenceId || null,
    branchId: branchId || null, staffId: staffId || null,
  });
  return { totalPoints: newTotal, lifetimePoints: newLifetime, tier: lp.tier, pointsEarned: points };
}

export async function spendPoints(customerId: number, points: number, description: string, referenceType?: string, referenceId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const lp = await getOrCreateLoyaltyPoints(customerId);
  const available = lp.totalPoints - lp.usedPoints;
  if (available < points) return { success: false, error: "แต้มไม่เพียงพอ" };
  const newUsed = lp.usedPoints + points;
  const newBalance = lp.totalPoints - newUsed;
  await db.update(loyaltyPoints).set({ usedPoints: newUsed }).where(eq(loyaltyPoints.customerId, customerId));
  await db.insert(pointTransactions).values({
    customerId, type: "spend", points: -points, balanceAfter: newBalance,
    description, referenceType: referenceType || null, referenceId: referenceId || null,
  });
  return { success: true, balance: newBalance };
}

export async function deductPoints(customerId: number, points: number, reason: string, branchId?: number, staffId?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const lp = await getOrCreateLoyaltyPoints(customerId);
  const available = lp.totalPoints - lp.usedPoints;
  if (points > available) return { success: false as const, error: "แต้มลูกค้าไม่เพียงพอสำหรับการหัก" };
  const newTotal = lp.totalPoints - points;
  const newLifetime = Math.max(0, lp.lifetimePoints - points);
  await db.update(loyaltyPoints).set({ totalPoints: newTotal, lifetimePoints: newLifetime }).where(eq(loyaltyPoints.customerId, customerId));
  const newBalance = newTotal - lp.usedPoints;
  await db.insert(pointTransactions).values({
    customerId, type: "adjust", points: -points, balanceAfter: newBalance,
    description: reason, referenceType: "manual_deduct", referenceId: null,
    branchId: branchId || null, staffId: staffId || null,
  });
  return { success: true as const, newBalance, pointsDeducted: points };
}

export async function deductBranchPoints(customerId: number, branchId: number, points: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const blp = await getOrCreateBranchLoyalty(customerId, branchId);
  const available = blp.totalPoints - blp.usedPoints;
  if (points > available) return { success: false as const, error: "แต้มสาขานี้ไม่เพียงพอ" };
  const newTotal = blp.totalPoints - points;
  const newLifetime = Math.max(0, blp.lifetimePoints - points);
  await db.update(branchLoyaltyPoints).set({ totalPoints: newTotal, lifetimePoints: newLifetime })
    .where(and(eq(branchLoyaltyPoints.customerId, customerId), eq(branchLoyaltyPoints.branchId, branchId)));
  return { success: true as const, balance: newTotal - blp.usedPoints };
}

export async function getPointTransactions(customerId: number, limit = 50, offset = 0) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pointTransactions).where(eq(pointTransactions.customerId, customerId)).orderBy(desc(pointTransactions.createdAt)).limit(limit).offset(offset);
}

export async function listEarnStoreHistory(limit = 30, offset = 0, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(pointTransactions.type, "earn_store")];
  if (dateFrom) conditions.push(gte(pointTransactions.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(pointTransactions.createdAt, dateTo));
  const rows = await db.select({
    id: pointTransactions.id,
    customerId: pointTransactions.customerId,
    points: pointTransactions.points,
    orderAmount: pointTransactions.orderAmount,
    description: pointTransactions.description,
    branchId: pointTransactions.branchId,
    staffId: pointTransactions.staffId,
    createdAt: pointTransactions.createdAt,
  }).from(pointTransactions).where(and(...conditions)).orderBy(desc(pointTransactions.createdAt)).limit(limit).offset(offset);
  const customerIds = Array.from(new Set(rows.map(r => r.customerId)));
  const branchIds = Array.from(new Set(rows.filter(r => r.branchId).map(r => r.branchId!)));
  const staffIds = Array.from(new Set(rows.filter(r => r.staffId).map(r => r.staffId!)));
  const [customersList, branchesList, staffList] = await Promise.all([
    customerIds.length ? db.select({ id: customers.id, name: customers.name }).from(customers).where(inArray(customers.id, customerIds)) : [],
    branchIds.length ? db.select({ id: branches.id, name: branches.name }).from(branches).where(inArray(branches.id, branchIds)) : [],
    staffIds.length ? db.select({ id: staff.id, name: staff.name }).from(staff).where(inArray(staff.id, staffIds)) : [],
  ]);
  const custMap = Object.fromEntries(customersList.map(c => [c.id, c.name]));
  const branchMap = Object.fromEntries(branchesList.map(b => [b.id, b.name]));
  const staffMap = Object.fromEntries(staffList.map(s => [s.id, s.name]));
  return rows.map(r => ({
    ...r,
    customerName: custMap[r.customerId] || "\u0e44\u0e21\u0e48\u0e17\u0e23\u0e32\u0e1a",
    branchName: r.branchId ? (branchMap[r.branchId] || "-") : "-",
    staffName: r.staffId ? (staffMap[r.staffId] || "-") : "-",
  }));
}

// ── Point Claims (Delivery) ──
export async function checkExistingClaim(deliveryApp: string, orderId: string) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select({ id: pointClaims.id, status: pointClaims.status })
    .from(pointClaims)
    .where(and(eq(pointClaims.deliveryApp, deliveryApp as any), eq(pointClaims.orderId, orderId)))
    .limit(1);
  return result[0] || null;
}

export async function deletePointClaim(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pointClaims).where(eq(pointClaims.id, id));
}

export async function createPointClaim(data: InsertPointClaim) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(pointClaims).values(data);
  return result[0].insertId;
}

export async function getPointClaimById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(pointClaims).where(eq(pointClaims.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function listPointClaimsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pointClaims).where(eq(pointClaims.customerId, customerId)).orderBy(desc(pointClaims.createdAt));
}

export async function listPointClaims(status?: string, branchId?: number, fromDate?: Date, toDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (status) conditions.push(eq(pointClaims.status, status as any));
  if (branchId) conditions.push(eq(pointClaims.branchId, branchId));
  // Filter by orderDate (วันที่สั่งซื้อ) — fallback to createdAt for claims without orderDate
  if (fromDate) conditions.push(gte(sql`COALESCE(${pointClaims.orderDate}, ${pointClaims.createdAt})`, fromDate));
  if (toDate) conditions.push(lte(sql`COALESCE(${pointClaims.orderDate}, ${pointClaims.createdAt})`, toDate));
  const rows = conditions.length > 0
    ? await db.select({ claim: pointClaims, customerName: customers.name }).from(pointClaims).leftJoin(customers, eq(pointClaims.customerId, customers.id)).where(and(...conditions)).orderBy(desc(pointClaims.createdAt))
    : await db.select({ claim: pointClaims, customerName: customers.name }).from(pointClaims).leftJoin(customers, eq(pointClaims.customerId, customers.id)).orderBy(desc(pointClaims.createdAt));
  return rows.map(r => ({ ...r.claim, customerName: r.customerName }));
}

export async function updatePointClaim(id: number, data: Partial<InsertPointClaim>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(pointClaims).set(data).where(eq(pointClaims.id, id));
}

// Check if a Grab bookingId already exists among approved claims (rejected ones are freed)
export async function checkBookingIdApproved(bookingId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: pointClaims.id }).from(pointClaims)
    .where(and(eq(pointClaims.bookingId, bookingId), eq(pointClaims.status, "approved" as any)))
    .limit(1);
  return result.length > 0;
}

// Check if a Grab bookingId exists among pending claims (to prevent duplicate pending)
export async function checkBookingIdPending(bookingId: string, excludeClaimId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const conditions = [eq(pointClaims.bookingId, bookingId), eq(pointClaims.status, "pending" as any)];
  if (excludeClaimId) conditions.push(sql`${pointClaims.id} != ${excludeClaimId}`);
  const result = await db.select({ id: pointClaims.id }).from(pointClaims)
    .where(and(...conditions))
    .limit(1);
  return result.length > 0;
}

// Check if a Shopee shopeeOrderId already exists among approved claims
export async function checkShopeeOrderIdApproved(shopeeOrderId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: pointClaims.id }).from(pointClaims)
    .where(and(eq(pointClaims.shopeeOrderId, shopeeOrderId), eq(pointClaims.status, "approved" as any)))
    .limit(1);
  return result.length > 0;
}

// Check if a Shopee shopeeOrderId exists among pending claims
export async function checkShopeeOrderIdPending(shopeeOrderId: string, excludeClaimId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const conditions = [eq(pointClaims.shopeeOrderId, shopeeOrderId), eq(pointClaims.status, "pending" as any)];
  if (excludeClaimId) conditions.push(sql`${pointClaims.id} != ${excludeClaimId}`);
  const result = await db.select({ id: pointClaims.id }).from(pointClaims)
    .where(and(...conditions))
    .limit(1);
  return result.length > 0;
}

// Check if a LINE MAN linemanOrderId already exists among approved claims
export async function checkLinemanOrderIdApproved(linemanOrderId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const result = await db.select({ id: pointClaims.id }).from(pointClaims)
    .where(and(eq(pointClaims.linemanOrderId, linemanOrderId), eq(pointClaims.status, "approved" as any)))
    .limit(1);
  return result.length > 0;
}

// Check if a LINE MAN linemanOrderId exists among pending claims
export async function checkLinemanOrderIdPending(linemanOrderId: string, excludeClaimId?: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const conditions = [eq(pointClaims.linemanOrderId, linemanOrderId), eq(pointClaims.status, "pending" as any)];
  if (excludeClaimId) conditions.push(sql`${pointClaims.id} != ${excludeClaimId}`);
  const result = await db.select({ id: pointClaims.id }).from(pointClaims)
    .where(and(...conditions))
    .limit(1);
  return result.length > 0;
}

// ── Rewards ──
export async function createReward(data: InsertReward) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rewards).values(data);
  return result[0].insertId;
}

export async function listRewards(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(rewards).where(eq(rewards.isActive, 1)).orderBy(rewards.pointsCost);
  }
  return db.select().from(rewards).orderBy(rewards.pointsCost);
}

export async function getRewardById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rewards).where(eq(rewards.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function updateReward(id: number, data: Partial<InsertReward>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rewards).set(data).where(eq(rewards.id, id));
}

export async function deleteReward(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(rewards).where(eq(rewards.id, id));
}

// ── Reward Redemptions ──
export async function createRewardRedemption(data: InsertRewardRedemption) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(rewardRedemptions).values(data);
  return result[0].insertId;
}

export async function getRedemptionByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(rewardRedemptions).where(eq(rewardRedemptions.redemptionCode, code)).limit(1);
  return result[0] ?? undefined;
}

export async function listRedemptionsByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rewardRedemptions).where(eq(rewardRedemptions.customerId, customerId)).orderBy(desc(rewardRedemptions.createdAt));
}

export async function updateRedemption(id: number, data: Partial<InsertRewardRedemption>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(rewardRedemptions).set(data).where(eq(rewardRedemptions.id, id));
}

export async function getLoyaltyStats() {
  const db = await getDb();
  if (!db) return { totalMembers: 0, totalPointsIssued: 0, pendingClaims: 0 };
  const [total] = await db.select({ count: count() }).from(loyaltyPoints);
  const [totalPts] = await db.select({ total: sql<number>`COALESCE(SUM(CASE WHEN ${pointTransactions.points} > 0 THEN ${pointTransactions.points} ELSE 0 END), 0)` }).from(pointTransactions);
  const [pending] = await db.select({ count: count() }).from(pointClaims).where(eq(pointClaims.status, "pending"));
  return {
    totalMembers: total?.count ?? 0,
    totalPointsIssued: totalPts?.total ?? 0,
    pendingClaims: pending?.count ?? 0,
  };
}

// ── Order Issues ──
import { orderIssues, InsertOrderIssue, orderIssueImages, InsertOrderIssueImage, contactInquiries, InsertContactInquiry } from "../drizzle/schema";

export async function createOrderIssue(data: InsertOrderIssue): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(orderIssues).values(data);
  return result[0].insertId;
}

export async function addOrderIssueImages(issueId: number, imageUrls: string[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  if (imageUrls.length === 0) return;
  const values = imageUrls.map((url, i) => ({
    orderIssueId: issueId,
    imageUrl: url,
    sortOrder: i,
  }));
  await db.insert(orderIssueImages).values(values);
}

export async function getOrderIssueImagesByIssueId(issueId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orderIssueImages).where(eq(orderIssueImages.orderIssueId, issueId)).orderBy(orderIssueImages.sortOrder);
}

export async function getOrderIssueImagesByIssueIds(issueIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (issueIds.length === 0) return [];
  return db.select().from(orderIssueImages).where(sql`${orderIssueImages.orderIssueId} IN (${sql.raw(issueIds.join(","))})`);
}

export async function getOrderIssueById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(orderIssues).where(eq(orderIssues.id, id)).limit(1);
  if (!result[0]) return null;
  const images = await getOrderIssueImagesByIssueId(id);
  return { ...result[0], images: images.map(img => img.imageUrl) };
}

export async function listOrderIssuesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  const issues = await db.select().from(orderIssues).where(eq(orderIssues.customerId, customerId)).orderBy(desc(orderIssues.createdAt));
  if (issues.length === 0) return [];
  const issueIds = issues.map(i => i.id);
  const allImages = await getOrderIssueImagesByIssueIds(issueIds);
  return issues.map(issue => ({
    ...issue,
    images: allImages.filter(img => img.orderIssueId === issue.id).sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.imageUrl),
  }));
}

export async function listOrderIssues(branchId?: number, status?: string, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (branchId) conditions.push(eq(orderIssues.branchId, branchId));
  if (status) conditions.push(eq(orderIssues.status, status as any));
  if (dateFrom) conditions.push(gte(orderIssues.createdAt, dateFrom));
  if (dateTo) conditions.push(lte(orderIssues.createdAt, dateTo));
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const rows = await db.select({
    issue: orderIssues,
    customerName: customers.name,
    customerPhone: customers.phone,
    assignedStaffName: staff.name,
  }).from(orderIssues)
    .leftJoin(customers, eq(orderIssues.customerId, customers.id))
    .leftJoin(staff, eq(orderIssues.assignedTo, staff.id))
    .where(whereClause)
    .orderBy(desc(orderIssues.createdAt));
  if (rows.length === 0) return rows;
  const issueIds = rows.map(r => r.issue.id);
  const allImages = await getOrderIssueImagesByIssueIds(issueIds);
  return rows.map(row => ({
    ...row,
    issue: {
      ...row.issue,
      images: allImages.filter(img => img.orderIssueId === row.issue.id).sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.imageUrl),
    },
  }));
}

export async function updateOrderIssue(id: number, data: Partial<InsertOrderIssue> & { acknowledgedAt?: Date; resolvedAt?: Date; escalatedAt?: Date; resolution?: string; status?: string; assignedTo?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(orderIssues).set(data as any).where(eq(orderIssues.id, id));
}

export async function getOverdueSlaIssues() {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  return db.select({ issue: orderIssues, customerName: customers.name }).from(orderIssues)
    .leftJoin(customers, eq(orderIssues.customerId, customers.id))
    .where(and(
      sql`${orderIssues.status} IN ('open', 'acknowledged', 'in_progress')`,
      sql`(${orderIssues.slaResponseDeadline} < ${now} AND ${orderIssues.status} = 'open') OR (${orderIssues.slaResolutionDeadline} < ${now} AND ${orderIssues.status} IN ('acknowledged', 'in_progress'))`
    ))
    .orderBy(orderIssues.createdAt);
}

// ── Issue Dashboard Stats ──
export async function getIssueStats() {
  const db = await getDb();
  if (!db) return { byCategory: [], byBranch: [], byStatus: [], sla: { totalResponse: 0, metResponse: 0, totalResolution: 0, metResolution: 0 }, total: 0, recentTrend: [] };

  // All issues
  const allIssues = await db.select().from(orderIssues);
  const total = allIssues.length;

  // By category
  const catMap: Record<string, number> = {};
  allIssues.forEach(i => { catMap[i.category] = (catMap[i.category] || 0) + 1; });
  const byCategory = Object.entries(catMap).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);

  // By branch (join with branch names)
  const branchMap: Record<number, number> = {};
  allIssues.forEach(i => { branchMap[i.branchId] = (branchMap[i.branchId] || 0) + 1; });
  const allBranches = await db.select().from(branches);
  const branchNameMap: Record<number, string> = {};
  allBranches.forEach(b => { branchNameMap[b.id] = b.name; });
  const byBranch = Object.entries(branchMap).map(([bid, count]) => ({ branchId: Number(bid), branchName: branchNameMap[Number(bid)] || `สาขา #${bid}`, count })).sort((a, b) => b.count - a.count);

  // By status
  const statusMap: Record<string, number> = {};
  allIssues.forEach(i => { statusMap[i.status] = (statusMap[i.status] || 0) + 1; });
  const byStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

  // SLA compliance
  let totalResponse = 0, metResponse = 0, totalResolution = 0, metResolution = 0;
  allIssues.forEach(i => {
    // Response SLA: issues that have been acknowledged or beyond
    if (i.acknowledgedAt || ["acknowledged", "in_progress", "resolved", "closed"].includes(i.status)) {
      totalResponse++;
      if (i.acknowledgedAt && new Date(i.acknowledgedAt).getTime() <= new Date(i.slaResponseDeadline).getTime()) {
        metResponse++;
      }
    } else if (i.status === "open") {
      // Still open — check if still within SLA
      totalResponse++;
      if (new Date().getTime() <= new Date(i.slaResponseDeadline).getTime()) {
        metResponse++;
      }
    }
    // Resolution SLA: issues that have been resolved or closed
    if (i.resolvedAt || ["resolved", "closed"].includes(i.status)) {
      totalResolution++;
      if (i.resolvedAt && new Date(i.resolvedAt).getTime() <= new Date(i.slaResolutionDeadline).getTime()) {
        metResolution++;
      }
    }
  });

  // Recent trend: last 7 days
  const now = new Date();
  const recentTrend: { date: string; count: number }[] = [];
  for (let d = 6; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const dateStr = day.toISOString().slice(0, 10);
    const count = allIssues.filter(i => new Date(i.createdAt).toISOString().slice(0, 10) === dateStr).length;
    recentTrend.push({ date: dateStr, count });
  }

  return { byCategory, byBranch, byStatus, sla: { totalResponse, metResponse, totalResolution, metResolution }, total, recentTrend };
}

// ── Contact Inquiries ──

export async function createContactInquiry(data: InsertContactInquiry): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(contactInquiries).values(data);
  return result[0].insertId;
}

export async function listContactInquiries(type?: string, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (type) conditions.push(eq(contactInquiries.type, type as any));
  if (status) conditions.push(eq(contactInquiries.status, status as any));
  return conditions.length > 0
    ? db.select().from(contactInquiries).where(and(...conditions)).orderBy(desc(contactInquiries.createdAt))
    : db.select().from(contactInquiries).orderBy(desc(contactInquiries.createdAt));
}

export async function getContactInquiryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(contactInquiries).where(eq(contactInquiries.id, id)).limit(1);
  return result[0] ?? null;
}

export async function updateContactInquiry(id: number, data: Partial<InsertContactInquiry> & { notes?: string; status?: string; handledBy?: number }) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(contactInquiries).set(data as any).where(eq(contactInquiries.id, id));
}

// ── Branch phone update helper ──
export async function updateBranchPhone(id: number, phone: string | null) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(branches).set({ phone } as any).where(eq(branches.id, id));
}

// ── Staff Branches (Franchise Owner multi-branch) ──
export async function getStaffBranches(staffId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(staffBranches).where(eq(staffBranches.staffId, staffId));
}

export async function setStaffBranches(staffId: number, branchIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete existing assignments
  await db.delete(staffBranches).where(eq(staffBranches.staffId, staffId));
  // Insert new assignments
  if (branchIds.length > 0) {
    await db.insert(staffBranches).values(branchIds.map(branchId => ({ staffId, branchId })));
  }
}

// ── Staff Permissions ──
export const ALL_PERMISSIONS = [
  "manage_branches",
  "manage_staff",
  "approve_reviews",
  "approve_points",
  "manage_rewards",
  "view_reports",
  "manage_issues",
  "manage_inquiries",
  "manage_customers",
  "view_customers",
  "view_audit_logs",
  "manage_accounting",
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

// Default permissions per role
export const DEFAULT_ROLE_PERMISSIONS: Record<string, Permission[]> = {
  super_admin: [...ALL_PERMISSIONS],
  area_manager: ["approve_reviews", "approve_points", "manage_issues", "view_reports", "manage_customers", "view_customers", "manage_accounting"],
  branch_owner: ["approve_reviews", "approve_points", "manage_issues", "manage_staff", "view_reports", "view_customers", "manage_rewards", "manage_accounting"],
  branch_manager: ["approve_reviews", "approve_points", "manage_issues", "manage_accounting"],
  branch_staff: ["approve_points"],
  support_staff: ["manage_issues", "manage_inquiries"],
};

export async function getStaffPermissions(staffId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(staffPermissions).where(eq(staffPermissions.staffId, staffId));
  return rows.map(r => r.permission);
}

export async function setStaffPermissions(staffId: number, permissions: string[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Delete existing permissions
  await db.delete(staffPermissions).where(eq(staffPermissions.staffId, staffId));
  // Insert new permissions
  if (permissions.length > 0) {
    await db.insert(staffPermissions).values(permissions.map(permission => ({ staffId, permission })));
  }
}

export async function hasPermission(staffId: number, permission: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select().from(staffPermissions)
    .where(and(eq(staffPermissions.staffId, staffId), eq(staffPermissions.permission, permission)))
    .limit(1);
  return rows.length > 0;
}

// ── Staff list with permissions and branches ──
export async function listStaffWithDetails(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  let staffList;
  if (branchId) {
    staffList = await db.select().from(staff).where(eq(staff.branchId, branchId)).orderBy(desc(staff.createdAt));
  } else {
    staffList = await db.select().from(staff).orderBy(desc(staff.createdAt));
  }
  // Enrich with permissions and branches
  const enriched = await Promise.all(staffList.map(async (s) => {
    const permissions = await getStaffPermissions(s.id);
    const assignedBranches = await getStaffBranches(s.id);
    return { ...s, permissions, assignedBranchIds: assignedBranches.map(b => b.branchId) };
  }));
  return enriched;
}

// ── Free Drink Campaigns & Codes ──
import {
  freeDrinkCampaigns, InsertFreeDrinkCampaign,
  freeDrinkCodes, InsertFreeDrinkCode,
  branchLoyaltyPoints, InsertBranchLoyaltyPoint,
  customerConsents, InsertCustomerConsent,
} from "../drizzle/schema";

export async function createFreeDrinkCampaign(data: InsertFreeDrinkCampaign) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(freeDrinkCampaigns).values(data);
  return result[0].insertId;
}

export async function listFreeDrinkCampaigns(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(freeDrinkCampaigns).where(eq(freeDrinkCampaigns.isActive, 1)).orderBy(desc(freeDrinkCampaigns.createdAt));
  }
  return db.select().from(freeDrinkCampaigns).orderBy(desc(freeDrinkCampaigns.createdAt));
}

export async function getFreeDrinkCampaignById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(freeDrinkCampaigns).where(eq(freeDrinkCampaigns.id, id)).limit(1);
  return rows[0];
}

export async function updateFreeDrinkCampaign(id: number, data: Partial<InsertFreeDrinkCampaign>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(freeDrinkCampaigns).set(data).where(eq(freeDrinkCampaigns.id, id));
}

// Generate readable free drink code: HIBI-{menuCode}-{sizeCode}-{milkCode}-{random4}
export async function generateFreeDrinkCode(menuCode: string, sizeCode: string, milkCode?: string): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const MAX_ATTEMPTS = 10;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let suffix = "";
    for (let i = 0; i < 4; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
    const parts = ["HIBI", menuCode, sizeCode];
    if (milkCode) parts.push(milkCode);
    parts.push(suffix);
    const code = parts.join("-");
    // Check if code already exists in DB
    const existing = await getFreeDrinkCodeByCode(code);
    if (!existing) return code;
  }
  // Fallback: use 6-char suffix
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += chars.charAt(Math.floor(Math.random() * chars.length));
  const parts = ["HIBI", menuCode, sizeCode];
  if (milkCode) parts.push(milkCode);
  parts.push(suffix);
  return parts.join("-");
}

export async function createFreeDrinkCode(data: InsertFreeDrinkCode) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(freeDrinkCodes).values(data);
  return result[0].insertId;
}

export async function getFreeDrinkCodeByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(freeDrinkCodes).where(eq(freeDrinkCodes.code, code)).limit(1);
  return rows[0];
}

export async function listFreeDrinkCodesByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(freeDrinkCodes).where(eq(freeDrinkCodes.customerId, customerId)).orderBy(desc(freeDrinkCodes.createdAt));
}

export async function listFreeDrinkCodesByCampaign(campaignId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(freeDrinkCodes).where(eq(freeDrinkCodes.campaignId, campaignId)).orderBy(desc(freeDrinkCodes.createdAt));
}

export async function countFreeDrinkCodesByCustomerCampaign(customerId: number, campaignId: number) {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select().from(freeDrinkCodes)
    .where(and(eq(freeDrinkCodes.customerId, customerId), eq(freeDrinkCodes.campaignId, campaignId)));
  return rows.length;
}

export async function redeemFreeDrinkCode(code: string, branchId: number, staffId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(freeDrinkCodes).set({
    status: "redeemed",
    redeemedAt: new Date(),
    redeemedBranchId: branchId,
    redeemedByStaffId: staffId,
  }).where(eq(freeDrinkCodes.code, code));
}

// ── Branch Loyalty Points ──

export async function getOrCreateBranchLoyalty(customerId: number, branchId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const existing = await db.select().from(branchLoyaltyPoints)
    .where(and(eq(branchLoyaltyPoints.customerId, customerId), eq(branchLoyaltyPoints.branchId, branchId)))
    .limit(1);
  if (existing[0]) return existing[0];
  await db.insert(branchLoyaltyPoints).values({ customerId, branchId, totalPoints: 0, usedPoints: 0, lifetimePoints: 0 });
  const created = await db.select().from(branchLoyaltyPoints)
    .where(and(eq(branchLoyaltyPoints.customerId, customerId), eq(branchLoyaltyPoints.branchId, branchId)))
    .limit(1);
  return created[0];
}

export async function addBranchPoints(customerId: number, branchId: number, points: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const blp = await getOrCreateBranchLoyalty(customerId, branchId);
  const newTotal = blp.totalPoints + points;
  const newLifetime = blp.lifetimePoints + points;
  await db.update(branchLoyaltyPoints).set({ totalPoints: newTotal, lifetimePoints: newLifetime })
    .where(and(eq(branchLoyaltyPoints.customerId, customerId), eq(branchLoyaltyPoints.branchId, branchId)));
  return { totalPoints: newTotal, lifetimePoints: newLifetime, usedPoints: blp.usedPoints };
}

export async function spendBranchPoints(customerId: number, branchId: number, points: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const blp = await getOrCreateBranchLoyalty(customerId, branchId);
  const available = blp.totalPoints - blp.usedPoints;
  if (available < points) return { success: false as const, error: "แต้มสาขานี้ไม่เพียงพอ" };
  const newUsed = blp.usedPoints + points;
  await db.update(branchLoyaltyPoints).set({ usedPoints: newUsed })
    .where(and(eq(branchLoyaltyPoints.customerId, customerId), eq(branchLoyaltyPoints.branchId, branchId)));
  return { success: true as const, balance: blp.totalPoints - newUsed };
}

export async function listBranchLoyaltyByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(branchLoyaltyPoints).where(eq(branchLoyaltyPoints.customerId, customerId));
}

export async function getBranchLoyaltyAggregateByBranch() {
  const db = await getDb();
  if (!db) return [];
  // Return all branch loyalty records grouped by branch
  return db.select().from(branchLoyaltyPoints).orderBy(branchLoyaltyPoints.branchId);
}

// ── Customer Consents ──

export async function createCustomerConsent(data: InsertCustomerConsent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(customerConsents).values(data);
  return result[0].insertId;
}

export async function getCustomerConsents(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(customerConsents).where(eq(customerConsents.customerId, customerId)).orderBy(desc(customerConsents.acceptedAt));
}

export async function hasAcceptedConsent(customerId: number, consentType: "pdpa" | "terms" | "marketing", version: string) {
  const db = await getDb();
  if (!db) return false;
  const rows = await db.select().from(customerConsents)
    .where(and(
      eq(customerConsents.customerId, customerId),
      eq(customerConsents.consentType, consentType),
      eq(customerConsents.version, version),
      eq(customerConsents.accepted, 1),
    )).limit(1);
  return rows.length > 0;
}


// ── Announcements ──
import { announcements, InsertAnnouncement, customerAnnouncementReads } from "../drizzle/schema";

export async function createAnnouncement(data: InsertAnnouncement) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(announcements).values(data);
  return result[0].insertId;
}

export async function listAnnouncements(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    const now = new Date();
    return db.select().from(announcements)
      .where(and(
        eq(announcements.isActive, 1),
        // Don't filter by startDate - show all active announcements
        sql`(${announcements.endDate} IS NULL OR ${announcements.endDate} >= ${now})`,
        sql`(${announcements.scheduledAt} IS NULL OR ${announcements.scheduledAt} <= ${now})`,
      ))
      .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
  }
  return db.select().from(announcements).orderBy(desc(announcements.createdAt));
}

export async function getAnnouncementById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(announcements).where(eq(announcements.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function updateAnnouncement(id: number, data: Partial<InsertAnnouncement>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcements).set(data).where(eq(announcements.id, id));
}

export async function deleteAnnouncement(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(announcements).where(eq(announcements.id, id));
}

// ── Announcement Read Tracking ──

export async function markAnnouncementRead(customerId: number, announcementId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Use INSERT IGNORE to avoid duplicate errors
  await db.insert(customerAnnouncementReads)
    .values({ customerId, announcementId })
    .onDuplicateKeyUpdate({ set: { readAt: sql`NOW()` } });
}

export async function markAllAnnouncementsRead(customerId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Get all active announcement IDs that this customer hasn't read yet
  const now = new Date();
  const activeAnnouncements = await db.select({ id: announcements.id })
    .from(announcements)
    .where(and(
      eq(announcements.isActive, 1),
      sql`${announcements.startDate} <= ${now}`,
      sql`(${announcements.endDate} IS NULL OR ${announcements.endDate} >= ${now})`,
    ));
  
  if (activeAnnouncements.length === 0) return 0;
  
  // Get already-read announcement IDs
  const alreadyRead = await db.select({ announcementId: customerAnnouncementReads.announcementId })
    .from(customerAnnouncementReads)
    .where(eq(customerAnnouncementReads.customerId, customerId));
  const readSet = new Set(alreadyRead.map(r => r.announcementId));
  
  // Insert only unread ones
  const unreadIds = activeAnnouncements.filter(a => !readSet.has(a.id)).map(a => a.id);
  if (unreadIds.length === 0) return 0;
  
  await db.insert(customerAnnouncementReads)
    .values(unreadIds.map(aid => ({ customerId, announcementId: aid })))
    .onDuplicateKeyUpdate({ set: { readAt: sql`NOW()` } });
  return unreadIds.length;
}

export async function getUnreadAnnouncementCount(customerId: number) {
  const db = await getDb();
  if (!db) return 0;
  const now = new Date();
  // Count active announcements that the customer hasn't read
  const result = await db.select({ count: count() })
    .from(announcements)
    .where(and(
      eq(announcements.isActive, 1),
      sql`${announcements.startDate} <= ${now}`,
      sql`(${announcements.endDate} IS NULL OR ${announcements.endDate} >= ${now})`,
      sql`(${announcements.scheduledAt} IS NULL OR ${announcements.scheduledAt} <= ${now})`,
      sql`${announcements.id} NOT IN (
        SELECT car_announcementId FROM customer_announcement_reads 
        WHERE car_customerId = ${customerId}
      )`,
    ));
  return result[0]?.count ?? 0;
}

// Get read count per announcement (for admin dashboard)
export async function getAnnouncementReadStats(announcementIds: number[]) {
  const db = await getDb();
  if (!db || announcementIds.length === 0) return [];
  const result = await db.select({
    announcementId: customerAnnouncementReads.announcementId,
    readCount: count(),
  })
    .from(customerAnnouncementReads)
    .where(sql`${customerAnnouncementReads.announcementId} IN (${sql.join(announcementIds.map(id => sql`${id}`), sql`, `)})`)
    .groupBy(customerAnnouncementReads.announcementId);
  return result;
}

// Get list of customers who read a specific announcement
export async function getAnnouncementReaders(announcementId: number) {
  const db = await getDb();
  if (!db) return [];
  const result = await db.select({
    customerId: customerAnnouncementReads.customerId,
    readAt: customerAnnouncementReads.readAt,
  })
    .from(customerAnnouncementReads)
    .where(eq(customerAnnouncementReads.announcementId, announcementId))
    .orderBy(sql`${customerAnnouncementReads.readAt} DESC`);
  return result;
}

// ── Review Menu Items ──
import { reviewMenuItems, InsertReviewMenuItem } from "../drizzle/schema";

export async function createReviewMenuItem(data: InsertReviewMenuItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(reviewMenuItems).values(data);
  return result[0].insertId;
}

export async function listReviewMenuItems(activeOnly = false) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(reviewMenuItems)
      .where(eq(reviewMenuItems.isActive, 1))
      .orderBy(reviewMenuItems.sortOrder, reviewMenuItems.id);
  }
  return db.select().from(reviewMenuItems).orderBy(reviewMenuItems.sortOrder, reviewMenuItems.id);
}

export async function getReviewMenuItemById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(reviewMenuItems).where(eq(reviewMenuItems.id, id)).limit(1);
  return rows[0] ?? undefined;
}

export async function getReviewMenuItemByCode(code: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db.select().from(reviewMenuItems).where(eq(reviewMenuItems.code, code)).limit(1);
  return rows[0] ?? undefined;
}

export async function updateReviewMenuItem(id: number, data: Partial<InsertReviewMenuItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(reviewMenuItems).set(data).where(eq(reviewMenuItems.id, id));
}

export async function deleteReviewMenuItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(reviewMenuItems).where(eq(reviewMenuItems.id, id));
}

// ── Update Free Drink Code with menu selection ──
export async function updateFreeDrinkCodeMenuSelection(codeId: number, data: {
  selectedMenuItemId: number;
  selectedMenuCode: string;
  selectedMenuName: string;
  sweetnessGrams: number;
  packagingType: string;
  remark?: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(freeDrinkCodes).set({
    selectedMenuItemId: data.selectedMenuItemId,
    selectedMenuCode: data.selectedMenuCode,
    selectedMenuName: data.selectedMenuName,
    sweetnessGrams: data.sweetnessGrams,
    packagingType: data.packagingType,
    remark: data.remark ?? null,
  }).where(eq(freeDrinkCodes.id, codeId));
}

// ── Staff redeem code with order tracking ──
export async function staffRedeemFreeDrinkCode(code: string, branchId: number, staffId: number, orderType: string, deliveryOrderId?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(freeDrinkCodes).set({
    status: "redeemed",
    redeemedAt: new Date(),
    redeemedBranchId: branchId,
    redeemedByStaffId: staffId,
    orderType,
    deliveryOrderId: deliveryOrderId || null,
  }).where(eq(freeDrinkCodes.code, code));
}

// ── Branch Menu Availability ──
import { branchMenuAvailability, InsertBranchMenuAvailability } from "../drizzle/schema";

export async function getBranchMenuAvailability(branchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(branchMenuAvailability)
    .where(eq(branchMenuAvailability.branchId, branchId));
}

export async function setBranchMenuAvailability(branchId: number, menuItemId: number, isAvailable: boolean) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Upsert: insert or update on duplicate key
  const existing = await db.select().from(branchMenuAvailability)
    .where(and(
      eq(branchMenuAvailability.branchId, branchId),
      eq(branchMenuAvailability.menuItemId, menuItemId)
    )).limit(1);
  
  if (existing.length > 0) {
    await db.update(branchMenuAvailability)
      .set({ isAvailable: isAvailable ? 1 : 0 })
      .where(eq(branchMenuAvailability.id, existing[0].id));
  } else {
    await db.insert(branchMenuAvailability).values({
      branchId,
      menuItemId,
      isAvailable: isAvailable ? 1 : 0,
    });
  }
}

export async function listActiveMenuItemsForBranch(branchId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get all active menu items
  const allItems = await db.select().from(reviewMenuItems)
    .where(eq(reviewMenuItems.isActive, 1))
    .orderBy(reviewMenuItems.sortOrder, reviewMenuItems.id);
  
  // Get branch overrides
  const overrides = await db.select().from(branchMenuAvailability)
    .where(eq(branchMenuAvailability.branchId, branchId));
  
  const overrideMap = new Map(overrides.map(o => [o.menuItemId, o.isAvailable]));
  
  // Filter: if no override, default is available (1). If override exists, use its value.
  return allItems.filter(item => {
    const override = overrideMap.get(item.id);
    return override === undefined || override === 1;
  });
}


// ── Site Content (Key-Value) ──
import { siteContent, InsertSiteContent, staffNotifications, InsertStaffNotification } from "../drizzle/schema";

export async function getSiteContent(key: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(siteContent).where(eq(siteContent.contentKey, key)).limit(1);
  return row ?? null;
}

export async function listSiteContent() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(siteContent).orderBy(siteContent.contentKey);
}

export async function upsertSiteContent(key: string, value: string | null, type: string, label: string | null, updatedBy: number | null) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getSiteContent(key);
  if (existing) {
    await db.update(siteContent).set({ contentValue: value, contentType: type, label, updatedBy }).where(eq(siteContent.contentKey, key));
    return existing.id;
  } else {
    const [result] = await db.insert(siteContent).values({ contentKey: key, contentValue: value, contentType: type, label, updatedBy });
    return result.insertId;
  }
}

// ── Staff Notifications ──

export async function createStaffNotification(data: Omit<InsertStaffNotification, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(staffNotifications).values(data);
  return result.insertId;
}

export async function listStaffNotifications(staffId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(staffNotifications)
    .where(eq(staffNotifications.staffId, staffId))
    .orderBy(desc(staffNotifications.createdAt))
    .limit(limit);
}

export async function countUnreadNotifications(staffId: number) {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ count: count() }).from(staffNotifications)
    .where(and(eq(staffNotifications.staffId, staffId), eq(staffNotifications.isRead, 0)));
  return row?.count ?? 0;
}

export async function markNotificationRead(id: number, staffId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(staffNotifications).set({ isRead: 1 }).where(and(eq(staffNotifications.id, id), eq(staffNotifications.staffId, staffId)));
}

export async function markAllNotificationsRead(staffId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(staffNotifications).set({ isRead: 1 }).where(eq(staffNotifications.staffId, staffId));
}

export async function notifyBranchStaff(branchId: number, data: Omit<InsertStaffNotification, "id" | "createdAt" | "staffId">) {
  const db = await getDb();
  if (!db) return;
  // Find all area_managers assigned to this branch
  const areaManagerAssignments = await db.select({ staffId: staffBranches.staffId })
    .from(staffBranches)
    .innerJoin(staff, eq(staffBranches.staffId, staff.id))
    .where(and(eq(staffBranches.branchId, branchId), eq(staff.role, "area_manager"), eq(staff.isActive, 1)));
  // Find branch_owner/branch_manager of this branch
  const branchStaff = await db.select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.branchId, branchId), sql`${staff.role} IN ('branch_owner', 'branch_manager')`, eq(staff.isActive, 1)));
  const staffIds = new Set([
    ...areaManagerAssignments.map(a => a.staffId),
    ...branchStaff.map(s => s.id),
  ]);
  const staffIdArr = Array.from(staffIds);
  for (const sid of staffIdArr) {
    await db.insert(staffNotifications).values({ ...data, staffId: sid });
  }
}


// ── Pending Codes Dashboard ──
export async function getPendingCodesDashboard(branchIds?: number[]) {
  const db = await getDb();
  if (!db) return { reviewCodes: { total: 0, byBranch: [] }, claimCodes: { total: 0, byBranch: [] }, freeDrinkCodes: { total: 0, byBranch: [] }, expiringSoon: { total: 0, codes: [] } };

  const now = new Date();
  const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Build branch filter conditions
  const branchFilter = branchIds && branchIds.length > 0;

  // --- Review codes (RV) pending ---
  const rvConditions = branchFilter
    ? and(eq(codes.status, "issued"), eq(codes.type, "RV"), gte(codes.expiresAt, now), inArray(codes.branchId, branchIds!))
    : and(eq(codes.status, "issued"), eq(codes.type, "RV"), gte(codes.expiresAt, now));

  const rvTotal = await db.select({ count: count() }).from(codes).where(rvConditions);
  const rvByBranch = await db.select({
    branchId: codes.branchId,
    branchName: branches.name,
    count: count(),
  }).from(codes)
    .leftJoin(branches, eq(codes.branchId, branches.id))
    .where(rvConditions)
    .groupBy(codes.branchId, branches.name);

  // --- Claim codes (CL) pending ---
  const clConditions = branchFilter
    ? and(eq(codes.status, "issued"), eq(codes.type, "CL"), gte(codes.expiresAt, now), inArray(codes.branchId, branchIds!))
    : and(eq(codes.status, "issued"), eq(codes.type, "CL"), gte(codes.expiresAt, now));

  const clTotal = await db.select({ count: count() }).from(codes).where(clConditions);
  const clByBranch = await db.select({
    branchId: codes.branchId,
    branchName: branches.name,
    count: count(),
  }).from(codes)
    .leftJoin(branches, eq(codes.branchId, branches.id))
    .where(clConditions)
    .groupBy(codes.branchId, branches.name);

  // --- Free drink codes pending ---
  const fdConditions = branchFilter
    ? and(eq(freeDrinkCodes.status, "issued"), gte(freeDrinkCodes.expiresAt, now), inArray(freeDrinkCodes.branchId, branchIds!))
    : and(eq(freeDrinkCodes.status, "issued"), gte(freeDrinkCodes.expiresAt, now));

  const fdTotal = await db.select({ count: count() }).from(freeDrinkCodes).where(fdConditions);
  const fdByBranch = await db.select({
    branchId: freeDrinkCodes.branchId,
    branchName: branches.name,
    count: count(),
  }).from(freeDrinkCodes)
    .leftJoin(branches, eq(freeDrinkCodes.branchId, branches.id))
    .where(fdConditions)
    .groupBy(freeDrinkCodes.branchId, branches.name);

  // --- Expiring soon (within 7 days) ---
  const expiringRvConditions = branchFilter
    ? and(eq(codes.status, "issued"), gte(codes.expiresAt, now), lte(codes.expiresAt, sevenDaysLater), inArray(codes.branchId, branchIds!))
    : and(eq(codes.status, "issued"), gte(codes.expiresAt, now), lte(codes.expiresAt, sevenDaysLater));

  const expiringFdConditions = branchFilter
    ? and(eq(freeDrinkCodes.status, "issued"), gte(freeDrinkCodes.expiresAt, now), lte(freeDrinkCodes.expiresAt, sevenDaysLater), inArray(freeDrinkCodes.branchId, branchIds!))
    : and(eq(freeDrinkCodes.status, "issued"), gte(freeDrinkCodes.expiresAt, now), lte(freeDrinkCodes.expiresAt, sevenDaysLater));

  const [expiringRv, expiringFd] = await Promise.all([
    db.select({ count: count() }).from(codes).where(expiringRvConditions),
    db.select({ count: count() }).from(freeDrinkCodes).where(expiringFdConditions),
  ]);

  return {
    reviewCodes: {
      total: rvTotal[0]?.count ?? 0,
      byBranch: rvByBranch.map(r => ({ branchId: r.branchId, branchName: r.branchName ?? "ไม่ทราบ", count: r.count })),
    },
    claimCodes: {
      total: clTotal[0]?.count ?? 0,
      byBranch: clByBranch.map(r => ({ branchId: r.branchId, branchName: r.branchName ?? "ไม่ทราบ", count: r.count })),
    },
    freeDrinkCodes: {
      total: fdTotal[0]?.count ?? 0,
      byBranch: fdByBranch.map(r => ({ branchId: r.branchId, branchName: r.branchName ?? "ไม่ทราบ", count: r.count })),
    },
    expiringSoon: {
      total: (expiringRv[0]?.count ?? 0) + (expiringFd[0]?.count ?? 0),
      reviewCodes: expiringRv[0]?.count ?? 0,
      freeDrinkCodes: expiringFd[0]?.count ?? 0,
    },
  };
}


// ── Code menu selection + activation (codes table - RV/CL codes) ──
export async function getCodeById(codeId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(codes).where(eq(codes.id, codeId)).limit(1);
  return rows[0] || null;
}

export async function updateCodeMenuSelection(codeId: number, data: {
  selectedMenuItemId: number;
  selectedMenuCode: string;
  selectedMenuName: string;
  remark: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(codes).set({
    selectedMenuItemId: data.selectedMenuItemId,
    selectedMenuCode: data.selectedMenuCode,
    selectedMenuName: data.selectedMenuName,
    remark: data.remark,
    activatedAt: new Date(),
  }).where(eq(codes.id, codeId));
}

// Reset code menu selection (auto-expire: activated yesterday → allow re-select)
export async function resetCodeMenuSelection(codeId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(codes).set({
    selectedMenuItemId: null,
    selectedMenuCode: null,
    selectedMenuName: null,
    remark: null,
    activatedAt: null,
  }).where(eq(codes.id, codeId));
}

// Auto-select menu for CL codes: use compensationMenuCode/Name as selectedMenu
export async function autoSelectCLCodeMenu(codeId: number, data: {
  compensationMenuCode: string;
  compensationMenuName: string;
  remark: string | null;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(codes).set({
    selectedMenuItemId: 0, // no real menu item, manager specified the menu
    selectedMenuCode: data.compensationMenuCode,
    selectedMenuName: data.compensationMenuName,
    remark: data.remark,
    activatedAt: new Date(),
  }).where(eq(codes.id, codeId));
}

// ── Option Groups & Items ──
import { optionGroups, InsertOptionGroup, optionItems, InsertOptionItem } from "../drizzle/schema";

export async function createOptionGroup(data: { name: string; type: "single" | "multi"; isRequired: boolean; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(optionGroups).values({
    name: data.name,
    type: data.type,
    isRequired: data.isRequired ? 1 : 0,
    sortOrder: data.sortOrder ?? 0,
  });
  return result[0].insertId;
}

export async function listOptionGroups() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(optionGroups).orderBy(asc(optionGroups.sortOrder));
}

export async function getOptionGroupById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(optionGroups).where(eq(optionGroups.id, id)).limit(1);
  return rows[0] || null;
}

export async function updateOptionGroup(id: number, data: { name?: string; type?: "single" | "multi"; isRequired?: boolean; isActive?: boolean; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const set: Record<string, unknown> = {};
  if (data.name !== undefined) set.name = data.name;
  if (data.type !== undefined) set.type = data.type;
  if (data.isRequired !== undefined) set.isRequired = data.isRequired ? 1 : 0;
  if (data.isActive !== undefined) set.isActive = data.isActive ? 1 : 0;
  if (data.sortOrder !== undefined) set.sortOrder = data.sortOrder;
  await db.update(optionGroups).set(set).where(eq(optionGroups.id, id));
}

export async function deleteOptionGroup(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(optionItems).where(eq(optionItems.groupId, id));
  await db.delete(optionGroups).where(eq(optionGroups.id, id));
}

export async function createOptionItem(data: { groupId: number; name: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(optionItems).values({
    groupId: data.groupId,
    name: data.name,
    sortOrder: data.sortOrder ?? 0,
  });
  return result[0].insertId;
}

export async function listOptionItemsByGroup(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(optionItems).where(eq(optionItems.groupId, groupId)).orderBy(asc(optionItems.sortOrder));
}

export async function listAllOptionItems() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(optionItems).orderBy(asc(optionItems.sortOrder));
}

export async function updateOptionItem(id: number, data: { name?: string; isActive?: boolean; sortOrder?: number }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const set: Record<string, unknown> = {};
  if (data.name !== undefined) set.name = data.name;
  if (data.isActive !== undefined) set.isActive = data.isActive ? 1 : 0;
  if (data.sortOrder !== undefined) set.sortOrder = data.sortOrder;
  await db.update(optionItems).set(set).where(eq(optionItems.id, id));
}

export async function deleteOptionItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(optionItems).where(eq(optionItems.id, id));
}

export async function listActiveOptionGroupsWithItems() {
  const db = await getDb();
  if (!db) return [];
  const groups = await db.select().from(optionGroups).where(eq(optionGroups.isActive, 1)).orderBy(asc(optionGroups.sortOrder));
  const items = await db.select().from(optionItems).where(eq(optionItems.isActive, 1)).orderBy(asc(optionItems.sortOrder));
  return groups.map(g => ({
    ...g,
    items: items.filter(i => i.groupId === g.id),
  }));
}

// ── Menu Option Groups (junction) ──
import { menuOptionGroups, InsertMenuOptionGroup } from "../drizzle/schema";

export async function setMenuOptionGroups(menuType: "review" | "reward", menuId: number, groupIds: number[]) {
  const db = await getDb();
  if (!db) return;
  // Delete existing links
  await db.delete(menuOptionGroups)
    .where(and(eq(menuOptionGroups.menuType, menuType), eq(menuOptionGroups.menuId, menuId)));
  // Insert new links
  if (groupIds.length > 0) {
    await db.insert(menuOptionGroups).values(
      groupIds.map(gid => ({ menuType, menuId, optionGroupId: gid }))
    );
  }
}

export async function getMenuOptionGroupIds(menuType: "review" | "reward", menuId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ optionGroupId: menuOptionGroups.optionGroupId })
    .from(menuOptionGroups)
    .where(and(eq(menuOptionGroups.menuType, menuType), eq(menuOptionGroups.menuId, menuId)));
  return rows.map(r => r.optionGroupId);
}

export async function getOptionGroupsForMenu(menuType: "review" | "reward", menuId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get linked group IDs
  const linkedIds = await getMenuOptionGroupIds(menuType, menuId);
  if (linkedIds.length === 0) return []; // No groups linked = no options
  // Get active groups that are linked
  const groups = await db.select().from(optionGroups)
    .where(and(eq(optionGroups.isActive, 1), inArray(optionGroups.id, linkedIds)))
    .orderBy(asc(optionGroups.sortOrder));
  const items = await db.select().from(optionItems)
    .where(eq(optionItems.isActive, 1))
    .orderBy(asc(optionItems.sortOrder));
  return groups.map(g => ({
    ...g,
    items: items.filter(i => i.groupId === g.id),
  }));
}

// ── Password Reset ──
import { passwordResetRequests, InsertPasswordResetRequest, passwordResetTokens, InsertPasswordResetToken } from "../drizzle/schema";

export async function createPasswordResetRequest(data: Omit<InsertPasswordResetRequest, "id">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(passwordResetRequests).values(data).$returningId();
  return result.id;
}

export async function listPendingPasswordResetRequests() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passwordResetRequests)
    .where(eq(passwordResetRequests.status, "pending"))
    .orderBy(desc(passwordResetRequests.createdAt));
}

export async function listAllPasswordResetRequests(limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(passwordResetRequests)
    .orderBy(desc(passwordResetRequests.createdAt))
    .limit(limit);
}

export async function getPasswordResetRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(passwordResetRequests).where(eq(passwordResetRequests.id, id));
  return row ?? null;
}

export async function updatePasswordResetRequestStatus(id: number, status: "pending" | "processed" | "expired", processedBy?: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetRequests)
    .set({ status, processedBy: processedBy ?? null, processedAt: status === "processed" ? new Date() : null })
    .where(eq(passwordResetRequests.id, id));
}

export async function createPasswordResetToken(data: Omit<InsertPasswordResetToken, "id">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(passwordResetTokens).values(data).$returningId();
  return result.id;
}

export async function getPasswordResetTokenByToken(token: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token));
  return row ?? null;
}

export async function markPasswordResetTokenUsed(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(eq(passwordResetTokens.id, id));
}

export async function getCustomerByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(customers).where(eq(customers.email, email));
  return row ?? null;
}

export async function updateCustomerPassword(customerId: number, passwordHash: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(customers)
    .set({ passwordHash })
    .where(eq(customers.id, customerId));
}

// ── Admin: List/Search Customers ──
export async function listCustomers(search?: string, limit = 50, offset = 0) {
  const conditions = [];
  if (search) {
    const cleanSearch = search.replace(/[\-\s]/g, "");
    const pattern = `%${search}%`;
    const cleanPattern = `%${cleanSearch}%`;
    conditions.push(
      or(
        like(customers.name, pattern),
        like(customers.phone, pattern),
        like(customers.phone, cleanPattern),
        like(customers.email, pattern),
      )!
    );
  }
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(customers)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(customers.createdAt))
    .limit(limit)
    .offset(offset);
  return rows;
}

export async function countCustomers(search?: string) {
  const conditions = [];
  if (search) {
    const cleanSearch = search.replace(/[\-\s]/g, "");
    const pattern = `%${search}%`;
    const cleanPattern = `%${cleanSearch}%`;
    conditions.push(
      or(
        like(customers.name, pattern),
        like(customers.phone, pattern),
        like(customers.phone, cleanPattern),
        like(customers.email, pattern),
      )!
    );
  }
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.select({ count: sql<number>`count(*)` }).from(customers)
    .where(conditions.length > 0 ? and(...conditions) : undefined);
  return result?.count ?? 0;
}

// ── Petty Cash Management ──
import { pettyCashSettings, InsertPettyCashSetting, pettyCashTransactions, InsertPettyCashTransaction, pettyCashFundRequests, InsertPettyCashFundRequest, pettyCashReceiptImages, InsertPettyCashReceiptImage } from "../drizzle/schema";

export async function getPettyCashSettings(branchId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(pettyCashSettings).where(eq(pettyCashSettings.branchId, branchId));
  return row ?? null;
}

export async function upsertPettyCashSettings(branchId: number, data: Partial<Omit<InsertPettyCashSetting, "id" | "branchId" | "createdAt" | "updatedAt">>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const existing = await getPettyCashSettings(branchId);
  if (existing) {
    await db.update(pettyCashSettings).set(data).where(eq(pettyCashSettings.branchId, branchId));
    return { ...existing, ...data };
  } else {
    const [result] = await db.insert(pettyCashSettings).values({ branchId, ...data });
    return { id: result.insertId, branchId, ...data };
  }
}

export async function getPettyCashBalance(branchId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  // Get the most recent transaction to read the running balance
  const [latest] = await db.select({ balanceAfter: pettyCashTransactions.balanceAfter })
    .from(pettyCashTransactions)
    .where(eq(pettyCashTransactions.branchId, branchId))
    .orderBy(desc(pettyCashTransactions.createdAt))
    .limit(1);
  return latest?.balanceAfter ?? 0;
}

export async function listPettyCashTransactions(branchId: number, limit = 50, offset = 0, dateFrom?: Date, dateTo?: Date, type?: "deposit" | "expense" | "adjustment") {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(pettyCashTransactions.branchId, branchId)];
  if (dateFrom) conditions.push(gte(pettyCashTransactions.transactionDate, dateFrom));
  if (dateTo) conditions.push(lte(pettyCashTransactions.transactionDate, dateTo));
  if (type) conditions.push(eq(pettyCashTransactions.type, type));
  return db.select().from(pettyCashTransactions)
    .where(and(...conditions))
    .orderBy(desc(pettyCashTransactions.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function countPettyCashTransactions(branchId: number, dateFrom?: Date, dateTo?: Date, type?: "deposit" | "expense" | "adjustment") {
  const db = await getDb();
  if (!db) return 0;
  const conditions: any[] = [eq(pettyCashTransactions.branchId, branchId)];
  if (dateFrom) conditions.push(gte(pettyCashTransactions.transactionDate, dateFrom));
  if (dateTo) conditions.push(lte(pettyCashTransactions.transactionDate, dateTo));
  if (type) conditions.push(eq(pettyCashTransactions.type, type));
  const [result] = await db.select({ count: count() }).from(pettyCashTransactions).where(and(...conditions));
  return result?.count ?? 0;
}

export async function createPettyCashTransaction(data: Omit<InsertPettyCashTransaction, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // Defensive: ensure empty string doesn't reach ENUM column
  if (!data.transferMethod || (data.transferMethod as string) === "") {
    data.transferMethod = null;
  }
  const [result] = await db.insert(pettyCashTransactions).values(data);
  return result.insertId;
}

export async function getPettyCashSummary(branchId: number, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return { totalDeposits: 0, totalExpenses: 0, totalAdjustments: 0, transactionCount: 0 };
  const conditions: any[] = [eq(pettyCashTransactions.branchId, branchId)];
  if (dateFrom) conditions.push(gte(pettyCashTransactions.transactionDate, dateFrom));
  if (dateTo) conditions.push(lte(pettyCashTransactions.transactionDate, dateTo));
  const rows = await db.select({
    type: pettyCashTransactions.type,
    total: sql<number>`SUM(${pettyCashTransactions.amount})`,
    cnt: count(),
  }).from(pettyCashTransactions)
    .where(and(...conditions))
    .groupBy(pettyCashTransactions.type);
  let totalDeposits = 0, totalExpenses = 0, totalAdjustments = 0, transactionCount = 0;
  for (const row of rows) {
    if (row.type === "deposit") totalDeposits = row.total;
    else if (row.type === "expense") totalExpenses = row.total;
    else if (row.type === "adjustment") totalAdjustments = row.total;
    transactionCount += row.cnt;
  }
  return { totalDeposits, totalExpenses, totalAdjustments, transactionCount };
}

export async function getPettyCashPeriodSummary(branchId: number) {
  const db = await getDb();
  const empty = { totalDeposits: 0, totalExpenses: 0, transactionCount: 0 };
  if (!db) return { thisMonth: empty, lastMonth: empty, thisWeek: empty, lastWeek: empty };

  const now = new Date();

  // This month: 1st of current month to now
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const thisMonthEnd = now;

  // Last month: 1st of previous month to last day of previous month
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

  // This week: Monday of current week to now
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon...
  const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
  thisWeekStart.setHours(0, 0, 0, 0);
  const thisWeekEnd = now;

  // Last week: Monday to Sunday of previous week
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(thisWeekStart);
  lastWeekEnd.setMilliseconds(-1); // Sunday 23:59:59.999

  async function queryPeriod(from: Date, to: Date) {
    const conditions = [
      eq(pettyCashTransactions.branchId, branchId),
      gte(pettyCashTransactions.transactionDate, from),
      lte(pettyCashTransactions.transactionDate, to),
    ];
    const rows = await db!.select({
      type: pettyCashTransactions.type,
      total: sql<number>`COALESCE(SUM(${pettyCashTransactions.amount}), 0)`,
      cnt: count(),
    }).from(pettyCashTransactions)
      .where(and(...conditions))
      .groupBy(pettyCashTransactions.type);

    let totalDeposits = 0, totalExpenses = 0, transactionCount = 0;
    for (const row of rows) {
      if (row.type === "deposit") totalDeposits = Number(row.total) || 0;
      else if (row.type === "expense") totalExpenses = Number(row.total) || 0;
      transactionCount += row.cnt;
    }
    return { totalDeposits, totalExpenses, transactionCount };
  }

  const [thisMonth, lastMonth, thisWeek, lastWeek] = await Promise.all([
    queryPeriod(thisMonthStart, thisMonthEnd),
    queryPeriod(lastMonthStart, lastMonthEnd),
    queryPeriod(thisWeekStart, thisWeekEnd),
    queryPeriod(lastWeekStart, lastWeekEnd),
  ]);

  return { thisMonth, lastMonth, thisWeek, lastWeek };
}

// Fund requests
export async function createFundRequest(data: Omit<InsertPettyCashFundRequest, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(pettyCashFundRequests).values(data);
  return result.insertId;
}

export async function listFundRequests(branchId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [eq(pettyCashFundRequests.branchId, branchId)];
  if (status) conditions.push(eq(pettyCashFundRequests.status, status as any));
  return db.select().from(pettyCashFundRequests)
    .where(and(...conditions))
    .orderBy(desc(pettyCashFundRequests.createdAt));
}
export async function listAllFundRequests(status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (status) conditions.push(eq(pettyCashFundRequests.status, status as any));
  return db.select().from(pettyCashFundRequests)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(pettyCashFundRequests.createdAt));
}

export async function updateFundRequestStatus(id: number, status: "approved" | "rejected", processedBy: number, processedNote?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(pettyCashFundRequests).set({
    status,
    processedBy,
    processedAt: new Date(),
    processedNote: processedNote || null,
  }).where(eq(pettyCashFundRequests.id, id));
}

export async function getFundRequestById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(pettyCashFundRequests).where(eq(pettyCashFundRequests.id, id));
  return row ?? null;
}

// ── Petty Cash Receipt Images ──
export async function createReceiptImage(data: Omit<InsertPettyCashReceiptImage, "id" | "createdAt">) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(pettyCashReceiptImages).values(data);
  return result.insertId;
}

export async function listReceiptImages(transactionId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pettyCashReceiptImages)
    .where(eq(pettyCashReceiptImages.transactionId, transactionId))
    .orderBy(pettyCashReceiptImages.sortOrder);
}

export async function listReceiptImagesByBranch(branchId: number, transactionIds: number[]) {
  const db = await getDb();
  if (!db) return [];
  if (transactionIds.length === 0) return [];
  return db.select().from(pettyCashReceiptImages)
    .where(and(
      eq(pettyCashReceiptImages.branchId, branchId),
      inArray(pettyCashReceiptImages.transactionId, transactionIds)
    ))
    .orderBy(pettyCashReceiptImages.transactionId, pettyCashReceiptImages.sortOrder);
}

export async function updateReceiptImageOcr(id: number, ocrText: string, ocrData: string) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(pettyCashReceiptImages).set({ ocrText, ocrData }).where(eq(pettyCashReceiptImages.id, id));
}

// ── Reward Categories ──
import { rewardCategories, InsertRewardCategory } from "../drizzle/schema";

export async function listRewardCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rewardCategories).orderBy(rewardCategories.sortOrder);
}

export async function listActiveRewardCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(rewardCategories).where(eq(rewardCategories.isActive, 1)).orderBy(rewardCategories.sortOrder);
}

export async function createRewardCategory(data: { name: string; icon?: string; color?: string; sortOrder?: number }) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.insert(rewardCategories).values({
    name: data.name,
    icon: data.icon || "gift",
    color: data.color || "bg-gray-50 text-gray-600",
    sortOrder: data.sortOrder || 0,
  });
  return result.insertId;
}

export async function updateRewardCategory(id: number, data: Partial<{ name: string; icon: string; color: string; isActive: number; sortOrder: number }>) {
  const db = await getDb();
  if (!db) return;
  await db.update(rewardCategories).set(data).where(eq(rewardCategories.id, id));
}

export async function deleteRewardCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(rewardCategories).where(eq(rewardCategories.id, id));
}


// ═══════════════════════════════════════════════════════
//  CENTRAL E-COMMERCE SHOP - DB Helpers
// ═══════════════════════════════════════════════════════
import {
  shopCategories, InsertShopCategory,
  shopProducts, InsertShopProduct,
  cartItems, InsertCartItem,
  shopOrders, InsertShopOrder,
  shopOrderItems, InsertShopOrderItem,
  branchCommissionSettings, InsertBranchCommissionSetting,
} from "../drizzle/schema";

// ── Shop Categories ──
export async function listShopCategories(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const q = activeOnly
    ? db.select().from(shopCategories).where(eq(shopCategories.isActive, 1)).orderBy(asc(shopCategories.sortOrder))
    : db.select().from(shopCategories).orderBy(asc(shopCategories.sortOrder));
  return q;
}
export async function getShopCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(shopCategories).where(eq(shopCategories.id, id)).limit(1);
  return rows[0] || null;
}
export async function createShopCategory(data: Omit<InsertShopCategory, "id">) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.insert(shopCategories).values(data);
  return result.insertId;
}
export async function updateShopCategory(id: number, data: Partial<InsertShopCategory>) {
  const db = await getDb();
  if (!db) return;
  await db.update(shopCategories).set(data).where(eq(shopCategories.id, id));
}
export async function deleteShopCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(shopCategories).set({ isActive: 0 }).where(eq(shopCategories.id, id));
}

// ── Shop Products ──
export async function listShopProducts(opts?: { categoryId?: number; activeOnly?: boolean; search?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { products: [], total: 0 };
  const conditions: any[] = [];
  if (opts?.activeOnly !== false) conditions.push(eq(shopProducts.isActive, 1));
  if (opts?.categoryId) conditions.push(eq(shopProducts.categoryId, opts.categoryId));
  if (opts?.search) conditions.push(or(like(shopProducts.name, `%${opts.search}%`), like(shopProducts.sku, `%${opts.search}%`)));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalResult] = await db.select({ count: count() }).from(shopProducts).where(where);
  const products = await db.select().from(shopProducts).where(where)
    .orderBy(asc(shopProducts.sortOrder), desc(shopProducts.createdAt))
    .limit(opts?.limit || 50).offset(opts?.offset || 0);
  return { products, total: totalResult?.count || 0 };
}
export async function getShopProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(shopProducts).where(eq(shopProducts.id, id)).limit(1);
  return rows[0] || null;
}
export async function createShopProduct(data: Omit<InsertShopProduct, "id">) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.insert(shopProducts).values(data);
  return result.insertId;
}
export async function updateShopProduct(id: number, data: Partial<InsertShopProduct>) {
  const db = await getDb();
  if (!db) return;
  await db.update(shopProducts).set(data).where(eq(shopProducts.id, id));
}
export async function deleteShopProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(shopProducts).set({ isActive: 0 }).where(eq(shopProducts.id, id));
}

// ── Cart ──
export async function getCartItems(customerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: cartItems.id,
    customerId: cartItems.customerId,
    productId: cartItems.productId,
    quantity: cartItems.quantity,
    productName: shopProducts.name,
    productSku: shopProducts.sku,
    productImageUrl: shopProducts.imageUrl,
    retailPrice: shopProducts.retailPrice,
    wholesalePrice: shopProducts.wholesalePrice,
    wholesaleMinQty: shopProducts.wholesaleMinQty,
    unit: shopProducts.unit,
    stock: shopProducts.stock,
    isActive: shopProducts.isActive,
  }).from(cartItems)
    .innerJoin(shopProducts, eq(cartItems.productId, shopProducts.id))
    .where(eq(cartItems.customerId, customerId))
    .orderBy(desc(cartItems.createdAt));
}
export async function addToCart(customerId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) return;
  // upsert: if exists, add quantity; otherwise insert
  const existing = await db.select().from(cartItems)
    .where(and(eq(cartItems.customerId, customerId), eq(cartItems.productId, productId))).limit(1);
  if (existing[0]) {
    await db.update(cartItems).set({ quantity: existing[0].quantity + quantity })
      .where(eq(cartItems.id, existing[0].id));
  } else {
    await db.insert(cartItems).values({ customerId, productId, quantity });
  }
}
export async function updateCartItemQuantity(customerId: number, productId: number, quantity: number) {
  const db = await getDb();
  if (!db) return;
  if (quantity <= 0) {
    await db.delete(cartItems).where(and(eq(cartItems.customerId, customerId), eq(cartItems.productId, productId)));
  } else {
    await db.update(cartItems).set({ quantity })
      .where(and(eq(cartItems.customerId, customerId), eq(cartItems.productId, productId)));
  }
}
export async function removeCartItem(customerId: number, productId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(and(eq(cartItems.customerId, customerId), eq(cartItems.productId, productId)));
}
export async function clearCart(customerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(cartItems).where(eq(cartItems.customerId, customerId));
}

// ── Shop Orders ──
export async function createShopOrder(data: Omit<InsertShopOrder, "id">) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.insert(shopOrders).values(data);
  return result.insertId;
}
export async function createShopOrderItems(items: Omit<InsertShopOrderItem, "id">[]) {
  const db = await getDb();
  if (!db) return;
  if (items.length === 0) return;
  await db.insert(shopOrderItems).values(items);
}
export async function getShopOrderById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(shopOrders).where(eq(shopOrders.id, id)).limit(1);
  return rows[0] || null;
}
export async function getShopOrderByNumber(orderNumber: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(shopOrders).where(eq(shopOrders.orderNumber, orderNumber)).limit(1);
  return rows[0] || null;
}
export async function getShopOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shopOrderItems).where(eq(shopOrderItems.orderId, orderId));
}
export async function listShopOrders(opts?: { customerId?: number; status?: string; limit?: number; offset?: number }) {
  const db = await getDb();
  if (!db) return { orders: [], total: 0 };
  const conditions: any[] = [];
  if (opts?.customerId) conditions.push(eq(shopOrders.customerId, opts.customerId));
  if (opts?.status) conditions.push(eq(shopOrders.status, opts.status as any));
  const where = conditions.length > 0 ? and(...conditions) : undefined;
  const [totalResult] = await db.select({ count: count() }).from(shopOrders).where(where);
  const orders = await db.select().from(shopOrders).where(where)
    .orderBy(desc(shopOrders.createdAt))
    .limit(opts?.limit || 50).offset(opts?.offset || 0);
  return { orders, total: totalResult?.count || 0 };
}
export async function updateShopOrder(id: number, data: Partial<InsertShopOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(shopOrders).set(data).where(eq(shopOrders.id, id));
}

// ── Commission Settings ──
export async function getCommissionSettings(branchId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(branchCommissionSettings).where(eq(branchCommissionSettings.branchId, branchId)).limit(1);
  return rows[0] || null;
}
export async function listAllCommissionSettings() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    id: branchCommissionSettings.id,
    branchId: branchCommissionSettings.branchId,
    branchName: branches.name,
    commissionRate: branchCommissionSettings.commissionRate,
    minMonthlySales: branchCommissionSettings.minMonthlySales,
    isActive: branchCommissionSettings.isActive,
    note: branchCommissionSettings.note,
  }).from(branchCommissionSettings)
    .innerJoin(branches, eq(branchCommissionSettings.branchId, branches.id));
}
export async function upsertCommissionSettings(branchId: number, data: { commissionRate: string; minMonthlySales?: number; note?: string }) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(branchCommissionSettings).where(eq(branchCommissionSettings.branchId, branchId)).limit(1);
  if (existing[0]) {
    await db.update(branchCommissionSettings).set({
      commissionRate: data.commissionRate,
      minMonthlySales: data.minMonthlySales ?? existing[0].minMonthlySales,
      note: data.note ?? existing[0].note,
    }).where(eq(branchCommissionSettings.branchId, branchId));
  } else {
    await db.insert(branchCommissionSettings).values({
      branchId,
      commissionRate: data.commissionRate,
      minMonthlySales: data.minMonthlySales || 0,
      note: data.note || null,
    });
  }
}

// ── Commission Report Helpers ──
export async function getCommissionReport(opts?: { branchId?: number; startDate?: Date; endDate?: Date }) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  // Only count orders that are at least payment_confirmed
  conditions.push(
    or(
      eq(shopOrders.status, "payment_confirmed"),
      eq(shopOrders.status, "processing"),
      eq(shopOrders.status, "shipped"),
      eq(shopOrders.status, "delivered"),
    )
  );
  if (opts?.branchId) conditions.push(eq(shopOrders.commissionBranchId, opts.branchId));
  if (opts?.startDate) conditions.push(gte(shopOrders.createdAt, opts.startDate));
  if (opts?.endDate) conditions.push(lte(shopOrders.createdAt, opts.endDate));
  const where = and(...conditions);
  return db.select({
    branchId: shopOrders.commissionBranchId,
    branchName: branches.name,
    totalOrders: count(),
    totalSales: sql<number>`SUM(${shopOrders.totalAmount})`,
    totalCommission: sql<number>`SUM(${shopOrders.commissionAmount})`,
  }).from(shopOrders)
    .leftJoin(branches, eq(shopOrders.commissionBranchId, branches.id))
    .where(where)
    .groupBy(shopOrders.commissionBranchId, branches.name);
}

// ── Stock management ──
export async function decrementStock(productId: number, quantity: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(shopProducts)
    .set({ stock: sql`${shopProducts.stock} - ${quantity}` })
    .where(eq(shopProducts.id, productId));
}

// ── Customer primary branch (for commission) ──
export async function getCustomerPrimaryBranchId(customerId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  // Primary branch = the branch where customer has the most review requests
  const rows = await db.select({
    branchId: reviewRequests.branchId,
    cnt: count(),
  }).from(reviewRequests)
    .where(eq(reviewRequests.customerId, customerId))
    .groupBy(reviewRequests.branchId)
    .orderBy(desc(count()))
    .limit(1);
  return rows[0]?.branchId || null;
}

// ── Generate unique order number ──
export function generateShopOrderNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `HIBI-SO-${code}`;
}


// ═══════════════════════════════════════════════════════════════
// ── Daily Sales Records ──
// ═══════════════════════════════════════════════════════════════
import { dailySalesRecords, InsertDailySalesRecord, dailySalesExtraChannels, InsertDailySalesExtraChannel } from "../drizzle/schema";

export async function createDailySalesRecord(data: InsertDailySalesRecord) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(dailySalesRecords).values(data);
  return result.insertId;
}

export async function getDailySalesRecordById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(dailySalesRecords).where(eq(dailySalesRecords.id, id)).limit(1);
  return rows[0] || null;
}

export async function getDailySalesRecordByDate(branchId: number, salesDate: Date) {
  const db = await getDb();
  if (!db) return null;
  // Compare date only (strip time) - find records for the same day
  const startOfDay = new Date(salesDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(salesDate);
  endOfDay.setHours(23, 59, 59, 999);
  const rows = await db.select().from(dailySalesRecords)
    .where(and(
      eq(dailySalesRecords.branchId, branchId),
      gte(dailySalesRecords.salesDate, startOfDay),
      lte(dailySalesRecords.salesDate, endOfDay),
    ))
    .limit(1);
  return rows[0] || null;
}

export async function updateDailySalesRecord(id: number, data: Partial<InsertDailySalesRecord>) {
  const db = await getDb();
  if (!db) return;
  await db.update(dailySalesRecords).set(data).where(eq(dailySalesRecords.id, id));
}

export async function listDailySalesRecords(branchId: number, limit = 31, offset = 0, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(dailySalesRecords.branchId, branchId)];
  if (dateFrom) conditions.push(gte(dailySalesRecords.salesDate, dateFrom));
  if (dateTo) conditions.push(lte(dailySalesRecords.salesDate, dateTo));
  return db.select().from(dailySalesRecords)
    .where(and(...conditions))
    .orderBy(desc(dailySalesRecords.salesDate))
    .limit(limit)
    .offset(offset);
}

export async function countDailySalesRecords(branchId: number, dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db) return 0;
  const conditions = [eq(dailySalesRecords.branchId, branchId)];
  if (dateFrom) conditions.push(gte(dailySalesRecords.salesDate, dateFrom));
  if (dateTo) conditions.push(lte(dailySalesRecords.salesDate, dateTo));
  const rows = await db.select({ cnt: count() }).from(dailySalesRecords).where(and(...conditions));
  return rows[0]?.cnt || 0;
}

export async function getMonthlySalesSummary(branchId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return null;
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  const rows = await db.select({
    totalCash: sql<number>`COALESCE(SUM(${dailySalesRecords.cashAmount}), 0)`,
    totalTransfer: sql<number>`COALESCE(SUM(${dailySalesRecords.transferAmount}), 0)`,
    totalEdc: sql<number>`COALESCE(SUM(${dailySalesRecords.edcAmount}), 0)`,
    totalDelivery: sql<number>`COALESCE(SUM(${dailySalesRecords.deliveryAmount}), 0)`,
    totalExtra: sql<number>`COALESCE(SUM(${dailySalesRecords.extraTotal}), 0)`,
    grandTotal: sql<number>`COALESCE(SUM(${dailySalesRecords.totalAmount}), 0)`,
    recordCount: count(),
  }).from(dailySalesRecords)
    .where(and(
      eq(dailySalesRecords.branchId, branchId),
      gte(dailySalesRecords.salesDate, startDate),
      lte(dailySalesRecords.salesDate, endDate),
    ));
  return rows[0] || null;
}

export async function getAllBranchesMonthlySummary(year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return db.select({
    branchId: dailySalesRecords.branchId,
    totalCash: sql<number>`COALESCE(SUM(${dailySalesRecords.cashAmount}), 0)`,
    totalTransfer: sql<number>`COALESCE(SUM(${dailySalesRecords.transferAmount}), 0)`,
    totalEdc: sql<number>`COALESCE(SUM(${dailySalesRecords.edcAmount}), 0)`,
    totalDelivery: sql<number>`COALESCE(SUM(${dailySalesRecords.deliveryAmount}), 0)`,
    totalExtra: sql<number>`COALESCE(SUM(${dailySalesRecords.extraTotal}), 0)`,
    grandTotal: sql<number>`COALESCE(SUM(${dailySalesRecords.totalAmount}), 0)`,
    recordCount: count(),
  }).from(dailySalesRecords)
    .where(and(
      gte(dailySalesRecords.salesDate, startDate),
      lte(dailySalesRecords.salesDate, endDate),
    ))
    .groupBy(dailySalesRecords.branchId);
}

// Extra channels helpers
export async function createDailySalesExtraChannels(channels: InsertDailySalesExtraChannel[]) {
  const db = await getDb();
  if (!db || channels.length === 0) return;
  await db.insert(dailySalesExtraChannels).values(channels);
}

export async function getExtraChannelsBySalesRecordId(salesRecordId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySalesExtraChannels)
    .where(eq(dailySalesExtraChannels.salesRecordId, salesRecordId));
}

export async function deleteExtraChannelsBySalesRecordId(salesRecordId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(dailySalesExtraChannels).where(eq(dailySalesExtraChannels.salesRecordId, salesRecordId));
}

// ── Service Zones ──
import { serviceZones, InsertServiceZone } from "../drizzle/schema";

export async function listServiceZones(includeInactive = false) {
  const db = await getDb();
  if (!db) return [];
  if (includeInactive) {
    return db.select().from(serviceZones).orderBy(asc(serviceZones.name));
  }
  return db.select().from(serviceZones).where(eq(serviceZones.isActive, 1)).orderBy(asc(serviceZones.name));
}

export async function getServiceZoneById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const [zone] = await db.select().from(serviceZones).where(eq(serviceZones.id, id)).limit(1);
  return zone ?? null;
}

export async function createServiceZone(data: InsertServiceZone) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const [result] = await db.insert(serviceZones).values(data).$returningId();
  return result.id;
}

export async function updateServiceZone(id: number, data: Partial<InsertServiceZone>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(serviceZones).set(data as any).where(eq(serviceZones.id, id));
}

export async function listBranchesByZone(zoneId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(branches).where(and(eq(branches.zoneId, zoneId), eq(branches.isActive, 1))).orderBy(asc(branches.name));
}

export async function updateBranchZone(branchId: number, zoneId: number | null) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(branches).set({ zoneId } as any).where(eq(branches.id, branchId));
}

export async function listBranchesWithZone() {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    branch: branches,
    zoneName: serviceZones.name,
  }).from(branches)
    .leftJoin(serviceZones, eq(branches.zoneId, serviceZones.id))
    .orderBy(asc(branches.name));
}

// ── Multi-Branch Summary (for dashboard) ──
export async function getMultiBranchPettyCashBalances(branchIds: number[]) {
  const db = await getDb();
  if (!db || branchIds.length === 0) return [];
  // Get latest balance for each branch
  const results: { branchId: number; balance: number }[] = [];
  for (const bid of branchIds) {
    const [latest] = await db.select({ balanceAfter: pettyCashTransactions.balanceAfter })
      .from(pettyCashTransactions)
      .where(eq(pettyCashTransactions.branchId, bid))
      .orderBy(desc(pettyCashTransactions.createdAt))
      .limit(1);
    results.push({ branchId: bid, balance: latest?.balanceAfter ?? 0 });
  }
  return results;
}

export async function getMultiBranchDailySalesToday(branchIds: number[], dateFrom?: Date, dateTo?: Date) {
  const db = await getDb();
  if (!db || branchIds.length === 0) return [];
  const conditions: any[] = [inArray(dailySalesRecords.branchId, branchIds)];
  if (dateFrom) {
    conditions.push(gte(dailySalesRecords.salesDate, dateFrom));
  } else {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    conditions.push(gte(dailySalesRecords.salesDate, today));
  }
  if (dateTo) {
    conditions.push(lte(dailySalesRecords.salesDate, dateTo));
  } else {
    const tomorrow = new Date();
    tomorrow.setHours(0, 0, 0, 0);
    tomorrow.setDate(tomorrow.getDate() + 1);
    conditions.push(lte(dailySalesRecords.salesDate, tomorrow));
  }
  return db.select({
    branchId: dailySalesRecords.branchId,
    totalAmount: dailySalesRecords.totalAmount,
    cashAmount: dailySalesRecords.cashAmount,
    transferAmount: dailySalesRecords.transferAmount,
    edcAmount: dailySalesRecords.edcAmount,
    deliveryAmount: dailySalesRecords.deliveryAmount,
    extraTotal: dailySalesRecords.extraTotal,
  }).from(dailySalesRecords)
    .where(and(...conditions));
}

export async function getMultiBranchOrderIssuesCounts(branchIds: number[]) {
  const db = await getDb();
  if (!db || branchIds.length === 0) return { open: 0, acknowledged: 0, total: 0 };
  const [openCount] = await db.select({ count: count() }).from(orderIssues)
    .where(and(inArray(orderIssues.branchId, branchIds), eq(orderIssues.status, "open")));
  const [ackCount] = await db.select({ count: count() }).from(orderIssues)
    .where(and(inArray(orderIssues.branchId, branchIds), eq(orderIssues.status, "acknowledged")));
  const [totalCount] = await db.select({ count: count() }).from(orderIssues)
    .where(inArray(orderIssues.branchId, branchIds));
  return {
    open: openCount?.count ?? 0,
    acknowledged: ackCount?.count ?? 0,
    total: totalCount?.count ?? 0,
  };
}

export async function listOrderIssuesByBranchIds(branchIds: number[], status?: string) {
  const db = await getDb();
  if (!db || branchIds.length === 0) return [];
  const conditions: any[] = [inArray(orderIssues.branchId, branchIds)];
  if (status) conditions.push(eq(orderIssues.status, status as any));
  const rows = await db.select({ issue: orderIssues, customerName: customers.name, customerPhone: customers.phone })
    .from(orderIssues)
    .leftJoin(customers, eq(orderIssues.customerId, customers.id))
    .where(and(...conditions))
    .orderBy(desc(orderIssues.createdAt));
  if (rows.length === 0) return rows;
  const issueIds = rows.map(r => r.issue.id);
  const allImages = await getOrderIssueImagesByIssueIds(issueIds);
  return rows.map(row => ({
    ...row,
    issue: {
      ...row.issue,
      images: allImages.filter(img => img.orderIssueId === row.issue.id).sort((a, b) => a.sortOrder - b.sortOrder).map(img => img.imageUrl),
    },
  }));
}

export async function getMultiBranchPendingReviewsCounts(branchIds: number[]) {
  const db = await getDb();
  if (!db || branchIds.length === 0) return [];
  return db.select({
    branchId: reviewRequests.branchId,
    pendingCount: count(),
  }).from(reviewRequests)
    .where(and(inArray(reviewRequests.branchId, branchIds), eq(reviewRequests.status, "pending")))
    .groupBy(reviewRequests.branchId);
}


// ═══════════════════════════════════════════════════════
// ── Push Subscriptions ──
// ═══════════════════════════════════════════════════════
import { pushSubscriptions, InsertPushSubscription } from "../drizzle/schema";

export async function savePushSubscription(customerId: number, endpoint: string, p256dh: string, auth: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  // Upsert: if same endpoint exists for customer, update keys
  const existing = await db.select().from(pushSubscriptions)
    .where(and(eq(pushSubscriptions.customerId, customerId), eq(pushSubscriptions.endpoint, sql`${endpoint}`)))
    .limit(1);
  if (existing[0]) {
    await db.update(pushSubscriptions).set({ p256dh, auth }).where(eq(pushSubscriptions.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(pushSubscriptions).values({ customerId, endpoint, p256dh, auth });
  return result.insertId;
}

export async function removePushSubscription(customerId: number, endpoint: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.customerId, customerId), eq(pushSubscriptions.endpoint, sql`${endpoint}`)));
}

export async function getAllPushSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pushSubscriptions);
}

export async function removePushSubscriptionByEndpoint(endpoint: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sql`${endpoint}`));
}

// ── Scheduled Announcements ──
export async function listScheduledAnnouncementsToPublish() {
  const db = await getDb();
  if (!db) return [];
  try {
    const now = new Date();
    // Find active announcements where scheduledAt <= now and scheduledPushSentAt is null
    // (meaning the push hasn't been sent yet)
    return db.select().from(announcements)
      .where(and(
        eq(announcements.isActive, 1),
        isNotNull(announcements.scheduledAt),
        sql`${announcements.scheduledAt} <= ${now}`,
        isNull(announcements.scheduledPushSentAt),
      ));
  } catch (err) {
    console.error("[ScheduledAnnouncements] Query error:", err);
    return [];
  }
}

// ── List announcements with category filter ──
export async function listAnnouncementsByCategory(category?: string, activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const conditions: any[] = [];
  if (activeOnly) {
    conditions.push(eq(announcements.isActive, 1));
    // Only filter by endDate (don't filter by startDate - show all active announcements)
    conditions.push(sql`(${announcements.endDate} IS NULL OR ${announcements.endDate} >= ${now})`);
    // Filter out scheduled announcements that haven't reached their time yet
    conditions.push(sql`(${announcements.scheduledAt} IS NULL OR ${announcements.scheduledAt} <= ${now})`);
  }
  if (category && category !== "all") {
    conditions.push(eq(announcements.type, category as any));
  }
  return db.select().from(announcements)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
}


// ── Marketing Dashboard Analytics ──

/** Get coupon/code stats per branch for admin marketing dashboard */
export async function getCodeStatsByBranch() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT 
      b.id as branchId,
      b.name as branchName,
      COUNT(c.id) as totalCodes,
      SUM(CASE WHEN c.codeStatus = 'issued' THEN 1 ELSE 0 END) as issuedCodes,
      SUM(CASE WHEN c.codeStatus = 'redeemed' THEN 1 ELSE 0 END) as redeemedCodes,
      SUM(CASE WHEN c.codeStatus = 'expired' THEN 1 ELSE 0 END) as expiredCodes,
      SUM(CASE WHEN c.codeType = 'RV' THEN 1 ELSE 0 END) as reviewCodes,
      SUM(CASE WHEN c.codeType = 'CL' THEN 1 ELSE 0 END) as claimCodes
    FROM branches b
    LEFT JOIN codes c ON c.branchId = b.id
    WHERE b.isActive = 1
    GROUP BY b.id, b.name
    ORDER BY totalCodes DESC
  `);
  return (result as any)[0] || [];
}

/** Get loyalty points stats per branch */
export async function getPointsStatsByBranch() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT 
      b.id as branchId,
      b.name as branchName,
      COUNT(DISTINCT blp.blpCustomerId) as totalCustomers,
      SUM(blp.blpTotalPoints) as totalActivePoints,
      SUM(blp.blpUsedPoints) as totalUsedPoints,
      SUM(blp.blpLifetimePoints) as totalLifetimePoints,
      AVG(blp.blpLifetimePoints) as avgLifetimePoints
    FROM branches b
    LEFT JOIN branch_loyalty_points blp ON blp.blpBranchId = b.id
    WHERE b.isActive = 1
    GROUP BY b.id, b.name
    ORDER BY totalLifetimePoints DESC
  `);
  return (result as any)[0] || [];
}

/** Get top customers by points per branch */
export async function getTopCustomersByBranch(branchId?: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const branchFilter = branchId ? sql`AND blp.blpBranchId = ${branchId}` : sql``;
  const result = await db.execute(sql`
    SELECT 
      c.id as customerId,
      c.name as customerName,
      c.phone as customerPhone,
      b.name as branchName,
      b.id as branchId,
      blp.blpTotalPoints as activePoints,
      blp.blpUsedPoints as usedPoints,
      blp.blpLifetimePoints as lifetimePoints
    FROM branch_loyalty_points blp
    JOIN customers c ON c.id = blp.blpCustomerId
    JOIN branches b ON b.id = blp.blpBranchId
    WHERE blp.blpLifetimePoints > 0 ${branchFilter}
    ORDER BY blp.blpLifetimePoints DESC
    LIMIT ${limit}
  `);
  return (result as any)[0] || [];
}

/** Get top code redeemers by branch */
export async function getTopCodeRedeemers(branchId?: number, limit = 10) {
  const db = await getDb();
  if (!db) return [];
  const branchFilter = branchId ? sql`AND c2.branchId = ${branchId}` : sql``;
  const result = await db.execute(sql`
    SELECT 
      cust.id as customerId,
      cust.name as customerName,
      cust.phone as customerPhone,
      COUNT(c2.id) as totalRedeemed,
      b.name as branchName,
      b.id as branchId
    FROM codes c2
    JOIN customers cust ON cust.id = c2.customerId
    JOIN branches b ON b.id = c2.branchId
    WHERE c2.codeStatus = 'redeemed' ${branchFilter}
    GROUP BY cust.id, cust.name, cust.phone, b.name, b.id
    ORDER BY totalRedeemed DESC
    LIMIT ${limit}
  `);
  return (result as any)[0] || [];
}

/** Get reward redemption stats per branch */
export async function getRewardRedemptionsByBranch() {
  const db = await getDb();
  if (!db) return [];
  const result = await db.execute(sql`
    SELECT 
      b.id as branchId,
      b.name as branchName,
      COUNT(rr.id) as totalRedemptions,
      SUM(rr.pointsSpent) as totalPointsSpent,
      SUM(CASE WHEN rr.redemptionStatus = 'used' THEN 1 ELSE 0 END) as usedRedemptions,
      SUM(CASE WHEN rr.redemptionStatus = 'pending' THEN 1 ELSE 0 END) as pendingRedemptions
    FROM branches b
    LEFT JOIN reward_redemptions rr ON rr.redemptionBranchId = b.id
    WHERE b.isActive = 1
    GROUP BY b.id, b.name
    ORDER BY totalRedemptions DESC
  `);
  return (result as any)[0] || [];
}

// ── Announcement Read Analytics ──
// (moved to main announcement section above: getAnnouncementReadStats, getAnnouncementReaders)

// ── Branch-specific Announcements ──

/** List announcements filtered by branch (null branchId = all branches) */
export async function listAnnouncementsForBranch(branchId: number | null, activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const now = new Date();
  const conditions: any[] = [];
  if (activeOnly) {
    conditions.push(eq(announcements.isActive, 1));
    // Don't filter by startDate - show all active announcements
    conditions.push(sql`(${announcements.endDate} IS NULL OR ${announcements.endDate} >= ${now})`);
    conditions.push(sql`(${announcements.scheduledAt} IS NULL OR ${announcements.scheduledAt} <= ${now})`);
  }
  // Show announcements that are for all branches OR for this specific branch
  if (branchId) {
    conditions.push(sql`(${announcements.branchId} IS NULL OR ${announcements.branchId} = ${branchId})`);
  }
  return db.select().from(announcements)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(announcements.isPinned), desc(announcements.createdAt));
}

// ── Announcement Templates ──
import { announcementTemplates, InsertAnnouncementTemplate } from "../drizzle/schema";

export async function listAnnouncementTemplates(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  if (activeOnly) {
    return db.select().from(announcementTemplates)
      .where(eq(announcementTemplates.isActive, 1))
      .orderBy(desc(announcementTemplates.createdAt));
  }
  return db.select().from(announcementTemplates).orderBy(desc(announcementTemplates.createdAt));
}

export async function getAnnouncementTemplateById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(announcementTemplates).where(eq(announcementTemplates.id, id)).limit(1);
  return result[0] ?? undefined;
}

export async function createAnnouncementTemplate(data: InsertAnnouncementTemplate) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db.insert(announcementTemplates).values(data);
  return result.insertId;
}

export async function updateAnnouncementTemplate(id: number, data: Partial<InsertAnnouncementTemplate>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(announcementTemplates).set(data).where(eq(announcementTemplates.id, id));
}

export async function deleteAnnouncementTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(announcementTemplates).where(eq(announcementTemplates.id, id));
}


// ── Sales Categories & Daily Sales Items ──
import { salesCategories, InsertSalesCategory, dailySalesItems, InsertDailySalesItem, dailySalesAuditLogs, InsertDailySalesAuditLog } from "../drizzle/schema";

export async function listSalesCategories(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  // Return global categories (branchId IS NULL) + branch-specific ones
  const conditions: any[] = [eq(salesCategories.isActive, 1)];
  if (branchId) {
    conditions.push(sql`(${salesCategories.branchId} IS NULL OR ${salesCategories.branchId} = ${branchId})`);
  } else {
    conditions.push(sql`${salesCategories.branchId} IS NULL`);
  }
  return db.select().from(salesCategories)
    .where(and(...conditions))
    .orderBy(salesCategories.sortOrder);
}

export async function listAllSalesCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(salesCategories).orderBy(salesCategories.sortOrder);
}

export async function createSalesCategory(data: InsertSalesCategory) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(salesCategories).values(data);
  return result.insertId;
}

export async function updateSalesCategory(id: number, data: Partial<InsertSalesCategory>) {
  const db = await getDb();
  if (!db) return;
  await db.update(salesCategories).set(data).where(eq(salesCategories.id, id));
}

export async function deleteSalesCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  // Soft delete
  await db.update(salesCategories).set({ isActive: 0 }).where(eq(salesCategories.id, id));
}

export async function getSalesCategoryById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(salesCategories).where(eq(salesCategories.id, id)).limit(1);
  return rows[0] || null;
}

// Daily Sales Items (per category per record)
export async function createDailySalesItems(items: InsertDailySalesItem[]) {
  const db = await getDb();
  if (!db || items.length === 0) return;
  await db.insert(dailySalesItems).values(items);
}

export async function getDailySalesItemsByRecordId(salesRecordId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySalesItems).where(eq(dailySalesItems.salesRecordId, salesRecordId));
}

export async function deleteDailySalesItemsByRecordId(salesRecordId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(dailySalesItems).where(eq(dailySalesItems.salesRecordId, salesRecordId));
}

// Summary: sales by category for a month
export async function getMonthlySalesByCategory(branchId: number, year: number, month: number) {
  const db = await getDb();
  if (!db) return [];
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return db.select({
    categoryId: dailySalesItems.categoryId,
    categoryName: salesCategories.name,
    commissionRate: salesCategories.commissionRate,
    totalAmount: sql<number>`COALESCE(SUM(${dailySalesItems.amount}), 0)`,
    itemCount: count(),
  }).from(dailySalesItems)
    .innerJoin(dailySalesRecords, eq(dailySalesItems.salesRecordId, dailySalesRecords.id))
    .innerJoin(salesCategories, eq(dailySalesItems.categoryId, salesCategories.id))
    .where(and(
      eq(dailySalesRecords.branchId, branchId),
      gte(dailySalesRecords.salesDate, startDate),
      lte(dailySalesRecords.salesDate, endDate),
    ))
    .groupBy(dailySalesItems.categoryId, salesCategories.name, salesCategories.commissionRate);
}

// Date range sales summary (flexible date range)
export async function getDateRangeSalesSummary(branchId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({
    totalCash: sql<number>`COALESCE(SUM(${dailySalesRecords.cashAmount}), 0)`,
    totalTransfer: sql<number>`COALESCE(SUM(${dailySalesRecords.transferAmount}), 0)`,
    totalEdc: sql<number>`COALESCE(SUM(${dailySalesRecords.edcAmount}), 0)`,
    totalDelivery: sql<number>`COALESCE(SUM(${dailySalesRecords.deliveryAmount}), 0)`,
    totalExtra: sql<number>`COALESCE(SUM(${dailySalesRecords.extraTotal}), 0)`,
    grandTotal: sql<number>`COALESCE(SUM(${dailySalesRecords.totalAmount}), 0)`,
    recordCount: count(),
  }).from(dailySalesRecords)
    .where(and(
      eq(dailySalesRecords.branchId, branchId),
      gte(dailySalesRecords.salesDate, startDate),
      lte(dailySalesRecords.salesDate, endDate),
    ));
  return rows[0] || null;
}

// Date range sales by category
export async function getDateRangeSalesByCategory(branchId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    categoryId: dailySalesItems.categoryId,
    categoryName: salesCategories.name,
    commissionRate: salesCategories.commissionRate,
    totalAmount: sql<number>`COALESCE(SUM(${dailySalesItems.amount}), 0)`,
    itemCount: count(),
  }).from(dailySalesItems)
    .innerJoin(dailySalesRecords, eq(dailySalesItems.salesRecordId, dailySalesRecords.id))
    .innerJoin(salesCategories, eq(dailySalesItems.categoryId, salesCategories.id))
    .where(and(
      eq(dailySalesRecords.branchId, branchId),
      gte(dailySalesRecords.salesDate, startDate),
      lte(dailySalesRecords.salesDate, endDate),
    ))
    .groupBy(dailySalesItems.categoryId, salesCategories.name, salesCategories.commissionRate);
}

// Get daily records list for a date range (for day-by-day detail)
export async function getDailySalesRecordsByRange(branchId: number, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySalesRecords)
    .where(and(
      eq(dailySalesRecords.branchId, branchId),
      gte(dailySalesRecords.salesDate, startDate),
      lte(dailySalesRecords.salesDate, endDate),
    ))
    .orderBy(asc(dailySalesRecords.salesDate));
}

// Commission calculation for a staff member for a month
export async function getStaffCommission(branchId: number, year: number, month: number) {
  const categorySales = await getMonthlySalesByCategory(branchId, year, month);
  return categorySales.map(cs => ({
    categoryId: cs.categoryId,
    categoryName: cs.categoryName,
    totalAmount: Number(cs.totalAmount),
    commissionRate: Number(cs.commissionRate),
    commissionAmount: Math.round(Number(cs.totalAmount) * Number(cs.commissionRate) / 100),
  }));
}


// ═══════════════════════════════════════════════════════
// ── Franchise Owners ──
// ═══════════════════════════════════════════════════════

export async function listFranchiseOwners(activeOnly = true) {
  const db = await getDb();
  if (!db) return [];
  const conditions: any[] = [];
  if (activeOnly) conditions.push(eq(franchiseOwners.isActive, 1));
  const where = conditions.length ? and(...conditions) : undefined;
  return db.select().from(franchiseOwners).where(where).orderBy(asc(franchiseOwners.name));
}

export async function getFranchiseOwnerById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(franchiseOwners).where(eq(franchiseOwners.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function createFranchiseOwner(data: { name: string; companyName?: string; phone?: string; email?: string }) {
  const db = await getDb();
  if (!db) return 0;
  const [result] = await db.insert(franchiseOwners).values({
    name: data.name,
    companyName: data.companyName ?? null,
    phone: data.phone ?? null,
    email: data.email ?? null,
  });
  return result.insertId;
}

export async function updateFranchiseOwner(id: number, data: Partial<InsertFranchiseOwner>) {
  const db = await getDb();
  if (!db) return;
  await db.update(franchiseOwners).set(data).where(eq(franchiseOwners.id, id));
}

export async function getBranchesByFranchiseOwner(franchiseOwnerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(branches).where(and(
    eq(branches.franchiseOwnerId, franchiseOwnerId),
    eq(branches.isActive, 1),
  )).orderBy(asc(branches.name));
}

export async function assignBranchToFranchiseOwner(branchId: number, franchiseOwnerId: number | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(branches).set({ franchiseOwnerId }).where(eq(branches.id, branchId));
}

// ═══════════════════════════════════════════════════════
// ── In-Store Sales ──
// ═══════════════════════════════════════════════════════

export async function createInStoreSale(data: {
  branchId: number;
  customerId: number;
  productId: number;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentSlipUrl?: string;
  commissionType?: "percent" | "fixed";
  commissionValue?: number;
  totalCommission: number;
  pointsAwarded: number;
  isAppSale?: number; // 1 = ลูกค้าซื้อผ่านแอพ (ไม่คิดคอม)
  totalCost?: number; // ต้นทุนรวม (satang)
  saleDate: Date;
  note?: string;
  createdBy: number;
  staffIds: number[];
}) {
  const db = await getDb();
  if (!db) return 0;
  
  // Insert the sale
  const [result] = await db.insert(inStoreSales).values({
    branchId: data.branchId,
    customerId: data.customerId,
    productId: data.productId,
    quantity: data.quantity,
    unitPrice: data.unitPrice,
    totalAmount: data.totalAmount,
    paymentSlipUrl: data.paymentSlipUrl ?? null,
    commissionType: data.commissionType ?? null,
    commissionValue: data.commissionValue ?? 0,
    totalCommission: data.totalCommission,
    pointsAwarded: data.pointsAwarded,
    isAppSale: data.isAppSale ?? 0,
    totalCost: data.totalCost ?? 0,
    saleDate: data.saleDate,
    note: data.note ?? null,
    createdBy: data.createdBy,
  });
  const saleId = result.insertId;
  
  // Insert staff assignments with equal commission split
  const staffCount = data.staffIds.length;
  const perStaffCommission = staffCount > 0 ? Math.floor(data.totalCommission / staffCount) : 0;
  
  for (const staffId of data.staffIds) {
    await db.insert(inStoreSaleStaff).values({
      saleId,
      staffId,
      commissionAmount: perStaffCommission,
    });
  }
  
  return saleId;
}

export async function listInStoreSales(opts: {
  branchId?: number;
  staffId?: number;
  customerId?: number;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { sales: [], total: 0 };
  
  const conditions: any[] = [];
  if (opts.branchId) conditions.push(eq(inStoreSales.branchId, opts.branchId));
  if (opts.customerId) conditions.push(eq(inStoreSales.customerId, opts.customerId));
  if (opts.startDate) conditions.push(gte(inStoreSales.saleDate, opts.startDate));
  if (opts.endDate) conditions.push(lte(inStoreSales.saleDate, opts.endDate));
  
  // If filtering by staffId, join with inStoreSaleStaff
  if (opts.staffId) {
    conditions.push(eq(inStoreSaleStaff.staffId, opts.staffId));
    const where = conditions.length ? and(...conditions) : undefined;
    const [totalResult] = await db.select({ count: count() })
      .from(inStoreSales)
      .innerJoin(inStoreSaleStaff, eq(inStoreSales.id, inStoreSaleStaff.saleId))
      .where(where);
    const sales = await db.select({
      id: inStoreSales.id,
      branchId: inStoreSales.branchId,
      customerId: inStoreSales.customerId,
      productId: inStoreSales.productId,
      quantity: inStoreSales.quantity,
      unitPrice: inStoreSales.unitPrice,
      totalAmount: inStoreSales.totalAmount,
      paymentSlipUrl: inStoreSales.paymentSlipUrl,
      totalCommission: inStoreSales.totalCommission,
      commissionType: inStoreSales.commissionType,
      commissionValue: inStoreSales.commissionValue,
      pointsAwarded: inStoreSales.pointsAwarded,
      isAppSale: inStoreSales.isAppSale,
      totalCost: inStoreSales.totalCost,
      saleDate: inStoreSales.saleDate,
      note: inStoreSales.note,
      createdBy: inStoreSales.createdBy,
      createdAt: inStoreSales.createdAt,
      staffCommission: inStoreSaleStaff.commissionAmount,
    })
      .from(inStoreSales)
      .innerJoin(inStoreSaleStaff, eq(inStoreSales.id, inStoreSaleStaff.saleId))
      .where(where)
      .orderBy(desc(inStoreSales.saleDate))
      .limit(opts.limit ?? 50)
      .offset(opts.offset ?? 0);
    return { sales, total: Number(totalResult?.count ?? 0) };
  }
  
  const where = conditions.length ? and(...conditions) : undefined;
  const [totalResult] = await db.select({ count: count() }).from(inStoreSales).where(where);
  const sales = await db.select().from(inStoreSales)
    .where(where)
    .orderBy(desc(inStoreSales.saleDate))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
  return { sales, total: Number(totalResult?.count ?? 0) };
}

export async function getInStoreSaleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(inStoreSales).where(eq(inStoreSales.id, id)).limit(1);
  if (!rows[0]) return null;
  
  // Get staff assignments
  const staffRows = await db.select().from(inStoreSaleStaff).where(eq(inStoreSaleStaff.saleId, id));
  return { ...rows[0], staff: staffRows };
}

export async function getInStoreSaleStaff(saleId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    staffId: inStoreSaleStaff.staffId,
    commissionAmount: inStoreSaleStaff.commissionAmount,
    staffName: staff.name,
    staffPhone: staff.phone,
  })
    .from(inStoreSaleStaff)
    .innerJoin(staff, eq(inStoreSaleStaff.staffId, staff.id))
    .where(eq(inStoreSaleStaff.saleId, saleId));
}

// ═══════════════════════════════════════════════════════
// ── Commission Records (Monthly Aggregation) ──
// ═══════════════════════════════════════════════════════

export async function upsertCommissionRecord(data: {
  staffId: number;
  branchId: number;
  month: string; // YYYY-MM
  salesAmount: number; // amount to add in satang
  commission: number; // commission to add in satang
}) {
  const db = await getDb();
  if (!db) return;
  
  // Check if record exists
  const existing = await db.select().from(commissionRecords)
    .where(and(
      eq(commissionRecords.staffId, data.staffId),
      eq(commissionRecords.branchId, data.branchId),
      eq(commissionRecords.month, data.month),
    )).limit(1);
  
  if (existing[0]) {
    // Update existing record
    await db.update(commissionRecords).set({
      totalSalesAmount: sql`${commissionRecords.totalSalesAmount} + ${data.salesAmount}`,
      totalCommission: sql`${commissionRecords.totalCommission} + ${data.commission}`,
      salesCount: sql`${commissionRecords.salesCount} + 1`,
    }).where(eq(commissionRecords.id, existing[0].id));
  } else {
    // Create new record
    await db.insert(commissionRecords).values({
      staffId: data.staffId,
      branchId: data.branchId,
      month: data.month,
      totalSalesAmount: data.salesAmount,
      totalCommission: data.commission,
      salesCount: 1,
    });
  }
}

export async function getMonthlyCommissionReport(opts: {
  month: string; // YYYY-MM
  branchId?: number;
  franchiseOwnerId?: number;
  staffId?: number;
}) {
  const db = await getDb();
  if (!db) return [];
  
  const conditions: any[] = [eq(commissionRecords.month, opts.month)];
  if (opts.branchId) conditions.push(eq(commissionRecords.branchId, opts.branchId));
  if (opts.staffId) conditions.push(eq(commissionRecords.staffId, opts.staffId));
  
  const where = and(...conditions);
  
  const records = await db.select({
    id: commissionRecords.id,
    staffId: commissionRecords.staffId,
    staffName: staff.name,
    staffPhone: staff.phone,
    branchId: commissionRecords.branchId,
    branchName: branches.name,
    month: commissionRecords.month,
    totalSalesAmount: commissionRecords.totalSalesAmount,
    totalCommission: commissionRecords.totalCommission,
    salesCount: commissionRecords.salesCount,
    status: commissionRecords.status,
    approvedAt: commissionRecords.approvedAt,
    paidAt: commissionRecords.paidAt,
    note: commissionRecords.note,
  })
    .from(commissionRecords)
    .innerJoin(staff, eq(commissionRecords.staffId, staff.id))
    .innerJoin(branches, eq(commissionRecords.branchId, branches.id))
    .where(where)
    .orderBy(asc(branches.name), asc(staff.name));
  
  // If filtering by franchiseOwnerId, filter in JS (simpler than another join)
  if (opts.franchiseOwnerId) {
    const ownerBranches = await getBranchesByFranchiseOwner(opts.franchiseOwnerId);
    const branchIds = new Set(ownerBranches.map(b => b.id));
    return records.filter(r => branchIds.has(r.branchId));
  }
  
  return records;
}

export async function updateCommissionStatus(id: number, status: "pending" | "approved" | "paid", approvedBy?: number) {
  const db = await getDb();
  if (!db) return;
  const updateData: any = { status };
  if (status === "approved") {
    updateData.approvedBy = approvedBy;
    updateData.approvedAt = new Date();
  }
  if (status === "paid") {
    updateData.paidAt = new Date();
  }
  await db.update(commissionRecords).set(updateData).where(eq(commissionRecords.id, id));
}

// ── In-Store Sales Summary for Daily Sales ──
export async function getInStoreSalesSummary(branchId: number, date: Date) {
  const db = await getDb();
  if (!db) return { totalAmount: 0, totalCommission: 0, totalCost: 0, appSaleAmount: 0, walkInAmount: 0, count: 0 };
  
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  const [result] = await db.select({
    totalAmount: sql<number>`COALESCE(SUM(${inStoreSales.totalAmount}), 0)`,
    totalCommission: sql<number>`COALESCE(SUM(${inStoreSales.totalCommission}), 0)`,
    totalCost: sql<number>`COALESCE(SUM(${inStoreSales.totalCost}), 0)`,
    appSaleAmount: sql<number>`COALESCE(SUM(CASE WHEN ${inStoreSales.isAppSale} = 1 THEN ${inStoreSales.totalAmount} ELSE 0 END), 0)`,
    walkInAmount: sql<number>`COALESCE(SUM(CASE WHEN ${inStoreSales.isAppSale} = 0 THEN ${inStoreSales.totalAmount} ELSE 0 END), 0)`,
    count: count(),
  })
    .from(inStoreSales)
    .where(and(
      eq(inStoreSales.branchId, branchId),
      gte(inStoreSales.saleDate, startOfDay),
      lte(inStoreSales.saleDate, endOfDay),
    ));
  
  return {
    totalAmount: Number(result?.totalAmount ?? 0),
    totalCommission: Number(result?.totalCommission ?? 0),
    totalCost: Number(result?.totalCost ?? 0),
    appSaleAmount: Number(result?.appSaleAmount ?? 0),
    walkInAmount: Number(result?.walkInAmount ?? 0),
    count: Number(result?.count ?? 0),
  };
}

// Calculate commission for a product sale
export function calculateCommission(
  commissionType: "percent" | "fixed" | null,
  commissionValue: number,
  totalAmount: number,
): number {
  if (!commissionType || !commissionValue) return 0;
  if (commissionType === "percent") {
    // commissionValue is in basis points (100 = 1%)
    return Math.round(totalAmount * commissionValue / 10000);
  }
  // fixed: commissionValue is in satang per unit
  return commissionValue;
}


// ═══════════════════════════════════════════════════════════════════════
// POS System DB Helpers
// ═══════════════════════════════════════════════════════════════════════

// ─── POS Categories ──────────────────────────────────────────────────
export async function posListCategories() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posCategories).orderBy(asc(posCategories.sortOrder), asc(posCategories.name));
}

export async function posCreateCategory(data: InsertPosCategory) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(posCategories).values(data);
  return { id: result[0].insertId };
}

export async function posUpdateCategory(id: number, data: Partial<InsertPosCategory>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posCategories).set(data).where(eq(posCategories.id, id));
}

export async function posDeleteCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(posCategories).where(eq(posCategories.id, id));
}

// ─── POS Menu Items ──────────────────────────────────────────────────
export async function posListMenuItems(categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const q = categoryId
    ? db.select().from(posMenuItems).where(eq(posMenuItems.categoryId, categoryId))
    : db.select().from(posMenuItems);
  return q.orderBy(asc(posMenuItems.sortOrder), asc(posMenuItems.name));
}

export async function posGetMenuItem(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(posMenuItems).where(eq(posMenuItems.id, id)).limit(1);
  return r[0];
}

export async function posCreateMenuItem(data: InsertPosMenuItem) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(posMenuItems).values(data);
  return result[0].insertId;
}

export async function posUpdateMenuItem(id: number, data: Partial<InsertPosMenuItem>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posMenuItems).set(data).where(eq(posMenuItems.id, id));
}

export async function posDeleteMenuItem(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(posMenuItemOptionGroups).where(eq(posMenuItemOptionGroups.menuItemId, id));
  await db.delete(posMenuItems).where(eq(posMenuItems.id, id));
}

// ─── POS Branch Menu Items ───────────────────────────────────────────
export async function posGetBranchMenuItems(branchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posBranchMenuItems).where(eq(posBranchMenuItems.branchId, branchId));
}

export async function posUpsertBranchMenuItem(branchId: number, menuItemId: number, data: { price?: string; costPrice?: string; isAvailable: boolean }) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(posBranchMenuItems).where(and(eq(posBranchMenuItems.branchId, branchId), eq(posBranchMenuItems.menuItemId, menuItemId))).limit(1);
  if (existing.length > 0) {
    await db.update(posBranchMenuItems).set(data).where(eq(posBranchMenuItems.id, existing[0].id));
  } else {
    await db.insert(posBranchMenuItems).values({ branchId, menuItemId, ...data });
  }
}

// ─── POS Option Groups & Options ─────────────────────────────────────
export async function posListOptionGroups() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posOptionGroups).orderBy(asc(posOptionGroups.sortOrder));
}

export async function posCreateOptionGroup(data: InsertPosOptionGroup) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(posOptionGroups).values(data);
  return result[0].insertId;
}

export async function posUpdateOptionGroup(id: number, data: Partial<InsertPosOptionGroup>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posOptionGroups).set(data).where(eq(posOptionGroups.id, id));
}

export async function posDeleteOptionGroup(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(posOptions).where(eq(posOptions.groupId, id));
  await db.delete(posMenuItemOptionGroups).where(eq(posMenuItemOptionGroups.optionGroupId, id));
  await db.delete(posOptionGroups).where(eq(posOptionGroups.id, id));
}

export async function posListOptions(groupId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posOptions).where(eq(posOptions.groupId, groupId)).orderBy(asc(posOptions.sortOrder));
}

export async function posCreateOption(data: InsertPosOption) {
  const db = await getDb();
  if (!db) return;
  await db.insert(posOptions).values(data);
}

export async function posUpdateOption(id: number, data: Partial<InsertPosOption>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posOptions).set(data).where(eq(posOptions.id, id));
}

export async function posDeleteOption(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(posOptions).where(eq(posOptions.id, id));
}

// ─── POS Menu Item <-> Option Group links ────────────────────────────
export async function posListOptionGroupsWithOptions() {
  const db = await getDb();
  if (!db) return [];
  const groups = await db.select().from(posOptionGroups).orderBy(asc(posOptionGroups.sortOrder));
  const allOptions = await db.select().from(posOptions).where(eq(posOptions.isActive, true)).orderBy(asc(posOptions.sortOrder));
  return groups.map(g => ({
    ...g,
    options: allOptions.filter(o => o.groupId === g.id),
  }));
}

export async function posListAllMenuItemOptionGroupMappings() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posMenuItemOptionGroups);
}

export async function posGetMenuItemOptionGroups(menuItemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posMenuItemOptionGroups).where(eq(posMenuItemOptionGroups.menuItemId, menuItemId));
}

export async function posSetMenuItemOptionGroups(menuItemId: number, groupIds: number[]) {
  const db = await getDb();
  if (!db) return;
  await db.delete(posMenuItemOptionGroups).where(eq(posMenuItemOptionGroups.menuItemId, menuItemId));
  if (groupIds.length > 0) {
    await db.insert(posMenuItemOptionGroups).values(groupIds.map(optionGroupId => ({ menuItemId, optionGroupId })));
  }
}

// ─── POS Retail Products ─────────────────────────────────────────────
export async function posListRetailProducts(categoryId?: number) {
  const db = await getDb();
  if (!db) return [];
  const q = categoryId
    ? db.select().from(posRetailProducts).where(eq(posRetailProducts.categoryId, categoryId))
    : db.select().from(posRetailProducts);
  return q.orderBy(asc(posRetailProducts.sortOrder), asc(posRetailProducts.name));
}

export async function posCreateRetailProduct(data: InsertPosRetailProduct) {
  const db = await getDb();
  if (!db) return;
  await db.insert(posRetailProducts).values(data);
}

export async function posUpdateRetailProduct(id: number, data: Partial<InsertPosRetailProduct>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posRetailProducts).set(data).where(eq(posRetailProducts.id, id));
}

export async function posDeleteRetailProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(posRetailProducts).where(eq(posRetailProducts.id, id));
}

// ─── POS Branch Retail Stock ─────────────────────────────────────────
export async function posGetBranchRetailStock(branchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posBranchRetailStock).where(eq(posBranchRetailStock.branchId, branchId));
}

export async function posUpsertBranchRetailStock(branchId: number, retailProductId: number, data: { stock: number; minStock: number; price?: string; isAvailable: boolean }) {
  const db = await getDb();
  if (!db) return;
  const existing = await db.select().from(posBranchRetailStock).where(and(eq(posBranchRetailStock.branchId, branchId), eq(posBranchRetailStock.retailProductId, retailProductId))).limit(1);
  if (existing.length > 0) {
    await db.update(posBranchRetailStock).set(data).where(eq(posBranchRetailStock.id, existing[0].id));
  } else {
    await db.insert(posBranchRetailStock).values({ branchId, retailProductId, ...data });
  }
}

// ─── POS Payment Methods ─────────────────────────────────────────────
export async function posListPaymentMethods() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posPaymentMethods).orderBy(asc(posPaymentMethods.sortOrder));
}

export async function posCreatePaymentMethod(data: InsertPosPaymentMethod) {
  const db = await getDb();
  if (!db) return;
  await db.insert(posPaymentMethods).values(data);
}

export async function posUpdatePaymentMethod(id: number, data: Partial<InsertPosPaymentMethod>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posPaymentMethods).set(data).where(eq(posPaymentMethods.id, id));
}

// ─── POS Discounts ───────────────────────────────────────────────────
export async function posListDiscounts() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posDiscounts).orderBy(desc(posDiscounts.createdAt));
}

export async function posCreateDiscount(data: InsertPosDiscount) {
  const db = await getDb();
  if (!db) return;
  await db.insert(posDiscounts).values(data);
}

export async function posUpdateDiscount(id: number, data: Partial<InsertPosDiscount>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posDiscounts).set(data).where(eq(posDiscounts.id, id));
}

export async function posDeleteDiscount(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(posDiscounts).where(eq(posDiscounts.id, id));
}

// ─── POS Orders ──────────────────────────────────────────────────────
export async function posCreateOrder(data: InsertPosOrder) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(posOrders).values(data);
  return result[0].insertId;
}

export async function posGetOrder(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const r = await db.select().from(posOrders).where(eq(posOrders.id, id)).limit(1);
  return r[0];
}

export async function posUpdateOrder(id: number, data: Partial<InsertPosOrder>) {
  const db = await getDb();
  if (!db) return;
  await db.update(posOrders).set(data).where(eq(posOrders.id, id));
}

export async function posListOrders(branchId: number, status?: string, dateFrom?: string, dateTo?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(posOrders.branchId, branchId)];
  if (status) conditions.push(eq(posOrders.status, status as any));
  if (dateFrom) conditions.push(gte(posOrders.createdAt, new Date(dateFrom)));
  if (dateTo) conditions.push(lte(posOrders.createdAt, new Date(dateTo + "T23:59:59")));
  return db.select().from(posOrders).where(and(...conditions)).orderBy(desc(posOrders.createdAt)).limit(200);
}

export async function posGetNextOrderNumber(branchId: number) {
  const db = await getDb();
  if (!db) return "ORD-001";
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const prefix = `${today}-`;
  const result = await db.select({ count: sql<number>`COUNT(*)` }).from(posOrders)
    .where(and(eq(posOrders.branchId, branchId), like(posOrders.orderNumber, `${prefix}%`)));
  const cnt = (result[0]?.count ?? 0) + 1;
  return `${prefix}${String(cnt).padStart(4, "0")}`;
}

// ─── POS Order Items ─────────────────────────────────────────────────
export async function posCreateOrderItem(data: InsertPosOrderItem) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db.insert(posOrderItems).values(data);
  return result[0].insertId;
}

export async function posGetOrderItems(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posOrderItems).where(eq(posOrderItems.orderId, orderId));
}

export async function posCreateOrderItemOptions(items: { orderItemId: number; optionGroupName: string; optionName: string; priceAdjustment: string }[]) {
  const db = await getDb();
  if (!db || items.length === 0) return;
  await db.insert(posOrderItemOptions).values(items);
}

export async function posGetOrderItemOptions(orderItemId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posOrderItemOptions).where(eq(posOrderItemOptions.orderItemId, orderItemId));
}

// ─── POS Order Payments ──────────────────────────────────────────────
export async function posCreateOrderPayment(data: InsertPosOrderPayment) {
  const db = await getDb();
  if (!db) return;
  await db.insert(posOrderPayments).values(data);
}

export async function posGetOrderPayments(orderId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posOrderPayments).where(eq(posOrderPayments.orderId, orderId));
}

// ─── POS Kitchen Tickets ─────────────────────────────────────────────
export async function posCreateKitchenTicket(data: InsertPosKitchenTicket) {
  const db = await getDb();
  if (!db) return;
  await db.insert(posKitchenTickets).values(data);
}

export async function posListKitchenTickets(branchId: number, station?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(posKitchenTickets.branchId, branchId)];
  if (station) conditions.push(eq(posKitchenTickets.station, station as any));
  return db.select().from(posKitchenTickets).where(and(...conditions)).orderBy(desc(posKitchenTickets.createdAt)).limit(50);
}

export async function posUpdateKitchenTicketStatus(id: number, status: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(posKitchenTickets).set({ status: status as any }).where(eq(posKitchenTickets.id, id));
}

// ─── POS Reports ─────────────────────────────────────────────────────
export async function posGetDailySalesReport(branchId: number, dateFrom: string, dateTo: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    date: sql<string>`DATE(${posOrders.createdAt})`,
    totalOrders: sql<number>`COUNT(*)`,
    totalRevenue: sql<string>`SUM(${posOrders.totalAmount})`,
    totalCost: sql<string>`SUM(${posOrders.totalCost})`,
    totalDiscount: sql<string>`SUM(${posOrders.discountAmount})`,
  }).from(posOrders)
    .where(and(
      eq(posOrders.branchId, branchId),
      eq(posOrders.status, "completed"),
      gte(posOrders.createdAt, new Date(dateFrom)),
      lte(posOrders.createdAt, new Date(dateTo + "T23:59:59"))
    ))
    .groupBy(sql`DATE(${posOrders.createdAt})`)
    .orderBy(sql`DATE(${posOrders.createdAt})`);
}

export async function posGetSalesByPaymentMethod(branchId: number, dateFrom: string, dateTo: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    paymentMethodId: posOrderPayments.paymentMethodId,
    totalAmount: sql<string>`SUM(${posOrderPayments.amount})`,
    count: sql<number>`COUNT(*)`,
  }).from(posOrderPayments)
    .innerJoin(posOrders, eq(posOrders.id, posOrderPayments.orderId))
    .where(and(
      eq(posOrders.branchId, branchId),
      eq(posOrders.status, "completed"),
      gte(posOrders.createdAt, new Date(dateFrom)),
      lte(posOrders.createdAt, new Date(dateTo + "T23:59:59"))
    ))
    .groupBy(posOrderPayments.paymentMethodId);
}

export async function posGetSalesByCategory(branchId: number, dateFrom: string, dateTo: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select({
    itemType: posOrderItems.itemType,
    name: posOrderItems.name,
    totalQty: sql<number>`SUM(${posOrderItems.quantity})`,
    totalRevenue: sql<string>`SUM(${posOrderItems.totalPrice})`,
    totalCost: sql<string>`SUM(${posOrderItems.unitCost} * ${posOrderItems.quantity})`,
  }).from(posOrderItems)
    .innerJoin(posOrders, eq(posOrders.id, posOrderItems.orderId))
    .where(and(
      eq(posOrders.branchId, branchId),
      eq(posOrders.status, "completed"),
      gte(posOrders.createdAt, new Date(dateFrom)),
      lte(posOrders.createdAt, new Date(dateTo + "T23:59:59"))
    ))
    .groupBy(posOrderItems.itemType, posOrderItems.name)
    .orderBy(sql`SUM(${posOrderItems.totalPrice}) DESC`);
}

// ─── POS Staff PINs ─────────────────────────────────────────────────
export async function posGetStaffPinsByBranch(branchId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(posStaffPins).where(eq(posStaffPins.branchId, branchId)).orderBy(asc(posStaffPins.name));
}

export async function posVerifyStaffPin(branchId: number, pin: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(posStaffPins)
    .where(and(eq(posStaffPins.branchId, branchId), eq(posStaffPins.pin, pin), eq(posStaffPins.isActive, true)))
    .limit(1);
  if (rows.length === 0) return null;
  await db.update(posStaffPins).set({ lastLogin: new Date() }).where(eq(posStaffPins.id, rows[0].id));
  return rows[0];
}

export async function posCreateStaffPin(data: InsertPosStaffPin) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  const result = await db.insert(posStaffPins).values(data);
  return { id: result[0].insertId };
}

export async function posUpdateStaffPin(id: number, data: Partial<InsertPosStaffPin>) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.update(posStaffPins).set(data).where(eq(posStaffPins.id, id));
}

export async function posDeleteStaffPin(id: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  await db.delete(posStaffPins).where(eq(posStaffPins.id, id));
}

// ─── POS Auto-Setup for New Branch ─────────────────────────────────────
export async function posAutoSetupBranch(branchId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  // 1. Copy all active menu items as branch menu items (available by default)
  const allMenuItems = await db.select().from(posMenuItems).where(eq(posMenuItems.isActive, true));
  for (const item of allMenuItems) {
    const existing = await db.select().from(posBranchMenuItems)
      .where(and(eq(posBranchMenuItems.branchId, branchId), eq(posBranchMenuItems.menuItemId, item.id)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(posBranchMenuItems).values({
        branchId,
        menuItemId: item.id,
        price: item.basePrice,
        costPrice: item.costPrice,
        isAvailable: true,
      });
    }
  }
  // 2. Copy all active retail products as branch retail stock
  const allRetail = await db.select().from(posRetailProducts).where(eq(posRetailProducts.isActive, true));
  for (const rp of allRetail) {
    const existing = await db.select().from(posBranchRetailStock)
      .where(and(eq(posBranchRetailStock.branchId, branchId), eq(posBranchRetailStock.retailProductId, rp.id)))
      .limit(1);
    if (existing.length === 0) {
      await db.insert(posBranchRetailStock).values({
        branchId,
        retailProductId: rp.id,
        stock: 0,
        minStock: 5,
        price: rp.price,
        isAvailable: true,
      });
    }
  }
  // 3. Create default manager PIN (1234)
  const existingPin = await db.select().from(posStaffPins)
    .where(and(eq(posStaffPins.branchId, branchId), eq(posStaffPins.role, "manager")))
    .limit(1);
  if (existingPin.length === 0) {
    await db.insert(posStaffPins).values({
      branchId,
      name: "ผู้จัดการสาขา",
      pin: "1234",
      role: "manager",
      isActive: true,
    });
  }
  return { menuItemsAdded: allMenuItems.length, retailProductsAdded: allRetail.length, defaultPinCreated: existingPin.length === 0 };
}

// ─── POS Branch Menu Selection (select/deselect from central catalog) ───
export async function posSelectBranchMenuItems(branchId: number, menuItemIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  let added = 0;
  for (const menuItemId of menuItemIds) {
    const existing = await db.select().from(posBranchMenuItems)
      .where(and(eq(posBranchMenuItems.branchId, branchId), eq(posBranchMenuItems.menuItemId, menuItemId)))
      .limit(1);
    if (existing.length === 0) {
      const item = await db.select().from(posMenuItems).where(eq(posMenuItems.id, menuItemId)).limit(1);
      if (item.length > 0) {
        await db.insert(posBranchMenuItems).values({
          branchId,
          menuItemId,
          price: item[0].basePrice,
          costPrice: item[0].costPrice,
          isAvailable: true,
        });
        added++;
      }
    }
  }
  return { added };
}

export async function posDeselectBranchMenuItems(branchId: number, menuItemIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("DB not available");
  let removed = 0;
  for (const menuItemId of menuItemIds) {
    const result = await db.delete(posBranchMenuItems)
      .where(and(eq(posBranchMenuItems.branchId, branchId), eq(posBranchMenuItems.menuItemId, menuItemId)));
    if (result[0].affectedRows > 0) removed++;
  }
  return { removed };
}

// Get branch menu catalog (all central items + selection status for branch)
export async function posGetBranchMenuCatalog(branchId: number) {
  const db = await getDb();
  if (!db) return [];
  const allItems = await db.select().from(posMenuItems).orderBy(asc(posMenuItems.sortOrder), asc(posMenuItems.name));
  const branchItems = await db.select().from(posBranchMenuItems).where(eq(posBranchMenuItems.branchId, branchId));
  const branchMap = new Map(branchItems.map(bi => [bi.menuItemId, bi]));
  return allItems.map(item => ({
    ...item,
    isSelected: branchMap.has(item.id),
    branchPrice: branchMap.get(item.id)?.price || null,
    branchCostPrice: branchMap.get(item.id)?.costPrice || null,
    branchIsAvailable: branchMap.get(item.id)?.isAvailable ?? false,
    branchMenuItemId: branchMap.get(item.id)?.id || null,
  }));
}


// ── Daily Sales Audit Trail ──

export async function createDailySalesAuditLog(data: {
  salesRecordId: number;
  branchId: number;
  userId: number;
  userName: string | null;
  action: "create" | "update";
  beforeData: string | null;
  afterData: string;
}) {
  const db = await getDb();
  if (!db) return;
  await db.insert(dailySalesAuditLogs).values({
    salesRecordId: data.salesRecordId,
    branchId: data.branchId,
    userId: data.userId,
    userName: data.userName,
    action: data.action,
    beforeData: data.beforeData,
    afterData: data.afterData,
  });
}

export async function getDailySalesAuditLogs(salesRecordId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySalesAuditLogs)
    .where(eq(dailySalesAuditLogs.salesRecordId, salesRecordId))
    .orderBy(sql`${dailySalesAuditLogs.createdAt} DESC`);
}

export async function getDailySalesAuditLogsByBranch(branchId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySalesAuditLogs)
    .where(eq(dailySalesAuditLogs.branchId, branchId))
    .orderBy(sql`${dailySalesAuditLogs.createdAt} DESC`)
    .limit(limit);
}


// ── Staff Push Subscriptions ──
import { staffPushSubscriptions, InsertStaffPushSubscription } from "../drizzle/schema";

export async function upsertStaffPushSubscription(staffId: number, endpoint: string, p256dh: string, auth: string) {
  const db = await getDb();
  if (!db) return;
  // Check if subscription already exists for this staff+endpoint
  const existing = await db.select().from(staffPushSubscriptions)
    .where(and(eq(staffPushSubscriptions.staffId, staffId), sql`${staffPushSubscriptions.endpoint} = ${endpoint}`))
    .limit(1);
  if (existing.length > 0) {
    await db.update(staffPushSubscriptions)
      .set({ p256dh, auth })
      .where(eq(staffPushSubscriptions.id, existing[0].id));
    return existing[0].id;
  }
  const [result] = await db.insert(staffPushSubscriptions).values({ staffId, endpoint, p256dh, auth });
  return result.insertId;
}

export async function getStaffPushSubscriptions(staffId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(staffPushSubscriptions).where(eq(staffPushSubscriptions.staffId, staffId));
}

export async function getStaffPushSubscriptionsByBranch(branchId: number) {
  const db = await getDb();
  if (!db) return [];
  // Get branch_manager/branch_owner of this branch
  const branchStaffList = await db.select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.branchId, branchId), sql`${staff.role} IN ('branch_owner', 'branch_manager')`, eq(staff.isActive, 1)));
  // Also get area_managers assigned to this branch
  const areaManagerAssignments = await db.select({ staffId: staffBranches.staffId })
    .from(staffBranches)
    .innerJoin(staff, eq(staffBranches.staffId, staff.id))
    .where(and(eq(staffBranches.branchId, branchId), eq(staff.role, "area_manager"), eq(staff.isActive, 1)));
  const staffIds = new Set([
    ...branchStaffList.map(s => s.id),
    ...areaManagerAssignments.map(a => a.staffId),
  ]);
  const staffIdArr = Array.from(staffIds);
  if (staffIdArr.length === 0) return [];
  return db.select().from(staffPushSubscriptions)
    .where(sql`${staffPushSubscriptions.staffId} IN (${sql.join(staffIdArr.map(id => sql`${id}`), sql`, `)})`);
}

export async function getAllStaffPushSubscriptions() {
  const db = await getDb();
  if (!db) return [];
  // Get all super_admin subscriptions
  const superAdmins = await db.select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.role, "super_admin"), eq(staff.isActive, 1)));
  if (superAdmins.length === 0) return [];
  return db.select().from(staffPushSubscriptions)
    .where(sql`${staffPushSubscriptions.staffId} IN (${sql.join(superAdmins.map(s => sql`${s.id}`), sql`, `)})`);
}

export async function removeStaffPushSubscriptionByEndpoint(endpoint: string) {
  const db = await getDb();
  if (!db) return;
  await db.delete(staffPushSubscriptions).where(sql`${staffPushSubscriptions.endpoint} = ${endpoint}`);
}

// ── OTP-based password reset helpers ──
export async function deletePasswordResetTokensByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(passwordResetTokens).where(eq(passwordResetTokens.customerId, customerId));
}

export async function getLatestOtpTokenByCustomer(customerId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(passwordResetTokens)
    .where(eq(passwordResetTokens.customerId, customerId))
    .orderBy(desc(passwordResetTokens.createdAt))
    .limit(1);
  return row ?? null;
}

// ===== OAuth Links =====
import { userOauthLinks } from "../drizzle/schema";

export async function getOauthLinkByProviderUser(provider: string, providerUserId: string) {
  const db = (await getDb())!;
  const rows = await db.select().from(userOauthLinks).where(
    and(eq(userOauthLinks.provider, provider as any), eq(userOauthLinks.providerUserId, providerUserId))
  ).limit(1);
  return rows[0] || null;
}

export async function getOauthLinksByUserId(userId: number) {
  const db = (await getDb())!;
  return db.select().from(userOauthLinks).where(eq(userOauthLinks.userId, userId));
}

export async function createOauthLink(data: { userId: number; provider: string; providerUserId: string; email: string | null }) {
  const db = (await getDb())!;
  const [result] = await db.insert(userOauthLinks).values({
    userId: data.userId,
    provider: data.provider as any,
    providerUserId: data.providerUserId,
    email: data.email,
  });
  return result.insertId;
}

export async function deleteOauthLink(id: number, userId: number) {
  const db = (await getDb())!;
  await db.delete(userOauthLinks).where(and(eq(userOauthLinks.id, id), eq(userOauthLinks.userId, userId)));
}
