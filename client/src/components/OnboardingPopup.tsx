import { useState } from "react";
import { X, Coins, Star, Gift, QrCode, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "hibi-onboarding-seen-v1";

interface OnboardingPopupProps {
  onClose: () => void;
}

const slides = [
  {
    icon: Sparkles,
    iconBg: "bg-gradient-to-br from-amber-400 to-amber-600",
    title: "ยินดีต้อนรับสู่ Hibi Matcha!",
    subtitle: "สมาชิกรับสิทธิพิเศษมากมาย",
    body: "สั่งเครื่องดื่ม สะสมแต้ม แลกของรางวัล\nและรับโค้ดเครื่องดื่มฟรีง่ายๆ",
  },
  {
    icon: Star,
    iconBg: "bg-gradient-to-br from-yellow-400 to-orange-500",
    title: "รีวิว = โค้ดฟรี",
    subtitle: "สั่ง 1 ออเดอร์ รีวิว 1 ครั้ง",
    body: "สั่งเครื่องดื่มผ่าน Shopee / Lineman / Grab\nรีวิวพร้อมแนบรูป รอเจ้าหน้าที่อนุมัติ\nรับโค้ดฟรีใส่ในออเดอร์ถัดไป!",
  },
  {
    icon: Coins,
    iconBg: "bg-gradient-to-br from-purple-400 to-purple-600",
    title: "สะสมแต้มทุกบิล",
    subtitle: "ยิ่งซื้อ ยิ่งได้",
    body: "กรอกเลขบิล + ยอดเงิน รอเจ้าหน้าที่อนุมัติ\nแต้มสะสมแยกตามสาขา\nใช้แต้มแลกของรางวัลได้เลย!",
  },
  {
    icon: Gift,
    iconBg: "bg-gradient-to-br from-pink-400 to-rose-500",
    title: "แลกของรางวัล",
    subtitle: "ใช้แต้มแลกได้ทันที",
    body: "เลือกสาขา → ดูแต้มคงเหลือ → เลือกรางวัล\nแสดงโค้ดให้พนักงานที่ร้าน\nรับของรางวัลได้เลย!",
  },
];

export default function OnboardingPopup({ onClose }: OnboardingPopupProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    onClose();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const slide = slides[currentSlide];
  const isLast = currentSlide === slides.length - 1;
  const Icon = slide.icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Close button */}
        <div className="flex justify-end p-3 pb-0">
          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="ข้าม"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 pb-2 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${slide.iconBg}`}>
              <Icon className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-lg font-bold text-gray-900">{slide.title}</h2>
          <p className="text-xs text-primary font-medium mt-1">{slide.subtitle}</p>

          {/* Body */}
          <p className="text-sm text-gray-600 mt-3 leading-relaxed whitespace-pre-line">
            {slide.body}
          </p>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 py-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentSlide
                  ? "w-6 bg-primary"
                  : "w-1.5 bg-gray-200 hover:bg-gray-300"
              }`}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex items-center gap-3">
          {currentSlide > 0 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="flex-shrink-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-xs text-gray-400"
            >
              ข้าม
            </Button>
          )}

          <Button
            onClick={handleNext}
            className="flex-1 h-10 text-sm font-semibold bg-primary hover:bg-primary/90"
          >
            {isLast ? (
              "เริ่มใช้งาน!"
            ) : (
              <span className="flex items-center gap-1">
                ถัดไป <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to check if onboarding should be shown
 */
export function useOnboarding() {
  const hasSeen =
    typeof window !== "undefined" &&
    localStorage.getItem(STORAGE_KEY) === "true";

  return { shouldShow: !hasSeen };
}
