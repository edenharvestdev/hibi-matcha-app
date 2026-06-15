import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { rateLimit, rateLimitReset } from "./_core/rateLimit";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { nanoid } from "nanoid";
import * as jose from "jose";
import { ENV } from "./_core/env";
import { storagePut } from "./storage";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";
import { sendEmail, buildAutoReplyEmail, buildFollowUpEmail, buildIssueStatusEmail } from "./emailNotification";
import {
  createCustomer, getCustomerByPhone, getCustomerById,
  createStaffMember, getStaffByPhone, getStaffById, getStaffByEmployeeCode, listStaff, updateStaffMember, deleteStaffMember, reactivateStaffMember,
  createBranch, listBranches, getBranchById, updateBranch, deleteBranch,
  createReviewRequest, getReviewRequestById, listReviewRequestsByCustomer, listReviewRequestsByBranch, listReviewRequestsByBranches, listAllReviewRequests, updateReviewRequest, deleteRejectedReviewRequest, checkApprovedReviewExists,
  createCode, getCodeByCode, listCodesByCustomer, listCodesByBranch, listCodesByBranches, listAllCodes, redeemCode as redeemCodeDb, updateCode,
  createAuditLog, listAuditLogs,
  getDashboardStats, getDashboardStatsMultiBranch, getReportData, getReportDataMultiBranch, getAllCodesForExport,
  listAllCustomers, getCustomerStats,
  getOrCreateLoyaltyPoints, addPoints, spendPoints, deductPoints, deductBranchPoints, getPointTransactions, calculatePoints,
  createPointClaim, checkExistingClaim, deletePointClaim, getPointClaimById, listPointClaimsByCustomer, listPointClaims, updatePointClaim,
  createReward, listRewards, getRewardById, updateReward, deleteReward,
  createRewardRedemption, getRedemptionByCode, listRedemptionsByCustomer, updateRedemption,
  getLoyaltyStats, listEarnStoreHistory,
  createOrderIssue, getOrderIssueById, listOrderIssuesByCustomer, listOrderIssues, updateOrderIssue, getOverdueSlaIssues, addOrderIssueImages, getIssueStats,
  createContactInquiry, listContactInquiries, getContactInquiryById, updateContactInquiry,
  updateBranchPhone,
  getStaffBranches, setStaffBranches,
  getStaffPermissions, setStaffPermissions, hasPermission, listStaffWithDetails,
  ALL_PERMISSIONS, DEFAULT_ROLE_PERMISSIONS,
  createFreeDrinkCampaign, listFreeDrinkCampaigns, getFreeDrinkCampaignById, updateFreeDrinkCampaign,
  generateFreeDrinkCode, createFreeDrinkCode, getFreeDrinkCodeByCode, listFreeDrinkCodesByCustomer,
  listFreeDrinkCodesByCampaign, countFreeDrinkCodesByCustomerCampaign, redeemFreeDrinkCode,
  getOrCreateBranchLoyalty, addBranchPoints, spendBranchPoints, listBranchLoyaltyByCustomer,
  createCustomerConsent, getCustomerConsents, hasAcceptedConsent,
  checkBookingIdApproved, checkBookingIdPending,
  checkShopeeOrderIdApproved, checkShopeeOrderIdPending,
  checkLinemanOrderIdApproved, checkLinemanOrderIdPending,
  createAnnouncement, listAnnouncements, getAnnouncementById, updateAnnouncement, deleteAnnouncement,
  markAnnouncementRead, markAllAnnouncementsRead, getUnreadAnnouncementCount,
  createReviewMenuItem, listReviewMenuItems, getReviewMenuItemById, getReviewMenuItemByCode, updateReviewMenuItem, deleteReviewMenuItem,
  updateFreeDrinkCodeMenuSelection, staffRedeemFreeDrinkCode,
  getBranchMenuAvailability, setBranchMenuAvailability, listActiveMenuItemsForBranch,
  getSiteContent, listSiteContent, upsertSiteContent,
  createStaffNotification, listStaffNotifications, countUnreadNotifications, markNotificationRead, markAllNotificationsRead, notifyBranchStaff,
  getPendingCodesDashboard,
  getCodeById, updateCodeMenuSelection, resetCodeMenuSelection, autoSelectCLCodeMenu,
  createOptionGroup, listOptionGroups, getOptionGroupById, updateOptionGroup, deleteOptionGroup,
  createOptionItem, listOptionItemsByGroup, listAllOptionItems, updateOptionItem, deleteOptionItem,
  listActiveOptionGroupsWithItems,
  setMenuOptionGroups, getMenuOptionGroupIds, getOptionGroupsForMenu,
  createPasswordResetRequest, listPendingPasswordResetRequests, listAllPasswordResetRequests,
  getPasswordResetRequestById, updatePasswordResetRequestStatus,
  createPasswordResetToken, getPasswordResetTokenByToken, markPasswordResetTokenUsed,
  getCustomerByEmail, updateCustomerPassword,
  deletePasswordResetTokensByCustomer, deleteOtpTokensByCustomer, getLatestOtpTokenByCustomer,
  listCustomers, countCustomers,
  getPettyCashSettings, upsertPettyCashSettings,
  getPettyCashBalance, listPettyCashTransactions, countPettyCashTransactions,
  createPettyCashTransaction, getPettyCashSummary, getPettyCashPeriodSummary,
  createFundRequest, listFundRequests, listAllFundRequests, updateFundRequestStatus, getFundRequestById,
  listRewardCategories, listActiveRewardCategories, createRewardCategory, updateRewardCategory, deleteRewardCategory,
  listShopCategories, getShopCategoryById, createShopCategory, updateShopCategory, deleteShopCategory,
  listShopProducts, getShopProductById, createShopProduct, updateShopProduct, deleteShopProduct,
  getCartItems, addToCart, updateCartItemQuantity, removeCartItem, clearCart,
  createShopOrder, createShopOrderItems, getShopOrderById, getShopOrderByNumber, getShopOrderItems, listShopOrders, updateShopOrder,
  getCommissionSettings, listAllCommissionSettings, upsertCommissionSettings, getCommissionReport,
  decrementStock, getCustomerPrimaryBranchId, generateShopOrderNumber,
  createDailySalesRecord, getDailySalesRecordById, getDailySalesRecordByDate,
  updateDailySalesRecord, listDailySalesRecords, countDailySalesRecords,
  getMonthlySalesSummary, getAllBranchesMonthlySummary,
  createDailySalesExtraChannels, getExtraChannelsBySalesRecordId, deleteExtraChannelsBySalesRecordId,
  listServiceZones, getServiceZoneById, createServiceZone, updateServiceZone,
  listBranchesByZone, updateBranchZone, listBranchesWithZone,
  getMultiBranchPettyCashBalances, getMultiBranchDailySalesToday,
  getMultiBranchOrderIssuesCounts, listOrderIssuesByBranchIds,
  getMultiBranchPendingReviewsCounts,
  savePushSubscription, removePushSubscription, getAllPushSubscriptions, removePushSubscriptionByEndpoint,
  listAnnouncementsByCategory,
  getCodeStatsByBranch, getPointsStatsByBranch, getTopCustomersByBranch, getTopCodeRedeemers,
  getRewardRedemptionsByBranch,
  getAnnouncementReadStats, getAnnouncementReaders,
  listAnnouncementsForBranch,
  listAnnouncementTemplates, getAnnouncementTemplateById, createAnnouncementTemplate, updateAnnouncementTemplate, deleteAnnouncementTemplate,
  listSalesCategories, listAllSalesCategories, createSalesCategory, updateSalesCategory, deleteSalesCategory, getSalesCategoryById,
  createDailySalesItems, getDailySalesItemsByRecordId, deleteDailySalesItemsByRecordId,
  getMonthlySalesByCategory, getStaffCommission,
  getDateRangeSalesSummary, getDateRangeSalesByCategory, getDailySalesRecordsByRange,
  createDailySalesAuditLog, getDailySalesAuditLogs, getDailySalesAuditLogsByBranch,
  listFranchiseOwners, getFranchiseOwnerById, createFranchiseOwner, updateFranchiseOwner,
  getBranchesByFranchiseOwner, assignBranchToFranchiseOwner,
  createInStoreSale, listInStoreSales, getInStoreSaleById, getInStoreSaleStaff,
  upsertCommissionRecord, getMonthlyCommissionReport, updateCommissionStatus,
  getInStoreSalesSummary, calculateCommission,
  // POS System imports
  posListCategories, posCreateCategory, posUpdateCategory, posDeleteCategory,
  posListMenuItems, posGetMenuItem, posCreateMenuItem, posUpdateMenuItem, posDeleteMenuItem,
  posGetBranchMenuItems, posUpsertBranchMenuItem,
  posListOptionGroups, posListOptionGroupsWithOptions, posCreateOptionGroup, posUpdateOptionGroup, posDeleteOptionGroup,
  posListOptions, posCreateOption, posUpdateOption, posDeleteOption,
  posGetMenuItemOptionGroups, posSetMenuItemOptionGroups, posListAllMenuItemOptionGroupMappings,
  posListRetailProducts, posCreateRetailProduct, posUpdateRetailProduct, posDeleteRetailProduct,
  posGetBranchRetailStock, posUpsertBranchRetailStock,
  posListPaymentMethods, posCreatePaymentMethod, posUpdatePaymentMethod,
  posListDiscounts, posCreateDiscount, posUpdateDiscount, posDeleteDiscount,
  posCreateOrder, posGetOrder, posUpdateOrder, posListOrders, posGetNextOrderNumber,
  posCreateOrderItem, posGetOrderItems, posCreateOrderItemOptions, posGetOrderItemOptions,
  posCreateOrderPayment, posGetOrderPayments,
  posCreateKitchenTicket, posListKitchenTickets, posUpdateKitchenTicketStatus,
  posGetDailySalesReport, posGetSalesByPaymentMethod, posGetSalesByCategory,
  posGetStaffPinsByBranch, posVerifyStaffPin, posCreateStaffPin, posUpdateStaffPin, posDeleteStaffPin,
  posAutoSetupBranch, posGetBranchMenuCatalog, posSelectBranchMenuItems, posDeselectBranchMenuItems,
  upsertStaffPushSubscription, getStaffPushSubscriptionsByBranch, removeStaffPushSubscriptionByEndpoint,
  createReceiptImage, listReceiptImages, listReceiptImagesByBranch, updateReceiptImageOcr,
  getOauthLinkByProviderUser, getOauthLinksByUserId, createOauthLink, deleteOauthLink,
} from "./db";
import { exchangeOAuthCode, type OAuthProvider } from "./lib/oauth";

const HIBI_SESSION_COOKIE = "hibi_session";

// Send push notification to branch staff (branch_manager, branch_owner, area_manager)
async function sendPushToBranch(branchId: number, title: string, body: string, url: string): Promise<number> {
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) return 0;
  try {
    webpush.setVapidDetails("mailto:admin@hibimatcha.love", ENV.vapidPublicKey, ENV.vapidPrivateKey);
  } catch { return 0; }
  const subs = await getStaffPushSubscriptionsByBranch(branchId);
  let sent = 0;
  const payload = JSON.stringify({ title: `Hibi Matcha • แจ้งเตือน`, body, data: { url } });
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (err: any) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await removeStaffPushSubscriptionByEndpoint(sub.endpoint).catch(() => {});
      }
    }
  }
  return sent;
}

// ── Code Generation (Full Spec format) ── guaranteed unique ──
async function generateUniqueCode(type: "RV" | "CL"): Promise<string> {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const prefix = type === "RV" ? "HIBI-RV-" : "HIBI-CL-";
  const MAX_ATTEMPTS = 10;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    let code = prefix;
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Check if code already exists in DB
    const existing = await getCodeByCode(code);
    if (!existing) return code;
  }
  // Extremely unlikely fallback: use longer code (8 chars)
  let fallbackCode = prefix;
  for (let i = 0; i < 8; i++) {
    fallbackCode += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return fallbackCode;
}

// ── JWT Session ──
async function createSessionToken(payload: { type: string; id: number; role: string }) {
  const secret = new TextEncoder().encode(ENV.cookieSecret);
  return new jose.SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(secret);
}

async function verifySessionToken(token: string) {
  try {
    const secret = new TextEncoder().encode(ENV.cookieSecret);
    const { payload } = await jose.jwtVerify(token, secret);
    return payload as { type: string; id: number; role: string };
  } catch {
    return null;
  }
}

// ── Middleware ──
const hibiSessionMiddleware = async (opts: any) => {
  const { ctx, next } = opts;
  const cookieHeader = ctx.req.headers.cookie || "";
  const cookies = Object.fromEntries(
    cookieHeader.split(";").map((c: string) => {
      const [k, ...v] = c.trim().split("=");
      return [k, v.join("=")];
    })
  );
  const token = cookies[HIBI_SESSION_COOKIE];
  let session = null;
  if (token) {
    session = await verifySessionToken(token);
  }

  // Refresh role from DB so role changes take effect without re-login
  if (session && session.type === "staff") {
    const freshStaff = await getStaffById(session.id);
    if (freshStaff && freshStaff.isActive) {
      session = { ...session, role: freshStaff.role };
    } else if (freshStaff && !freshStaff.isActive) {
      session = null; // Staff deactivated, invalidate session
    }
  }

  // Impersonate: super_admin can switch to any staff or customer via header
  if (session && session.role === "super_admin") {
    const impersonateStaffId = ctx.req.headers["x-impersonate-staff-id"];
    const impersonateCustomerId = ctx.req.headers["x-impersonate-customer-id"];
    if (impersonateStaffId) {
      const targetStaffId = parseInt(String(impersonateStaffId), 10);
      if (!isNaN(targetStaffId) && targetStaffId > 0) {
        const targetStaff = await getStaffById(targetStaffId);
        if (targetStaff && targetStaff.isActive) {
          session = {
            type: "staff",
            id: targetStaff.id,
            role: targetStaff.role,
            impersonating: { originalId: session.id, originalRole: session.role },
          };
        }
      }
    } else if (impersonateCustomerId) {
      const targetCustId = parseInt(String(impersonateCustomerId), 10);
      if (!isNaN(targetCustId) && targetCustId > 0) {
        const targetCustomer = await getCustomerById(targetCustId);
        if (targetCustomer) {
          session = {
            type: "customer",
            id: targetCustomer.id,
            role: "customer",
            impersonating: { originalId: session.id, originalRole: session.role },
          };
        }
      }
    }
  }

  return next({ ctx: { ...ctx, hibiSession: session } });
};

const hibiProcedure = publicProcedure.use(hibiSessionMiddleware);

const hibiProtectedProcedure = hibiProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.hibiSession) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "กรุณาเข้าสู่ระบบ" });
  }
  return next({ ctx });
});

// Any staff member (branch_owner, branch_manager, branch_staff, area_manager, support_staff, super_admin)
const staffProcedure = hibiProtectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  const staffRoles = ["branch_manager", "branch_owner", "branch_staff", "area_manager", "support_staff", "super_admin"];
  if (!staffRoles.includes(ctx.hibiSession!.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึง (เจ้าหน้าที่เท่านั้น)" });
  }
  return next({ ctx });
});

// Branch admin, area manager, branch staff, or super admin
const branchAdminProcedure = hibiProtectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  const allowedRoles = ["branch_owner", "branch_manager", "branch_staff", "area_manager", "super_admin"];
  if (!allowedRoles.includes(ctx.hibiSession!.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึง" });
  }
  return next({ ctx });
});

const superAdminProcedure = hibiProtectedProcedure.use(async (opts) => {
  const { ctx, next } = opts;
  if (ctx.hibiSession!.role !== "super_admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึง (Super Admin เท่านั้น)" });
  }
  return next({ ctx });
});

// Permission-based procedure factory
function requirePermission(permission: string) {
  return staffProcedure.use(async (opts) => {
    const { ctx, next } = opts;
    // Super admin always has all permissions
    if (ctx.hibiSession!.role === "super_admin") return next({ ctx });
    // Area manager has all permissions for their managed branches
    if (ctx.hibiSession!.role === "area_manager") return next({ ctx });
    // Branch owner has all permissions for their branch
    if (ctx.hibiSession!.role === "branch_owner") return next({ ctx });
    // Branch manager has manage_accounting permission by default
    if (ctx.hibiSession!.role === "branch_manager" && permission === "manage_accounting") return next({ ctx });
    const hasPerm = await hasPermission(ctx.hibiSession!.id, permission);
    if (!hasPerm) {
      throw new TRPCError({ code: "FORBIDDEN", message: `ไม่มีสิทธิ์: ${permission}` });
    }
    return next({ ctx });
  });
}

/**
 * Helper: resolve effective branchId for area_manager.
 * area_manager can pass branchId to access any of their managed branches.
 * Other roles use their own branchId from staff record.
 */
async function getEffectiveBranchId(session: { id: number; role: string }, inputBranchId?: number | null): Promise<number | null> {
  // super_admin can access any branch
  if (session.role === "super_admin" && inputBranchId) {
    return inputBranchId;
  }
  if (session.role === "super_admin") {
    // No branchId specified - return first active branch or null
    const allBranches = await listBranches(true);
    return allBranches.length > 0 ? allBranches[0].id : null;
  }
  if (session.role === "area_manager" && inputBranchId) {
    // Verify area_manager has access to this branch
    const assignedBranches = await getStaffBranches(session.id);
    const branchIds = assignedBranches.map(b => b.branchId);
    if (!branchIds.includes(inputBranchId)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "คุณไม่มีสิทธิ์เข้าถึงสาขานี้" });
    }
    return inputBranchId;
  }
  if (session.role === "area_manager") {
    // No branchId specified - return first managed branch or null
    const assignedBranches = await getStaffBranches(session.id);
    return assignedBranches.length > 0 ? assignedBranches[0].branchId : null;
  }
  // For other roles, use their own branchId
  const staffMember = await getStaffById(session.id);
  return staffMember?.branchId ?? null;
}

// ── Web Push Notification Helper ──
import webpush from "web-push";

const TYPE_LABELS: Record<string, string> = {
  announcement: "ประกาศ",
  promotion: "โปรโมชัน",
  event: "อีเวนท์",
};

async function sendPushToAll(title: string, body: string, type: string): Promise<number> {
  if (!ENV.vapidPublicKey || !ENV.vapidPrivateKey) return 0;
  try {
    webpush.setVapidDetails(
      "mailto:admin@hibimatcha.love",
      ENV.vapidPublicKey,
      ENV.vapidPrivateKey,
    );
  } catch {
    return 0;
  }
  const subs = await getAllPushSubscriptions();
  let sent = 0;
  const payload = JSON.stringify({
    title: `Hibi Matcha • ${TYPE_LABELS[type] || "ประกาศ"}`,
    body: title,
    data: { url: "/customer/announcements" },
  });
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload,
      );
      sent++;
    } catch (err: any) {
      // Remove invalid subscriptions (410 Gone or 404)
      if (err.statusCode === 410 || err.statusCode === 404) {
        await removePushSubscriptionByEndpoint(sub.endpoint).catch(() => {});
      }
    }
  }
  return sent;
}

