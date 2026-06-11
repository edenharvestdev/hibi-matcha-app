import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Search, Package, Tag, Star, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

function formatPrice(satang: number) {
  return (satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

export default function Shop() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const { data: categories } = trpc.shopCategories.list.useQuery();
  const { data: productsData } = trpc.shopProducts.list.useQuery({
    categoryId: selectedCategory || undefined,
    search: search || undefined,
    limit: 50,
  });
  const { data: cartItems } = trpc.cart.get.useQuery(undefined, { enabled: !!session && isCustomer });

  const addToCartMutation = trpc.cart.add.useMutation({
    onSuccess: () => {
      toast.success("เพิ่มลงตะกร้าแล้ว");
      utils.cart.get.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  const utils = trpc.useUtils();

  const cartCount = useMemo(() => {
    return cartItems?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  }, [cartItems]);

  const products = productsData?.products || [];

  return (
    <MobileLayout title="ร้านค้า Hibi Matcha" showBack backPath="/customer">
      <PremiumPageContent>
      <div className="p-4 pb-24 space-y-4">
        {/* Search & Cart */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="ค้นหาสินค้า..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="icon"
            className="relative shrink-0"
            onClick={() => {
              if (!session) { setLocation("/login"); return; }
              setLocation("/customer/cart");
            }}
          >
            <ShoppingCart className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                {cartCount}
              </span>
            )}
          </Button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            className="shrink-0 rounded-full"
            onClick={() => setSelectedCategory(null)}
          >
            ทั้งหมด
          </Button>
          {categories?.map((cat) => (
            <Button
              key={cat.id}
              variant={selectedCategory === cat.id ? "default" : "outline"}
              size="sm"
              className="shrink-0 rounded-full"
              onClick={() => setSelectedCategory(cat.id)}
            >
              {cat.name}
            </Button>
          ))}
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">ยังไม่มีสินค้า</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((product) => (
              <Card
                key={product.id}
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setLocation(`/customer/shop/${product.id}`)}
              >
                <div className="aspect-[4/3] bg-muted relative">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                  {product.isFeatured ? (
                    <Badge className="absolute top-2 left-2 bg-amber-500 text-white text-[10px]">
                      <Star className="w-3 h-3 mr-0.5" /> แนะนำ
                    </Badge>
                  ) : null}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">สินค้าหมด</span>
                    </div>
                  )}
                </div>
                <CardContent className="p-3">
                  <h3 className="font-medium text-sm line-clamp-2 mb-1">{product.name}</h3>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-primary font-bold text-base">
                      ฿{formatPrice(product.retailPrice)}
                    </span>
                    {product.wholesalePrice && (
                      <span className="text-xs text-muted-foreground">
                        <Tag className="w-3 h-3 inline mr-0.5" />
                        ฿{formatPrice(product.wholesalePrice)}
                      </span>
                    )}
                  </div>
                  {product.wholesalePrice && product.wholesaleMinQty && (
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      ราคาส่ง {product.wholesaleMinQty}+ {product.unit}
                    </p>
                  )}
                  {product.stock > 0 && product.stock <= 10 && (
                    <p className="text-[10px] text-amber-600 mt-0.5">เหลือ {product.stock} {product.unit}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
          </PremiumPageContent>
    </MobileLayout>
  );
}
