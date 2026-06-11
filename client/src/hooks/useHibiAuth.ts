import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";
import type { AuthSession } from "@shared/types";

export function useHibiAuth() {
  const utils = trpc.useUtils();
  const meQuery = trpc.hibiAuth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = trpc.hibiAuth.logout.useMutation({
    onSuccess: () => {
      utils.hibiAuth.me.setData(undefined, null);
    },
  });

  const logout = useCallback(async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch {
      // ignore
    } finally {
      utils.hibiAuth.me.setData(undefined, null);
      await utils.hibiAuth.me.invalidate();
    }
  }, [logoutMutation, utils]);

  const session = useMemo((): AuthSession | null => {
    if (!meQuery.data) return null;
    return meQuery.data as AuthSession;
  }, [meQuery.data]);

  const staffRoles = ["branch_owner", "branch_manager", "branch_staff", "area_manager", "support_staff", "super_admin"];
  const adminRoles = ["branch_owner", "branch_manager", "area_manager", "super_admin"];
  const branchRoles = ["branch_owner", "branch_manager", "branch_staff"];

  const hasPermission = useCallback((perm: string) => {
    if (!session) return false;
    if (session.role === "super_admin") return true;
    if (session.role === "branch_owner") return true; // Branch owner has all permissions for their branch
    return session.permissions?.includes(perm) ?? false;
  }, [session]);

  return {
    session,
    loading: meQuery.isLoading || logoutMutation.isPending,
    error: meQuery.error ?? logoutMutation.error ?? null,
    isAuthenticated: Boolean(session),
    isCustomer: session?.role === "customer",
    isBranchOwner: session?.role === "branch_owner",
    isBranchManager: session?.role === "branch_manager",
    isBranchStaff: session?.role === "branch_staff",
    isBranchAdmin: branchRoles.includes(session?.role || ""), // backward compat: true for any branch role
    isAreaManager: session?.role === "area_manager",
    isSupportStaff: session?.role === "support_staff",
    isSuperAdmin: session?.role === "super_admin",
    isStaff: staffRoles.includes(session?.role || ""),
    isAdmin: adminRoles.includes(session?.role || ""),
    isBranchLevel: branchRoles.includes(session?.role || ""),
    hasPermission,
    canViewCustomers: hasPermission("view_customers") || hasPermission("manage_customers"),
    logout,
    refresh: () => meQuery.refetch(),
  };
}
