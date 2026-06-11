import AdminPageWrapper from "@/components/AdminPageWrapper";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertTriangle, CheckCircle2, Clock, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { useMemo } from "react";
import { formatDate } from "@/lib/dateUtils";

const CATEGORY_LABELS: Record<string, string> = {
  wrong_order: "ออเดอร์ผิด",
  missing_item: "ของขาด/ไม่ครบ",
  quality: "คุณภาพไม่ดี",
  late_delivery: "จัดส่งล่าช้า",
  damaged: "สินค้าเสียหาย",
  other: "อื่นๆ",
};

const CATEGORY_COLORS: Record<string, string> = {
  wrong_order: "#ef4444",
  missing_item: "#f97316",
  quality: "#eab308",
  late_delivery: "#3b82f6",
  damaged: "#8b5cf6",
  other: "#6b7280",
};

const STATUS_LABELS: Record<string, string> = {
  open: "รอตรวจสอบ",
  acknowledged: "รับทราบแล้ว",
  in_progress: "กำลังดำเนินการ",
  resolved: "แก้ไขแล้ว",
  escalated: "ส่งต่อ",
  closed: "ปิดแล้ว",
};

const STATUS_COLORS: Record<string, string> = {
  open: "#f59e0b",
  acknowledged: "#3b82f6",
  in_progress: "#6366f1",
  resolved: "#22c55e",
  escalated: "#f97316",
  closed: "#9ca3af",
};

