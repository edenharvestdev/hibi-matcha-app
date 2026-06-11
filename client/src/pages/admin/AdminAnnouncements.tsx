import { trpc } from "@/lib/trpc";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import AdminPageWrapper from "@/components/AdminPageWrapper";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Megaphone, Plus, Edit2, Trash2, Loader2, Pin, Eye, EyeOff,
  Tag, Calendar, Users, ImagePlus, X, Sparkles, Bell, PartyPopper,
  Send, Clock, MapPin, BarChart3, FileText, Copy, BookOpen,
} from "lucide-react";
import { formatDate } from "@/lib/dateUtils";

const TYPE_CONFIG = {
  announcement: { label: "ประกาศ", icon: Bell, color: "bg-blue-100 text-blue-700" },
  promotion: { label: "โปรโมชัน", icon: Tag, color: "bg-emerald-100 text-emerald-700" },
  event: { label: "อีเวนต์", icon: PartyPopper, color: "bg-purple-100 text-purple-700" },
};

const TARGET_CONFIG = {
  all: { label: "ทุกคน", color: "bg-gray-100 text-gray-700" },
  green: { label: "Green", color: "bg-green-100 text-green-700" },
  gold: { label: "Gold", color: "bg-yellow-100 text-yellow-700" },
  matcha: { label: "Matcha", color: "bg-emerald-100 text-emerald-700" },
};

type FormState = {
  title: string;
  content: string;
  type: "announcement" | "promotion" | "event";
  targetGroup: "all" | "green" | "gold" | "matcha";
  audienceType: "customer" | "staff" | "both";
  staffBranchIds: string[]; // branch IDs as strings
  imageUrl: string;
  promoCode: string;
  discountText: string;
  startDate: string;
  endDate: string;
  isPinned: boolean;
  scheduledAt: string;
  useSchedule: boolean;
  branchId: string;
};

const emptyForm: FormState = {
  title: "", content: "", type: "announcement", targetGroup: "all",
  audienceType: "customer", staffBranchIds: [],
  imageUrl: "", promoCode: "", discountText: "",
  startDate: new Date().toISOString().slice(0, 16), endDate: "", isPinned: false,
  scheduledAt: "", useSchedule: false, branchId: "all",
};

