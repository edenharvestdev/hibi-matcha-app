import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Trash2, Package, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { useMemo } from "react";

function formatPrice(satang: number) {
  return (satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

export default function ShopCart() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: cartItems, isLoading } = trpc.cart.get.useQuery(undefined, { enabled: !!session && isCustomer });

  const updateQtyMutation = trpc.cart.updateQuantity.useMutation({
    onSuccess: () => utils.cart.get.invalidate(),
    onError: (err) => toast.error(err.message),
  });
  const removeMutation = trpc.cart.remove.useMutation({
    onSuccess: () => {
      toast.success("ลบสินค้าแล้ว");
      utils.cart.get.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });
  const clearMutation = trpc.cart.clear.useMutation({
    onSuccess: () => {
      toast.success("ล้างตะกร้าแล้ว");
      utils.cart.get.invalidate();
    },
  });

  const { totalRetail, totalWholesale, totalFinal, itemCount } = useMemo(() => {
    if (!cartItems) return { totalRetail: 0, totalWholesale: 0, totalFinal: 0, itemCount: 0 };
    let retail = 0;
    let final_ = 0;
    let count = 0;
    for (const item of cartItems) {
      const isWholesale = item.wholesalePrice && item.quantity >= (item.wholesaleMinQty || 10);
      const price = isWholesale ? item.wholesalePrice! : item.retailPrice;
      retail += item.retailPrice * item.quantity;
      final_ += price * item.quantity;
      count += item.quantity;
    }
    return { totalRetail: retail, totalWholesale: retail - final_, totalFinal: final_, itemCount: count };
  }, [cartItems]);

  if (loading) return null;
  if (!session || !isCustomer) {
    return (
      <MobileLayout title="ตะกร้าสินค้า" showBack backPath="/customer/shop">
        <PremiumPageContent>
        <div className="p-4 text-center py-12">
          <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">กรุณาเข้าสู่ระบบเพื่อดูตะกร้า</p>
          <Button onClick={() => setLocation("/login")}>เข้าสู่ระบบ</Button>
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout title="ตะกร้าสินค้า" showBack backPath="/customer/shop">
      <PremiumPageContent>
      <div className="p-4 pb-40 space-y-3">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !cartItems || cartItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">ตะกร้าว่าง</p>
            <Button variant="outline" onClick={() => setLocation("/customer/shop")}>
              เลือกซื้อสินค้า
            </Button>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">{itemCount} รายการ</p>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive text-xs"
                onClick={() => clearMutation.mutate()}
                disabled={clearMutation.isPending}
              >
                <Trash2 className="w-3 h-3 mr-1" /> ล้างตะกร้า
              </Button>
            </div>

            {cartItems.map((item) => {
              const isWholesale = item.wholesalePrice && item.quantity >= (item.wholesaleMinQty || 10);
              const unitPrice = isWholesale ? item.wholesalePrice! : item.retailPrice;
              return (
                <Card key={item.productId} className="overflow-hidden">
                  <CardContent className="p-3">
                    <div className="flex gap-3">
                      <div
                        className="w-20 h-20 bg-muted rounded-lg shrink-0 overflow-hidden cursor-pointer"
                        onClick={() => setLocation(`/customer/shop/${item.productId}`)}
                      >
                        {item.productImageUrl ? (
                          <img src={item.productImageUrl} alt={item.productName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="w-6 h-6 text-muted-foreground/40" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-1">{item.productName}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-primary font-bold text-sm">฿{formatPrice(unitPrice)}</span>
                          {isWholesale && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">ราคาส่ง</Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1 border rounded-md">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  removeMutation.mutate({ productId: item.productId });
                                } else {
                                  updateQtyMutation.mutate({ productId: item.productId, quantity: item.quantity - 1 });
                                }
                              }}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => updateQtyMutation.mutate({ productId: item.productId, quantity: item.quantity + 1 })}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                          <span className="font-bold text-sm">฿{formatPrice(unitPrice * item.quantity)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </>
        )}
      </div>

      {/* Fixed Bottom Summary */}
      {cartItems && cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-50 space-y-2">
          {totalWholesale > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>ส่วนลดราคาส่ง</span>
              <span className="text-green-600">-฿{formatPrice(totalWholesale)}</span>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-muted-foreground">ยอดรวม</p>
              <p className="text-xl font-bold text-primary">฿{formatPrice(totalFinal)}</p>
            </div>
            <Button className="gap-2" onClick={() => setLocation("/customer/checkout")}>
              สั่งซื้อ <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
          </PremiumPageContent>
    </MobileLayout>
  );
}
