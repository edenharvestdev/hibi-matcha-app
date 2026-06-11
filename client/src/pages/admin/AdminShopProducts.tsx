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
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, Plus, Pencil, Trash2, Image as ImageIcon, Loader2, FolderOpen, Tag, Percent, Banknote } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

function formatPrice(satang: number) {
  return (satang / 100).toLocaleString("th-TH", { minimumFractionDigits: 0 });
}

// ── Category Management ──
function CategoryTab() {
  const utils = trpc.useUtils();
  const { data: categories, isLoading } = trpc.shopCategories.listAll.useQuery();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState(0);

  const createMutation = trpc.shopCategories.create.useMutation({
    onSuccess: () => { toast.success("สร้างหมวดหมู่แล้ว"); utils.shopCategories.listAll.invalidate(); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.shopCategories.update.useMutation({
    onSuccess: () => { toast.success("อัปเดตแล้ว"); utils.shopCategories.listAll.invalidate(); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.shopCategories.delete.useMutation({
    onSuccess: () => { toast.success("ลบแล้ว"); utils.shopCategories.listAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.shopCategories.update.useMutation({
    onSuccess: () => utils.shopCategories.listAll.invalidate(),
  });

  const openCreate = () => {
    setEditId(null); setName(""); setDescription(""); setSortOrder(0); setShowDialog(true);
  };
  const openEdit = (cat: any) => {
    setEditId(cat.id); setName(cat.name); setDescription(cat.description || ""); setSortOrder(cat.sortOrder); setShowDialog(true);
  };

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={openCreate} className="gap-1">
        <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่
      </Button>
      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted rounded animate-pulse" />)}</div>
      ) : !categories || categories.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <FolderOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>ยังไม่มีหมวดหมู่</p>
        </div>
      ) : (
        categories.map((cat) => (
          <Card key={cat.id}>
            <CardContent className="p-3 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{cat.name}</span>
                  {!cat.isActive && <Badge variant="secondary" className="text-xs">ปิดใช้งาน</Badge>}
                </div>
                {cat.description && <p className="text-xs text-muted-foreground mt-0.5">{String(cat.description)}</p>}
              </div>
              <div className="flex items-center gap-1">
                <Switch
                  checked={!!cat.isActive}
                  onCheckedChange={(v) => toggleMutation.mutate({ id: cat.id, isActive: v ? 1 : 0 })}
                />
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(cat)}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-destructive"
                  onClick={() => { if (confirm("ลบหมวดหมู่นี้?")) deleteMutation.mutate({ id: cat.id }); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>ชื่อหมวดหมู่</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น ชาเขียว, ผงมัทฉะ" className="mt-1" />
            </div>
            <div>
              <Label>คำอธิบาย</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="คำอธิบายหมวดหมู่" className="mt-1" rows={2} />
            </div>
            <div>
              <Label>ลำดับการแสดง</Label>
              <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
            <Button
              disabled={!name.trim() || createMutation.isPending || updateMutation.isPending}
              onClick={() => {
                if (editId) updateMutation.mutate({ id: editId, name, description, sortOrder });
                else createMutation.mutate({ name, description, sortOrder });
              }}
            >
              {editId ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Product Management ──
function ProductTab() {
  const utils = trpc.useUtils();
  const { data: productsData, isLoading } = trpc.shopProducts.listAll.useQuery({ limit: 100 });
  const { data: categories } = trpc.shopCategories.listAll.useQuery();
  const [showDialog, setShowDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    name: "", sku: "", description: "", categoryId: "",
    retailPrice: "", wholesalePrice: "", wholesaleMinQty: "10",
    unit: "ชิ้น", stock: "0", isFeatured: false, imageUrl: "",
    commissionType: "none" as "none" | "percent" | "fixed",
    commissionValue: "",
    costPrice: "", // ต้นทุนต่อชิ้น (บาท)
  });

  const createMutation = trpc.shopProducts.create.useMutation({
    onSuccess: () => { toast.success("สร้างสินค้าแล้ว"); utils.shopProducts.listAll.invalidate(); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const updateMutation = trpc.shopProducts.update.useMutation({
    onSuccess: () => { toast.success("อัปเดตแล้ว"); utils.shopProducts.listAll.invalidate(); setShowDialog(false); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMutation = trpc.shopProducts.delete.useMutation({
    onSuccess: () => { toast.success("ลบแล้ว"); utils.shopProducts.listAll.invalidate(); },
    onError: (e) => toast.error(e.message),
  });
  const toggleMutation = trpc.shopProducts.update.useMutation({
    onSuccess: () => utils.shopProducts.listAll.invalidate(),
  });
  const uploadImageMutation = trpc.shopProducts.uploadImage.useMutation({
    onSuccess: (data) => {
      setForm(f => ({ ...f, imageUrl: data.url }));
      toast.success("อัปโหลดรูปแล้ว");
    },
    onError: (e) => toast.error(e.message),
  });

  const openCreate = () => {
    setEditId(null);
    setForm({ name: "", sku: "", description: "", categoryId: "", retailPrice: "", wholesalePrice: "", wholesaleMinQty: "10", unit: "ชิ้น", stock: "0", isFeatured: false, imageUrl: "", commissionType: "none", commissionValue: "", costPrice: "" });
    setShowDialog(true);
  };
  const openEdit = (p: any) => {
    setEditId(p.id);
    setForm({
      name: p.name, sku: p.sku || "", description: String(p.description || ""),
      categoryId: p.categoryId ? String(p.categoryId) : "",
      retailPrice: String(p.retailPrice / 100), wholesalePrice: p.wholesalePrice ? String(p.wholesalePrice / 100) : "",
      wholesaleMinQty: String(p.wholesaleMinQty || 10), unit: p.unit || "ชิ้น",
      stock: String(p.stock), isFeatured: !!p.isFeatured, imageUrl: p.imageUrl || "",
      commissionType: (p as any).commissionType || "none",
      commissionValue: (p as any).commissionValue ? String((p as any).commissionValue) : "",
      costPrice: (p as any).costPrice ? String((p as any).costPrice / 100) : "",
    });
    setShowDialog(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ต้องไม่เกิน 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadImageMutation.mutate({ fileName: file.name, base64, contentType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    const retailPrice = Math.round(parseFloat(form.retailPrice) * 100);
    const wholesalePrice = form.wholesalePrice ? Math.round(parseFloat(form.wholesalePrice) * 100) : undefined;
    if (isNaN(retailPrice) || retailPrice <= 0) { toast.error("กรุณากรอกราคาปลีกที่ถูกต้อง"); return; }

    const data: any = {
      name: form.name,
      sku: form.sku || undefined,
      description: form.description || undefined,
      categoryId: form.categoryId ? parseInt(form.categoryId) : undefined,
      retailPrice,
      wholesalePrice,
      wholesaleMinQty: parseInt(form.wholesaleMinQty) || 10,
      unit: form.unit,
      stock: parseInt(form.stock) || 0,
      isFeatured: form.isFeatured ? 1 : 0,
      imageUrl: form.imageUrl || undefined,
      commissionType: form.commissionType !== "none" ? form.commissionType : null,
      commissionValue: form.commissionValue ? parseInt(form.commissionValue) : null,
      costPrice: form.costPrice ? Math.round(parseFloat(form.costPrice) * 100) : null,
    };

    if (editId) {
      updateMutation.mutate({ id: editId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const products = productsData?.products || [];

  return (
    <div className="space-y-3">
      <Button size="sm" onClick={openCreate} className="gap-1">
        <Plus className="w-4 h-4" /> เพิ่มสินค้า
      </Button>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-20 bg-muted rounded animate-pulse" />)}</div>
      ) : products.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>ยังไม่มีสินค้า</p>
        </div>
      ) : (
        products.map((p) => (
          <Card key={p.id}>
            <CardContent className="p-3">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-muted rounded-lg shrink-0 overflow-hidden">
                  {p.imageUrl ? (
                    <img src={String(p.imageUrl)} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-sm truncate">{p.name}</span>
                    {!p.isActive && <Badge variant="secondary" className="text-[10px]">ปิด</Badge>}
                    {p.isFeatured ? <Badge className="bg-amber-500 text-white text-[10px]">แนะนำ</Badge> : null}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-primary font-bold text-sm">฿{formatPrice(p.retailPrice)}</span>
                    {p.wholesalePrice && (
                      <span className="text-xs text-muted-foreground">ส่ง ฿{formatPrice(p.wholesalePrice)}</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    สต็อก: {p.stock} {p.unit}
                    {(p as any).costPrice > 0 && (
                      <span className="ml-2">• ต้นทุน ฿{formatPrice((p as any).costPrice)} • <span className={p.retailPrice - (p as any).costPrice >= 0 ? "text-green-600" : "text-red-600"}>กำไร ฿{formatPrice(p.retailPrice - (p as any).costPrice)}</span></span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <Switch
                    checked={!!p.isActive}
                    onCheckedChange={(v) => toggleMutation.mutate({ id: p.id, isActive: v ? 1 : 0 })}
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(p)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                    onClick={() => { if (confirm("ลบสินค้านี้?")) deleteMutation.mutate({ id: p.id }); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "แก้ไขสินค้า" : "เพิ่มสินค้าใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Image */}
            <div>
              <Label>รูปสินค้า</Label>
              <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
              {form.imageUrl ? (
                <div className="mt-1 relative w-32 h-32">
                  <img src={form.imageUrl} className="w-full h-full object-cover rounded-lg" />
                  <Button
                    variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6"
                    onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline" className="mt-1 gap-1" size="sm"
                  disabled={uploadImageMutation.isPending}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadImageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                  อัปโหลดรูป
                </Button>
              )}
            </div>
            <div>
              <Label>ชื่อสินค้า *</Label>
              <Input value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={(e) => setForm(f => ({ ...f, sku: e.target.value }))} className="mt-1" placeholder="รหัสสินค้า" />
              </div>
              <div>
                <Label>หมวดหมู่</Label>
                <Select value={form.categoryId} onValueChange={(v) => setForm(f => ({ ...f, categoryId: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="เลือก" /></SelectTrigger>
                  <SelectContent>
                    {categories?.map(c => <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>คำอธิบาย</Label>
              <Textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="mt-1" rows={3} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ราคาปลีก (บาท) *</Label>
                <Input type="number" step="0.01" value={form.retailPrice} onChange={(e) => setForm(f => ({ ...f, retailPrice: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>ราคาส่ง (บาท)</Label>
                <Input type="number" step="0.01" value={form.wholesalePrice} onChange={(e) => setForm(f => ({ ...f, wholesalePrice: e.target.value }))} className="mt-1" placeholder="ไม่ระบุ = ไม่มีราคาส่ง" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>ขั้นต่ำราคาส่ง</Label>
                <Input type="number" value={form.wholesaleMinQty} onChange={(e) => setForm(f => ({ ...f, wholesaleMinQty: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>หน่วย</Label>
                <Input value={form.unit} onChange={(e) => setForm(f => ({ ...f, unit: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>สต็อก</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.isFeatured} onCheckedChange={(v) => setForm(f => ({ ...f, isFeatured: v }))} />
              <Label>สินค้าแนะนำ</Label>
            </div>

            {/* Cost Price */}
            <div className="border-t pt-3 mt-3">
              <Label className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Banknote className="w-4 h-4" />
                ต้นทุนสินค้า
              </Label>
              <div>
                <Label className="text-xs">ต้นทุนต่อชิ้น (บาท)</Label>
                <Input
                  type="number" step="0.01" min="0"
                  value={form.costPrice}
                  onChange={(e) => setForm(f => ({ ...f, costPrice: e.target.value }))}
                  className="mt-1"
                  placeholder="เช่น 50 = 50 บาท"
                />
                {form.costPrice && form.retailPrice && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    กำไรต่อชิ้น: <span className={parseFloat(form.retailPrice) - parseFloat(form.costPrice) >= 0 ? "text-green-600 font-medium" : "text-red-600 font-medium"}>฿{(parseFloat(form.retailPrice) - parseFloat(form.costPrice)).toFixed(2)}</span>
                    {" "}({((parseFloat(form.retailPrice) - parseFloat(form.costPrice)) / parseFloat(form.retailPrice) * 100).toFixed(1)}%)
                  </p>
                )}
              </div>
            </div>

            {/* Commission Settings (Mode A: ตั้งจากสินค้า) */}
            <div className="border-t pt-3 mt-3">
              <Label className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Percent className="w-4 h-4" />
                คอมมิชชั่น (โหมดตั้งจากสินค้า)
              </Label>
              <p className="text-[11px] text-muted-foreground mb-2">ใช้เมื่อสาขาตั้งโหมดคอมมิชชั่น "ตามสินค้า"</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">ประเภท</Label>
                  <Select value={form.commissionType} onValueChange={(v) => setForm(f => ({ ...f, commissionType: v as any }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">ไม่มี</SelectItem>
                      <SelectItem value="percent">
                        <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> เปอร์เซ็นต์</span>
                      </SelectItem>
                      <SelectItem value="fixed">
                        <span className="flex items-center gap-1"><Banknote className="w-3 h-3" /> บาทต่อชิ้น</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.commissionType !== "none" && (
                  <div>
                    <Label className="text-xs">{form.commissionType === "percent" ? "% คอมมิชชั่น" : "บาทต่อชิ้น"}</Label>
                    <Input
                      type="number"
                      value={form.commissionValue}
                      onChange={(e) => setForm(f => ({ ...f, commissionValue: e.target.value }))}
                      className="mt-1"
                      placeholder={form.commissionType === "percent" ? "เช่น 500 = 5%" : "เช่น 2000 = 20 บาท"}
                    />
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {form.commissionType === "percent"
                        ? `หน่วย: basis points (100 = 1%, 500 = 5%) → ${form.commissionValue ? (parseInt(form.commissionValue) / 100).toFixed(2) : "0"}%`
                        : `หน่วย: สตางค์ (100 = 1 บาท, 2000 = 20 บาท) → ${form.commissionValue ? (parseInt(form.commissionValue) / 100).toFixed(2) : "0"} บาท`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>ยกเลิก</Button>
            <Button
              disabled={!form.name.trim() || !form.retailPrice || createMutation.isPending || updateMutation.isPending}
              onClick={handleSubmit}
            >
              {createMutation.isPending || updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {editId ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Page ──
export default function AdminShopProducts() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();

  if (loading) return null;
  if (!session || !isSuperAdmin) {
    setLocation("/admin");
    return null;
  }

  return (
    <AdminPageWrapper title="จัดการร้านค้า" backPath="/admin" loading={false}>
      <div className="p-4 pb-8">
        <Tabs defaultValue="products">
          <TabsList className="w-full">
            <TabsTrigger value="products" className="flex-1 gap-1">
              <Package className="w-4 h-4" /> สินค้า
            </TabsTrigger>
            <TabsTrigger value="categories" className="flex-1 gap-1">
              <FolderOpen className="w-4 h-4" /> หมวดหมู่
            </TabsTrigger>
          </TabsList>
          <TabsContent value="products" className="mt-4">
            <ProductTab />
          </TabsContent>
          <TabsContent value="categories" className="mt-4">
            <CategoryTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminPageWrapper>
  );
}
