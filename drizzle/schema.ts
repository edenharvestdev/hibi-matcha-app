import { int, json, mysqlEnum, mysqlTable, text, timestamp, varchar, uniqueIndex, bigint, decimal, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow (Manus OAuth).
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Hibi Matcha internal customers - phone+password auth
 */
export const customers = mysqlTable("customers", {
  id: int("id").autoincrement().primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  address: text("address"),
  province: varchar("province", { length: 100 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = typeof customers.$inferInsert;

/**
 * Service Zones - group branches by geographic area or franchise owner
 */
export const serviceZones = mysqlTable("service_zones", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("sz_name", { length: 255 }).notNull(),
  description: text("sz_description"),
  isActive: int("sz_isActive").default(1).notNull(),
  createdAt: timestamp("sz_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sz_updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ServiceZone = typeof serviceZones.$inferSelect;
export type InsertServiceZone = typeof serviceZones.$inferInsert;

/**
 * Branches table
 */
export const branches = mysqlTable("branches", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  province: varchar("province", { length: 100 }),
  address: text("address"),
  phone: varchar("branchPhone", { length: 20 }),
  zoneId: int("zoneId"),
  franchiseOwnerId: int("franchiseOwnerId"), // FK to franchise_owners
  commissionMode: mysqlEnum("commissionMode", ["product", "staff"]).default("product"), // product = per-product rate, staff = per-staff rate
  allowManagerEditCommission: int("allowManagerEditCommission").default(0).notNull(), // 0 = only owner/admin can edit commission %, 1 = manager can also edit
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Branch = typeof branches.$inferSelect;
export type InsertBranch = typeof branches.$inferInsert;

/**
 * Staff table - branch admins, area managers, support staff, and super admins
 */
export const staff = mysqlTable("staff", {
  id: int("id").autoincrement().primaryKey(),
  phone: varchar("phone", { length: 20 }).notNull().unique(),
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  employeeCode: varchar("employeeCode", { length: 50 }).unique(),
  role: mysqlEnum("staffRole", ["branch_manager", "branch_owner", "branch_staff", "area_manager", "support_staff", "super_admin"]).notNull(),
  branchId: int("branchId"),
  commissionType: mysqlEnum("staffCommissionType", ["percent", "fixed"]).default("percent"), // for staff commission mode
  commissionValue: int("staffCommissionValue").default(0), // percent: basis points (100=1%), fixed: satang
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Staff = typeof staff.$inferSelect;
export type InsertStaff = typeof staff.$inferInsert;

/**
 * Staff-Branch assignments - for area managers who oversee multiple branches
 */
export const staffBranches = mysqlTable("staff_branches", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("staffId").notNull(),
  branchId: int("branchId").notNull(),
  createdAt: timestamp("sbCreatedAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("unique_staff_branch").on(table.staffId, table.branchId),
]);

export type StaffBranch = typeof staffBranches.$inferSelect;
export type InsertStaffBranch = typeof staffBranches.$inferInsert;

/**
 * Staff Permissions - granular permission control per staff member
 * Permissions: manage_branches, manage_staff, approve_reviews, approve_points,
 *   manage_rewards, view_reports, manage_issues, manage_inquiries, manage_customers, view_audit_logs
 */
export const staffPermissions = mysqlTable("staff_permissions", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("permStaffId").notNull(),
  permission: varchar("permission", { length: 50 }).notNull(),
  createdAt: timestamp("permCreatedAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("unique_staff_permission").on(table.staffId, table.permission),
]);

export type StaffPermission = typeof staffPermissions.$inferSelect;
export type InsertStaffPermission = typeof staffPermissions.$inferInsert;

/**
 * Review Requests - customer submits review for free drink code
 */
export const reviewRequests = mysqlTable("review_requests", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  branchId: int("branchId").notNull(),
  deliveryApp: mysqlEnum("deliveryApp", ["shopee", "lineman", "grab", "gpos"]).notNull(),
  orderId: varchar("orderId", { length: 100 }).notNull(),
  gfNumber: varchar("gfNumber", { length: 20 }),
  bookingId: varchar("bookingId", { length: 20 }),
  shopeeOrderNumber: varchar("shopeeOrderNumber", { length: 20 }),
  shopeeOrderId: varchar("shopeeOrderId", { length: 30 }),
  linemanOrderNumber: varchar("linemanOrderNumber", { length: 20 }),
  linemanOrderId: varchar("linemanOrderId", { length: 30 }),
  imageUrl: text("imageUrl"),
  orderImageUrl: text("orderImageUrl"),
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  reviewedBy: int("reviewedBy"),
  rejectionReason: text("rejectionReason"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReviewRequest = typeof reviewRequests.$inferSelect;
export type InsertReviewRequest = typeof reviewRequests.$inferInsert;

/**
 * Codes - reward and compensation codes
 */
export const codes = mysqlTable("codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 20 }).notNull().unique(),
  type: mysqlEnum("codeType", ["RV", "CL"]).notNull(),
  branchId: int("branchId").notNull(),
  customerId: int("customerId"),
  reviewRequestId: int("reviewRequestId"),
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("codeStatus", ["issued", "redeemed", "expired", "cancelled"]).default("issued").notNull(),
  issuedAt: timestamp("issuedAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  redeemedAt: timestamp("redeemedAt"),
  redeemedBy: int("redeemedBy"),
  claimReason: text("claimReason"),
  claimOrderId: varchar("claimOrderId", { length: 100 }),
  // ── Compensation detail fields (CL codes) ──
  claimChannel: mysqlEnum("claimChannel", ["shopee", "lineman", "grab", "gpos", "walk_in"]),
  claimMenuCode: varchar("claimMenuCode", { length: 20 }),
  claimMenuName: varchar("claimMenuName", { length: 255 }),
  claimOrderDetail: text("claimOrderDetail"),
  claimError: text("claimError"),
  compensationMenuCode: varchar("compensationMenuCode", { length: 20 }),
  compensationMenuName: varchar("compensationMenuName", { length: 255 }),
  customerPhone: varchar("codeCustomerPhone", { length: 20 }),
  compensationRemark: text("compensationRemark"),
  orderDate: timestamp("orderDate"),
  expiryDays: int("expiryDays").default(30),
  // ── Menu selection + activation (customer selects menu before using code) ──
  selectedMenuItemId: int("codeSelectedMenuItemId"),
  selectedMenuCode: varchar("codeSelectedMenuCode", { length: 20 }),
  selectedMenuName: varchar("codeSelectedMenuName", { length: 255 }),
  remark: text("codeRemark"), // ลูกค้าพิมพ์เอง เช่น ความหวาน, ร้อน/เย็น, แพ็คแยก ฯลฯ
  activatedAt: timestamp("codeActivatedAt"), // when customer selects menu = must use same day
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Code = typeof codes.$inferSelect;;
export type InsertCode = typeof codes.$inferInsert;

/**
 * Audit Logs - track all actions with before/after data
 */
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  actorType: mysqlEnum("actorType", ["customer", "staff", "system"]).notNull(),
  actorId: int("actorId"),
  actorName: varchar("actorName", { length: 255 }),
  action: varchar("action", { length: 100 }).notNull(),
  entity: varchar("entity", { length: 100 }).notNull(),
  entityId: int("entityId"),
  details: text("details"),
  beforeData: json("beforeData"),
  afterData: json("afterData"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

/**
 * Loyalty Points - customer point balances
 */
export const loyaltyPoints = mysqlTable("loyalty_points", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull().unique(),
  totalPoints: int("totalPoints").default(0).notNull(),
  usedPoints: int("usedPoints").default(0).notNull(),
  tier: mysqlEnum("tier", ["green", "gold", "matcha"]).default("green").notNull(),
  lifetimePoints: int("lifetimePoints").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LoyaltyPoint = typeof loyaltyPoints.$inferSelect;
export type InsertLoyaltyPoint = typeof loyaltyPoints.$inferInsert;

/**
 * Point Transactions - earn/spend/adjust history
 */
export const pointTransactions = mysqlTable("point_transactions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  type: mysqlEnum("txType", ["earn_store", "earn_delivery", "spend", "adjust", "expire"]).notNull(),
  points: int("points").notNull(), // positive for earn, negative for spend
  balanceAfter: int("balanceAfter").notNull(),
  orderAmount: int("orderAmount"), // purchase amount in baht (nullable)
  description: text("description"),
  referenceType: varchar("referenceType", { length: 50 }), // 'point_claim', 'reward_redemption', 'manual'
  referenceId: int("referenceId"),
  branchId: int("branchId"),
  staffId: int("staffId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PointTransaction = typeof pointTransactions.$inferSelect;
export type InsertPointTransaction = typeof pointTransactions.$inferInsert;

/**
 * Point Claims - delivery point claims (customer submits proof)
 */
export const pointClaims = mysqlTable("point_claims", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  branchId: int("branchId").notNull(),
  deliveryApp: mysqlEnum("claimDeliveryApp", ["shopee", "lineman", "grab", "gpos"]).notNull(),
  orderId: varchar("claimPointOrderId", { length: 100 }).notNull(),
  gfNumber: varchar("gfNumber", { length: 20 }), // Grab short order number e.g. GF-677 (can repeat daily)
  bookingId: varchar("bookingId", { length: 20 }), // Grab booking ID e.g. A-949862QGXXISAV (unique among approved)
  shopeeOrderNumber: varchar("shopeeOrderNumber", { length: 20 }), // Shopee short order e.g. #212 (can repeat daily)
  shopeeOrderId: varchar("shopeeOrderId", { length: 30 }), // Shopee long order ID e.g. 3011303289058816525 (unique among approved)
  linemanOrderNumber: varchar("linemanOrderNumber", { length: 20 }), // LINE MAN short order e.g. #5175 (can repeat daily)
  linemanOrderId: varchar("linemanOrderId", { length: 30 }), // LINE MAN รหัสใบสั่งซื้อ e.g. LMF-260321-538845175 (unique among approved)
  orderDate: timestamp("orderDate"), // วันที่ลูกค้าสั่งซื้อจริง (ไม่ใช่วันที่ส่งคำขอ)
  orderAmount: int("orderAmount").notNull(), // purchase amount in baht
  screenshotUrl: text("screenshotUrl"),
  status: mysqlEnum("claimStatus", ["pending", "approved", "rejected"]).default("pending").notNull(),
  pointsAwarded: int("pointsAwarded"),
  reviewedBy: int("reviewedBy"),
  rejectionReason: text("claimRejectionReason"),
  createdAt: timestamp("claimCreatedAt").defaultNow().notNull(),
  updatedAt: timestamp("claimUpdatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("unique_claim_delivery_order").on(table.deliveryApp, table.orderId),
]);

export type PointClaim = typeof pointClaims.$inferSelect;
export type InsertPointClaim = typeof pointClaims.$inferInsert;

/**
 * Rewards - catalog of redeemable rewards
 */
export const rewards = mysqlTable("rewards", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  pointsCost: int("pointsCost").notNull(),
  category: mysqlEnum("rewardCategory", ["drink", "food", "topping", "discount", "special"]).default("drink").notNull(),
  imageUrl: text("rewardImageUrl"),
  isActive: int("isActive").default(1).notNull(),
  stock: int("stock"), // null = unlimited
  createdAt: timestamp("rewardCreatedAt").defaultNow().notNull(),
  updatedAt: timestamp("rewardUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Reward = typeof rewards.$inferSelect;
export type InsertReward = typeof rewards.$inferInsert;

/**
 * Reward Redemptions - track when customers redeem rewards
 */
export const rewardRedemptions = mysqlTable("reward_redemptions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("customerId").notNull(),
  rewardId: int("rewardId").notNull(),
  pointsSpent: int("pointsSpent").notNull(),
  status: mysqlEnum("redemptionStatus", ["pending", "used", "expired", "cancelled"]).default("pending").notNull(),
  redemptionCode: varchar("redemptionCode", { length: 20 }).notNull().unique(),
  branchId: int("redemptionBranchId"),
  usedAt: timestamp("usedAt"),
  expiresAt: timestamp("redemptionExpiresAt").notNull(),
  createdAt: timestamp("redemptionCreatedAt").defaultNow().notNull(),
});

export type RewardRedemption = typeof rewardRedemptions.$inferSelect;
export type InsertRewardRedemption = typeof rewardRedemptions.$inferInsert;

/**
 * Order Issues - customer reports problems with orders (SLA-tracked)
 */
export const orderIssues = mysqlTable("order_issues", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("issueCustomerId").notNull(),
  branchId: int("issueBranchId").notNull(),
  deliveryApp: mysqlEnum("issueDeliveryApp", ["shopee", "lineman", "grab", "gpos", "walk_in"]).notNull(),
  orderId: varchar("issueOrderId", { length: 100 }),
  orderDetails: text("issueOrderDetails"),
  category: mysqlEnum("issueCategory", ["wrong_order", "missing_item", "quality", "late_delivery", "damaged", "other"]).notNull(),
  description: text("issueDescription").notNull(),
  imageUrl: text("issueImageUrl"),
  status: mysqlEnum("issueStatus", ["open", "acknowledged", "in_progress", "resolved", "escalated", "closed"]).default("open").notNull(),
  priority: mysqlEnum("issuePriority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  assignedTo: int("issueAssignedTo"),
  resolution: text("issueResolution"),
  adminNote: text("issueAdminNote"),
  acknowledgedAt: timestamp("acknowledgedAt"),
  resolvedAt: timestamp("resolvedAt"),
  escalatedAt: timestamp("escalatedAt"),
  slaResponseDeadline: timestamp("slaResponseDeadline").notNull(),
  slaResolutionDeadline: timestamp("slaResolutionDeadline").notNull(),
  createdAt: timestamp("issueCreatedAt").defaultNow().notNull(),
  updatedAt: timestamp("issueUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OrderIssue = typeof orderIssues.$inferSelect;
export type InsertOrderIssue = typeof orderIssues.$inferInsert;

/**
 * Order Issue Images - multiple images per order issue
 */
export const orderIssueImages = mysqlTable("order_issue_images", {
  id: int("id").autoincrement().primaryKey(),
  orderIssueId: int("orderIssueId").notNull(),
  imageUrl: text("oiiImageUrl").notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("oiiCreatedAt").defaultNow().notNull(),
});

export type OrderIssueImage = typeof orderIssueImages.$inferSelect;
export type InsertOrderIssueImage = typeof orderIssueImages.$inferInsert;

/**
 * Contact Inquiries - public forms for franchise, wholesale, events (no login required)
 */
export const contactInquiries = mysqlTable("contact_inquiries", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("inquiryType", ["franchise", "wholesale", "event", "other"]).notNull(),
  name: varchar("inquiryName", { length: 255 }).notNull(),
  phone: varchar("inquiryPhone", { length: 20 }).notNull(),
  email: varchar("inquiryEmail", { length: 320 }),
  company: varchar("inquiryCompany", { length: 255 }),
  message: text("inquiryMessage").notNull(),
  budget: varchar("inquiryBudget", { length: 100 }),
  province: varchar("inquiryProvince", { length: 100 }),
  status: mysqlEnum("inquiryStatus", ["new", "contacted", "in_progress", "closed"]).default("new").notNull(),
  notes: text("inquiryNotes"),
  handledBy: int("inquiryHandledBy"),
  createdAt: timestamp("inquiryCreatedAt").defaultNow().notNull(),
  updatedAt: timestamp("inquiryUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContactInquiry = typeof contactInquiries.$inferSelect;
export type InsertContactInquiry = typeof contactInquiries.$inferInsert;

/**
 * Free Drink Campaigns - HQ creates campaigns with menu options
 */
export const freeDrinkCampaigns = mysqlTable("free_drink_campaigns", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("campaignName", { length: 255 }).notNull(),
  description: text("campaignDescription"),
  menuOptions: json("menuOptions").notNull(), // [{code: "M01", name: "Matcha Latte", sizes: [{code:"S",name:"Small"},{code:"L",name:"Large"}], milkOptions: [{code:"OAT",name:"นมโอ๊ต"},{code:"FRS",name:"นมสด"}]}]
  maxCodesPerCustomer: int("maxCodesPerCustomer").default(1).notNull(),
  validFrom: timestamp("validFrom").notNull(),
  validUntil: timestamp("validUntil").notNull(),
  isActive: int("campaignIsActive").default(1).notNull(),
  branchScope: json("branchScope"), // null = all branches, or [1,2,3] specific branch IDs
  createdBy: int("campaignCreatedBy"),
  createdAt: timestamp("campaignCreatedAt").defaultNow().notNull(),
  updatedAt: timestamp("campaignUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FreeDrinkCampaign = typeof freeDrinkCampaigns.$inferSelect;
export type InsertFreeDrinkCampaign = typeof freeDrinkCampaigns.$inferInsert;

/**
 * Free Drink Codes - generated from campaigns, human-readable format
 * Format: HIBI-{menuCode}-{sizeCode}-{milkCode} e.g. HIBI-M01-L-OAT
 */
export const freeDrinkCodes = mysqlTable("free_drink_codes", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("fdCode", { length: 30 }).notNull().unique(),
  campaignId: int("fdCampaignId").notNull(),
  customerId: int("fdCustomerId").notNull(),
  branchId: int("fdBranchId").notNull(), // branch where code was issued
  menuCode: varchar("menuCode", { length: 10 }).notNull(),
  menuName: varchar("menuName", { length: 255 }).notNull(),
  sizeCode: varchar("sizeCode", { length: 10 }).notNull(),
  sizeName: varchar("sizeName", { length: 50 }).notNull(),
  milkCode: varchar("milkCode", { length: 10 }),
  milkName: varchar("milkName", { length: 50 }),
  status: mysqlEnum("fdStatus", ["issued", "redeemed", "expired", "cancelled"]).default("issued").notNull(),
  issuedAt: timestamp("fdIssuedAt").defaultNow().notNull(),
  expiresAt: timestamp("fdExpiresAt").notNull(),
  redeemedAt: timestamp("fdRedeemedAt"),
  redeemedBranchId: int("fdRedeemedBranchId"),
  redeemedByStaffId: int("fdRedeemedByStaffId"),
  sourceType: mysqlEnum("fdSourceType", ["review", "claim", "campaign", "manual"]).default("campaign").notNull(),
  sourceId: int("fdSourceId"), // reference to review_request or point_claim
  selectedMenuItemId: int("selectedMenuItemId"),
  selectedMenuCode: varchar("selectedMenuCode", { length: 20 }),
  selectedMenuName: varchar("selectedMenuName", { length: 255 }),
  sweetnessGrams: int("sweetnessGrams").default(0).notNull(),
  packagingType: varchar("packagingType", { length: 20 }).default("ready").notNull(), // 'ready' = พร้อมดื่ม, 'separate' = แยกน้ำแข็ง
  remark: text("fdRemark"), // option groups selections + free text
  deliveryOrderId: varchar("deliveryOrderId", { length: 100 }),
  orderType: varchar("orderType", { length: 20 }).default("in_store").notNull(), // 'in_store' or 'delivery'
  createdAt: timestamp("fdCreatedAt").defaultNow().notNull(),
});

export type FreeDrinkCode = typeof freeDrinkCodes.$inferSelect;
export type InsertFreeDrinkCode = typeof freeDrinkCodes.$inferInsert;

/**
 * Branch Loyalty Points - per-customer per-branch point balances
 * Points earned at branch X can only be used at branch X
 */
export const branchLoyaltyPoints = mysqlTable("branch_loyalty_points", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("blpCustomerId").notNull(),
  branchId: int("blpBranchId").notNull(),
  totalPoints: int("blpTotalPoints").default(0).notNull(),
  usedPoints: int("blpUsedPoints").default(0).notNull(),
  lifetimePoints: int("blpLifetimePoints").default(0).notNull(),
  createdAt: timestamp("blpCreatedAt").defaultNow().notNull(),
  updatedAt: timestamp("blpUpdatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("unique_customer_branch_loyalty").on(table.customerId, table.branchId),
]);

export type BranchLoyaltyPoint = typeof branchLoyaltyPoints.$inferSelect;
export type InsertBranchLoyaltyPoint = typeof branchLoyaltyPoints.$inferInsert;

/**
 * Customer Consents - PDPA and terms acceptance records
 */
export const customerConsents = mysqlTable("customer_consents", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("consentCustomerId").notNull(),
  consentType: mysqlEnum("consentType", ["pdpa", "terms", "marketing"]).notNull(),
  version: varchar("consentVersion", { length: 20 }).notNull(),
  accepted: int("accepted").default(1).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("consentUserAgent"),
  acceptedAt: timestamp("acceptedAt").defaultNow().notNull(),
});

export type CustomerConsent = typeof customerConsents.$inferSelect;
export type InsertCustomerConsent = typeof customerConsents.$inferInsert;


/**
 * Announcements & Promotions
 */
export const announcements = mysqlTable("announcements", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  type: mysqlEnum("announcementType", ["announcement", "promotion", "event"]).default("announcement").notNull(),
  targetGroup: mysqlEnum("targetGroup", ["all", "green", "gold", "matcha"]).default("all").notNull(),
  imageUrl: text("imageUrl"),
  promoCode: varchar("promoCode", { length: 100 }),
  discountText: varchar("discountText", { length: 255 }),
  startDate: timestamp("startDate").defaultNow().notNull(),
  endDate: timestamp("endDate"),
  isActive: int("isActive").default(1).notNull(),
  isPinned: int("isPinned").default(0).notNull(),
  scheduledAt: timestamp("scheduledAt"),
  scheduledPushSentAt: timestamp("scheduledPushSentAt"),
  audienceType: mysqlEnum("audienceType", ["customer", "staff", "both"]).default("customer").notNull(),
  staffBranchIds: text("staffBranchIds"), // JSON array of branch IDs for staff targeting, null = all branches
  branchId: int("branchId"), // null = all branches, specific id = branch-specific
  createdBy: int("createdBy"),
  createdAt: timestamp("announcementCreatedAt").defaultNow().notNull(),
  updatedAt: timestamp("announcementUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = typeof announcements.$inferInsert;

/**
 * Review Menu Items - configurable menu items for review reward selection
 * Admin can configure which items are available for customers to choose
 */
export const reviewMenuItems = mysqlTable("review_menu_items", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("rmiCode", { length: 20 }).notNull().unique(),
  name: varchar("rmiName", { length: 255 }).notNull(),
  description: text("rmiDescription"),
  isActive: int("rmiIsActive").default(1).notNull(),
  sortOrder: int("rmiSortOrder").default(0).notNull(),
  createdAt: timestamp("rmiCreatedAt").defaultNow().notNull(),
  updatedAt: timestamp("rmiUpdatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReviewMenuItem = typeof reviewMenuItems.$inferSelect;
export type InsertReviewMenuItem = typeof reviewMenuItems.$inferInsert;

/**
 * Branch-specific menu availability for review menu items.
 * Each branch can enable/disable specific menu items independently.
 * If no record exists for a branch+menu combo, the menu is considered available (default ON).
 */
export const branchMenuAvailability = mysqlTable("branch_menu_availability", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("bma_branchId").notNull(),
  menuItemId: int("bma_menuItemId").notNull(),
  isAvailable: int("bma_isAvailable").default(1).notNull(),
  updatedAt: timestamp("bma_updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BranchMenuAvailability = typeof branchMenuAvailability.$inferSelect;
export type InsertBranchMenuAvailability = typeof branchMenuAvailability.$inferInsert;

/**
 * In-app notifications for staff members.
 * Used to notify area_managers, branch_owners, etc. about new reviews, point claims, etc.
 */
export const staffNotifications = mysqlTable("staff_notifications", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("sn_staffId").notNull(),
  type: varchar("sn_type", { length: 50 }).notNull(), // "new_review", "review_approved", "new_point_claim", etc.
  title: varchar("sn_title", { length: 500 }).notNull(),
  message: text("sn_message"),
  relatedEntity: varchar("sn_relatedEntity", { length: 50 }), // "review_request", "point_claim", etc.
  relatedEntityId: int("sn_relatedEntityId"),
  isRead: int("sn_isRead").default(0).notNull(),
  createdAt: timestamp("sn_createdAt").defaultNow().notNull(),
});
export type StaffNotification = typeof staffNotifications.$inferSelect;
export type InsertStaffNotification = typeof staffNotifications.$inferInsert;

/**
 * Key-value store for site-wide content managed by Super Admin.
 * e.g. review_howto_image, welcome_banner, etc.
 */
export const siteContent = mysqlTable("site_content", {
  id: int("id").autoincrement().primaryKey(),
  contentKey: varchar("sc_key", { length: 100 }).notNull().unique(),
  contentValue: text("sc_value"), // URL or text content
  contentType: varchar("sc_type", { length: 50 }).default("image").notNull(), // "image", "text", "html"
  label: varchar("sc_label", { length: 255 }), // Human-readable label for admin UI
  updatedAt: timestamp("sc_updatedAt").defaultNow().onUpdateNow().notNull(),
  updatedBy: int("sc_updatedBy"), // staff id who last updated
});
export type SiteContent = typeof siteContent.$inferSelect;
export type InsertSiteContent = typeof siteContent.$inferInsert;

/**
 * Option Groups - customizable option categories for menu selection
 * e.g. ความหวาน, ร้อน/เย็น, แพ็คแยก ฯลฯ
 */
export const optionGroups = mysqlTable("option_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("og_name", { length: 255 }).notNull(),
  type: mysqlEnum("og_type", ["single", "multi"]).default("single").notNull(), // single = radio, multi = checkbox
  isRequired: int("og_isRequired").default(0).notNull(),
  isActive: int("og_isActive").default(1).notNull(),
  sortOrder: int("og_sortOrder").default(0).notNull(),
  createdAt: timestamp("og_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("og_updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OptionGroup = typeof optionGroups.$inferSelect;
export type InsertOptionGroup = typeof optionGroups.$inferInsert;

/**
 * Option Items - individual options within a group
 * e.g. ไม่หวาน, หวานน้อย, หวานปกติ, หวานมาก
 */
export const optionItems = mysqlTable("option_items", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("oi_groupId").notNull(),
  name: varchar("oi_name", { length: 255 }).notNull(),
  isActive: int("oi_isActive").default(1).notNull(),
  sortOrder: int("oi_sortOrder").default(0).notNull(),
  createdAt: timestamp("oi_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("oi_updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type OptionItem = typeof optionItems.$inferSelect;
export type InsertOptionItem = typeof optionItems.$inferInsert;

/**
 * Menu Option Groups - junction table linking option groups to menus
 * menuType: 'review' = review_menu_items, 'reward' = rewards table
 * This allows different menus to have different option groups
 */
export const menuOptionGroups = mysqlTable("menu_option_groups", {
  id: int("id").autoincrement().primaryKey(),
  menuType: mysqlEnum("mog_menuType", ["review", "reward"]).notNull(),
  menuId: int("mog_menuId").notNull(), // references review_menu_items.id or rewards.id
  optionGroupId: int("mog_optionGroupId").notNull(),
  createdAt: timestamp("mog_createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("unique_menu_option_group").on(table.menuType, table.menuId, table.optionGroupId),
]);

export type MenuOptionGroup = typeof menuOptionGroups.$inferSelect;
export type InsertMenuOptionGroup = typeof menuOptionGroups.$inferInsert;

/**
 * Password Reset Requests - customer submits request to reset password
 * Admin sees these requests and generates reset links
 */
export const passwordResetRequests = mysqlTable("password_reset_requests", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("prr_customerId").notNull(),
  identifier: varchar("prr_identifier", { length: 320 }).notNull(), // phone or email used to request
  identifierType: mysqlEnum("prr_identifierType", ["phone", "email"]).notNull(),
  status: mysqlEnum("prr_status", ["pending", "processed", "expired"]).default("pending").notNull(),
  processedBy: int("prr_processedBy"), // staff id who processed
  processedAt: timestamp("prr_processedAt"),
  createdAt: timestamp("prr_createdAt").defaultNow().notNull(),
});

export type PasswordResetRequest = typeof passwordResetRequests.$inferSelect;
export type InsertPasswordResetRequest = typeof passwordResetRequests.$inferInsert;

/**
 * Password Reset Tokens - generated by admin, sent to customer
 * Token has expiry (24 hours) and can only be used once
 */
export const passwordResetTokens = mysqlTable("password_reset_tokens", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("prt_customerId").notNull(),
  token: varchar("prt_token", { length: 64 }).notNull().unique(),
  requestId: int("prt_requestId"), // link to the request that triggered this
  createdBy: int("prt_createdBy"), // staff id who created the token (null for self-service OTP)
  expiresAt: timestamp("prt_expiresAt").notNull(),
  usedAt: timestamp("prt_usedAt"),
  createdAt: timestamp("prt_createdAt").defaultNow().notNull(),
});

export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = typeof passwordResetTokens.$inferInsert;

/**
 * Petty Cash Settings - per-branch configuration
 * Controls alert thresholds, bank account info, and which roles can manage petty cash
 */
export const pettyCashSettings = mysqlTable("petty_cash_settings", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("pcs_branchId").notNull().unique(),
  alertThreshold: int("pcs_alertThreshold").default(1000).notNull(), // baht - alert when balance below this
  bankAccountName: varchar("pcs_bankAccountName", { length: 255 }),
  bankAccountNumber: varchar("pcs_bankAccountNumber", { length: 50 }),
  bankName: varchar("pcs_bankName", { length: 100 }),
  promptPayId: varchar("pcs_promptPayId", { length: 50 }),
  allowedRole: mysqlEnum("pcs_allowedRole", ["branch_manager", "branch_staff", "both"]).default("branch_manager").notNull(),
  isActive: int("pcs_isActive").default(1).notNull(),
  createdAt: timestamp("pcs_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pcs_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PettyCashSetting = typeof pettyCashSettings.$inferSelect;
export type InsertPettyCashSetting = typeof pettyCashSettings.$inferInsert;

/**
 * Petty Cash Transactions - all money in/out records
 * type: "deposit" = owner adds funds, "expense" = staff spends, "adjustment" = manual correction
 */
export const pettyCashTransactions = mysqlTable("petty_cash_transactions", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("pct_branchId").notNull(),
  type: mysqlEnum("pct_type", ["deposit", "expense", "adjustment"]).notNull(),
  amount: int("pct_amount").notNull(), // positive for deposit, positive for expense (stored as absolute)
  description: varchar("pct_description", { length: 500 }).notNull(),
  category: varchar("pct_category", { length: 100 }), // expense category
  receiptUrl: varchar("pct_receiptUrl", { length: 1000 }), // S3 URL for receipt photo
  transferMethod: mysqlEnum("pct_transferMethod", ["cash", "transfer", "promptpay"]), // how money was transferred (for deposits)
  transactionDate: timestamp("pct_transactionDate").notNull(), // actual date of transaction
  balanceAfter: int("pct_balanceAfter").notNull(), // running balance after this transaction
  createdBy: int("pct_createdBy").notNull(), // staff id
  createdByName: varchar("pct_createdByName", { length: 255 }), // denormalized for display
  note: text("pct_note"), // additional notes
  entryMethod: mysqlEnum("pct_entryMethod", ["ocr", "manual"]), // how the entry was created
  createdAt: timestamp("pct_createdAt").defaultNow().notNull(),
});
export type PettyCashTransaction = typeof pettyCashTransactions.$inferSelect;
export type InsertPettyCashTransaction = typeof pettyCashTransactions.$inferInsert;

/**
 * Petty Cash Fund Requests - staff requests owner to add more funds
 * When balance is low, staff can request a top-up with amount and reason
 */
export const pettyCashFundRequests = mysqlTable("petty_cash_fund_requests", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("pcfr_branchId").notNull(),
  requestedAmount: int("pcfr_requestedAmount").notNull(),
  reason: varchar("pcfr_reason", { length: 500 }).notNull(),
  status: mysqlEnum("pcfr_status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  requestedBy: int("pcfr_requestedBy").notNull(), // staff id
  requestedByName: varchar("pcfr_requestedByName", { length: 255 }),
  processedBy: int("pcfr_processedBy"), // owner/admin who approved/rejected
  processedAt: timestamp("pcfr_processedAt"),
  processedNote: varchar("pcfr_processedNote", { length: 500 }),
  createdAt: timestamp("pcfr_createdAt").defaultNow().notNull(),
});
export type PettyCashFundRequest = typeof pettyCashFundRequests.$inferSelect;
export type InsertPettyCashFundRequest = typeof pettyCashFundRequests.$inferInsert;

/**
 * Petty Cash Receipt Images - multiple images per transaction
 * Supports PNG, JPG, PDF files for receipt documentation
 */
export const pettyCashReceiptImages = mysqlTable("petty_cash_receipt_images", {
  id: int("id").autoincrement().primaryKey(),
  transactionId: int("pcri_transactionId").notNull(),
  branchId: int("pcri_branchId").notNull(),
  imageUrl: varchar("pcri_imageUrl", { length: 1000 }).notNull(),
  fileType: varchar("pcri_fileType", { length: 50 }).notNull(), // image/jpeg, image/png, application/pdf
  fileName: varchar("pcri_fileName", { length: 255 }),
  ocrText: text("pcri_ocrText"), // extracted text from OCR
  ocrData: text("pcri_ocrData"), // structured JSON from OCR (amount, date, vendor, items)
  sortOrder: int("pcri_sortOrder").default(0).notNull(),
  createdAt: timestamp("pcri_createdAt").defaultNow().notNull(),
});
export type PettyCashReceiptImage = typeof pettyCashReceiptImages.$inferSelect;
export type InsertPettyCashReceiptImage = typeof pettyCashReceiptImages.$inferInsert;

/**
 * Reward Categories - admin can create custom categories for rewards
 * Replaces the hardcoded enum with a flexible table
 */
export const rewardCategories = mysqlTable("reward_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("rc_name", { length: 255 }).notNull(),
  icon: varchar("rc_icon", { length: 50 }).default("gift").notNull(), // lucide icon name
  color: varchar("rc_color", { length: 100 }).default("bg-gray-50 text-gray-600").notNull(),
  isActive: int("rc_isActive").default(1).notNull(),
  sortOrder: int("rc_sortOrder").default(0).notNull(),
  createdAt: timestamp("rc_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("rc_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type RewardCategory = typeof rewardCategories.$inferSelect;
export type InsertRewardCategory = typeof rewardCategories.$inferInsert;

/**
 * ═══════════════════════════════════════════════════════
 *  CENTRAL E-COMMERCE SHOP
 * ═══════════════════════════════════════════════════════
 */

/**
 * Shop Product Categories - admin configurable
 * e.g. ผงมัทฉะ, ชาเขียว, อุปกรณ์, วัตถุดิบ
 */
export const shopCategories = mysqlTable("shop_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("sc_name", { length: 255 }).notNull(),
  description: text("sc_description"),
  imageUrl: text("sc_imageUrl"),
  sortOrder: int("sc_sortOrder").default(0).notNull(),
  isActive: int("sc_isActive").default(1).notNull(),
  createdAt: timestamp("sc_createdAt2").defaultNow().notNull(),
  updatedAt: timestamp("sc_updatedAt2").defaultNow().onUpdateNow().notNull(),
});
export type ShopCategory = typeof shopCategories.$inferSelect;
export type InsertShopCategory = typeof shopCategories.$inferInsert;

/**
 * Shop Products - central store products
 * Supports both retail and wholesale pricing
 */
export const shopProducts = mysqlTable("shop_products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("sp_categoryId"),
  sku: varchar("sp_sku", { length: 50 }).unique(),
  name: varchar("sp_name", { length: 255 }).notNull(),
  description: text("sp_description"),
  imageUrl: text("sp_imageUrl"),
  images: json("sp_images"), // array of image URLs for gallery
  retailPrice: int("sp_retailPrice").notNull(), // in satang (1 baht = 100 satang) for precision
  wholesalePrice: int("sp_wholesalePrice"),
  commissionType: mysqlEnum("sp_commissionType", ["percent", "fixed"]).default("percent"), // percent or fixed baht
  commissionValue: int("sp_commissionValue").default(0), // percent: 0-10000 (basis points, 100=1%), fixed: satang // null = no wholesale pricing
  costPrice: int("sp_costPrice").default(0), // ต้นทุนต่อชิ้น (satang) เพื่อคำนวณกำไร
  wholesaleMinQty: int("sp_wholesaleMinQty").default(10), // minimum qty for wholesale price
  unit: varchar("sp_unit", { length: 50 }).default("ชิ้น").notNull(), // ชิ้น, ถุง, กก., กล่อง
  weight: int("sp_weight"), // grams - for shipping calculation
  stock: int("sp_stock").default(0).notNull(),
  isActive: int("sp_isActive").default(1).notNull(),
  isFeatured: int("sp_isFeatured").default(0).notNull(),
  sortOrder: int("sp_sortOrder").default(0).notNull(),
  createdAt: timestamp("sp_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sp_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ShopProduct = typeof shopProducts.$inferSelect;
export type InsertShopProduct = typeof shopProducts.$inferInsert;

/**
 * Shopping Cart Items - per customer
 */
export const cartItems = mysqlTable("cart_items", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("ci_customerId").notNull(),
  productId: int("ci_productId").notNull(),
  quantity: int("ci_quantity").default(1).notNull(),
  createdAt: timestamp("ci_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("ci_updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("unique_cart_customer_product").on(table.customerId, table.productId),
]);
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = typeof cartItems.$inferInsert;

/**
 * Shop Orders - customer orders from central store
 * shippingMethod: pickup (free), delivery (with fee), delivery_with_code (code-based like review system)
 */
export const shopOrders = mysqlTable("shop_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("so_orderNumber", { length: 30 }).notNull().unique(), // HIBI-SO-XXXXXX
  customerId: int("so_customerId").notNull(),
  status: mysqlEnum("so_status", [
    "pending_payment",    // waiting for payment
    "payment_uploaded",   // slip uploaded, awaiting verification
    "payment_confirmed",  // payment verified by admin
    "processing",         // preparing order
    "shipped",            // shipped / ready for pickup
    "delivered",          // delivered / picked up
    "cancelled",          // cancelled
    "refunded",           // refunded
  ]).default("pending_payment").notNull(),
  totalAmount: int("so_totalAmount").notNull(), // in satang
  shippingMethod: mysqlEnum("so_shippingMethod", ["pickup", "delivery", "delivery_with_code"]).notNull(),
  shippingFee: int("so_shippingFee").default(0).notNull(), // in satang
  pickupBranchId: int("so_pickupBranchId"), // for pickup orders
  shippingAddress: text("so_shippingAddress"), // for delivery orders
  shippingName: varchar("so_shippingName", { length: 255 }),
  shippingPhone: varchar("so_shippingPhone", { length: 20 }),
  deliveryCode: varchar("so_deliveryCode", { length: 50 }), // for delivery_with_code method
  trackingNumber: varchar("so_trackingNumber", { length: 100 }),
  paymentMethod: mysqlEnum("so_paymentMethod", ["bank_transfer", "promptpay"]).default("bank_transfer").notNull(),
  paymentSlipUrl: text("so_paymentSlipUrl"),
  paymentConfirmedBy: int("so_paymentConfirmedBy"),
  paymentConfirmedAt: timestamp("so_paymentConfirmedAt"),
  note: text("so_note"), // customer note
  adminNote: text("so_adminNote"), // internal admin note
  // Commission tracking
  commissionBranchId: int("so_commissionBranchId"), // branch that earns commission (customer's primary branch)
  commissionRate: decimal("so_commissionRate", { precision: 5, scale: 2 }), // % at time of order
  commissionAmount: int("so_commissionAmount"), // in satang
  commissionStatus: mysqlEnum("so_commissionStatus", ["pending", "confirmed", "paid"]).default("pending"),
  createdAt: timestamp("so_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("so_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ShopOrder = typeof shopOrders.$inferSelect;
export type InsertShopOrder = typeof shopOrders.$inferInsert;

/**
 * Shop Order Items - individual items in an order
 * Denormalized product info for historical accuracy
 */
export const shopOrderItems = mysqlTable("shop_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("soi_orderId").notNull(),
  productId: int("soi_productId").notNull(),
  productName: varchar("soi_productName", { length: 255 }).notNull(),
  productSku: varchar("soi_productSku", { length: 50 }),
  price: int("soi_price").notNull(), // unit price in satang at time of purchase
  quantity: int("soi_quantity").notNull(),
  subtotal: int("soi_subtotal").notNull(), // price * quantity in satang
  createdAt: timestamp("soi_createdAt").defaultNow().notNull(),
});
export type ShopOrderItem = typeof shopOrderItems.$inferSelect;
export type InsertShopOrderItem = typeof shopOrderItems.$inferInsert;

/**
 * Branch Commission Settings - configurable commission rate per branch
 * Commission is earned when a customer registered at that branch buys from central shop
 */
export const branchCommissionSettings = mysqlTable("branch_commission_settings", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("bcs_branchId").notNull().unique(),
  commissionRate: decimal("bcs_commissionRate", { precision: 5, scale: 2 }).default("5.00").notNull(), // default 5%
  minMonthlySales: int("bcs_minMonthlySales").default(0).notNull(), // minimum monthly sales (satang) for this rate
  isActive: int("bcs_isActive").default(1).notNull(),
  note: text("bcs_note"),
  createdAt: timestamp("bcs_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("bcs_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type BranchCommissionSetting = typeof branchCommissionSettings.$inferSelect;
export type InsertBranchCommissionSetting = typeof branchCommissionSettings.$inferInsert;

/**
 * Daily Sales Records - branch staff records daily sales by channel
 * Each record represents one day's sales for one branch
 * Channels: cash, transfer, edc, delivery (built-in) + extra custom channels
 */
export const dailySalesRecords = mysqlTable("daily_sales_records", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("dsr_branchId").notNull(),
  salesDate: timestamp("dsr_salesDate").notNull(), // the date of sales
  cashAmount: int("dsr_cashAmount").default(0).notNull(), // in satang
  transferAmount: int("dsr_transferAmount").default(0).notNull(), // in satang
  edcAmount: int("dsr_edcAmount").default(0).notNull(), // in satang
  deliveryAmount: int("dsr_deliveryAmount").default(0).notNull(), // in satang
  extraTotal: int("dsr_extraTotal").default(0).notNull(), // sum of extra channels in satang
  totalAmount: int("dsr_totalAmount").default(0).notNull(), // grand total in satang
  note: text("dsr_note"),
  createdBy: int("dsr_createdBy").notNull(), // staff id
  createdByName: varchar("dsr_createdByName", { length: 255 }),
  updatedBy: int("dsr_updatedBy"),
  createdAt: timestamp("dsr_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("dsr_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type DailySalesRecord = typeof dailySalesRecords.$inferSelect;
export type InsertDailySalesRecord = typeof dailySalesRecords.$inferInsert;

/**
 * Daily Sales Extra Channels - custom payment channels added per sales record
 * e.g. "GrabFood", "LINE MAN", "Shopee Food", etc.
 */
export const dailySalesExtraChannels = mysqlTable("daily_sales_extra_channels", {
  id: int("id").autoincrement().primaryKey(),
  salesRecordId: int("dsec_salesRecordId").notNull(),
  channelName: varchar("dsec_channelName", { length: 255 }).notNull(),
  amount: int("dsec_amount").default(0).notNull(), // in satang
});
export type DailySalesExtraChannel = typeof dailySalesExtraChannels.$inferSelect;
export type InsertDailySalesExtraChannel = typeof dailySalesExtraChannels.$inferInsert;


/**
 * Customer Announcement Reads - tracks which announcements each customer has read
 * Used for notification badge / unread count
 */
export const customerAnnouncementReads = mysqlTable("customer_announcement_reads", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("car_customerId").notNull(),
  announcementId: int("car_announcementId").notNull(),
  readAt: timestamp("car_readAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("car_customer_announcement_idx").on(table.customerId, table.announcementId),
]);
export type CustomerAnnouncementRead = typeof customerAnnouncementReads.$inferSelect;
export type InsertCustomerAnnouncementRead = typeof customerAnnouncementReads.$inferInsert;


/**
 * Push Subscriptions - stores Web Push API subscriptions for customers
 * Used to send push notifications when new announcements are published
 */
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  customerId: int("ps_customerId").notNull(),
  endpoint: text("ps_endpoint").notNull(),
  p256dh: text("ps_p256dh").notNull(),
  auth: text("ps_auth").notNull(),
  createdAt: timestamp("ps_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("ps_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type InsertPushSubscription = typeof pushSubscriptions.$inferInsert;


/**
 * Announcement Templates - reusable templates for common announcement types
 * e.g. birthday promo, new branch opening, seasonal event
 */
export const announcementTemplates = mysqlTable("announcement_templates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("at_name", { length: 255 }).notNull(),
  description: text("at_description"),
  type: mysqlEnum("at_type", ["announcement", "promotion", "event"]).default("announcement").notNull(),
  titleTemplate: varchar("at_titleTemplate", { length: 255 }).notNull(),
  contentTemplate: text("at_contentTemplate").notNull(),
  imageUrl: text("at_imageUrl"),
  promoCode: varchar("at_promoCode", { length: 100 }),
  discountText: varchar("at_discountText", { length: 255 }),
  isActive: int("at_isActive").default(1).notNull(),
  createdAt: timestamp("at_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("at_updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AnnouncementTemplate = typeof announcementTemplates.$inferSelect;
export type InsertAnnouncementTemplate = typeof announcementTemplates.$inferInsert;


/**
 * Sales Categories - customizable categories for daily sales breakdown
 * e.g. "ยอดขายหน้าร้าน", "ยอดขายสินค้ากลับบ้าน", "ยอดขาย Delivery"
 * Each branch can have its own categories, or use global ones (branchId = null)
 */
export const salesCategories = mysqlTable("sales_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("sc_name", { length: 255 }).notNull(),
  description: text("sc_description"),
  branchId: int("sc_branchId"), // null = global (all branches)
  commissionRate: decimal("sc_commissionRate", { precision: 5, scale: 2 }).default("0.00").notNull(), // commission % for this category
  isStandard: int("sc_isStandard").default(0).notNull(), // 1 = admin-defined standard category (cannot be deleted by branch)
  sortOrder: int("sc_sortOrder").default(0).notNull(),
  isActive: int("sc_isActive").default(1).notNull(),
  createdAt: timestamp("sc_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sc_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SalesCategory = typeof salesCategories.$inferSelect;
export type InsertSalesCategory = typeof salesCategories.$inferInsert;

/**
 * Daily Sales Items - individual sales entries per category per day
 * Links to a daily_sales_records entry and a sales_categories entry
 */
export const dailySalesItems = mysqlTable("daily_sales_items", {
  id: int("id").autoincrement().primaryKey(),
  salesRecordId: int("dsi_salesRecordId").notNull(), // FK to daily_sales_records
  categoryId: int("dsi_categoryId").notNull(), // FK to sales_categories
  amount: int("dsi_amount").default(0).notNull(), // in satang
  note: text("dsi_note"),
});
export type DailySalesItem = typeof dailySalesItems.$inferSelect;
export type InsertDailySalesItem = typeof dailySalesItems.$inferInsert;

/**
 * Daily Sales Audit Logs - tracks every edit to daily sales records
 * Records who changed what, when, with before/after data
 */
export const dailySalesAuditLogs = mysqlTable("daily_sales_audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  salesRecordId: int("dsal_salesRecordId").notNull(), // FK to daily_sales_records
  branchId: int("dsal_branchId").notNull(),
  userId: int("dsal_userId").notNull(), // who made the change
  userName: varchar("dsal_userName", { length: 255 }),
  action: mysqlEnum("dsal_action", ["create", "update"]).notNull(),
  beforeData: text("dsal_beforeData"), // JSON snapshot before change (null for create)
  afterData: text("dsal_afterData").notNull(), // JSON snapshot after change
  createdAt: timestamp("dsal_createdAt").defaultNow().notNull(),
});
export type DailySalesAuditLog = typeof dailySalesAuditLogs.$inferSelect;
export type InsertDailySalesAuditLog = typeof dailySalesAuditLogs.$inferInsert;

/**
 * Franchise Owners - group branches under a franchise owner/company
 */
export const franchiseOwners = mysqlTable("franchise_owners", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("fo_name", { length: 255 }).notNull(),
  companyName: varchar("fo_companyName", { length: 255 }),
  phone: varchar("fo_phone", { length: 20 }),
  email: varchar("fo_email", { length: 320 }),
  isActive: int("fo_isActive").default(1).notNull(),
  createdAt: timestamp("fo_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("fo_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FranchiseOwner = typeof franchiseOwners.$inferSelect;
export type InsertFranchiseOwner = typeof franchiseOwners.$inferInsert;

/**
 * In-Store Sales - product sales at physical store (non-beverage)
 * Separate from daily sales records which track beverage/food sales
 */
export const inStoreSales = mysqlTable("in_store_sales", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("iss_branchId").notNull(),
  customerId: int("iss_customerId").notNull(), // must be a member
  productId: int("iss_productId").notNull(), // FK to shop_products
  quantity: int("iss_quantity").default(1).notNull(),
  unitPrice: int("iss_unitPrice").notNull(), // in satang
  totalAmount: int("iss_totalAmount").notNull(), // in satang
  paymentSlipUrl: text("iss_paymentSlipUrl"), // proof of payment
  totalCommission: int("iss_totalCommission").default(0).notNull(), // total commission in satang (split among staff)
  commissionType: mysqlEnum("iss_commissionType", ["percent", "fixed"]),
  commissionValue: int("iss_commissionValue").default(0), // snapshot from product at time of sale
  pointsAwarded: int("iss_pointsAwarded").default(0), // loyalty points given to customer
  isAppSale: int("iss_isAppSale").default(0).notNull(), // 1 = ลูกค้าซื้อผ่านแอพ (ยอดร้าน ไม่คิดคอม)
  totalCost: int("iss_totalCost").default(0).notNull(), // ต้นทุนรวม (satang) = costPrice * quantity
  saleDate: timestamp("iss_saleDate").notNull(),
  note: text("iss_note"),
  createdBy: int("iss_createdBy").notNull(), // staff who recorded the sale
  createdAt: timestamp("iss_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("iss_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type InStoreSale = typeof inStoreSales.$inferSelect;
export type InsertInStoreSale = typeof inStoreSales.$inferInsert;

/**
 * In-Store Sale Staff - tracks which staff members made the sale (max 3)
 * Commission is split equally among all staff on the sale
 */
export const inStoreSaleStaff = mysqlTable("in_store_sale_staff", {
  id: int("id").autoincrement().primaryKey(),
  saleId: int("isss_saleId").notNull(), // FK to in_store_sales
  staffId: int("isss_staffId").notNull(), // FK to staff
  commissionAmount: int("isss_commissionAmount").default(0).notNull(), // individual share in satang
  createdAt: timestamp("isss_createdAt").defaultNow().notNull(),
}, (table) => [
  uniqueIndex("isss_sale_staff_idx").on(table.saleId, table.staffId),
]);
export type InStoreSaleStaff = typeof inStoreSaleStaff.$inferSelect;
export type InsertInStoreSaleStaff = typeof inStoreSaleStaff.$inferInsert;

/**
 * Commission Records - monthly aggregated commission per staff
 * Generated/updated when in-store sales are recorded
 */
export const commissionRecords = mysqlTable("commission_records", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("cr_staffId").notNull(),
  branchId: int("cr_branchId").notNull(),
  month: varchar("cr_month", { length: 7 }).notNull(), // YYYY-MM format
  totalSalesAmount: int("cr_totalSalesAmount").default(0).notNull(), // in satang
  totalCommission: int("cr_totalCommission").default(0).notNull(), // in satang
  salesCount: int("cr_salesCount").default(0).notNull(),
  status: mysqlEnum("cr_status", ["pending", "approved", "paid"]).default("pending").notNull(),
  approvedBy: int("cr_approvedBy"),
  approvedAt: timestamp("cr_approvedAt"),
  paidAt: timestamp("cr_paidAt"),
  note: text("cr_note"),
  createdAt: timestamp("cr_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("cr_updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => [
  uniqueIndex("cr_staff_branch_month_idx").on(table.staffId, table.branchId, table.month),
]);
export type CommissionRecord = typeof commissionRecords.$inferSelect;
export type InsertCommissionRecord = typeof commissionRecords.$inferInsert;


// ═══════════════════════════════════════════════════════════════════════
// POS System Tables (migrated from hibi-pos project)
// ═══════════════════════════════════════════════════════════════════════

/**
 * POS Categories - beverage, food, dessert, retail
 */
export const posCategories = mysqlTable("pos_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  type: mysqlEnum("pos_cat_type", ["beverage", "food", "dessert", "retail"]).default("beverage").notNull(),
  sortOrder: int("pos_cat_sortOrder").default(0).notNull(),
  isActive: boolean("pos_cat_isActive").default(true).notNull(),
  imageUrl: text("pos_cat_imageUrl"),
  createdAt: timestamp("pos_cat_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_cat_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PosCategory = typeof posCategories.$inferSelect;
export type InsertPosCategory = typeof posCategories.$inferInsert;

/**
 * POS Menu Items
 */
export const posMenuItems = mysqlTable("pos_menu_items", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("pos_mi_categoryId"),
  name: varchar("pos_mi_name", { length: 200 }).notNull(),
  code: varchar("pos_mi_code", { length: 20 }),
  description: text("pos_mi_description"),
  imageUrl: text("pos_mi_imageUrl"),
  basePrice: decimal("pos_mi_basePrice", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("pos_mi_costPrice", { precision: 10, scale: 2 }).default("0"),
  sendTo: mysqlEnum("pos_mi_sendTo", ["kitchen", "bar", "none"]).default("bar").notNull(),
  isActive: boolean("pos_mi_isActive").default(true).notNull(),
  sortOrder: int("pos_mi_sortOrder").default(0).notNull(),
  createdAt: timestamp("pos_mi_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_mi_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PosMenuItem = typeof posMenuItems.$inferSelect;
export type InsertPosMenuItem = typeof posMenuItems.$inferInsert;

/**
 * POS Branch Menu Overrides (price/availability per branch)
 */
export const posBranchMenuItems = mysqlTable("pos_branch_menu_items", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("pos_bmi_branchId").notNull(),
  menuItemId: int("pos_bmi_menuItemId").notNull(),
  price: decimal("pos_bmi_price", { precision: 10, scale: 2 }),
  costPrice: decimal("pos_bmi_costPrice", { precision: 10, scale: 2 }),
  isAvailable: boolean("pos_bmi_isAvailable").default(true).notNull(),
  createdAt: timestamp("pos_bmi_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_bmi_updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * POS Option Groups
 */
export const posOptionGroups = mysqlTable("pos_option_groups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("pos_og_name", { length: 100 }).notNull(),
  type: mysqlEnum("pos_og_type", ["single", "multiple"]).default("single").notNull(),
  isRequired: boolean("pos_og_isRequired").default(false).notNull(),
  maxSelections: int("pos_og_maxSelections").default(1),
  sortOrder: int("pos_og_sortOrder").default(0).notNull(),
  createdAt: timestamp("pos_og_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_og_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PosOptionGroup = typeof posOptionGroups.$inferSelect;
export type InsertPosOptionGroup = typeof posOptionGroups.$inferInsert;

/**
 * POS Options
 */
export const posOptions = mysqlTable("pos_options", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("pos_opt_groupId").notNull(),
  name: varchar("pos_opt_name", { length: 100 }).notNull(),
  priceAdjustment: decimal("pos_opt_priceAdj", { precision: 10, scale: 2 }).default("0").notNull(),
  costAdjustment: decimal("pos_opt_costAdj", { precision: 10, scale: 2 }).default("0").notNull(),
  isDefault: boolean("pos_opt_isDefault").default(false).notNull(),
  isActive: boolean("pos_opt_isActive").default(true).notNull(),
  sortOrder: int("pos_opt_sortOrder").default(0).notNull(),
  createdAt: timestamp("pos_opt_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_opt_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PosOption = typeof posOptions.$inferSelect;
export type InsertPosOption = typeof posOptions.$inferInsert;

/**
 * POS Menu Item <-> Option Group (many-to-many)
 */
export const posMenuItemOptionGroups = mysqlTable("pos_menu_item_option_groups", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("pos_miog_menuItemId").notNull(),
  optionGroupId: int("pos_miog_optionGroupId").notNull(),
});

/**
 * POS Retail Products
 */
export const posRetailProducts = mysqlTable("pos_retail_products", {
  id: int("id").autoincrement().primaryKey(),
  categoryId: int("pos_rp_categoryId").notNull(),
  name: varchar("pos_rp_name", { length: 200 }).notNull(),
  sku: varchar("pos_rp_sku", { length: 50 }),
  barcode: varchar("pos_rp_barcode", { length: 50 }),
  description: text("pos_rp_description"),
  imageUrl: text("pos_rp_imageUrl"),
  price: decimal("pos_rp_price", { precision: 10, scale: 2 }).notNull(),
  costPrice: decimal("pos_rp_costPrice", { precision: 10, scale: 2 }).default("0"),
  isActive: boolean("pos_rp_isActive").default(true).notNull(),
  sortOrder: int("pos_rp_sortOrder").default(0).notNull(),
  createdAt: timestamp("pos_rp_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_rp_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PosRetailProduct = typeof posRetailProducts.$inferSelect;
export type InsertPosRetailProduct = typeof posRetailProducts.$inferInsert;

/**
 * POS Branch Retail Stock
 */
export const posBranchRetailStock = mysqlTable("pos_branch_retail_stock", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("pos_brs_branchId").notNull(),
  retailProductId: int("pos_brs_retailProductId").notNull(),
  stock: int("pos_brs_stock").default(0).notNull(),
  minStock: int("pos_brs_minStock").default(0).notNull(),
  price: decimal("pos_brs_price", { precision: 10, scale: 2 }),
  isAvailable: boolean("pos_brs_isAvailable").default(true).notNull(),
  updatedAt: timestamp("pos_brs_updatedAt").defaultNow().onUpdateNow().notNull(),
});

/**
 * POS Payment Methods
 */
export const posPaymentMethods = mysqlTable("pos_payment_methods", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("pos_pm_name", { length: 100 }).notNull(),
  code: varchar("pos_pm_code", { length: 20 }).notNull().unique(),
  type: mysqlEnum("pos_pm_type", ["cash", "transfer", "qr", "edc", "credit", "ewallet", "other"]).notNull(),
  isActive: boolean("pos_pm_isActive").default(true).notNull(),
  sortOrder: int("pos_pm_sortOrder").default(0).notNull(),
  createdAt: timestamp("pos_pm_createdAt").defaultNow().notNull(),
});
export type PosPaymentMethod = typeof posPaymentMethods.$inferSelect;
export type InsertPosPaymentMethod = typeof posPaymentMethods.$inferInsert;

/**
 * POS Discounts
 */
export const posDiscounts = mysqlTable("pos_discounts", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("pos_disc_name", { length: 200 }).notNull(),
  type: mysqlEnum("pos_disc_type", ["percentage", "fixed"]).notNull(),
  value: decimal("pos_disc_value", { precision: 10, scale: 2 }).notNull(),
  scope: mysqlEnum("pos_disc_scope", ["item", "order"]).default("order").notNull(),
  code: varchar("pos_disc_code", { length: 50 }),
  minOrderAmount: decimal("pos_disc_minOrder", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("pos_disc_maxDisc", { precision: 10, scale: 2 }),
  isActive: boolean("pos_disc_isActive").default(true).notNull(),
  startDate: timestamp("pos_disc_startDate"),
  endDate: timestamp("pos_disc_endDate"),
  requiresPermission: boolean("pos_disc_requiresPerm").default(false).notNull(),
  createdAt: timestamp("pos_disc_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_disc_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PosDiscount = typeof posDiscounts.$inferSelect;
export type InsertPosDiscount = typeof posDiscounts.$inferInsert;

/**
 * POS Orders
 */
export const posOrders = mysqlTable("pos_orders", {
  id: int("id").autoincrement().primaryKey(),
  orderNumber: varchar("pos_ord_orderNumber", { length: 30 }).notNull(),
  branchId: int("pos_ord_branchId").notNull(),
  staffId: int("pos_ord_staffId").notNull(),
  status: mysqlEnum("pos_ord_status", ["open", "completed", "voided", "refunded"]).default("open").notNull(),
  orderType: mysqlEnum("pos_ord_orderType", ["dine_in", "takeaway", "delivery"]).default("dine_in").notNull(),
  subtotal: decimal("pos_ord_subtotal", { precision: 10, scale: 2 }).default("0").notNull(),
  discountAmount: decimal("pos_ord_discountAmt", { precision: 10, scale: 2 }).default("0").notNull(),
  discountId: int("pos_ord_discountId"),
  taxAmount: decimal("pos_ord_taxAmt", { precision: 10, scale: 2 }).default("0").notNull(),
  totalAmount: decimal("pos_ord_totalAmt", { precision: 10, scale: 2 }).default("0").notNull(),
  totalCost: decimal("pos_ord_totalCost", { precision: 10, scale: 2 }).default("0").notNull(),
  note: text("pos_ord_note"),
  customerName: varchar("pos_ord_custName", { length: 100 }),
  customerPhone: varchar("pos_ord_custPhone", { length: 20 }),
  createdAt: timestamp("pos_ord_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_ord_updatedAt").defaultNow().onUpdateNow().notNull(),
  completedAt: timestamp("pos_ord_completedAt"),
});
export type PosOrder = typeof posOrders.$inferSelect;
export type InsertPosOrder = typeof posOrders.$inferInsert;

/**
 * POS Order Items
 */
export const posOrderItems = mysqlTable("pos_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("pos_oi_orderId").notNull(),
  itemType: mysqlEnum("pos_oi_itemType", ["menu", "retail"]).default("menu").notNull(),
  menuItemId: int("pos_oi_menuItemId"),
  retailProductId: int("pos_oi_retailProductId"),
  name: varchar("pos_oi_name", { length: 200 }).notNull(),
  quantity: int("pos_oi_quantity").default(1).notNull(),
  unitPrice: decimal("pos_oi_unitPrice", { precision: 10, scale: 2 }).notNull(),
  unitCost: decimal("pos_oi_unitCost", { precision: 10, scale: 2 }).default("0").notNull(),
  optionsPrice: decimal("pos_oi_optionsPrice", { precision: 10, scale: 2 }).default("0").notNull(),
  discountAmount: decimal("pos_oi_discountAmt", { precision: 10, scale: 2 }).default("0").notNull(),
  totalPrice: decimal("pos_oi_totalPrice", { precision: 10, scale: 2 }).notNull(),
  sendTo: mysqlEnum("pos_oi_sendTo", ["kitchen", "bar", "none"]).default("none").notNull(),
  note: text("pos_oi_note"),
  createdAt: timestamp("pos_oi_createdAt").defaultNow().notNull(),
});
export type PosOrderItem = typeof posOrderItems.$inferSelect;
export type InsertPosOrderItem = typeof posOrderItems.$inferInsert;

/**
 * POS Order Item Options
 */
export const posOrderItemOptions = mysqlTable("pos_order_item_options", {
  id: int("id").autoincrement().primaryKey(),
  orderItemId: int("pos_oio_orderItemId").notNull(),
  optionGroupName: varchar("pos_oio_groupName", { length: 100 }).notNull(),
  optionName: varchar("pos_oio_optionName", { length: 100 }).notNull(),
  priceAdjustment: decimal("pos_oio_priceAdj", { precision: 10, scale: 2 }).default("0").notNull(),
});

/**
 * POS Order Payments
 */
export const posOrderPayments = mysqlTable("pos_order_payments", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("pos_op_orderId").notNull(),
  paymentMethodId: int("pos_op_paymentMethodId").notNull(),
  amount: decimal("pos_op_amount", { precision: 10, scale: 2 }).notNull(),
  reference: varchar("pos_op_reference", { length: 100 }),
  createdAt: timestamp("pos_op_createdAt").defaultNow().notNull(),
});
export type PosOrderPayment = typeof posOrderPayments.$inferSelect;
export type InsertPosOrderPayment = typeof posOrderPayments.$inferInsert;

/**
 * POS Kitchen Tickets
 */
export const posKitchenTickets = mysqlTable("pos_kitchen_tickets", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("pos_kt_orderId").notNull(),
  branchId: int("pos_kt_branchId").notNull(),
  ticketNumber: varchar("pos_kt_ticketNumber", { length: 30 }).notNull(),
  station: mysqlEnum("pos_kt_station", ["kitchen", "bar"]).notNull(),
  status: mysqlEnum("pos_kt_status", ["pending", "preparing", "ready", "served"]).default("pending").notNull(),
  items: json("pos_kt_items").notNull(),
  createdAt: timestamp("pos_kt_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_kt_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PosKitchenTicket = typeof posKitchenTickets.$inferSelect;
export type InsertPosKitchenTicket = typeof posKitchenTickets.$inferInsert;

/**
 * POS Daily Summaries (for reports)
 */
export const posDailySummaries = mysqlTable("pos_daily_summaries", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("pos_ds_branchId").notNull(),
  date: varchar("pos_ds_date", { length: 10 }).notNull(),
  totalOrders: int("pos_ds_totalOrders").default(0).notNull(),
  totalRevenue: decimal("pos_ds_totalRevenue", { precision: 12, scale: 2 }).default("0").notNull(),
  totalCost: decimal("pos_ds_totalCost", { precision: 12, scale: 2 }).default("0").notNull(),
  totalDiscount: decimal("pos_ds_totalDiscount", { precision: 12, scale: 2 }).default("0").notNull(),
  cashAmount: decimal("pos_ds_cashAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  transferAmount: decimal("pos_ds_transferAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  otherAmount: decimal("pos_ds_otherAmount", { precision: 12, scale: 2 }).default("0").notNull(),
  createdAt: timestamp("pos_ds_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_ds_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PosDailySummary = typeof posDailySummaries.$inferSelect;

/**
 * POS Staff PINs (for POS terminal login without OAuth)
 */
export const posStaffPins = mysqlTable("pos_staff_pins", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("pos_sp_branchId").notNull(),
  name: varchar("pos_sp_name", { length: 100 }).notNull(),
  pin: varchar("pos_sp_pin", { length: 10 }).notNull(),
  role: mysqlEnum("pos_sp_role", ["manager", "cashier", "kitchen"]).default("cashier").notNull(),
  isActive: boolean("pos_sp_isActive").default(true).notNull(),
  lastLogin: timestamp("pos_sp_lastLogin"),
  createdAt: timestamp("pos_sp_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("pos_sp_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PosStaffPin = typeof posStaffPins.$inferSelect;
export type InsertPosStaffPin = typeof posStaffPins.$inferInsert;


/**
 * Staff Push Subscriptions - web push subscriptions for staff members (branch managers, etc.)
 */
export const staffPushSubscriptions = mysqlTable("staff_push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  staffId: int("sps_staffId").notNull(),
  endpoint: text("sps_endpoint").notNull(),
  p256dh: text("sps_p256dh").notNull(),
  auth: text("sps_auth").notNull(),
  createdAt: timestamp("sps_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sps_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StaffPushSubscription = typeof staffPushSubscriptions.$inferSelect;
export type InsertStaffPushSubscription = typeof staffPushSubscriptions.$inferInsert;


// ═══════════════════════════════════════════════════════════════════════════
// STOCK MANAGEMENT SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Ingredient categories for organizing raw materials
 */
export const stockIngredientCategories = mysqlTable("stock_ingredient_categories", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("sic_name", { length: 200 }).notNull(),
  sortOrder: int("sic_sortOrder").default(0).notNull(),
  isActive: boolean("sic_isActive").default(true).notNull(),
  createdAt: timestamp("sic_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sic_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StockIngredientCategory = typeof stockIngredientCategories.$inferSelect;
export type InsertStockIngredientCategory = typeof stockIngredientCategories.$inferInsert;

/**
 * Central ingredient master list (raw materials)
 */
export const stockIngredients = mysqlTable("stock_ingredients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("si_name", { length: 200 }).notNull(),
  unit: varchar("si_unit", { length: 50 }).notNull(), // g, ml, pcs, kg, L
  categoryId: int("si_categoryId"),
  costPerUnit: decimal("si_costPerUnit", { precision: 10, scale: 4 }).default("0").notNull(), // Moving Average Cost
  sku: varchar("si_sku", { length: 100 }),
  barcode: varchar("si_barcode", { length: 100 }),
  defaultMinStock: decimal("si_defaultMinStock", { precision: 10, scale: 2 }).default("0").notNull(),
  defaultParLevel: decimal("si_defaultParLevel", { precision: 10, scale: 2 }).default("0").notNull(),
  isActive: boolean("si_isActive").default(true).notNull(),
  createdAt: timestamp("si_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("si_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StockIngredient = typeof stockIngredients.$inferSelect;
export type InsertStockIngredient = typeof stockIngredients.$inferInsert;

/**
 * Branch-level ingredient stock (quantity + branch-specific settings)
 */
export const stockBranchIngredients = mysqlTable("stock_branch_ingredients", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("sbi_branchId").notNull(),
  ingredientId: int("sbi_ingredientId").notNull(),
  quantity: decimal("sbi_quantity", { precision: 10, scale: 4 }).default("0").notNull(),
  minStock: decimal("sbi_minStock", { precision: 10, scale: 2 }).default("0").notNull(),
  parLevel: decimal("sbi_parLevel", { precision: 10, scale: 2 }).default("0").notNull(),
  lastCostPerUnit: decimal("sbi_lastCostPerUnit", { precision: 10, scale: 4 }).default("0").notNull(),
  createdAt: timestamp("sbi_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sbi_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StockBranchIngredient = typeof stockBranchIngredients.$inferSelect;
export type InsertStockBranchIngredient = typeof stockBranchIngredients.$inferInsert;

/**
 * Recipe: links menu items to ingredients with quantities
 */
export const stockRecipes = mysqlTable("stock_recipes", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("sr_menuItemId").notNull(),
  ingredientId: int("sr_ingredientId").notNull(),
  quantity: decimal("sr_quantity", { precision: 10, scale: 4 }).notNull(), // amount of ingredient per 1 serving
  createdAt: timestamp("sr_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sr_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StockRecipe = typeof stockRecipes.$inferSelect;
export type InsertStockRecipe = typeof stockRecipes.$inferInsert;

/**
 * Option recipes: links POS options (toppings etc.) to additional ingredients
 */
export const stockOptionRecipes = mysqlTable("stock_option_recipes", {
  id: int("id").autoincrement().primaryKey(),
  optionId: int("sor_optionId").notNull(), // references pos_options.id
  ingredientId: int("sor_ingredientId").notNull(),
  quantity: decimal("sor_quantity", { precision: 10, scale: 4 }).notNull(),
  createdAt: timestamp("sor_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sor_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StockOptionRecipe = typeof stockOptionRecipes.$inferSelect;
export type InsertStockOptionRecipe = typeof stockOptionRecipes.$inferInsert;

/**
 * Stock movements: every in/out/adjustment recorded here
 */
export const stockMovements = mysqlTable("stock_movements", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("sm_branchId").notNull(),
  ingredientId: int("sm_ingredientId"),
  retailProductId: int("sm_retailProductId"),
  type: mysqlEnum("sm_type", ["stock_in", "sale", "adjustment", "waste", "void_restore", "transfer"]).notNull(),
  quantity: decimal("sm_quantity", { precision: 10, scale: 4 }).notNull(), // positive = in, negative = out
  costPerUnit: decimal("sm_costPerUnit", { precision: 10, scale: 4 }).default("0").notNull(),
  totalCost: decimal("sm_totalCost", { precision: 10, scale: 2 }).default("0").notNull(),
  balanceAfter: decimal("sm_balanceAfter", { precision: 10, scale: 4 }).default("0").notNull(),
  reason: text("sm_reason"),
  reference: varchar("sm_reference", { length: 200 }), // e.g. "order:123", "adj:456"
  supplierId: int("sm_supplierId"),
  staffId: int("sm_staffId"),
  staffName: varchar("sm_staffName", { length: 200 }),
  orderId: int("sm_orderId"), // link to pos_orders if sale/void
  createdAt: timestamp("sm_createdAt").defaultNow().notNull(),
});
export type StockMovement = typeof stockMovements.$inferSelect;
export type InsertStockMovement = typeof stockMovements.$inferInsert;

/**
 * Suppliers for stock purchases
 */
export const stockSuppliers = mysqlTable("stock_suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("ss_name", { length: 200 }).notNull(),
  contactName: varchar("ss_contactName", { length: 200 }),
  phone: varchar("ss_phone", { length: 50 }),
  email: varchar("ss_email", { length: 320 }),
  address: text("ss_address"),
  note: text("ss_note"),
  isActive: boolean("ss_isActive").default(true).notNull(),
  createdAt: timestamp("ss_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("ss_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StockSupplier = typeof stockSuppliers.$inferSelect;
export type InsertStockSupplier = typeof stockSuppliers.$inferInsert;

/**
 * Stock alerts (low stock, out of stock, reorder needed)
 */
export const stockAlerts = mysqlTable("stock_alerts", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("sa_branchId").notNull(),
  ingredientId: int("sa_ingredientId"),
  retailProductId: int("sa_retailProductId"),
  type: mysqlEnum("sa_type", ["low_stock", "out_of_stock", "reorder_needed", "stock_restored"]).notNull(),
  message: text("sa_message").notNull(),
  isRead: boolean("sa_isRead").default(false).notNull(),
  isResolved: boolean("sa_isResolved").default(false).notNull(),
  createdAt: timestamp("sa_createdAt").defaultNow().notNull(),
});
export type StockAlert = typeof stockAlerts.$inferSelect;
export type InsertStockAlert = typeof stockAlerts.$inferInsert;

/**
 * Daily stock summaries (auto-calculated)
 */
export const stockDailySummaries = mysqlTable("stock_daily_summaries", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("sds_branchId").notNull(),
  date: varchar("sds_date", { length: 10 }).notNull(), // YYYY-MM-DD
  totalCostUsed: decimal("sds_totalCostUsed", { precision: 12, scale: 2 }).default("0").notNull(),
  totalCostReceived: decimal("sds_totalCostReceived", { precision: 12, scale: 2 }).default("0").notNull(),
  totalWasteCost: decimal("sds_totalWasteCost", { precision: 12, scale: 2 }).default("0").notNull(),
  totalStockValue: decimal("sds_totalStockValue", { precision: 12, scale: 2 }).default("0").notNull(),
  itemsBelowMin: int("sds_itemsBelowMin").default(0).notNull(),
  createdAt: timestamp("sds_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sds_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type StockDailySummary = typeof stockDailySummaries.$inferSelect;
export type InsertStockDailySummary = typeof stockDailySummaries.$inferInsert;

// ============================================================
// SOP SYSTEM TABLES (merged from hibi-sop-generator)
// ============================================================

/**
 * Ingredient Catalog — master list of all ingredients (Hibi & external)
 */
export const ingredientCatalog = mysqlTable("ingredient_catalog", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameTh: varchar("nameTh", { length: 255 }).notNull(),
  category: mysqlEnum("category", ["hibi", "external"]).default("external").notNull(),
  unit: varchar("unit", { length: 32 }).notNull(),
  description: text("description"),
  defaultPackSize: varchar("defaultPackSize", { length: 64 }),
  defaultCostPerUnit: int("defaultCostPerUnit"),
  isActive: int("isActive").default(1).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IngredientCatalog = typeof ingredientCatalog.$inferSelect;
export type InsertIngredientCatalog = typeof ingredientCatalog.$inferInsert;

/**
 * Suppliers — vendors for ingredients
 * type: 'hibi' = Hibi HQ internal supply, 'external' = third-party vendor
 */
export const sopSuppliers = mysqlTable("sop_suppliers", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["hibi", "external"]).default("external").notNull(),
  contactName: varchar("contactName", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 255 }),
  address: text("address"),
  note: text("note"),
  isActive: int("isActive").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SopSupplier = typeof sopSuppliers.$inferSelect;
export type InsertSopSupplier = typeof sopSuppliers.$inferInsert;

/**
 * Ingredient Pricing — cost per pack/unit for each ingredient from a supplier
 * costPerUnit is stored in satang (1/100 baht) for precision
 */
export const ingredientPricing = mysqlTable("ingredient_pricing", {
  id: int("id").autoincrement().primaryKey(),
  catalogId: int("catalogId").notNull(),
  supplierId: int("supplierId"),
  packSize: varchar("packSize", { length: 64 }).notNull(),
  packUnit: varchar("packUnit", { length: 32 }).notNull(),
  packPrice: int("packPrice").notNull(),
  costPerUnit: int("costPerUnit").notNull(),
  isDefault: int("isDefault").default(0).notNull(),
  effectiveDate: timestamp("effectiveDate").defaultNow().notNull(),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IngredientPricing = typeof ingredientPricing.$inferSelect;
export type InsertIngredientPricing = typeof ingredientPricing.$inferInsert;

/**
 * Automation Workflows — event-driven action chains
 * event: the trigger event type
 * actions: JSON array of action objects [{ type, params }]
 * conditions: JSON object with optional filters { threshold, branchIds, categories }
 */
export const automationWorkflows = mysqlTable("automation_workflows", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  nameTh: varchar("nameTh", { length: 255 }).notNull(),
  description: text("description"),
  event: mysqlEnum("event", [
    "menu_created",
    "menu_updated",
    "branch_created",
    "staff_created",
    "ingredient_price_updated",
    "training_completed",
    "cost_threshold_exceeded"
  ]).notNull(),
  actions: json("actions").notNull(),
  conditions: json("conditions"),
  isActive: int("isActive").default(1).notNull(),
  isPrebuilt: int("isPrebuilt").default(0).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AutomationWorkflow = typeof automationWorkflows.$inferSelect;
export type InsertAutomationWorkflow = typeof automationWorkflows.$inferInsert;

/**
 * Automation Logs — execution history for automation workflows
 */
export const automationLogs = mysqlTable("automation_logs", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  workflowName: varchar("workflowName", { length: 255 }).notNull(),
  event: varchar("event", { length: 64 }).notNull(),
  eventData: json("eventData"),
  actionsExecuted: json("actionsExecuted"),
  status: mysqlEnum("status", ["success", "partial", "failed"]).default("success").notNull(),
  error: text("error"),
  duration: int("duration"),
  triggeredAt: timestamp("triggeredAt").defaultNow().notNull(),
});
export type AutomationLog = typeof automationLogs.$inferSelect;
export type InsertAutomationLog = typeof automationLogs.$inferInsert;

// ============================================================
// SOP Review & Approval System
// ============================================================

/**
 * SOP Review Logs — tracks status transitions for menu items
 */
export const sopReviewLogs = mysqlTable("sop_review_logs", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menuItemId").notNull(),
  fromStatus: varchar("fromStatus", { length: 32 }).notNull(),
  toStatus: varchar("toStatus", { length: 32 }).notNull(),
  changedBy: int("changedBy").notNull(),
  comment: text("comment"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SopReviewLog = typeof sopReviewLogs.$inferSelect;
export type InsertSopReviewLog = typeof sopReviewLogs.$inferInsert;

/**
 * Document Versions — stores every version of generated documents
 */
export const documentVersions = mysqlTable("document_versions", {
  id: int("id").autoincrement().primaryKey(),
  documentId: int("documentId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  content: text("content"),
  fileUrl: text("fileUrl"),
  generatedBy: int("generatedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type DocumentVersion = typeof documentVersions.$inferSelect;
export type InsertDocumentVersion = typeof documentVersions.$inferInsert;

/**
 * SOP Acknowledgments — staff digital sign-off on SOP versions
 */
export const sopAcknowledgments = mysqlTable("sop_acknowledgments", {
  id: int("id").autoincrement().primaryKey(),
  staffCodeId: int("staffCodeId").notNull(),
  documentId: int("documentId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  acknowledgedAt: timestamp("acknowledgedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
});
export type SopAcknowledgment = typeof sopAcknowledgments.$inferSelect;
export type InsertSopAcknowledgment = typeof sopAcknowledgments.$inferInsert;

/**
 * SOP Changelogs — AI-generated summaries of version differences
 */
export const sopChangelogs = mysqlTable("sop_changelogs", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menuItemId").notNull(),
  fromVersion: int("fromVersion").notNull(),
  toVersion: int("toVersion").notNull(),
  summaryAi: text("summaryAi"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SopChangelog = typeof sopChangelogs.$inferSelect;
export type InsertSopChangelog = typeof sopChangelogs.$inferInsert;

// ============================================================
// OCR System
// ============================================================

/**
 * OCR Logs — tracks all OCR scan attempts and results
 */
export const ocrLogs = mysqlTable("ocr_logs", {
  id: int("id").autoincrement().primaryKey(),
  mode: mysqlEnum("mode", ["recipe", "receipt", "label", "delivery_slip", "petty_cash", "sales_slip"]).notNull(),
  imageUrl: text("imageUrl"),
  resultJson: json("resultJson"),
  confidence: int("confidence"),
  success: int("success").default(1).notNull(),
  createdBy: int("createdBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type OcrLog = typeof ocrLogs.$inferSelect;
export type InsertOcrLog = typeof ocrLogs.$inferInsert;

// ============================================================
// AI Agent Layer — Cost & Performance
// ============================================================

/**
 * Menu Cost Cache — pre-calculated cost data per menu per branch
 */
export const menuCostCache = mysqlTable("menu_cost_cache", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("menuItemId").notNull(),
  branchId: int("branchId"),
  costPerCup: int("costPerCup").notNull(),
  foodCostPct: decimal("foodCostPct", { precision: 5, scale: 2 }),
  grossProfit: int("grossProfit"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});
export type MenuCostCache = typeof menuCostCache.$inferSelect;
export type InsertMenuCostCache = typeof menuCostCache.$inferInsert;

/**
 * Food Cost Alerts — triggered when food cost exceeds threshold
 */
export const foodCostAlerts = mysqlTable("food_cost_alerts", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(),
  date: timestamp("date").notNull(),
  foodCostPct: decimal("foodCostPct", { precision: 5, scale: 2 }).notNull(),
  thresholdPct: decimal("thresholdPct", { precision: 5, scale: 2 }).notNull(),
  aiAnalysis: text("aiAnalysis"),
  resolvedAt: timestamp("resolvedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type FoodCostAlert = typeof foodCostAlerts.$inferSelect;
export type InsertFoodCostAlert = typeof foodCostAlerts.$inferInsert;

/**
 * Branch Performance Scores — monthly KPI scoring per branch
 */
export const branchPerformanceScores = mysqlTable("branch_performance_scores", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(),
  month: int("month").notNull(),
  year: int("year").notNull(),
  totalScore: int("totalScore").notNull(),
  foodCostScore: int("foodCostScore"),
  trainingScore: int("trainingScore"),
  acknowledgmentScore: int("acknowledgmentScore"),
  wasteScore: int("wasteScore"),
  accuracyScore: int("accuracyScore"),
  rank: int("rank"),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});
export type BranchPerformanceScore = typeof branchPerformanceScores.$inferSelect;
export type InsertBranchPerformanceScore = typeof branchPerformanceScores.$inferInsert;

// ============================================================
// Ingredient Order System
// ============================================================

/**
 * Ingredient Orders — branch orders for ingredients from Hibi HQ
 */
export const ingredientOrders = mysqlTable("ingredient_orders", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(),
  status: mysqlEnum("status", ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"]).default("pending").notNull(),
  totalAmount: decimal("totalAmount", { precision: 10, scale: 2 }),
  notes: text("notes"),
  createdBy: int("createdBy"),
  confirmedBy: int("confirmedBy"),
  shippedAt: timestamp("shippedAt"),
  deliveredAt: timestamp("deliveredAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type IngredientOrder = typeof ingredientOrders.$inferSelect;
export type InsertIngredientOrder = typeof ingredientOrders.$inferInsert;

/**
 * Ingredient Order Items — line items within an order
 */
export const ingredientOrderItems = mysqlTable("ingredient_order_items", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  ingredientId: int("ingredientId").notNull(),
  qty: decimal("qty", { precision: 10, scale: 3 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  unitPrice: decimal("unitPrice", { precision: 10, scale: 2 }),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }),
  fulfilledQty: decimal("fulfilledQty", { precision: 10, scale: 3 }),
});
export type IngredientOrderItem = typeof ingredientOrderItems.$inferSelect;
export type InsertIngredientOrderItem = typeof ingredientOrderItems.$inferInsert;

/**
 * Ingredient Order Status Logs — tracks order status changes
 */
export const ingredientOrderStatusLogs = mysqlTable("ingredient_order_status_logs", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  fromStatus: varchar("fromStatus", { length: 32 }).notNull(),
  toStatus: varchar("toStatus", { length: 32 }).notNull(),
  changedBy: int("changedBy"),
  note: text("note"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IngredientOrderStatusLog = typeof ingredientOrderStatusLogs.$inferSelect;
export type InsertIngredientOrderStatusLog = typeof ingredientOrderStatusLogs.$inferInsert;

/**
 * Ingredient Price Catalog — Hibi official pricing for ingredients
 */
export const ingredientPriceCatalog = mysqlTable("ingredient_price_catalog", {
  id: int("id").autoincrement().primaryKey(),
  ingredientId: int("ingredientId").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  unit: varchar("unit", { length: 50 }),
  effectiveDate: timestamp("effectiveDate").defaultNow().notNull(),
  setBy: int("setBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IngredientPriceCatalogEntry = typeof ingredientPriceCatalog.$inferSelect;
export type InsertIngredientPriceCatalogEntry = typeof ingredientPriceCatalog.$inferInsert;

/**
 * Ingredient Order Issues — reported problems with delivered orders
 */
export const ingredientOrderIssues = mysqlTable("ingredient_order_issues", {
  id: int("id").autoincrement().primaryKey(),
  orderId: int("orderId").notNull(),
  type: mysqlEnum("type", ["missing", "damaged", "wrong_item", "other"]).default("other").notNull(),
  description: text("description"),
  imageUrls: json("imageUrls"),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IngredientOrderIssue = typeof ingredientOrderIssues.$inferSelect;
export type InsertIngredientOrderIssue = typeof ingredientOrderIssues.$inferInsert;

// ============================================================
// Franchise Onboarding
// ============================================================

/**
 * Franchise Agreements — legal contracts with franchise branches
 */
export const franchiseAgreements = mysqlTable("franchise_agreements", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(),
  packageType: mysqlEnum("packageType", ["starter", "growth", "enterprise"]).default("starter").notNull(),
  templateVersion: int("templateVersion").default(1).notNull(),
  signedAt: timestamp("signedAt"),
  expiresAt: timestamp("expiresAt"),
  ipAddress: varchar("ipAddress", { length: 45 }),
  contentHash: varchar("contentHash", { length: 64 }),
  signatureImageUrl: text("signatureImageUrl"),
  status: mysqlEnum("fa_status", ["active", "expired", "terminated"]).default("active").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FranchiseAgreement = typeof franchiseAgreements.$inferSelect;
export type InsertFranchiseAgreement = typeof franchiseAgreements.$inferInsert;

/**
 * Onboarding Progress — tracks franchise onboarding steps
 */
export const onboardingProgress = mysqlTable("onboarding_progress", {
  id: int("id").autoincrement().primaryKey(),
  branchId: int("branchId").notNull(),
  currentStep: int("currentStep").default(1).notNull(),
  packageType: mysqlEnum("ob_packageType", ["starter", "growth", "enterprise"]),
  businessInfo: json("businessInfo"),
  paymentConfirmed: int("paymentConfirmed").default(0).notNull(),
  autoSetupCompleted: int("autoSetupCompleted").default(0).notNull(),
  goLiveReady: int("goLiveReady").default(0).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type OnboardingProgressEntry = typeof onboardingProgress.$inferSelect;
export type InsertOnboardingProgressEntry = typeof onboardingProgress.$inferInsert;

// ─── SOP Core Tables (sop_menu_items, sop_ingredients, sop_prep_steps, sop_menu_branch_variants) ───
export const sopMenuItems = mysqlTable("sop_menu_items", {
  id: int("id").autoincrement().primaryKey(),
  code: varchar("code", { length: 32 }).notNull().unique(),
  nameEn: varchar("nameEn", { length: 255 }).notNull(),
  nameTh: varchar("nameTh", { length: 255 }).notNull(),
  description: text("description"),
  descriptionTh: text("descriptionTh"),
  matchaType: varchar("matchaType", { length: 255 }),
  priceShop: int("priceShop").notNull(),
  priceDelivery: int("priceDelivery").notNull(),
  cupSize: varchar("cupSize", { length: 32 }).default("16oz"),
  strawSize: mysqlEnum("sop_strawSize", ["small", "large"]).default("large").notNull(),
  syrupNote: text("syrupNote"),
  imageUrl: text("sop_imageUrl"),
  aiImageUrl: text("aiImageUrl"),
  status: mysqlEnum("sop_status", ["draft", "pending_review", "approved", "published", "archived"]).default("draft").notNull(),
  reviewedBy: int("reviewedBy"),
  reviewedAt: timestamp("sop_reviewedAt"),
  reviewComment: text("reviewComment"),
  currentVersion: int("currentVersion").default(1),
  approvedBy: varchar("approvedBy", { length: 255 }),
  approvedAt: bigint("approvedAt", { mode: "number" }),
  publishedAt: bigint("publishedAt", { mode: "number" }),
  createdBy: int("sop_createdBy"),
  createdAt: timestamp("sop_mi_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sop_mi_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SopMenuItem = typeof sopMenuItems.$inferSelect;
export type InsertSopMenuItem = typeof sopMenuItems.$inferInsert;

export const sopIngredients = mysqlTable("sop_ingredients", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("sop_ing_menuItemId").notNull(),
  name: varchar("sop_ing_name", { length: 255 }).notNull(),
  nameTh: varchar("sop_ing_nameTh", { length: 255 }).notNull(),
  amount: varchar("sop_ing_amount", { length: 64 }).notNull(),
  unit: varchar("sop_ing_unit", { length: 32 }).notNull(),
  sortOrder: int("sop_ing_sortOrder").default(0).notNull(),
  layerLabel: varchar("layerLabel", { length: 128 }),
  layerColor: varchar("layerColor", { length: 32 }),
  createdAt: timestamp("sop_ing_createdAt").defaultNow().notNull(),
});
export type SopIngredient = typeof sopIngredients.$inferSelect;
export type InsertSopIngredient = typeof sopIngredients.$inferInsert;

export const sopPrepSteps = mysqlTable("sop_prep_steps", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("sop_ps_menuItemId").notNull(),
  stepNumber: int("sop_ps_stepNumber").notNull(),
  instruction: text("sop_ps_instruction").notNull(),
  instructionTh: text("sop_ps_instructionTh").notNull(),
  aiEnhanced: text("sop_ps_aiEnhanced"),
  createdAt: timestamp("sop_ps_createdAt").defaultNow().notNull(),
});
export type SopPrepStep = typeof sopPrepSteps.$inferSelect;
export type InsertSopPrepStep = typeof sopPrepSteps.$inferInsert;

export const sopMenuBranchVariants = mysqlTable("sop_menu_branch_variants", {
  id: int("id").autoincrement().primaryKey(),
  menuItemId: int("sop_mbv_menuItemId").notNull(),
  branchId: int("sop_mbv_branchId").notNull(),
  teaVariant: varchar("teaVariant", { length: 255 }),
  teaVariantTh: varchar("teaVariantTh", { length: 255 }),
  priceShop: int("sop_mbv_priceShop"),
  priceDelivery: int("sop_mbv_priceDelivery"),
  overrides: json("sop_mbv_overrides"),
  note: text("sop_mbv_note"),
  createdBy: int("sop_mbv_createdBy"),
  createdAt: timestamp("sop_mbv_createdAt").defaultNow().notNull(),
  updatedAt: timestamp("sop_mbv_updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SopMenuBranchVariant = typeof sopMenuBranchVariants.$inferSelect;
export type InsertSopMenuBranchVariant = typeof sopMenuBranchVariants.$inferInsert;

// OAuth Social Login Links
export const userOauthLinks = mysqlTable("user_oauth_links", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").notNull(),
  provider: mysqlEnum("provider", ["google", "facebook", "line"]).notNull(),
  providerUserId: varchar("provider_user_id", { length: 255 }).notNull(),
  email: varchar("oauth_email", { length: 255 }),
  linkedAt: timestamp("linked_at").defaultNow().notNull(),
}, (table) => ({
  providerUserIdx: uniqueIndex("uq_provider_user").on(table.provider, table.providerUserId),
}));
export type UserOauthLink = typeof userOauthLinks.$inferSelect;
export type InsertUserOauthLink = typeof userOauthLinks.$inferInsert;