// ── Scheduled Announcement Checker (runs every 60 seconds) ──
setInterval(async () => {
  try {
    const { listScheduledAnnouncementsToPublish } = await import("./db");
    let scheduled: any[] = [];
    // Retry up to 3 times on connection errors
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        scheduled = await listScheduledAnnouncementsToPublish();
        break;
      } catch (retryErr: any) {
        if (attempt < 2 && (retryErr?.message?.includes('ECONNRESET') || retryErr?.message?.includes('ETIMEDOUT'))) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw retryErr;
      }
    }
    for (const ann of scheduled) {
      // Send push notification
      await sendPushToAll(ann.title, ann.content, ann.type);
      // Mark as sent so it won't be picked up again, and set startDate to now
      const { updateAnnouncement } = await import("./db");
      await updateAnnouncement(ann.id, { startDate: new Date(), scheduledPushSentAt: new Date() });
    }
  } catch (e) {
    console.error("[ScheduledAnnouncements] Error:", e);
  }
}, 60_000);

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ── Hibi Auth (Phone + Password) ──
  hibiAuth: router({
    register: publicProcedure.input(z.object({
      phone: z.string().min(9).max(15),
      password: z.string().min(6),
      name: z.string().min(1),
      email: z.string().email(),
      address: z.string().optional(),
      province: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      // Normalize phone: strip non-digit characters, handle +66 prefix
      let cleanPhone = input.phone.replace(/\D/g, "");
      // Convert +66 prefix to 0 prefix for Thai numbers
      if (cleanPhone.startsWith("66") && cleanPhone.length >= 11) {
        cleanPhone = "0" + cleanPhone.slice(2);
      }
      if (cleanPhone.length < 9 || cleanPhone.length > 15) throw new TRPCError({ code: "BAD_REQUEST", message: "เบอร์โทรต้องมี 9-15 หลัก" });
      const existing = await getCustomerByPhone(cleanPhone);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "❌ เบอร์โทรนี้ถูกใช้งานแล้ว — หากเป็นบัญชีของคุณ กรุณาเข้าสู่ระบบแทน" });

      // Check email duplicate
      if (input.email) {
        const existingEmail = await getCustomerByEmail(input.email.toLowerCase().trim());
      if (existingEmail) throw new TRPCError({ code: "CONFLICT", message: "❌ อีเมลนี้ถูกใช้งานแล้ว — หากเป็นบัญชีของคุณ กรุณาเข้าสู่ระบบแทน" });
      }
      const passwordHash = await bcrypt.hash(input.password, 12);
      const id = await createCustomer({
        phone: cleanPhone, passwordHash, name: input.name, email: (input.email || '').toLowerCase().trim(),
        address: input.address || null, province: input.province || null,
      });
      await createAuditLog({ actorType: "customer", actorId: id, actorName: input.name, action: "register", entity: "customer", entityId: id, details: `ลูกค้าลงทะเบียน: ${cleanPhone}`, afterData: { phone: cleanPhone, name: input.name, email: input.email } });
      const token = await createSessionToken({ type: "customer", id, role: "customer" });
      ctx.res.cookie(HIBI_SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
      return { success: true, role: "customer" as const };
    }),

    login: publicProcedure.input(z.object({
      phone: z.string(),
      password: z.string(),
    })).mutation(async ({ input, ctx }) => {
      // Normalize phone: strip non-digit characters, handle +66 prefix
      let cleanPhone = input.phone.replace(/\D/g, "");
      if (cleanPhone.startsWith("66") && cleanPhone.length >= 11) {
        cleanPhone = "0" + cleanPhone.slice(2);
      }

      // Brute-force protection: 10 attempts per phone per 15 min
      const rlKey = `login:${cleanPhone}`;
      const rl = rateLimit(rlKey, 10, 15 * 60 * 1000);
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `ลองเข้าสู่ระบบผิดเกินกำหนด — กรุณารอ ${Math.ceil(rl.resetSec / 60)} นาที แล้วลองใหม่`,
        });
      }

      const customer = await getCustomerByPhone(cleanPhone);
      if (customer) {
        const valid = await bcrypt.compare(input.password, customer.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "รหัสผ่านไม่ถูกต้อง" });
        rateLimitReset(rlKey); // success — clear bucket
        const token = await createSessionToken({ type: "customer", id: customer.id, role: "customer" });
        ctx.res.cookie(HIBI_SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
        return { success: true, role: "customer" as const, name: customer.name };
      }
      const staffMember = await getStaffByPhone(cleanPhone);
      if (staffMember) {
        if (!staffMember.isActive) throw new TRPCError({ code: "FORBIDDEN", message: "บัญชีนี้ถูกระงับ" });
        const valid = await bcrypt.compare(input.password, staffMember.passwordHash);
        if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "รหัสผ่านไม่ถูกต้อง" });
        rateLimitReset(rlKey); // success — clear bucket
        const token = await createSessionToken({ type: "staff", id: staffMember.id, role: staffMember.role });
        ctx.res.cookie(HIBI_SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
        return { success: true, role: staffMember.role as "branch_manager" | "branch_owner" | "branch_staff" | "area_manager" | "support_staff" | "super_admin", name: staffMember.name };
      }
      throw new TRPCError({ code: "UNAUTHORIZED", message: "ไม่พบบัญชีนี้ในระบบ" });
    }),

    // Staff-only login with employee code
    staffLogin: publicProcedure.input(z.object({
      employeeCode: z.string().min(1),
      password: z.string(),
    })).mutation(async ({ input, ctx }) => {
      // Brute-force protection: 10 attempts per employee code per 15 min
      const rlKey = `stafflogin:${input.employeeCode.trim().toUpperCase()}`;
      const rl = rateLimit(rlKey, 10, 15 * 60 * 1000);
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `ลองเข้าสู่ระบบผิดเกินกำหนด — กรุณารอ ${Math.ceil(rl.resetSec / 60)} นาที แล้วลองใหม่`,
        });
      }
      const staffMember = await getStaffByEmployeeCode(input.employeeCode);
      if (!staffMember) throw new TRPCError({ code: "UNAUTHORIZED", message: "\u0e44\u0e21\u0e48\u0e1e\u0e1a\u0e23\u0e2b\u0e31\u0e2a\u0e1e\u0e19\u0e31\u0e01\u0e07\u0e32\u0e19\u0e19\u0e35\u0e49\u0e43\u0e19\u0e23\u0e30\u0e1a\u0e1a" });
      if (!staffMember.isActive) throw new TRPCError({ code: "FORBIDDEN", message: "\u0e1a\u0e31\u0e0d\u0e0a\u0e35\u0e19\u0e35\u0e49\u0e16\u0e39\u0e01\u0e23\u0e30\u0e07\u0e31\u0e1a" });
      const valid = await bcrypt.compare(input.password, staffMember.passwordHash);
      if (!valid) throw new TRPCError({ code: "UNAUTHORIZED", message: "\u0e23\u0e2b\u0e31\u0e2a\u0e1c\u0e48\u0e32\u0e19\u0e44\u0e21\u0e48\u0e16\u0e39\u0e01\u0e15\u0e49\u0e2d\u0e07" });
      rateLimitReset(rlKey); // success — clear bucket
      const token = await createSessionToken({ type: "staff", id: staffMember.id, role: staffMember.role });
      ctx.res.cookie(HIBI_SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
      return { success: true, role: staffMember.role as "branch_manager" | "branch_owner" | "branch_staff" | "area_manager" | "support_staff" | "super_admin", name: staffMember.name };
    }),

    me: hibiProcedure.query(async ({ ctx }) => {
      if (!ctx.hibiSession) return null;
      const { type, id } = ctx.hibiSession;
      if (type === "customer") {
        const customer = await getCustomerById(id);
        if (!customer) return null;
        return { type: "customer" as const, id: customer.id, phone: customer.phone, name: customer.name, email: customer.email, role: "customer" as const, branchId: null, branchName: null };
      } else {
        const staffMember = await getStaffById(id);
        if (!staffMember || !staffMember.isActive) return null;
        let branchName = null;
        if (staffMember.branchId) {
          const branch = await getBranchById(staffMember.branchId);
          branchName = branch?.name ?? null;
        }
        const perms = await getStaffPermissions(staffMember.id);
        // For area_manager, include managed branches
        let managedBranchIds: number[] | undefined;
        let managedBranches: { id: number; name: string }[] | undefined;
        if (staffMember.role === "area_manager") {
          const assignedBranches = await getStaffBranches(staffMember.id);
          managedBranchIds = assignedBranches.map(b => b.branchId);
          const branchDetails = await Promise.all(managedBranchIds.map(async (bid) => {
            const br = await getBranchById(bid);
            return br ? { id: br.id, name: br.name } : null;
          }));
          managedBranches = branchDetails.filter(Boolean) as { id: number; name: string }[];
        }
        return { type: "staff" as const, id: staffMember.id, phone: staffMember.phone, name: staffMember.name, email: staffMember.email, employeeCode: staffMember.employeeCode, role: staffMember.role as "branch_manager" | "branch_owner" | "branch_staff" | "area_manager" | "support_staff" | "super_admin", branchId: staffMember.branchId, branchName, permissions: staffMember.role === "super_admin" ? [...ALL_PERMISSIONS] : perms, managedBranchIds, managedBranches };
      }
    }),

    logout: hibiProcedure.mutation(({ ctx }) => {
      ctx.res.clearCookie(HIBI_SESSION_COOKIE, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: -1 });
      return { success: true };
    }),
    }),
  // ── OAuth Social Login ──
  oauth: router({
    handleCallback: publicProcedure.input(z.object({
      provider: z.enum(["google", "facebook", "line"]),
      code: z.string(),
      redirectUri: z.string(),
    })).mutation(async ({ input, ctx }) => {
      const userInfo = await exchangeOAuthCode(input.provider, input.code, input.redirectUri);
      // Check if this provider account is already linked
      const existing = await getOauthLinkByProviderUser(input.provider, userInfo.providerUserId);
      if (existing) {
        // Already linked - log them in
        const customer = await getCustomerById(existing.userId);
        if (!customer) throw new TRPCError({ code: "FORBIDDEN", message: "บัญชีถูกระงับ" });
        const token = await createSessionToken({ type: "customer", id: customer.id, role: "customer" });
        ctx.res.cookie(HIBI_SESSION_COOKIE, token, { httpOnly: true, secure: true, sameSite: "none", path: "/", maxAge: 7 * 24 * 60 * 60 * 1000 });
        return { status: "logged_in" as const, name: customer.name, role: "customer" };
      }
      // Not linked - return info for frontend to prompt linking
      return {
        status: "not_linked" as const,
        provider: input.provider,
        providerUserId: userInfo.providerUserId,
        email: userInfo.email,
        displayName: userInfo.displayName,
      };
    }),
    linkAccount: protectedProcedure.input(z.object({
      provider: z.enum(["google", "facebook", "line"]),
      providerUserId: z.string(),
      email: z.string().nullable(),
      displayName: z.string().nullable(),
    })).mutation(async ({ ctx, input }) => {
      const userId = (ctx as any).hibiUserId || ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      // Check if already linked to another account
      const existing = await getOauthLinkByProviderUser(input.provider, input.providerUserId);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "บัญชีนี้เชื่อมต่อกับผู้ใช้อื่นแล้ว" });
      await createOauthLink({ userId, provider: input.provider, providerUserId: input.providerUserId, email: input.email });
      return { success: true };
    }),
    unlinkAccount: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      const userId = (ctx as any).hibiUserId || ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      await deleteOauthLink(input.id, userId);
      return { success: true };
    }),
    listLinked: protectedProcedure.query(async ({ ctx }) => {
      const userId = (ctx as any).hibiUserId || ctx.user?.id;
      if (!userId) throw new TRPCError({ code: "UNAUTHORIZED" });
      return getOauthLinksByUserId(userId);
    }),
  }),
  // ── Branches ──
  branches: router({
    list: publicProcedure.query(async () => listBranches(true)),
    listAll: superAdminProcedure.query(async () => {
      const data = await listBranchesWithZone();
      return data.map(d => ({ ...d.branch, zoneName: d.zoneName }));
    }),
    create: superAdminProcedure.input(z.object({
      name: z.string().min(1),
      province: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().optional(),
      franchiseOwnerId: z.number().nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await createBranch({ name: input.name, province: input.province || null, address: input.address || null, phone: input.phone || null, franchiseOwnerId: input.franchiseOwnerId ?? null } as any);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_branch", entity: "branch", entityId: id, details: `สร้างสาขา: ${input.name}`, afterData: input });
      // Auto-setup POS for new branch (copy menu items, retail products, create default PIN)
      try {
        await posAutoSetupBranch(id);
      } catch (e) {
        console.error("[POS Auto-Setup] Error setting up POS for branch", id, e);
      }
      return { id };
    }),
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      province: z.string().optional(),
      address: z.string().optional(),
      phone: z.string().nullable().optional(),
      isActive: z.number().optional(),
      franchiseOwnerId: z.number().nullable().optional(),
      commissionMode: z.enum(["product", "staff"]).optional(),
      allowManagerEditCommission: z.number().min(0).max(1).optional(),
    })).mutation(async ({ input, ctx }) => {
      const before = await getBranchById(input.id);
      const { id, ...data } = input;
      await updateBranch(id, data as any);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_branch", entity: "branch", entityId: id, details: `อัปเดตสาขา ID: ${id}`, beforeData: before, afterData: data });
      return { success: true };
    }),
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const before = await getBranchById(input.id);
      await deleteBranch(input.id);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "delete_branch", entity: "branch", entityId: input.id, details: `ปิดใช้งานสาขา ID: ${input.id}`, beforeData: before, afterData: { isActive: 0 } });
      return { success: true };
    }),
  }),

  // ── Staff Management ──
  staff: router({
    list: superAdminProcedure.input(z.object({ branchId: z.number().optional() }).optional()).query(async ({ input }) => {
      return listStaffWithDetails(input?.branchId);
    }),
    create: superAdminProcedure.input(z.object({
      phone: z.string().min(9).max(15),
      password: z.string().min(6),
      name: z.string().min(1),
      email: z.string().email().optional(),
      employeeCode: z.string().min(3).max(20).optional(),
      role: z.enum(["branch_manager", "branch_owner", "branch_staff", "area_manager", "support_staff", "super_admin"]),
      branchId: z.number().optional(),
      assignedBranchIds: z.array(z.number()).optional(),
      permissions: z.array(z.string()).optional(),
      commissionType: z.enum(["percent", "fixed"]).optional(),
      commissionValue: z.number().min(0).optional(),
    })).mutation(async ({ input, ctx }) => {
      // Normalize phone: strip non-digit characters
      const cleanPhone = input.phone.replace(/\D/g, "");
      // Check employee code uniqueness
      if (input.employeeCode) {
        const existingCode = await getStaffByEmployeeCode(input.employeeCode);
        if (existingCode) throw new TRPCError({ code: "CONFLICT", message: "รหัสพนักงานนี้ถูกใช้แล้ว" });
      }
      const existing = await getStaffByPhone(cleanPhone);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "เบอร์โทรนี้ถูกใช้งานแล้ว" });
      const existingCustomer = await getCustomerByPhone(cleanPhone);
      if (existingCustomer) throw new TRPCError({ code: "CONFLICT", message: "เบอร์โทรนี้ถูกใช้งานเป็นลูกค้าแล้ว" });
      const passwordHash = await bcrypt.hash(input.password, 12);
      const id = await createStaffMember({
        phone: cleanPhone, passwordHash, name: input.name,
        email: input.email || null, employeeCode: input.employeeCode || null, role: input.role, branchId: input.branchId || null,
        commissionType: input.commissionType || null, commissionValue: input.commissionValue ?? 0,
      });
      // Set permissions (use defaults if not provided)
      const perms = input.permissions || DEFAULT_ROLE_PERMISSIONS[input.role] || [];
      await setStaffPermissions(id, perms);
      // Set assigned branches for area_manager
      if (input.assignedBranchIds && input.assignedBranchIds.length > 0) {
        await setStaffBranches(id, input.assignedBranchIds);
      }
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_staff", entity: "staff", entityId: id, details: `สร้างพนักงาน: ${input.name} (${input.role})`, afterData: { phone: cleanPhone, name: input.name, role: input.role, branchId: input.branchId, permissions: perms } });
      return { id };
    }),
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      employeeCode: z.string().min(3).max(20).nullable().optional(),
      role: z.enum(["branch_manager", "branch_owner", "branch_staff", "area_manager", "support_staff", "super_admin"]).optional(),
      branchId: z.number().nullable().optional(),
      password: z.string().min(6).optional(),
      assignedBranchIds: z.array(z.number()).optional(),
      permissions: z.array(z.string()).optional(),
      commissionType: z.enum(["percent", "fixed"]).optional(),
      commissionValue: z.number().min(0).optional(),
    })).mutation(async ({ input, ctx }) => {
      // Check employee code uniqueness on update
      if (input.employeeCode) {
        const existingCode = await getStaffByEmployeeCode(input.employeeCode);
        if (existingCode && existingCode.id !== input.id) throw new TRPCError({ code: "CONFLICT", message: "รหัสพนักงานนี้ถูกใช้แล้ว" });
      }
      const before = await getStaffById(input.id);
      const { id, password, assignedBranchIds, permissions, ...data } = input;
      const updateData: any = { ...data };
      if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
      await updateStaffMember(id, updateData);
      // Update permissions if provided
      if (permissions !== undefined) {
        await setStaffPermissions(id, permissions);
      }
      // Update assigned branches if provided
      if (assignedBranchIds !== undefined) {
        await setStaffBranches(id, assignedBranchIds);
      }
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_staff", entity: "staff", entityId: id, details: `อัปเดตพนักงาน ID: ${id}`, beforeData: before ? { name: before.name, role: before.role, branchId: before.branchId } : null, afterData: { ...data, permissions, assignedBranchIds } });
      return { success: true };
    }),
    getPermissions: superAdminProcedure.input(z.object({ staffId: z.number() })).query(async ({ input }) => {
      const permissions = await getStaffPermissions(input.staffId);
      const branches = await getStaffBranches(input.staffId);
      return { permissions, assignedBranchIds: branches.map(b => b.branchId) };
    }),
    allPermissions: superAdminProcedure.query(() => {
      return { permissions: ALL_PERMISSIONS, defaultRolePermissions: DEFAULT_ROLE_PERMISSIONS };
    }),
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const before = await getStaffById(input.id);
      await deleteStaffMember(input.id);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "delete_staff", entity: "staff", entityId: input.id, details: `ปิดใช้งานพนักงาน ID: ${input.id}`, beforeData: before ? { isActive: before.isActive } : null, afterData: { isActive: 0 } });
      return { success: true };
    }),
  }),

  // ── Branch Staff Management (for Branch Owner) ──
  branchStaff: router({
    list: branchAdminProcedure.input(z.object({
      branchId: z.number().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input?.branchId);
      if (!effectiveBranchId) return [];
      const allStaff = await listStaffWithDetails(effectiveBranchId);
      // Filter: only show staff in same branch, exclude self and super_admin
      return allStaff.filter(s => s.id !== session.id && s.role !== "super_admin");
    }),
    create: branchAdminProcedure.input(z.object({
      phone: z.string().min(9).max(15),
      password: z.string().min(6),
      name: z.string().min(1),
      email: z.string().email().optional(),
      employeeCode: z.string().min(3).max(20).optional(),
      role: z.enum(["branch_manager", "branch_staff"]),
      permissions: z.array(z.string()).optional(),
      branchId: z.number().optional(), // area_manager can specify branch
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      // Only branch_owner, area_manager, or super_admin can create staff
      if (session.role !== "branch_owner" && session.role !== "super_admin" && session.role !== "area_manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะเจ้าของสาขาหรือเจ้าของแฟรนไชส์เท่านั้นที่สามารถเพิ่มพนักงาน" });
      }
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "คุณยังไม่ได้ผูกกับสาขาใด" });
      // Normalize phone: strip non-digit characters
      const cleanPhone = input.phone.replace(/\D/g, "");
      // Check uniqueness
      if (input.employeeCode) {
        const existingCode = await getStaffByEmployeeCode(input.employeeCode);
        if (existingCode) throw new TRPCError({ code: "CONFLICT", message: "รหัสพนักงานนี้ถูกใช้แล้ว" });
      }
      const existing = await getStaffByPhone(cleanPhone);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "เบอร์โทรนี้ถูกใช้งานแล้ว" });
      const existingCustomer = await getCustomerByPhone(cleanPhone);
      if (existingCustomer) throw new TRPCError({ code: "CONFLICT", message: "เบอร์โทรนี้ถูกใช้งานเป็นลูกค้าแล้ว" });
      const passwordHash = await bcrypt.hash(input.password, 12);
      const id = await createStaffMember({
        phone: cleanPhone, passwordHash, name: input.name,
        email: input.email || null, employeeCode: input.employeeCode || null,
        role: input.role, branchId: effectiveBranchId,
      });
      const perms = input.permissions || DEFAULT_ROLE_PERMISSIONS[input.role] || [];
      await setStaffPermissions(id, perms);
      await createAuditLog({ actorType: "staff", actorId: session.id, actorName: null, action: "create_staff", entity: "staff", entityId: id, details: `สร้างพนักงาน: ${input.name} (${input.role})`, afterData: { phone: cleanPhone, name: input.name, role: input.role, branchId: effectiveBranchId, permissions: perms } });
      return { id };
    }),
    update: branchAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      employeeCode: z.string().min(3).max(20).nullable().optional(),
      role: z.enum(["branch_manager", "branch_staff"]).optional(),
      password: z.string().min(6).optional(),
      permissions: z.array(z.string()).optional(),
      branchId: z.number().optional(), // area_manager can specify branch
      commissionType: z.enum(["percent", "fixed"]).optional(),
      commissionValue: z.number().min(0).optional(),
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      if (session.role !== "branch_owner" && session.role !== "super_admin" && session.role !== "area_manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะเจ้าของสาขาหรือเจ้าของแฟรนไชส์เท่านั้นที่สามารถแก้ไขพนักงาน" });
      }
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "คุณยังไม่ได้ผูกกับสาขาใด" });
      // Verify target staff is in same branch
      const target = await getStaffById(input.id);
      if (!target || target.branchId !== effectiveBranchId) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบพนักงานในสาขาของคุณ" });
      if (target.role === "super_admin" || target.role === "branch_owner") throw new TRPCError({ code: "FORBIDDEN", message: "ไม่สามารถแก้ไขผู้ใช้ระดับนี้" });
      if (input.employeeCode) {
        const existingCode = await getStaffByEmployeeCode(input.employeeCode);
        if (existingCode && existingCode.id !== input.id) throw new TRPCError({ code: "CONFLICT", message: "รหัสพนักงานนี้ถูกใช้แล้ว" });
      }
      const { id, password, permissions, ...data } = input;
      const updateData: any = { ...data };
      if (password) updateData.passwordHash = await bcrypt.hash(password, 12);
      await updateStaffMember(id, updateData);
      if (permissions !== undefined) await setStaffPermissions(id, permissions);
      await createAuditLog({ actorType: "staff", actorId: session.id, actorName: null, action: "update_staff", entity: "staff", entityId: id, details: `เจ้าของสาขาอัปเดตพนักงาน ID: ${id}`, afterData: { ...data, permissions } });
      return { success: true };
    }),
    delete: branchAdminProcedure.input(z.object({ id: z.number(), branchId: z.number().optional() })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      if (session.role !== "branch_owner" && session.role !== "super_admin" && session.role !== "area_manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะเจ้าของสาขาหรือเจ้าของแฟรนไชส์เท่านั้นที่สามารถปิดใช้งานพนักงาน" });
      }
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "คุณยังไม่ได้ผูกกับสาขาใด" });
      const target = await getStaffById(input.id);
      if (!target || target.branchId !== effectiveBranchId) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบพนักงานในสาขาของคุณ" });
      if (target.role === "super_admin" || target.role === "branch_owner") throw new TRPCError({ code: "FORBIDDEN", message: "ไม่สามารถปิดใช้งานผู้ใช้ระดับนี้" });
      await deleteStaffMember(input.id);
      await createAuditLog({ actorType: "staff", actorId: session.id, actorName: null, action: "delete_staff", entity: "staff", entityId: input.id, details: `เจ้าของสาขาปิดใช้งานพนักงาน ID: ${input.id}`, afterData: { isActive: 0 } });
      return { success: true };
    }),
    reactivate: branchAdminProcedure.input(z.object({ id: z.number(), branchId: z.number().optional() })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      if (session.role !== "branch_owner" && session.role !== "super_admin" && session.role !== "area_manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะเจ้าของสาขาหรือเจ้าของแฟรนไชส์เท่านั้นที่สามารถเปิดใช้งานพนักงาน" });
      }
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "คุณยังไม่ได้ผูกกับสาขาใด" });
      const target = await getStaffById(input.id);
      if (!target || target.branchId !== effectiveBranchId) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบพนักงานในสาขาของคุณ" });
      if (target.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "พนักงานนี้เปิดใช้งานอยู่แล้ว" });
      await reactivateStaffMember(input.id);
      await createAuditLog({ actorType: "staff", actorId: session.id, actorName: null, action: "reactivate_staff", entity: "staff", entityId: input.id, details: `เจ้าของสาขาเปิดใช้งานพนักงาน ID: ${input.id} กลับ`, afterData: { isActive: 1 } });
      return { success: true };
    }),
    allPermissions: branchAdminProcedure.query(() => {
      // Branch owner can only assign a subset of permissions
      const branchPermissions = ["approve_reviews", "approve_points", "manage_issues", "view_reports", "view_customers", "manage_accounting"];
      const branchDefaultPerms: Record<string, string[]> = {
        branch_manager: DEFAULT_ROLE_PERMISSIONS["branch_manager"] || [],
        branch_staff: DEFAULT_ROLE_PERMISSIONS["branch_staff"] || [],
      };
      return { permissions: branchPermissions, defaultRolePermissions: branchDefaultPerms };
    }),
  }),

  // ── Review Requests ──
  reviews: router({
    submit: hibiProtectedProcedure.input(z.object({
      branchId: z.number(),
      deliveryApp: z.enum(["shopee", "lineman", "grab", "gpos"]),
      orderId: z.string().min(1),
      gfNumber: z.string().optional(),
      bookingId: z.string().optional(),
      shopeeOrderNumber: z.string().optional(),
      shopeeOrderId: z.string().optional(),
      linemanOrderNumber: z.string().optional(),
      linemanOrderId: z.string().optional(),
      imageBase64: z.string().min(1, "กรุณาแนบรูปภาพรีวิว"),
      imageType: z.string().default("image/jpeg"),
      orderImageBase64: z.string().optional(),
      orderImageType: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะลูกค้าเท่านั้น" });

      // Per-app input format validation (defense in depth — frontend also validates)
      if (input.deliveryApp === "grab") {
        if (input.gfNumber) {
          const gfTrimmed = input.gfNumber.trim().toUpperCase();
          if (!/^GF-\d{1,3}[A-Z]?$/.test(gfTrimmed)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "เลข GF ไม่ถูกรูปแบบ — ต้องเป็น GF- ตามด้วยตัวเลข 1-3 หลัก (เช่น GF-677) — Grab ใช้เลข 1-999 เท่านั้น" });
          }
          input.gfNumber = gfTrimmed;
          input.orderId = gfTrimmed;
        }
        if (input.bookingId) {
          const bookingIdTrimmed = input.bookingId.trim().toUpperCase();
          if (!/^A-[A-Z0-9]{14}$/.test(bookingIdTrimmed)) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Booking ID ต้องขึ้นต้นด้วย A- ตามด้วยตัวอักษร/ตัวเลข 14 ตัว (รวม 16 ตัว) เช่น A-949862QGXXISAV" });
          }
          input.bookingId = bookingIdTrimmed;
        }
      }
      if (input.deliveryApp === "lineman" && input.linemanOrderId) {
        const linemanIdTrimmed = input.linemanOrderId.trim().toUpperCase();
        if (!/^LMF-\d{6}-\d{6,12}$/.test(linemanIdTrimmed)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "รหัสใบสั่งซื้อ LINE MAN ต้องอยู่ในรูปแบบ LMF-YYMMDD-XXXXXXXXX เช่น LMF-260321-538845175" });
        }
        input.linemanOrderId = linemanIdTrimmed;
      }
      if (input.deliveryApp === "shopee" && input.shopeeOrderId) {
        const shopeeIdTrimmed = input.shopeeOrderId.trim();
        if (!/^\d{16,20}$/.test(shopeeIdTrimmed)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "เลขคำสั่งซื้อ Shopee ต้องเป็นตัวเลข 16-20 หลัก เช่น 3011303289058816525" });
        }
        input.shopeeOrderId = shopeeIdTrimmed;
      }

      // ตรวจสอบว่า Order ID นี้ได้รับอนุมัติแล้วหรือยัง (1 คำสั่งซื้อ = 1 โค้ด)
      // Shopee/Lineman: ใช้เลขคำสั่งซื้อยาว (unique จริง) แทนเลขสั้นที่ซ้ำได้
      // Grab: ใช้ bookingId (A-XXXXXXXXXXXXXX) ซึ่ง unique จริง — GF number ซ้ำได้เพราะ Grab หมุนวนใช้
      const uniqueOrderId = input.deliveryApp === 'shopee' ? input.shopeeOrderId
        : input.deliveryApp === 'lineman' ? input.linemanOrderId
        : input.deliveryApp === 'grab' ? input.bookingId
        : undefined;
      const existingApproved = await checkApprovedReviewExists(input.deliveryApp, input.orderId, uniqueOrderId);
      if (existingApproved) throw new TRPCError({ code: "CONFLICT", message: "❌ คำสั่งซื้อนี้มีรีวิวอยู่แล้ว (อนุมัติแล้วหรือรอพิจารณา) — ไม่สามารถส่งรีวิวซ้ำได้ หากเป็นออเดอร์คนละรายการ กรุณาตรวจสอบเลขคำสั่งซื้อ" });
      // ลบ review เก่าที่ถูก reject เพื่อให้ลูกค้าส่งใหม่ได้
      await deleteRejectedReviewRequest(input.deliveryApp, input.orderId, uniqueOrderId);
      // รูปภาพรีวิวบังคับ
      const buffer = Buffer.from(input.imageBase64, "base64");
      const ext = input.imageType?.split("/")[1] || "jpg";
      const key = `reviews/${ctx.hibiSession!.id}-${Date.now()}-${nanoid(6)}.${ext}`;
      const imgResult = await storagePut(key, buffer, input.imageType || "image/jpeg");
      const imageUrl: string = imgResult.url;
      let orderImageUrl: string | null = null;
      if (input.orderImageBase64) {
        const buffer = Buffer.from(input.orderImageBase64, "base64");
        const ext = input.orderImageType?.split("/")[1] || "jpg";
        const key = `orders/${ctx.hibiSession!.id}-${Date.now()}-${nanoid(6)}.${ext}`;
        const result = await storagePut(key, buffer, input.orderImageType || "image/jpeg");
        orderImageUrl = result.url;
      }
      try {
        const id = await createReviewRequest({
          customerId: ctx.hibiSession!.id, branchId: input.branchId,
          deliveryApp: input.deliveryApp, orderId: input.orderId,
          gfNumber: input.gfNumber || null,
          bookingId: input.bookingId || null,
          shopeeOrderNumber: input.shopeeOrderNumber || null,
          shopeeOrderId: input.shopeeOrderId || null,
          linemanOrderNumber: input.linemanOrderNumber || null,
          linemanOrderId: input.linemanOrderId || null,
          imageUrl, orderImageUrl, status: "pending",
        });
        await createAuditLog({ actorType: "customer", actorId: ctx.hibiSession!.id, actorName: null, action: "submit_review", entity: "review_request", entityId: id, details: `ส่งรีวิว: ${input.deliveryApp} #${input.orderId}`, afterData: { deliveryApp: input.deliveryApp, orderId: input.orderId, branchId: input.branchId } });
        const customer = await getCustomerById(ctx.hibiSession!.id);
        const branch = await getBranchById(input.branchId);
        const appLabels: Record<string, string> = { shopee: 'Shopee Food', lineman: 'LINE MAN', grab: 'Grab Food', gpos: 'GPOS (หน้าร้าน)' };
        const appName = appLabels[input.deliveryApp] || input.deliveryApp;
        const submitDate = new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
        // [DISABLED] notifyOwner - รีวิวใหม่รอพิจารณา (ปิดเพื่อลดอีเมลแจ้งเตือน)
        // notifyOwner({ title: `📝 รีวิวใหม่รอพิจารณา - ${appName}`, ... }).catch(...);
        // In-app notification to area_manager / branch staff
        notifyBranchStaff(input.branchId, {
          type: "new_review",
          title: `รีวิวใหม่รออนุมัติ - ${appName}`,
          message: `สาขา: ${branch?.name || 'N/A'} | Order: ${input.orderId} | ลูกค้า: ${customer?.name || 'N/A'}`,
          relatedEntity: "review_request",
          relatedEntityId: id,
          isRead: 0,
        }).catch(err => console.warn('[StaffNotification] Failed:', err));
        return { id };
      } catch (err: any) {
        if (err.code === "ER_DUP_ENTRY") throw new TRPCError({ code: "CONFLICT", message: "❌ Order ID นี้ถูกส่งรีวิวไปแล้ว — หากต้องการส่งใหม่ กรุณาตรวจสอบเลขออเดอร์อีกครั้ง" });
        if (err instanceof TRPCError) throw err;
        console.error("[submitReview] DB error:", err.message || err);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "⚠️ เกิดข้อผิดพลาดในระบบ — กรุณาลองใหม่อีกครั้ง หากยังไม่ได้ กรุณาติดต่อร้านค้า" });
      }
    }),

    // My review requests
    myRequests: hibiProtectedProcedure.query(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") return [];
      return listReviewRequestsByCustomer(ctx.hibiSession!.id);
    }),

    myCodes: hibiProtectedProcedure.query(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") return [];
      return listCodesByCustomer(ctx.hibiSession!.id);
    }),

        branchQueue: branchAdminProcedure.input(z.object({
      status: z.string().optional(),
      branchId: z.number().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      const role = ctx.hibiSession!.role;
      const dateFrom = input?.dateFrom ? new Date(input.dateFrom) : undefined;
      const dateTo = input?.dateTo ? (() => { const d = new Date(input.dateTo); d.setHours(23, 59, 59, 999); return d; })() : undefined;
      if (role === "super_admin") {
        // Super admin: see all or filter by branch
        if (input?.branchId) return listReviewRequestsByBranch(input.branchId, input?.status, dateFrom, dateTo);
        return listAllReviewRequests(input?.status, dateFrom, dateTo);
      }
      if (role === "area_manager") {
        // Area manager: see assigned branches
        const assignedBranches = await getStaffBranches(ctx.hibiSession!.id);
        const branchIds = assignedBranches.map(b => b.branchId);
        if (branchIds.length === 0) return [];
        if (input?.branchId) {
          // Filter to specific branch (must be in assigned list)
          if (!branchIds.includes(input.branchId)) return [];
          return listReviewRequestsByBranch(input.branchId, input?.status, dateFrom, dateTo);
        }
                return listReviewRequestsByBranches(branchIds, input?.status, dateFrom, dateTo);
      }
      // Branch owner/manager: see own branch only
      if (!staffMember?.branchId) return [];
      return listReviewRequestsByBranch(staffMember.branchId, input?.status, dateFrom, dateTo);
    }),

    detail: hibiProtectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const review = await getReviewRequestById(input.id);
      if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบคำขอรีวิว" });
      const customer = await getCustomerById(review.customerId);
      const branch = await getBranchById(review.branchId);
      return { ...review, customerName: customer?.name, customerPhone: customer?.phone, customerEmail: customer?.email, branchName: branch?.name };
    }),

    approve: branchAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const review = await getReviewRequestById(input.id);
      if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบคำขอรีวิว" });
      if (review.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "คำขอนี้ได้รับการพิจารณาแล้ว" });
      const customer = await getCustomerById(review.customerId);
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบข้อมูลลูกค้า" });
      const code = await generateUniqueCode("RV");
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      expiresAt.setHours(23, 59, 59, 999);
      await createCode({
        code, type: "RV", branchId: review.branchId, customerId: review.customerId,
        reviewRequestId: review.id, email: customer.email, status: "issued", expiresAt,
      });
      await updateReviewRequest(input.id, { status: "approved", reviewedBy: ctx.hibiSession!.id });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "approve_review", entity: "review_request", entityId: input.id, details: `อนุมัติรีวิว ID: ${input.id}, สร้างโค้ด: ${code}`, beforeData: { status: "pending" }, afterData: { status: "approved", code } });
      const branch = await getBranchById(review.branchId);
      // [DISABLED] notifyOwner - อนุมัติรีวิว (ปิดเพื่อลดอีเมลแจ้งเตือน)
      // notifyOwner({ title: `✅ อนุมัติรีวิว - โค้ด ${code}`, ... }).catch(...);
      return { success: true, code };
    }),

    reject: branchAdminProcedure.input(z.object({
      id: z.number(),
      reason: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const review = await getReviewRequestById(input.id);
      if (!review) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบคำขอรีวิว" });
      if (review.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "คำขอนี้ได้รับการพิจารณาแล้ว" });
      await updateReviewRequest(input.id, { status: "rejected", reviewedBy: ctx.hibiSession!.id, rejectionReason: input.reason || null });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "reject_review", entity: "review_request", entityId: input.id, details: `ปฏิเสธรีวิว ID: ${input.id}${input.reason ? `, เหตุผล: ${input.reason}` : ""}`, beforeData: { status: "pending" }, afterData: { status: "rejected", reason: input.reason } });
      return { success: true };
    }),
  }),

  // ── Claim Compensation (Full Spec: claim_reason + claim_order_id) ──
  claims: router({
    create: branchAdminProcedure.input(z.object({
      branchId: z.number().optional(),
      // ช่องทาง
      claimChannel: z.enum(["shopee", "lineman", "grab", "gpos", "walk_in"]),
      // เลขออเดอร์
      claimOrderId: z.string().optional(),
      // วันที่สั่งซื้อ
      orderDate: z.string().optional(),
      // รหัสเมนูที่ผิดพลาด
      claimMenuCode: z.string().optional(),
      claimMenuName: z.string().optional(),
      // รายละเอียดการสั่ง
      claimOrderDetail: z.string().optional(),
      // ความผิดพลาด
      claimError: z.string().min(1, "กรุณาระบุความผิดพลาด"),
      // เมนูที่ชดเชย (เลือกจาก reviewMenuItems หรือพิมพ์เอง)
      compensationMenuCode: z.string().optional(),
      compensationMenuName: z.string().optional(),
      // หมายเหตุสำหรับหน้าร้าน เช่น หวานน้อย เย็น ไซส์ L
      compensationRemark: z.string().optional(),
      // ระบุลูกค้า: customerId (จาก QR scan) หรือ phone หรือ email
      customerId: z.number().optional(),
      customerPhone: z.string().optional(),
      email: z.string().optional(),
      // กำหนดวันหมดอายุ
      expiryDays: z.number().min(1).max(365).default(30),
      // ถ้าออกจากหน้าปัญหาออเดอร์ → auto-resolve issue
      orderIssueId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      const branchId = input.branchId || staffMember?.branchId;
      if (!branchId) throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณาระบุสาขา" });

      // Resolve customer
      let customerId = input.customerId;
      let customerEmail = input.email || "";
      let customerPhone = (input.customerPhone || "").replace(/\D/g, "");
      if (!customerId && customerPhone) {
        const customer = await getCustomerByPhone(customerPhone);
        if (customer) { customerId = customer.id; customerEmail = customerEmail || customer.email || ""; }
      }
      if (!customerEmail && !customerPhone && !customerId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณาระบุลูกค้า (สแกน QR / เบอร์โทร / อีเมล)" });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + input.expiryDays);
      expiresAt.setHours(23, 59, 59, 999);
      const clCode = await generateUniqueCode("CL");

      const channelLabels: Record<string, string> = { shopee: "Shopee", lineman: "LINE MAN", grab: "Grab", gpos: "GPOS", walk_in: "หน้าร้าน" };

      // Auto-fill compensation menu from claim menu when same_menu mode
      const finalCompMenuCode = input.compensationMenuCode || input.claimMenuCode || null;
      const finalCompMenuName = input.compensationMenuName || input.claimMenuName || null;

      await createCode({
        code: clCode, type: "CL", branchId,
        email: customerEmail || "no-email@hibimatcha.love",
        customerId: customerId || null,
        status: "issued", expiresAt,
        claimReason: input.claimError,
        claimOrderId: input.claimOrderId || null,
        claimChannel: input.claimChannel,
        claimMenuCode: input.claimMenuCode || null,
        claimMenuName: input.claimMenuName || null,
        claimOrderDetail: input.claimOrderDetail || null,
        claimError: input.claimError,
        compensationMenuCode: finalCompMenuCode,
        compensationMenuName: finalCompMenuName,
        compensationRemark: input.compensationRemark || null,
        orderDate: input.orderDate ? new Date(input.orderDate) : null,
        customerPhone: customerPhone || null,
        expiryDays: input.expiryDays,
      });

      const branch = await getBranchById(branchId);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_claim", entity: "code", entityId: null, details: "สร้างโค้ดชดเชย: " + clCode + " สำหรับ " + (customerPhone || customerEmail || "ID:" + customerId), afterData: { code: clCode, channel: input.claimChannel, error: input.claimError, compensationMenu: input.compensationMenuName } });
      // [DISABLED] notifyOwner - สร้างโค้ดชดเชย (ปิดเพื่อลดอีเมลแจ้งเตือน)
      // notifyOwner({ title: "สร้างโค้ดชดเชย - " + clCode, ... }).catch(...);

      // Build copy text with menu code + remark for branch staff
      const compParts: string[] = [];
      if (finalCompMenuCode) compParts.push(finalCompMenuCode);
      if (finalCompMenuName) compParts.push(finalCompMenuName);
      const compText = compParts.length > 0 ? compParts.join(" - ") : "ไม่ระบุ";
      const remarkText = input.compensationRemark ? " (" + input.compensationRemark + ")" : "";
      const orderIdText = input.claimOrderId ? " | เลขออเดอร์: " + input.claimOrderId : "";
      const orderDateText = input.orderDate ? " | วันที่สั่ง: " + new Date(input.orderDate).toLocaleDateString("th-TH") : "";
      const copyText = clCode + " | เมนูชดเชย: " + compText + remarkText + orderIdText + orderDateText + " | สาเหตุ: " + input.claimError;

      // Auto-resolve the linked order issue if provided
      if (input.orderIssueId) {
        try {
          const issue = await getOrderIssueById(input.orderIssueId);
          if (issue && !["resolved", "closed"].includes(issue.status)) {
            const resolution = `ออกโค้ดชดเชย ${clCode} (${compText}${remarkText}) ให้ลูกค้าแล้ว`;
            await updateOrderIssue(input.orderIssueId, { status: "resolved" as any, resolution, resolvedAt: new Date() });
            await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "auto_resolve_issue", entity: "order_issue", entityId: input.orderIssueId, details: `แก้ไขอัตโนมัติ: ออกโค้ดชดเชย ${clCode}` });
          }
        } catch (err) {
          console.warn('[AutoResolve] Failed to auto-resolve issue:', err);
        }
      }

      return { success: true, code: clCode, copyText, expiresAt: expiresAt.toISOString(), compensationMenuCode: finalCompMenuCode, compensationMenuName: finalCompMenuName, compensationRemark: input.compensationRemark || null };
    }),
  }),

  // ── Code Management ──
  codes: router({
    redeem: staffProcedure.input(z.object({
      code: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      // Get staff's branch to check code belongs to same branch
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      const staffBranchId = staffMember?.branchId ?? undefined;
      const result = await redeemCodeDb(input.code, ctx.hibiSession!.id, staffBranchId);
      if (!result.success) throw new TRPCError({ code: "BAD_REQUEST", message: result.error! });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "redeem_code", entity: "code", entityId: result.code!.id, details: `ใช้โค้ด: ${input.code}`, beforeData: { status: "issued" }, afterData: { status: "redeemed" } });
      // [DISABLED] notifyOwner - ใช้โค้ด (ปิดเพื่อลดอีเมลแจ้งเตือน)
      // notifyOwner({ title: `🔖 ใช้โค้ด - ${input.code}`, ... }).catch(...);
      return { success: true, code: result.code };
    }),

    lookup: staffProcedure.input(z.object({
      code: z.string().min(1),
    })).query(async ({ input }) => {
      // First search in codes table (RV/CL)
      const code = await getCodeByCode(input.code);
      if (code) {
        const branch = await getBranchById(code.branchId);
        return { ...code, branchName: branch?.name, codeSource: "codes" as const };
      }
      // Fallback: search in reward_redemptions table (PT codes)
      const redemption = await getRedemptionByCode(input.code);
      if (redemption) {
        const reward = await getRewardById(redemption.rewardId);
        const customer = await getCustomerById(redemption.customerId);
        const branch = redemption.branchId ? await getBranchById(redemption.branchId) : null;
        return {
          id: redemption.id,
          code: redemption.redemptionCode,
          type: "PT" as const,
          status: new Date() > redemption.expiresAt ? "expired" : redemption.status === "used" ? "redeemed" : redemption.status,
          branchId: redemption.branchId,
          branchName: branch?.name || null,
          customerId: redemption.customerId,
          customerName: customer?.name || null,
          customerPhone: customer?.phone || null,
          issuedAt: redemption.createdAt,
          expiresAt: redemption.expiresAt,
          redeemedAt: redemption.usedAt,
          rewardName: reward?.name || null,
          rewardCategory: reward?.category || null,
          pointsSpent: redemption.pointsSpent,
          codeSource: "redemption" as const,
        };
      }
      return null;
    }),

    branchCodes: branchAdminProcedure.input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      const dateFrom = input?.dateFrom ? new Date(input.dateFrom) : undefined;
      const dateTo = input?.dateTo ? (() => { const d = new Date(input.dateTo); d.setHours(23, 59, 59, 999); return d; })() : undefined;
      if (ctx.hibiSession!.role === "super_admin") return listAllCodes(dateFrom, dateTo);
      if (ctx.hibiSession!.role === "area_manager") {
        const assignedBranches = await getStaffBranches(ctx.hibiSession!.id);
        const branchIds = assignedBranches.map(b => b.branchId);
        if (branchIds.length === 0) return [];
        return listCodesByBranches(branchIds);
      }
      if (!staffMember?.branchId) return [];
      return listCodesByBranch(staffMember.branchId);
    }),

    cancel: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const codeBefore = await getCodeByCode(String(input.id));
      await updateCode(input.id, { status: "cancelled" });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "cancel_code", entity: "code", entityId: input.id, details: `ยกเลิกโค้ด ID: ${input.id}`, beforeData: { status: codeBefore?.status }, afterData: { status: "cancelled" } });
      return { success: true };
    }),

    // Get code by ID for editing
    getById: branchAdminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const allCodes = await listAllCodes();
      const code = allCodes.find((c: any) => c.id === input.id);
      if (!code) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบโค้ด" });
      return code;
    }),

    // Update compensation code details
    update: branchAdminProcedure.input(z.object({
      id: z.number(),
      claimOrderId: z.string().optional(),
      orderDate: z.string().optional(),
      claimMenuCode: z.string().optional(),
      claimMenuName: z.string().optional(),
      claimOrderDetail: z.string().optional(),
      claimError: z.string().optional(),
      compensationMenuCode: z.string().optional(),
      compensationMenuName: z.string().optional(),
      compensationRemark: z.string().optional(),
      expiryDays: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, orderDate, expiryDays, ...data } = input;
      const updateData: any = {};
      // Only update fields that are provided
      if (data.claimOrderId !== undefined) updateData.claimOrderId = data.claimOrderId || null;
      if (data.claimMenuCode !== undefined) updateData.claimMenuCode = data.claimMenuCode || null;
      if (data.claimMenuName !== undefined) updateData.claimMenuName = data.claimMenuName || null;
      if (data.claimOrderDetail !== undefined) updateData.claimOrderDetail = data.claimOrderDetail || null;
      if (data.claimError !== undefined) updateData.claimError = data.claimError || null;
      if (data.compensationMenuCode !== undefined) updateData.compensationMenuCode = data.compensationMenuCode || null;
      if (data.compensationMenuName !== undefined) updateData.compensationMenuName = data.compensationMenuName || null;
      if (data.compensationRemark !== undefined) updateData.compensationRemark = data.compensationRemark || null;
      if (orderDate !== undefined) updateData.orderDate = orderDate ? new Date(orderDate) : null;
      if (expiryDays !== undefined) {
        updateData.expiryDays = expiryDays;
        // Recalculate expiresAt from issuedAt
        const allCodes = await listAllCodes();
        const existingCode = allCodes.find((c: any) => c.id === id);
        if (existingCode) {
          const issuedAt = new Date(existingCode.issuedAt);
          const newExpires = new Date(issuedAt);
          newExpires.setDate(newExpires.getDate() + expiryDays);
          newExpires.setHours(23, 59, 59, 999);
          updateData.expiresAt = newExpires;
        }
      }
      await updateCode(id, updateData);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_code", entity: "code", entityId: id, details: `แก้ไขโค้ด ID: ${id}`, afterData: updateData });

      // [DISABLED] notifyOwner - โค้ดชดเชยถูกแก้ไข (ปิดเพื่อลดอีเมลแจ้งเตือน)

      return { success: true };
    }),
  }),

  // ── Dashboard & Reports ──
  dashboard: router({
    stats: branchAdminProcedure.query(async ({ ctx }) => {
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      if (ctx.hibiSession!.role === "super_admin") return getDashboardStats();
      if (ctx.hibiSession!.role === "area_manager") {
        const assignedBranches = await getStaffBranches(ctx.hibiSession!.id);
        const branchIds = assignedBranches.map(b => b.branchId);
        if (branchIds.length === 0) return getDashboardStats(-1); // no branches = empty
        return getDashboardStatsMultiBranch(branchIds);
      }
      return getDashboardStats(staffMember?.branchId ?? undefined);
    }),
  }),

  reports: router({
    summary: superAdminProcedure.input(z.object({
      branchId: z.number().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      return getReportData(input?.branchId, input?.dateFrom ? new Date(input.dateFrom) : undefined, input?.dateTo ? (() => { const d = new Date(input!.dateTo!); d.setHours(23, 59, 59, 999); return d; })() : undefined);
    }),
    areaManagerSummary: branchAdminProcedure.query(async ({ ctx }) => {
      const role = ctx.hibiSession!.role;
      if (role === "super_admin") return getReportData();
      if (role === "area_manager") {
        const assignedBranches = await getStaffBranches(ctx.hibiSession!.id);
        const branchIds = assignedBranches.map(b => b.branchId);
        if (branchIds.length === 0) return { codesPerBranch: [], approvalRate: { total: 0, approved: 0, rejected: 0, rate: 0 }, rejectionReasons: [], clIssuedCount: 0 };
        return getReportDataMultiBranch(branchIds);
      }
      // branch_owner / branch_manager: single branch
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      if (!staffMember?.branchId) return { codesPerBranch: [], approvalRate: { total: 0, approved: 0, rejected: 0, rate: 0 }, rejectionReasons: [], clIssuedCount: 0 };
      return getReportData(staffMember.branchId);
    }),
    exportCsv: superAdminProcedure.input(z.object({
      branchId: z.number().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      const data = await getAllCodesForExport(input?.branchId, input?.dateFrom ? new Date(input.dateFrom) : undefined, input?.dateTo ? (() => { const d = new Date(input!.dateTo!); d.setHours(23, 59, 59, 999); return d; })() : undefined);
      const header = "ID,Code,Type,BranchID,Email,Status,IssuedAt,ExpiresAt,RedeemedAt,ClaimReason,ClaimOrderId";
      const rows = data.map(c =>
        `${c.id},"${c.code}","${c.type}",${c.branchId},"${c.email}","${c.status}","${c.issuedAt?.toISOString() ?? ""}","${c.expiresAt?.toISOString() ?? ""}","${c.redeemedAt?.toISOString() ?? ""}","${c.claimReason ?? ""}","${c.claimOrderId ?? ""}"`
      );
      return { csv: [header, ...rows].join("\n"), count: data.length };
    }),
  }),

  // ── Audit Logs ──
  auditLogs: router({
    list: superAdminProcedure.input(z.object({
      limit: z.number().default(100),
      offset: z.number().default(0),
      action: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      const dateFrom = input?.dateFrom ? new Date(input.dateFrom) : undefined;
      const dateTo = input?.dateTo ? (() => { const d = new Date(input!.dateTo!); d.setHours(23, 59, 59, 999); return d; })() : undefined;
      return listAuditLogs(input?.limit ?? 100, input?.offset ?? 0, input?.action, dateFrom, dateTo);
    }),
  }),

  // ── Loyalty Points ──
  loyalty: router({
    // Get my points balance (flat rate, no tier system)
    myPoints: hibiProtectedProcedure.query(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const lp = await getOrCreateLoyaltyPoints(ctx.hibiSession!.id);
      const customer = await getCustomerById(ctx.hibiSession!.id);
      const available = lp.totalPoints - lp.usedPoints;
      return {
        ...lp,
        availablePoints: available,
        customerName: customer?.name,
        customerPhone: customer?.phone,
        pointsRate: "10 บาท = 1 แต้ม",
      };
    }),

    // Points history
    history: hibiProtectedProcedure.input(z.object({
      limit: z.number().default(50),
      offset: z.number().default(0),
    }).optional()).query(async ({ ctx, input }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      return getPointTransactions(ctx.hibiSession!.id, input?.limit ?? 50, input?.offset ?? 0);
    }),

    // Earn points at store (staff scans customer QR)
    earnAtStore: branchAdminProcedure.input(z.object({
      customerId: z.number(),
      orderAmount: z.number().min(1),
      branchId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const customer = await getCustomerById(input.customerId);
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบลูกค้า" });
      const lp = await getOrCreateLoyaltyPoints(input.customerId);
      const points = calculatePoints(input.orderAmount, lp.tier as any);
      if (points <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "ยอดซื้อน้อยเกินไป" });
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      const branchId = input.branchId || staffMember?.branchId;
      const result = await addPoints(input.customerId, points, "earn_store", input.orderAmount, `สะสมแต้มหน้าร้าน ยอด ${input.orderAmount} บาท`, branchId ?? undefined, ctx.hibiSession!.id);
      // Also add to branch-specific loyalty
      if (branchId) {
        await addBranchPoints(input.customerId, branchId, points);
      }
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "earn_points_store", entity: "loyalty_points", entityId: input.customerId, details: `ให้แต้ม ${points} pts (${input.orderAmount} บาท) ลูกค้า: ${customer.name} สาขา: ${branchId || 'N/A'}`, afterData: { points, orderAmount: input.orderAmount, tier: result.tier, branchId } });
      const updatedLp = await getOrCreateLoyaltyPoints(input.customerId);
      return { ...result, customerName: customer.name, branchId, newBalance: updatedLp.totalPoints - updatedLp.usedPoints };
    }),

    // Deduct/revoke points from customer (manager+ only)
    deductPoints: branchAdminProcedure.input(z.object({
      customerId: z.number(),
      points: z.number().min(1),
      reason: z.string().min(1),
      branchId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      // Permission check: manager+ only
      const managerRoles = ["branch_manager", "branch_owner", "area_manager", "super_admin"];
      if (!managerRoles.includes(ctx.hibiSession!.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะ Manager ขึ้นไปเท่านั้นที่สามารถหักแต้มได้" });
      }
      const customer = await getCustomerById(input.customerId);
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบลูกค้า" });
      const branchId = input.branchId;
      const result = await deductPoints(input.customerId, input.points, input.reason, branchId, ctx.hibiSession!.id);
      if (!result.success) throw new TRPCError({ code: "BAD_REQUEST", message: result.error });
      // Deduct from branch-specific loyalty
      await deductBranchPoints(input.customerId, branchId, input.points);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "deduct_points", entity: "loyalty_points", entityId: input.customerId, details: `หักแต้ม ${input.points} pts จากลูกค้า: ${customer.name} เหตุผล: ${input.reason} สาขา: ${branchId}`, afterData: { points: -input.points, reason: input.reason, branchId, newBalance: result.newBalance } });
      return { success: true, customerName: customer.name, pointsDeducted: input.points, newBalance: result.newBalance };
    }),

    // Lookup customer by phone for giving points
    lookupCustomer: branchAdminProcedure.input(z.object({
      phone: z.string().optional(),
      customerId: z.number().optional(),
    })).query(async ({ input }) => {
      let customer;
      if (input.customerId) {
        customer = await getCustomerById(input.customerId);
      } else if (input.phone) {
        let cleanPhone = input.phone.replace(/\D/g, "");
        if (cleanPhone.startsWith("66") && cleanPhone.length >= 11) {
          cleanPhone = "0" + cleanPhone.slice(2);
        }
        customer = await getCustomerByPhone(cleanPhone);
      }
      if (!customer) return null;
      const lp = await getOrCreateLoyaltyPoints(customer.id);
      return { id: customer.id, name: customer.name, phone: customer.phone, email: customer.email, tier: lp.tier, totalPoints: lp.totalPoints, usedPoints: lp.usedPoints, availablePoints: lp.totalPoints - lp.usedPoints, lifetimePoints: lp.lifetimePoints };
    }),

    // Get branch-specific points for a customer (admin use)
    getCustomerBranchPoints: branchAdminProcedure.input(z.object({
      customerId: z.number(),
      branchId: z.number(),
    })).query(async ({ input }) => {
      const blp = await getOrCreateBranchLoyalty(input.customerId, input.branchId);
      return { ...blp, available: blp.totalPoints - blp.usedPoints };
    }),

    // Submit delivery point claim
    submitClaim: hibiProtectedProcedure.input(z.object({
      branchId: z.number(),
      deliveryApp: z.enum(["shopee", "lineman", "grab", "gpos"]),
      orderId: z.string().min(1),
      gfNumber: z.string().optional(), // Grab short order e.g. GF-677
      bookingId: z.string().optional(), // Grab booking ID e.g. A-949862QGXXISAV
      shopeeOrderNumber: z.string().optional(), // Shopee short order e.g. #212
      shopeeOrderId: z.string().optional(), // Shopee long order ID e.g. 3011303289058816525
      linemanOrderNumber: z.string().optional(), // LINE MAN short order e.g. #5175
      linemanOrderId: z.string().optional(), // LINE MAN รหัสใบสั่งซื้อ e.g. LMF-260321-538845175
      orderAmount: z.number().min(1),
      orderDate: z.string().optional(), // วันที่สั่งซื้อจริง (ISO string)
      screenshotBase64: z.string().optional(),
      screenshotType: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });

      // Grab-specific validation: require gfNumber + bookingId
      if (input.deliveryApp === "grab") {
        if (!input.gfNumber || !input.gfNumber.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณากรอกเลข GF (เช่น GF-677)" });
        }
        // Validate gfNumber format: GF- + 1-3 digits + optional letter (Grab uses 1-999)
        const gfTrimmed = input.gfNumber.trim().toUpperCase();
        if (!/^GF-\d{1,3}[A-Z]?$/.test(gfTrimmed)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "เลข GF ไม่ถูกรูปแบบ — ต้องเป็น GF- ตามด้วยตัวเลข 1-3 หลัก (เช่น GF-677) — Grab ใช้เลข 1-999 เท่านั้น" });
        }
        input.gfNumber = gfTrimmed;
        if (!input.bookingId || !input.bookingId.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณากรอก Booking ID (เช่น A-949862QGXXISAV)" });
        }
        // Validate bookingId format: A- followed by exactly 14 alphanumeric chars = 16 total
        const bookingIdTrimmed = input.bookingId.trim().toUpperCase();
        if (!/^A-[A-Z0-9]{14}$/.test(bookingIdTrimmed)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Booking ID ต้องขึ้นต้นด้วย A- ตามด้วยตัวอักษร/ตัวเลข 14 ตัว (รวม 16 ตัว) เช่น A-949862QGXXISAV" });
        }
        // Check uniqueness: bookingId must not exist in approved claims
        const isApproved = await checkBookingIdApproved(bookingIdTrimmed);
        if (isApproved) {
          throw new TRPCError({ code: "CONFLICT", message: "❌ Booking ID นี้ถูกอนุมัติไปแล้ว — ไม่สามารถส่งซ้ำได้ หากเป็นออเดอร์คนละรายการ กรุณาตรวจสอบ Booking ID อีกครั้ง" });
        }
        // Check if bookingId is already pending
        const isPending = await checkBookingIdPending(bookingIdTrimmed);
        if (isPending) {
          throw new TRPCError({ code: "CONFLICT", message: "⏳ Booking ID นี้อยู่ระหว่างรอตรวจสอบแล้ว — กรุณารอผลการพิจารณา ไม่ต้องส่งซ้ำ" });
        }
        input.bookingId = bookingIdTrimmed;
      }

      // Shopee-specific validation: require shopeeOrderNumber + shopeeOrderId
      if (input.deliveryApp === "shopee") {
        if (!input.shopeeOrderNumber || !input.shopeeOrderNumber.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณากรอกเลขออเดอร์สั้น (เช่น #212)" });
        }
        if (!input.shopeeOrderId || !input.shopeeOrderId.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณากรอกเลขคำสั่งซื้อ (เช่น 3011303289058816525)" });
        }
        // Validate shopeeOrderId format: all digits, 16-20 chars
        const shopeeIdTrimmed = input.shopeeOrderId.trim();
        if (!/^\d{16,20}$/.test(shopeeIdTrimmed)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "เลขคำสั่งซื้อ Shopee ต้องเป็นตัวเลข 16-20 หลัก เช่น 3011303289058816525" });
        }
        // Check uniqueness: shopeeOrderId must not exist in approved claims
        const isApproved = await checkShopeeOrderIdApproved(shopeeIdTrimmed);
        if (isApproved) {
          throw new TRPCError({ code: "CONFLICT", message: "❌ เลขคำสั่งซื้อนี้ถูกอนุมัติไปแล้ว — ไม่สามารถส่งซ้ำได้ หากเป็นออเดอร์คนละรายการ กรุณาตรวจสอบเลขคำสั่งซื้ออีกครั้ง" });
        }
        // Check if shopeeOrderId is already pending
        const isPending = await checkShopeeOrderIdPending(shopeeIdTrimmed);
        if (isPending) {
          throw new TRPCError({ code: "CONFLICT", message: "⏳ เลขคำสั่งซื้อนี้อยู่ระหว่างรอตรวจสอบแล้ว — กรุณารอผลการพิจารณา ไม่ต้องส่งซ้ำ" });
        }
        input.shopeeOrderId = shopeeIdTrimmed;
      }

      // LINE MAN-specific validation: require linemanOrderNumber + linemanOrderId
      if (input.deliveryApp === "lineman") {
        if (!input.linemanOrderNumber || !input.linemanOrderNumber.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณากรอกเลขออเดอร์สั้น (เช่น #5175)" });
        }
        if (!input.linemanOrderId || !input.linemanOrderId.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณากรอกรหัสใบสั่งซื้อ (เช่น LMF-260321-538845175)" });
        }
        // Validate linemanOrderId format: LMF-YYMMDD-XXXXXXXXX
        const linemanIdTrimmed = input.linemanOrderId.trim().toUpperCase();
        if (!/^LMF-\d{6}-\d{6,12}$/.test(linemanIdTrimmed)) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "รหัสใบสั่งซื้อ LINE MAN ต้องอยู่ในรูปแบบ LMF-YYMMDD-XXXXXXXXX เช่น LMF-260321-538845175" });
        }
        // Check uniqueness: linemanOrderId must not exist in approved claims
        const isApproved = await checkLinemanOrderIdApproved(linemanIdTrimmed);
        if (isApproved) {
          throw new TRPCError({ code: "CONFLICT", message: "❌ รหัสใบสั่งซื้อนี้ถูกอนุมัติไปแล้ว — ไม่สามารถส่งซ้ำได้ หากเป็นออเดอร์คนละรายการ กรุณาตรวจสอบรหัสอีกครั้ง" });
        }
        // Check if linemanOrderId is already pending
        const isPending = await checkLinemanOrderIdPending(linemanIdTrimmed);
        if (isPending) {
          throw new TRPCError({ code: "CONFLICT", message: "⏳ รหัสใบสั่งซื้อนี้อยู่ระหว่างรอตรวจสอบแล้ว — กรุณารอผลการพิจารณา ไม่ต้องส่งซ้ำ" });
        }
        input.linemanOrderId = linemanIdTrimmed;
      }

      // Check if same deliveryApp + orderId already exists in pending/approved (allow re-submit if rejected)
      // SKIP for Grab: GF numbers (e.g. GF-949) are reused/recycled by Grab — they are NOT unique.
      // Grab uniqueness is already enforced above via checkBookingIdApproved + checkBookingIdPending.
      if (input.deliveryApp !== "grab") {
        const existingClaim = await checkExistingClaim(input.deliveryApp, input.orderId);
        if (existingClaim) {
          if (existingClaim.status === "pending") {
            throw new TRPCError({ code: "CONFLICT", message: "⏳ คำขอนี้อยู่ระหว่างรอตรวจสอบแล้ว — กรุณารอผลการพิจารณา ไม่ต้องส่งซ้ำ" });
          }
          if (existingClaim.status === "approved") {
            throw new TRPCError({ code: "CONFLICT", message: "❌ Order ID นี้ถูกอนุมัติและได้รับแต้มแล้ว — ไม่สามารถขอซ้ำได้" });
          }
          // If rejected, delete the old claim so the customer can re-submit
          await deletePointClaim(existingClaim.id);
        }
      }

      let screenshotUrl: string | null = null;
      if (input.screenshotBase64) {
        const buffer = Buffer.from(input.screenshotBase64, "base64");
        const ext = input.screenshotType?.split("/")[1] || "jpg";
        const key = `point-claims/${ctx.hibiSession!.id}-${Date.now()}-${nanoid(6)}.${ext}`;
        const result = await storagePut(key, buffer, input.screenshotType || "image/jpeg");
        screenshotUrl = result.url;
      }
      try {
        const id = await createPointClaim({
          customerId: ctx.hibiSession!.id, branchId: input.branchId,
          deliveryApp: input.deliveryApp, orderId: input.orderId,
          gfNumber: input.deliveryApp === "grab" ? input.gfNumber?.trim() || null : null,
          bookingId: input.deliveryApp === "grab" ? input.bookingId || null : null,
          shopeeOrderNumber: input.deliveryApp === "shopee" ? input.shopeeOrderNumber?.trim() || null : null,
          shopeeOrderId: input.deliveryApp === "shopee" ? input.shopeeOrderId || null : null,
          linemanOrderNumber: input.deliveryApp === "lineman" ? input.linemanOrderNumber?.trim() || null : null,
          linemanOrderId: input.deliveryApp === "lineman" ? input.linemanOrderId || null : null,
          orderAmount: input.orderAmount,
          orderDate: input.orderDate ? new Date(input.orderDate) : null,
          screenshotUrl, status: "pending",
        });
        const customer = await getCustomerById(ctx.hibiSession!.id);
        const branch = await getBranchById(input.branchId);
        const appLabels: Record<string, string> = { shopee: 'Shopee Food', lineman: 'LINE MAN', grab: 'Grab Food', gpos: 'GPOS (หน้าร้าน)' };
        // [DISABLED] notifyOwner - ขอสะสมแต้ม (ปิดเพื่อลดอีเมลแจ้งเตือน)
        // notifyOwner({ title: `🏷️ ขอสะสมแต้ม Delivery`, ... }).catch(...);
        await createAuditLog({ actorType: "customer", actorId: ctx.hibiSession!.id, actorName: customer?.name || null, action: "submit_point_claim", entity: "point_claim", entityId: id, details: `ขอสะสมแต้ม: ${input.deliveryApp} #${input.orderId} ยอด ${input.orderAmount} บาท`, afterData: { deliveryApp: input.deliveryApp, orderId: input.orderId, orderAmount: input.orderAmount } });
        return { id };
      } catch (err: any) {
        if (err.code === "ER_DUP_ENTRY") throw new TRPCError({ code: "CONFLICT", message: "❌ Order ID นี้ถูกขอสะสมแต้มไปแล้ว — หากต้องการส่งใหม่ กรุณาตรวจสอบเลขออเดอร์อีกครั้ง" });
        // Don't expose raw SQL errors to the client
        if (err instanceof TRPCError) throw err;
        console.error("[submitClaim] DB error:", err.message || err);
         throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "⚠️ เกิดข้อผิดพลาดในระบบ — กรุณาลองใหม่อีกครั้ง หากยังไม่ได้ กรุณาติดต่อร้านค้า" });
      }
    }),

    // My claims
    myClaims: hibiProtectedProcedure.query(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") return [];
      return listPointClaimsByCustomer(ctx.hibiSession!.id);
    }),

    // Staff: list claims queue
    claimsQueue: branchAdminProcedure.input(z.object({
      status: z.string().optional(),
      branchId: z.number().optional(),
      fromDate: z.date().optional(),
      toDate: z.date().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      const fromDate = input?.fromDate;
      const toDate = input?.toDate;
      if (ctx.hibiSession!.role === "super_admin") {
        return listPointClaims(input?.status, input?.branchId, fromDate, toDate);
      }
      // Branch admin can only see their own branch
      return listPointClaims(input?.status, staffMember?.branchId ?? undefined, fromDate, toDate);
    }),

    // Staff: claim detail
    claimDetail: branchAdminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const claim = await getPointClaimById(input.id);
      if (!claim) throw new TRPCError({ code: "NOT_FOUND" });
      const customer = await getCustomerById(claim.customerId);
      const branch = await getBranchById(claim.branchId);
      const lp = await getOrCreateLoyaltyPoints(claim.customerId);
      return { ...claim, customerName: customer?.name, customerPhone: customer?.phone, branchName: branch?.name, customerTier: lp.tier };
    }),

    // Staff: approve claim
    approveClaim: branchAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const claim = await getPointClaimById(input.id);
      if (!claim) throw new TRPCError({ code: "NOT_FOUND" });
      if (claim.status !== "pending" && claim.status !== "rejected") throw new TRPCError({ code: "BAD_REQUEST", message: "คำขอนี้ได้รับการพิจารณาแล้ว" });
      const previousStatus = claim.status;
      const lp = await getOrCreateLoyaltyPoints(claim.customerId);
      const points = calculatePoints(claim.orderAmount, lp.tier as any);
      const result = await addPoints(claim.customerId, points, "earn_delivery", claim.orderAmount, `สะสมแต้ม Delivery ${claim.deliveryApp} #${claim.orderId}`, claim.branchId, ctx.hibiSession!.id, "point_claim", claim.id);
      // Also add to branch-specific loyalty
      if (claim.branchId) {
        await addBranchPoints(claim.customerId, claim.branchId, points);
      }
      await updatePointClaim(input.id, { status: "approved", pointsAwarded: points, reviewedBy: ctx.hibiSession!.id, rejectionReason: null });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: previousStatus === "rejected" ? "reapprove_point_claim" : "approve_point_claim", entity: "point_claim", entityId: input.id, details: `${previousStatus === "rejected" ? "อนุมัติย้อนหลัง (จากปฏิเสธ)" : "อนุมัติ"}แต้ม ${points} pts (${claim.orderAmount} บาท)`, beforeData: { status: previousStatus }, afterData: { status: "approved", points } });
      return { success: true, pointsAwarded: points };
    }),

    // Staff: reject claim
    rejectClaim: branchAdminProcedure.input(z.object({
      id: z.number(),
      reason: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const claim = await getPointClaimById(input.id);
      if (!claim) throw new TRPCError({ code: "NOT_FOUND" });
      if (claim.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "คำขอนี้ได้รับการพิจารณาแล้ว" });
      await updatePointClaim(input.id, { status: "rejected", reviewedBy: ctx.hibiSession!.id, rejectionReason: input.reason || null });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "reject_point_claim", entity: "point_claim", entityId: input.id, details: `ปฏิเสธแต้ม: ${input.reason || 'ไม่ระบุเหตุผล'}`, beforeData: { status: "pending" }, afterData: { status: "rejected" } });
      return { success: true };
    }),

    // Rewards catalog (public)
    rewards: hibiProcedure.query(async () => {
      return listRewards(true);
    }),

    // All rewards (admin)
    allRewards: superAdminProcedure.query(async () => {
      return listRewards(false);
    }),

    // Upload reward image (admin)
    uploadRewardImage: superAdminProcedure.input(z.object({
      imageBase64: z.string().min(1),
      imageType: z.string().default("image/jpeg"),
    })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const ext = input.imageType.split("/")[1] || "jpg";
      const key = `rewards/${Date.now()}-${nanoid(8)}.${ext}`;
      const result = await storagePut(key, buffer, input.imageType);
      return { url: result.url };
    }),

    // Create reward (admin)
    createReward: superAdminProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      pointsCost: z.number().min(1),
      category: z.string().default("drink"),
      categoryId: z.number().optional(),
      imageUrl: z.string().optional(),
      stock: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      // Map Thai category names to enum values
      const thaiToEnum: Record<string, string> = { "เครื่องดื่ม": "drink", "อาหาร/ขนม": "food", "ท็อปปิ้ง": "topping", "ส่วนลด": "discount", "พิเศษ": "special" };
      const validEnums = ["drink", "food", "topping", "discount", "special"];
      const mappedCategory = thaiToEnum[input.category] || (validEnums.includes(input.category) ? input.category : "special");
      const id = await createReward({ name: input.name, description: input.description || null, pointsCost: input.pointsCost, category: mappedCategory as any, imageUrl: input.imageUrl || null, stock: input.stock ?? null });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_reward", entity: "reward", entityId: id, details: `สร้างรางวัล: ${input.name} (${input.pointsCost} pts)`, afterData: input });
      return { id };
    }),

    // Update reward (admin)
    updateReward: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      pointsCost: z.number().optional(),
      category: z.string().optional(),
      categoryId: z.number().optional(),
      imageUrl: z.string().optional(),
      stock: z.number().nullable().optional(),
      isActive: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      // Map Thai category names to enum values
      if (data.category) {
        const thaiToEnum: Record<string, string> = { "เครื่องดื่ม": "drink", "อาหาร/ขนม": "food", "ท็อปปิ้ง": "topping", "ส่วนลด": "discount", "พิเศษ": "special" };
        const validEnums = ["drink", "food", "topping", "discount", "special"];
        data.category = thaiToEnum[data.category] || (validEnums.includes(data.category) ? data.category : "special");
      }
      await updateReward(id, data as any);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_reward", entity: "reward", entityId: id, details: `อัปเดตรางวัล ID: ${id}`, afterData: data });
      return { success: true };
    }),

    // Delete reward (admin)
    deleteReward: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      const before = await getRewardById(input.id);
      if (!before) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบรางวัลนี้" });
      await deleteReward(input.id);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "delete_reward", entity: "reward", entityId: input.id, details: `ลบรางวัล: ${before.name} (${before.pointsCost} pts)`, beforeData: before, afterData: null });
      return { success: true };
    }),

    // Redeem reward (customer)
    redeemReward: hibiProtectedProcedure.input(z.object({
      rewardId: z.number(),
      branchId: z.number(), // ต้องระบุสาขาที่จะใช้แต้มแลก
    })).mutation(async ({ input, ctx }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const reward = await getRewardById(input.rewardId);
      if (!reward || !reward.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบรางวัลนี้" });
      if (reward.stock !== null && reward.stock <= 0) throw new TRPCError({ code: "BAD_REQUEST", message: "รางวัลนี้หมดแล้ว" });
      // ใช้แต้มสาขา (branch-specific) แทนแต้มรวม
      const spendResult = await spendBranchPoints(ctx.hibiSession!.id, input.branchId, reward.pointsCost);
      if (!spendResult.success) throw new TRPCError({ code: "BAD_REQUEST", message: spendResult.error });
      // หักแต้มรวมด้วยเพื่อให้ global points สอดคล้อง
      await spendPoints(ctx.hibiSession!.id, reward.pointsCost, "\u0e41\u0e25\u0e01\u0e23\u0e32\u0e07\u0e27\u0e31\u0e25: " + reward.name + " (\u0e2a\u0e32\u0e02\u0e32 #" + input.branchId + ")", "reward_redemption");
      // Generate redemption code
      const redemptionCode = "HIBI-PT-" + nanoid(6).toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      expiresAt.setHours(23, 59, 59, 999);
      const redemptionId = await createRewardRedemption({
        customerId: ctx.hibiSession!.id, rewardId: input.rewardId,
        pointsSpent: reward.pointsCost, status: "pending",
        redemptionCode, expiresAt, branchId: input.branchId,
      });
      // Update stock
      if (reward.stock !== null) {
        await updateReward(input.rewardId, { stock: reward.stock - 1 });
      }
      await createAuditLog({ actorType: "customer", actorId: ctx.hibiSession!.id, actorName: null, action: "redeem_reward", entity: "reward_redemption", entityId: redemptionId, details: "\u0e41\u0e25\u0e01\u0e23\u0e32\u0e07\u0e27\u0e31\u0e25: " + reward.name + " (" + reward.pointsCost + " pts) \u0e2a\u0e32\u0e02\u0e32 #" + input.branchId + " \u0e42\u0e04\u0e49\u0e14: " + redemptionCode, afterData: { rewardId: input.rewardId, pointsSpent: reward.pointsCost, redemptionCode, branchId: input.branchId } });
      return { redemptionCode, expiresAt, rewardName: reward.name, pointsSpent: reward.pointsCost, balance: spendResult.balance, branchId: input.branchId };
    }),

    // My redemptions
    myRedemptions: hibiProtectedProcedure.query(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") return [];
      const redemptions = await listRedemptionsByCustomer(ctx.hibiSession!.id);
      const result = [];
      for (const r of redemptions) {
        const reward = await getRewardById(r.rewardId);
        result.push({ ...r, rewardName: reward?.name, rewardCategory: reward?.category });
      }
      return result;
    }),

    // Staff: use redemption code
    useRedemption: staffProcedure.input(z.object({
      code: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      const redemption = await getRedemptionByCode(input.code);
      if (!redemption) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบโค้ดรางวัลนี้" });
      if (redemption.status === "used") throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ถูกใช้ไปแล้ว" });
      if (redemption.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ถูกยกเลิก" });
      if (new Date() > redemption.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้หมดอายุแล้ว" });
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      // ตรวจสอบสาขา — โค้ดรางวัลต้องใช้ที่สาขาที่แลกเท่านั้น
      if (redemption.branchId && staffMember?.branchId && redemption.branchId !== staffMember.branchId) {
        const rewardBranch = await getBranchById(redemption.branchId);
        const branchName = rewardBranch?.name || `สาขา #${redemption.branchId}`;
        throw new TRPCError({ code: "BAD_REQUEST", message: `โค้ดรางวัลนี้แลกจาก${branchName} ไม่สามารถใช้ที่สาขานี้ได้ กรุณาแจ้งลูกค้าใช้ที่สาขาที่แลกรางวัล` });
      }
      await updateRedemption(redemption.id, { status: "used", usedAt: new Date(), branchId: staffMember?.branchId ?? null });
      const reward = await getRewardById(redemption.rewardId);
      const customer = await getCustomerById(redemption.customerId);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "use_redemption", entity: "reward_redemption", entityId: redemption.id, details: `ใช้โค้ดรางวัล: ${input.code} (${reward?.name})`, afterData: { status: "used" } });
      return { success: true, rewardName: reward?.name, customerName: customer?.name };
    }),

    // Lookup redemption code
    lookupRedemption: staffProcedure.input(z.object({
      code: z.string().min(1),
    })).query(async ({ input }) => {
      const redemption = await getRedemptionByCode(input.code);
      if (!redemption) return null;
      const reward = await getRewardById(redemption.rewardId);
      const customer = await getCustomerById(redemption.customerId);
      return { ...redemption, rewardName: reward?.name, rewardCategory: reward?.category, customerName: customer?.name, customerPhone: customer?.phone };
    }),

    // Admin: loyalty stats
    stats: superAdminProcedure.query(async () => {
      return getLoyaltyStats();
    }),
    // Admin: earn_store history with date filter
    earnStoreHistory: branchAdminProcedure.input(z.object({
      limit: z.number().min(1).max(100).default(30),
      offset: z.number().min(0).default(0),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      const dateFrom = input?.dateFrom ? new Date(input.dateFrom) : undefined;
      const dateTo = input?.dateTo ? (() => { const d = new Date(input.dateTo); d.setHours(23, 59, 59, 999); return d; })() : undefined;
      return listEarnStoreHistory(input?.limit ?? 30, input?.offset ?? 0, dateFrom, dateTo);
    }),
  }),

  // ── Customer Database ──
  customerDb: router({
    list: requirePermission("view_customers").input(z.object({
      search: z.string().optional(),
      branchId: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return listAllCustomers(input?.search, 200, input?.branchId);
    }),
    stats: requirePermission("view_customers").query(async () => {
      return getCustomerStats();
    }),
  }),

  // ── Order Issues (C) ──
  orderIssues: router({
    submit: hibiProtectedProcedure.input(z.object({
      branchId: z.number(),
      deliveryApp: z.enum(["shopee", "lineman", "grab", "gpos", "walk_in"]),
      orderId: z.string().optional(),
      orderDetails: z.string().optional(),
      category: z.enum(["wrong_order", "missing_item", "quality", "late_delivery", "damaged", "other"]),
      description: z.string().min(10, "กรุณาอธิบายปัญหาอย่างน้อย 10 ตัวอักษร"),
      // Legacy single image (backward compatible)
      imageBase64: z.string().optional(),
      imageType: z.string().optional(),
      // Multi-image upload (up to 5)
      images: z.array(z.object({
        base64: z.string(),
        type: z.string().default("image/jpeg"),
      })).max(5).optional(),
    })).mutation(async ({ input, ctx }) => {
      // Validate order ID format per delivery app
      if (input.orderId && input.deliveryApp !== "walk_in") {
        const valid = validateOrderId(input.deliveryApp, input.orderId);
        if (!valid.ok) throw new TRPCError({ code: "BAD_REQUEST", message: valid.message });
      }
      // Upload legacy single image to S3 (backward compat)
      let imageUrl: string | null = null;
      if (input.imageBase64) {
        const buffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.imageType?.split("/")[1] || "jpg";
        const key = `issues/${ctx.hibiSession!.id}-${Date.now()}-${nanoid(6)}.${ext}`;
        const result = await storagePut(key, buffer, input.imageType || "image/jpeg");
        imageUrl = result.url;
      }
      const now = new Date();
      const slaResponseDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24h
      const slaResolutionDeadline = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48h
      const id = await createOrderIssue({
        customerId: ctx.hibiSession!.id,
        branchId: input.branchId,
        deliveryApp: input.deliveryApp,
        orderId: input.orderId || null,
        orderDetails: input.orderDetails || null,
        category: input.category,
        description: input.description,
        imageUrl,
        slaResponseDeadline,
        slaResolutionDeadline,
      } as any);
      // Upload multiple images to S3 and store in order_issue_images table
      const uploadedUrls: string[] = [];
      if (input.images && input.images.length > 0) {
        for (const img of input.images) {
          const buffer = Buffer.from(img.base64, "base64");
          const ext = img.type.split("/")[1] || "jpg";
          const key = `issues/${ctx.hibiSession!.id}-${Date.now()}-${nanoid(6)}.${ext}`;
          const result = await storagePut(key, buffer, img.type);
          uploadedUrls.push(result.url);
        }
        await addOrderIssueImages(id, uploadedUrls);
      } else if (imageUrl) {
        // If only legacy single image, also store in images table for consistency
        await addOrderIssueImages(id, [imageUrl]);
      }
      await createAuditLog({ actorType: "customer", actorId: ctx.hibiSession!.id, actorName: null, action: "submit_order_issue", entity: "order_issue", entityId: id, details: `แจ้งปัญหาออเดอร์: ${input.category} (${uploadedUrls.length || (imageUrl ? 1 : 0)} รูป)` });

      // Notify owner about new issue (auto-send to branch)
      const branch = await getBranchById(input.branchId);
      const customer = await getCustomerById(ctx.hibiSession!.id);
      const categoryLabels: Record<string, string> = { wrong_order: "ออเดอร์ผิด", missing_item: "ของขาด/ไม่ครบ", quality: "คุณภาพไม่ดี", late_delivery: "จัดส่งล่าช้า", damaged: "สินค้าเสียหาย", other: "อื่นๆ" };
      const appLabels: Record<string, string> = { shopee: "Shopee Food", lineman: "LINE MAN", grab: "Grab Food", gpos: "GPOS (หน้าร้าน)", walk_in: "หน้าร้าน" };
      // [DISABLED] notifyOwner - แจ้งปัญหาออเดอร์ (ปิดเพื่อลดอีเมลแจ้งเตือน)
      // notifyOwner({ title: `แจ้งปัญหาออเดอร์`, ... }).catch(...);

      // Send in-app staff notification to branch manager/owner
      const notifTitle = `⚠️ ปัญหาออเดอร์ใหม่: ${categoryLabels[input.category] || input.category}`;
      const notifMessage = `ลูกค้า ${customer?.name || "ไม่ระบุ"} แจ้งปัญหา (${appLabels[input.deliveryApp] || input.deliveryApp}) - สาขา ${branch?.name || ""}`;
      notifyBranchStaff(input.branchId, {
        type: "new_order_issue",
        title: notifTitle,
        message: notifMessage,
        relatedEntity: "order_issue",
        relatedEntityId: id,
        isRead: 0,
      }).catch(() => {});

      // Send push notification to branch staff
      sendPushToBranch(input.branchId, notifTitle, notifMessage, `/branch/order-issues`).catch(() => {});

      return { id };
    }),
    myIssues: hibiProtectedProcedure.query(async ({ ctx }) => {
      return listOrderIssuesByCustomer(ctx.hibiSession!.id);
    }),
    list: hibiProcedure.input(z.object({
      branchId: z.number().optional(),
      status: z.string().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      const role = ctx.hibiSession!.role;
      const dateFrom = input?.dateFrom ? new Date(input.dateFrom) : undefined;
      const dateTo = input?.dateTo ? (() => { const d = new Date(input!.dateTo!); d.setHours(23, 59, 59, 999); return d; })() : undefined;
      if (role === "super_admin") {
        // Super admin: see all or filter by branch
        return listOrderIssues(input?.branchId, input?.status, dateFrom, dateTo);
      }
      if (role === "area_manager") {
        // Area manager: see assigned branches or filter by specific branch
        const assignedBranches = await getStaffBranches(ctx.hibiSession!.id);
        const branchIds = assignedBranches.map(b => b.branchId);
        if (branchIds.length === 0) return [];
        if (input?.branchId) {
          if (!branchIds.includes(input.branchId)) return [];
          return listOrderIssues(input.branchId, input?.status, dateFrom, dateTo);
        }
        return listOrderIssuesByBranchIds(branchIds, input?.status);
      }
      // Branch staff: see own branch only — resolve branchId from staff record (JWT doesn't have it)
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      const brId = staffMember?.branchId ?? undefined;
      if (!brId) return []; // ถ้าไม่มี branchId ไม่ให้เห็นอะไร
      return listOrderIssues(brId, input?.status, dateFrom, dateTo);
    }),
    pendingCount: hibiProcedure.query(async ({ ctx }) => {
      const role = ctx.hibiSession!.role;
      const PENDING_STATUSES = ["open", "acknowledged", "in_progress", "escalated"];
      let issues: any[] = [];
      if (role === "super_admin") {
        issues = await listOrderIssues();
      } else if (role === "area_manager") {
        const assignedBranches = await getStaffBranches(ctx.hibiSession!.id);
        const branchIds = assignedBranches.map(b => b.branchId);
        if (branchIds.length === 0) return { count: 0 };
        issues = await listOrderIssuesByBranchIds(branchIds);
      } else {
        // branch_manager, branch_owner, etc.
        const staffMember = await getStaffById(ctx.hibiSession!.id);
        const brId = staffMember?.branchId ?? undefined;
        if (!brId) return { count: 0 };
        issues = await listOrderIssues(brId);
      }
      const count = issues.filter((i: any) => PENDING_STATUSES.includes(i.issue?.status)).length;
      return { count };
    }),
    getById: hibiProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getOrderIssueById(input.id);
    }),
    acknowledge: hibiProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await updateOrderIssue(input.id, { status: "acknowledged" as any, acknowledgedAt: new Date(), assignedTo: ctx.hibiSession!.id });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "acknowledge_issue", entity: "order_issue", entityId: input.id, details: "รับทราบปัญหาแล้ว" });
      return { success: true };
    }),
    resolve: hibiProcedure.input(z.object({
      id: z.number(),
      resolution: z.string().min(1),
    })).mutation(async ({ input, ctx }) => {
      await updateOrderIssue(input.id, { status: "resolved" as any, resolution: input.resolution, resolvedAt: new Date() });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "resolve_issue", entity: "order_issue", entityId: input.id, details: `แก้ไขปัญหา: ${input.resolution}` });
      return { success: true };
    }),
    escalate: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await updateOrderIssue(input.id, { status: "escalated" as any, escalatedAt: new Date() });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "escalate_issue", entity: "order_issue", entityId: input.id, details: "ส่งต่อปัญหาไปยัง Super Admin" });
      return { success: true };
    }),
    // Admin adds note/guideline for branch to follow
    addAdminNote: hibiProcedure.input(z.object({
      id: z.number(),
      adminNote: z.string().min(1, "กรุณาเขียนข้อความ"),
    })).mutation(async ({ input, ctx }) => {
      await updateOrderIssue(input.id, { adminNote: input.adminNote } as any);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "add_admin_note", entity: "order_issue", entityId: input.id, details: `เพิ่มคำแนะนำ: ${input.adminNote.substring(0, 100)}` });
      return { success: true };
    }),
    // Admin reassigns issue to different branch
    reassign: superAdminProcedure.input(z.object({
      id: z.number(),
      branchId: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const branch = await getBranchById(input.branchId);
      await updateOrderIssue(input.id, { branchId: input.branchId, status: "open" as any, assignedTo: null } as any);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "reassign_issue", entity: "order_issue", entityId: input.id, details: `ส่งต่อปัญหาไปสาขา: ${branch?.name || input.branchId}` });
      notifyOwner({
        title: `ส่งต่อปัญหา → ${branch?.name || "สาขา #" + input.branchId}`,
        content: `ส่งต่อปัญหาออเดอร์ #${input.id} ไปยังสาขา ${branch?.name || input.branchId}\nกรุณาตรวจสอบและดำเนินการ`
      }).catch(err => console.warn('[Notification] Failed:', err));
      return { success: true };
    }),
    // Get suggested guideline based on issue category
    getSuggestedGuideline: hibiProcedure.input(z.object({
      category: z.string(),
    })).query(({ input }) => {
      const guidelines: Record<string, { title: string; steps: string[]; tips: string }> = {
        wrong_order: {
          title: "แนวทางแก้ไข: ออเดอร์ผิด",
          steps: [
            "ตรวจสอบออเดอร์ต้นฉบับจากระบบ/แอปเดลิเวอรี",
            "ยืนยันกับลูกค้าว่าได้รับเมนูอะไร vs สั่งอะไร",
            "หากเป็นความผิดของร้าน → ออกโค้ดชดเชยเมนูที่ถูกต้อง",
            "หากเป็นความผิดของแอป → แนะนำลูกค้าติดต่อแอปเดลิเวอรี",
            "บันทึกสาเหตุเพื่อป้องกันไม่ให้เกิดซ้ำ",
          ],
          tips: "ควรตอบกลับลูกค้าภายใน 1 ชม. เพื่อความพึงพอใจ",
        },
        missing_item: {
          title: "แนวทางแก้ไข: ของขาด/ไม่ครบ",
          steps: [
            "ตรวจสอบรายการสั่งซื้อกับใบเสร็จ/ระบบ",
            "ยืนยันรายการที่ขาดกับลูกค้า",
            "ออกโค้ดชดเชยสำหรับรายการที่ขาด",
            "ตรวจสอบกระบวนการจัดเตรียมออเดอร์ของสาขา",
            "แจ้งทีมครัว/บาร์ให้ตรวจสอบก่อนส่ง",
          ],
          tips: "ควรมี checklist ตรวจสอบก่อนส่งออเดอร์",
        },
        quality: {
          title: "แนวทางแก้ไข: คุณภาพไม่ดี",
          steps: [
            "สอบถามรายละเอียดปัญหาคุณภาพจากลูกค้า",
            "ตรวจสอบวัตถุดิบและกระบวนการทำ",
            "ออกโค้ดชดเชยเมนูเดิมหรือเมนูทดแทน",
            "ตรวจสอบอุณหภูมิตู้เย็น/เครื่องชง",
            "ทบทวน SOP การทำเครื่องดื่ม",
          ],
          tips: "ปัญหาคุณภาพอาจเกิดจากวัตถุดิบหมดอายุ ควรตรวจสอบ",
        },
        late_delivery: {
          title: "แนวทางแก้ไข: จัดส่งล่าช้า",
          steps: [
            "ตรวจสอบเวลาที่ออเดอร์เข้า vs เวลาที่ส่ง",
            "หากล่าช้าจากร้าน → ขอโทษและออกโค้ดชดเชย",
            "หากล่าช้าจากไรเดอร์ → แนะนำลูกค้าติดต่อแอป",
            "ตรวจสอบว่าสาขามีคิวงานมากเกินไปหรือไม่",
            "ปรับเวลาเตรียมออเดอร์ในระบบเดลิเวอรี",
          ],
          tips: "ควรตั้งเวลาเตรียมที่สมจริงในแอปเดลิเวอรี",
        },
        damaged: {
          title: "แนวทางแก้ไข: สินค้าเสียหาย",
          steps: [
            "ขอรูปถ่ายหลักฐานจากลูกค้า (ถ้ายังไม่มี)",
            "ตรวจสอบว่าเสียหายจากการจัดส่งหรือการแพ็ค",
            "ออกโค้ดชดเชยเมนูที่เสียหาย",
            "ปรับปรุงวิธีแพ็คสินค้าให้แน่นหนาขึ้น",
            "แจ้งทีมแพ็คให้ระวังเรื่องการปิดฝา/ห่อ",
          ],
          tips: "ใช้ถุงกันหก + ปิดฝาให้แน่น ลดปัญหาได้มาก",
        },
        other: {
          title: "แนวทางแก้ไข: ปัญหาอื่นๆ",
          steps: [
            "สอบถามรายละเอียดเพิ่มเติมจากลูกค้า",
            "ประเมินความรุนแรงของปัญหา",
            "หากเป็นเรื่องบริการ → ตักเตือนพนักงาน + ขอโทษลูกค้า",
            "พิจารณาออกโค้ดชดเชยตามความเหมาะสม",
            "รายงาน HQ หากเป็นปัญหาร้ายแรง",
          ],
          tips: "ทุกปัญหาควรได้รับการตอบกลับอย่างสุภาพและรวดเร็ว",
        },
      };
      return guidelines[input.category] || guidelines.other;
    }),
    close: hibiProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await updateOrderIssue(input.id, { status: "closed" as any });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "close_issue", entity: "order_issue", entityId: input.id, details: "ปิดเรื่องร้องเรียน" });
      return { success: true };
    }),
    // Clear resolution text (so user can re-write)
    clearResolution: hibiProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await updateOrderIssue(input.id, { resolution: null, status: "acknowledged" as any } as any);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "clear_resolution", entity: "order_issue", entityId: input.id, details: "ลบข้อความการแก้ไขเพื่อเขียนใหม่" });
      return { success: true };
    }),
    // Clear admin note text (so user can re-write)
    clearAdminNote: hibiProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await updateOrderIssue(input.id, { adminNote: null } as any);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "clear_admin_note", entity: "order_issue", entityId: input.id, details: "ลบข้อความจากทางร้านเพื่อเขียนใหม่" });
      return { success: true };
    }),
    overdue: superAdminProcedure.query(async () => {
      return getOverdueSlaIssues();
    }),
    stats: superAdminProcedure.query(async () => {
      return getIssueStats();
    }),
  }),

  // ── Contact Inquiries (D/F/I) — public, no login required ──
  inquiries: router({
    submit: publicProcedure.input(z.object({
      type: z.enum(["franchise", "wholesale", "event", "other"]),
      name: z.string().min(1).max(255),
      phone: z.string().min(9).max(15),
      email: z.string().email().max(320).optional(),
      company: z.string().max(255).optional(),
      message: z.string().min(10).max(5000),
      budget: z.string().max(100).optional(),
      province: z.string().max(100).optional(),
    })).mutation(async ({ input }) => {
      // Spam protection: 3 inquiries per phone per hour
      const rl = rateLimit(`inquiry:${input.phone.replace(/\D/g, "")}`, 3, 60 * 60 * 1000);
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `ส่งข้อความติดต่อบ่อยเกินไป — กรุณารอ ${Math.ceil(rl.resetSec / 60)} นาที`,
        });
      }
      const id = await createContactInquiry(input as any);
      const typeLabels: Record<string, string> = { franchise: "แฟรนไชส์", wholesale: "สั่งซื้อราคาส่ง", event: "จัดงาน Event", other: "อื่นๆ" };
      // Notify owner - เฉพาะแฟรนไชส์และจัดงาน Event เท่านั้น
      if (input.type === "franchise" || input.type === "event") {
        await notifyOwner({ title: `📩 ติดต่อใหม่: ${typeLabels[input.type] || input.type}`, content: `ชื่อ: ${input.name}\nเบอร์: ${input.phone}\nประเภท: ${typeLabels[input.type]}\nข้อความ: ${input.message}` });
      }
      // Auto-reply email to customer (non-blocking)
      if (input.email) {
        const { subject, html } = buildAutoReplyEmail(input);
        sendEmail({ to: input.email, subject, html }).catch((err) => console.warn("[Email] Auto-reply failed:", err));
      }
      return { id, message: "ส่งข้อมูลเรียบร้อย ทีมงานจะติดต่อกลับโดยเร็ว" };
    }),
    list: superAdminProcedure.input(z.object({
      type: z.string().optional(),
      status: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      return listContactInquiries(input?.type, input?.status);
    }),
    getById: superAdminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getContactInquiryById(input.id);
    }),
    updateStatus: superAdminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["new", "contacted", "in_progress", "closed"]),
      notes: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      await updateContactInquiry(input.id, { status: input.status as any, notes: input.notes, handledBy: ctx.hibiSession!.id });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_inquiry", entity: "contact_inquiry", entityId: input.id, details: `อัปเดตสถานะ: ${input.status}` });
      return { success: true };
    }),
    sendEmail: superAdminProcedure.input(z.object({
      id: z.number(),
      message: z.string().min(5, "ข้อความต้องมีอย่างน้อย 5 ตัวอักษร"),
    })).mutation(async ({ input, ctx }) => {
      const inquiry = await getContactInquiryById(input.id);
      if (!inquiry) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบข้อมูลติดต่อ" });
      if (!inquiry.email) throw new TRPCError({ code: "BAD_REQUEST", message: "ลูกค้าไม่ได้ระบุอีเมล" });
      const { subject, html } = buildFollowUpEmail({
        customerName: inquiry.name,
        inquiryType: inquiry.type,
        adminMessage: input.message,
        adminName: (ctx.hibiSession as any)?.name || "ทีมงาน Hibi Matcha",
      });
      const result = await sendEmail({ to: inquiry.email, subject, html });
      if (!result.success) {
        console.warn("[Email] Follow-up send failed:", result.error);
      }
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "send_email", entity: "contact_inquiry", entityId: input.id, details: `ส่งอีเมลตอบกลับ: ${inquiry.email}` });
      return { success: true, emailSent: result.success };
    }),
  }),

  // ── Free Drink Campaigns (HQ) ──
  freeDrinkCampaigns: router({
    // List all campaigns (admin)
    list: superAdminProcedure.query(async () => {
      return listFreeDrinkCampaigns();
    }),

    // List active campaigns (for code generation)
    listActive: branchAdminProcedure.query(async () => {
      return listFreeDrinkCampaigns(true);
    }),

    // Get campaign by ID
    getById: branchAdminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getFreeDrinkCampaignById(input.id);
    }),

    // Create campaign (super admin)
    create: superAdminProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      menuOptions: z.array(z.object({
        code: z.string().min(1).max(10),
        name: z.string().min(1),
        sizes: z.array(z.object({ code: z.string().min(1).max(10), name: z.string().min(1) })).min(1),
        milkOptions: z.array(z.object({ code: z.string().min(1).max(10), name: z.string().min(1) })).optional(),
      })).min(1),
      maxCodesPerCustomer: z.number().min(1).default(1),
      validFrom: z.string(),
      validUntil: z.string(),
      branchScope: z.array(z.number()).optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await createFreeDrinkCampaign({
        name: input.name,
        description: input.description || null,
        menuOptions: input.menuOptions,
        maxCodesPerCustomer: input.maxCodesPerCustomer,
        validFrom: new Date(input.validFrom),
        validUntil: (() => { const d = new Date(input.validUntil); d.setHours(23, 59, 59, 999); return d; })(),
        branchScope: input.branchScope || null,
        createdBy: ctx.hibiSession!.id,
      });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_campaign", entity: "free_drink_campaign", entityId: id, details: `สร้างแคมเปญ: ${input.name}` });
      return { id };
    }),

    // Update campaign
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      menuOptions: z.array(z.object({
        code: z.string().min(1).max(10),
        name: z.string().min(1),
        sizes: z.array(z.object({ code: z.string().min(1).max(10), name: z.string().min(1) })).min(1),
        milkOptions: z.array(z.object({ code: z.string().min(1).max(10), name: z.string().min(1) })).optional(),
      })).optional(),
      maxCodesPerCustomer: z.number().optional(),
      validFrom: z.string().optional(),
      validUntil: z.string().optional(),
      isActive: z.number().min(0).max(1).optional(),
      branchScope: z.array(z.number()).nullable().optional(),
    })).mutation(async ({ input, ctx }) => {
      const data: any = {};
      if (input.name !== undefined) data.name = input.name;
      if (input.description !== undefined) data.description = input.description;
      if (input.menuOptions !== undefined) data.menuOptions = input.menuOptions;
      if (input.maxCodesPerCustomer !== undefined) data.maxCodesPerCustomer = input.maxCodesPerCustomer;
      if (input.validFrom !== undefined) data.validFrom = new Date(input.validFrom);
      if (input.validUntil !== undefined) { const d = new Date(input.validUntil); d.setHours(23, 59, 59, 999); data.validUntil = d; }
      if (input.isActive !== undefined) data.isActive = input.isActive;
      if (input.branchScope !== undefined) data.branchScope = input.branchScope;
      await updateFreeDrinkCampaign(input.id, data);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_campaign", entity: "free_drink_campaign", entityId: input.id, details: `อัปเดตแคมเปญ` });
      return { success: true };
    }),
  }),

  // ── Free Drink Codes ──
  freeDrinkCodes: router({
    // Issue code to customer (staff/admin)
    issue: branchAdminProcedure.input(z.object({
      campaignId: z.number(),
      customerId: z.number(),
      branchId: z.number(),
      menuCode: z.string(),
      menuName: z.string(),
      sizeCode: z.string(),
      sizeName: z.string(),
      milkCode: z.string().optional(),
      milkName: z.string().optional(),
      sourceType: z.enum(["review", "claim", "campaign", "manual"]).default("campaign"),
      sourceId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const campaign = await getFreeDrinkCampaignById(input.campaignId);
      if (!campaign || !campaign.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "แคมเปญไม่พร้อมใช้งาน" });
      const now = new Date();
      if (now < campaign.validFrom || now > campaign.validUntil) throw new TRPCError({ code: "BAD_REQUEST", message: "แคมเปญหมดอายุหรือยังไม่เริ่ม" });
      // Check branch scope
      if (campaign.branchScope) {
        const allowedBranches = campaign.branchScope as number[];
        if (!allowedBranches.includes(input.branchId)) throw new TRPCError({ code: "BAD_REQUEST", message: "สาขานี้ไม่อยู่ในขอบเขตแคมเปญ" });
      }
      // Check max codes per customer
      const count = await countFreeDrinkCodesByCustomerCampaign(input.customerId, input.campaignId);
      if (count >= campaign.maxCodesPerCustomer) throw new TRPCError({ code: "BAD_REQUEST", message: `ลูกค้าได้รับโค้ดครบ ${campaign.maxCodesPerCustomer} ครั้งแล้ว` });
      // Generate readable code
      const code = await generateFreeDrinkCode(input.menuCode, input.sizeCode, input.milkCode);
      const id = await createFreeDrinkCode({
        code, campaignId: input.campaignId, customerId: input.customerId, branchId: input.branchId,
        menuCode: input.menuCode, menuName: input.menuName, sizeCode: input.sizeCode, sizeName: input.sizeName,
        milkCode: input.milkCode || null, milkName: input.milkName || null,
        expiresAt: campaign.validUntil, sourceType: input.sourceType, sourceId: input.sourceId || null,
      });
      const customer = await getCustomerById(input.customerId);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "issue_free_drink_code", entity: "free_drink_code", entityId: id, details: `ออกโค้ด ${code} ให้ ${customer?.name || 'N/A'} (${input.menuName} ${input.sizeName} ${input.milkName || ''})` });
      return { id, code };
    }),

    // Customer: list my free drink codes
    myCodes: hibiProtectedProcedure.query(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      return listFreeDrinkCodesByCustomer(ctx.hibiSession!.id);
    }),

    // Customer: redeem code (enter code to auto-order)
    redeem: hibiProtectedProcedure.input(z.object({
      code: z.string().min(1),
      branchId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const codeRecord = await getFreeDrinkCodeByCode(input.code.toUpperCase().trim());
      if (!codeRecord) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบโค้ดนี้" });
      if (codeRecord.customerId !== ctx.hibiSession!.id) throw new TRPCError({ code: "FORBIDDEN", message: "โค้ดนี้ไม่ใช่ของคุณ" });
      if (codeRecord.status === "redeemed") throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ถูกใช้แล้ว" });
      if (codeRecord.status === "expired" || codeRecord.status === "cancelled") throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้หมดอายุหรือถูกยกเลิก" });
      if (new Date() > codeRecord.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้หมดอายุแล้ว" });
      // Check branch scope - code must be redeemed at the same branch it was issued
      if (codeRecord.branchId !== input.branchId) throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ใช้ได้เฉพาะสาขาที่ออกให้เท่านั้น" });
      return {
        id: codeRecord.id,
        code: codeRecord.code,
        menuName: codeRecord.menuName,
        sizeName: codeRecord.sizeName,
        milkName: codeRecord.milkName,
        branchId: codeRecord.branchId,
        status: "ready_to_confirm",
        message: `แก้วแถม: ${codeRecord.menuName} (${codeRecord.sizeName}${codeRecord.milkName ? ', ' + codeRecord.milkName : ''})`,
      };
    }),

    // Customer: confirm redemption
    confirmRedeem: hibiProtectedProcedure.input(z.object({
      code: z.string().min(1),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const codeRecord = await getFreeDrinkCodeByCode(input.code.toUpperCase().trim());
      if (!codeRecord) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบโค้ดนี้" });
      if (codeRecord.customerId !== ctx.hibiSession!.id) throw new TRPCError({ code: "FORBIDDEN" });
      if (codeRecord.status !== "issued") throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ไม่สามารถใช้ได้" });
      await redeemFreeDrinkCode(codeRecord.code, codeRecord.branchId, 0); // 0 = self-redeemed by customer
      return { success: true, message: `ใช้โค้ดสำเร็จ: ${codeRecord.menuName} (${codeRecord.sizeName}${codeRecord.milkName ? ', ' + codeRecord.milkName : ''})` };
    }),

    // Staff: redeem code at counter
    staffRedeem: staffProcedure.input(z.object({
      code: z.string().min(1),
      branchId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const codeRecord = await getFreeDrinkCodeByCode(input.code.toUpperCase().trim());
      if (!codeRecord) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบโค้ดนี้" });
      if (codeRecord.status !== "issued") throw new TRPCError({ code: "BAD_REQUEST", message: `โค้ดนี้สถานะ: ${codeRecord.status}` });
      if (new Date() > codeRecord.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้หมดอายุแล้ว" });
      if (codeRecord.branchId !== input.branchId) throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ใช้ได้เฉพาะสาขาที่ออกให้" });
      await redeemFreeDrinkCode(codeRecord.code, input.branchId, ctx.hibiSession!.id);
      const customer = await getCustomerById(codeRecord.customerId);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "redeem_free_drink", entity: "free_drink_code", entityId: codeRecord.id, details: `ใช้โค้ด ${codeRecord.code} (${codeRecord.menuName}) ลูกค้า: ${customer?.name || 'N/A'}` });
      return {
        success: true,
        menuName: codeRecord.menuName,
        sizeName: codeRecord.sizeName,
        milkName: codeRecord.milkName,
        customerName: customer?.name || "N/A",
      };
    }),

    // Admin: list codes by campaign
    listByCampaign: superAdminProcedure.input(z.object({ campaignId: z.number() })).query(async ({ input }) => {
      return listFreeDrinkCodesByCampaign(input.campaignId);
    }),
  }),

  // ── Branch Loyalty ──
  branchLoyalty: router({
    // Customer: get my branch points
    myBranchPoints: hibiProtectedProcedure.query(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const branchPoints = await listBranchLoyaltyByCustomer(ctx.hibiSession!.id);
      const allBranches = await listBranches();
      return branchPoints.map(bp => {
        const branch = allBranches.find(b => b.id === bp.branchId);
        return { ...bp, branchName: branch?.name || "ไม่ทราบสาขา", available: bp.totalPoints - bp.usedPoints };
      });
    }),

    // Customer: get points for specific branch
    getForBranch: hibiProtectedProcedure.input(z.object({ branchId: z.number() })).query(async ({ ctx, input }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const blp = await getOrCreateBranchLoyalty(ctx.hibiSession!.id, input.branchId);
      return { ...blp, available: blp.totalPoints - blp.usedPoints };
    }),
  }),

  // ── Customer Consents (PDPA) ──
  consent: router({
    // Check if customer has accepted required consents
    check: hibiProtectedProcedure.query(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const pdpa = await hasAcceptedConsent(ctx.hibiSession!.id, "pdpa", "1.0");
      const terms = await hasAcceptedConsent(ctx.hibiSession!.id, "terms", "1.0");
      return { pdpa, terms, allAccepted: pdpa && terms };
    }),

    // Accept consent
    accept: hibiProtectedProcedure.input(z.object({
      consentType: z.enum(["pdpa", "terms", "marketing"]),
      version: z.string().default("1.0"),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const already = await hasAcceptedConsent(ctx.hibiSession!.id, input.consentType, input.version);
      if (already) return { success: true, alreadyAccepted: true };
      await createCustomerConsent({
        customerId: ctx.hibiSession!.id,
        consentType: input.consentType,
        version: input.version,
        accepted: 1,
      });
      return { success: true, alreadyAccepted: false };
    }),

    // Accept all required consents at once (PDPA + Terms)
    acceptAll: hibiProtectedProcedure.mutation(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const version = "1.0";
      const pdpa = await hasAcceptedConsent(ctx.hibiSession!.id, "pdpa", version);
      if (!pdpa) await createCustomerConsent({ customerId: ctx.hibiSession!.id, consentType: "pdpa", version, accepted: 1 });
      const terms = await hasAcceptedConsent(ctx.hibiSession!.id, "terms", version);
      if (!terms) await createCustomerConsent({ customerId: ctx.hibiSession!.id, consentType: "terms", version, accepted: 1 });
      return { success: true };
    }),

    // Get consent history
    history: hibiProtectedProcedure.query(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      return getCustomerConsents(ctx.hibiSession!.id);
    }),
  }),

  // ── Announcements ──
  announcements: router({
    // Public: list active announcements for customers
    listActive: publicProcedure.query(async () => {
      return listAnnouncements(true);
    }),

    // Public: list active announcements filtered by category
    listByCategory: publicProcedure
      .input(z.object({ category: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const results = await listAnnouncementsByCategory(input.category, true);
        // Filter by audience: customers only see 'customer' or 'both'
        const hibiSession = (ctx as any).hibiSession;
        if (hibiSession && hibiSession.type === 'staff') {
          const staffBranchId = hibiSession.branchId;
          return results.filter((a: any) => {
            if (a.audienceType === 'customer') return false;
            // staff or both: check staffBranchIds
            if (a.staffBranchIds) {
              const ids = JSON.parse(a.staffBranchIds) as number[];
              return ids.includes(staffBranchId);
            }
            return true; // null = all branches
          });
        }
        // Customer or public: only show customer/both
        return results.filter((a: any) => a.audienceType === 'customer' || a.audienceType === 'both');
      }),

    // Admin: list all announcements
    listAll: superAdminProcedure.query(async () => {
      return listAnnouncements(false);
    }),

    // Admin: create announcement
    create: superAdminProcedure
      .input(z.object({
        title: z.string().min(1, "กรุณาใส่หัวข้อ"),
        content: z.string().min(1, "กรุณาใส่เนื้อหา"),
        type: z.enum(["announcement", "promotion", "event"]).default("announcement"),
        targetGroup: z.enum(["all", "green", "gold", "matcha"]).default("all"),
        audienceType: z.enum(["customer", "staff", "both"]).default("customer"),
        staffBranchIds: z.array(z.number()).nullish(),
        imageUrl: z.string().nullish(),
        promoCode: z.string().nullish(),
        discountText: z.string().nullish(),
        startDate: z.date().optional(),
        endDate: z.date().nullish(),
        isPinned: z.boolean().default(false),
        scheduledAt: z.date().nullish(),
        branchId: z.number().nullish(),
      }))
      .mutation(async ({ input }) => {
        const id = await createAnnouncement({
          title: input.title,
          content: input.content,
          type: input.type,
          targetGroup: input.targetGroup,
          audienceType: input.audienceType,
          staffBranchIds: input.staffBranchIds ? JSON.stringify(input.staffBranchIds) : null,
          imageUrl: input.imageUrl ?? null,
          promoCode: input.promoCode ?? null,
          discountText: input.discountText ?? null,
          startDate: input.scheduledAt ?? input.startDate ?? new Date(),
          endDate: input.endDate ?? null,
          isPinned: input.isPinned ? 1 : 0,
          scheduledAt: input.scheduledAt ?? null,
          branchId: input.branchId ?? null,
        });
        // If no schedule (publish now), send push notifications immediately
        if (!input.scheduledAt) {
          sendPushToAll(input.title, input.content, input.type).catch(() => {});
        }
        return { id };
      }),

    // Admin: update announcement
    update: superAdminProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).optional(),
        content: z.string().min(1).optional(),
        type: z.enum(["announcement", "promotion", "event"]).optional(),
        targetGroup: z.enum(["all", "green", "gold", "matcha"]).optional(),
        audienceType: z.enum(["customer", "staff", "both"]).optional(),
        staffBranchIds: z.array(z.number()).nullish(),
        imageUrl: z.string().nullish(),
        promoCode: z.string().nullish(),
        discountText: z.string().nullish(),
        startDate: z.date().optional(),
        endDate: z.date().nullish(),
        isActive: z.boolean().optional(),
        isPinned: z.boolean().optional(),
        scheduledAt: z.date().nullish(),
        branchId: z.number().nullish(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.isActive !== undefined) updateData.isActive = data.isActive ? 1 : 0;
        if (data.isPinned !== undefined) updateData.isPinned = data.isPinned ? 1 : 0;
        if (data.scheduledAt !== undefined) {
          updateData.scheduledAt = data.scheduledAt;
          if (data.scheduledAt) {
            updateData.startDate = data.scheduledAt;
          }
        }
        if (data.branchId !== undefined) updateData.branchId = data.branchId;
        if (data.staffBranchIds !== undefined) updateData.staffBranchIds = data.staffBranchIds ? JSON.stringify(data.staffBranchIds) : null;
        await updateAnnouncement(id, updateData);
        return { success: true };
      }),

    // Admin: announcement read analytics (pass array of announcement IDs)
    readStats: superAdminProcedure
      .input(z.object({ announcementIds: z.array(z.number()) }))
      .query(async ({ input }) => {
        return getAnnouncementReadStats(input.announcementIds);
      }),

    // Admin: detailed reader list for specific announcement
    readDetail: superAdminProcedure
      .input(z.object({ announcementId: z.number() }))
      .query(async ({ input }) => {
        return getAnnouncementReaders(input.announcementId);
      }),

    // Admin: delete announcement
    delete: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAnnouncement(input.id);
        return { success: true };
      }),

    // Admin: toggle active
    toggleActive: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const ann = await getAnnouncementById(input.id);
        if (!ann) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบประกาศ" });
        await updateAnnouncement(input.id, { isActive: ann.isActive ? 0 : 1 });
        return { success: true };
      }),

    // Admin: send push notification for an existing announcement
    sendPush: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const ann = await getAnnouncementById(input.id);
        if (!ann) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบประกาศ" });
        const sent = await sendPushToAll(ann.title, ann.content, ann.type);
        return { sent };
      }),

    // Customer: get unread announcement count
    unreadCount: hibiProtectedProcedure.query(async ({ ctx }) => {
      if (ctx.hibiSession!.type !== "customer") return { count: 0 };
      const count = await getUnreadAnnouncementCount(ctx.hibiSession!.id);
      return { count };
    }),

    // Customer: mark one announcement as read
    markRead: hibiProtectedProcedure
      .input(z.object({ announcementId: z.number() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.hibiSession!.type !== "customer") return { success: true };
        await markAnnouncementRead(ctx.hibiSession!.id, input.announcementId);
        return { success: true };
      }),

    // Customer: mark all announcements as read
    markAllRead: hibiProtectedProcedure
      .mutation(async ({ ctx }) => {
        if (ctx.hibiSession!.type !== "customer") return { marked: 0 };
        const marked = await markAllAnnouncementsRead(ctx.hibiSession!.id);
        return { marked };
      }),

    // Customer: subscribe to push notifications
    subscribePush: hibiProtectedProcedure
      .input(z.object({
        endpoint: z.string(),
        p256dh: z.string(),
        auth: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
        await savePushSubscription(ctx.hibiSession!.id, input.endpoint, input.p256dh, input.auth);
        return { success: true };
      }),

    // Customer: unsubscribe from push notifications
    unsubscribePush: hibiProtectedProcedure
      .input(z.object({ endpoint: z.string() }))
      .mutation(async ({ ctx, input }) => {
        if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
        await removePushSubscription(ctx.hibiSession!.id, input.endpoint);
        return { success: true };
      }),

    // Admin: upload image for announcement
    uploadImage: superAdminProcedure
      .input(z.object({
        imageBase64: z.string().min(1),
        imageType: z.string().default("image/jpeg"),
        fileName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const buffer = Buffer.from(input.imageBase64, "base64");
        const ext = input.imageType?.split("/")[1] || "jpg";
        const fileKey = `announcements/${Date.now()}-${nanoid(6)}.${ext}`;
        const { url } = await storagePut(fileKey, buffer, input.imageType);
        return { url };
      }),
  }),

  // ── Marketing Dashboard Analytics ──
  marketingDashboard: router({
    codeStats: superAdminProcedure.query(async () => {
      return getCodeStatsByBranch();
    }),
    pointsStats: superAdminProcedure.query(async () => {
      return getPointsStatsByBranch();
    }),
    topCustomers: superAdminProcedure
      .input(z.object({ branchId: z.number().optional(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return getTopCustomersByBranch(input.branchId, input.limit);
      }),
    topRedeemers: superAdminProcedure
      .input(z.object({ branchId: z.number().optional(), limit: z.number().default(10) }))
      .query(async ({ input }) => {
        return getTopCodeRedeemers(input.branchId, input.limit);
      }),
    rewardRedemptions: superAdminProcedure.query(async () => {
      return getRewardRedemptionsByBranch();
    }),
  }),

  // ── Announcement Templates ──
  announcementTemplates: router({
    list: superAdminProcedure.query(async () => {
      return listAnnouncementTemplates(true);
    }),
    listAll: superAdminProcedure.query(async () => {
      return listAnnouncementTemplates(false);
    }),
    getById: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getAnnouncementTemplateById(input.id);
      }),
    create: superAdminProcedure
      .input(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        type: z.enum(["announcement", "promotion", "event"]).default("announcement"),
        titleTemplate: z.string().min(1),
        contentTemplate: z.string().min(1),
        imageUrl: z.string().nullish(),
        promoCode: z.string().nullish(),
        discountText: z.string().nullish(),
      }))
      .mutation(async ({ input }) => {
        const id = await createAnnouncementTemplate({
          name: input.name,
          description: input.description ?? null,
          type: input.type,
          titleTemplate: input.titleTemplate,
          contentTemplate: input.contentTemplate,
          imageUrl: input.imageUrl ?? null,
          promoCode: input.promoCode ?? null,
          discountText: input.discountText ?? null,
        });
        return { id };
      }),
    update: superAdminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().nullish(),
        type: z.enum(["announcement", "promotion", "event"]).optional(),
        titleTemplate: z.string().min(1).optional(),
        contentTemplate: z.string().min(1).optional(),
        imageUrl: z.string().nullish(),
        promoCode: z.string().nullish(),
        discountText: z.string().nullish(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...data } = input;
        const updateData: any = { ...data };
        if (data.isActive !== undefined) updateData.isActive = data.isActive ? 1 : 0;
        await updateAnnouncementTemplate(id, updateData);
        return { success: true };
      }),
    delete: superAdminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteAnnouncementTemplate(input.id);
        return { success: true };
      }),
  }),

  // ── Review Menu Items (Admin CRUD) ──
  reviewMenu: router({
    // Public: list active menu items for customer selection
    // If branchId is provided, filter by branch availability
    listActive: hibiProcedure.input(z.object({ branchId: z.number().optional() }).optional()).query(async ({ input }) => {
      const branchId = input?.branchId;
      if (branchId) {
        return listActiveMenuItemsForBranch(branchId);
      }
      return listReviewMenuItems(true);
    }),

    // Admin: list all menu items
    listAll: superAdminProcedure.query(async () => {
      return listReviewMenuItems(false);
    }),

    // Admin: create menu item
    create: superAdminProcedure.input(z.object({
      code: z.string().min(1).max(20),
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      sortOrder: z.number().default(0),
    })).mutation(async ({ input, ctx }) => {
      const existing = await getReviewMenuItemByCode(input.code);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "รหัสเมนูนี้มีอยู่แล้ว" });
      const id = await createReviewMenuItem({
        code: input.code,
        name: input.name,
        description: input.description || null,
        sortOrder: input.sortOrder,
      });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_review_menu", entity: "review_menu_item", entityId: id, details: `สร้างเมนูรีวิว: ${input.name} (${input.code})` });
      return { id };
    }),

    // Admin: update menu item
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      code: z.string().min(1).max(20).optional(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().nullish(),
      isActive: z.number().min(0).max(1).optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      if (data.code) {
        const existing = await getReviewMenuItemByCode(data.code);
        if (existing && existing.id !== id) throw new TRPCError({ code: "CONFLICT", message: "รหัสเมนูนี้มีอยู่แล้ว" });
      }
      const updateData: any = {};
      if (data.code !== undefined) updateData.code = data.code;
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description ?? null;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
      await updateReviewMenuItem(id, updateData);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_review_menu", entity: "review_menu_item", entityId: id, details: `อัปเดตเมนูรีวิว` });
      return { success: true };
    }),

    // Admin: delete menu item
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await deleteReviewMenuItem(input.id);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "delete_review_menu", entity: "review_menu_item", entityId: input.id, details: `ลบเมนูรีวิว` });
      return { success: true };
    }),

    // Customer: select menu for a free drink code
    selectMenu: hibiProtectedProcedure.input(z.object({
      codeId: z.number(),
      menuItemId: z.number(),
      sweetnessGrams: z.number().min(0).max(100).default(0),
      packagingType: z.enum(["ready", "separate"]).default("ready"),
      remark: z.string().max(500).optional(),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const myCodes = await listFreeDrinkCodesByCustomer(ctx.hibiSession!.id);
      const code = myCodes.find(c => c.id === input.codeId);
      if (!code) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบโค้ดนี้" });
      if (code.customerId !== ctx.hibiSession!.id) throw new TRPCError({ code: "FORBIDDEN", message: "โค้ดนี้ไม่ใช่ของคุณ" });
      if (code.status !== "issued") throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ไม่สามารถเลือกเมนูได้" });
      if (code.selectedMenuItemId) throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้เลือกเมนูแล้ว" });
      const menuItem = await getReviewMenuItemById(input.menuItemId);
      if (!menuItem || !menuItem.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบเมนูนี้" });
      await updateFreeDrinkCodeMenuSelection(input.codeId, {
        selectedMenuItemId: menuItem.id,
        selectedMenuCode: menuItem.code,
        selectedMenuName: menuItem.name,
        sweetnessGrams: input.sweetnessGrams,
        packagingType: input.packagingType,
        remark: input.remark || null,
      });
      return {
        success: true,
        menuName: menuItem.name,
        menuCode: menuItem.code,
        sweetnessGrams: input.sweetnessGrams,
        packagingType: input.packagingType,
        remark: input.remark || null,
      };
    }),

    // Customer: select menu for a review/compensation code (codes table)
    // Auto-select for CL codes: ดึง compensationMenuCode/Name มาเป็น selectedMenu อัตโนมัติ
    // ลูกค้าไม่ต้องเลือกเมนูเอง — ระบบใช้เมนูที่ผู้จัดการสาขาระบุไว้ตอนออกโค้ด
    autoSelectForCLCode: hibiProtectedProcedure.input(z.object({
      codeId: z.number(),
      remark: z.string().max(500).optional(),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const code = await getCodeById(input.codeId);
      if (!code) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบโค้ดนี้" });
      if (code.customerId !== ctx.hibiSession!.id) throw new TRPCError({ code: "FORBIDDEN", message: "โค้ดนี้ไม่ใช่ของคุณ" });
      if (code.type !== "CL") throw new TRPCError({ code: "BAD_REQUEST", message: "ฟังก์ชันนี้ใช้ได้เฉพาะโค้ดชดเชย (CL) เท่านั้น" });
      if (code.status !== "issued") throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ไม่สามารถใช้ได้" });
      if (new Date(code.expiresAt) < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดหมดอายุแล้ว" });
      if (!code.compensationMenuCode || !code.compensationMenuName) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ไม่มีข้อมูลเมนูชดเชย" });
      }
      // ถ้าเลือกเมนูแล้วและ activated วันนี้ → ไม่ต้องเลือกใหม่
      if (code.selectedMenuItemId && code.activatedAt) {
        const activated = new Date(code.activatedAt);
        const now = new Date();
        if (activated.toDateString() === now.toDateString()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ยืนยันแล้ว (ต้องใช้ภายในวันนี้)" });
        }
        // Reset expired selection
        await resetCodeMenuSelection(input.codeId);
      }
      // Auto-fill: ใช้ compensationMenuCode/Name เป็น selectedMenu
      await autoSelectCLCodeMenu(input.codeId, {
        compensationMenuCode: code.compensationMenuCode,
        compensationMenuName: code.compensationMenuName,
        remark: input.remark || null,
      });
      return {
        success: true,
        code: code.code,
        menuName: code.compensationMenuName,
        menuCode: code.compensationMenuCode,
        remark: input.remark || null,
      };
    }),

    selectMenuForCode: hibiProtectedProcedure.input(z.object({
      codeId: z.number(),
      menuItemId: z.number(),
      remark: z.string().max(500).optional(),
    })).mutation(async ({ ctx, input }) => {
      if (ctx.hibiSession!.type !== "customer") throw new TRPCError({ code: "FORBIDDEN" });
      const code = await getCodeById(input.codeId);
      if (!code) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบโค้ดนี้" });
      if (code.customerId !== ctx.hibiSession!.id) throw new TRPCError({ code: "FORBIDDEN", message: "โค้ดนี้ไม่ใช่ของคุณ" });
      if (code.status !== "issued") throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้ไม่สามารถเลือกเมนูได้" });
      if (new Date(code.expiresAt) < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดหมดอายุแล้ว" });
      // Auto-expire: ถ้า activatedAt ไม่ใช่วันนี้ → รีเซ็ต selectedMenu ให้เลือกใหม่ได้
      if (code.selectedMenuItemId && code.activatedAt) {
        const activated = new Date(code.activatedAt);
        const now = new Date();
        if (activated.toDateString() !== now.toDateString()) {
          // Reset expired selection
          await resetCodeMenuSelection(input.codeId);
        } else {
          throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้เลือกเมนูแล้ว (ต้องใช้ภายในวันนี้)" });
        }
      } else if (code.selectedMenuItemId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้เลือกเมนูแล้ว" });
      }
      // Load menu filtered by the branch that issued this code
      const menuItem = await getReviewMenuItemById(input.menuItemId);
      if (!menuItem || !menuItem.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบเมนูนี้" });
      // Check branch availability
      const branchMenuItems = await listActiveMenuItemsForBranch(code.branchId);
      const isAvailableAtBranch = branchMenuItems.some(m => m.id === input.menuItemId);
      if (!isAvailableAtBranch) throw new TRPCError({ code: "BAD_REQUEST", message: "เมนูนี้ไม่พร้อมให้บริการที่สาขานี้" });
      await updateCodeMenuSelection(input.codeId, {
        selectedMenuItemId: menuItem.id,
        selectedMenuCode: menuItem.code,
        selectedMenuName: menuItem.name,
        remark: input.remark || null,
      });
      return {
        success: true,
        code: code.code,
        menuName: menuItem.name,
        menuCode: menuItem.code,
        remark: input.remark || null,
      };
    }),
  }),

  // ── Branch Menu Availability (branch admin can toggle menu items per branch) ──
  branchMenu: router({
    // Get branch menu availability (all items + override status)
    list: branchAdminProcedure.input(z.object({
      branchId: z.number(),
    })).query(async ({ input }) => {
      const allItems = await listReviewMenuItems(false);
      const overrides = await getBranchMenuAvailability(input.branchId);
      const overrideMap = new Map(overrides.map(o => [o.menuItemId, o.isAvailable]));
      return allItems.map(item => ({
        ...item,
        branchAvailable: overrideMap.get(item.id) ?? 1, // default available
      }));
    }),

    // Toggle menu item availability for a branch
    toggle: branchAdminProcedure.input(z.object({
      branchId: z.number(),
      menuItemId: z.number(),
      isAvailable: z.boolean(),
    })).mutation(async ({ input, ctx }) => {
      await setBranchMenuAvailability(input.branchId, input.menuItemId, input.isAvailable);
      await createAuditLog({
        actorType: "staff",
        actorId: ctx.hibiSession!.id,
        actorName: null,
        action: "toggle_branch_menu",
        entity: "branch_menu_availability",
        entityId: input.menuItemId,
        details: (input.isAvailable ? "เปิด" : "ปิด") + "เมนูรีวิว #" + input.menuItemId + " สาขา #" + input.branchId,
      });
      return { success: true };
    }),
  }),

  // ── Staff: Redeem Review Code with Order Tracking ──
  staffCodeRedeem: router({
    // Staff: lookup code details before redeeming
    lookup: staffProcedure.input(z.object({
      code: z.string().min(1),
    })).query(async ({ input }) => {
      const codeRecord = await getFreeDrinkCodeByCode(input.code.toUpperCase().trim());
      if (!codeRecord) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบโค้ดนี้" });
      const customer = await getCustomerById(codeRecord.customerId);
      return {
        id: codeRecord.id,
        code: codeRecord.code,
        status: codeRecord.status,
        menuName: codeRecord.menuName,
        sizeName: codeRecord.sizeName,
        milkName: codeRecord.milkName,
        selectedMenuName: codeRecord.selectedMenuName,
        selectedMenuCode: codeRecord.selectedMenuCode,
        sweetnessGrams: codeRecord.sweetnessGrams,
        packagingType: codeRecord.packagingType,
        orderType: codeRecord.orderType,
        deliveryOrderId: codeRecord.deliveryOrderId,
        expiresAt: codeRecord.expiresAt,
        branchId: codeRecord.branchId,
        customerName: customer?.name || "N/A",
        customerPhone: customer?.phone || "N/A",
        isExpired: new Date() > codeRecord.expiresAt,
        isRedeemed: codeRecord.status === "redeemed",
      };
    }),

    // Staff: mark code as redeemed with order type + delivery order ID
    redeem: staffProcedure.input(z.object({
      code: z.string().min(1),
      branchId: z.number(),
      orderType: z.enum(["in_store", "delivery"]).default("in_store"),
      deliveryApp: z.string().optional(),
      deliveryOrderId: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const codeRecord = await getFreeDrinkCodeByCode(input.code.toUpperCase().trim());
      if (!codeRecord) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบโค้ดนี้" });
      if (codeRecord.status !== "issued") throw new TRPCError({ code: "BAD_REQUEST", message: `โค้ดนี้สถานะ: ${codeRecord.status}` });
      if (new Date() > codeRecord.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "โค้ดนี้หมดอายุแล้ว" });
      // ตรวจสอบสาขา — โค้ดต้องใช้ที่สาขาที่ออกให้เท่านั้น
      if (codeRecord.branchId && codeRecord.branchId !== input.branchId) {
        const codeBranch = await getBranchById(codeRecord.branchId);
        const codeBranchName = codeBranch?.name || `สาขา #${codeRecord.branchId}`;
        throw new TRPCError({ code: "BAD_REQUEST", message: `โค้ดนี้เป็นของ${codeBranchName} ไม่สามารถใช้ที่สาขานี้ได้ กรุณาแจ้งลูกค้าใช้ที่สาขาที่ออกโค้ดให้` });
      }
      // For delivery orders, require order ID
      if (input.orderType === "delivery") {
        if (!input.deliveryOrderId || !input.deliveryOrderId.trim()) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณากรอก Order ID สำหรับออเดอร์ delivery" });
        }
        // Validate order ID format if delivery app is specified
        if (input.deliveryApp) {
          const validation = validateOrderId(input.deliveryApp, input.deliveryOrderId.trim());
          if (!validation.ok) throw new TRPCError({ code: "BAD_REQUEST", message: validation.message });
        }
      }
      await staffRedeemFreeDrinkCode(
        codeRecord.code,
        input.branchId,
        ctx.hibiSession!.id,
        input.orderType,
        input.deliveryOrderId?.trim(),
      );
      const customer = await getCustomerById(codeRecord.customerId);
      await createAuditLog({
        actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null,
        action: "staff_redeem_code", entity: "free_drink_code", entityId: codeRecord.id,
        details: `Mark โค้ด ${codeRecord.code} ใช้แล้ว (${input.orderType}${input.deliveryOrderId ? ` Order: ${input.deliveryOrderId}` : ''}) ลูกค้า: ${customer?.name || 'N/A'} เมนู: ${codeRecord.selectedMenuName || codeRecord.menuName}`,
      });
      return {
        success: true,
        code: codeRecord.code,
        menuName: codeRecord.selectedMenuName || codeRecord.menuName,
        sizeName: codeRecord.sizeName,
        milkName: codeRecord.milkName,
        selectedMenuName: codeRecord.selectedMenuName,
        sweetnessGrams: codeRecord.sweetnessGrams,
        packagingType: codeRecord.packagingType,
        customerName: customer?.name || "N/A",
        orderType: input.orderType,
        deliveryOrderId: input.deliveryOrderId,
      };
    }),
  }),

  // ── Site Content Management (Super Admin) ──
  siteContent: router({
    get: publicProcedure.input(z.object({ key: z.string() })).query(async ({ input }) => {
      return getSiteContent(input.key);
    }),
    list: superAdminProcedure.query(async () => {
      return listSiteContent();
    }),
    upsert: superAdminProcedure.input(z.object({
      key: z.string().min(1),
      value: z.string().nullable(),
      type: z.string().default("image"),
      label: z.string().nullable().default(null),
    })).mutation(async ({ input, ctx }) => {
      const id = await upsertSiteContent(input.key, input.value, input.type, input.label, ctx.hibiSession!.id);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_site_content", entity: "site_content", entityId: id, details: `อัปเดตเนื้อหา: ${input.key}` });
      return { id };
    }),
    upload: superAdminProcedure.input(z.object({
      key: z.string().min(1),
      label: z.string().nullable().default(null),
      imageBase64: z.string().min(1),
      imageType: z.string().default("image/jpeg"),
    })).mutation(async ({ input, ctx }) => {
      const buffer = Buffer.from(input.imageBase64, "base64");
      const ext = input.imageType?.split("/")[1] || "jpg";
      const fileKey = `site-content/${input.key}-${Date.now()}-${nanoid(6)}.${ext}`;
      const { url } = await storagePut(fileKey, buffer, input.imageType);
      const id = await upsertSiteContent(input.key, url, "image", input.label, ctx.hibiSession!.id);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "upload_site_content", entity: "site_content", entityId: id, details: `อัปโหลดรูป: ${input.key}` });
      return { id, url };
    }),
  }),

  // ── Staff Notifications ──
  staffNotifications: router({
    list: branchAdminProcedure.query(async ({ ctx }) => {
      return listStaffNotifications(ctx.hibiSession!.id);
    }),
    unreadCount: branchAdminProcedure.query(async ({ ctx }) => {
      const count = await countUnreadNotifications(ctx.hibiSession!.id);
      return { count };
    }),
    markRead: branchAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ ctx, input }) => {
      await markNotificationRead(input.id, ctx.hibiSession!.id);
      return { ok: true };
    }),
    markAllRead: branchAdminProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.hibiSession!.id);
      return { ok: true };
    }),
    subscribePush: branchAdminProcedure.input(z.object({
      endpoint: z.string(),
      p256dh: z.string(),
      auth: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await upsertStaffPushSubscription(ctx.hibiSession!.id, input.endpoint, input.p256dh, input.auth);
      return { ok: true };
    }),
    unsubscribePush: branchAdminProcedure.input(z.object({
      endpoint: z.string(),
    })).mutation(async ({ ctx, input }) => {
      await removeStaffPushSubscriptionByEndpoint(input.endpoint);
      return { ok: true };
    }),
  }),

  // ── Option Groups (Admin CRUD + Public list) ──
  optionGroups: router({
    // Public: list active option groups with items (for customer menu selection)
    listActive: publicProcedure.query(async () => {
      return listActiveOptionGroupsWithItems();
    }),

    // Admin: list all option groups
    list: branchAdminProcedure.query(async () => {
      const groups = await listOptionGroups();
      const allItems = await listAllOptionItems();
      return groups.map(g => ({
        ...g,
        items: allItems.filter(i => i.groupId === g.id),
      }));
    }),

    // Admin: create option group
    create: superAdminProcedure.input(z.object({
      name: z.string().min(1).max(255),
      type: z.enum(["single", "multi"]),
      isRequired: z.boolean().default(false),
      sortOrder: z.number().default(0),
    })).mutation(async ({ input, ctx }) => {
      const id = await createOptionGroup(input);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_option_group", entity: "option_group", entityId: id, details: `สร้างกลุ่มตัวเลือก: ${input.name}` });
      return { id };
    }),

    // Admin: update option group
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      type: z.enum(["single", "multi"]).optional(),
      isRequired: z.boolean().optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      await updateOptionGroup(input.id, input);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_option_group", entity: "option_group", entityId: input.id, details: `แก้ไขกลุ่มตัวเลือก` });
      return { ok: true };
    }),

    // Admin: delete option group (cascade items)
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await deleteOptionGroup(input.id);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "delete_option_group", entity: "option_group", entityId: input.id, details: `ลบกลุ่มตัวเลือก` });
      return { ok: true };
    }),

    // Admin: add item to group
    addItem: superAdminProcedure.input(z.object({
      groupId: z.number(),
      name: z.string().min(1).max(255),
      sortOrder: z.number().default(0),
    })).mutation(async ({ input, ctx }) => {
      const id = await createOptionItem(input);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_option_item", entity: "option_item", entityId: id, details: `เพิ่มตัวเลือก: ${input.name}` });
      return { id };
    }),

    // Admin: update item
    updateItem: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      isActive: z.boolean().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      await updateOptionItem(input.id, input);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_option_item", entity: "option_item", entityId: input.id, details: `แก้ไขตัวเลือก` });
      return { ok: true };
    }),

    // Admin: delete item
    deleteItem: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await deleteOptionItem(input.id);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "delete_option_item", entity: "option_item", entityId: input.id, details: `ลบตัวเลือก` });
      return { ok: true };
    }),

    // ── Menu Option Groups (link option groups to menus) ──
    // Admin: set option groups for a menu
    setMenuGroups: superAdminProcedure.input(z.object({
      menuType: z.enum(["review", "reward"]),
      menuId: z.number(),
      groupIds: z.array(z.number()),
    })).mutation(async ({ input, ctx }) => {
      await setMenuOptionGroups(input.menuType, input.menuId, input.groupIds);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "set_menu_option_groups", entity: "menu_option_group", entityId: input.menuId, details: `ตั้งค่า option groups สำหรับ ${input.menuType} #${input.menuId}: [${input.groupIds.join(",")}]` });
      return { ok: true };
    }),

    // Admin: get option group IDs for a menu
    getMenuGroups: branchAdminProcedure.input(z.object({
      menuType: z.enum(["review", "reward"]),
      menuId: z.number(),
    })).query(async ({ input }) => {
      return getMenuOptionGroupIds(input.menuType, input.menuId);
    }),

    // Public: get active option groups with items for a specific menu
    forMenu: publicProcedure.input(z.object({
      menuType: z.enum(["review", "reward"]),
      menuId: z.number(),
    })).query(async ({ input }) => {
      return getOptionGroupsForMenu(input.menuType, input.menuId);
    }),
   }),
  // ── Reward Categories ──
  rewardCategories: router({
    // Public: list active categories
    listActive: publicProcedure.query(async () => {
      return listActiveRewardCategories();
    }),
    // Admin: list all categories
    list: superAdminProcedure.query(async () => {
      return listRewardCategories();
    }),
    // Admin: create category
    create: superAdminProcedure.input(z.object({
      name: z.string().min(1).max(255),
      icon: z.string().default("gift"),
      color: z.string().default("bg-gray-50 text-gray-600"),
      sortOrder: z.number().default(0),
    })).mutation(async ({ input, ctx }) => {
      const id = await createRewardCategory(input);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_reward_category", entity: "reward_category", entityId: id, details: `\u0e2a\u0e23\u0e49\u0e32\u0e07\u0e2b\u0e21\u0e27\u0e14\u0e2b\u0e21\u0e39\u0e48\u0e23\u0e32\u0e07\u0e27\u0e31\u0e25: ${input.name}` });
      return { id };
    }),
    // Admin: update category
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      icon: z.string().optional(),
      color: z.string().optional(),
      isActive: z.number().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateRewardCategory(id, data);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_reward_category", entity: "reward_category", entityId: id, details: `\u0e41\u0e01\u0e49\u0e44\u0e02\u0e2b\u0e21\u0e27\u0e14\u0e2b\u0e21\u0e39\u0e48\u0e23\u0e32\u0e07\u0e27\u0e31\u0e25` });
      return { ok: true };
    }),
    // Admin: delete category
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input, ctx }) => {
      await deleteRewardCategory(input.id);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "delete_reward_category", entity: "reward_category", entityId: input.id, details: `\u0e25\u0e1a\u0e2b\u0e21\u0e27\u0e14\u0e2b\u0e21\u0e39\u0e48\u0e23\u0e32\u0e07\u0e27\u0e31\u0e25` });
      return { ok: true };
    }),
  }),
  // ── Password Reset ──
  passwordReset: router({
    // Customer requests password reset (public)
    request: publicProcedure.input(z.object({
      identifier: z.string().min(1).max(320),
      identifierType: z.enum(["phone", "email"]),
    })).mutation(async ({ input }) => {
      const cleanIdentifier = input.identifierType === "phone"
        ? input.identifier.replace(/\D/g, "")
        : input.identifier.trim().toLowerCase();

      // Spam protection: 3 reset requests per identifier per hour (prevents
      // attacker spamming admin queue + DB bloat with bogus requests)
      const rl = rateLimit(`pwreset:${cleanIdentifier}`, 3, 60 * 60 * 1000);
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `ขอรีเซ็ตบ่อยเกินไป — กรุณารอ ${Math.ceil(rl.resetSec / 60)} นาที`,
        });
      }

      let customer;
      if (input.identifierType === "phone") {
        customer = await getCustomerByPhone(cleanIdentifier);
      } else {
        customer = await getCustomerByEmail(cleanIdentifier);
      }
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบบัญชีที่ตรงกับข้อมูลนี้" });
      await createPasswordResetRequest({
        customerId: customer.id,
        identifier: cleanIdentifier,
        identifierType: input.identifierType,
      });
      return { success: true, message: "ส่งคำขอรีเซ็ตรหัสผ่านเรียบร้อย แอดมินจะดำเนินการให้" };
    }),

    // Admin: list pending requests
    listPending: superAdminProcedure.query(async () => {
      const requests = await listPendingPasswordResetRequests();
      // Enrich with customer info
      const enriched = await Promise.all(requests.map(async (r) => {
        const customer = await getCustomerById(r.customerId);
        return { ...r, customerName: customer?.name ?? "ไม่ทราบ", customerPhone: customer?.phone ?? "", customerEmail: customer?.email ?? "" };
      }));
      return enriched;
    }),

    // Admin: list all requests
    listAll: superAdminProcedure.query(async () => {
      const requests = await listAllPasswordResetRequests(100);
      const enriched = await Promise.all(requests.map(async (r) => {
        const customer = await getCustomerById(r.customerId);
        return { ...r, customerName: customer?.name ?? "ไม่ทราบ", customerPhone: customer?.phone ?? "", customerEmail: customer?.email ?? "" };
      }));
      return enriched;
    }),

    // Admin: generate reset link for a request
    generateLink: superAdminProcedure.input(z.object({
      requestId: z.number().optional(),
      customerId: z.number(),
      origin: z.string(), // frontend origin URL
    })).mutation(async ({ input, ctx }) => {
      const token = nanoid(48);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
      await createPasswordResetToken({
        customerId: input.customerId,
        token,
        requestId: input.requestId ?? null,
        createdBy: ctx.hibiSession!.id,
        expiresAt,
      });
      // Mark request as processed if provided
      if (input.requestId) {
        await updatePasswordResetRequestStatus(input.requestId, "processed", ctx.hibiSession!.id);
      }
      // Always use the custom domain for reset links
      const primaryDomain = "https://hibimatcha.love";
      const resetUrl = `${primaryDomain}/reset-password?token=${token}`;
      return { success: true, resetUrl, expiresAt };
    }),

    // Public: validate token
    validateToken: publicProcedure.input(z.object({
      token: z.string(),
    })).query(async ({ input }) => {
      const tokenRow = await getPasswordResetTokenByToken(input.token);
      if (!tokenRow) return { valid: false, reason: "ลิงก์ไม่ถูกต้อง" };
      if (tokenRow.usedAt) return { valid: false, reason: "ลิงก์นี้ถูกใช้งานแล้ว" };
      if (new Date() > tokenRow.expiresAt) return { valid: false, reason: "ลิงก์หมดอายุแล้ว" };
      const customer = await getCustomerById(tokenRow.customerId);
      return { valid: true, customerName: customer?.name ?? "" };
    }),

    // Public: reset password with token
    resetPassword: publicProcedure.input(z.object({
      token: z.string(),
      newPassword: z.string().min(6),
    })).mutation(async ({ input }) => {
      const tokenRow = await getPasswordResetTokenByToken(input.token);
      if (!tokenRow) throw new TRPCError({ code: "NOT_FOUND", message: "ลิงก์ไม่ถูกต้อง" });
      if (tokenRow.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "ลิงก์นี้ถูกใช้งานแล้ว" });
      if (new Date() > tokenRow.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "ลิงก์หมดอายุแล้ว" });
      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await updateCustomerPassword(tokenRow.customerId, passwordHash);
      await markPasswordResetTokenUsed(tokenRow.id);
      return { success: true, message: "ตั้งรหัสผ่านใหม่เรียบร้อย" };
    }),

    // Admin: reopen a processed request back to pending
    reopenRequest: superAdminProcedure.input(z.object({
      requestId: z.number(),
    })).mutation(async ({ input }) => {
      await updatePasswordResetRequestStatus(input.requestId, "pending");
      return { success: true };
    }),

    // Admin: count pending
    countPending: superAdminProcedure.query(async () => {
      const pending = await listPendingPasswordResetRequests();
      return { count: pending.length };
    }),
  }),

  // ── Customer Self-Service OTP Reset ──
  customerOtpReset: router({
    requestOtp: publicProcedure.input(z.object({
      phone: z.string().min(1),
    })).mutation(async ({ input }) => {
      const cleanPhone = input.phone.replace(/\D/g, "");

      // Throttle: 1 OTP request per phone per 60 seconds (prevents email spam)
      const rl = rateLimit(`otp_req:${cleanPhone}`, 1, 60 * 1000);
      if (!rl.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `กรุณารอ ${rl.resetSec} วินาที ก่อนขอ OTP ใหม่`,
        });
      }

      const customer = await getCustomerByPhone(cleanPhone);
      if (!customer) return { success: true }; // Don't reveal if phone exists
      if (!customer.email) return { success: true }; // No email, can't send OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      // Reset failure counter when a fresh OTP is issued
      rateLimitReset(`otp_confirm:${customer.id}`);
      // Delete only previous OTP tokens — admin-generated reset tokens are preserved
      await deleteOtpTokensByCustomer(customer.id);
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min
      await createPasswordResetToken({
        customerId: customer.id,
        token: otp,
        requestId: null,
        createdBy: null,
        expiresAt,
      });
      const { sendOtpEmail } = await import("./lib/email");
      await sendOtpEmail(customer.email, otp, customer.name);
      return { success: true };
    }),

    confirmOtp: publicProcedure.input(z.object({
      phone: z.string().min(1),
      otp: z.string().length(6),
      newPassword: z.string().min(6),
    })).mutation(async ({ input }) => {
      const cleanPhone = input.phone.replace(/\D/g, "");
      const customer = await getCustomerByPhone(cleanPhone);
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบเบอร์นี้ในระบบ" });

      // Brute-force protection: 5 wrong OTPs per customer per 15 min
      const rlKey = `otp_confirm:${customer.id}`;
      const rl = rateLimit(rlKey, 5, 15 * 60 * 1000);
      if (!rl.ok) {
        // Invalidate active OTP so attacker can't resume after lockout window
        await deleteOtpTokensByCustomer(customer.id);
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: `ใส่ OTP ผิดเกินกำหนด — OTP ถูกยกเลิก กรุณารอ ${Math.ceil(rl.resetSec / 60)} นาที แล้วขอใหม่`,
        });
      }

      const tokenRow = await getLatestOtpTokenByCustomer(customer.id);
      if (!tokenRow) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่พบ OTP กรุณาขอใหม่" });
      if (new Date() > tokenRow.expiresAt) throw new TRPCError({ code: "BAD_REQUEST", message: "OTP หมดอายุแล้ว กรุณาขอใหม่" });
      if (tokenRow.usedAt) throw new TRPCError({ code: "BAD_REQUEST", message: "OTP นี้ถูกใช้แล้ว กรุณาขอใหม่" });
      if (tokenRow.token !== input.otp) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: rl.remaining > 0 ? `OTP ไม่ถูกต้อง (เหลืออีก ${rl.remaining} ครั้ง)` : "OTP ไม่ถูกต้อง",
        });
      }

      const passwordHash = await bcrypt.hash(input.newPassword, 12);
      await updateCustomerPassword(customer.id, passwordHash);
      await markPasswordResetTokenUsed(tokenRow.id);
      await deleteOtpTokensByCustomer(customer.id);
      rateLimitReset(rlKey); // success — clear failure bucket
      return { success: true };
    }),
  }),

  // ── Admin: Customer Management ──
  adminCustomers: router({
    list: superAdminProcedure.input(z.object({
      search: z.string().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    })).query(async ({ input }) => {
      const [rows, total] = await Promise.all([
        listCustomers(input.search, input.limit, input.offset),
        countCustomers(input.search),
      ]);
      return { customers: rows, total };
    }),

    getById: superAdminProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      const customer = await getCustomerById(input.id);
      if (!customer) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบสมาชิก" });
      return customer;
    }),
  }),

  // ── Pending Codes Dashboard ──
  pendingCodes: router({
    dashboard: branchAdminProcedure.query(async ({ ctx }) => {
      const role = ctx.hibiSession!.role;
      if (role === "super_admin") {
        return getPendingCodesDashboard();
      }
      if (role === "area_manager") {
        const assignedBranches = await getStaffBranches(ctx.hibiSession!.id);
        const branchIds = assignedBranches.map(b => b.branchId);
        if (branchIds.length === 0) return getPendingCodesDashboard([-1]);
        return getPendingCodesDashboard(branchIds);
      }
      // branch_owner / branch_manager / branch_staff
      const staffMember = await getStaffById(ctx.hibiSession!.id);
      const branchId = staffMember?.branchId ?? (ctx.hibiSession as any)?.branchId;
      if (!branchId) return getPendingCodesDashboard([-1]);
      return getPendingCodesDashboard([branchId]);
    }),
  }),

  // ── Petty Cash Management ──
  pettyCash: router({
    // Get settings for current branch
    getSettings: branchAdminProcedure.input(z.object({
      branchId: z.number().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input?.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const settings = await getPettyCashSettings(effectiveBranchId);
      // For privileged roles (owner/area_manager/super_admin), always show as active so they can view/manage
      const privilegedRoles = ["branch_owner", "area_manager", "super_admin"];
      const isPrivileged = privilegedRoles.includes(session.role);
      const defaultSettings = { branchId: effectiveBranchId, alertThreshold: 1000, allowedRole: "branch_manager" as const, isActive: isPrivileged ? 1 : 0, bankAccountName: null, bankAccountNumber: null, bankName: null, promptPayId: null };
      if (!settings) return defaultSettings;
      // If system not yet activated but user is privileged, show as active for viewing
      if (!settings.isActive && isPrivileged) {
        return { ...settings, isActive: 1 };
      }
      return settings;
    }),

    // Update settings (branch_owner only)
    updateSettings: branchAdminProcedure.input(z.object({
      alertThreshold: z.number().min(0).optional(),
      bankAccountName: z.string().optional(),
      bankAccountNumber: z.string().optional(),
      bankName: z.string().optional(),
      promptPayId: z.string().optional(),
      allowedRole: z.enum(["branch_manager", "branch_staff", "both"]).optional(),
      isActive: z.number().min(0).max(1).optional(),
      branchId: z.number().optional(), // area_manager can specify branch
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const allowedRoles = ["branch_owner", "branch_manager", "area_manager", "super_admin"];
      if (!allowedRoles.includes(session.role)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะเจ้าของสาขา ผู้จัดการสาขา หรือเจ้าของแฟรนไชส์เท่านั้นที่ตั้งค่าได้" });
      }
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      return upsertPettyCashSettings(effectiveBranchId, input);
    }),

    // Get current balance (all staff can view read-only)
    getBalance: staffProcedure.input(z.object({
      branchId: z.number().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input?.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const settings = await getPettyCashSettings(effectiveBranchId);
      // Privileged roles (owner/area_manager/super_admin) can always view even if not activated
      const privilegedRoles = ["branch_owner", "area_manager", "super_admin"];
      const isPrivileged = privilegedRoles.includes(session.role);
      if (!isPrivileged && (!settings || !settings.isActive)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ระบบเบิกจ่ายเงินสดยังไม่เปิดใช้งาน" });
      }
      const balance = await getPettyCashBalance(effectiveBranchId);
      return { balance, alertThreshold: settings?.alertThreshold ?? 1000 };
    }),

    // List transactions (all staff can view read-only)
    listTransactions: staffProcedure.input(z.object({
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      type: z.enum(["deposit", "expense", "adjustment"]).optional(), // filter by transaction type
      branchId: z.number().optional(), // area_manager can specify branch
    }).optional()).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input?.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const settings = await getPettyCashSettings(effectiveBranchId);
      const privilegedRoles = ["branch_owner", "area_manager", "super_admin"];
      const isPrivileged = privilegedRoles.includes(session.role);
      if (!isPrivileged && (!settings || !settings.isActive)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ระบบเบิกจ่ายเงินสดยังไม่เปิดใช้งาน" });
      }
      const dateFrom = input?.dateFrom ? new Date(input.dateFrom) : undefined;
      const dateTo = input?.dateTo ? new Date(input.dateTo) : undefined;
      const txType = input?.type;
      const [transactions, total] = await Promise.all([
        listPettyCashTransactions(effectiveBranchId, input?.limit ?? 50, input?.offset ?? 0, dateFrom, dateTo, txType),
        countPettyCashTransactions(effectiveBranchId, dateFrom, dateTo, txType),
      ]);
      return { transactions, total };
    }),

    // Add deposit (owner adds funds)
    addDeposit: branchAdminProcedure.input(z.object({
      amount: z.number().min(1),
      description: z.string().min(1),
      transferMethod: z.enum(["cash", "transfer", "promptpay"]),
      note: z.string().optional(),
      transactionDate: z.string(),
      branchId: z.number().optional(), // area_manager can specify branch
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      if (session.role !== "branch_owner" && session.role !== "super_admin" && session.role !== "area_manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะเจ้าของสาขาหรือเจ้าของแฟรนไชส์เท่านั้นที่เติมเงินได้" });
      }
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const staffMember = await getStaffById(session.id);
      const currentBalance = await getPettyCashBalance(effectiveBranchId);
      const newBalance = currentBalance + input.amount;
      const txId = await createPettyCashTransaction({
        branchId: effectiveBranchId,
        type: "deposit",
        amount: input.amount,
        description: input.description,
        transferMethod: (input.transferMethod?.trim() || null) as "cash" | "transfer" | "promptpay" | null,
        transactionDate: new Date(input.transactionDate),
        balanceAfter: newBalance,
        createdBy: session.id,
        createdByName: staffMember?.name ?? "Unknown",
        note: input.note || null,
        category: null,
        receiptUrl: null,
      });
      // Notify branch staff about new deposit
      await notifyBranchStaff(effectiveBranchId, {
        type: "petty_cash",
        title: "เติมเงินสดย่อย",
        message: `${staffMember?.name ?? "Admin"} เติมเงิน ฿${input.amount.toLocaleString()} — ยอดคงเหลือ ฿${newBalance.toLocaleString()}`,
        relatedEntity: "petty_cash",
      });
      return { id: txId, balanceAfter: newBalance };
    }),

    // Add expense (staff logs spending) - supports multiple images
    addExpense: staffProcedure.input(z.object({
      amount: z.number().min(1),
      description: z.string().min(1),
      category: z.string().optional(),
      // Support multiple receipt images (optional for manual entry)
      receiptImages: z.array(z.object({
        data: z.string().min(1), // base64
        type: z.string().min(1), // mime type
        fileName: z.string().optional(),
      })).default([]),
      entryMethod: z.enum(["ocr", "manual"]).optional(), // how the entry was created
      note: z.string().optional(),
      transactionDate: z.string(),
      branchId: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      if (session.role === "branch_staff") {
        throw new TRPCError({ code: "FORBIDDEN", message: "พนักงานสาขาไม่มีสิทธิ์ใช้ระบบบัญชี" });
      }
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const staffMember = await getStaffById(session.id);
      const settings = await getPettyCashSettings(effectiveBranchId);
      const privilegedRoles = ["branch_owner", "area_manager", "super_admin"];
      const isPrivileged = privilegedRoles.includes(session.role);
      if (!isPrivileged && (!settings || !settings.isActive)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ระบบเบิกจ่ายเงินสดยังไม่เปิดใช้งาน" });
      }
      const currentBalance = await getPettyCashBalance(effectiveBranchId);
      if (input.amount > currentBalance) {
        throw new TRPCError({ code: "BAD_REQUEST", message: `ยอดเงินไม่พอ (คงเหลือ ฿${currentBalance.toLocaleString()})` });
      }
      // Upload all receipt images to S3
      const uploadedImages: { url: string; type: string; fileName?: string }[] = [];
      for (const img of input.receiptImages) {
        const buffer = Buffer.from(img.data, "base64");
        const ext = (img.type || "image/jpeg").split("/")[1] || "jpg";
        const key = `petty-cash/${effectiveBranchId}-${Date.now()}-${nanoid(6)}.${ext}`;
        const result = await storagePut(key, buffer, img.type || "image/jpeg");
        uploadedImages.push({ url: result.url, type: img.type, fileName: img.fileName });
      }
      // Use first image URL as the primary receiptUrl for backward compatibility
      const receiptUrl = uploadedImages[0]?.url || null;
      const newBalance = currentBalance - input.amount;
      const txId = await createPettyCashTransaction({
        branchId: effectiveBranchId,
        type: "expense",
        amount: input.amount,
        description: input.description,
        category: input.category || null,
        receiptUrl,
        transactionDate: new Date(input.transactionDate),
        balanceAfter: newBalance,
        createdBy: session.id,
        createdByName: staffMember?.name ?? "Admin",
        note: input.note || null,
        transferMethod: null,
        entryMethod: input.entryMethod || null,
      });
      // Save all images to receipt_images table
      for (let i = 0; i < uploadedImages.length; i++) {
        await createReceiptImage({
          transactionId: txId,
          branchId: effectiveBranchId,
          imageUrl: uploadedImages[i].url,
          fileType: uploadedImages[i].type,
          fileName: uploadedImages[i].fileName || null,
          ocrText: null,
          ocrData: null,
          sortOrder: i,
        });
      }
      // Check if balance is below alert threshold
      const threshold = settings?.alertThreshold ?? 1000;
      if (newBalance < threshold) {
        await notifyBranchStaff(effectiveBranchId, {
          type: "petty_cash_alert",
          title: "⚠️ เงินสดย่อยเหลือน้อย",
          message: `ยอดคงเหลือ ฿${newBalance.toLocaleString()} (ต่ำกว่าเกณฑ์ ฿${threshold.toLocaleString()}) — กรุณาเติมเงิน`,
          relatedEntity: "petty_cash",
        });
      }
      return { id: txId, balanceAfter: newBalance, isLowBalance: newBalance < threshold };
    }),

    // OCR - extract text from receipt image using LLM Vision
    ocrReceipt: staffProcedure.input(z.object({
      imageData: z.string().min(1), // base64
      imageType: z.string().min(1), // mime type
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      if (session.role === "branch_staff") {
        throw new TRPCError({ code: "FORBIDDEN", message: "พนักงานสาขาไม่มีสิทธิ์ใช้ระบบบัญชี" });
      }
      try {
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `คุณเป็นผู้เชี่ยวชาญในการอ่านใบเสร็จ/สลิปภาษาไทย กรุณาอ่านข้อมูลจากรูปภาพใบเสร็จนี้และส่งกลับเป็น JSON ที่มีโครงสร้างดังนี้:
{
  "amount": number หรือ null (จำนวนเงินรวมทั้งหมดในใบเสร็จ หน่วยบาท),
  "description": string หรือ null (รายละเอียดสินค้า/บริการหลัก สั้นกระชับ),
  "vendor": string หรือ null (ชื่อร้านค้า/ผู้ขาย),
  "date": string หรือ null (วันที่ในใบเสร็จ format YYYY-MM-DD),
  "items": [{"name": string, "qty": number, "price": number}] หรือ [] (รายการสินค้า),
  "rawText": string (ข้อความทั้งหมดที่อ่านได้จากใบเสร็จ),
  "category": string หรือ null (หมวดหมู่ที่เหมาะสม: ingredients/packaging/cleaning/transport/repair/office/other),
  "confidence": {"amount": number, "description": number, "vendor": number, "date": number, "category": number} (ค่าความมั่นใจ 0-100 ต่อแต่ละช่องข้อมูล โดย 100=มั่นใจมาก, 50=ปานกลาง, 0=ไม่มั่นใจ/อ่านไม่ได้)
}
ตอบเป็น JSON เท่านั้น ไม่ต้องมี markdown code block`,
            },
            {
              role: "user",
              content: [
                { type: "text", text: "กรุณาอ่านข้อมูลจากใบเสร็จ/สลิปนี้" },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${input.imageType};base64,${input.imageData}`,
                    detail: "high",
                  },
                },
              ],
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "receipt_ocr",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  amount: { type: ["number", "null"], description: "Total amount in THB" },
                  description: { type: ["string", "null"], description: "Main item description" },
                  vendor: { type: ["string", "null"], description: "Vendor/shop name" },
                  date: { type: ["string", "null"], description: "Date in YYYY-MM-DD format" },
                  items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        qty: { type: "number" },
                        price: { type: "number" },
                      },
                      required: ["name", "qty", "price"],
                      additionalProperties: false,
                    },
                  },
                  rawText: { type: "string", description: "All readable text from receipt" },
                  category: { type: ["string", "null"], description: "Suggested category" },
                  confidence: {
                    type: "object",
                    description: "Confidence scores 0-100 per field",
                    properties: {
                      amount: { type: "number" },
                      description: { type: "number" },
                      vendor: { type: "number" },
                      date: { type: "number" },
                      category: { type: "number" },
                    },
                    required: ["amount", "description", "vendor", "date", "category"],
                    additionalProperties: false,
                  },
                },
                required: ["amount", "description", "vendor", "date", "items", "rawText", "category", "confidence"],
                additionalProperties: false,
              },
            },
          },
        });
        const content = response.choices?.[0]?.message?.content;
        if (!content || typeof content !== "string") {
          return { success: false, data: null, error: "ไม่สามารถอ่านข้อมูลจากรูปได้" };
        }
        const parsed = JSON.parse(content);
        return { success: true, data: parsed, error: null };
      } catch (err: any) {
        console.error("OCR error:", err);
        return { success: false, data: null, error: "เกิดข้อผิดพลาดในการอ่าน OCR" };
      }
    }),

    // Get receipt images for a transaction
    getReceiptImages: staffProcedure.input(z.object({
      transactionId: z.number(),
    })).query(async ({ input }) => {
      const images = await listReceiptImages(input.transactionId);
      return images;
    }),

    // Get summary report (all staff can view read-only)
    getSummary: staffProcedure.input(z.object({
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      branchId: z.number().optional(), // area_manager can specify branch
    }).optional()).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input?.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "\u0e44\u0e21\u0e48\u0e44\u0e14\u0e49\u0e1c\u0e39\u0e01\u0e01\u0e31\u0e1a\u0e2a\u0e32\u0e02\u0e32\u0e43\u0e14" });
      const dateFrom = input?.dateFrom ? new Date(input.dateFrom) : undefined;
      const dateTo = input?.dateTo ? new Date(input.dateTo) : undefined;
      const [summary, balance, settings, periodSummary] = await Promise.all([
        getPettyCashSummary(effectiveBranchId, dateFrom, dateTo),
        getPettyCashBalance(effectiveBranchId),
        getPettyCashSettings(effectiveBranchId),
        getPettyCashPeriodSummary(effectiveBranchId),
      ]);
      return { ...summary, currentBalance: balance, settings, periodSummary };
    }),

    // Fund requests
    requestFund: staffProcedure.input(z.object({
      requestedAmount: z.number().min(1),
      reason: z.string().min(1),
      branchId: z.number().optional(), // area_manager can specify branch
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      // branch_staff cannot use accounting system
      if (session.role === "branch_staff") {
        throw new TRPCError({ code: "FORBIDDEN", message: "พนักงานสาขาไม่มีสิทธิ์ใช้ระบบบัญชี" });
      }
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const staffMember = await getStaffById(session.id);
      const settings = await getPettyCashSettings(effectiveBranchId);
      const privilegedRoles = ["branch_owner", "area_manager", "super_admin"];
      const isPrivileged = privilegedRoles.includes(session.role);
      if (!isPrivileged && (!settings || !settings.isActive)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ระบบเบิกจ่ายเงินสดยังไม่เปิดใช้งาน" });
      }
      const id = await createFundRequest({
        branchId: effectiveBranchId,
        requestedAmount: input.requestedAmount,
        reason: input.reason,
        requestedBy: session.id,
        requestedByName: staffMember?.name ?? "Admin",
        status: "pending",
      });
      // Notify branch owner
      await notifyBranchStaff(effectiveBranchId, {
        type: "fund_request",
        title: "คำขอเติมเงินสดย่อย",
        message: `${staffMember?.name ?? "Admin"} ขอเติมเงิน ฿${input.requestedAmount.toLocaleString()} — ${input.reason}`,
        relatedEntity: "petty_cash",
      });
      return { id };
    }),

    listFundRequests: branchAdminProcedure.input(z.object({
      status: z.string().optional(),
      branchId: z.number().optional(), // area_manager/super_admin can specify branch
    }).optional()).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      // super_admin without branchId → see ALL branches' requests
      if (session.role === "super_admin" && !input?.branchId) {
        const requests = await listAllFundRequests(input?.status);
        // Enrich with branch names
        const allBranches = await listBranches();
        const branchMap = Object.fromEntries(allBranches.map(b => [b.id, b.name]));
        return requests.map(r => ({ ...r, branchName: branchMap[r.branchId] || `สาขา #${r.branchId}` }));
      }
      // area_manager without branchId → see all managed branches' requests
      if (session.role === "area_manager" && !input?.branchId) {
        const assignedBranches = await getStaffBranches(session.id);
        if (assignedBranches.length === 0) return [];
        const allRequests = [];
        const allBranches = await listBranches();
        const branchMap = Object.fromEntries(allBranches.map(b => [b.id, b.name]));
        for (const ab of assignedBranches) {
          const reqs = await listFundRequests(ab.branchId, input?.status);
          allRequests.push(...reqs.map(r => ({ ...r, branchName: branchMap[r.branchId] || `สาขา #${r.branchId}` })));
        }
        allRequests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return allRequests;
      }
      const effectiveBranchId = await getEffectiveBranchId(session, input?.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const requests = await listFundRequests(effectiveBranchId, input?.status);
      return requests;
    }),

    processFundRequest: branchAdminProcedure.input(z.object({
      id: z.number(),
      action: z.enum(["approved", "rejected"]),
      note: z.string().optional(),
      depositAmount: z.number().optional(), // if approved, auto-create deposit
      transferMethod: z.enum(["cash", "transfer", "promptpay"]).optional(),
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      if (session.role !== "branch_owner" && session.role !== "super_admin" && session.role !== "area_manager") {
        throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะเจ้าของสาขา/เจ้าของแฟรนไชส์เท่านั้นที่อนุมัติได้" });
      }
      const request = await getFundRequestById(input.id);
      if (!request) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบคำขอ" });
      if (request.status !== "pending") throw new TRPCError({ code: "BAD_REQUEST", message: "คำขอนี้ดำเนินการแล้ว" });
      await updateFundRequestStatus(input.id, input.action, session.id, input.note);
      // If approved and depositAmount provided, auto-create deposit
      if (input.action === "approved" && input.depositAmount) {
        const staffMember = await getStaffById(session.id);
        const currentBalance = await getPettyCashBalance(request.branchId);
        const newBalance = currentBalance + input.depositAmount;
        await createPettyCashTransaction({
          branchId: request.branchId,
          type: "deposit",
          amount: input.depositAmount,
          description: `เติมเงินตามคำขอ #${input.id} — ${request.reason}`,
          transferMethod: (input.transferMethod?.trim() || "transfer") as "cash" | "transfer" | "promptpay",
          transactionDate: new Date(),
          balanceAfter: newBalance,
          createdBy: session.id,
          createdByName: staffMember?.name || "Owner",
          note: input.note || null,
          category: null,
          receiptUrl: null,
        });
        return { balanceAfter: newBalance };
      }
      return { balanceAfter: null };
    }),

    // Super admin: view all branches petty cash
    adminListBranches: superAdminProcedure.query(async () => {
      const allBranches = await listBranches();
      const results = [];
      for (const branch of allBranches) {
        const [settings, balance] = await Promise.all([
          getPettyCashSettings(branch.id),
          getPettyCashBalance(branch.id),
        ]);
        results.push({
          branchId: branch.id,
          branchName: branch.name,
          isActive: settings?.isActive ?? 0,
          balance,
          alertThreshold: settings?.alertThreshold ?? 0,
        });
      }
      return results;
    }),
  }),

  // ═══════════════════════════════════════════════════════
  //  CENTRAL E-COMMERCE SHOP
  // ═══════════════════════════════════════════════════════
  shopCategories: router({
    list: publicProcedure.query(async () => {
      return listShopCategories(true);
    }),
    listAll: superAdminProcedure.query(async () => {
      return listShopCategories(false);
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getShopCategoryById(input.id);
    }),
    create: superAdminProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input }) => {
      const id = await createShopCategory(input);
      return { id };
    }),
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      sortOrder: z.number().optional(),
      isActive: z.number().optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateShopCategory(id, data);
      return { success: true };
    }),
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteShopCategory(input.id);
      return { success: true };
    }),
  }),

  shopProducts: router({
    list: publicProcedure.input(z.object({
      categoryId: z.number().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return listShopProducts({ ...input, activeOnly: true });
    }),
    listAll: superAdminProcedure.input(z.object({
      categoryId: z.number().optional(),
      search: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return listShopProducts({ ...input, activeOnly: false });
    }),
    getById: publicProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getShopProductById(input.id);
    }),
    create: superAdminProcedure.input(z.object({
      categoryId: z.number().optional(),
      sku: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      images: z.array(z.string()).optional(),
      retailPrice: z.number().min(0),
      wholesalePrice: z.number().optional(),
      wholesaleMinQty: z.number().optional(),
      unit: z.string().optional(),
      weight: z.number().optional(),
      stock: z.number().optional(),
      isFeatured: z.number().optional(),
      sortOrder: z.number().optional(),
      commissionType: z.enum(["percent", "fixed"]).optional(),
      commissionValue: z.number().optional(),
      costPrice: z.number().optional(), // ต้นทุนต่อชิ้น (satang)
    })).mutation(async ({ input }) => {
      const id = await createShopProduct(input as any);
      return { id };
    }),
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      categoryId: z.number().optional(),
      sku: z.string().optional(),
      name: z.string().optional(),
      description: z.string().optional(),
      imageUrl: z.string().optional(),
      images: z.array(z.string()).optional(),
      retailPrice: z.number().optional(),
      wholesalePrice: z.number().nullable().optional(),
      wholesaleMinQty: z.number().optional(),
      unit: z.string().optional(),
      weight: z.number().optional(),
      stock: z.number().optional(),
      isActive: z.number().optional(),
      isFeatured: z.number().optional(),
      sortOrder: z.number().optional(),
      commissionType: z.enum(["percent", "fixed"]).nullable().optional(),
      commissionValue: z.number().nullable().optional(),
      costPrice: z.number().nullable().optional(), // ต้นทุนต่อชิ้น (satang)
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateShopProduct(id, data as any);
      return { success: true };
    }),
    delete: superAdminProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
      await deleteShopProduct(input.id);
      return { success: true };
    }),
    uploadImage: superAdminProcedure.input(z.object({
      fileName: z.string(),
      base64: z.string(),
      contentType: z.string(),
    })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `shop-products/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      return { url };
    }),
  }),

  cart: router({
    get: hibiProtectedProcedure.query(async ({ ctx }) => {
      const session = ctx.hibiSession!;
      if (session.type !== "customer") throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะลูกค้า" });
      return getCartItems(session.id);
    }),
    add: hibiProtectedProcedure.input(z.object({
      productId: z.number(),
      quantity: z.number().min(1).default(1),
    })).mutation(async ({ ctx, input }) => {
      const session = ctx.hibiSession!;
      if (session.type !== "customer") throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะลูกค้า" });
      // Check product exists and is active
      const product = await getShopProductById(input.productId);
      if (!product || !product.isActive) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบสินค้า" });
      if (product.stock < input.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: "สินค้าไม่เพียงพอ" });
      await addToCart(session.id, input.productId, input.quantity);
      return { success: true };
    }),
    updateQuantity: hibiProtectedProcedure.input(z.object({
      productId: z.number(),
      quantity: z.number().min(0),
    })).mutation(async ({ ctx, input }) => {
      const session = ctx.hibiSession!;
      if (session.type !== "customer") throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะลูกค้า" });
      await updateCartItemQuantity(session.id, input.productId, input.quantity);
      return { success: true };
    }),
    remove: hibiProtectedProcedure.input(z.object({
      productId: z.number(),
    })).mutation(async ({ ctx, input }) => {
      const session = ctx.hibiSession!;
      if (session.type !== "customer") throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะลูกค้า" });
      await removeCartItem(session.id, input.productId);
      return { success: true };
    }),
    clear: hibiProtectedProcedure.mutation(async ({ ctx }) => {
      const session = ctx.hibiSession!;
      if (session.type !== "customer") throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะลูกค้า" });
      await clearCart(session.id);
      return { success: true };
    }),
  }),

  shopOrders: router({
    create: hibiProtectedProcedure.input(z.object({
      shippingMethod: z.enum(["pickup", "delivery"]),
      pickupBranchId: z.number().optional(),
      shippingAddress: z.string().optional(),
      shippingName: z.string().optional(),
      shippingPhone: z.string().optional(),
      paymentMethod: z.enum(["bank_transfer", "promptpay"]).default("bank_transfer"),
      note: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const session = ctx.hibiSession!;
      if (session.type !== "customer") throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะลูกค้า" });
      // Get cart items
      const items = await getCartItems(session.id);
      if (items.length === 0) throw new TRPCError({ code: "BAD_REQUEST", message: "ตะกร้าว่าง" });
      // Validate stock
      for (const item of items) {
        if (!item.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: `สินค้า ${item.productName} ไม่พร้อมจำหน่าย` });
        if (item.stock < item.quantity) throw new TRPCError({ code: "BAD_REQUEST", message: `สินค้า ${item.productName} เหลือไม่พอ (เหลือ ${item.stock})` });
      }
      // Validate shipping
      if (input.shippingMethod === "pickup" && !input.pickupBranchId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณาเลือกสาขาที่จะรับสินค้า" });
      }
      if (input.shippingMethod === "delivery" && !input.shippingAddress) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "กรุณากรอกที่อยู่จัดส่ง" });
      }
      // Calculate total
      let totalAmount = 0;
      for (const item of items) {
        const price = (item.wholesalePrice && item.quantity >= (item.wholesaleMinQty || 10))
          ? item.wholesalePrice : item.retailPrice;
        totalAmount += price * item.quantity;
      }
      const shippingFee = input.shippingMethod === "delivery" ? 5000 : 0; // 50 baht flat rate
      // Commission calculation
      const primaryBranchId = await getCustomerPrimaryBranchId(session.id);
      let commissionRate: string | null = null;
      let commissionAmount: number | null = null;
      if (primaryBranchId) {
        const settings = await getCommissionSettings(primaryBranchId);
        if (settings && settings.isActive) {
          commissionRate = settings.commissionRate;
          commissionAmount = Math.floor(totalAmount * parseFloat(settings.commissionRate) / 100);
        }
      }
      const orderNumber = generateShopOrderNumber();
      const orderId = await createShopOrder({
        orderNumber,
        customerId: session.id,
        status: "pending_payment",
        totalAmount: totalAmount + shippingFee,
        shippingMethod: input.shippingMethod,
        shippingFee,
        pickupBranchId: input.pickupBranchId || null,
        shippingAddress: input.shippingAddress || null,
        shippingName: input.shippingName || null,
        shippingPhone: input.shippingPhone || null,
        paymentMethod: input.paymentMethod,
        note: input.note || null,
        commissionBranchId: primaryBranchId,
        commissionRate,
        commissionAmount,
      });
      // Create order items
      const orderItems = items.map(item => {
        const price = (item.wholesalePrice && item.quantity >= (item.wholesaleMinQty || 10))
          ? item.wholesalePrice : item.retailPrice;
        return {
          orderId,
          productId: item.productId,
          productName: item.productName,
          productSku: item.productSku,
          price,
          quantity: item.quantity,
          subtotal: price * item.quantity,
        };
      });
      await createShopOrderItems(orderItems);
      // Decrement stock
      for (const item of items) {
        await decrementStock(item.productId, item.quantity);
      }
      // Clear cart
      await clearCart(session.id);
      // Audit log
      await createAuditLog({
        actorType: "customer",
        actorId: session.id,
        action: "create_shop_order",
        entity: "shop_order",
        entityId: orderId,
        details: `สร้างคำสั่งซื้อ ${orderNumber} จำนวน ${items.length} รายการ ยอดรวม ${((totalAmount + shippingFee) / 100).toFixed(2)} บาท`,
      });
      return { orderId, orderNumber };
    }),
    getById: hibiProtectedProcedure.input(z.object({ id: z.number() })).query(async ({ ctx, input }) => {
      const session = ctx.hibiSession!;
      const order = await getShopOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบคำสั่งซื้อ" });
      // Customer can only see their own orders
      if (session.type === "customer" && order.customerId !== session.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ไม่มีสิทธิ์" });
      }
      const items = await getShopOrderItems(order.id);
      return { ...order, items };
    }),
    myOrders: hibiProtectedProcedure.input(z.object({
      status: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ ctx, input }) => {
      const session = ctx.hibiSession!;
      if (session.type !== "customer") throw new TRPCError({ code: "FORBIDDEN", message: "เฉพาะลูกค้า" });
      return listShopOrders({ customerId: session.id, ...input });
    }),
    uploadSlip: hibiProtectedProcedure.input(z.object({
      orderId: z.number(),
      base64: z.string(),
      fileName: z.string(),
      contentType: z.string(),
    })).mutation(async ({ ctx, input }) => {
      const session = ctx.hibiSession!;
      const order = await getShopOrderById(input.orderId);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบคำสั่งซื้อ" });
      if (session.type === "customer" && order.customerId !== session.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "ไม่มีสิทธิ์" });
      }
      if (order.status !== "pending_payment" && order.status !== "payment_uploaded") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่สามารถอัปโหลดสลิปได้ในสถานะนี้" });
      }
      const buffer = Buffer.from(input.base64, "base64");
      const key = `shop-slips/${order.orderNumber}-${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      await updateShopOrder(order.id, { paymentSlipUrl: url, status: "payment_uploaded" });
      return { url };
    }),
    // Admin: list all orders
    listAll: superAdminProcedure.input(z.object({
      status: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return listShopOrders(input);
    }),
    // Admin: update order status
    updateStatus: superAdminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending_payment", "payment_uploaded", "payment_confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"]),
      trackingNumber: z.string().optional(),
      adminNote: z.string().optional(),
    })).mutation(async ({ ctx, input }) => {
      const session = ctx.hibiSession!;
      const order = await getShopOrderById(input.id);
      if (!order) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบคำสั่งซื้อ" });
      const updateData: any = { status: input.status };
      if (input.trackingNumber) updateData.trackingNumber = input.trackingNumber;
      if (input.adminNote) updateData.adminNote = input.adminNote;
      if (input.status === "payment_confirmed") {
        updateData.paymentConfirmedBy = session.id;
        updateData.paymentConfirmedAt = new Date();
      }
      await updateShopOrder(order.id, updateData);
      await createAuditLog({
        actorType: "staff",
        actorId: session.id,
        action: "update_shop_order_status",
        entity: "shop_order",
        entityId: order.id,
        details: `อัปเดตสถานะคำสั่งซื้อ ${order.orderNumber} จาก ${order.status} เป็น ${input.status}`,
        beforeData: { status: order.status },
        afterData: { status: input.status },
      });
      return { success: true };
    }),
  }),

  commissions: router({
    settings: superAdminProcedure.query(async () => {
      return listAllCommissionSettings();
    }),
    upsert: superAdminProcedure.input(z.object({
      branchId: z.number(),
      commissionRate: z.string(),
      minMonthlySales: z.number().optional(),
      note: z.string().optional(),
    })).mutation(async ({ input }) => {
      await upsertCommissionSettings(input.branchId, input);
      return { success: true };
    }),
    report: superAdminProcedure.input(z.object({
      branchId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
    }).optional()).query(async ({ input }) => {
      return getCommissionReport({
        branchId: input?.branchId,
        startDate: input?.startDate ? new Date(input.startDate) : undefined,
        endDate: input?.endDate ? new Date(input.endDate) : undefined,
      });
    }),
  }),

  // ── Daily Sales Accounting ──
  dailySales: router({
    // Create or update daily sales record
      upsert: requirePermission("manage_accounting").input(z.object({
      salesDate: z.string(), // ISO date string
      cashAmount: z.number().min(0),
      transferAmount: z.number().min(0),
      edcAmount: z.number().min(0),
      deliveryAmount: z.number().min(0),
      extraChannels: z.array(z.object({
        channelName: z.string().min(1),
        amount: z.number().min(0),
      })).optional(),
      note: z.string().optional(),
      branchId: z.number().optional(), // area_manager can specify branch
      categoryItems: z.array(z.object({
        categoryId: z.number(),
        amount: z.number().min(0),
        note: z.string().optional(),
      })).optional(),
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const salesDate = new Date(input.salesDate);
      
      // 3-day lock: only super_admin and area_manager can edit records older than 3 days
      const now = new Date();
      const diffMs = now.getTime() - salesDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      const LOCK_DAYS = 3;
      const canOverrideLock = session.role === "super_admin" || session.role === "area_manager";
      if (diffDays > LOCK_DAYS && !canOverrideLock) {
        throw new TRPCError({ code: "FORBIDDEN", message: `ไม่สามารถแก้ไขบัญชีรายวันที่ผ่านไปเกิน ${LOCK_DAYS} วันแล้ว` });
      }
      
      const extraTotal = (input.extraChannels || []).reduce((sum, ch) => sum + ch.amount, 0);
      const totalAmount = input.cashAmount + input.transferAmount + input.edcAmount + input.deliveryAmount + extraTotal;
      // Check if record exists for this date
      const existing = await getDailySalesRecordByDate(effectiveBranchId, salesDate);

      const staffMember = await getStaffById(session.id);
      if (existing) {
        // Capture before data for audit trail
        const beforeData = JSON.stringify({
          cashAmount: existing.cashAmount,
          transferAmount: existing.transferAmount,
          edcAmount: existing.edcAmount,
          deliveryAmount: existing.deliveryAmount,
          extraTotal: existing.extraTotal,
          totalAmount: existing.totalAmount,
          note: existing.note,
        });
        // Update existing record
        await updateDailySalesRecord(existing.id, {
          cashAmount: input.cashAmount,
          transferAmount: input.transferAmount,
          edcAmount: input.edcAmount,
          deliveryAmount: input.deliveryAmount,
          extraTotal,
          totalAmount,
          note: input.note || null,
          updatedBy: session.id,
        });
        // Replace extra channels
        await deleteExtraChannelsBySalesRecordId(existing.id);
        if (input.extraChannels && input.extraChannels.length > 0) {
          await createDailySalesExtraChannels(
            input.extraChannels.map(ch => ({ salesRecordId: existing.id, channelName: ch.channelName, amount: ch.amount }))
          );
        }
        // Replace category items
        await deleteDailySalesItemsByRecordId(existing.id);
        if (input.categoryItems && input.categoryItems.length > 0) {
          await createDailySalesItems(
            input.categoryItems.filter(ci => ci.amount > 0).map(ci => ({ salesRecordId: existing.id, categoryId: ci.categoryId, amount: ci.amount, note: ci.note || null }))
          );
        }
        // Audit trail: log update
        const afterData = JSON.stringify({
          cashAmount: input.cashAmount,
          transferAmount: input.transferAmount,
          edcAmount: input.edcAmount,
          deliveryAmount: input.deliveryAmount,
          extraTotal,
          totalAmount,
          note: input.note || null,
          extraChannels: input.extraChannels || [],
          categoryItems: input.categoryItems || [],
        });
        await createDailySalesAuditLog({
          salesRecordId: existing.id,
          branchId: effectiveBranchId,
          userId: session.id,
          userName: staffMember?.name ?? null,
          action: "update",
          beforeData,
          afterData,
        });
        return { id: existing.id, updated: true };
      } else {
        // Create new record
        const id = await createDailySalesRecord({
          branchId: effectiveBranchId,
          salesDate,
          cashAmount: input.cashAmount,
          transferAmount: input.transferAmount,
          edcAmount: input.edcAmount,
          deliveryAmount: input.deliveryAmount,
          extraTotal,
          totalAmount,
          note: input.note || null,
          createdBy: session.id,
          createdByName: staffMember?.name ?? "Unknown",
        });
        if (id && input.extraChannels && input.extraChannels.length > 0) {
          await createDailySalesExtraChannels(
            input.extraChannels.map(ch => ({ salesRecordId: id, channelName: ch.channelName, amount: ch.amount }))
          );
        }
        if (id && input.categoryItems && input.categoryItems.length > 0) {
          await createDailySalesItems(
            input.categoryItems.filter(ci => ci.amount > 0).map(ci => ({ salesRecordId: id, categoryId: ci.categoryId, amount: ci.amount, note: ci.note || null }))
          );
        }
        // Audit trail: log create
        if (id) {
          const afterData = JSON.stringify({
            cashAmount: input.cashAmount,
            transferAmount: input.transferAmount,
            edcAmount: input.edcAmount,
            deliveryAmount: input.deliveryAmount,
            extraTotal,
            totalAmount,
            note: input.note || null,
            extraChannels: input.extraChannels || [],
            categoryItems: input.categoryItems || [],
          });
          await createDailySalesAuditLog({
            salesRecordId: id,
            branchId: effectiveBranchId,
            userId: session.id,
            userName: staffMember?.name ?? null,
            action: "create",
            beforeData: null,
            afterData,
          });
        }
        return { id, updated: false };
      }
    }),

    // Get record for a specific date (all staff can view)
    getByDate: staffProcedure.input(z.object({
      salesDate: z.string(),
      branchId: z.number().optional(), // area_manager can specify branch
    })).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const record = await getDailySalesRecordByDate(effectiveBranchId, new Date(input.salesDate));
      if (!record) return null;
      const [extraChannels, categoryItems] = await Promise.all([
        getExtraChannelsBySalesRecordId(record.id),
        getDailySalesItemsByRecordId(record.id),
      ]);
      return { ...record, extraChannels, categoryItems };
    }),

    // List records with pagination (all staff can view)
    list: staffProcedure.input(z.object({
      limit: z.number().min(1).max(100).default(31),
      offset: z.number().min(0).default(0),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
      branchId: z.number().optional(), // area_manager can specify branch
    }).optional()).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input?.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const dateFrom = input?.dateFrom ? new Date(input.dateFrom) : undefined;
      const dateTo = input?.dateTo ? new Date(input.dateTo) : undefined;
      const [records, total] = await Promise.all([
        listDailySalesRecords(effectiveBranchId, input?.limit ?? 31, input?.offset ?? 0, dateFrom, dateTo),
        countDailySalesRecords(effectiveBranchId, dateFrom, dateTo),
      ]);
      return { records, total };
    }),

    // Monthly summary for current branch (all staff can view)
    monthlySummary: staffProcedure.input(z.object({
      year: z.number(),
      month: z.number().min(1).max(12),
      branchId: z.number().optional(), // area_manager can specify branch
    })).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      return getMonthlySalesSummary(effectiveBranchId, input.year, input.month);
    }),

    // All branches monthly summary (super admin / area manager)
    allBranchesSummary: branchAdminProcedure.input(z.object({
      year: z.number(),
      month: z.number().min(1).max(12),
      zoneId: z.number().optional(),
    })).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      // Only super admin, area manager, and branch owner can see multi-branch summaries
      if (session.role !== "super_admin" && session.role !== "area_manager" && session.role !== "branch_owner") {
        throw new TRPCError({ code: "FORBIDDEN", message: "ไม่มีสิทธิ์ดูรายงานรวมทุกสาขา" });
      }
      const summaries = await getAllBranchesMonthlySummary(input.year, input.month);
      const allBranches = await listBranches();
      let filteredSummaries = summaries;
      // Area manager: filter to managed branches only
      if (session.role === "area_manager") {
        const assignedBranches = await getStaffBranches(session.id);
        const branchIds = assignedBranches.map(b => b.branchId);
        filteredSummaries = summaries.filter(s => branchIds.includes(s.branchId));
      }
      // Zone filter
      if (input.zoneId) {
        const zoneBranchIds = allBranches.filter(b => (b as any).zoneId === input.zoneId).map(b => b.id);
        filteredSummaries = filteredSummaries.filter(s => zoneBranchIds.includes(s.branchId));
      }
      return filteredSummaries.map(s => ({
        ...s,
        branchName: allBranches.find(b => b.id === s.branchId)?.name || `สาขา #${s.branchId}`,
        zoneId: (allBranches.find(b => b.id === s.branchId) as any)?.zoneId ?? null,
      }));
    }),

    // Get record by ID with extra channels + category items (all staff can view)
    getById: staffProcedure.input(z.object({
      id: z.number(),
    })).query(async ({ input }) => {
      const record = await getDailySalesRecordById(input.id);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบข้อมูล" });
      const [extraChannels, categoryItems] = await Promise.all([
        getExtraChannelsBySalesRecordId(record.id),
        getDailySalesItemsByRecordId(record.id),
      ]);
      return { ...record, extraChannels, categoryItems };
    }),

    // Monthly sales by category breakdown (all staff can view)
    monthlyCategoryBreakdown: staffProcedure.input(z.object({
      year: z.number(),
      month: z.number().min(1).max(12),
      branchId: z.number().optional(),
    })).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      return getMonthlySalesByCategory(effectiveBranchId, input.year, input.month);
    }),

    // Commission calculation for a branch (all staff can view)
    commission: staffProcedure.input(z.object({
      year: z.number(),
      month: z.number().min(1).max(12),
      branchId: z.number().optional(),
    })).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      return getStaffCommission(effectiveBranchId, input.year, input.month);
    }),

    // Get audit logs for a specific sales record
    auditLogs: branchAdminProcedure.input(z.object({
      salesRecordId: z.number(),
    })).query(async ({ input }) => {
      return getDailySalesAuditLogs(input.salesRecordId);
    }),

    // Get audit logs for a branch (recent changes)
    branchAuditLogs: branchAdminProcedure.input(z.object({
      branchId: z.number(),
      limit: z.number().min(1).max(200).default(50),
    })).query(async ({ input }) => {
      return getDailySalesAuditLogsByBranch(input.branchId, input.limit);
    }),
    // Date range summary: flexible date range summary with daily breakdown
    dateRangeSummary: staffProcedure.input(z.object({
      startDate: z.string(),
      endDate: z.string(),
      branchId: z.number().optional(),
    })).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const start = new Date(input.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(input.endDate);
      end.setHours(23, 59, 59, 999);
      // Get aggregated summary
      const summary = await getDateRangeSalesSummary(effectiveBranchId, start, end);
      // Get category breakdown
      const categoryBreakdown = await getDateRangeSalesByCategory(effectiveBranchId, start, end);
      // Get daily records for day-by-day view
      const dailyRecords = await getDailySalesRecordsByRange(effectiveBranchId, start, end);
      // Get petty cash expenses in range
      const pettyCashExpenses = await listPettyCashTransactions(effectiveBranchId, 500, 0, start, end, "expense");
      const totalExpenses = pettyCashExpenses.reduce((sum, t) => sum + Number(t.amount), 0);
      return {
        startDate: input.startDate,
        endDate: input.endDate,
        branchId: effectiveBranchId,
        summary: summary ? {
          totalCash: Number(summary.totalCash),
          totalTransfer: Number(summary.totalTransfer),
          totalEdc: Number(summary.totalEdc),
          totalDelivery: Number(summary.totalDelivery),
          totalExtra: Number(summary.totalExtra),
          grandTotal: Number(summary.grandTotal),
          recordCount: summary.recordCount,
        } : null,
        categoryBreakdown: categoryBreakdown.map(cb => ({
          categoryId: cb.categoryId,
          categoryName: cb.categoryName,
          totalAmount: Number(cb.totalAmount),
          itemCount: cb.itemCount,
        })),
        dailyRecords: dailyRecords.map(r => ({
          id: r.id,
          salesDate: r.salesDate,
          cashAmount: Number(r.cashAmount),
          transferAmount: Number(r.transferAmount),
          edcAmount: Number(r.edcAmount),
          deliveryAmount: Number(r.deliveryAmount),
          extraTotal: Number(r.extraTotal),
          totalAmount: Number(r.totalAmount),
          note: r.note,
        })),
        totalExpenses,
        netProfit: (summary ? Number(summary.grandTotal) : 0) - totalExpenses,
      };
    }),

    // Daily expense summary: combines daily sales + petty cash expenses for a given date
    dailyExpenseSummary: staffProcedure.input(z.object({
      salesDate: z.string(),
      branchId: z.number().optional(),
    })).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input.branchId);
      if (!effectiveBranchId) throw new TRPCError({ code: "BAD_REQUEST", message: "ไม่ได้ผูกกับสาขาใด" });
      const salesDate = new Date(input.salesDate);
      const startOfDay = new Date(salesDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(salesDate);
      endOfDay.setHours(23, 59, 59, 999);
      // Get daily sales record
      const salesRecord = await getDailySalesRecordByDate(effectiveBranchId, salesDate);
      // Get petty cash expenses for that day
      const pettyCashExpenses = await listPettyCashTransactions(effectiveBranchId, 200, 0, startOfDay, endOfDay, "expense");
      // Get petty cash deposits for that day
      const pettyCashDeposits = await listPettyCashTransactions(effectiveBranchId, 200, 0, startOfDay, endOfDay, "deposit");
      // Calculate totals
      const totalIncome = salesRecord ? Number(salesRecord.totalAmount) / 100 : 0;
      const totalExpenses = pettyCashExpenses.reduce((sum, t) => sum + Number(t.amount) / 100, 0);
      const totalDeposits = pettyCashDeposits.reduce((sum, t) => sum + Number(t.amount) / 100, 0);
      const netProfit = totalIncome - totalExpenses;
      // Get extra channels
      let extraChannels: { channelName: string; amount: number }[] = [];
      if (salesRecord) {
        const extras = await getExtraChannelsBySalesRecordId(salesRecord.id);
        extraChannels = extras.map(e => ({ channelName: e.channelName, amount: Number(e.amount) / 100 }));
      }
      // Get category items
      let categoryItems: { categoryName: string; amount: number; note: string | null }[] = [];
      if (salesRecord) {
        const items = await getDailySalesItemsByRecordId(salesRecord.id);
        categoryItems = items.map(i => ({ categoryName: `หมวดหมู่ #${i.categoryId}`, amount: Number(i.amount) / 100, note: i.note }));
      }
      return {
        date: input.salesDate,
        branchId: effectiveBranchId,
        income: {
          cash: salesRecord ? Number(salesRecord.cashAmount) / 100 : 0,
          transfer: salesRecord ? Number(salesRecord.transferAmount) / 100 : 0,
          edc: salesRecord ? Number(salesRecord.edcAmount) / 100 : 0,
          delivery: salesRecord ? Number(salesRecord.deliveryAmount) / 100 : 0,
          extra: extraChannels,
          total: totalIncome,
        },
        expenses: pettyCashExpenses.map(t => ({
          id: t.id,
          description: t.description,
          category: t.category,
          amount: Number(t.amount) / 100,
          note: t.note,
        })),
        deposits: pettyCashDeposits.map(t => ({
          id: t.id,
          description: t.description,
          amount: Number(t.amount) / 100,
        })),
        categoryItems,
        totalIncome,
        totalExpenses,
        totalDeposits,
        netProfit,
        note: salesRecord?.note || "",
      };
    }),
  }),

  // ── Sales Categories ──
  salesCategories: router({
    list: staffProcedure.input(z.object({
      branchId: z.number().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      const effectiveBranchId = await getEffectiveBranchId(session, input?.branchId);
      return listSalesCategories(effectiveBranchId || undefined);
    }),

    listAll: branchAdminProcedure.query(async () => {
      return listAllSalesCategories();
    }),

    create: staffProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      branchId: z.number().nullable().optional(),
      commissionRate: z.number().min(0).max(100).default(0),
      sortOrder: z.number().default(0),
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      // Check if manager has permission to edit commission
      if (session.role === "branch_manager") {
        const effectiveBranchId = await getEffectiveBranchId(session, input.branchId ?? undefined);
        if (effectiveBranchId) {
          const branch = await getBranchById(effectiveBranchId);
          if (branch && !branch.allowManagerEditCommission) {
            throw new TRPCError({ code: "FORBIDDEN", message: "ผู้จัดการไม่มีสิทธิ์ตั้งค่าคอมมิชชั่น กรุณาติดต่อเจ้าของสาขา" });
          }
        }
      }
      const id = await createSalesCategory({
        name: input.name,
        description: input.description || null,
        branchId: input.branchId ?? null,
        commissionRate: String(input.commissionRate),
        sortOrder: input.sortOrder,
      });
      return { id };
    }),

    update: staffProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      branchId: z.number().nullable().optional(),
      commissionRate: z.number().min(0).max(100).optional(),
      sortOrder: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      // Check if manager has permission to edit commission
      if (session.role === "branch_manager" && input.commissionRate !== undefined) {
        const cat = await getSalesCategoryById(input.id);
        const effectiveBranchId = await getEffectiveBranchId(session, cat?.branchId ?? undefined);
        if (effectiveBranchId) {
          const branch = await getBranchById(effectiveBranchId);
          if (branch && !branch.allowManagerEditCommission) {
            throw new TRPCError({ code: "FORBIDDEN", message: "ผู้จัดการไม่มีสิทธิ์แก้ไขคอมมิชชั่น กรุณาติดต่อเจ้าของสาขา" });
          }
        }
      }
      // Standard categories cannot be deleted/renamed by non-super_admin
      if (session.role !== "super_admin") {
        const cat = await getSalesCategoryById(input.id);
        if (cat?.isStandard && (input.name !== undefined)) {
          throw new TRPCError({ code: "FORBIDDEN", message: "ไม่สามารถเปลี่ยนชื่อหมวดหมู่มาตรฐานได้" });
        }
      }
      const { id, ...data } = input;
      const updateData: any = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.branchId !== undefined) updateData.branchId = data.branchId;
      if (data.commissionRate !== undefined) updateData.commissionRate = String(data.commissionRate);
      if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
      await updateSalesCategory(id, updateData);
      return { success: true };
    }),

    delete: staffProcedure.input(z.object({
      id: z.number(),
    })).mutation(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      // Standard categories cannot be deleted by non-super_admin
      const cat = await getSalesCategoryById(input.id);
      if (cat?.isStandard && session.role !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "ไม่สามารถลบหมวดหมู่มาตรฐานได้" });
      }
      await deleteSalesCategory(input.id);
      return { success: true };
    }),
  }),
  // ── Franchise Owners ──
  franchiseOwners: router({
    list: superAdminProcedure.input(z.object({ activeOnly: z.boolean().optional() }).optional()).query(async ({ input }) => {
      return listFranchiseOwners(input?.activeOnly !== false);
    }),
    getById: superAdminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      return getFranchiseOwnerById(input.id);
    }),
    create: superAdminProcedure.input(z.object({
      name: z.string().min(1),
      companyName: z.string().optional(),
      phone: z.string().optional(),
      email: z.string().optional(),
    })).mutation(async ({ input, ctx }) => {
      const id = await createFranchiseOwner(input);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_franchise_owner", entity: "franchise_owner", entityId: id, details: `สร้างเจ้าของแฟรนไชส์: ${input.name}`, afterData: input });
      return { id };
    }),
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().optional(),
      companyName: z.string().nullable().optional(),
      phone: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      isActive: z.number().optional(),
    })).mutation(async ({ input, ctx }) => {
      const { id, ...data } = input;
      await updateFranchiseOwner(id, data as any);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "update_franchise_owner", entity: "franchise_owner", entityId: id, details: `อัปเดตเจ้าของแฟรนไชส์ ID: ${id}`, afterData: data });
      return { success: true };
    }),
    branches: superAdminProcedure.input(z.object({ franchiseOwnerId: z.number() })).query(async ({ input }) => {
      return getBranchesByFranchiseOwner(input.franchiseOwnerId);
    }),
    assignBranch: superAdminProcedure.input(z.object({
      branchId: z.number(),
      franchiseOwnerId: z.number().nullable(),
    })).mutation(async ({ input, ctx }) => {
      await assignBranchToFranchiseOwner(input.branchId, input.franchiseOwnerId);
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "assign_branch_franchise", entity: "branch", entityId: input.branchId, details: `ผูกสาขา ${input.branchId} กับ franchise owner ${input.franchiseOwnerId}`, afterData: input });
      return { success: true };
    }),
  }),

  // ── In-Store Product Sales ──
  inStoreSales: router({
    create: staffProcedure.input(z.object({
      branchId: z.number(),
      customerId: z.number(),
      productId: z.number(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
      paymentSlipUrl: z.string().optional(),
      staffIds: z.array(z.number()).min(1).max(10),
      saleDate: z.string().optional(), // ISO date, defaults to now
      note: z.string().optional(),
      isAppSale: z.boolean().optional(), // true = ลูกค้าซื้อผ่านแอพ (ไม่คิดคอม)
    })).mutation(async ({ input, ctx }) => {
      // Get product to calculate commission
      const product = await getShopProductById(input.productId);
      if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบสินค้า" });
      
      const totalAmount = input.unitPrice * input.quantity;
      const isAppSale = input.isAppSale ? 1 : 0;
      
      // Calculate total cost from product costPrice
      const costPrice = (product as any).costPrice ?? 0;
      const totalCost = costPrice * input.quantity;
      
      // Get branch to determine commission mode
      const branch = await getBranchById(input.branchId);
      const commissionMode = branch?.commissionMode || "product";
      
      let commType: "percent" | "fixed" | null = null;
      let commValue = 0;
      let totalCommission = 0;
      
      // App sales = no commission (store revenue only)
      if (isAppSale) {
        commType = null;
        commValue = 0;
        totalCommission = 0;
      } else if (commissionMode === "product") {
        // Mode A: Commission from product settings
        commType = product.commissionType as "percent" | "fixed" | null;
        commValue = product.commissionValue ?? 0;
        totalCommission = calculateCommission(commType, commValue, totalAmount);
      } else {
        // Mode B: Commission from staff settings — calculate per staff then sum
        commType = "percent"; // placeholder, actual calc is per-staff below
        commValue = 0;
        totalCommission = 0;
        for (const staffId of input.staffIds) {
          const staffMember = await getStaffById(staffId);
          if (staffMember) {
            const sType = (staffMember as any).commissionType as "percent" | "fixed" | null;
            const sValue = (staffMember as any).commissionValue ?? 0;
            totalCommission += calculateCommission(sType, sValue, totalAmount);
          }
        }
      }
      
      // Calculate points (10 baht = 1 point)
      const pointsAwarded = Math.floor(totalAmount / 100 / 10); // satang to baht, then /10
      
      const saleId = await createInStoreSale({
        branchId: input.branchId,
        customerId: input.customerId,
        productId: input.productId,
        quantity: input.quantity,
        unitPrice: input.unitPrice,
        totalAmount,
        paymentSlipUrl: input.paymentSlipUrl,
        commissionType: commType ?? undefined,
        commissionValue: commValue,
        totalCommission,
        pointsAwarded,
        isAppSale,
        totalCost,
        saleDate: input.saleDate ? new Date(input.saleDate) : new Date(),
        note: input.note,
        createdBy: ctx.hibiSession!.id,
        staffIds: input.staffIds,
      });
      
      // Award loyalty points to customer
      if (pointsAwarded > 0) {
        const lp = await getOrCreateLoyaltyPoints(input.customerId);
        await addPoints(input.customerId, pointsAwarded, "earn_store", totalAmount / 100, `สะสมแต้มจากซื้อสินค้าหน้าร้าน: ${product.name} x${input.quantity}`, input.branchId, ctx.hibiSession!.id);
        await addBranchPoints(input.customerId, input.branchId, pointsAwarded);
      }
      
      // Update commission records for each staff (skip for app sales)
      const saleMonth = (input.saleDate ? new Date(input.saleDate) : new Date()).toISOString().slice(0, 7);
      if (isAppSale) {
        // App sales: no commission records to update
      } else if (commissionMode === "product") {
        // Mode A: split equally among all staff
        const perStaffCommission = input.staffIds.length > 0 ? Math.floor(totalCommission / input.staffIds.length) : 0;
        for (const staffId of input.staffIds) {
          await upsertCommissionRecord({
            staffId,
            branchId: input.branchId,
            month: saleMonth,
            salesAmount: totalAmount,
            commission: perStaffCommission,
          });
        }
      } else {
        // Mode B: each staff gets their own rate
        for (const staffId of input.staffIds) {
          const staffMember = await getStaffById(staffId);
          const sType = (staffMember as any)?.commissionType as "percent" | "fixed" | null;
          const sValue = (staffMember as any)?.commissionValue ?? 0;
          const staffComm = calculateCommission(sType, sValue, totalAmount);
          await upsertCommissionRecord({
            staffId,
            branchId: input.branchId,
            month: saleMonth,
            salesAmount: totalAmount,
            commission: staffComm,
          });
        }
      }
      
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "create_in_store_sale", entity: "in_store_sale", entityId: saleId, details: `ขายสินค้าหน้าร้าน: ${product.name} x${input.quantity} = ${totalAmount/100} บาท`, afterData: JSON.stringify({ ...input, totalAmount, totalCommission, pointsAwarded }) });
      
      return { saleId, totalAmount, totalCommission, totalCost, pointsAwarded, isAppSale };
    }),
    
    list: staffProcedure.input(z.object({
      branchId: z.number().optional(),
      staffId: z.number().optional(),
      customerId: z.number().optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    }).optional()).query(async ({ input }) => {
      return listInStoreSales({
        branchId: input?.branchId,
        staffId: input?.staffId,
        customerId: input?.customerId,
        startDate: input?.startDate ? new Date(input.startDate) : undefined,
        endDate: input?.endDate ? new Date(input.endDate) : undefined,
        limit: input?.limit,
        offset: input?.offset,
      });
    }),
    
    getById: staffProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const sale = await getInStoreSaleById(input.id);
      if (!sale) throw new TRPCError({ code: "NOT_FOUND" });
      return sale;
    }),
    
    getStaff: staffProcedure.input(z.object({ saleId: z.number() })).query(async ({ input }) => {
      return getInStoreSaleStaff(input.saleId);
    }),
    
    summary: staffProcedure.input(z.object({
      branchId: z.number(),
      date: z.string(), // ISO date
    })).query(async ({ input }) => {
      return getInStoreSalesSummary(input.branchId, new Date(input.date));
    }),
    
    uploadSlip: staffProcedure.input(z.object({
      fileName: z.string(),
      base64: z.string(),
      contentType: z.string(),
    })).mutation(async ({ input }) => {
      const buffer = Buffer.from(input.base64, "base64");
      const key = `in-store-slips/${Date.now()}-${input.fileName}`;
      const { url } = await storagePut(key, buffer, input.contentType);
      return { url };
    }),

    // Quick register customer from in-store sales page
    quickRegisterCustomer: staffProcedure.input(z.object({
      phone: z.string().min(9).max(15),
      name: z.string().min(1),
      email: z.string().email().optional(),
    })).mutation(async ({ input, ctx }) => {
      let cleanPhone = input.phone.replace(/\D/g, "");
      if (cleanPhone.startsWith("66") && cleanPhone.length >= 11) {
        cleanPhone = "0" + cleanPhone.slice(2);
      }
      if (cleanPhone.length < 9 || cleanPhone.length > 15) throw new TRPCError({ code: "BAD_REQUEST", message: "เบอร์โทรต้องมี 9-15 หลัก" });
      const existing = await getCustomerByPhone(cleanPhone);
      if (existing) {
        // Return existing customer instead of error - staff can use them directly
        return { success: true, customerId: existing.id, customerName: existing.name, customerPhone: existing.phone, isExisting: true };
      }
      if (input.email) {
        const existingEmail = await getCustomerByEmail(input.email.toLowerCase().trim());
        if (existingEmail) throw new TRPCError({ code: "CONFLICT", message: "อีเมลนี้ถูกใช้งานแล้ว" });
      }
      // Generate a temporary password (customer can reset later)
      const tempPassword = `hibi${cleanPhone.slice(-4)}${Date.now().toString(36).slice(-4)}`;
      const passwordHash = await bcrypt.hash(tempPassword, 12);
      const id = await createCustomer({
        phone: cleanPhone, passwordHash, name: input.name, email: (input.email || '').toLowerCase().trim(),
        address: null, province: null,
      });
      await createAuditLog({ actorType: "staff", actorId: ctx.hibiSession!.id, actorName: null, action: "quick_register_customer", entity: "customer", entityId: id, details: `พนักงานสมัครสมาชิกให้ลูกค้า: ${cleanPhone} (${input.name})`, afterData: { phone: cleanPhone, name: input.name } });
      return { success: true, customerId: id, customerName: input.name, customerPhone: cleanPhone, isExisting: false, tempPassword };
    }),
  }),

  // ── Commission Reports (Monthly) ──
  commissionReports: router({
    monthly: superAdminProcedure.input(z.object({
      month: z.string(), // YYYY-MM
      branchId: z.number().optional(),
      franchiseOwnerId: z.number().optional(),
      staffId: z.number().optional(),
    })).query(async ({ input }) => {
      return getMonthlyCommissionReport(input);
    }),
    
    updateStatus: superAdminProcedure.input(z.object({
      id: z.number(),
      status: z.enum(["pending", "approved", "paid"]),
    })).mutation(async ({ input, ctx }) => {
      await updateCommissionStatus(input.id, input.status, ctx.hibiSession!.id);
      return { success: true };
    }),
    
    bulkUpdateStatus: superAdminProcedure.input(z.object({
      ids: z.array(z.number()),
      status: z.enum(["pending", "approved", "paid"]),
    })).mutation(async ({ input, ctx }) => {
      for (const id of input.ids) {
        await updateCommissionStatus(id, input.status, ctx.hibiSession!.id);
      }
      return { success: true, count: input.ids.length };
    }),
  }),

  // ── Service Zones ──
  zones: router({
    list: branchAdminProcedure.input(z.object({
      includeInactive: z.boolean().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      // super_admin sees all, area_manager sees all active
      const includeInactive = ctx.hibiSession!.role === "super_admin" && input?.includeInactive;
      return listServiceZones(includeInactive ?? false);
    }),
    getById: superAdminProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
      const zone = await getServiceZoneById(input.id);
      if (!zone) throw new TRPCError({ code: "NOT_FOUND", message: "ไม่พบเขตบริการ" });
      return zone;
    }),
    create: superAdminProcedure.input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
    })).mutation(async ({ input }) => {
      const id = await createServiceZone({ name: input.name, description: input.description ?? null } as any);
      await createAuditLog({ actorType: "staff", actorId: 0, actorName: "Super Admin", action: "create_zone", entity: "service_zone", entityId: id, details: `สร้างเขตบริการ: ${input.name}` });
      return { id };
    }),
    update: superAdminProcedure.input(z.object({
      id: z.number(),
      name: z.string().min(1).optional(),
      description: z.string().optional(),
      isActive: z.number().min(0).max(1).optional(),
    })).mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateServiceZone(id, data as any);
      await createAuditLog({ actorType: "staff", actorId: 0, actorName: "Super Admin", action: "update_zone", entity: "service_zone", entityId: id, details: `แก้ไขเขตบริการ #${id}` });
      return { success: true };
    }),
    branches: branchAdminProcedure.input(z.object({ zoneId: z.number() })).query(async ({ input }) => {
      return listBranchesByZone(input.zoneId);
    }),
    assignBranch: superAdminProcedure.input(z.object({
      branchId: z.number(),
      zoneId: z.number().nullable(),
    })).mutation(async ({ input }) => {
      await updateBranchZone(input.branchId, input.zoneId);
      await createAuditLog({ actorType: "staff", actorId: 0, actorName: "Super Admin", action: "assign_branch_zone", entity: "branch", entityId: input.branchId, details: `กำหนดสาขา #${input.branchId} เข้าเขต ${input.zoneId ?? "ไม่มี"}` });
      return { success: true };
    }),
    branchesWithZone: branchAdminProcedure.query(async () => {
      return listBranchesWithZone();
    }),
  }),
  // ── Multi-Branch Overview Dashboard ──
  multiBranchOverview: router({
    summary: branchAdminProcedure.input(z.object({
      zoneId: z.number().optional(),
      dateFrom: z.string().optional(),
      dateTo: z.string().optional(),
    }).optional()).query(async ({ input, ctx }) => {
      const session = ctx.hibiSession!;
      let branchIds: number[] = [];
      let allBranches = await listBranches();
      
      if (session.role === "super_admin") {
        // Super admin: filter by zone if specified, otherwise all
        if (input?.zoneId) {
          allBranches = allBranches.filter(b => (b as any).zoneId === input.zoneId);
        }
        branchIds = allBranches.map(b => b.id);
      } else if (session.role === "area_manager") {
        // Area manager: only their managed branches
        const assignedBranches = await getStaffBranches(session.id);
        branchIds = assignedBranches.map(b => b.branchId);
        allBranches = allBranches.filter(b => branchIds.includes(b.id));
        if (input?.zoneId) {
          allBranches = allBranches.filter(b => (b as any).zoneId === input.zoneId);
          branchIds = allBranches.map(b => b.id);
        }
      } else if (session.role === "branch_owner") {
        // Branch owner with multiple branches
        const assignedBranches = await getStaffBranches(session.id);
        if (assignedBranches.length > 0) {
          branchIds = assignedBranches.map(b => b.branchId);
        } else {
          const staffMember = await getStaffById(session.id);
          branchIds = staffMember?.branchId ? [staffMember.branchId] : [];
        }
        allBranches = allBranches.filter(b => branchIds.includes(b.id));
      } else {
        throw new TRPCError({ code: "FORBIDDEN", message: "ไม่มีสิทธิ์เข้าถึง" });
      }
      
      if (branchIds.length === 0) {
        return { branches: [], pettyCashBalances: [], salesToday: [], orderIssues: { open: 0, acknowledged: 0, total: 0 }, pendingReviews: [], zones: [] };
      }
      
      const dateFrom = input?.dateFrom ? new Date(input.dateFrom) : undefined;
      const dateTo = input?.dateTo ? new Date(input.dateTo + "T23:59:59") : undefined;
      const [pettyCashBalances, salesToday, orderIssues, pendingReviews, zones] = await Promise.all([
        getMultiBranchPettyCashBalances(branchIds),
        getMultiBranchDailySalesToday(branchIds, dateFrom, dateTo),
        getMultiBranchOrderIssuesCounts(branchIds),
        getMultiBranchPendingReviewsCounts(branchIds),
        listServiceZones(),
      ]);
      
      return {
        branches: allBranches.map(b => ({ id: b.id, name: b.name, zoneId: (b as any).zoneId, isActive: b.isActive })),
        pettyCashBalances,
        salesToday,
        orderIssues,
        pendingReviews,
        zones,
      };
    }),
  }),

  // ── Impersonate (Super Admin Test Mode) ──
  impersonate: router({
    // List all staff that super_admin can impersonate
    listTargets: superAdminProcedure.query(async () => {
      const allStaff = await listStaffWithDetails();
      // Also include customer accounts for testing
      const customerList = await listCustomers(undefined, 50, 0);
      return {
        staff: allStaff.map(s => ({
          id: s.id,
          name: s.name,
          phone: s.phone,
          role: s.role,
          branchId: s.branchId,
          branchName: (s as any).branchName ?? null,
        })),
        customers: (customerList || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          phone: c.phone,
          role: "customer" as const,
        })),
      };
    }),

    // Get current impersonate status
    status: hibiProtectedProcedure.query(async ({ ctx }) => {
      const session = ctx.hibiSession!;
      if (session.impersonating) {
        let targetName = "Unknown";
        if (session.type === "customer") {
          const customer = await getCustomerById(session.id);
          targetName = customer?.name ?? "Unknown";
        } else {
          const staff = await getStaffById(session.id);
          targetName = staff?.name ?? "Unknown";
        }
        return {
          active: true,
          targetId: session.id,
          targetRole: session.role,
          targetName,
          originalId: session.impersonating.originalId,
          originalRole: session.impersonating.originalRole,
        };
      }
      return { active: false, targetId: null, targetRole: null, targetName: null, originalId: null, originalRole: null };
    }),
  }),

  // ═══════════════════════════════════════════════════════════════════
  // POS System
  // ═══════════════════════════════════════════════════════════════════
  pos: router({
    // ─── POS Auto-Setup ──────────────────────────────────────────
    autoSetup: superAdminProcedure
      .input(z.object({ branchId: z.number() }))
      .mutation(async ({ input }) => {
        return posAutoSetupBranch(input.branchId);
      }),

    // ─── POS Branch Menu Catalog (select/deselect from central) ─
    branchCatalog: router({
      list: branchAdminProcedure
        .input(z.object({ branchId: z.number() }))
        .query(({ input }) => posGetBranchMenuCatalog(input.branchId)),
      select: branchAdminProcedure
        .input(z.object({ branchId: z.number(), menuItemIds: z.array(z.number()) }))
        .mutation(({ input }) => posSelectBranchMenuItems(input.branchId, input.menuItemIds)),
      deselect: branchAdminProcedure
        .input(z.object({ branchId: z.number(), menuItemIds: z.array(z.number()) }))
        .mutation(({ input }) => posDeselectBranchMenuItems(input.branchId, input.menuItemIds)),
    }),

    // ─── POS Categories ────────────────────────────────────────────
    category: router({
      list: publicProcedure.query(() => posListCategories()),
      create: superAdminProcedure
        .input(z.object({ name: z.string().min(1), type: z.enum(["beverage", "food", "dessert", "retail"]), sortOrder: z.number().optional(), imageUrl: z.string().optional() }))
        .mutation(({ input }) => posCreateCategory(input)),
      update: superAdminProcedure
        .input(z.object({ id: z.number(), name: z.string().optional(), type: z.enum(["beverage", "food", "dessert", "retail"]).optional(), sortOrder: z.number().optional(), isActive: z.boolean().optional(), imageUrl: z.string().optional() }))
        .mutation(({ input }) => { const { id, ...data } = input; return posUpdateCategory(id, data); }),
      delete: superAdminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ input }) => posDeleteCategory(input.id)),
    }),

    // ─── POS Menu Items ────────────────────────────────────────────
    menu: router({
      list: publicProcedure
        .input(z.object({ categoryId: z.number().optional() }).optional())
        .query(({ input }) => posListMenuItems(input?.categoryId)),
      get: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(({ input }) => posGetMenuItem(input.id)),
      create: superAdminProcedure
        .input(z.object({
          categoryId: z.number().nullable().optional(),
          name: z.string().min(1),
          code: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          basePrice: z.string(),
          costPrice: z.string().optional(),
          sendTo: z.enum(["kitchen", "bar", "none"]).optional(),
          sortOrder: z.number().optional(),
          optionGroupIds: z.array(z.number()).optional(),
        }))
        .mutation(async ({ input }) => {
          const { optionGroupIds, ...data } = input;
          const id = await posCreateMenuItem(data);
          if (id && optionGroupIds?.length) await posSetMenuItemOptionGroups(id, optionGroupIds);
          return { id };
        }),
      update: superAdminProcedure
        .input(z.object({
          id: z.number(),
          categoryId: z.number().nullable().optional(),
          name: z.string().optional(),
          code: z.string().optional(),
          description: z.string().optional(),
          imageUrl: z.string().optional(),
          basePrice: z.string().optional(),
          costPrice: z.string().optional(),
          sendTo: z.enum(["kitchen", "bar", "none"]).optional(),
          isActive: z.boolean().optional(),
          sortOrder: z.number().optional(),
          optionGroupIds: z.array(z.number()).optional(),
        }))
        .mutation(async ({ input }) => {
          const { id, optionGroupIds, ...data } = input;
          await posUpdateMenuItem(id, data);
          if (optionGroupIds) await posSetMenuItemOptionGroups(id, optionGroupIds);
        }),
      uploadImage: superAdminProcedure
        .input(z.object({
          imageBase64: z.string().min(1),
          imageType: z.string().default("image/jpeg"),
        }))
        .mutation(async ({ input }) => {
          const buffer = Buffer.from(input.imageBase64, "base64");
          const ext = input.imageType?.split("/")[1] || "jpg";
          const fileKey = `pos-menu-images/${Date.now()}-${nanoid(6)}.${ext}`;
          const { url } = await storagePut(fileKey, buffer, input.imageType);
          return { url };
        }),
      delete: superAdminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ input }) => posDeleteMenuItem(input.id)),
      getOptionGroups: publicProcedure
        .input(z.object({ menuItemId: z.number() }))
        .query(({ input }) => posGetMenuItemOptionGroups(input.menuItemId)),
      allOptionMappings: publicProcedure.query(() => posListAllMenuItemOptionGroupMappings()),
    }),

    // ─── POS Branch Menu ───────────────────────────────────────────
    branchMenu: router({
      list: publicProcedure
        .input(z.object({ branchId: z.number() }))
        .query(({ input }) => posGetBranchMenuItems(input.branchId)),
      upsert: branchAdminProcedure
        .input(z.object({
          branchId: z.number(),
          menuItemId: z.number(),
          price: z.string().optional(),
          costPrice: z.string().optional(),
          isAvailable: z.boolean(),
        }))
        .mutation(({ input }) => posUpsertBranchMenuItem(input.branchId, input.menuItemId, input)),
    }),

    // ─── POS Option Groups ─────────────────────────────────────────
    optionGroup: router({
      list: publicProcedure.query(() => posListOptionGroups()),
      listWithOptions: publicProcedure.query(() => posListOptionGroupsWithOptions()),
      create: superAdminProcedure
        .input(z.object({ name: z.string().min(1), type: z.enum(["single", "multiple"]), isRequired: z.boolean().optional(), maxSelections: z.number().optional(), sortOrder: z.number().optional() }))
        .mutation(({ input }) => posCreateOptionGroup(input)),
      update: superAdminProcedure
        .input(z.object({ id: z.number(), name: z.string().optional(), type: z.enum(["single", "multiple"]).optional(), isRequired: z.boolean().optional(), maxSelections: z.number().optional(), sortOrder: z.number().optional() }))
        .mutation(({ input }) => { const { id, ...data } = input; return posUpdateOptionGroup(id, data); }),
      delete: superAdminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ input }) => posDeleteOptionGroup(input.id)),
      options: router({
        list: publicProcedure
          .input(z.object({ groupId: z.number() }))
          .query(({ input }) => posListOptions(input.groupId)),
        create: superAdminProcedure
          .input(z.object({ groupId: z.number(), name: z.string().min(1), priceAdjustment: z.string().optional(), costAdjustment: z.string().optional(), isDefault: z.boolean().optional(), sortOrder: z.number().optional() }))
          .mutation(({ input }) => posCreateOption(input)),
        update: superAdminProcedure
          .input(z.object({ id: z.number(), name: z.string().optional(), priceAdjustment: z.string().optional(), costAdjustment: z.string().optional(), isDefault: z.boolean().optional(), isActive: z.boolean().optional(), sortOrder: z.number().optional() }))
          .mutation(({ input }) => { const { id, ...data } = input; return posUpdateOption(id, data); }),
        delete: superAdminProcedure
          .input(z.object({ id: z.number() }))
          .mutation(({ input }) => posDeleteOption(input.id)),
      }),
    }),

    // ─── POS Retail Products ───────────────────────────────────────
    retail: router({
      list: publicProcedure
        .input(z.object({ categoryId: z.number().optional() }).optional())
        .query(({ input }) => posListRetailProducts(input?.categoryId)),
      create: superAdminProcedure
        .input(z.object({ categoryId: z.number(), name: z.string().min(1), sku: z.string().optional(), barcode: z.string().optional(), description: z.string().optional(), imageUrl: z.string().optional(), price: z.string(), costPrice: z.string().optional(), sortOrder: z.number().optional() }))
        .mutation(({ input }) => posCreateRetailProduct(input)),
      update: superAdminProcedure
        .input(z.object({ id: z.number(), categoryId: z.number().optional(), name: z.string().optional(), sku: z.string().optional(), barcode: z.string().optional(), description: z.string().optional(), imageUrl: z.string().optional(), price: z.string().optional(), costPrice: z.string().optional(), isActive: z.boolean().optional(), sortOrder: z.number().optional() }))
        .mutation(({ input }) => { const { id, ...data } = input; return posUpdateRetailProduct(id, data); }),
      delete: superAdminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ input }) => posDeleteRetailProduct(input.id)),
      branchStock: router({
        list: publicProcedure
          .input(z.object({ branchId: z.number() }))
          .query(({ input }) => posGetBranchRetailStock(input.branchId)),
        upsert: branchAdminProcedure
          .input(z.object({ branchId: z.number(), retailProductId: z.number(), stock: z.number(), minStock: z.number(), price: z.string().optional(), isAvailable: z.boolean() }))
          .mutation(({ input }) => posUpsertBranchRetailStock(input.branchId, input.retailProductId, input)),
      }),
    }),

    // ─── POS Payment Methods ───────────────────────────────────────
    paymentMethod: router({
      list: publicProcedure.query(() => posListPaymentMethods()),
      create: superAdminProcedure
        .input(z.object({ name: z.string().min(1), code: z.string().min(1), type: z.enum(["cash", "transfer", "qr", "edc", "credit", "ewallet", "other"]), sortOrder: z.number().optional() }))
        .mutation(({ input }) => posCreatePaymentMethod(input)),
      update: superAdminProcedure
        .input(z.object({ id: z.number(), name: z.string().optional(), isActive: z.boolean().optional(), sortOrder: z.number().optional() }))
        .mutation(({ input }) => { const { id, ...data } = input; return posUpdatePaymentMethod(id, data); }),
    }),

    // ─── POS Discounts ─────────────────────────────────────────────
    discount: router({
      list: publicProcedure.query(() => posListDiscounts()),
      create: superAdminProcedure
        .input(z.object({
          name: z.string().min(1),
          type: z.enum(["percentage", "fixed"]),
          value: z.string(),
          scope: z.enum(["item", "order"]).optional(),
          code: z.string().optional(),
          minOrderAmount: z.string().optional(),
          maxDiscountAmount: z.string().optional(),
          requiresPermission: z.boolean().optional(),
          startDate: z.string().optional(),
          endDate: z.string().optional(),
        }))
        .mutation(({ input }) => {
          const data: any = { ...input };
          if (input.startDate) data.startDate = new Date(input.startDate);
          if (input.endDate) data.endDate = new Date(input.endDate);
          return posCreateDiscount(data);
        }),
      update: superAdminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          type: z.enum(["percentage", "fixed"]).optional(),
          value: z.string().optional(),
          scope: z.enum(["item", "order"]).optional(),
          code: z.string().optional(),
          isActive: z.boolean().optional(),
          requiresPermission: z.boolean().optional(),
        }))
        .mutation(({ input }) => { const { id, ...data } = input; return posUpdateDiscount(id, data); }),
      delete: superAdminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ input }) => posDeleteDiscount(input.id)),
    }),

    // ─── POS Orders ────────────────────────────────────────────────
    order: router({
      create: publicProcedure
        .input(z.object({
          branchId: z.number(),
          orderType: z.enum(["dine_in", "takeaway", "delivery"]),
          staffPinId: z.number().optional(),
          items: z.array(z.object({
            itemType: z.enum(["menu", "retail"]),
            menuItemId: z.number().optional(),
            retailProductId: z.number().optional(),
            name: z.string(),
            quantity: z.number().min(1),
            unitPrice: z.string(),
            unitCost: z.string(),
            optionsPrice: z.string().optional(),
            totalPrice: z.string(),
            sendTo: z.enum(["kitchen", "bar", "none"]).optional(),
            note: z.string().optional(),
            options: z.array(z.object({
              optionGroupName: z.string(),
              optionName: z.string(),
              priceAdjustment: z.string(),
            })).optional(),
          })),
          payments: z.array(z.object({
            paymentMethodId: z.number(),
            amount: z.string(),
            reference: z.string().optional(),
          })),
          subtotal: z.string(),
          discountAmount: z.string().optional(),
          discountId: z.number().optional(),
          taxAmount: z.string().optional(),
          totalAmount: z.string(),
          totalCost: z.string().optional(),
          note: z.string().optional(),
          customerName: z.string().optional(),
          customerPhone: z.string().optional(),
        }))
        .mutation(async ({ input, ctx }) => {
          const staffId = ctx.user?.id || input.staffPinId || 0;
          const orderNumber = await posGetNextOrderNumber(input.branchId);
          const orderId = await posCreateOrder({
            orderNumber,
            branchId: input.branchId,
            staffId,
            orderType: input.orderType,
            subtotal: input.subtotal,
            discountAmount: input.discountAmount || "0",
            discountId: input.discountId,
            taxAmount: input.taxAmount || "0",
            totalAmount: input.totalAmount,
            totalCost: input.totalCost || "0",
            note: input.note,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            status: "completed",
            completedAt: new Date(),
          });
          const kitchenItems: any[] = [];
          const barItems: any[] = [];
          for (const item of input.items) {
            const orderItemId = await posCreateOrderItem({
              orderId,
              itemType: item.itemType,
              menuItemId: item.menuItemId,
              retailProductId: item.retailProductId,
              name: item.name,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              unitCost: item.unitCost,
              optionsPrice: item.optionsPrice || "0",
              totalPrice: item.totalPrice,
              sendTo: item.sendTo || "none",
              note: item.note,
            });
            if (item.options?.length) {
              await posCreateOrderItemOptions(item.options.map(o => ({ orderItemId, ...o })));
            }
            const sendTo = item.sendTo || "none";
            if (sendTo === "kitchen") kitchenItems.push({ ...item, orderItemId });
            if (sendTo === "bar") barItems.push({ ...item, orderItemId });
          }
          for (const payment of input.payments) {
            await posCreateOrderPayment({ orderId, ...payment });
          }
          const ticketBase = orderNumber;
          if (kitchenItems.length > 0) {
            await posCreateKitchenTicket({
              orderId,
              branchId: input.branchId,
              ticketNumber: `${ticketBase}-K`,
              station: "kitchen",
              items: kitchenItems.map(i => ({ name: i.name, qty: i.quantity, note: i.note, options: i.options })),
            });
          }
          if (barItems.length > 0) {
            await posCreateKitchenTicket({
              orderId,
              branchId: input.branchId,
              ticketNumber: `${ticketBase}-B`,
              station: "bar",
              items: barItems.map(i => ({ name: i.name, qty: i.quantity, note: i.note, options: i.options })),
            });
          }
          return { orderId, orderNumber };
        }),
      list: publicProcedure
        .input(z.object({ branchId: z.number(), status: z.string().optional(), dateFrom: z.string().optional(), dateTo: z.string().optional() }))
        .query(({ input }) => posListOrders(input.branchId, input.status, input.dateFrom, input.dateTo)),
      get: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          const order = await posGetOrder(input.id);
          if (!order) return null;
          const items = await posGetOrderItems(input.id);
          const payments = await posGetOrderPayments(input.id);
          const itemsWithOptions = await Promise.all(items.map(async (item) => {
            const opts = await posGetOrderItemOptions(item.id);
            return { ...item, options: opts };
          }));
          return { ...order, items: itemsWithOptions, payments };
        }),
      void: superAdminProcedure
        .input(z.object({ id: z.number(), reason: z.string().optional() }))
        .mutation(async ({ input }) => {
          await posUpdateOrder(input.id, { status: "voided", note: input.reason });
        }),
    }),

    // ─── POS Kitchen Tickets ───────────────────────────────────────
    kitchen: router({
      list: publicProcedure
        .input(z.object({ branchId: z.number(), station: z.string().optional() }))
        .query(({ input }) => posListKitchenTickets(input.branchId, input.station)),
      updateStatus: publicProcedure
        .input(z.object({ id: z.number(), status: z.enum(["pending", "preparing", "ready", "served"]) }))
        .mutation(({ input }) => posUpdateKitchenTicketStatus(input.id, input.status)),
    }),

    // ─── POS Staff PINs ────────────────────────────────────────────
    staffPin: router({
      list: branchAdminProcedure
        .input(z.object({ branchId: z.number() }))
        .query(({ input }) => posGetStaffPinsByBranch(input.branchId)),
      create: branchAdminProcedure
        .input(z.object({
          branchId: z.number(),
          name: z.string().min(1),
          pin: z.string().min(4).max(6),
          role: z.enum(["manager", "cashier", "kitchen"]),
        }))
        .mutation(({ input }) => posCreateStaffPin(input)),
      update: branchAdminProcedure
        .input(z.object({
          id: z.number(),
          name: z.string().optional(),
          pin: z.string().min(4).max(6).optional(),
          role: z.enum(["manager", "cashier", "kitchen"]).optional(),
          isActive: z.boolean().optional(),
        }))
        .mutation(({ input }) => { const { id, ...data } = input; return posUpdateStaffPin(id, data); }),
      delete: branchAdminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(({ input }) => posDeleteStaffPin(input.id)),
      verify: publicProcedure
        .input(z.object({ branchId: z.number(), pin: z.string() }))
        .mutation(async ({ input }) => {
          const staffMember = await posVerifyStaffPin(input.branchId, input.pin);
          if (!staffMember) throw new TRPCError({ code: "UNAUTHORIZED", message: "PIN ไม่ถูกต้อง" });
          return { id: staffMember.id, name: staffMember.name, role: staffMember.role, branchId: staffMember.branchId };
        }),
    }),

    // ─── POS Reports ───────────────────────────────────────────────
    report: router({
      dailySales: branchAdminProcedure
        .input(z.object({ branchId: z.number(), dateFrom: z.string(), dateTo: z.string() }))
        .query(({ input }) => posGetDailySalesReport(input.branchId, input.dateFrom, input.dateTo)),
      byPaymentMethod: branchAdminProcedure
        .input(z.object({ branchId: z.number(), dateFrom: z.string(), dateTo: z.string() }))
        .query(({ input }) => posGetSalesByPaymentMethod(input.branchId, input.dateFrom, input.dateTo)),
      byCategory: branchAdminProcedure
        .input(z.object({ branchId: z.number(), dateFrom: z.string(), dateTo: z.string() }))
        .query(({ input }) => posGetSalesByCategory(input.branchId, input.dateFrom, input.dateTo)),
    }),
    // ─── POS V2 Access Log ─────────────────────────────────────────
    logAccess: staffProcedure.mutation(async ({ ctx }) => {
      const session = ctx.hibiSession!;
      await createAuditLog({
        actorType: "staff",
        actorId: session.id,
        actorName: null,
        action: "open_pos_v2",
        entity: "pos",
        entityId: null,
        details: `${session.role} ID:${session.id} เปิด POS V2`,
      });
      return { success: true };
    }),
  }),
});
// ── Order ID Validation ───
function validateOrderId(app: string, orderId: string): { ok: boolean; message: string } {
  switch (app) {
    case "shopee": {
      // Shopee: ตัวเลข 13-19 หลัก
      if (!/^\d{13,19}$/.test(orderId)) return { ok: false, message: "รหัส Shopee ต้องเป็นตัวเลข 13-19 หลัก เช่น 2966366660490752985" };
      return { ok: true, message: "" };
    }
    case "grab": {
      // Grab: ขึ้นต้น A- ตามด้วยตัวอักษร+เลข
      if (!/^A-[A-Z0-9]{8,20}$/i.test(orderId)) return { ok: false, message: "รหัส Grab ต้องขึ้นต้นด้วย A- ตามด้วยตัวอักษร/ตัวเลข เช่น A-9WERMBQGW4SJAV" };
      return { ok: true, message: "" };
    }
    case "lineman": {
      // LINE MAN: LMF-YYMMDD-XXXXXXXXX
      if (!/^LMF-\d{6}-\d{6,12}$/.test(orderId)) return { ok: false, message: "รหัส LINE MAN ต้องเป็นรูปแบบ LMF-YYMMDD-XXXXXXXXX เช่น LMF-260218-234745909" };
      return { ok: true, message: "" };
    }
    case "gpos": {
      // GPOS: เลขที่ใบเสร็จ 13 หลัก
      if (!/^\d{13}$/.test(orderId)) return { ok: false, message: "เลขที่ใบเสร็จ GPOS ต้องเป็นตัวเลข 13 หลัก เช่น 0105536123457" };
      return { ok: true, message: "" };
    }
    default:
      return { ok: true, message: "" };
  }
}

export type AppRouter = typeof appRouter;
