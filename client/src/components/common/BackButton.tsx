import { useLocation } from "wouter";
import { ChevronLeft } from "lucide-react";

interface BackButtonProps {
  /** Fallback path if no history exists */
  fallbackPath?: string;
  /** Optional className override */
  className?: string;
}

/**
 * Reusable Back Button component — consistent across all roles.
 * 44x44px circle, light gray bg, green chevron icon.
 * Uses history.back() if available, otherwise navigates to fallbackPath.
 */
export default function BackButton({ fallbackPath = "/", className }: BackButtonProps) {
  const [, setLocation] = useLocation();

  return (
    <button
      type="button"
      onClick={() => {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          setLocation(fallbackPath);
        }
      }}
      className={`w-9 h-9 rounded-xl bg-gradient-to-br from-[#556B2F]/10 to-[#8FA28B]/10 flex items-center justify-center ring-1 ring-[#8FA28B]/20 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md hover:shadow-[#556B2F]/10 ${className ?? ""}`}
      aria-label="ย้อนกลับ"
    >
      <ChevronLeft className="h-5 w-5 text-[#355E3B]" />
    </button>
  );
}
