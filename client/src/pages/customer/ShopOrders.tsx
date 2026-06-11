import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, ChevronRight, ShoppingBag, Clock, CheckCircle, Truck, XCircle, Upload } from "lucide-react";
import { useState } from "react";
import { formatDate } from "@/lib/dateUtils";

function formatPrice(satang: number) {
  return (satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "รอชำระเงิน", color: "bg-amber-100 text-amber-800", icon: Clock },
  payment_uploaded: { label: "อัปโหลดสลิปแล้ว", color: "bg-blue-100 text-blue-800", icon: Upload },
  payment_confirmed: { label: "ยืนยันชำระเงินแล้ว", color: "bg-green-100 text-green-800", icon: CheckCircle },
  processing: { label: "กำลังจัดเตรียม", color: "bg-purple-100 text-purple-800", icon: Package },
  shipped: { label: "จัดส่งแล้ว", color: "bg-indigo-100 text-indigo-800", icon: Truck },
  delivered: { label: "ได้รับสินค้าแล้ว", color: "bg-green-100 text-green-800", icon: CheckCircle },
  cancelled: { label: "ยกเลิก", color: "bg-red-100 text-red-800", icon: XCircle },
  refunded: { label: "คืนเงินแล้ว", color: "bg-gray-100 text-gray-800", icon: XCircle },
};

const TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "pending_payment", label: "รอชำระ" },
  { key: "processing", label: "กำลังจัดเตรียม" },
  { key: "shipped", label: "จัดส่งแล้ว" },
  { key: "delivered", label: "สำเร็จ" },
];

export default function ShopOrders() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("all");

  const { data: orders, isLoading } = trpc.shopOrders.myOrders.useQuery(
    { status: tab === "all" ? undefined : tab, limit: 50 },
    { enabled: !!session && isCustomer }
  );

  if (loading) return null;

  return (
    <MobileLayout title="คำสั่งซื้อของฉัน" showBack backPath="/customer">
      <PremiumPageContent>
      <div className="p-4 pb-8 space-y-4">
        {/* Status Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {TABS.map((t) => (
            <Button
              key={t.key}
              variant={tab === t.key ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full text-xs"
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </Button>
          ))}
        </div>

        {/* Orders List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !orders || orders.orders.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">ยังไม่มีคำสั่งซื้อ</p>
            <Button variant="outline" onClick={() => setLocation("/customer/shop")}>
              เลือกซื้อสินค้า
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.orders.map((order) => {
              const status = STATUS_MAP[order.status] || STATUS_MAP.pending_payment;
              return (
                <Card
                  key={order.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setLocation(`/customer/orders/${order.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">#{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(order.createdAt, { shortYear: true })}
                        </p>
                      </div>
                      <Badge className={`${status.color} text-xs`}>{status.label}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-primary font-bold">฿{formatPrice(order.totalAmount)}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
          </PremiumPageContent>
    </MobileLayout>
  );
}
