import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Coffee, AlertTriangle, Clock, FileText, Loader2, BarChart3, Store } from "lucide-react";
import { useEffect } from "react";

export default function PendingCodesDashboard() {
  const { session, loading, isAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) setLocation("/login");
  }, [loading, session, isAdmin, setLocation]);

  const { data, isLoading } = trpc.pendingCodes.dashboard.useQuery(undefined, {
    enabled: !!session && isAdmin,
    refetchInterval: 60000, // refresh every minute
  });

  if (loading || !session) return null;

  const grandTotal = (data?.reviewCodes.total ?? 0) + (data?.claimCodes.total ?? 0) + (data?.freeDrinkCodes.total ?? 0);

  return (
    <AdminPageWrapper title="โค้ดค้าง (ยังไม่ใช้)" backPath="/admin" loading={isLoading}>
      <div className="px-4 py-4 space-y-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Grand Total */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="h-6 w-6" />
                  <p className="font-semibold">สรุปโค้ดค้างทั้งหมด</p>
                </div>
                <p className="text-4xl font-bold">{grandTotal}</p>
                <p className="text-sm opacity-80 mt-1">โค้ดที่ยังไม่ถูกใช้งาน (ยังไม่หมดอายุ)</p>
              </CardContent>
            </Card>

            {/* Expiring Soon Warning */}
            {(data?.expiringSoon.total ?? 0) > 0 && (
              <Card className="border-amber-200 bg-amber-50 border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-amber-800">ใกล้หมดอายุ (7 วัน)</p>
                      <p className="text-xs text-amber-700">
                        รีวิว/ชดเชย: {data?.expiringSoon.reviewCodes ?? 0} • แก้วแถม: {data?.expiringSoon.freeDrinkCodes ?? 0}
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-amber-800">{data?.expiringSoon.total ?? 0}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Code Type Breakdown */}
            <div className="grid grid-cols-3 gap-3">
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-2">
                    <QrCode className="h-5 w-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{data?.reviewCodes.total ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">โค้ดรีวิว<br />(RV)</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-2xl font-bold text-red-700">{data?.claimCodes.total ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">โค้ดชดเชย<br />(CL)</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm">
                <CardContent className="p-4 text-center">
                  <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center mx-auto mb-2">
                    <Coffee className="h-5 w-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">{data?.freeDrinkCodes.total ?? 0}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-1">แก้วแถม<br />(FD)</p>
                </CardContent>
              </Card>
            </div>

            {/* By Branch Breakdown */}
            {data && (
              <div className="space-y-4">
                {/* Review Codes by Branch */}
                {data.reviewCodes.byBranch.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <QrCode className="h-4 w-4 text-blue-600" />
                        <p className="font-semibold text-sm">โค้ดรีวิว (RV) แยกตามสาขา</p>
                      </div>
                      <div className="space-y-2">
                        {data.reviewCodes.byBranch.map((b) => (
                          <div key={b.branchId} className="flex items-center justify-between py-1.5 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <Store className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{b.branchName}</span>
                            </div>
                            <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full text-sm">{b.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Claim Codes by Branch */}
                {data.claimCodes.byBranch.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <p className="font-semibold text-sm">โค้ดชดเชย (CL) แยกตามสาขา</p>
                      </div>
                      <div className="space-y-2">
                        {data.claimCodes.byBranch.map((b) => (
                          <div key={b.branchId} className="flex items-center justify-between py-1.5 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <Store className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{b.branchName}</span>
                            </div>
                            <span className="font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full text-sm">{b.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Free Drink Codes by Branch */}
                {data.freeDrinkCodes.byBranch.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Coffee className="h-4 w-4 text-green-600" />
                        <p className="font-semibold text-sm">โค้ดแก้วแถม (FD) แยกตามสาขา</p>
                      </div>
                      <div className="space-y-2">
                        {data.freeDrinkCodes.byBranch.map((b) => (
                          <div key={b.branchId} className="flex items-center justify-between py-1.5 border-b last:border-0">
                            <div className="flex items-center gap-2">
                              <Store className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm">{b.branchName}</span>
                            </div>
                            <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full text-sm">{b.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Empty State */}
                {grandTotal === 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-8 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="font-medium text-muted-foreground">ไม่มีโค้ดค้าง</p>
                      <p className="text-xs text-muted-foreground mt-1">โค้ดทั้งหมดถูกใช้งานหรือหมดอายุแล้ว</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </AdminPageWrapper>
  );
}
