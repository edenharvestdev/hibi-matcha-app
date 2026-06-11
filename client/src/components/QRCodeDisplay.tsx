import { QRCodeSVG } from "qrcode.react";
import { Copy, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRef, useCallback } from "react";

interface QRCodeDisplayProps {
  code: string;
  size?: number;
  showActions?: boolean;
  label?: string;
}

export default function QRCodeDisplay({ code, size = 180, showActions = true, label }: QRCodeDisplayProps) {
  const qrRef = useRef<HTMLDivElement>(null);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(code);
    toast.success("คัดลอกโค้ดแล้ว!");
  }, [code]);

  const downloadQR = useCallback(() => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const padding = 32;
    const labelHeight = 48;
    const codeHeight = 36;
    const totalWidth = size + padding * 2;
    const totalHeight = size + padding * 2 + labelHeight + codeHeight;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // White background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Draw "Hibi Matcha" label
    ctx.fillStyle = "#2d6a2e";
    ctx.font = "bold 16px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Hibi Matcha", totalWidth / 2, padding);

    // Draw subtitle
    ctx.fillStyle = "#666666";
    ctx.font = "11px Inter, sans-serif";
    ctx.fillText("แสดง QR Code นี้ที่ร้าน", totalWidth / 2, padding + 18);

    // Draw QR code
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, padding, padding + labelHeight, size, size);

      // Draw code text below QR
      ctx.fillStyle = "#2d6a2e";
      ctx.font = "bold 14px monospace";
      ctx.textAlign = "center";
      ctx.fillText(code, totalWidth / 2, padding + labelHeight + size + 24);

      // Download
      const link = document.createElement("a");
      link.download = `${code}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("ดาวน์โหลด QR Code แล้ว!");
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  }, [code, size]);

  return (
    <div className="flex flex-col items-center">
      {label && (
        <p className="text-xs text-muted-foreground mb-2">{label}</p>
      )}
      <div
        ref={qrRef}
        className="bg-white rounded-2xl p-4 shadow-sm border border-primary/10 inline-flex flex-col items-center"
      >
        <QRCodeSVG
          value={code}
          size={size}
          level="H"
          includeMargin={false}
          bgColor="#ffffff"
          fgColor="#2d6a2e"
        />
        <p className="mt-3 font-mono text-sm font-bold text-primary tracking-wider">{code}</p>
      </div>

      {showActions && (
        <div className="flex gap-2 mt-3">
          <Button variant="outline" size="sm" onClick={copyCode} className="text-xs">
            <Copy className="h-3.5 w-3.5 mr-1" />
            คัดลอก
          </Button>
          <Button variant="outline" size="sm" onClick={downloadQR} className="text-xs">
            <Download className="h-3.5 w-3.5 mr-1" />
            บันทึก QR
          </Button>
        </div>
      )}
    </div>
  );
}
