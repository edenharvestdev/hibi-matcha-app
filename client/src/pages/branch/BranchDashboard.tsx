import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import BranchSelector from "@/components/BranchSelector";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useBranchSelector } from "@/hooks/useBranchSelector";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import {
  ClipboardList, QrCode, CheckCircle2, AlertCircle, FileText, ChevronRight,
  Coins, Clock, AlertTriangle, Ticket, Coffee, List, Users, BarChart3,
  Wallet, Settings, Calculator, LayoutDashboard, Zap, Star, Gift, Receipt,
  PieChart, BookOpen, UserCog, Store
} from "lucide-react";
import { useEffect, useMemo } from "react";

export default function BranchDashboard() {
  const { session, loading, isStaff, isBranchOwner, isBranchManager, isAreaManager, hasPermission } = useHibiAuth();
  const { selectedBranchId, setSelectedBranchId, needsSelector, managedBranches } = useBranchSelector();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { enabled: !!session && isStaff });

  const { data: pendingIssues } = trpc.orderIssues.pendingCount.useQuery(undefined, {
    enabled: !!session && isBranchManager,
    refetchInterval: 60000,
  });

  const pendingCount = pendingIssues?.count ?? 0;

  // Stat cards
  const statCards = useMemo(() => {
    if (!session) return [];
    const cards: { icon: any; label: string; value: number; color: string; path?: string }[] = [];
    if (isBranchOwner || isBranchManager || hasPermission("approve_reviews")) {
      cards.push({ icon: AlertCircle, label: "รีวิวรออนุมัติ", value: stats?.totalPendingReviews ?? 0, color: "text-amber-600 bg-amber-50", path: "/branch/reviews" });
      cards.push({ icon: CheckCircle2, label: "อนุมัติวันนี้", value: stats?.totalApprovedToday ?? 0, color: "text-emerald-600 bg-emerald-50" });
    }
    cards.push({ icon: QrCode, label: "โค้ดที่ออก", value: stats?.totalCodesIssued ?? 0, color: "text-blue-600 bg-blue-50" });
    cards.push({ icon: FileText, label: "โค้ดที่ใช้แล้ว", value: stats?.totalCodesRedeemed ?? 0, color: "text-violet-600 bg-violet-50" });
    return cards;
  }, [stats, session, isBranchOwner, isBranchManager, hasPermission]);

  // ⚡ งานด่วน — Red/Orange theme
  const urgentActions = useMemo(() => {
    if (!session) return [];
    const items: { icon: any; label: string; path: string; iconColor: string; badge?: number }[] = [];
    if (isBranchOwner || isBranchManager || hasPermission("approve_reviews")) {
      items.push({ icon: Star, label: "รีวิวรออนุมัติ", path: "/branch/reviews", iconColor: "text-orange-600", badge: stats?.totalPendingReviews ?? 0 });
    }
    if (isBranchOwner || isBranchManager || hasPermission("manage_issues")) {
      items.push({ icon: AlertTriangle, label: "ปัญหาออเดอร์", path: "/branch/order-issues", iconColor: "text-red-600", badge: isBranchManager ? pendingCount : undefined });
    }
    if (isBranchOwner || isBranchManager || hasPermission("approve_points")) {
      items.push({ icon: Clock, label: "คำขอแต้ม Delivery", path: "/branch/point-claims", iconColor: "text-amber-600" });
    }
    return items;
  }, [session, stats, isBranchOwner, isBranchManager, hasPermission, pendingCount]);

  // 💜 แต้ม & โค้ด — Purple/Indigo theme
  const pointsAndCodesActions = useMemo(() => {
    if (!session) return [];
    const items: { icon: any; label: string; path: string; iconColor: string }[] = [];
    if (isBranchOwner || isBranchManager || hasPermission("approve_points")) {
      items.push({ icon: Coins, label: "ให้แต้มหน้าร้าน", path: "/branch/give-points", iconColor: "text-purple-600" });
    }
    items.push({ icon: QrCode, label: "ใช้โค้ด (Redeem)", path: "/branch/redeem", iconColor: "text-indigo-600" });
    items.push({ icon: Ticket, label: "Mark โค้ดใช้แล้ว", path: "/branch/code-redeem", iconColor: "text-fuchsia-600" });
    if (isBranchOwner || isBranchManager) {
      items.push({ icon: Gift, label: "สร้างโค้ดชดเชย", path: "/branch/create-claim", iconColor: "text-violet-600" });
    }
    return items;
  }, [session, isBranchOwner, isBranchManager, hasPermission]);

  // 💚 รายงาน & บัญชี — Green/Teal theme
  const reportsActions = useMemo(() => {
    if (!session) return [];
    const items: { icon: any; label: string; path: string; iconColor: string }[] = [];
    if (isBranchOwner || isBranchManager) {
      items.push({ icon: List, label: "รายการโค้ดทั้งหมด", path: "/branch/codes", iconColor: "text-teal-600" });
    }
    if (isBranchOwner || isBranchManager) {
      items.push({ icon: PieChart, label: "โค้ดค้าง", path: "/branch/pending-codes", iconColor: "text-emerald-600" });
    }
    if (isBranchOwner || isBranchManager || isAreaManager || hasPermission("manage_accounting")) {
      items.push({ icon: Calculator, label: "บัญชีรายวัน", path: "/branch/daily-sales", iconColor: "text-green-600" });
    }
    items.push({ icon: Wallet, label: "เงินสดย่อย", path: "/branch/petty-cash", iconColor: "text-cyan-600" });
    if (isAreaManager) {
      items.push({ icon: LayoutDashboard, label: "ภาพรวมทุกสาขา", path: "/branch/overview", iconColor: "text-sky-600" });
    }
    return items;
  }, [session, isBranchOwner, isBranchManager, isAreaManager, hasPermission]);

  // ⚙️ ตั้งค่า — Slate/Gray theme
  const settingsActions = useMemo(() => {
    if (!session) return [];
    const items: { icon: any; label: string; path: string; iconColor: string }[] = [];
    if (isBranchOwner || isBranchManager) {
      items.push({ icon: Coffee, label: "เมนูรีวิว", path: "/branch/menu-availability", iconColor: "text-slate-600" });
    }
    if (isBranchOwner || isAreaManager) {
      items.push({ icon: Settings, label: "ตั้งค่าเงินสดย่อย", path: "/branch/petty-cash/settings", iconColor: "text-gray-600" });
    }
    if (isBranchOwner || isAreaManager) {
      items.push({ icon: UserCog, label: "จัดการพนักงาน", path: "/branch/staff", iconColor: "text-zinc-600" });
    }
    return items;
  }, [session, isBranchOwner, isBranchManager, isAreaManager]);

  const currentBranchName = useMemo(() => {
    if (!session) return "";
    if (needsSelector && selectedBranchId && managedBranches.length) {
      return managedBranches.find(b => b.id === selectedBranchId)?.name ?? "";
    }
    return session.branchName ?? "";
  }, [session, needsSelector, selectedBranchId, managedBranches]);

  if (loading || !session) return null;

  return (
    <MobileLayout title={`แดชบอร์ด${currentBranchName ? ` - ${currentBranchName}` : ""}`}>
      <PremiumPageContent>
      <div className="space-y-5">
        {/* Branch Selector */}
        <BranchSelector
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          managedBranches={managedBranches}
          needsSelector={needsSelector}
        />

        {/* Welcome */}
        <div className="bg-gradient-to-br from-[#556B2F] to-[#8FA28B] rounded-2xl p-4 text-white">
          <p className="text-sm opacity-90">สวัสดี</p>
          <p className="font-bold text-lg">{session.name}</p>
          <p className="text-xs opacity-70 mt-0.5">
            {session.role === "branch_owner" ? "เจ้าของสาขา" : session.role === "branch_manager" ? "ผู้จัดการสาขา" : session.role === "branch_staff" ? "พนักงานสาขา" : session.role === "area_manager" ? "เจ้าของแฟรนไชส์" : "Super Admin"}{currentBranchName ? ` • ${currentBranchName}` : ""}
          </p>
        </div>

        {/* Stats Grid */}
        {statCards.length > 0 && (
          <div className="grid grid-cols-2 gap-2.5">
            {statCards.map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm cursor-pointer bg-white/70 backdrop-blur-sm border-[#e8ede5]/60 hover:shadow-md transition-all" onClick={() => stat.path && setLocation(stat.path)}>
                <CardContent className="p-3">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${stat.color} mb-1.5`}>
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold">{stat.value}</p>
                  <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* ⚡ งานด่วน — Red/Orange accent with warm background */}
        {urgentActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <Zap className="h-3.5 w-3.5 text-red-500" />
              <h3 className="font-bold text-xs text-red-600 uppercase tracking-wide">งานด่วน</h3>
            </div>
            <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-2.5 border border-red-100/60">
              <div className="flex gap-2 overflow-x-auto">
                {urgentActions.map((action) => (
                  <button
                    key={action.path}
                    onClick={() => setLocation(action.path)}
                    className="flex-shrink-0 flex items-center gap-2 px-3 py-2.5 rounded-lg bg-white/80 backdrop-blur-sm shadow-sm border border-red-100/50 active:scale-[0.96] transition-all hover:shadow-md"
                  >
                    <div className="relative">
                      <action.icon className={`h-5 w-5 ${action.iconColor}`} />
                      {action.badge !== undefined && action.badge > 0 && (
                        <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold shadow-sm">
                          {action.badge > 99 ? "99+" : action.badge}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-semibold whitespace-nowrap text-gray-700">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 💜 แต้ม & โค้ด — Purple/Indigo theme */}
        {pointsAndCodesActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <Coins className="h-3.5 w-3.5 text-purple-500" />
              <h3 className="font-bold text-xs text-purple-600 uppercase tracking-wide">แต้ม & โค้ด</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {pointsAndCodesActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => setLocation(action.path)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-purple-50/80 to-indigo-50/60 border border-purple-100/60 shadow-sm active:scale-[0.96] transition-all hover:shadow-md text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <action.icon className={`h-4.5 w-4.5 ${action.iconColor}`} />
                  </div>
                  <span className="text-xs font-medium leading-tight text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 💚 รายงาน & บัญชี — Green/Teal theme */}
        {reportsActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <BarChart3 className="h-3.5 w-3.5 text-emerald-500" />
              <h3 className="font-bold text-xs text-emerald-600 uppercase tracking-wide">รายงาน & บัญชี</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {reportsActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => setLocation(action.path)}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-gradient-to-br from-emerald-50/80 to-teal-50/60 border border-emerald-100/60 shadow-sm active:scale-[0.96] transition-all hover:shadow-md text-left"
                >
                  <div className="h-9 w-9 rounded-lg bg-white/70 flex items-center justify-center flex-shrink-0 shadow-sm">
                    <action.icon className={`h-4.5 w-4.5 ${action.iconColor}`} />
                  </div>
                  <span className="text-xs font-medium leading-tight text-gray-700">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ⚙️ ตั้งค่า — Slate/Neutral theme */}
        {settingsActions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 px-1">
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wide">ตั้งค่า</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {settingsActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => setLocation(action.path)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-slate-50/80 border border-slate-100/60 shadow-sm active:scale-[0.96] transition-all hover:shadow-md"
                >
                  <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
                    <action.icon className={`h-4.5 w-4.5 ${action.iconColor}`} />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight text-slate-600">{action.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      </PremiumPageContent>
    </MobileLayout>
  );
}
