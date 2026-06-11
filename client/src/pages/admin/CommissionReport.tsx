import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Receipt, Loader2, CheckCircle2, Clock, DollarSign, Users, TrendingUp, Download, Info } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/useMobile";
import { toast } from "sonner";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: "รอตรวจสอบ", color: "bg-yellow-100 text-yellow-700" },
  approved: { label: "อนุมัติแล้ว", color: "bg-blue-100 text-blue-700" },
  paid: { label: "จ่ายแล้ว", color: "bg-green-100 text-green-700" },
};

export default function CommissionReport() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const isMobile = useIsMobile();
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [filterBranchId, setFilterBranchId] = useState<string>("all");
  const [filterFranchiseOwnerId, setFilterFranchiseOwnerId] = useState<string>("all");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) { toast.error("ไม่มีสิทธิ์เข้าถึง"); setLocation("/admin"); }
  }, [loading, session, isSuperAdmin, setLocation]);

  const utils = trpc.useUtils();
  const { data: branches } = trpc.branches.listAll.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const { data: franchiseOwners } = trpc.franchiseOwners.list.useQuery(undefined, { enabled: !!session && isSuperAdmin });

  const { data: reportData, isLoading } = trpc.commissionReports.monthly.useQuery(
    {
      month,
      branchId: filterBranchId !== "all" ? Number(filterBranchId) : undefined,
      franchiseOwnerId: filterFranchiseOwnerId !== "all" ? Number(filterFranchiseOwnerId) : undefined,
    },
    { enabled: !!session && isSuperAdmin }
  );

  const updateStatusMutation = trpc.commissionReports.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตสถานะสำเร็จ");
      utils.commissionReports.monthly.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const bulkUpdateMutation = trpc.commissionReports.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(`อัปเดต ${data.count} รายการสำเร็จ`);
      utils.commissionReports.monthly.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const summary = useMemo(() => {
    if (!reportData?.length) return { totalSales: 0, totalCommission: 0, staffCount: 0, pendingCount: 0 };
    return {
      totalSales: reportData.reduce((sum: number, r: any) => sum + (r.salesAmount || 0), 0),
      totalCommission: reportData.reduce((sum: number, r: any) => sum + (r.commission || 0), 0),
      staffCount: new Set(reportData.map((r: any) => r.staffId)).size,
      pendingCount: reportData.filter((r: any) => r.status === "pending").length,
    };
  }, [reportData]);

  const handleBulkApprove = () => {
    const pendingIds = reportData?.filter((r: any) => r.status === "pending").map((r: any) => r.id) || [];
    if (pendingIds.length === 0) { toast.info("ไม่มีรายการรอตรวจสอบ"); return; }
    bulkUpdateMutation.mutate({ ids: pendingIds, status: "approved" });
  };

  const handleBulkPaid = () => {
    const approvedIds = reportData?.filter((r: any) => r.status === "approved").map((r: any) => r.id) || [];
    if (approvedIds.length === 0) { toast.info("ไม่มีรายการที่อนุมัติแล้ว"); return; }
    bulkUpdateMutation.mutate({ ids: approvedIds, status: "paid" });
  };

  const handleExportExcel = () => {
    if (!reportData?.length) { toast.info("ไม่มีข้อมูลสำหรับ export"); return; }
    // Build CSV content with BOM for Thai encoding
    const BOM = "\uFEFF";
    const headers = ["พนักงาน", "สาขา", "เดือน", "ยอดขาย (บาท)", "คอมมิชชั่น (บาท)", "สถานะ"];
    const rows = reportData.map((r: any) => [
      r.staffName || `พนักงาน #${r.staffId}`,
      r.branchName || r.branchId,
      r.month || month,
      ((r.salesAmount || 0) / 100).toFixed(2),
      ((r.commission || 0) / 100).toFixed(2),
      r.status === "paid" ? "จ่ายแล้ว" : r.status === "approved" ? "อนุมัติแล้ว" : "รอตรวจสอบ",
    ]);
    // Add summary row
    rows.push([]);
    rows.push(["รวม", "", month, (summary.totalSales / 100).toFixed(2), (summary.totalCommission / 100).toFixed(2), `${summary.staffCount} คน`]);
    const csvContent = BOM + [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commission-report-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("ดาวน์โหลดรายงานสำเร็จ");
  };

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="รายงานคอมมิชชั่น" backPath="/admin" loading={isLoading}>
      <div className="space-y-4">
        {/* Filters */}
        <div className="space-y-2">
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
          <div className="flex gap-2">
            <Select value={filterBranchId} onValueChange={setFilterBranchId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="ทุกสาขา" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสาขา</SelectItem>
                {branches?.map((b: any) => (
                  <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterFranchiseOwnerId} onValueChange={setFilterFranchiseOwnerId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="ทุกเจ้าของ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกเจ้าของ</SelectItem>
                {franchiseOwners?.map((o: any) => (
                  <SelectItem key={o.id} value={String(o.id)}>{o.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <DollarSign className="h-5 w-5 mx-auto text-primary mb-1" />
              <p className="text-lg font-bold text-primary">฿{(summary.totalSales / 100).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">ยอดขายรวม</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <TrendingUp className="h-5 w-5 mx-auto text-amber-500 mb-1" />
              <p className="text-lg font-bold text-amber-600">฿{(summary.totalCommission / 100).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">คอมมิชชั่นรวม</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 mx-auto text-blue-500 mb-1" />
              <p className="text-lg font-bold text-blue-600">{summary.staffCount}</p>
              <p className="text-[10px] text-muted-foreground">พนักงาน</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <Clock className="h-5 w-5 mx-auto text-yellow-500 mb-1" />
              <p className="text-lg font-bold text-yellow-600">{summary.pendingCount}</p>
              <p className="text-[10px] text-muted-foreground">รอตรวจสอบ</p>
            </CardContent>
          </Card>
        </div>

        {/* Bulk actions */}
        <div className={isMobile ? "flex flex-col gap-2" : "flex gap-2"}>
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            className={isMobile ? "w-full h-11 text-sm" : "flex-1 text-xs"}
            onClick={handleBulkApprove}
            disabled={bulkUpdateMutation.isPending}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            อนุมัติทั้งหมด
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "default" : "sm"}
            className={isMobile ? "w-full h-11 text-sm" : "flex-1 text-xs"}
            onClick={handleBulkPaid}
            disabled={bulkUpdateMutation.isPending}
          >
            <DollarSign className="h-4 w-4 mr-2" />
            จ่ายแล้วทั้งหมด
          </Button>
        </div>

        {/* Export */}
        <Button
          variant="outline"
          size={isMobile ? "default" : "sm"}
          className={isMobile ? "w-full h-12 text-sm" : "w-full text-xs"}
          onClick={handleExportExcel}
          disabled={!reportData?.length}
        >
          <Download className="h-4 w-4 mr-2" />
          ดาวน์โหลดรายงาน (CSV/Excel)
        </Button>

        {/* Commission records */}
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            กำลังโหลด...
          </div>
        ) : !reportData?.length ? (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ไม่มีข้อมูลคอมมิชชั่นในเดือนนี้</p>
          </div>
        ) : (
          reportData.map((record: any) => {
            const status = statusLabels[record.status] || statusLabels.pending;
            return (
              <Card key={record.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{record.staffName || `พนักงาน #${record.staffId}`}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        สาขา: {record.branchName || record.branchId}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <p className="text-xs text-muted-foreground">
                          ยอดขาย: ฿{((record.salesAmount || 0) / 100).toLocaleString()}
                        </p>
                        {record.commissionType && (
                          <Badge variant="outline" className="text-[9px]">
                            {record.commissionType === "percent"
                              ? `${((record.commissionValue || 0) / 100).toFixed(2)}%`
                              : `฿${((record.commissionValue || 0) / 100).toFixed(0)}/ชิ้น`}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-amber-600">฿{((record.commission || 0) / 100).toLocaleString()}</p>
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium rounded-full mt-1 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                  {/* Status actions */}
                  <div className="flex gap-2 mt-3 pt-2 border-t">
                    {record.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => updateStatusMutation.mutate({ id: record.id, status: "approved" })}
                        disabled={updateStatusMutation.isPending}
                      >
                        อนุมัติ
                      </Button>
                    )}
                    {record.status === "approved" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-xs"
                        onClick={() => updateStatusMutation.mutate({ id: record.id, status: "paid" })}
                        disabled={updateStatusMutation.isPending}
                      >
                        จ่ายแล้ว
                      </Button>
                    )}
                    {record.status === "paid" && (
                      <p className="text-xs text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        จ่ายเรียบร้อย
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </AdminPageWrapper>
  );
}