export default function IssueDashboard() {
  const { data: stats, isLoading } = trpc.orderIssues.stats.useQuery();

  const slaResponseRate = useMemo(() => {
    if (!stats || stats.sla.totalResponse === 0) return 0;
    return Math.round((stats.sla.metResponse / stats.sla.totalResponse) * 100);
  }, [stats]);

  const slaResolutionRate = useMemo(() => {
    if (!stats || stats.sla.totalResolution === 0) return 0;
    return Math.round((stats.sla.metResolution / stats.sla.totalResolution) * 100);
  }, [stats]);

  const maxCategoryCount = useMemo(() => {
    if (!stats) return 1;
    return Math.max(...stats.byCategory.map(c => c.count), 1);
  }, [stats]);

  const maxBranchCount = useMemo(() => {
    if (!stats) return 1;
    return Math.max(...stats.byBranch.map(b => b.count), 1);
  }, [stats]);

  const maxTrendCount = useMemo(() => {
    if (!stats) return 1;
    return Math.max(...stats.recentTrend.map(t => t.count), 1);
  }, [stats]);

  if (isLoading) {
    return (
      <AdminPageWrapper title="Dashboard ปัญหา" backPath="/admin" loading={isLoading}>
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </AdminPageWrapper>
    );
  }

  if (!stats) {
    return (
      <AdminPageWrapper title="Dashboard ปัญหา" backPath="/admin">
        <div className="text-center py-12 text-muted-foreground text-sm">
          ไม่สามารถโหลดข้อมูลได้
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="Dashboard ปัญหา" backPath="/admin">
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-bold">Dashboard ปัญหาออเดอร์</h2>
          <p className="text-xs text-muted-foreground">สรุปภาพรวมปัญหาและ SLA compliance</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-5 w-5 text-primary mx-auto mb-1" />
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-[10px] text-muted-foreground">ปัญหาทั้งหมด</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">
                {stats.byStatus.find(s => s.status === "open")?.count || 0}
              </p>
              <p className="text-[10px] text-muted-foreground">รอตรวจสอบ</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">
                {(stats.byStatus.find(s => s.status === "resolved")?.count || 0) +
                 (stats.byStatus.find(s => s.status === "closed")?.count || 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">แก้ไข/ปิดแล้ว</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 text-center">
              <Clock className="h-5 w-5 text-indigo-500 mx-auto mb-1" />
              <p className="text-2xl font-bold">
                {(stats.byStatus.find(s => s.status === "acknowledged")?.count || 0) +
                 (stats.byStatus.find(s => s.status === "in_progress")?.count || 0)}
              </p>
              <p className="text-[10px] text-muted-foreground">กำลังดำเนินการ</p>
            </CardContent>
          </Card>
        </div>

        {/* SLA Compliance */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">SLA Compliance</h3>
            </div>
            <div className="space-y-4">
              {/* Response SLA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">ตอบรับภายใน 24 ชม.</span>
                  <span className={`text-sm font-bold ${slaResponseRate >= 80 ? "text-green-600" : slaResponseRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                    {slaResponseRate}%
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${slaResponseRate >= 80 ? "bg-green-500" : slaResponseRate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${slaResponseRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {stats.sla.metResponse}/{stats.sla.totalResponse} รายการ
                </p>
              </div>
              {/* Resolution SLA */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-muted-foreground">แก้ไขภายใน 48 ชม.</span>
                  <span className={`text-sm font-bold ${slaResolutionRate >= 80 ? "text-green-600" : slaResolutionRate >= 50 ? "text-amber-600" : "text-red-600"}`}>
                    {slaResolutionRate}%
                  </span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${slaResolutionRate >= 80 ? "bg-green-500" : slaResolutionRate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${slaResolutionRate}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  {stats.sla.metResolution}/{stats.sla.totalResolution} รายการ
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* By Category - horizontal bar chart */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <PieChart className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">แยกตามประเภทปัญหา</h3>
            </div>
            {stats.byCategory.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-2.5">
                {stats.byCategory.map((item) => (
                  <div key={item.category}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">{CATEGORY_LABELS[item.category] || item.category}</span>
                      <span className="text-xs font-medium">{item.count}</span>
                    </div>
                    <div className="h-5 bg-muted rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md transition-all duration-500 flex items-center pl-2"
                        style={{
                          width: `${Math.max((item.count / maxCategoryCount) * 100, 8)}%`,
                          backgroundColor: CATEGORY_COLORS[item.category] || "#6b7280",
                        }}
                      >
                        <span className="text-[10px] text-white font-medium">
                          {Math.round((item.count / stats.total) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Branch - horizontal bar chart */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold">แยกตามสาขา</h3>
            </div>
            {stats.byBranch.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">ยังไม่มีข้อมูล</p>
            ) : (
              <div className="space-y-2.5">
                {stats.byBranch.map((item) => (
                  <div key={item.branchId}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs">{item.branchName}</span>
                      <span className="text-xs font-medium">{item.count} รายการ</span>
                    </div>
                    <div className="h-5 bg-muted rounded-md overflow-hidden">
                      <div
                        className="h-full rounded-md bg-primary/80 transition-all duration-500"
                        style={{ width: `${Math.max((item.count / maxBranchCount) * 100, 8)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">สถานะปัจจุบัน</h3>
            <div className="flex flex-wrap gap-2">
              {stats.byStatus.map((item) => (
                <div
                  key={item.status}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{
                    backgroundColor: `${STATUS_COLORS[item.status] || "#6b7280"}15`,
                    color: STATUS_COLORS[item.status] || "#6b7280",
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[item.status] || "#6b7280" }}
                  />
                  {STATUS_LABELS[item.status] || item.status}: {item.count}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent trend - mini bar chart */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">แนวโน้ม 7 วันล่าสุด</h3>
            {stats.recentTrend.every(t => t.count === 0) ? (
              <p className="text-xs text-muted-foreground text-center py-4">ไม่มีปัญหาใน 7 วันล่าสุด</p>
            ) : (
              <div className="flex items-end gap-1 h-24">
                {stats.recentTrend.map((item) => {
                  const height = maxTrendCount > 0 ? Math.max((item.count / maxTrendCount) * 100, 4) : 4;
                  const dayLabel = formatDate(item.date + "T00:00:00", { shortYear: true });
                  return (
                    <div key={item.date} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {item.count > 0 ? item.count : ""}
                      </span>
                      <div
                        className="w-full rounded-t-md bg-primary/70 transition-all duration-500"
                        style={{ height: `${height}%`, minHeight: item.count > 0 ? "8px" : "2px" }}
                      />
                      <span className="text-[9px] text-muted-foreground">{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminPageWrapper>
  );
}
