import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Star, Plus, Edit2, Loader2, Coffee, UtensilsCrossed, Cherry, Percent, Gift, Package, ImagePlus, X, Image as ImageIcon, Trash2, Settings2, Tag,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useEffect, useState, useRef } from "react";
import { toast } from "sonner";

// Icon mapping for dynamic categories
const ICON_MAP: Record<string, typeof Coffee> = {
  coffee: Coffee,
  "utensils-crossed": UtensilsCrossed,
  cherry: Cherry,
  percent: Percent,
  gift: Gift,
  tag: Tag,
  star: Star,
  package: Package,
};

function getCategoryIcon(iconName: string) {
  return ICON_MAP[iconName] || Gift;
}

interface RewardForm {
  name: string;
  description: string;
  pointsCost: string;
  categoryId: string;
  stock: string;
  imageUrl: string;
}

const emptyForm: RewardForm = { name: "", description: "", pointsCost: "", categoryId: "", stock: "", imageUrl: "" };

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(",")[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Category Management Dialog ──
function CategoryManager({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: categories, refetch } = trpc.rewardCategories.list.useQuery(undefined, { enabled: open });
  const createMut = trpc.rewardCategories.create.useMutation({ onSuccess: () => { refetch(); setNewName(""); toast.success("สร้างหมวดหมู่สำเร็จ"); }, onError: (e) => toast.error(e.message) });
  const updateMut = trpc.rewardCategories.update.useMutation({ onSuccess: () => { refetch(); setEditingCat(null); toast.success("อัปเดตสำเร็จ"); }, onError: (e) => toast.error(e.message) });
  const deleteMut = trpc.rewardCategories.delete.useMutation({ onSuccess: () => { refetch(); toast.success("ลบสำเร็จ"); }, onError: (e) => toast.error(e.message) });
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("gift");
  const [newColor, setNewColor] = useState("bg-gray-50 text-gray-600");
  const [editingCat, setEditingCat] = useState<any>(null);

  const COLOR_OPTIONS = [
    { value: "bg-blue-50 text-blue-600", label: "น้ำเงิน", preview: "bg-blue-500" },
    { value: "bg-orange-50 text-orange-600", label: "ส้ม", preview: "bg-orange-500" },
    { value: "bg-pink-50 text-pink-600", label: "ชมพู", preview: "bg-pink-500" },
    { value: "bg-green-50 text-green-600", label: "เขียว", preview: "bg-green-500" },
    { value: "bg-purple-50 text-purple-600", label: "ม่วง", preview: "bg-purple-500" },
    { value: "bg-red-50 text-red-600", label: "แดง", preview: "bg-red-500" },
    { value: "bg-yellow-50 text-yellow-600", label: "เหลือง", preview: "bg-yellow-500" },
    { value: "bg-gray-50 text-gray-600", label: "เทา", preview: "bg-gray-500" },
  ];

  const ICON_OPTIONS = [
    { value: "coffee", label: "เครื่องดื่ม" },
    { value: "utensils-crossed", label: "อาหาร" },
    { value: "cherry", label: "ผลไม้" },
    { value: "percent", label: "ส่วนลด" },
    { value: "gift", label: "ของขวัญ" },
    { value: "tag", label: "แท็ก" },
    { value: "star", label: "ดาว" },
    { value: "package", label: "พัสดุ" },
  ];

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>จัดการหมวดหมู่รางวัล</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Add new category */}
          <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
            <Label className="text-xs font-semibold">เพิ่มหมวดหมู่ใหม่</Label>
            <Input placeholder="ชื่อหมวดหมู่" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <div className="flex gap-2">
              <Select value={newIcon} onValueChange={setNewIcon}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ICON_OPTIONS.map(opt => {
                    const Icon = getCategoryIcon(opt.value);
                    return <SelectItem key={opt.value} value={opt.value}><span className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5" />{opt.label}</span></SelectItem>;
                  })}
                </SelectContent>
              </Select>
              <Select value={newColor} onValueChange={setNewColor}>
                <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COLOR_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}><span className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded-full ${opt.preview}`} />{opt.label}</span></SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button size="sm" className="w-full" disabled={!newName.trim() || createMut.isPending} onClick={() => createMut.mutate({ name: newName.trim(), icon: newIcon, color: newColor })}>
              {createMut.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" /> : <Plus className="h-3.5 w-3.5 mr-1" />}
              เพิ่ม
            </Button>
          </div>

          {/* Existing categories */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold">หมวดหมู่ทั้งหมด</Label>
            {categories?.map((cat: any) => {
              const Icon = getCategoryIcon(cat.icon);
              const isEditing = editingCat?.id === cat.id;
              return (
                <div key={cat.id} className={`flex items-center gap-2 p-2 rounded-lg border ${!cat.isActive ? "opacity-50" : ""}`}>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${cat.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {isEditing ? (
                    <div className="flex-1 min-w-0 space-y-1">
                      <Input value={editingCat.name} onChange={(e) => setEditingCat({ ...editingCat, name: e.target.value })} className="h-7 text-sm" />
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setEditingCat(null)}>ยกเลิก</Button>
                        <Button size="sm" className="h-6 text-xs" onClick={() => updateMut.mutate({ id: cat.id, name: editingCat.name })}>บันทึก</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="flex-1 text-sm font-medium truncate">{cat.name}</span>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingCat({ id: cat.id, name: cat.name })}>
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => updateMut.mutate({ id: cat.id, isActive: cat.isActive ? 0 : 1 })}>
                          <Switch checked={!!cat.isActive} className="scale-75" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => { if (confirm("ลบหมวดหมู่นี้?")) deleteMut.mutate({ id: cat.id }); }}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {(!categories || categories.length === 0) && (
              <p className="text-xs text-muted-foreground text-center py-4">ยังไม่มีหมวดหมู่</p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>ปิด</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminRewards() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<RewardForm>(emptyForm);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) { toast.error("ไม่มีสิทธิ์เข้าถึง (Super Admin เท่านั้น)"); setLocation("/admin"); }
  }, [loading, session, isSuperAdmin, setLocation]);

  const { data: rewards, isLoading, refetch } = trpc.loyalty.allRewards.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const { data: categories } = trpc.rewardCategories.listActive.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const { data: allOptionGroups } = trpc.optionGroups.list.useQuery(undefined, { enabled: !!session && isSuperAdmin });

  const uploadImageMutation = trpc.loyalty.uploadRewardImage.useMutation();
  const setMenuGroupsMutation = trpc.optionGroups.setMenuGroups.useMutation();
  const trpcUtils = trpc.useUtils();

  const createMutation = trpc.loyalty.createReward.useMutation({
    onSuccess: async (data) => {
      // Save option groups for the new reward
      if (selectedGroupIds.length > 0) {
        await setMenuGroupsMutation.mutateAsync({ menuType: "reward", menuId: data.id, groupIds: selectedGroupIds });
      }
      toast.success("สร้างรางวัลสำเร็จ!");
      closeForm();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.loyalty.updateReward.useMutation({
    onSuccess: async () => {
      // Save option groups for the edited reward
      if (editingId) {
        await setMenuGroupsMutation.mutateAsync({ menuType: "reward", menuId: editingId, groupIds: selectedGroupIds });
      }
      toast.success("อัปเดตรางวัลสำเร็จ!");
      closeForm();
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.loyalty.deleteReward.useMutation({
    onSuccess: () => {
      toast.success("ลบรางวัลสำเร็จ!");
      setDeleteTarget(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setImagePreview(null);
    setSelectedGroupIds([]);
  };

  const handleEdit = async (reward: any) => {
    setEditingId(reward.id);
    // Find matching category by name
    const matchedCat = categories?.find((c: any) => {
      const legacyMap: Record<string, string> = { drink: "เครื่องดื่ม", food: "อาหาร/ขนม", topping: "ท็อปปิ้ง", discount: "ส่วนลด", special: "พิเศษ" };
      return c.name === legacyMap[reward.category] || String(c.id) === String(reward.category);
    });
    setForm({
      name: reward.name,
      description: reward.description || "",
      pointsCost: String(reward.pointsCost),
      categoryId: matchedCat ? String(matchedCat.id) : (categories?.[0] ? String(categories[0].id) : ""),
      stock: reward.stock !== null ? String(reward.stock) : "",
      imageUrl: reward.imageUrl || "",
    });
    setImagePreview(reward.imageUrl || null);
    // Load existing option group links
    try {
      const groupIds = await trpcUtils.optionGroups.getMenuGroups.fetch({ menuType: "reward", menuId: reward.id });
      setSelectedGroupIds(groupIds);
    } catch {
      setSelectedGroupIds([]);
    }
    setShowForm(true);
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("กรุณาเลือกไฟล์รูปภาพ"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ใหญ่เกินไป (สูงสุด 5MB)"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const result = await uploadImageMutation.mutateAsync({ imageBase64: base64, imageType: file.type });
      setForm(f => ({ ...f, imageUrl: result.url }));
      toast.success("อัปโหลดรูปสำเร็จ!");
    } catch (err: any) {
      toast.error("อัปโหลดรูปล้มเหลว: " + (err.message || "ลองใหม่อีกครั้ง"));
      setImagePreview(form.imageUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setForm(f => ({ ...f, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const toggleGroupId = (id: number) => {
    setSelectedGroupIds(prev => prev.includes(id) ? prev.filter(g => g !== id) : [...prev, id]);
  };

  const handleSubmit = () => {
    if (!form.name.trim()) { toast.error("กรุณาใส่ชื่อรางวัล"); return; }
    const cost = parseInt(form.pointsCost);
    if (isNaN(cost) || cost < 1) { toast.error("กรุณาใส่แต้มที่ถูกต้อง"); return; }

    // Find category name from ID for backward compat
    const cat = categories?.find((c: any) => String(c.id) === form.categoryId);
    const categoryName = cat?.name || "special";

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        name: form.name,
        description: form.description || undefined,
        pointsCost: cost,
        category: categoryName,
        imageUrl: form.imageUrl || undefined,
        stock: form.stock ? parseInt(form.stock) : null,
      });
    } else {
      createMutation.mutate({
        name: form.name,
        description: form.description || undefined,
        pointsCost: cost,
        category: categoryName,
        imageUrl: form.imageUrl || undefined,
        stock: form.stock ? parseInt(form.stock) : undefined,
      });
    }
  };

  const handleToggleActive = (reward: any) => {
    updateMutation.mutate({ id: reward.id, isActive: reward.isActive ? 0 : 1 });
  };

  // Helper: get category display info from reward
  const getCategoryDisplay = (reward: any) => {
    // Try to match by category name in categories list
    const legacyMap: Record<string, string> = { drink: "เครื่องดื่ม", food: "อาหาร/ขนม", topping: "ท็อปปิ้ง", discount: "ส่วนลด", special: "พิเศษ" };
    const catName = legacyMap[reward.category] || reward.category;
    const cat = categories?.find((c: any) => c.name === catName);
    if (cat) {
      return { label: cat.name, icon: getCategoryIcon(cat.icon), color: cat.color };
    }
    // Fallback for legacy
    const fallbackMap: Record<string, { label: string; icon: typeof Coffee; color: string }> = {
      drink: { label: "เครื่องดื่ม", icon: Coffee, color: "bg-blue-50 text-blue-600" },
      food: { label: "อาหาร/ขนม", icon: UtensilsCrossed, color: "bg-orange-50 text-orange-600" },
      topping: { label: "ท็อปปิ้ง", icon: Cherry, color: "bg-pink-50 text-pink-600" },
      discount: { label: "ส่วนลด", icon: Percent, color: "bg-green-50 text-green-600" },
      special: { label: "พิเศษ", icon: Gift, color: "bg-purple-50 text-purple-600" },
    };
    return fallbackMap[reward.category] || { label: reward.category, icon: Gift, color: "bg-gray-50 text-gray-600" };
  };

  if (loading || !session) return null;

  const activeRewards = rewards?.filter(r => r.isActive) ?? [];
  const inactiveRewards = rewards?.filter(r => !r.isActive) ?? [];
  const activeGroups = allOptionGroups?.filter((g: any) => g.isActive) ?? [];

  return (
    <AdminPageWrapper title="จัดการรางวัล" backPath="/admin" loading={isLoading}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">รางวัลสะสมแต้ม</p>
            <p className="text-xs text-muted-foreground">{activeRewards.length} รายการที่ใช้งาน</p>
          </div>
          <div className="flex gap-1.5">
            <Button size="sm" variant="outline" onClick={() => setShowCategoryManager(true)}>
              <Tag className="h-3.5 w-3.5 mr-1" /> หมวดหมู่
            </Button>
            <Button size="sm" onClick={() => { setEditingId(null); setForm({ ...emptyForm, categoryId: categories?.[0] ? String(categories[0].id) : "" }); setImagePreview(null); setSelectedGroupIds([]); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> เพิ่มรางวัล
            </Button>
          </div>
        </div>

        {/* Active Rewards */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="border-0 shadow-sm animate-pulse">
                <CardContent className="p-4"><div className="h-16 bg-muted rounded" /></CardContent>
              </Card>
            ))}
          </div>
        ) : !rewards?.length ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center">
              <Star className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">ยังไม่มีรางวัล</p>
              <p className="text-xs text-muted-foreground mt-1">กดปุ่ม "เพิ่มรางวัล" เพื่อเริ่มต้น</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {activeRewards.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground px-1">ใช้งานอยู่</h3>
                {activeRewards.map(reward => {
                  const catDisplay = getCategoryDisplay(reward);
                  const CatIcon = catDisplay.icon;
                  return (
                    <Card key={reward.id} className="border-0 shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <div className="flex">
                          {reward.imageUrl ? (
                            <img src={reward.imageUrl} alt={reward.name} className="w-16 h-16 object-cover flex-shrink-0 rounded-l-lg" />
                          ) : (
                            <div className={`w-16 h-16 flex items-center justify-center flex-shrink-0 ${catDisplay.color}`}>
                              <CatIcon className="h-6 w-6" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 p-3">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{reward.name}</p>
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(reward)}>
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget({ id: reward.id, name: reward.name })}>
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            {reward.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{reward.description}</p>}
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className="text-xs font-semibold text-primary">{reward.pointsCost} แต้ม</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted">{catDisplay.label}</span>
                              {reward.stock !== null && (
                                <span className="text-[10px] text-muted-foreground">
                                  <Package className="h-3 w-3 inline mr-0.5" />
                                  คงเหลือ {reward.stock}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {inactiveRewards.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-muted-foreground px-1">ปิดใช้งาน</h3>
                {inactiveRewards.map(reward => {
                  const catDisplay = getCategoryDisplay(reward);
                  const CatIcon = catDisplay.icon;
                  return (
                    <Card key={reward.id} className="border-0 shadow-sm opacity-60">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          {reward.imageUrl ? (
                            <img src={reward.imageUrl} alt={reward.name} className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                              <CatIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{reward.name}</p>
                            <p className="text-xs text-muted-foreground">{reward.pointsCost} แต้ม</p>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => handleToggleActive(reward)}>
                              เปิดใช้
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget({ id: reward.id, name: reward.name })}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={() => closeForm()}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "แก้ไขรางวัล" : "เพิ่มรางวัลใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5" />
                รูปภาพรางวัล
              </Label>
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover rounded-lg border" />
                  {uploading && (
                    <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-white" />
                    </div>
                  )}
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={handleRemoveImage} disabled={uploading}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-2 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <ImagePlus className="h-8 w-8 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground">คลิกเพื่ออัปโหลดรูปภาพ</span>
                  <span className="text-[10px] text-muted-foreground/60">JPG, PNG สูงสุด 5MB</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </div>

            <div className="space-y-2">
              <Label>ชื่อรางวัล *</Label>
              <Input placeholder="เช่น Matcha Latte 1 แก้ว" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>รายละเอียด</Label>
              <Textarea
                placeholder="เช่น Set A (กระต่าย) Hibi Matcha Sifter Weight&#10;รายละเอียดเพิ่มเติม..."
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                rows={4}
                className="resize-y"
              />
            </div>
            <div className="space-y-2">
              <Label>แต้มที่ต้องใช้ *</Label>
              <Input type="number" placeholder="เช่น 250" value={form.pointsCost} onChange={(e) => setForm(f => ({ ...f, pointsCost: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>หมวดหมู่</Label>
              <Select value={form.categoryId} onValueChange={(v) => setForm(f => ({ ...f, categoryId: v }))}>
                <SelectTrigger><SelectValue placeholder="เลือกหมวดหมู่" /></SelectTrigger>
                <SelectContent>
                  {categories?.map((cat: any) => {
                    const Icon = getCategoryIcon(cat.icon);
                    return (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5" />
                          {cat.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>จำนวนจำกัด (ว่างไว้ = ไม่จำกัด)</Label>
              <Input type="number" placeholder="เช่น 100" value={form.stock} onChange={(e) => setForm(f => ({ ...f, stock: e.target.value }))} />
            </div>

            {/* Option Groups Picker */}
            <div>
              <Label className="flex items-center gap-1.5 mb-2">
                <Settings2 className="h-3.5 w-3.5" />
                ตัวเลือกสำหรับรางวัลนี้
              </Label>
              {activeGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-center">
                  ยังไม่มีกลุ่มตัวเลือก — สร้างได้ที่หน้า "กลุ่มตัวเลือก"
                </p>
              ) : (
                <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">เลือกกลุ่มตัวเลือกที่ลูกค้าต้องกรอกเมื่อแลกรางวัลนี้ (เช่น ไซส์ ความหวาน)</p>
                  {activeGroups.map((group: any) => (
                    <label key={group.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-background cursor-pointer transition-colors">
                      <Checkbox
                        checked={selectedGroupIds.includes(group.id)}
                        onCheckedChange={() => toggleGroupId(group.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium">{group.name}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="outline" className="text-[9px] px-1 py-0">
                            {group.type === "single" ? "เลือก 1" : "เลือกหลาย"}
                          </Badge>
                          {group.isRequired ? (
                            <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-red-50 text-red-600">บังคับ</Badge>
                          ) : null}
                          {group.items?.length > 0 && (
                            <span className="text-[9px] text-muted-foreground">
                              ({group.items.map((i: any) => i.name).join(", ")})
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {editingId && (
              <div className="flex items-center justify-between pt-2 border-t">
                <Label>สถานะ</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">ปิดใช้</span>
                  <Switch
                    checked={true}
                    onCheckedChange={() => {
                      const reward = rewards?.find(r => r.id === editingId);
                      if (reward) handleToggleActive(reward);
                    }}
                  />
                  <span className="text-xs text-muted-foreground">เปิดใช้</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeForm}>ยกเลิก</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || uploading}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null}
              {editingId ? "บันทึก" : "สร้างรางวัล"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ลบรางวัล</AlertDialogTitle>
            <AlertDialogDescription>ต้องการลบ "{deleteTarget?.name}" ใช่ไหม? การกระทำนี้ไม่สามารถย้อนกลับได้</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              ลบ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Category Manager Dialog */}
      <CategoryManager open={showCategoryManager} onClose={() => { setShowCategoryManager(false); trpcUtils.rewardCategories.listActive.invalidate(); }} />
    </AdminPageWrapper>
  );
}
