import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  Coffee,
  Clock,
  QrCode,
  ArrowRight,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";

const STORAGE_KEY = "hibi_howto_use_seen";

interface HowToUsePopupProps {
  /** Which page context: "codes" for MyCodes, "free-drinks" for FreeDrinks */
  context: "codes" | "free-drinks";
}

/**
 * Auto-popup that shows on first visit to MyCodes or FreeDrinks pages.
 * Explains the key rule: must select menu before seeing the code.
 * Also provides a link to re-open and to the full FAQ page.
 */
export default function HowToUsePopup({ context }: HowToUsePopupProps) {
  const storageKey = `${STORAGE_KEY}_${context}`;
  const [, setLocation] = useLocation();
  const [showPopup, setShowPopup] = useState(() => {
    const seen = sessionStorage.getItem(storageKey);
    return !seen;
  });

  const dismiss = () => {
    sessionStorage.setItem(storageKey, "1");
    setShowPopup(false);
  };

  const goToFAQ = () => {
    dismiss();
    setLocation("/customer/how-to-use");
  };

  return (
    <>
      {/* Auto Popup */}
      <Dialog open={showPopup} onOpenChange={(o) => { if (!o) dismiss(); }}>
        <DialogContent className="max-w-sm mx-auto max-h-[85vh] overflow-y-auto p-5">
          <div className="space-y-4">
            {/* Header */}
            <div className="text-center">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Coffee className="h-7 w-7 text-primary" />
              </div>
              <h3 className="font-bold text-base">วิธีใช้โค้ด</h3>
              <p className="text-xs text-muted-foreground mt-1">How to use your code</p>
            </div>

            {/* Key Steps */}
            <div className="space-y-2.5">
              <div className="flex items-start gap-3 bg-primary/5 rounded-lg p-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
                <div>
                  <p className="text-xs font-semibold">เลือกเมนูก่อน</p>
                  <p className="text-[11px] text-muted-foreground">กดปุ่ม "เลือกเมนู" เพื่อเลือกเมนูที่ต้องการ</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">Select a menu item first</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-primary/5 rounded-lg p-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
                <div>
                  <p className="text-xs font-semibold">ระบบแสดงรหัสโค้ด</p>
                  <p className="text-[11px] text-muted-foreground">เมื่อยืนยันเลือกเมนูแล้ว จะเห็นรหัสโค้ดและ QR Code</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">Code & QR revealed after menu confirmation</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-primary/5 rounded-lg p-3">
                <span className="flex-shrink-0 h-6 w-6 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
                <div>
                  <p className="text-xs font-semibold">ใช้โค้ดภายในวันนั้น</p>
                  <p className="text-[11px] text-muted-foreground">คัดลอกโค้ดใส่หมายเหตุ หรือแสดง QR ให้พนักงานสแกน</p>
                  <p className="text-[10px] text-muted-foreground/70 mt-0.5 italic">Use within the same day via copy or QR scan</p>
                </div>
              </div>
            </div>

            {/* Important Limits */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <p className="text-xs font-semibold text-amber-800 flex items-center gap-1 mb-1.5">
                <ShieldAlert className="h-3.5 w-3.5" />
                ข้อจำกัดสำคัญ / Important limits
              </p>
              <ul className="space-y-1">
                <li className="flex items-start gap-1.5 text-[11px] text-amber-700">
                  <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>ต้องใช้ภายในวันที่เลือกเมนู (หมดเวลาเที่ยงคืน)<br/><span className="text-[10px] opacity-70">Must use within the day of menu selection</span></span>
                </li>
                <li className="flex items-start gap-1.5 text-[11px] text-amber-700">
                  <QrCode className="h-3 w-3 mt-0.5 shrink-0" />
                  <span>1 โค้ด ใช้ได้ 1 ครั้งเท่านั้น<br/><span className="text-[10px] opacity-70">Each code is single-use only</span></span>
                </li>
              </ul>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button onClick={dismiss} className="w-full bg-primary hover:bg-primary/90">
                เข้าใจแล้ว / Got it
              </Button>
              <Button variant="outline" onClick={goToFAQ} className="w-full gap-1.5 text-xs">
                <HelpCircle className="h-3.5 w-3.5" />
                ดูคู่มือฉบับเต็ม / Full Guide
                <ArrowRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Re-open link */}
      <button
        onClick={() => setShowPopup(true)}
        className="text-xs text-primary underline hover:text-primary/80 flex items-center gap-1"
      >
        <HelpCircle className="h-3 w-3" />
        วิธีใช้โค้ด / How to use
      </button>
    </>
  );
}
