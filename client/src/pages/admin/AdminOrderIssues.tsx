import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import AdminPageWrapper from "@/components/AdminPageWrapper";
import DateRangePickerModal from "@/components/common/DateRangePickerModal";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  AlertTriangle, Clock, CheckCircle2, ArrowUpRight, XCircle, Loader2,
  Phone, Filter, Timer, Image as ImageIcon, Gift, Copy, Trash2, MessageSquare, Home
} from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";
import QRCodeDisplay from "@/components/QRCodeDisplay";
import { useLocation } from "wouter";
import { formatDate, formatDateTime } from "@/lib/dateUtils";

const CATEGORY_LABELS: Record<string, string> = {
  wrong_order: "ออเดอร์ผิด",
  missing_item: "ของขาด/ไม่ครบ",
  quality: "คุณภาพไม่ดี",
  late_delivery: "จัดส่งล่าช้า",
  damaged: "สินค้าเสียหาย",
  other: "อื่นๆ",
};

const APP_LABELS: Record<string, string> = {
  shopee: "Shopee Food",
  lineman: "LINE MAN",
  grab: "Grab Food",
  gpos: "GPOS (หน้าร้าน)",
  walk_in: "หน้าร้าน (ไม่มีบิล)",
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string; badgeVariant: "default" | "secondary" | "destructive" | "outline" }> = {
  open: { label: "รอตรวจสอบ", icon: Clock, color: "text-amber-500", badgeVariant: "outline" },
  acknowledged: { label: "รับทราบแล้ว", icon: CheckCircle2, color: "text-blue-500", badgeVariant: "secondary" },
  in_progress: { label: "กำลังดำเนินการ", icon: ArrowUpRight, color: "text-indigo-500", badgeVariant: "secondary" },
  resolved: { label: "แก้ไขแล้ว", icon: CheckCircle2, color: "text-green-500", badgeVariant: "default" },
  escalated: { label: "ส่งต่อ Super Admin", icon: AlertTriangle, color: "text-orange-500", badgeVariant: "destructive" },
  closed: { label: "ปิดแล้ว", icon: XCircle, color: "text-gray-500", badgeVariant: "outline" },
};

