import { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight, X } from "lucide-react";

interface DateRangePickerModalProps {
  /** Currently applied start date (YYYY-MM-DD) */
  dateFrom: string;
  /** Currently applied end date (YYYY-MM-DD) */
  dateTo: string;
  /** Called when user confirms selection */
  onApply: (from: string, to: string) => void;
  /** Called when user clears the filter */
  onClear: () => void;
}

const SHORTCUTS = [
  { label: "วันนี้", getDates: () => { const t = fmt(new Date()); return [t, t]; } },
  { label: "เมื่อวาน", getDates: () => { const d = new Date(); d.setDate(d.getDate() - 1); const t = fmt(d); return [t, t]; } },
  { label: "7 วันล่าสุด", getDates: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 6); return [fmt(s), fmt(e)]; } },
  { label: "14 วันล่าสุด", getDates: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 13); return [fmt(s), fmt(e)]; } },
  { label: "30 วันล่าสุด", getDates: () => { const e = new Date(); const s = new Date(); s.setDate(s.getDate() - 29); return [fmt(s), fmt(e)]; } },
  { label: "เดือนนี้", getDates: () => { const n = new Date(); return [fmt(new Date(n.getFullYear(), n.getMonth(), 1)), fmt(n)]; } },
  { label: "ปีนี้", getDates: () => { const n = new Date(); return [fmt(new Date(n.getFullYear(), 0, 1)), fmt(n)]; } },
  { label: "ปีที่แล้ว", getDates: () => { const n = new Date(); const y = n.getFullYear() - 1; return [fmt(new Date(y, 0, 1)), fmt(new Date(y, 11, 31))]; } },
];

function fmt(d: Date) {
  return d.toISOString().slice(0, 10);
}

function formatShortDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "2-digit" });
}

/**
 * Reusable Date Range Picker with trigger button + modal.
 * Usage:
 * ```tsx
 * <DateRangePickerModal
 *   dateFrom={dateFrom}
 *   dateTo={dateTo}
 *   onApply={(from, to) => { setDateFrom(from); setDateTo(to); }}
 *   onClear={() => { setDateFrom(""); setDateTo(""); }}
 * />
 * ```
 */
