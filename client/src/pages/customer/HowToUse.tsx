import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  Star,
  AlertTriangle,
  Ticket,
  Gift,
  Clock,
  Coffee,
  Copy,
  QrCode,
  ShieldAlert,
  Globe,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

type Lang = "th" | "en";

interface FAQSection {
  id: string;
  icon: any;
  titleTh: string;
  titleEn: string;
  colorClass: string;
  badgeColor: string;
  stepsTh: { title: string; desc: string }[];
  stepsEn: { title: string; desc: string }[];
  limitsTh: string[];
  limitsEn: string[];
}

const sections: FAQSection[] = [
  {
    id: "rv",
    icon: Star,
    titleTh: "โค้ดรีวิว (RV)",
    titleEn: "Review Code (RV)",
    colorClass: "from-purple-500 to-purple-600",
    badgeColor: "bg-purple-100 text-purple-700",
    stepsTh: [
      { title: "สั่งเครื่องดื่ม", desc: "สั่งผ่าน Shopee, Grab, LINE MAN หรือหน้าร้าน" },
      { title: "ส่งรีวิว", desc: "ไปที่ \"ส่งรีวิวรับโค้ดฟรี\" แนบรูปภาพออเดอร์" },
      { title: "รออนุมัติ", desc: "ทีมงานตรวจสอบภายใน 2-4 วันทำการ" },
      { title: "ได้รับโค้ด", desc: "เมื่ออนุมัติ โค้ดจะปรากฏในหน้า \"โค้ดของฉัน\"" },
      { title: "เลือกเมนู", desc: "กดเลือกเมนูที่ต้องการในระบบก่อน จึงจะเห็นรหัสโค้ด" },
      { title: "ใช้โค้ด", desc: "คัดลอกรหัสไปวางในช่องหมายเหตุตอนสั่ง หรือแสดง QR ให้พนักงานสแกน" },
    ],
    stepsEn: [
      { title: "Order a drink", desc: "Order via Shopee, Grab, LINE MAN, or walk-in" },
      { title: "Submit a review", desc: "Go to \"Submit Review\" and attach your order photo" },
      { title: "Wait for approval", desc: "Our team reviews within 2-4 business days" },
      { title: "Receive code", desc: "Once approved, the code appears in \"My Codes\"" },
      { title: "Select menu item", desc: "You must select a menu item first before the code is revealed" },
      { title: "Use the code", desc: "Copy the code into the order notes, or show the QR code to staff" },
    ],
    limitsTh: [
      "โค้ดมีอายุ 30 วัน นับจากวันที่ออก",
      "ต้องเลือกเมนูในระบบก่อน จึงจะเห็นรหัสโค้ด",
      "เมื่อเลือกเมนูแล้ว ต้องใช้ภายในวันนั้น (หมดเวลาเที่ยงคืน)",
      "หากไม่ใช้ภายในวัน สามารถเลือกเมนูใหม่ได้ในวันถัดไป",
      "1 โค้ด ใช้ได้ 1 ครั้ง เท่านั้น",
      "ใช้ได้เฉพาะสาขาที่กำหนด",
    ],
    limitsEn: [
      "Code expires 30 days after issuance",
      "You must select a menu item before the code is revealed",
      "Once a menu is selected, use the code within that day (expires at midnight)",
      "If unused, you can re-select a menu the next day",
      "Each code can only be used once",
      "Valid only at the designated branch",
    ],
  },
  {
    id: "cl",
    icon: AlertTriangle,
    titleTh: "โค้ดชดเชย (CL)",
    titleEn: "Compensation Code (CL)",
    colorClass: "from-orange-500 to-orange-600",
    badgeColor: "bg-orange-100 text-orange-700",
    stepsTh: [
      { title: "แจ้งปัญหา", desc: "แจ้งปัญหาออเดอร์ผ่านระบบ หรือสาขาออกให้โดยตรง" },
      { title: "ได้รับโค้ดชดเชย", desc: "สาขาตรวจสอบและออกโค้ดชดเชยให้" },
      { title: "เลือกเมนู", desc: "กดเลือกเมนูที่ต้องการในระบบก่อน จึงจะเห็นรหัสโค้ด" },
      { title: "ใช้โค้ด", desc: "คัดลอกรหัสไปวางในช่องหมายเหตุ หรือแสดง QR ให้พนักงานสแกน" },
    ],
    stepsEn: [
      { title: "Report an issue", desc: "Report via the app, or the branch issues directly" },
      { title: "Receive compensation code", desc: "The branch reviews and issues a compensation code" },
      { title: "Select menu item", desc: "You must select a menu item first before the code is revealed" },
      { title: "Use the code", desc: "Copy the code into order notes, or show QR to staff" },
    ],
    limitsTh: [
      "โค้ดมีอายุ 30 วัน นับจากวันที่ออก",
      "ต้องเลือกเมนูในระบบก่อน จึงจะเห็นรหัสโค้ด",
      "เมื่อเลือกเมนูแล้ว ต้องใช้ภายในวันนั้น",
      "1 โค้ด ใช้ได้ 1 ครั้ง เท่านั้น",
      "ใช้ได้เฉพาะสาขาที่กำหนด",
    ],
    limitsEn: [
      "Code expires 30 days after issuance",
      "You must select a menu item before the code is revealed",
      "Once a menu is selected, use within that day",
      "Each code can only be used once",
      "Valid only at the designated branch",
    ],
  },
  {
    id: "fr",
    icon: Ticket,
    titleTh: "โค้ดแก้วแถม (Free Drink)",
    titleEn: "Free Drink Code",
    colorClass: "from-teal-500 to-teal-600",
    badgeColor: "bg-teal-100 text-teal-700",
    stepsTh: [
      { title: "ได้รับโค้ดแก้วแถม", desc: "ระบบออกโค้ดแก้วแถมให้อัตโนมัติตามเงื่อนไข (เช่น ซื้อครบ X แก้ว)" },
      { title: "ดูโค้ดในหน้า \"โค้ดแก้วแถม\"", desc: "โค้ดจะปรากฏในเมนู \"โค้ดแก้วแถม\"" },
      { title: "เลือกเมนู", desc: "กดเลือกเมนูและตัวเลือก (ความหวาน, บรรจุภัณฑ์) ก่อน จึงจะเห็นรหัส" },
      { title: "ใช้โค้ด", desc: "คัดลอกรหัสไปวางในช่องหมายเหตุ หรือแสดง QR ให้พนักงานสแกน" },
    ],
    stepsEn: [
      { title: "Receive free drink code", desc: "The system automatically issues codes based on conditions (e.g., buy X cups)" },
      { title: "View in \"Free Drinks\"", desc: "The code appears in the \"Free Drinks\" menu" },
      { title: "Select menu item", desc: "Select a menu and options (sweetness, packaging) before the code is revealed" },
      { title: "Use the code", desc: "Copy the code into order notes, or show QR to staff" },
    ],
    limitsTh: [
      "โค้ดมีอายุตามที่กำหนด (ดูวันหมดอายุในระบบ)",
      "ต้องเลือกเมนูในระบบก่อน จึงจะเห็นรหัสโค้ด",
      "เมื่อเลือกเมนูแล้ว ต้องใช้ภายในวันนั้น",
      "ไม่สามารถเปลี่ยนชนิดนมได้ (ตามที่กำหนดมา)",
      "1 โค้ด ใช้ได้ 1 ครั้ง เท่านั้น",
      "ใช้ได้เฉพาะสาขาที่กำหนด",
    ],
    limitsEn: [
      "Code expires as shown in the system",
      "You must select a menu item before the code is revealed",
      "Once a menu is selected, use within that day",
      "Milk type cannot be changed (pre-assigned)",
      "Each code can only be used once",
      "Valid only at the designated branch",
    ],
  },
  {
    id: "loyalty",
    icon: Gift,
    titleTh: "สะสมแต้มแลกรางวัล",
    titleEn: "Loyalty Points & Rewards",
    colorClass: "from-purple-500 to-pink-500",
    badgeColor: "bg-purple-100 text-purple-700",
    stepsTh: [
      { title: "สะสมแต้ม", desc: "กรอกเลขบิล/สั่งซื้อ + ยอดเงิน เพื่อขอสะสมแต้ม" },
      { title: "รออนุมัติ", desc: "สาขาตรวจสอบและอนุมัติแต้ม" },
      { title: "ดูแต้มสะสม", desc: "ดูแต้มคงเหลือในหน้า \"แต้มสะสม\"" },
      { title: "แลกรางวัล", desc: "ไปที่ \"แลกรางวัล\" เลือกรางวัลที่ต้องการ" },
      { title: "ใช้รางวัล", desc: "แสดง QR Code หรือรหัสแลกรางวัลให้พนักงาน" },
    ],
    stepsEn: [
      { title: "Earn points", desc: "Enter receipt/order number + amount to request points" },
      { title: "Wait for approval", desc: "The branch reviews and approves your points" },
      { title: "Check your points", desc: "View balance in \"My Points\"" },
      { title: "Redeem rewards", desc: "Go to \"Rewards\" and choose your reward" },
      { title: "Use reward", desc: "Show the QR code or redemption code to staff" },
    ],
    limitsTh: [
      "แต้มมีอายุตามที่กำหนด",
      "แต้มใช้ได้เฉพาะสาขาที่สะสม ไม่สามารถโอนข้ามสาขาได้",
      "รางวัลที่แลกแล้วไม่สามารถยกเลิกหรือคืนแต้มได้",
      "ต้องแสดง QR Code หรือรหัสให้พนักงานเพื่อรับรางวัล",
    ],
    limitsEn: [
      "Points expire as defined by the program",
      "Points are branch-specific and cannot be transferred between branches",
      "Redeemed rewards cannot be cancelled or refunded",
      "Show QR code or redemption code to staff to claim your reward",
    ],
  },
];

