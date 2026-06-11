import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Package, Clock, CheckCircle, Truck, XCircle, Upload, Eye, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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

const STATUS_OPTIONS = [
  { value: "pending_payment", label: "รอชำระเงิน" },
  { value: "payment_uploaded", label: "อัปโหลดสลิปแล้ว" },
  { value: "payment_confirmed", label: "ยืนยันชำระเงินแล้ว" },
  { value: "processing", label: "กำลังจัดเตรียม" },
  { value: "shipped", label: "จัดส่งแล้ว" },
  { value: "delivered", label: "ได้รับสินค้าแล้ว" },
  { value: "cancelled", label: "ยกเลิก" },
  { value: "refunded", label: "คืนเงินแล้ว" },
];

const TABS = [
  { key: "all", label: "ทั้งหมด" },
  { key: "payment_uploaded", label: "รอตรวจสลิป" },
  { key: "payment_confirmed", label: "ชำระแล้ว" },
  { key: "processing", label: "จัดเตรียม" },
  { key: "shipped", label: "จัดส่งแล้ว" },
];

export default function AdminShopOrders() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState<number | null>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNote, setAdminNote] = useState("");

  const utils = trpc.useUtils();
  const { data: ordersData, isLoading } = trpc.shopOrders.listAll.useQuery({
    status: tab === "all" ? undefined : tab,
    limit: 50,
  });
  const { data: orderDetail } = trpc.shopOrders.getById.useQuery(
    { id: selectedOrder! },
    { enabled: !!selectedOrder }
  );

  const updateStatusMutation = trpc.shopOrders.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตสถานะแล้ว");
      utils.shopOrders.listAll.invalidate();
      utils.shopOrders.getById.invalidate();
      setShowUpdateDialog(false);
    },
    onError: (e) => toast.error(e.message),
  });

  if (loading) return null;
  if (!session || !isSuperAdmin) {
    setLocation("/admin");
    return null;
  }

  const orders = ordersData?.orders || [];

  const openUpdateDialog = (orderId: number, currentStatus: string) => {
    setSelectedOrder(orderId);
    setNewStatus(currentStatus);
    setTrackingNumber("");
    setAdminNote("");
    setShowUpdateDialog(true);
  };

  return (
    <AdminPageWrapper title="จัดการคำสั่งซื้อ" backPath="/admin" loading={isLoading}>
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

        {/* Orders */}
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-28 bg-muted rounded animate-pulse" />)}</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>ไม่มีคำสั่งซื้อ</p>
          </div>
        ) : (
          orders.map((order) => {
            const status = STATUS_MAP[order.status] || STATUS_MAP.pending_payment;
            return (
              <Card key={order.id}>
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
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-primary font-bold">฿{formatPrice(order.totalAmount)}</span>
                    <span className="text-xs text-muted-foreground">
                      {order.shippingMethod === "pickup" ? "รับที่สาขา" : "จัดส่ง"}
                    </span>
                  </div>
                  {/* Payment slip preview */}
                  {order.paymentSlipUrl && (
                    <div className="mb-2">
                      <a href={order.paymentSlipUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 underline flex items-center gap-1">
                        <Eye className="w-3 h-3" /> ดูสลิปการโอน
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline" size="sm" className="flex-1 text-xs"
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      <Eye className="w-3 h-3 mr-1" /> รายละเอียด
                    </Button>
                    <Button
                      size="sm" className="flex-1 text-xs"
                      onClick={() => openUpdateDialog(order.id, order.status)}
                    >
                      อัปเดตสถานะ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {/* Order Detail Dialog */}
        {selectedOrder && orderDetail && !showUpdateDialog && (
          <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
            <DialogContent className="max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>คำสั่งซื้อ #{orderDetail.orderNumber}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium mb-1">รายการสินค้า</p>
                  {orderDetail.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between py-1 border-b last:border-0">
                      <span>{item.productName} x{item.quantity}</span>
                      <span>฿{formatPrice(item.subtotal)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>ยอดรวม</span>
                    <span className="text-primary">฿{formatPrice(orderDetail.totalAmount)}</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium mb-1">ข้อมูลจัดส่ง</p>
                  <p>วิธี: {orderDetail.shippingMethod === "pickup" ? "รับที่สาขา" : "จัดส่ง"}</p>
                  {orderDetail.shippingName && <p>ชื่อ: {orderDetail.shippingName}</p>}
                  {orderDetail.shippingPhone && <p>เบอร์: {orderDetail.shippingPhone}</p>}
                  {orderDetail.shippingAddress && <p>ที่อยู่: {orderDetail.shippingAddress}</p>}
                  {orderDetail.trackingNumber && <p>เลขพัสดุ: <span className="font-mono font-bold">{orderDetail.trackingNumber}</span></p>}
                </div>
                {orderDetail.paymentSlipUrl && (
                  <div>
                    <p className="font-medium mb-1">สลิปการโอน</p>
                    <img src={orderDetail.paymentSlipUrl} alt="slip" className="max-w-[200px] rounded-lg border" />
                  </div>
                )}
                {orderDetail.commissionBranchId && (
                  <div className="bg-muted/50 p-2 rounded text-xs">
                    <p>สาขาที่ได้คอมมิชชัน: #{orderDetail.commissionBranchId}</p>
                    {orderDetail.commissionRate && <p>อัตรา: {orderDetail.commissionRate}%</p>}
                    {orderDetail.commissionAmount && <p>จำนวน: ฿{formatPrice(orderDetail.commissionAmount)}</p>}
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>ปิด</Button>
                <Button onClick={() => openUpdateDialog(orderDetail.id, orderDetail.status)}>อัปเดตสถานะ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Update Status Dialog */}
        <Dialog open={showUpdateDialog} onOpenChange={setShowUpdateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>อัปเดตสถานะคำสั่งซื้อ</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>สถานะใหม่</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              {newStatus === "shipped" && (
                <div>
                  <Label>เลขพัสดุ</Label>
                  <Input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} className="mt-1" placeholder="เลขติดตามพัสดุ" />
                </div>
              )}
              <div>
                <Label>หมายเหตุ (Admin)</Label>
                <Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} className="mt-1" rows={2} placeholder="หมายเหตุภายใน" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUpdateDialog(false)}>ยกเลิก</Button>
              <Button
                disabled={!newStatus || updateStatusMutation.isPending}
                onClick={() => {
                  if (!selectedOrder) return;
                  updateStatusMutation.mutate({
                    id: selectedOrder,
                    status: newStatus as any,
                    trackingNumber: trackingNumber || undefined,
                    adminNote: adminNote || undefined,
                  });
                }}
              >
                {updateStatusMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                อัปเดต
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminPageWrapper>
  );
}