export default function DateRangePickerModal({ dateFrom, dateTo, onApply, onClear }: DateRangePickerModalProps) {
  const [showModal, setShowModal] = useState(false);
  const [calMonth, setCalMonth] = useState(() => new Date().getMonth());
  const [calYear, setCalYear] = useState(() => new Date().getFullYear());
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const getButtonLabel = useCallback(() => {
    if (!dateFrom && !dateTo) return null;
    if (dateFrom && dateTo) return `${formatShortDate(dateFrom)} – ${formatShortDate(dateTo)}`;
    if (dateFrom) return `ตั้งแต่ ${formatShortDate(dateFrom)}`;
    return `ถึง ${formatShortDate(dateTo)}`;
  }, [dateFrom, dateTo]);

  const openModal = () => {
    setRangeStart(dateFrom);
    setRangeEnd(dateTo);
    const ref = dateFrom ? new Date(dateFrom) : new Date();
    setCalMonth(ref.getMonth());
    setCalYear(ref.getFullYear());
    setShowModal(true);
  };

  const handleConfirm = () => {
    onApply(rangeStart, rangeEnd);
    setShowModal(false);
  };

  const handleClear = () => {
    setRangeStart("");
    setRangeEnd("");
    onClear();
    setShowModal(false);
  };

  const label = getButtonLabel();

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={openModal}
        className={`h-8 px-3 rounded-full text-xs font-medium border transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${
          label
            ? "bg-[#3D7A3A] border-[#3D7A3A] text-white shadow-sm"
            : "bg-white border-[#e0e8dc] text-gray-600 hover:border-[#3D7A3A]/40 hover:text-[#3D7A3A]"
        }`}
      >
        <CalendarDays className="h-3.5 w-3.5" />
        <span>{label || "เลือกช่วงเวลา"}</span>
      </button>

      {/* Modal */}
      {showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[480px] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2">
              <h3 className="text-sm font-bold text-gray-800">เลือกช่วงเวลา</h3>
              <button onClick={() => setShowModal(false)} className="p-1 rounded-full hover:bg-gray-100 transition-colors">
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>

            {/* Body: 2-column layout */}
            <div className="flex flex-col sm:flex-row">
              {/* Shortcuts */}
              <div className="sm:w-[140px] px-4 pb-3 sm:pb-0 sm:border-r border-[#e8ede5] flex sm:flex-col gap-1.5 overflow-x-auto sm:overflow-x-visible">
                {SHORTCUTS.map(s => {
                  const [sFrom, sTo] = s.getDates();
                  const isActive = rangeStart === sFrom && rangeEnd === sTo;
                  return (
                    <button
                      key={s.label}
                      onClick={() => { setRangeStart(sFrom); setRangeEnd(sTo); const d = new Date(sFrom); setCalMonth(d.getMonth()); setCalYear(d.getFullYear()); }}
                      className={`px-2.5 py-1.5 rounded-lg text-[11px] whitespace-nowrap text-left transition-all ${
                        isActive
                          ? "bg-[#3D7A3A]/10 text-[#3D7A3A] font-semibold border border-[#3D7A3A]/30"
                          : "text-gray-600 hover:bg-gray-50 border border-transparent"
                      }`}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>

              {/* Calendar */}
              <div className="flex-1 px-4 pb-3">
                {/* Selected range display */}
                <div className="flex gap-2 mb-3">
                  <div className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#e0e8dc] bg-[#fafcf9] text-[11px] text-gray-600">
                    <span className="text-[9px] text-gray-400 block">วันเริ่มต้น</span>
                    {rangeStart ? formatShortDate(rangeStart) : "-"}
                  </div>
                  <div className="flex items-center text-gray-300 text-xs">–</div>
                  <div className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#e0e8dc] bg-[#fafcf9] text-[11px] text-gray-600">
                    <span className="text-[9px] text-gray-400 block">วันสิ้นสุด</span>
                    {rangeEnd ? formatShortDate(rangeEnd) : "-"}
                  </div>
                </div>

                {/* Month navigation */}
                <div className="flex items-center justify-between mb-2">
                  <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-1 rounded hover:bg-gray-100">
                    <ChevronLeft className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                  <span className="text-xs font-medium text-gray-700">
                    {new Date(calYear, calMonth).toLocaleDateString("th-TH", { month: "long", year: "numeric" })}
                  </span>
                  <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-1 rounded hover:bg-gray-100">
                    <ChevronRight className="h-3.5 w-3.5 text-gray-500" />
                  </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 mb-1">
                  {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map(d => (
                    <div key={d} className="text-center text-[9px] font-medium text-gray-400 py-0.5">{d}</div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7">
                  {(() => {
                    const firstDay = new Date(calYear, calMonth, 1).getDay();
                    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
                    const cells: React.ReactNode[] = [];
                    for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} />);
                    for (let day = 1; day <= daysInMonth; day++) {
                      const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                      const isStart = dateStr === rangeStart;
                      const isEnd = dateStr === rangeEnd;
                      const inRange = rangeStart && rangeEnd && dateStr > rangeStart && dateStr < rangeEnd;
                      const isToday = dateStr === new Date().toISOString().slice(0, 10);
                      cells.push(
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            if (!rangeStart || (rangeStart && rangeEnd)) {
                              setRangeStart(dateStr); setRangeEnd("");
                            } else if (dateStr < rangeStart) {
                              setRangeStart(dateStr);
                            } else {
                              setRangeEnd(dateStr);
                            }
                          }}
                          className={`h-7 w-full text-[11px] rounded-md transition-all ${
                            isStart || isEnd
                              ? "bg-[#3D7A3A] text-white font-semibold"
                              : inRange
                              ? "bg-[#3D7A3A]/10 text-[#3D7A3A]"
                              : isToday
                              ? "ring-1 ring-[#3D7A3A]/30 text-[#3D7A3A] font-medium"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {day}
                        </button>
                      );
                    }
                    return cells;
                  })()}
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="px-4 pb-4 pt-2 flex gap-2">
              <button
                onClick={handleClear}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-all"
              >
                ล้าง
              </button>
              <button
                onClick={handleConfirm}
                className="flex-[2] py-2.5 rounded-xl text-xs font-semibold bg-[#3D7A3A] text-white hover:bg-[#2d5c2b] transition-all shadow-sm active:scale-[0.98]"
              >
                ยืนยัน
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
