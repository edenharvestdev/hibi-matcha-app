import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, Package, Tag, Star, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function formatPrice(satang: number) {
  return (satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

export default function ShopProductDetail() {
  const { session, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const productId = parseInt(params.id || "0");
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = trpc.shopProducts.getById.useQuery({ id: productId }, { enabled: productId > 0 });
  const utils = trpc.useUtils();

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("เพิ่มลงตะกร้าแล้ว");
      utils.cart.get.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  if (isLoading) {
    return (
      <MobileLayout title="รายละเอียดสินค้า" showBack backPath="/customer/shop">
        <PremiumPageContent>
        <div className="p-4 space-y-4 animate-pulse">
          <div className="aspect-square bg-muted rounded-lg" />
          <div className="h-6 bg-muted rounded w-3/4" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  if (!product) {
    return (
      <MobileLayout title="ไม่พบสินค้า" showBack backPath="/customer/shop">
        <PremiumPageContent>
        <div className="p-4 text-center py-12">
          <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">ไม่พบสินค้าที่ต้องการ</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/customer/shop")}>
            กลับไปหน้าร้านค้า
          </Button>
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  const isWholesale = product.wholesalePrice && quantity >= (product.wholesaleMinQty || 10);
  const unitPrice = isWholesale ? product.wholesalePrice! : product.retailPrice;
  const totalPrice = unitPrice * quantity;

  return (
    <MobileLayout title={product.name} showBack backPath="/customer/shop">
      <PremiumPageContent>
      <div className="pb-32">
        {/* Product Image */}
        <div className="aspect-square bg-muted relative">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground/40" />
            </div>
          )}
          {product.isFeatured ? (
            <Badge className="absolute top-3 left-3 bg-amber-500 text-white">
              <Star className="w-3 h-3 mr-1" /> สินค้าแนะนำ
            </Badge>
          ) : null}
        </div>

        <div className="p-4 space-y-4">
          {/* Name & Price */}
          <div>
            <h1 className="text-xl font-bold">{product.name}</h1>
            {product.sku && <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-bold text-primary">฿{formatPrice(product.retailPrice)}</span>
            <span className="text-sm text-muted-foreground">/{product.unit}</span>
          </div>

          {/* Wholesale Info */}
          {product.wholesalePrice ? (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-primary" />
                  <span className="font-medium text-primary text-sm">ราคาส่ง (Wholesale)</span>
                </div>
                <p className="text-sm">
                  สั่ง {product.wholesaleMinQty || 10}+ {product.unit} ราคาเพียง{" "}
                  <span className="font-bold text-primary">฿{formatPrice(product.wholesalePrice)}</span>/{product.unit}
                </p>
                {isWholesale && (
                  <Badge className="mt-2 bg-primary text-primary-foreground">ได้ราคาส่งแล้ว!</Badge>
                )}
              </CardContent>
            </Card>
          ) : null}

          {/* Description */}
          {typeof product.description === "string" && product.description.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2">รายละเอียด</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{product.description}</p>
            </div>
          )}

          {/* Stock */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">สต็อก:</span>
            {product.stock > 0 ? (
              <span className={product.stock <= 10 ? "text-amber-600 font-medium" : "text-green-600"}>
                {product.stock} {product.unit}
              </span>
            ) : (
              <span className="text-red-500 font-medium">สินค้าหมด</span>
            )}
          </div>

          {/* Image Gallery */}
          {Array.isArray(product.images) && (product.images as string[]).length > 0 ? (
            <div>
              <h2 className="font-semibold mb-2">รูปภาพเพิ่มเติม</h2>
              <div className="grid grid-cols-3 gap-2">
                {(product.images as string[]).map((img: string, i: number) => (
                  <div key={i} className="aspect-square bg-muted rounded-lg overflow-hidden">
                    <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      {product.stock > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex items-center gap-3 z-50">
          <div className="flex items-center gap-2 border rounded-lg">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
            >
              <Minus className="w-4 h-4" />
            </Button>
            <span className="w-10 text-center font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <Button
            className="flex-1 gap-2"
            disabled={addToCartMutation.isPending}
            onClick={() => {
              if (!session) { setLocation("/login"); return; }
              if (!isCustomer) { toast.error("เฉพาะลูกค้าเท่านั้น"); return; }
              addToCartMutation.mutate({ productId: product.id, quantity });
            }}
          >
            <ShoppingCart className="w-4 h-4" />
            เพิ่มลงตะกร้า · ฿{formatPrice(totalPrice)}
          </Button>
        </div>
      )}
          </PremiumPageContent>
    </MobileLayout>
  );
}
