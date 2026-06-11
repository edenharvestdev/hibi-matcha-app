import { useState, useEffect, useMemo } from "react";
import { useHibiAuth } from "./useHibiAuth";
import { trpc } from "@/lib/trpc";

/**
 * Hook for area_manager / super_admin to select which branch to operate on.
 * For other roles, returns undefined branchId (backend uses their own branch).
 * Supports reading initial branchId from URL query params (?branchId=X).
 */
export function useBranchSelector() {
  const { session, isAreaManager, isSuperAdmin } = useHibiAuth();

  // Read branchId from URL query params on mount
  const urlBranchId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("branchId");
    return id ? Number(id) : null;
  }, []);

  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(urlBranchId);

  // For super_admin, fetch all branches
  const { data: allBranches } = trpc.branches.list.useQuery(undefined, {
    enabled: !!session && isSuperAdmin,
  });

  // Initialize with URL param, first managed/available branch
  useEffect(() => {
    if (selectedBranchId) return; // Already set (from URL or user selection)
    if (session && isAreaManager && session.managedBranches?.length) {
      setSelectedBranchId(session.managedBranches[0].id);
    }
    if (session && isSuperAdmin && allBranches?.length) {
      setSelectedBranchId(allBranches[0].id);
    }
  }, [session, isAreaManager, isSuperAdmin, selectedBranchId, allBranches]);

  const needsSelector = isAreaManager || isSuperAdmin;

  const branchOptions = useMemo(() => {
    if (isSuperAdmin && allBranches) {
      return allBranches.map(b => ({ id: b.id, name: b.name }));
    }
    return session?.managedBranches ?? [];
  }, [isSuperAdmin, allBranches, session]);

  const currentBranchName = useMemo(() => {
    if (needsSelector && selectedBranchId && branchOptions.length) {
      return branchOptions.find(b => b.id === selectedBranchId)?.name ?? "";
    }
    return session?.branchName ?? "";
  }, [needsSelector, selectedBranchId, branchOptions, session]);

  // The branchId to pass to tRPC queries (undefined for non-selector roles)
  const branchIdParam = needsSelector ? selectedBranchId ?? undefined : undefined;

  return {
    selectedBranchId,
    setSelectedBranchId,
    currentBranchName,
    branchIdParam,
    isAreaManager,
    isSuperAdmin,
    needsSelector,
    managedBranches: branchOptions,
  };
}