function AccordionSection({ section, lang, isOpen, onToggle }: {
  section: FAQSection;
  lang: Lang;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const Icon = section.icon;
  const title = lang === "th" ? section.titleTh : section.titleEn;
  const steps = lang === "th" ? section.stepsTh : section.stepsEn;
  const limits = lang === "th" ? section.limitsTh : section.limitsEn;

  return (
    <Card className="border shadow-sm overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
      >
        <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${section.colorClass} text-white flex items-center justify-center shrink-0`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">{title}</p>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {isOpen && (
        <CardContent className="px-4 pb-4 pt-0 space-y-4">
          {/* Steps */}
          <div>
            <p className="text-xs font-semibold text-primary mb-2 flex items-center gap-1">
              <ArrowRight className="h-3 w-3" />
              {lang === "th" ? "ขั้นตอนการใช้งาน" : "How to use"}
            </p>
            <div className="space-y-2.5">
              {steps.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{step.title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Limits */}
          <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
            <p className="text-xs font-semibold text-amber-800 mb-2 flex items-center gap-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              {lang === "th" ? "ข้อจำกัดและเงื่อนไข" : "Limitations & Conditions"}
            </p>
            <ul className="space-y-1.5">
              {limits.map((limit, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-amber-700">
                  <span className="text-amber-500 mt-0.5 shrink-0">•</span>
                  <span>{limit}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

export default function HowToUse() {
  const [lang, setLang] = useState<Lang>("th");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["rv"]));

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <MobileLayout title={lang === "th" ? "วิธีใช้งาน" : "How to Use"} showBack backPath="/customer">
      <PremiumPageContent>
        {/* Language Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">
            {lang === "th" ? "คู่มือการใช้งาน" : "User Guide"}
          </h2>
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs h-8"
            onClick={() => setLang(lang === "th" ? "en" : "th")}
          >
            <Globe className="h-3.5 w-3.5" />
            {lang === "th" ? "EN" : "TH"}
          </Button>
        </div>

        {/* Important Notice Banner */}
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3">
            <div className="flex gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-primary">
                  {lang === "th" ? "สิ่งสำคัญที่ต้องรู้" : "Important to know"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  {lang === "th"
                    ? "ทุกประเภทโค้ด ต้องเลือกเมนูในระบบก่อน จึงจะเห็นรหัสโค้ด ไม่สามารถก็อปรหัสไปใช้โดยไม่เลือกเมนูได้"
                    : "For all code types, you must select a menu item in the system first before the code is revealed. You cannot copy the code without selecting a menu."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Icons Legend */}
        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
            <Coffee className="h-4 w-4 text-primary" />
            <span className="text-[11px]">{lang === "th" ? "เลือกเมนูก่อน" : "Select menu first"}</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
            <Clock className="h-4 w-4 text-amber-500" />
            <span className="text-[11px]">{lang === "th" ? "ใช้ภายในวันนั้น" : "Use within the day"}</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
            <QrCode className="h-4 w-4 text-emerald-500" />
            <span className="text-[11px]">{lang === "th" ? "แสดง QR ให้สแกน" : "Show QR to scan"}</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/30 rounded-lg p-2">
            <Copy className="h-4 w-4 text-blue-500" />
            <span className="text-[11px]">{lang === "th" ? "ก็อปใส่หมายเหตุ" : "Copy to order notes"}</span>
          </div>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-3">
          {sections.map((section) => (
            <AccordionSection
              key={section.id}
              section={section}
              lang={lang}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggleSection(section.id)}
            />
          ))}
        </div>

        {/* General FAQ */}
        <Card className="bg-muted/30 border-0">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">
              {lang === "th" ? "คำถามที่พบบ่อย" : "Frequently Asked Questions"}
            </h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold">
                  {lang === "th" ? "Q: ทำไมไม่เห็นรหัสโค้ด?" : "Q: Why can't I see my code?"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === "th"
                    ? "A: ต้องกดเลือกเมนูในระบบก่อน ระบบจึงจะแสดงรหัสโค้ดและ QR Code ให้ เพื่อป้องกันการใช้โค้ดโดยไม่ระบุเมนู"
                    : "A: You must select a menu item first. The system will then reveal the code and QR code. This prevents using codes without specifying a menu item."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold">
                  {lang === "th" ? "Q: เลือกเมนูแล้วแต่ไม่ได้ใช้ ทำอย่างไร?" : "Q: I selected a menu but didn't use it. What now?"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === "th"
                    ? "A: หากไม่ได้ใช้ภายในวันนั้น โค้ดจะกลับมาให้เลือกเมนูใหม่ได้ในวันถัดไป (โค้ดไม่หาย)"
                    : "A: If not used within that day, the code will be available to select a new menu the next day (the code is not lost)."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold">
                  {lang === "th" ? "Q: โค้ดหมดอายุแล้วทำอย่างไร?" : "Q: My code expired. What can I do?"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === "th"
                    ? "A: โค้ดที่หมดอายุไม่สามารถใช้ได้อีก กรุณาส่งรีวิวใหม่เพื่อรับโค้ดใหม่"
                    : "A: Expired codes cannot be used. Please submit a new review to receive a new code."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold">
                  {lang === "th" ? "Q: ใช้โค้ดข้ามสาขาได้ไหม?" : "Q: Can I use a code at a different branch?"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === "th"
                    ? "A: โค้ดและแต้มสะสมใช้ได้เฉพาะสาขาที่กำหนด ไม่สามารถโอนข้ามสาขาได้"
                    : "A: Codes and loyalty points are branch-specific and cannot be transferred between branches."}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold">
                  {lang === "th" ? "Q: ก็อปโค้ดไปใช้ยังไง?" : "Q: How do I use the copied code?"}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {lang === "th"
                    ? "A: เมื่อเลือกเมนูเสร็จ กดปุ่ม \"คัดลอกโค้ด\" แล้วนำไปวางในช่องหมายเหตุ (Note) ของแอปเดลิเวอรี่ตอนสั่ง หรือแสดง QR Code ให้พนักงานที่หน้าร้าน"
                    : "A: After selecting a menu, tap \"Copy Code\" and paste it in the delivery app's notes/remarks field when ordering, or show the QR code to staff at the store."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </PremiumPageContent>
    </MobileLayout>
  );
}
