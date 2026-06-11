import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, ChevronLeft, CheckCircle2, Building2, ShoppingBag, PartyPopper } from "lucide-react";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029164707/lBgSgkEWqcVXTljA.jpeg";

const TYPE_CONFIG: Record<string, { title: string; subtitle: string; icon: typeof Building2; color: string; placeholder: string }> = {
  franchise: {
    title: "สอบถามซื้อแฟรนไชส์",
    subtitle: "สนใจเปิดร้าน Hibi Matcha สาขาของคุณ",
    icon: Building2,
    color: "text-emerald-600",
    placeholder: "เช่น สนใจเปิดสาขาที่จังหวัดอะไร, งบประมาณ, ประสบการณ์ธุรกิจ",
  },
  wholesale: {
    title: "สั่งซื้อชาราคาส่ง",
    subtitle: "Matcha คุณภาพสำหรับร้านค้า/ธุรกิจ",
    icon: ShoppingBag,
    color: "text-teal-600",
    placeholder: "เช่น ต้องการ Matcha ชนิดไหน, ปริมาณ, ความถี่ในการสั่ง",
  },
  event: {
    title: "ติดต่อธุรกิจ / จัดงาน Event",
    subtitle: "จัดเลี้ยง, Event, Catering, Corporate Break",
    icon: PartyPopper,
    color: "text-blue-600",
    placeholder: "เช่น วันที่จัดงาน, จำนวนคน, สถานที่, รูปแบบงาน",
  },
};

export default function ContactForm() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/contact/:type");
  const type = (params?.type || "other") as "franchise" | "wholesale" | "event" | "other";
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.franchise;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState("");
  const [budget, setBudget] = useState("");
  const [province, setProvince] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const submitMutation = trpc.inquiries.submit.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setSubmitted(true);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !message) {
      toast.error("กรุณากรอกชื่อ เบอร์โทร และข้อความ");
      return;
    }
    submitMutation.mutate({
      type: type === "other" ? "other" : type,
      name,
      phone,
      email: email || undefined,
      company: company || undefined,
      message,
      budget: budget || undefined,
      province: province || undefined,
    });
  };

  const Icon = config.icon;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-50 mx-auto">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold">ส่งข้อมูลเรียบร้อย!</h2>
            <p className="text-sm text-muted-foreground mt-2">
              ทีมงาน Hibi Matcha จะติดต่อกลับโดยเร็วที่สุด
            </p>
          </div>
          <div className="space-y-2">
            <Button onClick={() => setLocation("/welcome")} className="w-full">
              กลับหน้าหลัก
            </Button>
            <Button variant="outline" onClick={() => { setSubmitted(false); setName(""); setPhone(""); setEmail(""); setCompany(""); setMessage(""); setBudget(""); setProvince(""); }} className="w-full">
              ส่งอีกครั้ง
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <button onClick={() => { if (window.history.length > 1) window.history.back(); else setLocation("/welcome"); }} className="p-1">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <img src={LOGO_URL} alt="Hibi" className="h-8 w-8 rounded-full bg-white object-cover" />
          <span className="font-semibold text-base">{config.title}</span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Info banner */}
        <div className="flex items-center gap-3 mb-6 p-4 bg-muted/30 rounded-xl">
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-white shadow-sm`}>
            <Icon className={`h-5 w-5 ${config.color}`} />
          </div>
          <div>
            <p className="font-medium text-sm">{config.title}</p>
            <p className="text-xs text-muted-foreground">{config.subtitle}</p>
          </div>
        </div>

        <Card className="border-0 shadow-sm">
          <CardContent className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">ชื่อ-นามสกุล *</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อของคุณ" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">เบอร์โทร *</Label>
                  <Input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} placeholder="0812345678" maxLength={15} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">อีเมล</Label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">บริษัท/ร้านค้า</Label>
                  <Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="ชื่อบริษัท (ถ้ามี)" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">จังหวัด</Label>
                  <Input value={province} onChange={(e) => setProvince(e.target.value)} placeholder="จังหวัด" />
                </div>
                {type === "franchise" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">งบประมาณ</Label>
                    <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="เช่น 500,000 บาท" />
                  </div>
                )}
                {type === "event" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">งบประมาณ</Label>
                    <Input value={budget} onChange={(e) => setBudget(e.target.value)} placeholder="เช่น 10,000 บาท" />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">รายละเอียด *</Label>
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={config.placeholder}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <Button type="submit" className="w-full h-11" disabled={submitMutation.isPending}>
                {submitMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังส่ง...</>
                ) : (
                  "ส่งข้อมูล"
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center">
                ทีมงานจะติดต่อกลับภายใน 1-2 วันทำการ
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