export default function AdminAnnouncements() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", type: "announcement" as string, title: "", content: "", imageUrl: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) { toast.error("ไม่มีสิทธิ์เข้าถึง (Super Admin เท่านั้น)"); setLocation("/admin"); }
  }, [loading, session, isSuperAdmin, setLocation]);

  if (loading || !session || !isSuperAdmin) return null;

  const { data: announcements, isLoading, refetch } = trpc.announcements.listAll.useQuery();
  const { data: branches } = trpc.branches.list.useQuery();
  const { data: templates, refetch: refetchTemplates } = trpc.announcementTemplates.list.useQuery();

  // Read receipt stats - fetch when announcements are loaded
  const announcementIds = (announcements as any[])?.map((a: any) => a.id) ?? [];
  const { data: readStats } = trpc.announcements.readStats.useQuery(
    { announcementIds },
    { enabled: announcementIds.length > 0 }
  );
  const readCountMap = new Map(
    (readStats as any[])?.map((s: any) => [s.announcementId, Number(s.readCount)]) ?? []
  );

  // Reader detail dialog state
  const [showReaders, setShowReaders] = useState<{ id: number; title: string } | null>(null);
  const { data: readers, isLoading: readersLoading } = trpc.announcements.readDetail.useQuery(
    { announcementId: showReaders?.id ?? 0 },
    { enabled: !!showReaders }
  );

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => { toast.success("สร้างประกาศสำเร็จ!"); closeForm(); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => { toast.success("อัปเดตประกาศสำเร็จ!"); closeForm(); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => { toast.success("ลบประกาศสำเร็จ!"); setDeleteTarget(null); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const toggleMutation = trpc.announcements.toggleActive.useMutation({
    onSuccess: () => { refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const sendPushMutation = trpc.announcements.sendPush.useMutation({
    onSuccess: (data) => { toast.success(`ส่ง Push Notification สำเร็จ (${data.sent} คน)`); },
    onError: (err) => toast.error(err.message),
  });

  const createTemplateMutation = trpc.announcementTemplates.create.useMutation({
    onSuccess: () => { toast.success("สร้าง Template สำเร็จ!"); setShowTemplateForm(false); setTemplateForm({ name: "", type: "announcement", title: "", content: "", imageUrl: "" }); refetchTemplates(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteTemplateMutation = trpc.announcementTemplates.delete.useMutation({
    onSuccess: () => { toast.success("ลบ Template สำเร็จ!"); refetchTemplates(); },
    onError: (err: any) => toast.error(err.message),
  });

  const closeForm = () => { setShowForm(false); setEditingId(null); setForm(emptyForm); };

  const handleEdit = (ann: any) => {
    setEditingId(ann.id);
    setForm({
      title: ann.title,
      content: ann.content,
      type: ann.type ?? "announcement",
      targetGroup: ann.targetGroup ?? "all",
      audienceType: ann.audienceType ?? "customer",
      staffBranchIds: ann.staffBranchIds ? JSON.parse(ann.staffBranchIds).map(String) : [],
      imageUrl: ann.imageUrl ?? "",
      promoCode: ann.promoCode ?? "",
      discountText: ann.discountText ?? "",
      startDate: ann.startDate ? new Date(ann.startDate).toISOString().slice(0, 16) : "",
      endDate: ann.endDate ? new Date(ann.endDate).toISOString().slice(0, 16) : "",
      isPinned: !!ann.isPinned,
      scheduledAt: ann.scheduledAt ? new Date(ann.scheduledAt).toISOString().slice(0, 16) : "",
      useSchedule: !!ann.scheduledAt,
      branchId: ann.branchId ? String(ann.branchId) : "all",
    });
    setShowForm(true);
  };

  const handleUseTemplate = (tpl: any) => {
    setForm(f => ({
      ...f,
      title: tpl.titleTemplate || tpl.title || "",
      content: tpl.contentTemplate || tpl.content || "",
      type: tpl.type ?? "announcement",
      imageUrl: tpl.imageUrl ?? "",
    }));
    setShowTemplates(false);
    setShowForm(true);
    toast.success(`ใช้ Template "${tpl.name}" แล้ว`);
  };

  const handleSubmit = () => {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("กรุณากรอกหัวข้อและเนื้อหา");
      return;
    }
    const scheduledAt = form.useSchedule && form.scheduledAt ? new Date(form.scheduledAt) : null;
    if (form.useSchedule && !form.scheduledAt) {
      toast.error("กรุณาเลือกเวลาที่ต้องการตั้งเวลาเผยแพร่");
      return;
    }
    const branchId = form.branchId !== "all" ? Number(form.branchId) : null;
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      targetGroup: form.targetGroup,
      audienceType: form.audienceType,
      staffBranchIds: (form.audienceType === "staff" || form.audienceType === "both") && form.staffBranchIds.length > 0 ? form.staffBranchIds.map(Number) : null,
      imageUrl: form.imageUrl || null,
      promoCode: form.promoCode || null,
      discountText: form.discountText || null,
      startDate: !form.useSchedule && form.startDate ? new Date(form.startDate) : undefined,
      endDate: form.endDate ? new Date(form.endDate) : null,
      isPinned: form.isPinned,
      scheduledAt,
      branchId,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const uploadImageMutation = trpc.announcements.uploadImage.useMutation();

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ใหญ่เกิน 5MB"); return; }
    setUploading(true);
    try {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
      );
      const result = await uploadImageMutation.mutateAsync({
        imageBase64: base64,
        imageType: file.type || "image/jpeg",
        fileName: file.name,
      });
      setForm(f => ({ ...f, imageUrl: result.url || "" }));
      toast.success("อัปโหลดรูปสำเร็จ");
    } catch (err: any) {
      toast.error("อัปโหลดรูปไม่สำเร็จ: " + (err?.message || "ลองใหม่อีกครั้ง"));
    } finally {
      setUploading(false);
    }
  };

  const isExpired = (ann: any) => ann.endDate && new Date(ann.endDate) < new Date();
  const isScheduled = (ann: any) => ann.scheduledAt && new Date(ann.scheduledAt) > new Date();

  const getBranchName = (branchId: number | null) => {
    if (!branchId) return null;
    const branch = (branches as any[])?.find((b: any) => b.id === branchId);
    return branch?.name ?? `สาขา #${branchId}`;
  };

  return (
    <AdminPageWrapper title="ประกาศ & โปรโมชัน" backPath="/admin" loading={isLoading}>
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            <h2 className="font-bold text-lg">จัดการประกาศ</h2>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setLocation("/admin/announcement-analytics")}>
              <BarChart3 className="h-4 w-4 mr-1" /> สถิติ
            </Button>
            <Button size="sm" onClick={() => { setForm(emptyForm); setEditingId(null); setShowForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> สร้างใหม่
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setShowTemplates(true)}>
            <FileText className="h-4 w-4 mr-1" /> Template ({(templates as any[])?.length ?? 0})
          </Button>
          <Button size="sm" variant="outline" className="flex-1" onClick={() => setLocation("/admin/marketing")}>
            <BarChart3 className="h-4 w-4 mr-1" /> Marketing
          </Button>
        </div>

        {/* Stats */}
        {announcements && (
          <div className="grid grid-cols-4 gap-2">
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold">{announcements.length}</p>
              <p className="text-xs text-muted-foreground">ทั้งหมด</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{announcements.filter(a => a.isActive && !isExpired(a) && !isScheduled(a)).length}</p>
              <p className="text-xs text-muted-foreground">เปิดใช้งาน</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{announcements.filter(a => isScheduled(a)).length}</p>
              <p className="text-xs text-muted-foreground">ตั้งเวลา</p>
            </Card>
            <Card className="p-3 text-center">
              <p className="text-2xl font-bold text-amber-600">{announcements.filter(a => a.type === "promotion").length}</p>
              <p className="text-xs text-muted-foreground">โปรโมชัน</p>
            </Card>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : !announcements?.length ? (
          <div className="text-center py-12 text-muted-foreground">
            <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-30" />
            <p>ยังไม่มีประกาศ</p>
          </div>
        ) : (
          <div className="space-y-3">
            {announcements.map((ann) => {
              const typeConf = TYPE_CONFIG[ann.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.announcement;
              const targetConf = TARGET_CONFIG[ann.targetGroup as keyof typeof TARGET_CONFIG] || TARGET_CONFIG.all;
              const TypeIcon = typeConf.icon;
              const expired = isExpired(ann);
              const scheduled = isScheduled(ann);
              const branchName = getBranchName((ann as any).branchId);

              return (
                <Card key={ann.id} className={`overflow-hidden ${!ann.isActive || expired ? "opacity-60" : ""}`}>
                  {ann.imageUrl && (
                    <img src={ann.imageUrl} alt={ann.title} className="w-full h-32 object-cover" />
                  )}
                  <CardContent className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <Badge variant="secondary" className={`text-[10px] ${typeConf.color}`}>
                            <TypeIcon className="h-3 w-3 mr-0.5" />
                            {typeConf.label}
                          </Badge>
                          <Badge variant="secondary" className={`text-[10px] ${targetConf.color}`}>
                            <Users className="h-3 w-3 mr-0.5" />
                            {targetConf.label}
                          </Badge>
                          {branchName && (
                            <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300">
                              <MapPin className="h-3 w-3 mr-0.5" />
                              {branchName}
                            </Badge>
                          )}
                          {ann.isPinned ? <Pin className="h-3 w-3 text-amber-500" /> : null}
                          {expired && <Badge variant="destructive" className="text-[10px]">หมดอายุ</Badge>}
                          {scheduled && (
                            <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-300">
                              <Clock className="h-3 w-3 mr-0.5" />
                              ตั้งเวลา
                            </Badge>
                          )}
                        </div>
                        <p className="font-semibold text-sm truncate">{ann.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{ann.content}</p>
                        {ann.promoCode && (
                          <div className="mt-1.5 inline-flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded text-xs font-mono font-bold text-primary">
                            <Tag className="h-3 w-3" /> {ann.promoCode}
                            {ann.discountText && <span className="font-normal text-muted-foreground ml-1">({ann.discountText})</span>}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(ann)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleMutation.mutate({ id: ann.id })}>
                          {ann.isActive ? <Eye className="h-3.5 w-3.5 text-emerald-600" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => sendPushMutation.mutate({ id: ann.id })}
                          disabled={sendPushMutation.isPending}
                          title="ส่ง Push Notification"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => setDeleteTarget({ id: ann.id, title: ann.title })}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(ann.startDate)}</span>
                        {ann.endDate && <span>— {formatDate(ann.endDate)}</span>}
                        {scheduled && ann.scheduledAt && (
                          <span className="text-blue-600 font-medium ml-2">
                            <Clock className="h-3 w-3 inline mr-0.5" />
                            เผยแพร่: {formatDate(ann.scheduledAt)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setShowReaders({ id: ann.id, title: ann.title })}
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        <BookOpen className="h-3 w-3" />
                        <span className="font-medium">{readCountMap.get(ann.id) ?? 0} คนอ่าน</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={() => closeForm()}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "แก้ไขประกาศ" : "สร้างประกาศใหม่"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Type */}
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select value={form.type} onValueChange={(v: any) => setForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">ประกาศทั่วไป</SelectItem>
                  <SelectItem value="promotion">โปรโมชัน</SelectItem>
                  <SelectItem value="event">อีเวนต์</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label>หัวข้อ *</Label>
              <Input placeholder="เช่น โปรพิเศษวันเกิด!" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label>เนื้อหา *</Label>
              <Textarea placeholder="รายละเอียดประกาศ..." rows={4} value={form.content} onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))} />
            </div>

            {/* Image */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5"><ImagePlus className="h-3.5 w-3.5" /> รูปภาพ</Label>
              {form.imageUrl ? (
                <div className="relative">
                  <img src={form.imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg border" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7 rounded-full" onClick={() => setForm(f => ({ ...f, imageUrl: "" }))}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-full h-24 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                  <span className="text-xs text-muted-foreground">คลิกเพื่ออัปโหลด</span>
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* Branch Targeting */}
            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 space-y-2">
              <Label className="flex items-center gap-1.5 text-orange-700">
                <MapPin className="h-3.5 w-3.5" /> ส่งเฉพาะสาขา
              </Label>
              <Select value={form.branchId} onValueChange={(v) => setForm(f => ({ ...f, branchId: v }))}>
                <SelectTrigger className="border-orange-300">
                  <SelectValue placeholder="เลือกสาขา" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">ทุกสาขา (ส่งถึงทุกคน)</SelectItem>
                  {(branches as any[])?.map((b: any) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-orange-500">เลือกสาขาเพื่อส่งประกาศเฉพาะลูกค้าของสาขานั้น</p>
            </div>

            {/* Audience Type */}
            <div className="space-y-2">
              <Label>กลุ่มเป้าหมาย</Label>
              <Select value={form.audienceType} onValueChange={(v: any) => setForm(f => ({ ...f, audienceType: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="customer">ลูกค้าทั่วไป (Customers)</SelectItem>
                  <SelectItem value="staff">พนักงาน (Staff)</SelectItem>
                  <SelectItem value="both">ลูกค้า + พนักงาน (Both)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Staff Branch Selection - shown when staff or both */}
            {(form.audienceType === "staff" || form.audienceType === "both") && (
              <div className="space-y-2">
                <Label>สาขาของพนักงาน</Label>
                <div className="border rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.staffBranchIds.length === 0} onChange={() => setForm(f => ({ ...f, staffBranchIds: [] }))} className="rounded" />
                    ทุกสาขา
                  </label>
                  {(branches as any[])?.map((b: any) => (
                    <label key={b.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.staffBranchIds.includes(String(b.id))} onChange={(e) => {
                        setForm(f => {
                          const ids = e.target.checked ? [...f.staffBranchIds, String(b.id)] : f.staffBranchIds.filter(id => id !== String(b.id));
                          return { ...f, staffBranchIds: ids };
                        });
                      }} className="rounded" />
                      {b.name}
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">{form.staffBranchIds.length === 0 ? "ส่งถึงพนักงานทุกสาขา" : `เลือก ${form.staffBranchIds.length} สาขา`}</p>
              </div>
            )}

            {/* Target Group (customer tier) - shown when customer or both */}
            {(form.audienceType === "customer" || form.audienceType === "both") && (
              <div className="space-y-2">
                <Label>ระดับสมาชิก (ลูกค้า)</Label>
                <Select value={form.targetGroup} onValueChange={(v: any) => setForm(f => ({ ...f, targetGroup: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทุกระดับ</SelectItem>
                    <SelectItem value="green">Green ขึ้นไป</SelectItem>
                    <SelectItem value="gold">Gold ขึ้นไป</SelectItem>
                    <SelectItem value="matcha">Matcha เท่านั้น</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Promo Code (for promotion type) */}
            {form.type === "promotion" && (
              <>
                <div className="space-y-2">
                  <Label>โค้ดโปรโมชัน</Label>
                  <Input placeholder="เช่น MATCHA20" value={form.promoCode} onChange={(e) => setForm(f => ({ ...f, promoCode: e.target.value.toUpperCase() }))} />
                </div>
                <div className="space-y-2">
                  <Label>รายละเอียดส่วนลด</Label>
                  <Input placeholder="เช่น ลด 20% สำหรับเมนู Matcha" value={form.discountText} onChange={(e) => setForm(f => ({ ...f, discountText: e.target.value }))} />
                </div>
              </>
            )}

            {/* Schedule Toggle */}
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-1.5 text-blue-700">
                  <Clock className="h-3.5 w-3.5" /> ตั้งเวลาเผยแพร่
                </Label>
                <Switch
                  checked={form.useSchedule}
                  onCheckedChange={(v) => setForm(f => ({ ...f, useSchedule: v, scheduledAt: v ? f.scheduledAt : "" }))}
                />
              </div>
              {form.useSchedule ? (
                <div className="space-y-2">
                  <Label className="text-xs text-blue-600">เวลาที่ต้องการเผยแพร่</Label>
                  <Input
                    type="datetime-local"
                    value={form.scheduledAt}
                    onChange={(e) => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
                    min={new Date().toISOString().slice(0, 16)}
                    className="border-blue-300"
                  />
                  <p className="text-[10px] text-blue-500">ประกาศจะถูกเผยแพร่อัตโนมัติตามเวลาที่กำหนด พร้อมส่ง Push Notification</p>
                </div>
              ) : (
                <p className="text-[10px] text-blue-500">เผยแพร่ทันทีเมื่อสร้าง พร้อมส่ง Push Notification</p>
              )}
            </div>

            {/* Dates (only show if not using schedule) */}
            {!form.useSchedule && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>เริ่มต้น</Label>
                  <Input type="datetime-local" value={form.startDate} onChange={(e) => setForm(f => ({ ...f, startDate: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>สิ้นสุด (ถ้ามี)</Label>
                  <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} />
                </div>
              </div>
            )}

            {/* End date for scheduled */}
            {form.useSchedule && (
              <div className="space-y-2">
                <Label>สิ้นสุด (ถ้ามี)</Label>
                <Input type="datetime-local" value={form.endDate} onChange={(e) => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            )}

            {/* Pin */}
            <div className="flex items-center justify-between pt-2 border-t">
              <Label className="flex items-center gap-1.5"><Pin className="h-3.5 w-3.5" /> ปักหมุดด้านบน</Label>
              <Switch checked={form.isPinned} onCheckedChange={(v) => setForm(f => ({ ...f, isPinned: v }))} />
            </div>
          </div>
          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button variant="outline" onClick={closeForm}>ยกเลิก</Button>
            <Button variant="secondary" onClick={() => setShowPreview(true)} disabled={!form.title.trim()}>
              <Eye className="h-4 w-4 mr-1" /> ดูตัวอย่าง
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending || uploading}>
              {(createMutation.isPending || updateMutation.isPending) ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : form.useSchedule ? <Clock className="h-4 w-4 mr-1" /> : <Sparkles className="h-4 w-4 mr-1" />}
              {editingId ? "บันทึก" : form.useSchedule ? "ตั้งเวลาเผยแพร่" : "สร้างประกาศ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" /> Template ประกาศ
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Button size="sm" variant="outline" className="w-full" onClick={() => { setShowTemplates(false); setShowTemplateForm(true); }}>
              <Plus className="h-4 w-4 mr-1" /> สร้าง Template ใหม่
            </Button>
            {!(templates as any[])?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">ยังไม่มี Template</p>
                <p className="text-xs">สร้าง Template เพื่อใช้ซ้ำได้ง่าย</p>
              </div>
            ) : (
              (templates as any[])?.map((tpl: any) => {
                const typeConf = TYPE_CONFIG[tpl.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.announcement;
                return (
                  <Card key={tpl.id} className="overflow-hidden">
                    {tpl.imageUrl && <img src={tpl.imageUrl} alt={tpl.name} className="w-full h-20 object-cover" />}
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Badge variant="secondary" className={`text-[10px] ${typeConf.color}`}>{typeConf.label}</Badge>
                            <p className="font-medium text-sm truncate">{tpl.name}</p>
                          </div>
                          <p className="text-xs font-medium">{tpl.titleTemplate || tpl.title}</p>
                          <p className="text-[10px] text-muted-foreground line-clamp-2">{tpl.contentTemplate || tpl.content}</p>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleUseTemplate(tpl)}>
                            <Copy className="h-3 w-3 mr-1" /> ใช้
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs text-red-500" onClick={() => deleteTemplateMutation.mutate({ id: tpl.id })}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateForm} onOpenChange={setShowTemplateForm}>
        <DialogContent className="max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>สร้าง Template ใหม่</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>ชื่อ Template *</Label>
              <Input placeholder="เช่น โปรวันเกิด" value={templateForm.name} onChange={(e) => setTemplateForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>ประเภท</Label>
              <Select value={templateForm.type} onValueChange={(v) => setTemplateForm(f => ({ ...f, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="announcement">ประกาศทั่วไป</SelectItem>
                  <SelectItem value="promotion">โปรโมชัน</SelectItem>
                  <SelectItem value="event">อีเวนต์</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>หัวข้อ *</Label>
              <Input placeholder="หัวข้อประกาศ" value={templateForm.title} onChange={(e) => setTemplateForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>เนื้อหา *</Label>
              <Textarea placeholder="เนื้อหาประกาศ..." rows={4} value={templateForm.content} onChange={(e) => setTemplateForm(f => ({ ...f, content: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>URL รูปภาพ (ถ้ามี)</Label>
              <Input placeholder="https://..." value={templateForm.imageUrl} onChange={(e) => setTemplateForm(f => ({ ...f, imageUrl: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTemplateForm(false)}>ยกเลิก</Button>
            <Button
              onClick={() => {
                if (!templateForm.name.trim() || !templateForm.title.trim() || !templateForm.content.trim()) {
                  toast.error("กรุณากรอกชื่อ Template, หัวข้อ, และเนื้อหา");
                  return;
                }
                createTemplateMutation.mutate({
                  name: templateForm.name.trim(),
                  type: templateForm.type as "announcement" | "promotion" | "event",
                  titleTemplate: templateForm.title.trim(),
                  contentTemplate: templateForm.content.trim(),
                  imageUrl: templateForm.imageUrl || null,
                });
              }}
              disabled={createTemplateMutation.isPending}
            >
              {createTemplateMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              สร้าง Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" /> ตัวอย่างที่ลูกค้าจะเห็น
            </DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden bg-background">
            <Card className={`overflow-hidden border-l-4 ${form.type === 'promotion' ? 'border-l-emerald-500' : form.type === 'event' ? 'border-l-purple-500' : 'border-l-blue-500'}`}>
              {form.imageUrl && (
                <img src={form.imageUrl} alt={form.title} className="w-full h-40 object-cover" />
              )}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`text-[10px] ${TYPE_CONFIG[form.type]?.color || ''}`}>
                    {TYPE_CONFIG[form.type]?.label || form.type}
                  </Badge>
                  {form.isPinned && <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">📌 สำคัญ</Badge>}
                </div>
                <h3 className="font-bold text-base">{form.title || 'หัวข้อประกาศ'}</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{form.content || 'เนื้อหาประกาศ...'}</p>
                {form.promoCode && (
                  <div className="mt-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">โค้ดส่วนลด</p>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-lg text-primary tracking-wider">{form.promoCode}</span>
                      <Button variant="outline" size="sm" className="h-8" disabled>
                        <Copy className="h-3.5 w-3.5 mr-1" /> คัดลอก
                      </Button>
                    </div>
                    {form.discountText && (
                      <p className="text-xs text-muted-foreground mt-1">{form.discountText}</p>
                    )}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground pt-2 border-t">
                  <Calendar className="h-3 w-3" />
                  <span>{form.startDate ? new Date(form.startDate).toLocaleDateString('th-TH') : 'วันนี้'}</span>
                  {form.endDate && (
                    <><span>—</span><span>{new Date(form.endDate).toLocaleDateString('th-TH')}</span></>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Readers Dialog */}
      <Dialog open={!!showReaders} onOpenChange={() => setShowReaders(null)}>
        <DialogContent className="max-w-sm mx-auto max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-indigo-600" /> ผู้อ่านประกาศ
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-3 font-medium">{showReaders?.title}</p>
          {readersLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : !(readers as any[])?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">ยังไม่มีคนอ่าน</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">ทั้งหมด {(readers as any[]).length} คน</p>
              {(readers as any[]).map((r: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm">ลูกค้า #{r.customerId}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {r.readAt ? new Date(r.readAt).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                  </span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReaders(null)}>ปิด</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบประกาศ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการลบประกาศ <strong>"{deleteTarget?.title}"</strong> หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => deleteTarget && deleteMutation.mutate({ id: deleteTarget.id })} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
              ลบประกาศ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageWrapper>
  );
}
