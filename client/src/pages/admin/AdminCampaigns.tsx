import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import AdminPageWrapper from "@/components/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Gift, Calendar, Users, ChevronRight, Loader2, X, Trash2 } from "lucide-react";
import { formatDate, formatDateLong } from "@/lib/dateUtils";

interface MenuOption {
  code: string;
  name: string;
  sizes: { code: string; name: string }[];
  milkOptions?: { code: string; name: string }[];
}

export default function AdminCampaigns() {
  const { session, loading } = useHibiAuth();
  const [, setLocation] = useLocation();

  const [showCreate, setShowCreate] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: campaigns, refetch } = trpc.freeDrinkCampaigns.list.useQuery(undefined, { enabled: !!session });
  const { data: selectedCampaign } = trpc.freeDrinkCampaigns.getById.useQuery({ id: selectedId! }, { enabled: !!selectedId });

  // Create form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [maxCodes, setMaxCodes] = useState(1);
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>([
    { code: "ML", name: "Matcha Latte", sizes: [{ code: "M", name: "M" }, { code: "L", name: "L" }], milkOptions: [{ code: "OAT", name: "นมโอ๊ต" }, { code: "FRE", name: "นมสด" }] },
  ]);

  const createMutation = trpc.freeDrinkCampaigns.create.useMutation({
    onSuccess: () => {
      toast.success("สร้างแคมเปญสำเร็จ");
      setShowCreate(false);
      resetForm();
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateMutation = trpc.freeDrinkCampaigns.update.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตสำเร็จ");
      refetch();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetForm = () => {
    setName(""); setDescription(""); setMaxCodes(1); setValidFrom(""); setValidUntil("");
    setMenuOptions([{ code: "ML", name: "Matcha Latte", sizes: [{ code: "M", name: "M" }, { code: "L", name: "L" }], milkOptions: [{ code: "OAT", name: "นมโอ๊ต" }, { code: "FRE", name: "นมสด" }] }]);
  };

  const addMenuOption = () => {
    setMenuOptions([...menuOptions, { code: "", name: "", sizes: [{ code: "M", name: "M" }], milkOptions: [] }]);
  };

  const removeMenuOption = (idx: number) => {
    setMenuOptions(menuOptions.filter((_, i) => i !== idx));
  };

  const updateMenuOption = (idx: number, field: keyof MenuOption, value: any) => {
    const updated = [...menuOptions];
    (updated[idx] as any)[field] = value;
    setMenuOptions(updated);
  };

  const addSize = (menuIdx: number) => {
    const updated = [...menuOptions];
    updated[menuIdx].sizes.push({ code: "", name: "" });
    setMenuOptions(updated);
  };

  const removeSize = (menuIdx: number, sizeIdx: number) => {
    const updated = [...menuOptions];
    updated[menuIdx].sizes = updated[menuIdx].sizes.filter((_, i) => i !== sizeIdx);
    setMenuOptions(updated);
  };

  const addMilk = (menuIdx: number) => {
    const updated = [...menuOptions];
    if (!updated[menuIdx].milkOptions) updated[menuIdx].milkOptions = [];
    updated[menuIdx].milkOptions!.push({ code: "", name: "" });
    setMenuOptions(updated);
  };

  const removeMilk = (menuIdx: number, milkIdx: number) => {
    const updated = [...menuOptions];
    updated[menuIdx].milkOptions = updated[menuIdx].milkOptions?.filter((_, i) => i !== milkIdx);
    setMenuOptions(updated);
  };

  const handleCreate = () => {
    if (!name || !validFrom || !validUntil || menuOptions.length === 0) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    createMutation.mutate({
      name, description, maxCodesPerCustomer: maxCodes,
      validFrom, validUntil,
      menuOptions: menuOptions.map(m => ({
        ...m,
        milkOptions: m.milkOptions && m.milkOptions.length > 0 ? m.milkOptions : undefined,
      })),
    });
  };

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="จัดการแคมเปญแก้วแถม" backPath="/admin">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold">แคมเปญแก้วแถม</h2>
            <p className="text-xs text-muted-foreground">จัดการแคมเปญ Free Drink Code</p>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> สร้างใหม่
          </Button>
        </div>

        {/* Campaign List */}
        {!campaigns || campaigns.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">ยังไม่มีแคมเปญ</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowCreate(true)}>
                <Plus className="h-4 w-4 mr-1" /> สร้างแคมเปญแรก
              </Button>
            </CardContent>
          </Card>
        ) : (
          campaigns.map((c: any) => (
            <Card key={c.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedId(c.id)}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm truncate">{c.name}</p>
                      <Badge variant={c.isActive ? "default" : "secondary"} className="text-[10px]">
                        {c.isActive ? "เปิดใช้งาน" : "ปิด"}
                      </Badge>
                    </div>
                    {c.description && <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>}
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(c.validFrom, { shortYear: true })} - {formatDate(c.validUntil, { shortYear: true })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        สูงสุด {c.maxCodesPerCustomer} โค้ด/คน
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(c.menuOptions as MenuOption[])?.map((m, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">
                          {m.name} ({m.code})
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Campaign Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>สร้างแคมเปญแก้วแถม</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ชื่อแคมเปญ *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="เช่น แคมเปญรีวิว มี.ค. 2569" />
            </div>
            <div>
              <Label>รายละเอียด</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="รายละเอียดเพิ่มเติม..." rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>เริ่มต้น *</Label>
                <Input type="datetime-local" value={validFrom} onChange={e => setValidFrom(e.target.value)} />
              </div>
              <div>
                <Label>สิ้นสุด *</Label>
                <Input type="datetime-local" value={validUntil} onChange={e => setValidUntil(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>จำนวนโค้ดสูงสุดต่อลูกค้า</Label>
              <Input type="number" min={1} value={maxCodes} onChange={e => setMaxCodes(Number(e.target.value))} />
            </div>

            {/* Menu Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-sm font-semibold">เมนูที่ให้แลก</Label>
                <Button type="button" size="sm" variant="outline" onClick={addMenuOption}>
                  <Plus className="h-3 w-3 mr-1" /> เพิ่มเมนู
                </Button>
              </div>
              {menuOptions.map((menu, mIdx) => (
                <Card key={mIdx} className="mb-3">
                  <CardContent className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-muted-foreground">เมนู #{mIdx + 1}</p>
                      {menuOptions.length > 1 && (
                        <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeMenuOption(mIdx)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">รหัสเมนู</Label>
                        <Input value={menu.code} onChange={e => updateMenuOption(mIdx, "code", e.target.value.toUpperCase())} placeholder="ML" className="h-8 text-xs" />
                      </div>
                      <div>
                        <Label className="text-xs">ชื่อเมนู</Label>
                        <Input value={menu.name} onChange={e => updateMenuOption(mIdx, "name", e.target.value)} placeholder="Matcha Latte" className="h-8 text-xs" />
                      </div>
                    </div>

                    {/* Sizes */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">ไซส์</Label>
                        <Button type="button" size="sm" variant="ghost" className="h-5 text-[10px] px-1" onClick={() => addSize(mIdx)}>
                          <Plus className="h-2.5 w-2.5 mr-0.5" /> เพิ่ม
                        </Button>
                      </div>
                      {menu.sizes.map((s, sIdx) => (
                        <div key={sIdx} className="flex gap-2 mb-1">
                          <Input value={s.code} onChange={e => {
                            const u = [...menuOptions]; u[mIdx].sizes[sIdx].code = e.target.value.toUpperCase(); setMenuOptions(u);
                          }} placeholder="L" className="h-7 text-xs w-20" />
                          <Input value={s.name} onChange={e => {
                            const u = [...menuOptions]; u[mIdx].sizes[sIdx].name = e.target.value; setMenuOptions(u);
                          }} placeholder="L" className="h-7 text-xs flex-1" />
                          {menu.sizes.length > 1 && (
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeSize(mIdx, sIdx)}>
                              <X className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Milk Options */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <Label className="text-xs">ตัวเลือกนม (ไม่บังคับ)</Label>
                        <Button type="button" size="sm" variant="ghost" className="h-5 text-[10px] px-1" onClick={() => addMilk(mIdx)}>
                          <Plus className="h-2.5 w-2.5 mr-0.5" /> เพิ่ม
                        </Button>
                      </div>
                      {menu.milkOptions?.map((m, milkIdx) => (
                        <div key={milkIdx} className="flex gap-2 mb-1">
                          <Input value={m.code} onChange={e => {
                            const u = [...menuOptions]; u[mIdx].milkOptions![milkIdx].code = e.target.value.toUpperCase(); setMenuOptions(u);
                          }} placeholder="OAT" className="h-7 text-xs w-20" />
                          <Input value={m.name} onChange={e => {
                            const u = [...menuOptions]; u[mIdx].milkOptions![milkIdx].name = e.target.value; setMenuOptions(u);
                          }} placeholder="นมโอ๊ต" className="h-7 text-xs flex-1" />
                          <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeMilk(mIdx, milkIdx)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Code Preview */}
            {menuOptions.length > 0 && menuOptions[0].code && (
              <Card className="bg-muted/30">
                <CardContent className="p-3">
                  <p className="text-xs font-semibold mb-1">ตัวอย่างโค้ดที่จะสร้าง:</p>
                  <p className="font-mono text-sm text-primary">
                    HIBI-{menuOptions[0].code}-{menuOptions[0].sizes[0]?.code || "M"}{menuOptions[0].milkOptions?.[0]?.code ? `-${menuOptions[0].milkOptions[0].code}` : ""}-XXXX
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    XXXX = รหัสสุ่ม 4 ตัว เช่น HIBI-{menuOptions[0].code}-{menuOptions[0].sizes[0]?.code || "M"}{menuOptions[0].milkOptions?.[0]?.code ? `-${menuOptions[0].milkOptions[0].code}` : ""}-A7K2
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ยกเลิก</Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? <><Loader2 className="h-4 w-4 animate-spin mr-1" />กำลังสร้าง...</> : "สร้างแคมเปญ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Campaign Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={(open) => !open && setSelectedId(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedCampaign?.name || "รายละเอียดแคมเปญ"}</DialogTitle>
          </DialogHeader>
          {selectedCampaign && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge variant={selectedCampaign.isActive ? "default" : "secondary"}>
                  {selectedCampaign.isActive ? "เปิดใช้งาน" : "ปิด"}
                </Badge>
                <Button
                  size="sm" variant="outline"
                  onClick={() => updateMutation.mutate({ id: selectedCampaign.id, isActive: selectedCampaign.isActive ? 0 : 1 })}
                  disabled={updateMutation.isPending}
                >
                  {selectedCampaign.isActive ? "ปิดแคมเปญ" : "เปิดแคมเปญ"}
                </Button>
              </div>

              {selectedCampaign.description && (
                <p className="text-sm text-muted-foreground">{selectedCampaign.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">เริ่มต้น</p>
                  <p className="font-medium">{formatDateLong(selectedCampaign.validFrom)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">สิ้นสุด</p>
                  <p className="font-medium">{formatDateLong(selectedCampaign.validUntil)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">โค้ดสูงสุดต่อลูกค้า</p>
                <p className="font-medium text-sm">{selectedCampaign.maxCodesPerCustomer} โค้ด</p>
              </div>

              <div>
                <p className="text-xs font-semibold mb-2">เมนูที่ให้แลก</p>
                {(selectedCampaign.menuOptions as MenuOption[])?.map((m, i) => (
                  <Card key={i} className="mb-2">
                    <CardContent className="p-3">
                      <p className="font-medium text-sm">{m.name} <span className="text-muted-foreground">({m.code})</span></p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.sizes.map((s, si) => (
                          <Badge key={si} variant="outline" className="text-[10px]">ไซส์ {s.name} ({s.code})</Badge>
                        ))}
                        {m.milkOptions?.map((ml, mi) => (
                          <Badge key={mi} variant="outline" className="text-[10px]">{ml.name} ({ml.code})</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
