import { useState, useEffect } from "react";

function getGreeting(hour: number): string {
  if (hour >= 5 && hour < 12) return "สวัสดีตอนเช้า ☀️";
  if (hour >= 12 && hour < 17) return "สวัสดีตอนบ่าย 🌤";
  if (hour >= 17 && hour < 21) return "สวัสดีตอนเย็น 🌅";
  return "สวัสดีตอนดึก 🌙";
}

/**
 * Compact real-time clock for global header/navbar.
 * Shows greeting + time (HH:MM:SS) always, short date on desktop only.
 * Hover/click shows full Thai date tooltip.
 */
export default function RealtimeClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hour = now.getHours();
  const greeting = getGreeting(hour);

  const timeStr = now.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const shortDateStr = now.toLocaleDateString("th-TH", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const fullDateStr = now.toLocaleDateString("th-TH", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div
      className="flex items-center gap-1.5 select-none cursor-default"
      title={fullDateStr}
    >
      <span className="hidden md:inline text-[11px] text-[#556B2F]/70 whitespace-nowrap">
        {greeting}
      </span>
      <span className="hidden sm:inline text-[11px] text-[#556B2F]/50">
        {shortDateStr}
      </span>
      <span className="text-[12px] font-medium text-[#3D7A3A] tabular-nums font-mono tracking-tight">
        {timeStr}
      </span>
    </div>
  );
}
