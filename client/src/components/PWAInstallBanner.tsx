import { useState, useEffect, Component, type ReactNode } from "react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { X, Download, Smartphone, Share, Plus, ArrowUp } from "lucide-react";

/**
 * Isolated error boundary so PWA banner never crashes the whole app.
 */
class PWAErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() { return this.state.hasError ? null : this.props.children; }
}

/**
 * Detects if the user is on iOS Safari (which doesn't support beforeinstallprompt)
 */
function isIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = (window.navigator as any).standalone === true;
  return isIOS && !isStandalone;
}

/**
 * Detects if the user is on Android
 */
function isAndroid(): boolean {
  if (typeof window === "undefined") return false;
  return /Android/.test(window.navigator.userAgent);
}

export function PWAInstallBanner() {
  return (
    <PWAErrorBoundary>
      <PWAInstallBannerInner />
    </PWAErrorBoundary>
  );
}

function PWAInstallBannerInner() {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [dismissed, setDismissed] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const isIOS = isIOSSafari();

  // Check if user dismissed before (localStorage for persistence)
  const wasDismissed =
    typeof window !== "undefined" &&
    localStorage.getItem("pwa-banner-dismissed-v2") === "true";

  // Check if already in standalone mode
  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true);

  // Delay showing the banner for better UX
  useEffect(() => {
    if (wasDismissed || isStandalone || isInstalled) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 3000); // Show after 3 seconds

    return () => clearTimeout(timer);
  }, [wasDismissed, isStandalone, isInstalled]);

  // Don't show if installed, dismissed, or not ready
  if (isInstalled || isStandalone || dismissed || wasDismissed || !isVisible) {
    // Still show iOS guide if open
    if (showIOSGuide) {
      return <IOSInstallGuide onClose={() => setShowIOSGuide(false)} />;
    }
    return null;
  }

  // On iOS, show custom banner even without beforeinstallprompt
  const shouldShow = isInstallable || isIOS;
  if (!shouldShow) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem("pwa-banner-dismissed-v2", "true");
  };

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    const accepted = await promptInstall();
    if (!accepted) {
      handleDismiss();
    }
  };

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom duration-500">
        <div className="mx-auto max-w-md rounded-2xl bg-white shadow-2xl shadow-black/20 border border-green-100 overflow-hidden">
          <div className="flex items-center gap-3 p-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-green-800 flex items-center justify-center shadow-md">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900">
                ติดตั้ง Hibi Matcha
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {isIOS
                  ? "เพิ่มลงหน้าจอเพื่อใช้งานเหมือนแอป"
                  : "เพิ่มลงหน้าจอ — เปิดเร็ว ไม่ต้องเปิดเบราว์เซอร์"}
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="ปิด"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="px-4 pb-4">
            <button
              onClick={handleInstall}
              className="w-full flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors active:scale-[0.98]"
            >
              <Download className="w-4 h-4" />
              {isIOS ? "วิธีติดตั้ง" : "ติดตั้งแอป"}
            </button>
          </div>
        </div>
      </div>

      {showIOSGuide && (
        <IOSInstallGuide onClose={() => setShowIOSGuide(false)} />
      )}
    </>
  );
}

/**
 * iOS Install Guide - step-by-step instructions for Safari
 */
function IOSInstallGuide({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md mx-3 mb-3 mb-[calc(0.75rem+env(safe-area-inset-bottom))] bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-bold text-base text-gray-900">
            วิธีติดตั้งบน iPhone / iPad
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
            aria-label="ปิด"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Steps */}
        <div className="p-4 space-y-4">
          {/* Step 1 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-sm font-bold text-green-700">1</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                กดปุ่ม <Share className="inline w-4 h-4 text-blue-500 -mt-0.5" /> แชร์
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                ที่แถบเมนูด้านล่างของ Safari
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-sm font-bold text-green-700">2</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                เลื่อนหา "<Plus className="inline w-4 h-4 -mt-0.5" /> เพิ่มไปยังหน้าจอโฮม"
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                เลื่อนลงในเมนูแชร์แล้วกดเลือก
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
              <span className="text-sm font-bold text-green-700">3</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                กด "เพิ่ม" ที่มุมขวาบน
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                แอป Hibi Matcha จะปรากฏบนหน้าจอหลัก
              </p>
            </div>
          </div>
        </div>

        {/* Visual hint - arrow pointing down to Safari share button */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-2 py-3 bg-green-50 rounded-xl">
            <ArrowUp className="w-4 h-4 text-green-600 animate-bounce" style={{ animationDuration: '1.5s' }} />
            <p className="text-xs font-medium text-green-700">
              กดปุ่มแชร์ที่แถบด้านล่าง Safari
            </p>
          </div>
        </div>

        {/* Close button */}
        <div className="px-4 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  );
}
