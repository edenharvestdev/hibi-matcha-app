import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Upload, CheckCircle, Clock, Truck, XCircle, Loader2, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { formatDateTimeFull } from "@/lib/dateUtils";

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

export default function ShopOrderDetail() {
  const { session } = useHibiAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const orderId = parseInt(params.id || "0");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const { data: order, isLoading, refetch } = trpc.shopOrders.getById.useQuery(
    { id: orderId },
    { enabled: orderId > 0 }
  );
  const uploadSlipMutation = trpc.shopOrders.uploadSlip.useMutation({
    onSuccess: () => {
      toast.success("อัปโหลดสลิปสำเร็จ!");
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("ไฟล์ต้องมีขนาดไม่เกิน 5MB");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadSlipMutation.mutate({
          orderId,
          base64,
          fileName: file.name,
          contentType: file.type,
        });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
      toast.error("เกิดข้อผิดพลาดในการอัปโหลด");
    }
  };

  if (isLoading) {
    return (
      <MobileLayout title="รายละเอียดคำสั่งซื้อ" showBack backPath="/customer/orders">
        <PremiumPageContent>
        <div className="p-4 space-y-4 animate-pulse">
          <div className="h-8 bg-muted rounded w-1/2" />
          <div className="h-24 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  if (!order) {
    return (
      <MobileLayout title="ไม่พบคำสั่งซื้อ" showBack backPath="/customer/orders">
        <PremiumPageContent>
        <div className="p-4 text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">ไม่พบคำสั่งซื้อ</p>
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  const status = STATUS_MAP[order.status] || STATUS_MAP.pending_payment;
  const StatusIcon = status.icon;

  return (
    <MobileLayout title={`คำสั่งซื้อ #${order.orderNumber}`} showBack backPath="/customer/orders">
      <PremiumPageContent>
      <div className="p-4 pb-8 space-y-4">
        {/* Status */}
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${status.color}`}>
              <StatusIcon className="w-5 h-5" />
            </div>
            <div>
              <Badge className={status.color}>{status.label}</Badge>
              <p className="text-xs text-muted-foreground mt-1">
                สั่งซื้อเมื่อ {formatDateTimeFull(order.createdAt)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">รายการสินค้า</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {order.items?.map((item: any) => (
              <div key={item.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <p className="text-xs text-muted-foreground">
                    ฿{formatPrice(item.price)} x {item.quantity}
                  </p>
                </div>
                <span className="font-medium">฿{formatPrice(item.subtotal)}</span>
              </div>
            ))}
            <div className="border-t pt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ค่าสินค้า</span>
                <span>฿{formatPrice(order.totalAmount - order.shippingFee)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ค่าจัดส่ง</span>
                <span>{order.shippingFee > 0 ? `฿${formatPrice(order.shippingFee)}` : "ฟรี"}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>ยอดรวม</span>
                <span className="text-primary">฿{formatPrice(order.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">ข้อมูลจัดส่ง</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p>
              <span className="text-muted-foreground">วิธีรับสินค้า: </span>
              {order.shippingMethod === "pickup" ? "รับที่สาขา" : "จัดส่ง"}
            </p>
            {order.shippingMethod === "delivery" && (
              <>
                {order.shippingName && <p><span className="text-muted-foreground">ชื่อผู้รับ: </span>{order.shippingName}</p>}
                {order.shippingPhone && <p><span className="text-muted-foreground">เบอร์โทร: </span>{order.shippingPhone}</p>}
                {order.shippingAddress && <p><span className="text-muted-foreground">ที่อยู่: </span>{order.shippingAddress}</p>}
              </>
            )}
            {order.trackingNumber && (
              <p><span className="text-muted-foreground">เลขพัสดุ: </span><span className="font-mono font-bold">{order.trackingNumber}</span></p>
            )}
            {typeof order.note === "string" && order.note && (
              <p><span className="text-muted-foreground">หมายเหตุ: </span>{order.note}</p>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">การชำระเงิน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm">
              <span className="text-muted-foreground">วิธีชำระ: </span>
              {order.paymentMethod === "promptpay" ? "PromptPay / QR Code" : "โอนเงินผ่านธนาคาร"}
            </p>

            {/* Payment Slip */}
            {order.paymentSlipUrl ? (
              <div>
                <p className="text-sm text-muted-foreground mb-2">สลิปการโอนเงิน:</p>
                <img
                  src={order.paymentSlipUrl}
                  alt="สลิปการโอนเงิน"
                  className="max-w-[200px] rounded-lg border cursor-pointer"
                  onClick={() => window.open(order.paymentSlipUrl!, "_blank")}
                />
              </div>
            ) : null}

            {/* Upload Slip Button */}
            {(order.status === "pending_payment" || order.status === "payment_uploaded") && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <div className="bg-muted/50 border-2 border-dashed rounded-lg p-4 text-center">
                  <p className="text-sm font-medium mb-1">
                    {order.paymentSlipUrl ? "อัปโหลดสลิปใหม่" : "อัปโหลดสลิปการโอนเงิน"}
                  </p>
                  <p className="text-xs text-muted-foreground mb-3">รองรับไฟล์ภาพ ขนาดไม่เกิน 5MB</p>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={uploading || uploadSlipMutation.isPending}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading || uploadSlipMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> กำลังอัปโหลด...</>
                    ) : (
                      <><ImageIcon className="w-4 h-4 mr-1" /> เลือกรูปสลิป</>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Bank Info for transfer */}
            {(order.status === "pending_payment") && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3 text-sm space-y-1">
                  <p className="font-medium text-primary mb-2">ข้อมูลการโอนเงิน</p>
                  <p>ธนาคาร: กสิกรไทย (KBANK)</p>
                  <p>ชื่อบัญชี: บจก. ฮิบิ มัทฉะ</p>
                  <p>เลขบัญชี: xxx-x-xxxxx-x</p>
                  <p className="font-bold text-primary mt-2">ยอดโอน: ฿{formatPrice(order.totalAmount)}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    หลังโอนเงิน กรุณาอัปโหลดสลิปด้านบน
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
          </PremiumPageContent>
    </MobileLayout>
  );
}
