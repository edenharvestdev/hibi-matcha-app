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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Edit, Trash2, GripVertical, Coffee, Loader2, Settings2 } from "lucide-react";
import { useState, useEffect } from "react";

export default function AdminReviewMenu() {
  const { session, loading, isSuperAdmin, isAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [formData, setFormData] = useState({ code: "", name: "", description: "", sortOrder: 0 });
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) setLocation("/login");
  }, [loading, session, isAdmin, setLocation]);

  const { data: menuItems, refetch } = trpc.reviewMenu.listAll.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const { data: allOptionGroups } = trpc.optionGroups.list.useQuery(undefined, { enabled: !!session && isSuperAdmin });

  const createMutation = trpc.reviewMenu.create.useMutation({
    onSuccess: async (data) => {
      // Save option groups for the new menu item
      if (selectedGroupIds.length > 0) {
        await setMenuGroupsMutation.mutateAsync({ menuType: "review", menuId: data.id, groupIds: selectedGroupIds });
      }
      toast.success("สร้างเมนูสำเร็จ"); refetch(); resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.reviewMenu.update.useMutation({
    onSuccess: async () => {
      // Save option groups for the edited menu item
      if (editItem) {
        await setMenuGroupsMutation.mutateAsync({ menuType: "review", menuId: editItem.id, groupIds: selectedGroupIds });
      }
      toast.success("อัปเดตเมนูสำเร็จ"); refetch(); resetForm();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.reviewMenu.delete.useMutation({
    onSuccess: () => { toast.success("ลบเมนูสำเร็จ"); refetch(); setDeleteConfirm(null); },
    onError: (err) => toast.error(err.message),
  });

  const setMenuGroupsMutation = trpc.optionGroups.setMenuGroups.useMutation();

  const resetForm = () => {
    setShowForm(false);
    setEditItem(null);
    setFormData({ code: "", name: "", description: "", sortOrder: 0 });
    setSelectedGroupIds([]);
  };

  const openEdit = async (item: any) => {
    setEditItem(item);
    setFormData({
      code: item.code,
      name: item.name,
      description: item.description || "",
      sortOrder: item.sortOrder,
    });
    // Load existing option group links
    try {
      const groupIds = await trpcUtils.optionGroups.getMenuGroups.fetch({ menuType: "review", menuId: item.id });
      setSelectedGroupIds(groupIds);
    } catch {
      setSelectedGroupIds([]);
    }
    setShowForm(true);
  };

  const trpcUtils = trpc.useUtils();

  const handleSubmit = () => {
    if (!formData.code.trim() || !formData.name.trim()) {
      toast.error("กรุณากรอกรหัสและชื่อเมนู");
      return;
    }
    if (editItem) {
      updateMutation.mutate({
        id: editItem.id,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sortOrder: formData.sortOrder,
      });
    } else {
      createMutation.mutate({
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        sortOrder: formData.sortOrder,
      });
    }
  };

  const toggleActive = (item: any) => {
    updateMutation.mutate({ id: item.id, isActive: item.isActive ? 0 : 1 });
  };

  const toggleGroupId = (groupId: number) => {
    setSelectedGroupIds(prev =>
      prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]
    );
  };

  if (loading || !session) return null;

  const activeGroups = allOptionGroups?.filter((g: any) => g.isActive) ?? [];

  return (
    <AdminPageWrapper title="จัดการเมนูรีวิว" backPath="/admin">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">เมนูรีวิว</h2>
            <p className="text-xs text-muted-foreground">เมนูที่ลูกค้าสามารถเลือกได้หลังรับโค้ดรีวิว</p>
          </div>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
            <Plus className="h-4 w-4 mr-1" /> เพิ่ม
          </Button>
        </div>

        {/* Menu Items List */}
        {!menuItems?.length ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Coffee className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm font-medium">ยังไม่มีเมนูรีวิว</p>
              <p className="text-xs text-muted-foreground mt-1">กดปุ่ม "เพิ่ม" เพื่อสร้างเมนูใหม่</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {menuItems.map((item: any, idx: number) => (
              <Card key={item.id} className={`border-0 shadow-sm ${!item.isActive ? 'opacity-50' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground mt-1">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-xs font-mono">{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{item.code}</span>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={!!item.isActive}
                        onCheckedChange={() => toggleActive(item)}
                        className="scale-75"
                      />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(item)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteConfirm(item)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={() => resetForm()}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? "แก้ไขเมนู" : "เพิ่มเมนูรีวิว"}</DialogTitle>
            <DialogDescription>
              {editItem ? "แก้ไขรายละเอียดเมนู" : "เพิ่มเมนูใหม่สำหรับลูกค้าเลือกหลังรับโค้ดรีวิว"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>รหัสเมนู</Label>
              <Input
                placeholder="เช่น ML, HJ, GM"
                value={formData.code}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                maxLength={20}
                className="font-mono"
              />
              <p className="text-[10px] text-muted-foreground mt-1">ตัวอักษรพิมพ์ใหญ่ ใช้ในโค้ด</p>
            </div>
            <div>
              <Label>ชื่อเมนู</Label>
              <Input
                placeholder="เช่น Matcha Latte"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                maxLength={255}
              />
            </div>
            <div>
              <Label>คำอธิบาย (ไม่บังคับ)</Label>
              <Textarea
                placeholder="รายละเอียดเพิ่มเติม..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={2}
              />
            </div>
            <div>
              <Label>ลำดับการแสดง</Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                min={0}
              />
            </div>

            {/* Option Groups Picker */}
            <div>
              <Label className="flex items-center gap-1.5 mb-2">
                <Settings2 className="h-3.5 w-3.5" />
                ตัวเลือกสำหรับเมนูนี้
              </Label>
              {activeGroups.length === 0 ? (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-3 text-center">
                  ยังไม่มีกลุ่มตัวเลือก — สร้างได้ที่หน้า "กลุ่มตัวเลือก"
                </p>
              ) : (
                <div className="space-y-2 bg-muted/30 rounded-lg p-3">
                  <p className="text-[10px] text-muted-foreground mb-1">เลือกกลุ่มตัวเลือกที่ลูกค้าต้องกรอกเมื่อเลือกเมนูนี้</p>
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
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={resetForm}>ยกเลิก</Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {editItem ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent className="max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>ยืนยันลบเมนู</DialogTitle>
            <DialogDescription>
              ลบเมนู <strong>{deleteConfirm?.name}</strong> ({deleteConfirm?.code})? การลบจะไม่สามารถกู้คืนได้
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>ยกเลิก</Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate({ id: deleteConfirm.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              ลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
