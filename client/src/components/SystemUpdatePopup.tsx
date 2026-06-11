import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hibi_system_update_popup_seen_v1";

export function SystemUpdatePopup() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY);
    if (!seen) {
      setShow(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-300">
        <h2 className="text-lg font-bold text-center text-gray-900">
          📢 แจ้งอัปเดตระบบสมาชิก Hibi Matcha Cafe
        </h2>
        <div className="text-sm text-gray-700 leading-relaxed space-y-3">
          <p>
            ขณะนี้ทางร้านมีการอัปเดตระบบบางส่วน อาจทำให้บางบัญชีถูกรีเซ็ตรหัสผ่านอัตโนมัติครับ 🙏🏻
          </p>
          <p>
            หากคุณลูกค้าไม่สามารถเข้าสู่ระบบได้ สามารถกด "ลืมรหัสผ่าน" เพื่อรีเซ็ตรหัสผ่านใหม่ในระบบได้เลยนะครับ 😊
          </p>
          <p>
            ต้องขออภัยในความไม่สะดวกด้วยนะครับ และขอบคุณมากครับที่เข้าใจ 💚
          </p>
        </div>
        <Button
          onClick={handleDismiss}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-xl"
        >
          รับทราบ
        </Button>
      </div>
    </div>
  );
}
