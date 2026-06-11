import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, X, SwitchCamera, Loader2 } from "lucide-react";

interface QRScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export default function QRScanner({ onScan, onClose }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(true);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const hasScannedRef = useRef(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2) { // SCANNING
          await scannerRef.current.stop();
        }
      } catch {
        // ignore stop errors
      }
      try {
        scannerRef.current.clear();
      } catch {
        // ignore clear errors
      }
      scannerRef.current = null;
    }
  }, []);

  const startScanner = useCallback(async (facing: "environment" | "user") => {
    setIsStarting(true);
    setError(null);
    hasScannedRef.current = false;

    // Stop any existing scanner first
    await stopScanner();

    // Small delay to let DOM settle
    await new Promise(r => setTimeout(r, 300));

    const readerId = "qr-reader";
    const el = document.getElementById(readerId);
    if (!el) {
      setError("ไม่พบ container สำหรับกล้อง");
      setIsStarting(false);
      return;
    }

    try {
      const scanner = new Html5Qrcode(readerId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: facing },
        {
          fps: 10,
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          if (!hasScannedRef.current) {
            hasScannedRef.current = true;
            // Vibrate if supported
            if (navigator.vibrate) navigator.vibrate(100);
            onScan(decodedText);
          }
        },
        () => {
          // QR code not found in frame - ignore
        }
      );
      setIsStarting(false);
    } catch (err: any) {
      console.error("QR Scanner error:", err);
      if (err?.toString?.().includes("NotAllowedError") || err?.toString?.().includes("Permission")) {
        setError("กรุณาอนุญาตการเข้าถึงกล้อง ในการตั้งค่าเบราว์เซอร์");
      } else if (err?.toString?.().includes("NotFoundError")) {
        setError("ไม่พบกล้องบนอุปกรณ์นี้");
      } else if (err?.toString?.().includes("NotReadableError")) {
        setError("กล้องกำลังถูกใช้งานโดยแอปอื่น");
      } else {
        setError("ไม่สามารถเปิดกล้องได้ กรุณาลองใหม่อีกครั้ง");
      }
      setIsStarting(false);
    }
  }, [onScan, stopScanner]);

  useEffect(() => {
    startScanner(facingMode);
    return () => {
      stopScanner();
    };
  }, [facingMode, startScanner, stopScanner]);

  const handleSwitchCamera = () => {
    setFacingMode(prev => prev === "environment" ? "user" : "environment");
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/80">
        <div className="flex items-center gap-2 text-white">
          <Camera className="h-5 w-5" />
          <span className="font-medium text-sm">สแกน QR Code</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-9 w-9"
            onClick={handleSwitchCamera}
            title="สลับกล้อง"
          >
            <SwitchCamera className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 h-9 w-9"
            onClick={handleClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="relative w-full max-w-[320px]" ref={containerRef}>
          {/* Camera View */}
          <div
            id="qr-reader"
            className="w-full rounded-2xl overflow-hidden bg-gray-900"
            style={{ minHeight: "300px" }}
          />

          {/* Scanning overlay frame */}
          {!error && !isStarting && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[220px] h-[220px] relative">
                {/* Corner decorations */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-3 border-l-3 border-green-400 rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-3 border-r-3 border-green-400 rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-3 border-l-3 border-green-400 rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-3 border-r-3 border-green-400 rounded-br-lg" />
                {/* Scanning line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-green-400/80 animate-scan-line" />
              </div>
            </div>
          )}

          {/* Loading state */}
          {isStarting && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/80 rounded-2xl">
              <Loader2 className="h-8 w-8 text-green-400 animate-spin mb-3" />
              <p className="text-white text-sm">กำลังเปิดกล้อง...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/90 rounded-2xl px-6">
              <Camera className="h-10 w-10 text-red-400 mb-3" />
              <p className="text-white text-sm text-center mb-4">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="text-white border-white/30 hover:bg-white/10"
                onClick={() => startScanner(facingMode)}
              >
                ลองใหม่
              </Button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 text-center">
          <p className="text-white/80 text-sm">
            หันกล้องไปที่ QR Code บนหน้าจอลูกค้า
          </p>
          <p className="text-white/50 text-xs mt-1">
            ระบบจะสแกนอัตโนมัติเมื่อพบ QR Code
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 pb-6 pt-3">
        <Button
          variant="outline"
          className="w-full text-white border-white/30 hover:bg-white/10"
          onClick={handleClose}
        >
          ยกเลิก
        </Button>
      </div>

      {/* Scan line animation CSS */}
      <style>{`
        @keyframes scanLine {
          0% { top: 10%; }
          50% { top: 85%; }
          100% { top: 10%; }
        }
        .animate-scan-line {
          animation: scanLine 2.5s ease-in-out infinite;
        }
        #qr-reader video {
          border-radius: 1rem !important;
          object-fit: cover !important;
        }
        #qr-reader img[alt="Info icon"] {
          display: none !important;
        }
        #qr-reader > div:last-child {
          display: none !important;
        }
      `}</style>
    </div>
  );
}
