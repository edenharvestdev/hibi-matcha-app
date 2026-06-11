import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Building2, ShoppingBag, PartyPopper, Filter, Phone, Mail, MapPin, Send, ArrowLeft } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import BackButton from "@/components/common/BackButton";
import AdminPageWrapper from "@/components/AdminPageWrapper";


const TYPE_CONFIG: Record<string, { label: string; icon: typeof Building2; color: string }> = {
  franchise: { label: "แฟรนไชส์", icon: Building2, color: "text-emerald-600 bg-emerald-50" },
  wholesale: { label: "ราคาส่ง", icon: ShoppingBag, color: "text-teal-600 bg-teal-50" },
  event: { label: "Event", icon: PartyPopper, color: "text-blue-600 bg-blue-50" },
  other: { label: "อื่นๆ", icon: Building2, color: "text-gray-600 bg-gray-50" },
};

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  new: { label: "ใหม่", variant: "destructive" },
  contacted: { label: "ติดต่อแล้ว", variant: "secondary" },
  in_progress: { label: "กำลังดำเนินการ", variant: "default" },
  closed: { label: "ปิดแล้ว", variant: "outline" },
};

const EMAIL_TEMPLATES: Record<string, string> = {
  franchise: `สวัสดีค่ะ/ครับ

ขอบคุณที่สนใจแฟรนไชส์ Hibi Matcha

ทีมงานได้ตรวจสอบข้อมูลของท่านแล้ว ขอนัดหมายเพื่อพูดคุยรายละเอียดเพิ่มเติมเกี่ยวกับ:
- รูปแบบแฟรนไชส์และค่าใช้จ่าย
- ทำเลที่ตั้งและเงื่อนไข
- ขั้นตอนการเปิดร้าน

กรุณาแจ้งวันเวลาที่สะดวกเพื่อนัดหมาย

ขอบคุณค่ะ/ครับ`,
  wholesale: `สวัสดีค่ะ/ครับ

ขอบคุณที่สนใจสั่งซื้อชา Matcha ราคาส่งจาก Hibi Matcha

ทีมงานได้เตรียมรายละเอียดราคาและเงื่อนไขการสั่งซื้อไว้ให้แล้ว:
- รายการสินค้าและราคาส่ง
- ขั้นต่ำในการสั่งซื้อ
- ระยะเวลาจัดส่ง

กรุณาแจ้งวันเวลาที่สะดวกเพื่อพูดคุยรายละเอียดเพิ่มเติม

ขอบคุณค่ะ/ครับ`,
  event: `สวัสดีค่ะ/ครับ

ขอบคุณที่สนใจบริการจัดงาน Event กับ Hibi Matcha

ทีมงานได้ตรวจสอบรายละเอียดงานของท่านแล้ว ขอนัดหมายเพื่อหารือเกี่ยวกับ:
- รูปแบบบูธและเมนู
- จำนวนแขกและงบประมาณ
- วันเวลาและสถานที่จัดงาน

กรุณาแจ้งวันเวลาที่สะดวกเพื่อนัดหมาย

ขอบคุณค่ะ/ครับ`,
  other: `สวัสดีค่ะ/ครับ

ขอบคุณที่ติดต่อ Hibi Matcha

ทีมงานได้ตรวจสอบข้อมูลของท่านแล้ว ขอแจ้งรายละเอียดเพิ่มเติมดังนี้:



กรุณาแจ้งหากมีคำถามเพิ่มเติม

ขอบคุณค่ะ/ครับ`,
};

