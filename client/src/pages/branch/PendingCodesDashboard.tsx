import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Coffee, AlertTriangle, Clock, FileText, Loader2, BarChart3 } from "lucide-react";
import { useEffect } from "react";
import { useIsMobile } from "@/hooks/useMobile";

export default function BranchPendingCodesDashboard() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  const { data, isLoading } = trpc.pendingCodes.dashboard.useQuery(undefined, {
    enabled: !!session && isStaff,
    refetchInterval: 60000,
  });

  if (loading || !session) return null;

  const grandTotal = (data?.reviewCodes.total ?? 0) + (data?.claimCodes.total ?? 0) + (data?.freeDrinkCodes.total ?? 0);

  return (
    <MobileLayout title="โค้ดค้าง (สาขา)" showBack backPath="/branch">
      <PremiumPageContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Grand Total */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-700 to-slate-800 text-white">
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-2">
                  <BarChart3 className="h-6 w-6" />
                  <p className="font-semibold">โค้ดค้างทั้งหมด</p>
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
          </>
        )}
      </PremiumPageContent>
    </MobileLayout>
  );
}
