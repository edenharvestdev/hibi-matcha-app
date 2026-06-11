import { useImpersonate } from "@/contexts/ImpersonateContext";
import { trpc } from "@/lib/trpc";
import { X, Eye } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  branch_owner: "เจ้าของสาขา",
  branch_manager: "ผู้จัดการสาขา",
  branch_staff: "พนักงานสาขา",
  area_manager: "เจ้าของแฟรนไชส์",
  support_staff: "เจ้าหน้าที่ซัพพอร์ต",
  super_admin: "Super Admin",
  customer: "ลูกค้า",
};

export default function ImpersonateBar() {
  const { state, stopImpersonating } = useImpersonate();
  const utils = trpc.useUtils();

  if (!state.active) return null;

  const handleStop = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    stopImpersonating();
    // Invalidate all queries to refetch with real session
    utils.invalidate();
    // Use setTimeout to ensure state is cleared before navigation
    setTimeout(() => {
      window.location.href = "/admin/impersonate";
    }, 100);
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 flex justify-center pointer-events-none"
      style={{
        zIndex: 99999,
        paddingTop: "max(env(safe-area-inset-top, 0px), 4px)",
      }}
    >
      <div className="inline-flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full shadow-lg text-xs pointer-events-auto">
        <Eye className="h-3.5 w-3.5 shrink-0 animate-pulse" />
        <span className="font-medium">
          ทดสอบ: <strong>{state.targetName}</strong>
        </span>
        <span className="bg-red-800/60 px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0">
          {ROLE_LABELS[state.targetRole || ""] || state.targetRole}
        </span>
        <button
          type="button"
          className="flex items-center justify-center h-6 w-6 rounded-full bg-white/20 active:bg-white/40 text-white shrink-0 touch-manipulation ml-0.5"
          onClick={handleStop}
          onTouchEnd={handleStop}
          aria-label="ออกจากการทดสอบ"
          style={{ WebkitTapHighlightColor: "rgba(255,255,255,0.3)" }}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
