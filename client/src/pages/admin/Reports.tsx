import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { BarChart3, Download, CheckCircle2, XCircle, QrCode, Loader2 } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useIsMobile } from "@/hooks/useMobile";
import { toast } from "sonner";
import DateRangePickerModal from "@/components/common/DateRangePickerModal";

export default function Reports() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [exporting, setExporting] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) { toast.error("ไม่มีสิทธิ์เข้าถึง (Super Admin เท่านั้น)"); setLocation("/admin"); }
  }, [loading, session, isSuperAdmin, setLocation]);

  const queryInput = useMemo(() => ({
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }), [dateFrom, dateTo]);
  const { data: report, isLoading } = trpc.reports.summary.useQuery(queryInput, { enabled: !!session && isSuperAdmin });
  const exportQuery = trpc.reports.exportCsv.useQuery(queryInput, { enabled: false });

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportQuery.refetch();
      if (result.data?.csv) {
        const blob = new Blob(["\uFEFF" + result.data.csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `hibi-matcha-codes-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`ดาวน์โหลดสำเร็จ (${result.data.count} รายการ)`);
      }
    } catch {
      toast.error("ไม่สามารถ Export ได้");
    } finally {
      setExporting(false);
    }
  };

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="รายงาน" backPath="/admin" loading={isLoading}>
      <div className="space-y-4">
        {/* Date Range Filter */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">กรองข้อมูลตามช่วงเวลา</p>
          <DateRangePickerModal
            dateFrom={dateFrom}
            dateTo={dateTo}
            onApply={(f, t) => { setDateFrom(f); setDateTo(t); }}
            onClear={() => { setDateFrom(""); setDateTo(""); }}
          />
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : report ? (
          <>
            {/* Approval Rate */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm flex items-center gap-2 mb-3">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  อัตราอนุมัติรีวิว
                </h3>
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20">
                    <svg className="h-20 w-20 -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none" stroke="oklch(0.65 0.15 145)" strokeWidth="3"
                        strokeDasharray={`${report.approvalRate.rate}, 100`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-lg font-bold">{report.approvalRate.rate}%</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">ทั้งหมด</span>
                      <span className="font-medium">{report.approvalRate.total}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" /> อนุมัติ</span>
                      <span className="font-medium text-green-600">{report.approvalRate.approved}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-red-600"><XCircle className="h-3 w-3" /> ปฏิเสธ</span>
                      <span className="font-medium text-red-600">{report.approvalRate.rejected}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CL Count */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <QrCode className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{report.clIssuedCount}</p>
                    <p className="text-xs text-muted-foreground">โค้ดชดเชย (CL) ทั้งหมด</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Codes Per Branch */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">โค้ดแยกตามสาขา</h3>
                {report.codesPerBranch.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีข้อมูล</p>
                ) : (
                  <div className="space-y-3">
                    {report.codesPerBranch.map((b: any) => (
                      <div key={b.branchId} className="border-b last:border-0 pb-3 last:pb-0">
                        <p className="font-medium text-sm">{b.branchName || `สาขา #${b.branchId}`}</p>
                        <div className={isMobile ? "grid grid-cols-2 gap-2 mt-1.5" : "grid grid-cols-4 gap-2 mt-1.5"}>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">ทั้งหมด</p>
                            <p className="font-semibold text-sm">{b.totalIssued}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">RV</p>
                            <p className="font-semibold text-sm text-green-600">{b.rvCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">CL</p>
                            <p className="font-semibold text-sm text-blue-600">{b.clCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground">ใช้แล้ว</p>
                            <p className="font-semibold text-sm text-purple-600">{b.redeemedCount}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rejection Reasons */}
            {report.rejectionReasons.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <h3 className="font-semibold text-sm mb-3">เหตุผลการปฏิเสธ</h3>
                  <div className="space-y-2">
                    {report.rejectionReasons.map((r: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground truncate flex-1">{r.reason || "ไม่ระบุ"}</span>
                        <span className="font-medium ml-2">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Export Button */}
            <Button
              variant="outline"
              size={isMobile ? "lg" : "default"}
              className={isMobile ? "w-full h-12 text-sm" : "w-full"}
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export CSV
            </Button>
          </>
        ) : null}
      </div>
    </AdminPageWrapper>
  );
}