export default function AdminOrderIssues() {
  const { session } = useHibiAuth();
  const [, setLocation] = useLocation();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedIssue, setSelectedIssue] = useState<any>(null);
  const [resolution, setResolution] = useState("");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Admin note form state
  const [showAdminNoteForm, setShowAdminNoteForm] = useState(false);
  const [newAdminNote, setNewAdminNote] = useState("");

  // Compensation code inline form state
  const [showCompForm, setShowCompForm] = useState(false);
  const [compMenuId, setCompMenuId] = useState("");
  const [compMode, setCompMode] = useState<"same" | "select" | "custom">("same");
  const [compCustomName, setCompCustomName] = useState("");
  const [compRemark, setCompRemark] = useState("");
  const [compExpiryDays, setCompExpiryDays] = useState("30");
  const [compClaimError, setCompClaimError] = useState("");
  const [compResultCode, setCompResultCode] = useState("");
  const [compResultCopyText, setCompResultCopyText] = useState("");
  const [compResultExpiresAt, setCompResultExpiresAt] = useState("");

  const openLightbox = (imgs: string[], idx: number) => {
    setLightboxImages(imgs);
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  const queryInput = useMemo(() => ({
    ...(statusFilter !== "all" ? { status: statusFilter } : {}),
    ...(dateFrom ? { dateFrom } : {}),
    ...(dateTo ? { dateTo } : {}),
  }), [statusFilter, dateFrom, dateTo]);
  const { data: issues, isLoading, refetch } = trpc.orderIssues.list.useQuery(
    Object.keys(queryInput).length > 0 ? queryInput : undefined
  );
  const { data: branches } = trpc.branches.list.useQuery();

  // Get menu items for compensation
  const branchId = session?.branchId;
  const { data: menuItems } = trpc.reviewMenu.listActive.useQuery(
    selectedIssue ? { branchId: selectedIssue.branchId } : (branchId ? { branchId } : undefined),
    { enabled: !!session && (!!selectedIssue || !!branchId) }
  );

  const selectedCompMenu = useMemo(() => {
    if (!compMenuId || !menuItems) return null;
    return menuItems.find((m: any) => String(m.id) === compMenuId);
  }, [compMenuId, menuItems]);

  const acknowledgeMutation = trpc.orderIssues.acknowledge.useMutation({
    onSuccess: () => { toast.success("รับทราบปัญหาแล้ว"); refetch(); setSelectedIssue(null); },
    onError: (err) => toast.error(err.message),
  });

  const resolveMutation = trpc.orderIssues.resolve.useMutation({
    onSuccess: () => { toast.success("แก้ไขปัญหาเรียบร้อย"); refetch(); setSelectedIssue(null); setResolution(""); },
    onError: (err) => toast.error(err.message),
  });

  const closeMutation = trpc.orderIssues.close.useMutation({
    onSuccess: () => { toast.success("ปิดเรื่องร้องเรียนแล้ว"); refetch(); setSelectedIssue(null); },
    onError: (err) => toast.error(err.message),
  });

  const escalateMutation = trpc.orderIssues.escalate.useMutation({
    onSuccess: () => { toast.success("ส่งต่อไปยัง Super Admin แล้ว"); refetch(); setSelectedIssue(null); },
    onError: (err) => toast.error(err.message),
  });

  // Mutation for clearing resolution (delete to re-write)
  const clearResolutionMutation = trpc.orderIssues.clearResolution.useMutation({
    onSuccess: () => {
      toast.success("ลบข้อความการแก้ไขแล้ว สามารถเขียนใหม่ได้");
      refetch();
      if (selectedIssue) setSelectedIssue({ ...selectedIssue, resolution: null, status: "acknowledged" });
    },
    onError: (err) => toast.error(err.message),
  });

  // Mutation for clearing admin note (delete to re-write)
  const clearAdminNoteMutation = trpc.orderIssues.clearAdminNote.useMutation({
    onSuccess: () => {
      toast.success("ลบข้อความแล้ว สามารถเขียนใหม่ได้");
      refetch();
      if (selectedIssue) setSelectedIssue({ ...selectedIssue, adminNote: null });
    },
    onError: (err) => toast.error(err.message),
  });

  // Mutation for adding admin note
  const addAdminNoteMutation = trpc.orderIssues.addAdminNote.useMutation({
    onSuccess: () => {
      toast.success("บันทึกข้อความเรียบร้อย");
      refetch();
      setShowAdminNoteForm(false);
      if (selectedIssue) setSelectedIssue({ ...selectedIssue, adminNote: newAdminNote });
      setNewAdminNote("");
    },
    onError: (err) => toast.error(err.message),
  });

  const createCompMutation = trpc.claims.create.useMutation({
    onSuccess: (data) => {
      setCompResultCode(data.code);
      setCompResultCopyText(data.copyText);
      setCompResultExpiresAt(data.expiresAt);
      toast.success("สร้างโค้ดชดเชยสำเร็จ!");
    },
    onError: (err) => toast.error(err.message),
  });

  const getSlaStatus = (issue: any) => {
    const now = new Date().getTime();
    const responseDeadline = new Date(issue.slaResponseDeadline).getTime();
    const resolutionDeadline = new Date(issue.slaResolutionDeadline).getTime();
    if (issue.status === "open" && now > responseDeadline) return { overdue: true, text: "เกิน SLA ตอบรับ (24 ชม.)" };
    if (["acknowledged", "in_progress"].includes(issue.status) && now > resolutionDeadline) return { overdue: true, text: "เกิน SLA แก้ไข (48 ชม.)" };
    if (issue.status === "open") {
      const hoursLeft = Math.max(0, Math.floor((responseDeadline - now) / 3600000));
      return { overdue: false, text: `ตอบรับภายใน ${hoursLeft} ชม.` };
    }
    if (["acknowledged", "in_progress"].includes(issue.status)) {
      const hoursLeft = Math.max(0, Math.floor((resolutionDeadline - now) / 3600000));
      return { overdue: false, text: `แก้ไขภายใน ${hoursLeft} ชม.` };
    }
    return null;
  };

  const getBranchName = (branchId: number) => branches?.find(b => b.id === branchId)?.name || `สาขา #${branchId}`;

  const handleOpenCompForm = () => {
    // Auto-fill from issue data
    setCompClaimError(selectedIssue?.description || "");
    setCompMenuId("");
    setCompMode("same");
    setCompCustomName("");
    setCompRemark("");
    setCompExpiryDays("30");
    setCompResultCode("");
    setCompResultCopyText("");
    setCompResultExpiresAt("");
    setShowCompForm(true);
  };

  const handleSubmitComp = () => {
    if (!selectedIssue) return;
    if (!compClaimError.trim()) return toast.error("กรุณาระบุความผิดพลาด");

    // Determine compensation menu based on mode
    let finalCompCode: string | undefined;
    let finalCompName: string | undefined;
    if (compMode === "same") {
      // Use the order details as menu name (from issue)
      finalCompName = selectedIssue.orderDetails || selectedIssue.description?.substring(0, 50) || undefined;
    } else if (compMode === "select" && selectedCompMenu) {
      finalCompCode = selectedCompMenu.code;
      finalCompName = selectedCompMenu.name;
    } else if (compMode === "custom" && compCustomName.trim()) {
      finalCompName = compCustomName.trim();
    }

    createCompMutation.mutate({
      branchId: selectedIssue.branchId,
      claimChannel: selectedIssue.deliveryApp as any,
      claimOrderId: selectedIssue.orderId || undefined,
      claimOrderDetail: selectedIssue.orderDetails || undefined,
      claimError: compClaimError,
      compensationMenuCode: finalCompCode,
      compensationMenuName: finalCompName,
      compensationRemark: compRemark.trim() || undefined,
      customerId: selectedIssue.customerId || undefined,
      customerPhone: selectedIssue.customerPhone || undefined,
      expiryDays: parseInt(compExpiryDays) || 30,
    });
  };

  const handleCloseDialog = () => {
    setSelectedIssue(null);
    setResolution("");
    setShowCompForm(false);
    setCompResultCode("");
    setCompResultCopyText("");
    setCompResultExpiresAt("");
    setShowAdminNoteForm(false);
    setNewAdminNote("");
  };

  return (
    <AdminPageWrapper title="ปัญหาออเดอร์" backPath="/admin" loading={isLoading}>
    <div className="px-4 py-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold">ปัญหาออเดอร์</h2>
          <p className="text-xs text-muted-foreground">จัดการเรื่องร้องเรียนจากลูกค้า (SLA: ตอบรับ 24 ชม. / แก้ไข 48 ชม.)</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทั้งหมด</SelectItem>
            <SelectItem value="open">รอตรวจสอบ</SelectItem>
            <SelectItem value="acknowledged">รับทราบแล้ว</SelectItem>
            <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
            <SelectItem value="resolved">แก้ไขแล้ว</SelectItem>
            <SelectItem value="escalated">ส่งต่อ</SelectItem>
            <SelectItem value="closed">ปิดแล้ว</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">
          {issues?.length ?? 0} รายการ
        </span>
        <DateRangePickerModal
          dateFrom={dateFrom}
          dateTo={dateTo}
          onApply={(f, t) => { setDateFrom(f); setDateTo(t); }}
          onClear={() => { setDateFrom(""); setDateTo(""); }}
        />
      </div>

      {/* Issues list */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !issues?.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">ไม่มีปัญหาที่ต้องจัดการ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {issues.map((item: any) => {
            const issue = item.issue || item;
            const customerName = item.customerName || "ลูกค้า";
            const customerPhone = item.customerPhone || "";
            const statusCfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
            const sla = getSlaStatus(issue);

            return (
              <Card
                key={issue.id}
                className={`border shadow-sm cursor-pointer hover:shadow-md transition-shadow ${sla?.overdue ? "border-red-200 bg-red-50/30" : ""}`}
                onClick={() => { setSelectedIssue({ ...issue, customerName, customerPhone, assignedStaffName: item.assignedStaffName }); setShowCompForm(false); setCompResultCode(""); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{CATEGORY_LABELS[issue.category] || issue.category}</p>
                        <Badge variant={statusCfg.badgeVariant} className="text-[10px] h-5">
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {customerName} {customerPhone && `(${customerPhone})`} — {getBranchName(issue.branchId)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-muted-foreground">
                        {APP_LABELS[issue.deliveryApp] || issue.deliveryApp}
                      </p>
                      {issue.orderId && <p className="text-[10px] font-mono">#{issue.orderId}</p>}
                    </div>
                  </div>
                  {/* Order details preview */}
                  {issue.orderDetails && (
                    <p className="text-[10px] text-muted-foreground bg-muted/30 rounded px-2 py-1 mb-1 line-clamp-1">
                      รายการ: {issue.orderDetails}
                    </p>
                  )}
                  {((issue.images && issue.images.length > 0) || issue.imageUrl) && (
                    <div className="flex items-center gap-1 text-[10px] text-primary mb-1">
                      <ImageIcon className="h-3 w-3" /> มีรูปแนบ {issue.images?.length > 1 ? `(${issue.images.length} รูป)` : ""}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground line-clamp-1">{issue.description}</p>
                  {item.assignedStaffName && (
                    <p className="text-[10px] text-primary mt-1">ผู้ดำเนินการ: {item.assignedStaffName}</p>
                  )}
                  {sla && (
                    <div className={`flex items-center gap-1 mt-2 text-[10px] ${sla.overdue ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
                      <Timer className="h-3 w-3" />
                      {sla.text}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedIssue} onOpenChange={(open) => { if (!open) handleCloseDialog(); }}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base">
              {selectedIssue && (CATEGORY_LABELS[selectedIssue.category] || selectedIssue.category)}
            </DialogTitle>
          </DialogHeader>
          {selectedIssue && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">ลูกค้า</p>
                  <p className="font-medium">{selectedIssue.customerName}</p>
                  {selectedIssue.customerPhone && (
                    <a href={`tel:${selectedIssue.customerPhone}`} className="text-primary flex items-center gap-1 mt-0.5">
                      <Phone className="h-3 w-3" />{selectedIssue.customerPhone}
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-muted-foreground">สาขา</p>
                  <p className="font-medium">{getBranchName(selectedIssue.branchId)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">ช่องทาง</p>
                  <p className="font-medium">{APP_LABELS[selectedIssue.deliveryApp]}</p>
                  {selectedIssue.orderId && <p className="font-mono text-[10px]">#{selectedIssue.orderId}</p>}
                </div>
                <div>
                  <p className="text-muted-foreground">วันที่แจ้ง</p>
                  <p className="font-medium">{formatDateTime(selectedIssue.createdAt, { shortYear: true })}</p>
                </div>
                {selectedIssue.assignedStaffName && (
                  <div>
                    <p className="text-muted-foreground">ผู้อนุมัติ/ดำเนินการ</p>
                    <p className="font-medium text-primary">{selectedIssue.assignedStaffName}</p>
                  </div>
                )}
              </div>

              {/* Order details */}
              {selectedIssue.orderDetails && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">รายละเอียดคำสั่งซื้อ</p>
                  <p className="text-sm bg-blue-50 p-3 rounded-lg text-blue-800">{selectedIssue.orderDetails}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-muted-foreground mb-1">รายละเอียดปัญหา</p>
                <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedIssue.description}</p>
              </div>

              {(() => {
                const imgs: string[] = selectedIssue.images?.length > 0 ? selectedIssue.images : (selectedIssue.imageUrl ? [selectedIssue.imageUrl] : []);
                if (imgs.length === 0) return null;
                return (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">รูปภาพหลักฐาน ({imgs.length} รูป) — คลิกเพื่อขยาย</p>
                    {imgs.length === 1 ? (
                      <img
                        src={imgs[0]}
                        alt="หลักฐาน"
                        className="w-full h-48 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                        onClick={() => openLightbox(imgs, 0)}
                      />
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {imgs.map((url: string, idx: number) => (
                          <img
                            key={idx}
                            src={url}
                            alt={`หลักฐาน ${idx + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                            onClick={() => openLightbox(imgs, idx)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Admin Note */}
              {selectedIssue.adminNote && (
                <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-indigo-600" />
                      <p className="text-xs font-semibold text-indigo-800">ข้อความจากทางร้าน (Admin Note)</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("ต้องการลบข้อความนี้เพื่อเขียนใหม่หรือไม่?")) {
                          clearAdminNoteMutation.mutate({ id: selectedIssue.id });
                        }
                      }}
                      disabled={clearAdminNoteMutation.isPending}
                    >
                      {clearAdminNoteMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                      ลบ
                    </Button>
                  </div>
                  <p className="text-sm text-indigo-700">{selectedIssue.adminNote}</p>
                </div>
              )}

              {/* Add Admin Note button (when no note exists) */}
              {!selectedIssue.adminNote && !showAdminNoteForm && !['closed'].includes(selectedIssue.status) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  onClick={() => setShowAdminNoteForm(true)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  เพิ่มข้อความถึงลูกค้า / สาขา
                </Button>
              )}

              {/* New Admin Note form */}
              {showAdminNoteForm && (
                <div className="border border-indigo-200 bg-indigo-50/50 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-indigo-600" />
                    <p className="text-xs font-semibold text-indigo-800">เพิ่มข้อความถึงลูกค้า / สาขา</p>
                  </div>
                  <Textarea
                    value={newAdminNote}
                    onChange={(e) => setNewAdminNote(e.target.value)}
                    placeholder="เขียนข้อความตอบกลับลูกค้า หรือคำแนะนำสำหรับสาขา..."
                    rows={3}
                    className="resize-none text-sm"
                  />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => { setShowAdminNoteForm(false); setNewAdminNote(""); }}>ยกเลิก</Button>
                    <Button size="sm" className="flex-1" onClick={() => addAdminNoteMutation.mutate({ id: selectedIssue.id, adminNote: newAdminNote })} disabled={addAdminNoteMutation.isPending || !newAdminNote.trim()}>
                      {addAdminNoteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                      บันทึก
                    </Button>
                  </div>
                </div>
              )}

              {/* Resolution */}
              {selectedIssue.resolution && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-muted-foreground">การแก้ไข</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("ต้องการลบข้อความการแก้ไขเพื่อเขียนใหม่หรือไม่?")) {
                          clearResolutionMutation.mutate({ id: selectedIssue.id });
                        }
                      }}
                      disabled={clearResolutionMutation.isPending}
                    >
                      {clearResolutionMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Trash2 className="h-3 w-3 mr-1" />}
                      ลบ
                    </Button>
                  </div>
                  <p className="text-sm bg-green-50 p-3 rounded-lg text-green-700">{selectedIssue.resolution}</p>
                </div>
              )}

              {/* ── Compensation Code Section ── */}
              {!showCompForm && !compResultCode && !["closed"].includes(selectedIssue.status) && (
                <Button
                  variant="outline"
                  className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                  onClick={handleOpenCompForm}
                >
                  <Gift className="h-4 w-4 mr-2" />
                  ออกโค้ดชดเชยให้ลูกค้า
                </Button>
              )}

              {/* Inline Compensation Form */}
              {showCompForm && !compResultCode && (
                <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Gift className="h-4 w-4 text-amber-600" />
                    <p className="font-semibold text-sm text-amber-800">ออกโค้ดชดเชย</p>
                  </div>

                  {/* Auto-filled info (read-only display) */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-white/60 rounded-lg p-2">
                    <div>
                      <p className="text-muted-foreground">ช่องทาง</p>
                      <p className="font-medium">{APP_LABELS[selectedIssue.deliveryApp]}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">สาขา</p>
                      <p className="font-medium">{getBranchName(selectedIssue.branchId)}</p>
                    </div>
                    {selectedIssue.orderId && (
                      <div>
                        <p className="text-muted-foreground">เลขออเดอร์</p>
                        <p className="font-mono font-medium">{selectedIssue.orderId}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-muted-foreground">ลูกค้า</p>
                      <p className="font-medium">{selectedIssue.customerName} {selectedIssue.customerPhone && `(${selectedIssue.customerPhone})`}</p>
                    </div>
                  </div>

                  {/* Editable fields */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">ความผิดพลาด <span className="text-destructive">*</span></Label>
                    <Textarea
                      value={compClaimError}
                      onChange={(e) => setCompClaimError(e.target.value)}
                      placeholder="อธิบายความผิดพลาด..."
                      rows={2}
                      className="resize-none text-sm"
                    />
                  </div>

                  {/* Comp mode selector */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">เมนูชดเชย</Label>
                    <div className="flex gap-1 bg-white/60 rounded-lg p-1">
                      <button className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors ${compMode === "same" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`} onClick={() => { setCompMode("same"); setCompMenuId(""); setCompCustomName(""); }}>
                        ทำแก้วที่พลาดคืน
                      </button>
                      <button className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors ${compMode === "select" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`} onClick={() => { setCompMode("select"); setCompCustomName(""); }}>
                        เลือกจากรายการ
                      </button>
                      <button className={`flex-1 py-1.5 rounded-md text-[10px] font-medium transition-colors ${compMode === "custom" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"}`} onClick={() => { setCompMode("custom"); setCompMenuId(""); }}>
                        พิมพ์เอง
                      </button>
                    </div>

                    {compMode === "same" && (
                      <div className="bg-blue-50 rounded-lg p-2 text-xs text-blue-700">
                        <p className="font-medium">ชดเชยเมนูเดิมที่พลาด (ทำแก้วส่งคืน)</p>
                        {selectedIssue.orderDetails && <p className="mt-1">ชดเชย: {selectedIssue.orderDetails}</p>}
                      </div>
                    )}

                    {compMode === "select" && (
                      <Select value={compMenuId} onValueChange={setCompMenuId}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="เลือกเมนูชดเชย" />
                        </SelectTrigger>
                        <SelectContent>
                          {menuItems?.map((m: any) => (
                            <SelectItem key={m.id} value={String(m.id)}>{m.code} - {m.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {compMode === "select" && selectedCompMenu && (
                      <p className="text-[10px] text-muted-foreground">ชดเชย: {selectedCompMenu.code} - {selectedCompMenu.name}</p>
                    )}

                    {compMode === "custom" && (
                      <Input
                        className="h-9 text-sm"
                        placeholder="พิมพ์ชื่อเมนู เช่น Matcha Latte เย็น L"
                        value={compCustomName}
                        onChange={(e) => setCompCustomName(e.target.value)}
                      />
                    )}
                  </div>

                  {/* Remark สำหรับหน้าร้าน */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium">หมายเหตุสำหรับหน้าร้าน</Label>
                    <Input
                      className="h-9 text-sm"
                      placeholder="เช่น หวานน้อย เย็น ไซส์ L"
                      value={compRemark}
                      onChange={(e) => setCompRemark(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-medium">อายุโค้ด (วัน)</Label>
                    <Select value={compExpiryDays} onValueChange={setCompExpiryDays}>
                      <SelectTrigger className="h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7">7 วัน</SelectItem>
                        <SelectItem value="14">14 วัน</SelectItem>
                        <SelectItem value="30">30 วัน</SelectItem>
                        <SelectItem value="60">60 วัน</SelectItem>
                        <SelectItem value="90">90 วัน</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setShowCompForm(false)}
                    >
                      ยกเลิก
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 bg-amber-600 hover:bg-amber-700"
                      onClick={handleSubmitComp}
                      disabled={createCompMutation.isPending || !compClaimError.trim()}
                    >
                      {createCompMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Gift className="h-4 w-4 mr-1" />}
                      สร้างโค้ด
                    </Button>
                  </div>
                </div>
              )}

              {/* Compensation Code Result */}
              {compResultCode && (
                <div className="border border-green-200 bg-green-50/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <p className="font-semibold text-sm text-green-800">สร้างโค้ดชดเชยสำเร็จ!</p>
                  </div>

                  <div className="bg-white rounded-lg p-3">
                    <QRCodeDisplay code={compResultCode} size={120} showActions={true} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">ข้อความสำหรับส่งลูกค้า</p>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { navigator.clipboard.writeText(compResultCopyText); toast.success("คัดลอกแล้ว!"); }}>
                        <Copy className="h-3 w-3 mr-1" /> Copy
                      </Button>
                    </div>
                    <div className="bg-white rounded-lg p-2 text-xs font-mono break-all border">
                      {compResultCopyText}
                    </div>
                  </div>

                  <p className="text-[10px] text-green-700">
                    โค้ดมีอายุ {compExpiryDays} วัน (หมดอายุ {formatDate(compResultExpiresAt)})
                  </p>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => { setCompResultCode(""); setShowCompForm(false); }}
                  >
                    ปิด
                  </Button>
                </div>
              )}

              {/* Actions */}
              {selectedIssue.status === "open" && (
                <div className="space-y-2">
                  <Button
                    onClick={() => acknowledgeMutation.mutate({ id: selectedIssue.id })}
                    disabled={acknowledgeMutation.isPending}
                    className="w-full"
                  >
                    {acknowledgeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    รับทราบปัญหา
                  </Button>
                </div>
              )}

              {["acknowledged", "in_progress"].includes(selectedIssue.status) && (
                <div className="space-y-2">
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="อธิบายวิธีแก้ไข เช่น ส่งออเดอร์ใหม่ให้ลูกค้า, คืนเงิน"
                    rows={3}
                    className="resize-none"
                  />
                  <Button
                    onClick={() => resolveMutation.mutate({ id: selectedIssue.id, resolution })}
                    disabled={resolveMutation.isPending || !resolution}
                    className="w-full"
                  >
                    {resolveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    แก้ไขเรียบร้อย
                  </Button>
                </div>
              )}

              <DialogFooter className="flex gap-2">
                {!["closed", "resolved"].includes(selectedIssue.status) && (
                  <Button variant="outline" size="sm" onClick={() => escalateMutation.mutate({ id: selectedIssue.id })} disabled={escalateMutation.isPending}>
                    ส่งต่อ Super Admin
                  </Button>
                )}
                {["resolved", "escalated"].includes(selectedIssue.status) && (
                  <Button variant="outline" size="sm" onClick={() => closeMutation.mutate({ id: selectedIssue.id })} disabled={closeMutation.isPending}>
                    ปิดเรื่อง
                  </Button>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
    </AdminPageWrapper>
  );
}
