import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpCircle, ArrowDownCircle, Settings2, Clock } from "lucide-react";
import { useEffect } from "react";
import { formatDate, formatTime } from "@/lib/dateUtils";

const TX_CONFIG: Record<string, { label: string; icon: typeof ArrowUpCircle; color: string }> = {
  earn_store: { label: "สะสมหน้าร้าน", icon: ArrowUpCircle, color: "text-green-500" },
  earn_delivery: { label: "สะสม Delivery", icon: ArrowUpCircle, color: "text-blue-500" },
  spend: { label: "แลกรางวัล", icon: ArrowDownCircle, color: "text-red-500" },
  adjust: { label: "ปรับแต้ม", icon: Settings2, color: "text-amber-500" },
  expire: { label: "หมดอายุ", icon: Clock, color: "text-gray-400" },
};

export default function PointsHistory() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isCustomer) setLocation("/branch");
  }, [loading, session, isCustomer, setLocation]);

  const { data: history, isLoading } = trpc.loyalty.history.useQuery(undefined, { enabled: !!session && isCustomer });
  const { data: points } = trpc.loyalty.myPoints.useQuery(undefined, { enabled: !!session && isCustomer });

  if (loading || !session) return null;

  return (
    <MobileLayout title="ประวัติแต้ม" showBack backPath="/customer/my-points">
      <PremiumPageContent>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-primary">{(points?.availablePoints ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">ใช้ได้</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-green-600">{(points?.lifetimePoints ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">สะสมทั้งหมด</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-red-500">{(points?.usedPoints ?? 0).toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">ใช้ไปแล้ว</p>
            </CardContent>
          </Card>
        </div>

        {/* Transaction List */}
        <h3 className="font-semibold text-sm text-muted-foreground px-1">รายการล่าสุด</h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-0 shadow-sm animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : !history?.length ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">ยังไม่มีรายการแต้ม</p>
              <p className="text-xs text-muted-foreground mt-1">เริ่มสะสมแต้มจากการซื้อที่ร้านหรือ Delivery</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {history.map((tx) => {
              const cfg = TX_CONFIG[tx.type] || TX_CONFIG.adjust;
              const TxIcon = cfg.icon;
              const isPositive = tx.points > 0;
              return (
                <Card key={tx.id} className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <TxIcon className={`h-5 w-5 flex-shrink-0 ${cfg.color}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{cfg.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{tx.description}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDate(tx.createdAt, { shortYear: true })}
                          {" "}
                          {formatTime(tx.createdAt)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${isPositive ? "text-green-600" : "text-red-500"}`}>
                          {isPositive ? "+" : ""}{tx.points.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">คงเหลือ {tx.balanceAfter.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </PremiumPageContent>
    </MobileLayout>
  );
}
