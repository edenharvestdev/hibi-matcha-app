import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { ClipboardList, Clock, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/dateUtils";

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "รออนุมัติ", color: "bg-amber-100 text-amber-700", icon: Clock },
  approved: { label: "อนุมัติแล้ว", color: "bg-green-100 text-green-700", icon: CheckCircle2 },
  rejected: { label: "ปฏิเสธ", color: "bg-red-100 text-red-700", icon: XCircle },
};

const appLabels: Record<string, string> = {
  shopee: "Shopee Food",
  lineman: "LINE MAN",
  grab: "Grab Food",
  robinhood: "Robinhood",
  gpos: "GPOS",
  walkin: "Walk-in",
};

function getOrderDisplay(req: any): { label: string; value: string; extra?: { label: string; value: string } } {
  if (req.deliveryApp === "grab") {
    return {
      label: "เลข GF",
      value: req.gfNumber || req.orderId,
      extra: req.bookingId ? { label: "Booking ID", value: req.bookingId } : undefined,
    };
  }
  if (req.deliveryApp === "shopee") {
    return {
      label: "เลขออเดอร์",
      value: req.shopeeOrderNumber || req.orderId,
      extra: req.shopeeOrderId ? { label: "เลขคำสั่งซื้อ", value: req.shopeeOrderId } : undefined,
    };
  }
  if (req.deliveryApp === "lineman") {
    return {
      label: "เลขออเดอร์",
      value: req.linemanOrderNumber || req.orderId,
      extra: req.linemanOrderId ? { label: "รหัสใบสั่งซื้อ", value: req.linemanOrderId } : undefined,
    };
  }
  if (req.deliveryApp === "gpos") {
    return { label: "เลขที่ใบเสร็จ", value: req.orderId };
  }
  return { label: "Order ID", value: req.orderId };
}

export default function MyRequests() {
  const { session, loading } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
  }, [loading, session, setLocation]);

  const { data: requests, isLoading } = trpc.reviews.myRequests.useQuery(undefined, { enabled: !!session });

  if (loading || !session) return null;

  return (
    <MobileLayout title="คำขอของฉัน" showBack backPath="/customer">
      <PremiumPageContent>
        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
        ) : !requests?.length ? (
          <div className="text-center py-12">
            <ClipboardList className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ยังไม่มีคำขอรีวิว</p>
            <button onClick={() => setLocation("/customer/submit-review")} className="text-primary text-sm font-medium mt-2 hover:underline">
              ส่งรีวิวเลย →
            </button>
          </div>
        ) : (
          requests.map((req) => {
            const config = statusConfig[req.status] || statusConfig.pending;
            const StatusIcon = config.icon;
            const orderInfo = getOrderDisplay(req);
            return (
              <Card key={req.id} className="border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{appLabels[req.deliveryApp] || req.deliveryApp}</p>
                      <p className="text-xs text-muted-foreground">{orderInfo.label}: <span className="font-mono">{orderInfo.value}</span></p>
                      {orderInfo.extra && (
                        <p className="text-xs text-muted-foreground">{orderInfo.extra.label}: <span className="font-mono text-[10px]">{orderInfo.extra.value}</span></p>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium ${config.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {config.label}
                    </span>
                  </div>
                  {req.imageUrl && (
                    <img src={req.imageUrl} alt="Review" className="w-full h-32 object-cover rounded-lg mt-2" />
                  )}
                  <p className="text-[11px] text-muted-foreground mt-2">
                    {formatDateTime(req.createdAt)}
                  </p>
                  {req.status === "rejected" && (
                    <div className="mt-2 bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-red-700">รีวิวถูกปฏิเสธ</p>
                          {req.rejectionReason ? (
                            <p className="text-xs text-red-600 mt-0.5">เหตุผล: {req.rejectionReason}</p>
                          ) : (
                            <p className="text-xs text-red-600 mt-0.5">ไม่ได้ระบุเหตุผล — กรุณาติดต่อสาขา</p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full text-xs border-red-200 text-red-600 hover:bg-red-100"
                        onClick={() => setLocation("/customer/submit-review")}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        ส่งรีวิวใหม่
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </PremiumPageContent>
    </MobileLayout>
  );
}
