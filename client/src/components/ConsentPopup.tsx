import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Shield, FileText, Loader2 } from "lucide-react";

const PDPA_TEXT = `นโยบายคุ้มครองข้อมูลส่วนบุคคล (PDPA)

บริษัท Hibi Matcha ("บริษัท") ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่าน ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562

ข้อมูลที่เราเก็บรวบรวม:
• ชื่อ-นามสกุล, เบอร์โทรศัพท์, อีเมล
• ที่อยู่ (กรณีจัดส่ง)
• ประวัติการสั่งซื้อและการใช้บริการ
• ข้อมูลการสะสมแต้มและแลกรางวัล

วัตถุประสงค์ในการใช้ข้อมูล:
• ให้บริการสมาชิกและระบบสะสมแต้ม
• ติดต่อสื่อสารเกี่ยวกับคำสั่งซื้อและโปรโมชั่น
• ปรับปรุงคุณภาพสินค้าและบริการ
• ปฏิบัติตามกฎหมายที่เกี่ยวข้อง

สิทธิของท่าน:
• สิทธิในการเข้าถึงข้อมูลส่วนบุคคล
• สิทธิในการแก้ไขข้อมูลให้ถูกต้อง
• สิทธิในการลบข้อมูล
• สิทธิในการเพิกถอนความยินยอม
• สิทธิในการร้องเรียน

ท่านสามารถติดต่อเราได้ที่ LINE: @hibimatcha หรืออีเมล: privacy@hibimatcha.com

ระยะเวลาการเก็บรักษาข้อมูล:
เราจะเก็บรักษาข้อมูลของท่านตลอดระยะเวลาที่ท่านเป็นสมาชิก และอีก 2 ปีหลังจากยกเลิกสมาชิก เพื่อวัตถุประสงค์ทางกฎหมาย`;

const TERMS_TEXT = `ข้อตกลงและเงื่อนไขการใช้บริการ

1. การเป็นสมาชิก
   - สมาชิกต้องลงทะเบียนด้วยข้อมูลจริง
   - บัญชีสมาชิก 1 บัญชีต่อ 1 เบอร์โทรศัพท์
   - ห้ามโอนหรือแบ่งปันบัญชีสมาชิก

2. ระบบสะสมแต้ม
   - แต้มสะสมมีอายุ 1 ปีนับจากวันที่ได้รับ
   - แต้มสะสมใช้ได้เฉพาะสาขาที่ลงทะเบียน
   - ไม่สามารถโอนแต้มข้ามสาขาได้
   - บริษัทสงวนสิทธิ์ในการปรับเปลี่ยนอัตราแต้ม

3. โค้ดแก้วแถม (Free Drink Code)
   - โค้ดมีอายุตามที่กำหนดในแต่ละแคมเปญ
   - ใช้ได้เฉพาะสาขาที่ออกโค้ดให้
   - ไม่สามารถแลกเป็นเงินสดได้
   - 1 โค้ดใช้ได้ 1 ครั้งเท่านั้น

4. การแลกรางวัล
   - ต้องยืนยันตัวตนก่อนแลกรางวัลทุกครั้ง
   - รางวัลที่แลกแล้วไม่สามารถคืนแต้มได้
   - บริษัทสงวนสิทธิ์ในการเปลี่ยนแปลงรางวัล

5. การยกเลิกสมาชิก
   - สมาชิกสามารถยกเลิกได้ทุกเมื่อ
   - แต้มและสิทธิ์ที่เหลือจะถูกยกเลิกทั้งหมด

6. ข้อจำกัดความรับผิดชอบ
   - บริษัทสงวนสิทธิ์ในการเปลี่ยนแปลงเงื่อนไข
   - การใช้บริการถือว่ายอมรับเงื่อนไขทั้งหมด`;

interface ConsentPopupProps {
  onAccepted: () => void;
}

export default function ConsentPopup({ onAccepted }: ConsentPopupProps) {
  const [pdpaChecked, setPdpaChecked] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);
  const [activeTab, setActiveTab] = useState<"pdpa" | "terms">("pdpa");

  const acceptAll = trpc.consent.acceptAll.useMutation({
    onSuccess: () => {
      onAccepted();
    },
  });

  const canAccept = pdpaChecked && termsChecked;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col items-center justify-end sm:justify-center p-0 sm:p-4">
      <div className="bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl w-full sm:max-w-lg flex flex-col" style={{ maxHeight: "92vh" }}>
        {/* Header - fixed */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-5 py-4 sm:rounded-t-2xl rounded-t-2xl shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 shrink-0" />
            <div>
              <h2 className="text-base font-bold">ข้อตกลงและความยินยอม</h2>
              <p className="text-xs text-emerald-100">กรุณาอ่านและยอมรับก่อนใช้งาน</p>
            </div>
          </div>
        </div>

        {/* Tabs - fixed */}
        <div className="flex border-b shrink-0">
          <button
            onClick={() => setActiveTab("pdpa")}
            className={`flex-1 py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "pdpa"
                ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Shield className="h-4 w-4" />
            PDPA
          </button>
          <button
            onClick={() => setActiveTab("terms")}
            className={`flex-1 py-2.5 px-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === "terms"
                ? "text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="h-4 w-4" />
            ข้อตกลง
          </button>
        </div>

        {/* Content - scrollable */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain px-5 py-4"
          style={{ WebkitOverflowScrolling: "touch" as any, minHeight: 0 }}
        >
          <div className="text-sm text-gray-700 whitespace-pre-line leading-relaxed pb-2">
            {activeTab === "pdpa" ? PDPA_TEXT : TERMS_TEXT}
          </div>
        </div>

        {/* Footer - fixed at bottom */}
        <div className="border-t px-5 py-3 space-y-2.5 bg-gray-50 shrink-0 sm:rounded-b-2xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={pdpaChecked}
              onCheckedChange={(v) => setPdpaChecked(!!v)}
              className="mt-0.5"
            />
            <span className="text-xs text-gray-700">
              ข้าพเจ้ายินยอมให้เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลตาม
              <span className="text-emerald-700 font-medium"> นโยบาย PDPA</span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox
              checked={termsChecked}
              onCheckedChange={(v) => setTermsChecked(!!v)}
              className="mt-0.5"
            />
            <span className="text-xs text-gray-700">
              ข้าพเจ้ายอมรับ
              <span className="text-emerald-700 font-medium"> ข้อตกลงและเงื่อนไขการใช้บริการ</span>
            </span>
          </label>

          <Button
            onClick={() => acceptAll.mutate()}
            disabled={!canAccept || acceptAll.isPending}
            className="w-full h-11 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700"
          >
            {acceptAll.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังบันทึก...</>
            ) : (
              "ยอมรับและดำเนินการต่อ"
            )}
          </Button>

          <p className="text-[10px] text-center text-gray-400 pb-1">
            เวอร์ชัน 1.0 • มีผลตั้งแต่วันที่ 1 มกราคม 2569
          </p>
        </div>
      </div>
    </div>
  );
}
