import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Truck, Store, CreditCard, Banknote, Loader2 } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";

function formatPrice(satang: number) {
  return (satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

export default function ShopCheckout() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();

  const [shippingMethod, setShippingMethod] = useState<"pickup" | "delivery">("delivery");
  const [pickupBranchId, setPickupBranchId] = useState<string>("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"bank_transfer" | "promptpay">("promptpay");
  const [note, setNote] = useState("");

  const { data: cartItems, isLoading: cartLoading } = trpc.cart.get.useQuery(undefined, { enabled: !!session && isCustomer });
  const { data: branches } = trpc.branches.list.useQuery();

  useEffect(() => {
    if (!loading && (!session || !isCustomer)) {
      setLocation("/login");
    }
  }, [loading, session, isCustomer, setLocation]);

  const createOrderMutation = trpc.shopOrders.create.useMutation({
    onSuccess: (data) => {
      toast.success("สร้างคำสั่งซื้อสำเร็จ!");
      setLocation(`/customer/orders/${data.orderId}`);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const { subtotal, shippingFee, total } = useMemo(() => {
    if (!cartItems) return { subtotal: 0, shippingFee: 0, total: 0 };
    let sub = 0;
    for (const item of cartItems) {
      const isWholesale = item.wholesalePrice && item.quantity >= (item.wholesaleMinQty || 10);
      const price = isWholesale ? item.wholesalePrice! : item.retailPrice;
      sub += price * item.quantity;
    }
    const ship = shippingMethod === "delivery" ? 5000 : 0; // 50 baht
    return { subtotal: sub, shippingFee: ship, total: sub + ship };
  }, [cartItems, shippingMethod]);

  if (loading || cartLoading) return null;

  const handleSubmit = () => {
    if (shippingMethod === "pickup" && !pickupBranchId) {
      toast.error("กรุณาเลือกสาขาที่จะรับสินค้า");
      return;
    }
    if (shippingMethod === "delivery") {
      if (!shippingName.trim()) { toast.error("กรุณากรอกชื่อผู้รับ"); return; }
      if (!shippingPhone.trim()) { toast.error("กรุณากรอกเบอร์โทรผู้รับ"); return; }
      if (!shippingAddress.trim()) { toast.error("กรุณากรอกที่อยู่จัดส่ง"); return; }
    }
    createOrderMutation.mutate({
      shippingMethod,
      pickupBranchId: pickupBranchId ? parseInt(pickupBranchId) : undefined,
      shippingAddress: shippingAddress || undefined,
      shippingName: shippingName || undefined,
      shippingPhone: shippingPhone || undefined,
      paymentMethod,
      note: note || undefined,
    });
  };

  return (
    <MobileLayout title="ชำระเงิน" showBack backPath="/customer/cart">
      <PremiumPageContent>
      <div className="p-4 pb-40 space-y-4">
        {/* Order Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">สรุปคำสั่งซื้อ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cartItems?.map((item) => {
              const isWholesale = item.wholesalePrice && item.quantity >= (item.wholesaleMinQty || 10);
              const price = isWholesale ? item.wholesalePrice! : item.retailPrice;
              return (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">
                    {item.productName} x{item.quantity}
                  </span>
                  <span className="font-medium">฿{formatPrice(price * item.quantity)}</span>
                </div>
              );
            })}
            <div className="border-t pt-2 mt-2 space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ค่าสินค้า</span>
                <span>฿{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">ค่าจัดส่ง</span>
                <span>{shippingFee > 0 ? `฿${formatPrice(shippingFee)}` : "ฟรี"}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>ยอดรวม</span>
                <span className="text-primary">฿{formatPrice(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Shipping Method */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">วิธีรับสินค้า</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={shippingMethod} onValueChange={(v) => setShippingMethod(v as "pickup" | "delivery")}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg mb-2">
                <RadioGroupItem value="delivery" id="delivery" />
                <Label htmlFor="delivery" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Truck className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">จัดส่ง</p>
                    <p className="text-xs text-muted-foreground">ค่าส่ง ฿50</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="pickup" id="pickup" />
                <Label htmlFor="pickup" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Store className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">รับที่สาขา</p>
                    <p className="text-xs text-muted-foreground">ฟรี</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>

            {shippingMethod === "pickup" && (
              <div className="mt-3">
                <Label className="text-sm">เลือกสาขา</Label>
                <Select value={pickupBranchId} onValueChange={setPickupBranchId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="เลือกสาขา" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {shippingMethod === "delivery" && (
              <div className="mt-3 space-y-3">
                <div>
                  <Label className="text-sm">ชื่อผู้รับ</Label>
                  <Input value={shippingName} onChange={(e) => setShippingName(e.target.value)} placeholder="ชื่อ-นามสกุล" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">เบอร์โทรผู้รับ</Label>
                  <Input value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)} placeholder="08x-xxx-xxxx" className="mt-1" />
                </div>
                <div>
                  <Label className="text-sm">ที่อยู่จัดส่ง</Label>
                  <Textarea value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} placeholder="บ้านเลขที่ ซอย ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด รหัสไปรษณีย์" className="mt-1" rows={3} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">วิธีชำระเงิน</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "bank_transfer" | "promptpay")}>
              <div className="flex items-center space-x-3 p-3 border rounded-lg mb-2">
                <RadioGroupItem value="promptpay" id="promptpay" />
                <Label htmlFor="promptpay" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CreditCard className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">PromptPay / QR Code</p>
                    <p className="text-xs text-muted-foreground">โอนผ่าน QR Code</p>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border rounded-lg">
                <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Banknote className="w-4 h-4 text-primary" />
                  <div>
                    <p className="font-medium text-sm">โอนเงินผ่านธนาคาร</p>
                    <p className="text-xs text-muted-foreground">โอนเข้าบัญชีธนาคาร</p>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Note */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">หมายเหตุ</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)" rows={2} />
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-muted-foreground">ยอดรวมทั้งหมด</span>
          <span className="text-xl font-bold text-primary">฿{formatPrice(total)}</span>
        </div>
        <Button
          className="w-full gap-2"
          size="lg"
          disabled={createOrderMutation.isPending || !cartItems || cartItems.length === 0}
          onClick={handleSubmit}
        >
          {createOrderMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> กำลังสร้างคำสั่งซื้อ...</>
          ) : (
            "ยืนยันคำสั่งซื้อ"
          )}
        </Button>
      </div>
          </PremiumPageContent>
    </MobileLayout>
  );
}
