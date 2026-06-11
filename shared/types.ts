/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Hibi Matcha App Types
export type CustomerRole = "customer";
export type StaffRole = "branch_owner" | "branch_manager" | "branch_staff" | "area_manager" | "support_staff" | "super_admin";
export type AppRole = CustomerRole | StaffRole;

export type DeliveryApp = "shopee" | "lineman" | "grab" | "gpos";
export type ReviewStatus = "pending" | "approved" | "rejected";
export type CodeType = "RV" | "CL";
export type CodeStatus = "issued" | "redeemed" | "expired" | "cancelled";

export interface AuthSession {
  type: "customer" | "staff";
  id: number;
  phone: string;
  name: string;
  email: string | null;
  role: AppRole;
  branchId?: number | null;
  branchName?: string | null;
  permissions?: string[];
  managedBranchIds?: number[];
  managedBranches?: { id: number; name: string }[];
}

export interface BranchInfo {
  id: number;
  name: string;
  province: string | null;
  isActive: boolean;
}

export interface ReviewRequestInfo {
  id: number;
  customerId: number;
  customerName?: string;
  customerPhone?: string;
  branchId: number;
  branchName?: string;
  deliveryApp: DeliveryApp;
  orderId: string;
  imageUrl: string | null;
  status: ReviewStatus;
  reviewedBy: number | null;
  rejectionReason: string | null;
  createdAt: Date;
}

export interface CodeInfo {
  id: number;
  code: string;
  type: CodeType;
  branchId: number;
  branchName?: string;
  customerId: number | null;
  email: string;
  status: CodeStatus;
  issuedAt: Date;
  expiresAt: Date;
  redeemedAt: Date | null;
}

export interface AuditLogInfo {
  id: number;
  actorType: "customer" | "staff" | "system";
  actorId: number | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: number | null;
  details: string | null;
  createdAt: Date;
}

export interface DashboardStats {
  totalPendingReviews: number;
  totalApprovedToday: number;
  totalCodesIssued: number;
  totalCodesRedeemed: number;
  totalCodesExpired: number;
}