export default function AdminInquiries() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null);
  const [notes, setNotes] = useState("");
  const [newStatus, setNewStatus] = useState<string>("");
  // Email compose state
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailMessage, setEmailMessage] = useState("");
  const [emailTarget, setEmailTarget] = useState<any>(null);

  const { data: inquiries, isLoading, refetch } = trpc.inquiries.list.useQuery({
    type: typeFilter !== "all" ? typeFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const updateMutation = trpc.inquiries.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตเรียบร้อย");
      refetch();
      setSelectedInquiry(null);
      setNotes("");
      setNewStatus("");
    },
    onError: (err) => toast.error(err.message),
  });

  const sendEmailMutation = trpc.inquiries.sendEmail.useMutation({
    onSuccess: (data) => {
      if (data.emailSent) {
        toast.success("ส่งอีเมลตอบกลับเรียบร้อย");
      } else {
        toast.warning("บันทึกแล้ว แต่ส่งอีเมลไม่สำเร็จ (ยังไม่ได้ตั้งค่า Email Service)");
      }
      setShowEmailDialog(false);
      setEmailMessage("");
      setEmailTarget(null);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const openEmailCompose = (inquiry: any) => {
    setEmailTarget(inquiry);
    setEmailMessage(EMAIL_TEMPLATES[inquiry.type] || EMAIL_TEMPLATES.other);
    setShowEmailDialog(true);
  };

  return (
    <AdminPageWrapper title="ข้อมูลติดต่อ" subtitle="แฟรนไชส์, ราคาส่ง, Event, และอื่นๆ" backPath="/admin" loading={isLoading}>
    <div className="space-y-5">

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-32 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกประเภท</SelectItem>
            <SelectItem value="franchise">แฟรนไชส์</SelectItem>
            <SelectItem value="wholesale">ราคาส่ง</SelectItem>
            <SelectItem value="event">Event</SelectItem>
            <SelectItem value="other">อื่นๆ</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ทุกสถานะ</SelectItem>
            <SelectItem value="new">ใหม่</SelectItem>
            <SelectItem value="contacted">ติดต่อแล้ว</SelectItem>
            <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
            <SelectItem value="closed">ปิดแล้ว</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-muted-foreground">{inquiries?.length ?? 0} รายการ</span>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : !inquiries?.length ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-8 text-center">
            <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลติดต่อ</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {inquiries.map((inq: any) => {
            const typeCfg = TYPE_CONFIG[inq.type] || TYPE_CONFIG.other;
            const statusCfg = STATUS_LABELS[inq.status] || STATUS_LABELS.new;
            const Icon = typeCfg.icon;
            return (
              <Card
                key={inq.id}
                className="border shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => { setSelectedInquiry(inq); setNotes(inq.notes || ""); setNewStatus(inq.status); }}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${typeCfg.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{inq.name}</p>
                          <Badge variant={statusCfg.variant} className="text-[10px] h-5">{statusCfg.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-muted-foreground">{inq.phone}</p>
                          {inq.email && <span className="text-xs text-primary flex items-center gap-0.5"><Mail className="h-3 w-3" /> มีอีเมล</span>}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{inq.message}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground flex-shrink-0">
                      {formatDate(inq.createdAt, { shortYear: true })}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={!!selectedInquiry} onOpenChange={(open) => { if (!open) setSelectedInquiry(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              {selectedInquiry && TYPE_CONFIG[selectedInquiry.type]?.label}
              {selectedInquiry && <Badge variant={STATUS_LABELS[selectedInquiry.status]?.variant}>{STATUS_LABELS[selectedInquiry.status]?.label}</Badge>}
            </DialogTitle>
          </DialogHeader>
          {selectedInquiry && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">ชื่อ</p>
                  <p className="font-medium">{selectedInquiry.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">เบอร์โทร</p>
                  <a href={`tel:${selectedInquiry.phone}`} className="font-medium text-primary flex items-center gap-1">
                    <Phone className="h-3 w-3" />{selectedInquiry.phone}
                  </a>
                </div>
                {selectedInquiry.email && (
                  <div>
                    <p className="text-muted-foreground">อีเมล</p>
                    <a href={`mailto:${selectedInquiry.email}`} className="font-medium text-primary flex items-center gap-1">
                      <Mail className="h-3 w-3" />{selectedInquiry.email}
                    </a>
                  </div>
                )}
                {selectedInquiry.company && (
                  <div>
                    <p className="text-muted-foreground">บริษัท</p>
                    <p className="font-medium">{selectedInquiry.company}</p>
                  </div>
                )}
                {selectedInquiry.province && (
                  <div>
                    <p className="text-muted-foreground">จังหวัด</p>
                    <p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedInquiry.province}</p>
                  </div>
                )}
                {selectedInquiry.budget && (
                  <div>
                    <p className="text-muted-foreground">งบประมาณ</p>
                    <p className="font-medium">{selectedInquiry.budget}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">ข้อความ</p>
                <p className="text-sm bg-muted/30 p-3 rounded-lg">{selectedInquiry.message}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">สถานะ</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">ใหม่</SelectItem>
                    <SelectItem value="contacted">ติดต่อแล้ว</SelectItem>
                    <SelectItem value="in_progress">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="closed">ปิดแล้ว</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">บันทึก</p>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="บันทึกการติดต่อ, ข้อตกลง, สิ่งที่ต้องทำ"
                  rows={3}
                  className="resize-none"
                />
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                <Button
                  onClick={() => updateMutation.mutate({ id: selectedInquiry.id, status: newStatus as any, notes: notes || undefined })}
                  disabled={updateMutation.isPending}
                  className="w-full"
                >
                  {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  บันทึก
                </Button>
                {selectedInquiry.email && (
                  <Button
                    variant="outline"
                    onClick={() => openEmailCompose(selectedInquiry)}
                    className="w-full border-primary text-primary hover:bg-primary/5"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    ส่งอีเมลตอบกลับ
                  </Button>
                )}
                {!selectedInquiry.email && (
                  <p className="text-xs text-muted-foreground text-center">ลูกค้าไม่ได้ระบุอีเมล ไม่สามารถส่งอีเมลได้</p>
                )}
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Email compose dialog */}
      <Dialog open={showEmailDialog} onOpenChange={(open) => { if (!open) { setShowEmailDialog(false); setEmailTarget(null); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              ส่งอีเมลตอบกลับ
            </DialogTitle>
          </DialogHeader>
          {emailTarget && (
            <div className="space-y-4">
              <div className="bg-muted/30 p-3 rounded-lg text-xs space-y-1">
                <p><span className="text-muted-foreground">ถึง:</span> <span className="font-medium">{emailTarget.name}</span> ({emailTarget.email})</p>
                <p><span className="text-muted-foreground">ประเภท:</span> {TYPE_CONFIG[emailTarget.type]?.label}</p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1">ข้อความ (จะถูกส่งในรูปแบบอีเมลสวยงาม พร้อมโลโก้ Hibi Matcha)</p>
                <Textarea
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="พิมพ์ข้อความตอบกลับ..."
                  rows={10}
                  className="resize-none text-sm"
                />
                <p className="text-[10px] text-muted-foreground mt-1">
                  {emailMessage.length} ตัวอักษร (ขั้นต่ำ 5)
                </p>
              </div>

              <DialogFooter className="flex flex-col gap-2 sm:flex-col">
                <Button
                  onClick={() => sendEmailMutation.mutate({ id: emailTarget.id, message: emailMessage })}
                  disabled={sendEmailMutation.isPending || emailMessage.trim().length < 5}
                  className="w-full"
                >
                  {sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  ส่งอีเมล
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => { setShowEmailDialog(false); setEmailTarget(null); }}
                  className="w-full"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  กลับ
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
    </AdminPageWrapper>
  );
}
