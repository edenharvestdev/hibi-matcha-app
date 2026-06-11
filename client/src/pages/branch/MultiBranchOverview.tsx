import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Building2, Wallet, TrendingUp, AlertTriangle, ClipboardList,
  ChevronRight, Filter, Loader2, MapPin, Download
} from "lucide-react";
import DateRangePickerModal from "@/components/common/DateRangePickerModal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useEffect, useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/useMobile";

export default function MultiBranchOverview() {
  const isMobile = useIsMobile();
  const { session, loading, isAreaManager, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [selectedZone, setSelectedZone] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAreaManager && !isSuperAdmin) setLocation("/branch");
  }, [loading, session, isAreaManager, isSuperAdmin, setLocation]);

  const queryInput = useMemo(() => ({
    zoneId: selectedZone !== "all" ? Number(selectedZone) : undefined,
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }), [selectedZone, dateFrom, dateTo]);

  const { data: summary, isLoading } = trpc.multiBranchOverview.summary.useQuery(
    queryInput,
    { enabled: !!session && (isAreaManager || isSuperAdmin) }
  );

  if (loading || !session) return null;

  const totalSalesToday = summary?.salesToday?.reduce((sum, s) => sum + Number(s.totalAmount || 0), 0) ?? 0;
  const totalPettyCash = summary?.pettyCashBalances?.reduce((sum, b) => sum + Number(b.balance || 0), 0) ?? 0;
  const totalPendingReviews = summary?.pendingReviews?.reduce((sum, r) => sum + Number(r.pendingCount || 0), 0) ?? 0;

  const handleExport = () => {
    if (!summary?.branches?.length) {
      toast.error("ไม่มีข้อมูลสำหรับ export");
      return;
    }
    try {
      const headers = ["สาขา", "สถานะ", "ยอดขาย (บาท)", "เงินสด (บาท)", "โอน (บาท)", "EDC (บาท)", "Delivery (บาท)", "เงินสดย่อย (บาท)", "รีวิวค้าง"];
      const rows = summary.branches.map((branch: any) => {
        const branchSales = summary.salesToday?.find((s: any) => s.branchId === branch.id);
        const branchPettyCash = summary.pettyCashBalances?.find((b: any) => b.branchId === branch.id);
        const branchPendingReviews = summary.pendingReviews?.find((r: any) => r.branchId === branch.id);
        return [
          branch.name,
          branch.isActive ? "เปิด" : "ปิด",
          branchSales ? Number(branchSales.totalAmount) : 0,
          branchSales ? Number(branchSales.cashAmount || 0) : 0,
          branchSales ? Number(branchSales.transferAmount || 0) : 0,
          branchSales ? Number(branchSales.edcAmount || 0) : 0,
          branchSales ? Number(branchSales.deliveryAmount || 0) : 0,
          branchPettyCash ? Number(branchPettyCash.balance) : 0,
          branchPendingReviews ? Number(branchPendingReviews.pendingCount) : 0,
        ];
      });
      // Add totals row
      rows.push([
        "รวมทั้งหมด",
        "",
        totalSalesToday,
        summary.salesToday?.reduce((s: number, r: any) => s + Number(r.cashAmount || 0), 0) ?? 0,
        summary.salesToday?.reduce((s: number, r: any) => s + Number(r.transferAmount || 0), 0) ?? 0,
        summary.salesToday?.reduce((s: number, r: any) => s + Number(r.edcAmount || 0), 0) ?? 0,
        summary.salesToday?.reduce((s: number, r: any) => s + Number(r.deliveryAmount || 0), 0) ?? 0,
        totalPettyCash,
        totalPendingReviews,
      ]);
      const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
      const BOM = "\uFEFF";
      const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const dateStr = dateFrom && dateTo ? `${dateFrom}_${dateTo}` : new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `branch-overview_${dateStr}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Export สำเร็จ!");
    } catch (err) {
      toast.error("Export ไม่สำเร็จ");
    }
  };

  return (
    <MobileLayout title="ภาพรวมทุกสาขา" showBack backPath="/branch">
      <PremiumPageContent>
        {/* Date Range + Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <DateRangePickerModal
            dateFrom={dateFrom}
            dateTo={dateTo}
            onApply={(f, t) => { setDateFrom(f); setDateTo(t); }}
            onClear={() => { setDateFrom(""); setDateTo(""); }}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1.5"
            onClick={handleExport}
            disabled={isLoading || !summary?.branches?.length}
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
          {dateFrom && dateTo && (
            <span className="text-[10px] text-muted-foreground">
              {dateFrom} – {dateTo}
            </span>
          )}
        </div>

        {/* Zone Filter */}
        {summary?.zones && summary.zones.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">กรองตามเขตบริการ</span>
            </div>
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="เลือกเขตบริการ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกเขตบริการ</SelectItem>
                {summary.zones.map((z: any) => (
                  <SelectItem key={z.id} value={String(z.id)}>{z.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 mb-2">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{summary?.branches?.length ?? 0}</p>
                  <p className="text-xs text-muted-foreground">สาขาทั้งหมด</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-green-50 text-green-600 mb-2">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{totalSalesToday.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">ยอดขายวันนี้ (บาท)</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-cyan-50 text-cyan-600 mb-2">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{totalPettyCash.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">เงินสดย่อยรวม (บาท)</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600 mb-2">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <p className="text-2xl font-bold">{summary?.orderIssues?.open ?? 0}</p>
                  <p className="text-xs text-muted-foreground">ปัญหาออเดอร์ (เปิด)</p>
                </CardContent>
              </Card>
            </div>

            {/* Branch Details */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground px-1">รายละเอียดแต่ละสาขา</h3>
              {summary?.branches?.map((branch: any) => {
                const branchSales = summary.salesToday?.find((s: any) => s.branchId === branch.id);
                const branchPettyCash = summary.pettyCashBalances?.find((b: any) => b.branchId === branch.id);
                const branchPendingReviews = summary.pendingReviews?.find((r: any) => r.branchId === branch.id);
                const zoneName = summary.zones?.find((z: any) => z.id === branch.zoneId)?.name;

                return (
                  <Card key={branch.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-sm">{branch.name}</p>
                          {zoneName && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <MapPin className="h-3 w-3" />
                              {zoneName}
                            </p>
                          )}
                        </div>
                        <Badge variant={branch.isActive ? "default" : "secondary"} className="text-[10px]">
                          {branch.isActive ? "เปิด" : "ปิด"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-green-50 rounded-lg p-2 cursor-pointer active:scale-95 transition-transform" onClick={() => setLocation(`/branch/daily-sales?branchId=${branch.id}`)}>
                          <p className="text-xs text-muted-foreground">ยอดขายวันนี้</p>
                          <p className="font-semibold text-sm text-green-700">
                            {branchSales ? Number(branchSales.totalAmount).toLocaleString() : "0"}
                          </p>
                        </div>
                        <div className="bg-cyan-50 rounded-lg p-2 cursor-pointer active:scale-95 transition-transform" onClick={() => setLocation(`/branch/petty-cash?branchId=${branch.id}`)}>
                          <p className="text-xs text-muted-foreground">เงินสดย่อย</p>
                          <p className="font-semibold text-sm text-cyan-700">
                            {branchPettyCash ? Number(branchPettyCash.balance).toLocaleString() : "0"}
                          </p>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-2 cursor-pointer active:scale-95 transition-transform" onClick={() => setLocation(`/branch/reviews?branchId=${branch.id}`)}>
                          <p className="text-xs text-muted-foreground">รีวิวค้าง</p>
                          <p className="font-semibold text-sm text-amber-700">
                            {branchPendingReviews ? Number(branchPendingReviews.pendingCount) : 0}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px] text-primary text-center mt-2 font-medium">กดที่ตัวเลขเพื่อดูรายละเอียด</p>
                    </CardContent>
                  </Card>
                );
              })}
              {(!summary?.branches || summary.branches.length === 0) && (
                <div className="text-center py-8">
                  <LayoutDashboard className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">ไม่มีสาขาในเขตที่เลือก</p>
                </div>
              )}
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground px-1">ดูรายละเอียดเพิ่มเติม</h3>
              <Card className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setLocation("/branch/order-issues")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-50 text-red-600">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">ปัญหาออเดอร์ทั้งหมด</p>
                      <p className="text-xs text-muted-foreground">
                        เปิด {summary?.orderIssues?.open ?? 0} | รับทราบ {summary?.orderIssues?.acknowledged ?? 0} | รวม {summary?.orderIssues?.total ?? 0}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm cursor-pointer active:scale-[0.98] transition-transform" onClick={() => setLocation("/branch/reviews")}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">รีวิวรออนุมัติ</p>
                      <p className="text-xs text-muted-foreground">{totalPendingReviews} รายการ</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </PremiumPageContent>
    </MobileLayout>
  );
}
