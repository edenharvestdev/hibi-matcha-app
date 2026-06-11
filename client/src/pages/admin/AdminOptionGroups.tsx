import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings2, Plus, Pencil, Trash2, GripVertical, ToggleLeft, Loader2, ListChecks, CircleDot } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function AdminOptionGroups() {
  const { session, loading, isStaff } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [showGroupDialog, setShowGroupDialog] = useState(false);
  const [showItemDialog, setShowItemDialog] = useState(false);
  const [editingGroup, setEditingGroup] = useState<any>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);

  // Form state
  const [groupName, setGroupName] = useState("");
  const [groupType, setGroupType] = useState<"single" | "multi">("single");
  const [groupRequired, setGroupRequired] = useState(false);
  const [itemName, setItemName] = useState("");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  const { data: groups, isLoading, refetch } = trpc.optionGroups.list.useQuery(undefined, { enabled: !!session });

  const createGroupMutation = trpc.optionGroups.create.useMutation({
    onSuccess: () => { toast.success("สร้างกลุ่มตัวเลือกสำเร็จ"); refetch(); closeGroupDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const updateGroupMutation = trpc.optionGroups.update.useMutation({
    onSuccess: () => { toast.success("แก้ไขสำเร็จ"); refetch(); closeGroupDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteGroupMutation = trpc.optionGroups.delete.useMutation({
    onSuccess: () => { toast.success("ลบกลุ่มสำเร็จ"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const addItemMutation = trpc.optionGroups.addItem.useMutation({
    onSuccess: () => { toast.success("เพิ่มตัวเลือกสำเร็จ"); refetch(); closeItemDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const updateItemMutation = trpc.optionGroups.updateItem.useMutation({
    onSuccess: () => { toast.success("แก้ไขตัวเลือกสำเร็จ"); refetch(); closeItemDialog(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteItemMutation = trpc.optionGroups.deleteItem.useMutation({
    onSuccess: () => { toast.success("ลบตัวเลือกสำเร็จ"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const closeGroupDialog = () => {
    setShowGroupDialog(false);
    setEditingGroup(null);
    setGroupName("");
    setGroupType("single");
    setGroupRequired(false);
  };

  const closeItemDialog = () => {
    setShowItemDialog(false);
    setEditingItem(null);
    setItemName("");
    setActiveGroupId(null);
  };

  const openEditGroup = (group: any) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupType(group.type);
    setGroupRequired(!!group.isRequired);
    setShowGroupDialog(true);
  };

  const openAddItem = (groupId: number) => {
    setActiveGroupId(groupId);
    setEditingItem(null);
    setItemName("");
    setShowItemDialog(true);
  };

  const openEditItem = (item: any) => {
    setEditingItem(item);
    setItemName(item.name);
    setShowItemDialog(true);
  };

  const handleSaveGroup = () => {
    if (!groupName.trim()) { toast.error("กรุณากรอกชื่อกลุ่ม"); return; }
    if (editingGroup) {
      updateGroupMutation.mutate({ id: editingGroup.id, name: groupName.trim(), type: groupType, isRequired: groupRequired });
    } else {
      createGroupMutation.mutate({ name: groupName.trim(), type: groupType, isRequired: groupRequired });
    }
  };

  const handleSaveItem = () => {
    if (!itemName.trim()) { toast.error("กรุณากรอกชื่อตัวเลือก"); return; }
    if (editingItem) {
      updateItemMutation.mutate({ id: editingItem.id, name: itemName.trim() });
    } else if (activeGroupId) {
      addItemMutation.mutate({ groupId: activeGroupId, name: itemName.trim() });
    }
  };

  const handleToggleGroup = (group: any) => {
    updateGroupMutation.mutate({ id: group.id, isActive: !group.isActive });
  };

  const handleToggleItem = (item: any) => {
    updateItemMutation.mutate({ id: item.id, isActive: !item.isActive });
  };

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="จัดการตัวเลือก (Options)" backPath="/branch" loading={isLoading}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Settings2 className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <p className="font-semibold text-sm">กลุ่มตัวเลือก</p>
              <p className="text-xs text-muted-foreground">เช่น ความหวาน, ร้อน/เย็น, แพ็คแยก</p>
            </div>
          </div>
          <Button size="sm" onClick={() => { setEditingGroup(null); setGroupName(""); setGroupType("single"); setGroupRequired(false); setShowGroupDialog(true); }}>
            <Plus className="h-4 w-4 mr-1" />
            เพิ่มกลุ่ม
          </Button>
        </div>

        {/* Groups List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : !groups || groups.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Settings2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">ยังไม่มีกลุ่มตัวเลือก</p>
              <p className="text-xs text-muted-foreground mt-1">กดปุ่ม "เพิ่มกลุ่ม" เพื่อสร้างกลุ่มตัวเลือกแรก</p>
            </CardContent>
          </Card>
        ) : (
          groups.map((group: any) => (
            <Card key={group.id} className={`border shadow-sm ${!group.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-4">
                {/* Group Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {group.type === "single" ? (
                      <CircleDot className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ListChecks className="h-4 w-4 text-purple-600" />
                    )}
                    <div>
                      <p className="font-semibold text-sm">{group.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${group.type === "single" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
                          {group.type === "single" ? "เลือก 1" : "เลือกหลายรายการ"}
                        </span>
                        {group.isRequired ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 text-red-700">จำเป็น</span>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500">ไม่จำเป็น</span>
                        )}
                        {!group.isActive && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">ปิดใช้งาน</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleToggleGroup(group)}>
                      <ToggleLeft className={`h-4 w-4 ${group.isActive ? "text-green-600" : "text-gray-400"}`} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditGroup(group)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => { if (confirm("ลบกลุ่มนี้? (ตัวเลือกทั้งหมดจะถูกลบด้วย)")) deleteGroupMutation.mutate({ id: group.id }); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-1.5 ml-6">
                  {group.items && group.items.length > 0 ? (
                    group.items.map((item: any) => (
                      <div key={item.id} className={`flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 ${!item.isActive ? "opacity-50" : ""}`}>
                        <div className="flex items-center gap-2">
                          <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                          <span className="text-sm">{item.name}</span>
                          {!item.isActive && <span className="text-[9px] text-amber-600">(ปิด)</span>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleItem(item)}>
                            <ToggleLeft className={`h-3.5 w-3.5 ${item.isActive ? "text-green-600" : "text-gray-400"}`} />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditItem(item)}>
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => { if (confirm("ลบตัวเลือกนี้?")) deleteItemMutation.mutate({ id: item.id }); }}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-2">ยังไม่มีตัวเลือก</p>
                  )}
                  <Button variant="outline" size="sm" className="w-full mt-2 border-dashed" onClick={() => openAddItem(group.id)}>
                    <Plus className="h-3 w-3 mr-1" />
                    เพิ่มตัวเลือก
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Group Dialog */}
      <Dialog open={showGroupDialog} onOpenChange={closeGroupDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingGroup ? "แก้ไขกลุ่มตัวเลือก" : "สร้างกลุ่มตัวเลือกใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ชื่อกลุ่ม</Label>
              <Input placeholder="เช่น ความหวาน, อุณหภูมิ, แพ็คแยก" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
            <div>
              <Label>ประเภท</Label>
              <Select value={groupType} onValueChange={(v) => setGroupType(v as "single" | "multi")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">เลือกได้ 1 รายการ (Radio)</SelectItem>
                  <SelectItem value="multi">เลือกได้หลายรายการ (Checkbox)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={groupRequired} onCheckedChange={setGroupRequired} />
              <Label>จำเป็นต้องเลือก</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeGroupDialog}>ยกเลิก</Button>
            <Button onClick={handleSaveGroup} disabled={createGroupMutation.isPending || updateGroupMutation.isPending}>
              {(createGroupMutation.isPending || updateGroupMutation.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingGroup ? "บันทึก" : "สร้าง"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Item Dialog */}
      <Dialog open={showItemDialog} onOpenChange={closeItemDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editingItem ? "แก้ไขตัวเลือก" : "เพิ่มตัวเลือกใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ชื่อตัวเลือก</Label>
              <Input placeholder="เช่น ไม่หวาน, หวานน้อย, หวานปกติ" value={itemName} onChange={(e) => setItemName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSaveItem()} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeItemDialog}>ยกเลิก</Button>
            <Button onClick={handleSaveItem} disabled={addItemMutation.isPending || updateItemMutation.isPending}>
              {(addItemMutation.isPending || updateItemMutation.isPending) && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              {editingItem ? "บันทึก" : "เพิ่ม"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
