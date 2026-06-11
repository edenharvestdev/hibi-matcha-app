import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, CheckCircle2, XCircle, QrCode, Loader2, TrendingUp, AlertCircle, FileText } from "lucide-react";
import { useEffect } from "react";

export default function AreaManagerReport() {
  const { session, loading, isAdmin, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) setLocation("/login");
  }, [loading, session, isAdmin, setLocation]);

  const { data: report, isLoading } = trpc.reports.areaManagerSummary.useQuery(undefined, { enabled: !!session && isAdmin });

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="รายงานสรุป" backPath="/admin" loading={isLoading}>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="h-6 w-6" />
            <h1 className="font-bold text-lg">รายงานสรุป</h1>
          </div>
          <p className="text-sm opacity-80">
            {isSuperAdmin ? "ข้อมูลทุกสาขา" : session.role === "area_manager" ? "เฉพาะสาขาที่คุณดูแล" : "เฉพาะสาขาของคุณ"}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : report ? (
          <>
            {/* Approval Rate Card */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">อัตราอนุมัติรีวิว</h2>
                    <p className="text-xs text-muted-foreground">ภาพรวมการพิจารณารีวิว</p>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{report.approvalRate.total}</p>
                    <p className="text-xs text-muted-foreground">ทั้งหมด</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{report.approvalRate.approved}</p>
                    <p className="text-xs text-muted-foreground">อนุมัติ</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-red-500">{report.approvalRate.rejected}</p>
                    <p className="text-xs text-muted-foreground">ปฏิเสธ</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-primary">{report.approvalRate.rate}%</p>
                    <p className="text-xs text-muted-foreground">อัตรา</p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-4 h-3 bg-gray-100 rounded-full overflow-hidden">
                  {report.approvalRate.total > 0 && (
                    <div className="h-full flex">
                      <div
                        className="bg-green-500 transition-all"
                        style={{ width: `${(report.approvalRate.approved / report.approvalRate.total) * 100}%` }}
                      />
                      <div
                        className="bg-red-400 transition-all"
                        style={{ width: `${(report.approvalRate.rejected / report.approvalRate.total) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> อนุมัติ</span>
                  <span className="text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" /> ปฏิเสธ</span>
                </div>
              </CardContent>
            </Card>

            {/* Codes Per Branch */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-purple-50 text-purple-600">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">โค้ดแยกตามสาขา</h2>
                    <p className="text-xs text-muted-foreground">จำนวนโค้ดที่ออกและใช้แล้ว</p>
                  </div>
                </div>
                {report.codesPerBranch.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">ยังไม่มีข้อมูลโค้ด</p>
                ) : (
                  <div className="space-y-3">
                    {report.codesPerBranch.map((b: any) => (
                      <div key={b.branchId} className="bg-gray-50 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-sm">{b.branchName || `สาขา #${b.branchId}`}</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">{b.totalIssued} โค้ด</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white rounded-lg p-2">
                            <p className="text-sm font-bold text-blue-600">{b.rvCount ?? 0}</p>
                            <p className="text-[10px] text-muted-foreground">RV (รีวิว)</p>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <p className="text-sm font-bold text-orange-600">{b.clCount ?? 0}</p>
                            <p className="text-[10px] text-muted-foreground">CL (ชดเชย)</p>
                          </div>
                          <div className="bg-white rounded-lg p-2">
                            <p className="text-sm font-bold text-green-600">{b.redeemedCount ?? 0}</p>
                            <p className="text-[10px] text-muted-foreground">ใช้แล้ว</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CL Issued Summary */}
            <Card className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-amber-50 text-amber-600">
                    <AlertCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-sm">โค้ดชดเชย (CL)</h2>
                    <p className="text-xs text-muted-foreground">จำนวนโค้ดชดเชยที่ออกทั้งหมด</p>
                  </div>
                </div>
                <p className="text-3xl font-bold text-amber-600">{report.clIssuedCount}</p>
                <p className="text-xs text-muted-foreground mt-1">โค้ดชดเชยที่ออกแล้ว</p>
              </CardContent>
            </Card>

            {/* Rejection Reasons */}
            {report.rejectionReasons.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-red-50 text-red-600">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold text-sm">เหตุผลที่ปฏิเสธ</h2>
                      <p className="text-xs text-muted-foreground">สาเหตุที่รีวิวถูกปฏิเสธ</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {report.rejectionReasons.map((r: any, i: number) => (
                      <div key={i} className="flex justify-between items-center bg-red-50/50 rounded-lg p-3">
                        <span className="text-sm">{r.reason || "ไม่ระบุ"}</span>
                        <span className="text-sm font-bold text-red-600">{r.count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>ไม่พบข้อมูลรายงาน</p>
          </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
