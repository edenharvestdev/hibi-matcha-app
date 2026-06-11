import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import BranchSelector from "@/components/BranchSelector";
import DatePickerCE from "@/components/DatePickerCE";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useBranchSelector } from "@/hooks/useBranchSelector";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Banknote, CreditCard, Truck, Smartphone, Plus, Trash2, Save, Loader2,
  Calendar, ChevronLeft, ChevronRight, TrendingUp, BarChart3, FileText,
  Tag, Settings, Percent, Users, Store, Pencil, Check, X, Download, FileDown,
  CalendarRange, Eye, FileSpreadsheet, Sheet as SheetIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { formatDate } from "@/lib/dateUtils";
import { useIsMobile } from "@/hooks/useMobile";

export default function DailySales() {
  const { session, loading, isStaff, isBranchOwner, isBranchManager, hasPermission, isAreaManager } = useHibiAuth();
  const isMobile = useIsMobile();
  const { selectedBranchId, setSelectedBranchId, currentBranchName, branchIdParam, needsSelector, managedBranches } = useBranchSelector();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("record");

  // Date navigation
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split("T")[0];
  });

  // Form state
  const [cashAmount, setCashAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [edcAmount, setEdcAmount] = useState("");
  const [deliveryAmount, setDeliveryAmount] = useState("");
  const [extraChannels, setExtraChannels] = useState<{ channelName: string; amount: string }[]>([]);
  const [note, setNote] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [categoryAmounts, setCategoryAmounts] = useState<Record<number, string>>({});
  const [categoryNotes, setCategoryNotes] = useState<Record<number, string>>({});

  // Category management
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryCommission, setNewCategoryCommission] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [editingCommission, setEditingCommission] = useState("");

  // Month navigation for summary
  const [summaryYear, setSummaryYear] = useState(() => new Date().getFullYear());
  const [summaryMonth, setSummaryMonth] = useState(() => new Date().getMonth() + 1);

  // Date range summary state
  const [rangeMode, setRangeMode] = useState<"month" | "custom">("month");
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [showDateRangeSheet, setShowDateRangeSheet] = useState(false);
  const [dayDetailDate, setDayDetailDate] = useState<string | null>(null);
  const [summaryExportLoading, setSummaryExportLoading] = useState<string | false>(false);

  // Determine if user can access accounting (view) - all staff can view
  const canAccessAccounting = isStaff;
  // Determine if user can edit - only manager, owner, area_manager, super_admin
  const hasEditRole = isBranchOwner || isBranchManager || isAreaManager || hasPermission("manage_accounting") || session?.role === "super_admin";
  // 3-day lock: records older than 3 days are locked (only super_admin/area_manager can override)
  const LOCK_DAYS = 3;
  const canOverrideLock = isAreaManager || session?.role === "super_admin";
  const isDateLocked = useMemo(() => {
    const salesDateObj = new Date(selectedDate);
    const now = new Date();
    const diffMs = now.getTime() - salesDateObj.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays > LOCK_DAYS && !canOverrideLock;
  }, [selectedDate, canOverrideLock]);
  const canEdit = hasEditRole && !isDateLocked;

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  // Fetch sales categories for this branch
  const { data: categories, refetch: refetchCategories } = trpc.salesCategories.list.useQuery(
    { branchId: branchIdParam },
    { enabled: !!session && canAccessAccounting }
  );

  // Fetch existing record for selected date
  const canAccess = canAccessAccounting;
  const { data: existingRecord, isLoading: loadingRecord, refetch: refetchRecord } = trpc.dailySales.getByDate.useQuery(
    { salesDate: selectedDate, branchId: branchIdParam },
    { enabled: !!session && canAccess }
  );

  // Fetch list for history tab
  const { data: historyData, isLoading: loadingHistory } = trpc.dailySales.list.useQuery(
    { limit: 31, branchId: branchIdParam },
    { enabled: !!session && tab === "history" && canAccess }
  );

  // Monthly summary
  const { data: monthlySummary, isLoading: loadingSummary } = trpc.dailySales.monthlySummary.useQuery(
    { year: summaryYear, month: summaryMonth, branchId: branchIdParam },
    { enabled: !!session && (tab === "summary" || tab === "commission") && canAccess }
  );

  // Monthly category breakdown
  const { data: categoryBreakdown, isLoading: loadingCategoryBreakdown } = trpc.dailySales.monthlyCategoryBreakdown.useQuery(
    { year: summaryYear, month: summaryMonth, branchId: branchIdParam },
    { enabled: !!session && (tab === "summary" || tab === "commission") && canAccess }
  );

  // Commission data
  const { data: commissionData, isLoading: loadingCommission } = trpc.dailySales.commission.useQuery(
    { year: summaryYear, month: summaryMonth, branchId: branchIdParam },
    { enabled: !!session && tab === "commission" && canAccess }
  );

  // Computed date range for summary
  const summaryDateRange = useMemo(() => {
    if (rangeMode === "custom" && customRange?.from) {
      const from = customRange.from.toISOString().split("T")[0];
      const to = (customRange.to || customRange.from).toISOString().split("T")[0];
      return { startDate: from, endDate: to };
    }
    // Default: current month
    const start = new Date(summaryYear, summaryMonth - 1, 1);
    const end = new Date(summaryYear, summaryMonth, 0);
    return {
      startDate: start.toISOString().split("T")[0],
      endDate: end.toISOString().split("T")[0],
    };
  }, [rangeMode, customRange, summaryYear, summaryMonth]);

  // Date range summary query
  const { data: rangeSummary, isLoading: loadingRangeSummary } = trpc.dailySales.dateRangeSummary.useQuery(
    { startDate: summaryDateRange.startDate, endDate: summaryDateRange.endDate, branchId: branchIdParam },
    { enabled: !!session && tab === "summary" && canAccess }
  );

  // Day detail query (for popup)
  const { data: dayDetail, isLoading: loadingDayDetail } = trpc.dailySales.dailyExpenseSummary.useQuery(
    { salesDate: dayDetailDate || "", branchId: branchIdParam },
    { enabled: !!dayDetailDate && !!session }
  );

  // Preset helpers for the new date range sheet
  const applyPreset = useCallback((preset: string) => {
    const now = new Date();
    let from: Date, to: Date;
    switch (preset) {
      case "today":
        from = to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "yesterday": {
        const y = new Date(now); y.setDate(now.getDate() - 1);
        from = to = new Date(y.getFullYear(), y.getMonth(), y.getDate());
        break;
      }
      case "7days":
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        from = new Date(to); from.setDate(to.getDate() - 6);
        break;
      case "14days":
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        from = new Date(to); from.setDate(to.getDate() - 13);
        break;
      case "30days":
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        from = new Date(to); from.setDate(to.getDate() - 29);
        break;
      case "thisMonth":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "thisYear":
        from = new Date(now.getFullYear(), 0, 1);
        to = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case "lastYear":
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return;
    }
    setCustomRange({ from, to });
    setRangeMode("custom");
    setShowDateRangeSheet(false);
  }, []);

  // Format date for display in Thai Buddhist era
  const formatThaiDate = useCallback((d: Date) => {
    return `${d.getDate()} ${["ม.ค.","ก.พ.","มี.ค.","เม.ย.","พ.ค.","มิ.ย.","ก.ค.","ส.ค.","ก.ย.","ต.ค.","พ.ย.","ธ.ค."][d.getMonth()]} ${d.getFullYear() + 543 - 2500}`;
  }, []);

  // Load existing record into form
  useEffect(() => {
    if (existingRecord) {
      setCashAmount(String(existingRecord.cashAmount || 0));
      setTransferAmount(String(existingRecord.transferAmount || 0));
      setEdcAmount(String(existingRecord.edcAmount || 0));
      setDeliveryAmount(String(existingRecord.deliveryAmount || 0));
      setNote(existingRecord.note || "");
      setExtraChannels(
        (existingRecord.extraChannels || []).map((ch: any) => ({
          channelName: ch.channelName,
          amount: String(ch.amount || 0),
        }))
      );
      // Load category items
      const amounts: Record<number, string> = {};
      const notes: Record<number, string> = {};
      (existingRecord.categoryItems || []).forEach((ci: any) => {
        amounts[ci.categoryId] = String(ci.amount || 0);
        notes[ci.categoryId] = ci.note || "";
      });
      setCategoryAmounts(amounts);
      setCategoryNotes(notes);
      setIsEditing(true);
    } else {
      setCashAmount("");
      setTransferAmount("");
      setEdcAmount("");
      setDeliveryAmount("");
      setNote("");
      setExtraChannels([]);
      setCategoryAmounts({});
      setCategoryNotes({});
      setIsEditing(false);
    }
  }, [existingRecord, selectedDate]);

  const utils = trpc.useUtils();
  const upsertMut = trpc.dailySales.upsert.useMutation({
    onSuccess: (result) => {
      toast.success(result.updated ? "อัปเดตยอดขายเรียบร้อย" : "บันทึกยอดขายเรียบร้อย");
      refetchRecord();
      utils.dailySales.list.invalidate();
      utils.dailySales.monthlySummary.invalidate();
      utils.dailySales.monthlyCategoryBreakdown.invalidate();
      utils.dailySales.commission.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const createCategoryMut = trpc.salesCategories.create.useMutation({
    onSuccess: () => {
      toast.success("สร้างหมวดหมู่สำเร็จ");
      refetchCategories();
      setNewCategoryName("");
      setNewCategoryCommission("");
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCategoryMut = trpc.salesCategories.delete.useMutation({
    onSuccess: () => {
      toast.success("ลบหมวดหมู่สำเร็จ");
      refetchCategories();
    },
    onError: (err) => toast.error(err.message),
  });

  const updateCategoryMut = trpc.salesCategories.update.useMutation({
    onSuccess: () => {
      toast.success("อัปเดตคอมมิชชั่นสำเร็จ");
      refetchCategories();
      setEditingCategoryId(null);
      setEditingCommission("");
    },
    onError: (err) => toast.error(err.message),
  });

  const totalAmount = useMemo(() => {
    const cash = parseFloat(cashAmount) || 0;
    const transfer = parseFloat(transferAmount) || 0;
    const edc = parseFloat(edcAmount) || 0;
    const delivery = parseFloat(deliveryAmount) || 0;
    const extra = extraChannels.reduce((sum, ch) => sum + (parseFloat(ch.amount) || 0), 0);
    return cash + transfer + edc + delivery + extra;
  }, [cashAmount, transferAmount, edcAmount, deliveryAmount, extraChannels]);

  const totalCategoryAmount = useMemo(() => {
    return Object.values(categoryAmounts).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
  }, [categoryAmounts]);

  const handleSave = () => {
    if (totalAmount <= 0) {
      toast.error("กรุณากรอกยอดขายอย่างน้อย 1 ช่องทาง");
      return;
    }
    const categoryItems = categories
      ?.filter((cat: any) => parseFloat(categoryAmounts[cat.id] || "0") > 0)
      .map((cat: any) => ({
        categoryId: cat.id,
        amount: parseFloat(categoryAmounts[cat.id] || "0"),
        note: categoryNotes[cat.id] || undefined,
      })) || [];

    upsertMut.mutate({
      salesDate: selectedDate,
      cashAmount: parseFloat(cashAmount) || 0,
      transferAmount: parseFloat(transferAmount) || 0,
      edcAmount: parseFloat(edcAmount) || 0,
      deliveryAmount: parseFloat(deliveryAmount) || 0,
      extraChannels: extraChannels
        .filter(ch => ch.channelName.trim() && parseFloat(ch.amount) > 0)
        .map(ch => ({ channelName: ch.channelName, amount: parseFloat(ch.amount) })),
      note: note || undefined,
      branchId: branchIdParam,
      categoryItems,
    });
  };

  const addExtraChannel = () => {
    setExtraChannels([...extraChannels, { channelName: "", amount: "" }]);
  };

  const removeExtraChannel = (index: number) => {
    setExtraChannels(extraChannels.filter((_, i) => i !== index));
  };

  const updateExtraChannel = (index: number, field: "channelName" | "amount", value: string) => {
    const updated = [...extraChannels];
    updated[index] = { ...updated[index], [field]: value };
    setExtraChannels(updated);
  };

  const navigateDate = (direction: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + direction);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const navigateMonth = (direction: number) => {
    let m = summaryMonth + direction;
    let y = summaryYear;
    if (m > 12) { m = 1; y++; }
    if (m < 1) { m = 12; y--; }
    setSummaryMonth(m);
    setSummaryYear(y);
  };

  const formatCurrency = (n: number) => n.toLocaleString("th-TH", { minimumFractionDigits: 2 });
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  // Export daily expense summary
  const [exportLoading, setExportLoading] = useState<string | false>(false);
  const { data: expenseSummary, refetch: refetchExpenseSummary } = trpc.dailySales.dailyExpenseSummary.useQuery(
    { salesDate: selectedDate, branchId: branchIdParam },
    { enabled: false } // only fetch on demand
  );

  const handleExportSummary = async (format: "pdf" | "csv") => {
    setExportLoading(format);
    try {
      const result = await refetchExpenseSummary();
      const data = result.data;
      if (!data) {
        toast.error("ไม่พบข้อมูลสำหรับวันที่เลือก");
        setExportLoading(false);
        return;
      }
      const dateDisplay = new Date(data.date).toLocaleDateString("th-TH", { year: "numeric", month: "long", day: "numeric" });
      const branchName = currentBranchName || `สาขา #${data.branchId}`;

      if (format === "csv") {
        // Generate CSV
        const BOM = "\uFEFF";
        let csv = BOM;
        csv += `สรุปรายรับ-รายจ่ายประจำวัน - ${branchName}\n`;
        csv += `วันที่: ${dateDisplay}\n\n`;
        csv += `หมวด,รายการ,จำนวนเงิน (บาท)\n`;
        csv += `รายรับ,เงินสด,${data.income.cash.toFixed(2)}\n`;
        csv += `รายรับ,โอน/PromptPay,${data.income.transfer.toFixed(2)}\n`;
        csv += `รายรับ,EDC (บัตรเครดิต/เดบิต),${data.income.edc.toFixed(2)}\n`;
        csv += `รายรับ,Delivery,${data.income.delivery.toFixed(2)}\n`;
        if (data.income.extra.length > 0) {
          data.income.extra.forEach(ch => {
            csv += `รายรับ,${ch.channelName},${ch.amount.toFixed(2)}\n`;
          });
        }
        csv += `รายรับ,รวมรายรับ,${data.totalIncome.toFixed(2)}\n`;
        csv += `\n`;
        if (data.expenses.length > 0) {
          data.expenses.forEach(exp => {
            csv += `รายจ่าย,${exp.description}${exp.category ? ` (หมวด: ${exp.category})` : ""},${exp.amount.toFixed(2)}\n`;
          });
          csv += `รายจ่าย,รวมรายจ่าย,${data.totalExpenses.toFixed(2)}\n`;
        } else {
          csv += `รายจ่าย,(ไม่มีรายจ่าย),0.00\n`;
        }
        csv += `\n`;
        csv += `สรุป,กำไรสุทธิ (รายรับ - รายจ่าย),${data.netProfit.toFixed(2)}\n`;
        if (data.note) csv += `\nหมายเหตุ: ${data.note}\n`;

        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `สรุปรายจ่าย_${data.date}_${branchName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("ดาวน์โหลด CSV สำเร็จ");
      } else {
        // Generate PDF using HTML-to-print
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
          toast.error("กรุณาอนุญาต popup เพื่อดาวน์โหลด PDF");
          setExportLoading(false);
          return;
        }
        const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>สรุปรายจ่าย ${dateDisplay}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Sarabun', sans-serif; padding: 24px; font-size: 14px; color: #1a1a1a; }
  h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; color: #166534; }
  h2 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #f3f4f6; }
  th { background: #f9fafb; font-weight: 600; font-size: 12px; text-transform: uppercase; color: #6b7280; }
  .amount { text-align: right; font-variant-numeric: tabular-nums; }
  .total-row { font-weight: 700; background: #f0fdf4; }
  .total-row td { border-top: 2px solid #166534; }
  .expense-row { background: #fef2f2; }
  .net-row { font-size: 18px; font-weight: 700; color: ${data.netProfit >= 0 ? "#166534" : "#dc2626"}; text-align: center; margin-top: 16px; padding: 12px; background: ${data.netProfit >= 0 ? "#f0fdf4" : "#fef2f2"}; border-radius: 8px; }
  .note { margin-top: 12px; padding: 8px 12px; background: #f9fafb; border-radius: 6px; font-size: 13px; color: #4b5563; }
  @media print { body { padding: 12px; } }
</style></head><body>
<h1>Hibi Matcha - สรุปรายรับ-รายจ่ายประจำวัน</h1>
<p class="meta">สาขา: ${branchName} | วันที่: ${dateDisplay}</p>

<h2>รายรับ</h2>
<table>
<tr><th>ช่องทาง</th><th class="amount">จำนวนเงิน (บาท)</th></tr>
<tr><td>เงินสด</td><td class="amount">${formatCurrency(data.income.cash)}</td></tr>
<tr><td>โอน / PromptPay</td><td class="amount">${formatCurrency(data.income.transfer)}</td></tr>
<tr><td>EDC (บัตรเครดิต/เดบิต)</td><td class="amount">${formatCurrency(data.income.edc)}</td></tr>
<tr><td>Delivery</td><td class="amount">${formatCurrency(data.income.delivery)}</td></tr>
${data.income.extra.map(ch => `<tr><td>${ch.channelName}</td><td class="amount">${formatCurrency(ch.amount)}</td></tr>`).join("")}
<tr class="total-row"><td>รวมรายรับ</td><td class="amount">${formatCurrency(data.totalIncome)}</td></tr>
</table>

<h2>รายจ่าย (เงินสดย่อย)</h2>
<table>
<tr><th>รายการ</th><th>หมวดหมู่</th><th class="amount">จำนวนเงิน (บาท)</th></tr>
${data.expenses.length > 0 ? data.expenses.map(exp => `<tr class="expense-row"><td>${exp.description}</td><td>${exp.category || "-"}</td><td class="amount">${formatCurrency(exp.amount)}</td></tr>`).join("") : `<tr><td colspan="3" style="text-align:center;color:#9ca3af">ไม่มีรายจ่ายวันนี้</td></tr>`}
<tr class="total-row"><td colspan="2">รวมรายจ่าย</td><td class="amount">${formatCurrency(data.totalExpenses)}</td></tr>
</table>

<div class="net-row">กำไรสุทธิ: ฿${formatCurrency(data.netProfit)}</div>

${data.note ? `<div class="note"><strong>หมายเหตุ:</strong> ${data.note}</div>` : ""}
</body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
        toast.success("เปิดหน้าพิมพ์ PDF แล้ว");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการสร้างรายงาน");
    } finally {
      setExportLoading(false);
    }
  };

  // Export summary for date range
  const handleExportRangeSummary = async (format: "pdf" | "csv" | "xlsx") => {
    if (!rangeSummary) { toast.error("ไม่มีข้อมูลสำหรับ export"); return; }
    setSummaryExportLoading(format);
    try {
      const branchName = currentBranchName || `สาขา #${rangeSummary.branchId}`;
      const startDisplay = new Date(rangeSummary.startDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
      const endDisplay = new Date(rangeSummary.endDate).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" });
      const dateLabel = rangeSummary.startDate === rangeSummary.endDate ? startDisplay : `${startDisplay} - ${endDisplay}`;
      const s = rangeSummary.summary;
      const fmtInt = (n: number) => Math.round(n / 100).toLocaleString("th-TH");
      const fmtDec = (n: number) => (n / 100).toLocaleString("th-TH", { minimumFractionDigits: 2 });

      if (format === "csv") {
        const BOM = "\uFEFF";
        let csv = BOM;
        csv += `สรุปยอดขาย - ${branchName}\n`;
        csv += `ช่วงวันที่: ${dateLabel}\n`;
        csv += `จำนวนวันที่บันทึก: ${s?.recordCount || 0}\n\n`;
        csv += `ช่องทาง,จำนวนเต็ม (บาท),ทศนิยม (บาท)\n`;
        csv += `เงินสด,${fmtInt(s?.totalCash || 0)},${fmtDec(s?.totalCash || 0)}\n`;
        csv += `โอน/PromptPay,${fmtInt(s?.totalTransfer || 0)},${fmtDec(s?.totalTransfer || 0)}\n`;
        csv += `EDC,${fmtInt(s?.totalEdc || 0)},${fmtDec(s?.totalEdc || 0)}\n`;
        csv += `Delivery,${fmtInt(s?.totalDelivery || 0)},${fmtDec(s?.totalDelivery || 0)}\n`;
        csv += `ช่องทางอื่น,${fmtInt(s?.totalExtra || 0)},${fmtDec(s?.totalExtra || 0)}\n`;
        csv += `รวมรายรับ,${fmtInt(s?.grandTotal || 0)},${fmtDec(s?.grandTotal || 0)}\n`;
        csv += `รวมรายจ่าย,${fmtInt(rangeSummary.totalExpenses)},${fmtDec(rangeSummary.totalExpenses)}\n`;
        csv += `กำไรสุทธิ,${fmtInt(rangeSummary.netProfit)},${fmtDec(rangeSummary.netProfit)}\n\n`;
        if (rangeSummary.categoryBreakdown.length > 0) {
          csv += `หมวดหมู่,จำนวนเต็ม (บาท),ทศนิยม (บาท)\n`;
          rangeSummary.categoryBreakdown.forEach(cb => {
            csv += `${cb.categoryName},${fmtInt(cb.totalAmount)},${fmtDec(cb.totalAmount)}\n`;
          });
          csv += `\n`;
        }
        if (rangeSummary.dailyRecords.length > 0) {
          csv += `\nรายละเอียดรายวัน\n`;
          csv += `วันที่,เงินสด,โอน,EDC,Delivery,อื่นๆ,รวม\n`;
          rangeSummary.dailyRecords.forEach(r => {
            const d = new Date(r.salesDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" });
            csv += `${d},${fmtDec(r.cashAmount)},${fmtDec(r.transferAmount)},${fmtDec(r.edcAmount)},${fmtDec(r.deliveryAmount)},${fmtDec(r.extraTotal)},${fmtDec(r.totalAmount)}\n`;
          });
        }
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `สรุปยอดขาย_${rangeSummary.startDate}_${rangeSummary.endDate}_${branchName}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("ดาวน์โหลด CSV สำเร็จ");
      } else if (format === "xlsx") {
        // Dynamic import xlsx
        const XLSX = await import("xlsx");
        const wb = XLSX.utils.book_new();
        // Summary sheet
        const summaryRows = [
          ["สรุปยอดขาย - " + branchName],
          ["ช่วงวันที่: " + dateLabel],
          ["จำนวนวันที่บันทึก: " + (s?.recordCount || 0)],
          [],
          ["ช่องทาง", "จำนวนเต็ม (บาท)", "ทศนิยม (บาท)"],
          ["เงินสด", Math.round((s?.totalCash || 0) / 100), (s?.totalCash || 0) / 100],
          ["โอน/PromptPay", Math.round((s?.totalTransfer || 0) / 100), (s?.totalTransfer || 0) / 100],
          ["EDC", Math.round((s?.totalEdc || 0) / 100), (s?.totalEdc || 0) / 100],
          ["Delivery", Math.round((s?.totalDelivery || 0) / 100), (s?.totalDelivery || 0) / 100],
          ["ช่องทางอื่น", Math.round((s?.totalExtra || 0) / 100), (s?.totalExtra || 0) / 100],
          ["รวมรายรับ", Math.round((s?.grandTotal || 0) / 100), (s?.grandTotal || 0) / 100],
          ["รวมรายจ่าย", Math.round(rangeSummary.totalExpenses / 100), rangeSummary.totalExpenses / 100],
          ["กำไรสุทธิ", Math.round(rangeSummary.netProfit / 100), rangeSummary.netProfit / 100],
        ];
        const ws1 = XLSX.utils.aoa_to_sheet(summaryRows);
        ws1["!cols"] = [{ wch: 20 }, { wch: 18 }, { wch: 18 }];
        XLSX.utils.book_append_sheet(wb, ws1, "สรุป");
        // Category sheet
        if (rangeSummary.categoryBreakdown.length > 0) {
          const catRows: any[][] = [["หมวดหมู่", "จำนวนเต็ม (บาท)", "ทศนิยม (บาท)"]];
          rangeSummary.categoryBreakdown.forEach(cb => {
            catRows.push([cb.categoryName, Math.round(cb.totalAmount / 100), cb.totalAmount / 100]);
          });
          const ws2 = XLSX.utils.aoa_to_sheet(catRows);
          ws2["!cols"] = [{ wch: 25 }, { wch: 18 }, { wch: 18 }];
          XLSX.utils.book_append_sheet(wb, ws2, "หมวดหมู่");
        }
        // Daily detail sheet
        if (rangeSummary.dailyRecords.length > 0) {
          const dayRows: any[][] = [["วันที่", "เงินสด", "โอน", "EDC", "Delivery", "อื่นๆ", "รวม"]];
          rangeSummary.dailyRecords.forEach(r => {
            const d = new Date(r.salesDate).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" });
            dayRows.push([d, r.cashAmount / 100, r.transferAmount / 100, r.edcAmount / 100, r.deliveryAmount / 100, r.extraTotal / 100, r.totalAmount / 100]);
          });
          const ws3 = XLSX.utils.aoa_to_sheet(dayRows);
          ws3["!cols"] = [{ wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 }];
          XLSX.utils.book_append_sheet(wb, ws3, "รายวัน");
        }
        XLSX.writeFile(wb, `สรุปยอดขาย_${rangeSummary.startDate}_${rangeSummary.endDate}_${branchName}.xlsx`);
        toast.success("ดาวน์โหลด XLSX สำเร็จ");
      } else {
        // PDF via print
        const printWindow = window.open("", "_blank");
        if (!printWindow) { toast.error("กรุณาอนุญาต popup"); setSummaryExportLoading(false); return; }
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>สรุปยอดขาย</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Sarabun', sans-serif; padding: 24px; font-size: 14px; color: #1a1a1a; }
  h1 { font-size: 20px; font-weight: 700; margin-bottom: 4px; color: #166534; }
  h2 { font-size: 16px; font-weight: 600; margin: 16px 0 8px; border-bottom: 1px solid #e5e7eb; padding-bottom: 4px; }
  .meta { color: #6b7280; font-size: 13px; margin-bottom: 16px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  th, td { padding: 6px 10px; text-align: left; border-bottom: 1px solid #f3f4f6; }
  th { background: #f9fafb; font-weight: 600; font-size: 12px; color: #6b7280; }
  .amt { text-align: right; font-variant-numeric: tabular-nums; }
  .total-row { font-weight: 700; background: #f0fdf4; }
  .total-row td { border-top: 2px solid #166534; }
  .net-row { font-size: 18px; font-weight: 700; color: ${rangeSummary.netProfit >= 0 ? "#166534" : "#dc2626"}; text-align: center; margin-top: 16px; padding: 12px; background: ${rangeSummary.netProfit >= 0 ? "#f0fdf4" : "#fef2f2"}; border-radius: 8px; }
  @media print { body { padding: 12px; } }
</style></head><body>
<h1>Hibi Matcha - สรุปยอดขาย</h1>
<p class="meta">สาขา: ${branchName} | ช่วงวันที่: ${dateLabel} | จำนวน ${s?.recordCount || 0} วัน</p>
<h2>แยกตามช่องทาง</h2>
<table>
<tr><th>ช่องทาง</th><th class="amt">จำนวนเต็ม</th><th class="amt">ทศนิยม</th></tr>
<tr><td>เงินสด</td><td class="amt">${fmtInt(s?.totalCash || 0)}</td><td class="amt">${fmtDec(s?.totalCash || 0)}</td></tr>
<tr><td>โอน/PromptPay</td><td class="amt">${fmtInt(s?.totalTransfer || 0)}</td><td class="amt">${fmtDec(s?.totalTransfer || 0)}</td></tr>
<tr><td>EDC</td><td class="amt">${fmtInt(s?.totalEdc || 0)}</td><td class="amt">${fmtDec(s?.totalEdc || 0)}</td></tr>
<tr><td>Delivery</td><td class="amt">${fmtInt(s?.totalDelivery || 0)}</td><td class="amt">${fmtDec(s?.totalDelivery || 0)}</td></tr>
<tr><td>ช่องทางอื่น</td><td class="amt">${fmtInt(s?.totalExtra || 0)}</td><td class="amt">${fmtDec(s?.totalExtra || 0)}</td></tr>
<tr class="total-row"><td>รวมรายรับ</td><td class="amt">${fmtInt(s?.grandTotal || 0)}</td><td class="amt">${fmtDec(s?.grandTotal || 0)}</td></tr>
</table>
${rangeSummary.categoryBreakdown.length > 0 ? `<h2>แยกตามหมวดหมู่</h2><table><tr><th>หมวดหมู่</th><th class="amt">จำนวนเต็ม</th><th class="amt">ทศนิยม</th></tr>${rangeSummary.categoryBreakdown.map(cb => `<tr><td>${cb.categoryName}</td><td class="amt">${fmtInt(cb.totalAmount)}</td><td class="amt">${fmtDec(cb.totalAmount)}</td></tr>`).join("")}</table>` : ""}
${rangeSummary.dailyRecords.length > 0 ? `<h2>รายละเอียดรายวัน</h2><table><tr><th>วันที่</th><th class="amt">เงินสด</th><th class="amt">โอน</th><th class="amt">EDC</th><th class="amt">Delivery</th><th class="amt">รวม</th></tr>${rangeSummary.dailyRecords.map(r => { const d = new Date(r.salesDate).toLocaleDateString("th-TH", { day: "numeric", month: "short" }); return `<tr><td>${d}</td><td class="amt">${fmtDec(r.cashAmount)}</td><td class="amt">${fmtDec(r.transferAmount)}</td><td class="amt">${fmtDec(r.edcAmount)}</td><td class="amt">${fmtDec(r.deliveryAmount)}</td><td class="amt">${fmtDec(r.totalAmount)}</td></tr>`; }).join("")}</table>` : ""}
<div class="net-row">กำไรสุทธิ: ฿${fmtDec(rangeSummary.netProfit)}</div>
</body></html>`;
        printWindow.document.write(html);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 500);
        toast.success("เปิดหน้าพิมพ์ PDF แล้ว");
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการสร้างรายงาน");
    } finally {
      setSummaryExportLoading(false);
    }
  };

  // Open Google Sheet with CSV data
  const handleExportGoogleSheet = () => {
    if (!rangeSummary?.summary) { toast.error("ไม่มีข้อมูลสำหรับ export"); return; }
    // Create CSV content and open in Google Sheets
    handleExportRangeSummary("csv");
    toast.info("ดาวน์โหลด CSV แล้ว — เปิด Google Sheets แล้วนำเข้าไฟล์ CSV ได้เลย", { duration: 5000 });
  };

  if (loading || !session) return null;

  return (
    <MobileLayout title={`บัญชีสาขารายวัน${currentBranchName ? ` - ${currentBranchName}` : ""}`} showBack backPath="/branch">
      <PremiumPageContent>
        {needsSelector && (
          <div className="mb-4">
            <BranchSelector
              selectedBranchId={selectedBranchId}
              onBranchChange={setSelectedBranchId}
              managedBranches={managedBranches}
              needsSelector={needsSelector}
            />
          </div>
        )}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-auto p-1 bg-white/60 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-sm flex flex-nowrap overflow-x-auto gap-1 mb-4 scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <TabsTrigger value="record" className="text-xs whitespace-nowrap rounded-xl px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all shrink-0">
              <FileText className="h-3.5 w-3.5 mr-1" />
              บันทึก
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs whitespace-nowrap rounded-xl px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all shrink-0">
              <Calendar className="h-3.5 w-3.5 mr-1" />
              ประวัติ
            </TabsTrigger>
            <TabsTrigger value="summary" className="text-xs whitespace-nowrap rounded-xl px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all shrink-0">
              <BarChart3 className="h-3.5 w-3.5 mr-1" />
              สรุป
            </TabsTrigger>
            <TabsTrigger value="instore" className="text-xs whitespace-nowrap rounded-xl px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all shrink-0">
              <Store className="h-3.5 w-3.5 mr-1" />
              หน้าร้าน
            </TabsTrigger>
            <TabsTrigger value="commission" className="text-xs whitespace-nowrap rounded-xl px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all shrink-0">
              <Percent className="h-3.5 w-3.5 mr-1" />
              คอมฯ
            </TabsTrigger>
            {hasEditRole && (
              <TabsTrigger value="audit" className="text-xs whitespace-nowrap rounded-xl px-3 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-md transition-all shrink-0">
                <FileText className="h-3.5 w-3.5 mr-1" />
                ประวัติแก้ไข
              </TabsTrigger>
            )}
          </TabsList>

          {/* ── Record Tab ── */}
          <TabsContent value="record" className="space-y-4">
            {/* Date Picker */}
            <div className="flex items-center justify-between bg-card rounded-xl p-3 shadow-sm">
              <Button variant="ghost" size="icon" onClick={() => navigateDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-center flex items-center gap-2 justify-center">
                <DatePickerCE
                  value={selectedDate}
                  onChange={setSelectedDate}
                  placeholder="เลือกวันที่"
                  maxDate={new Date()}
                />
                {isEditing && (
                  <Badge variant="secondary" className="text-[10px]">มีข้อมูลแล้ว</Badge>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => navigateDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {loadingRecord ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : (
              <>
                {/* Sales Channels */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    <p className="text-sm font-semibold text-foreground">ช่องทางรายรับ</p>

                    {/* Read-only notice for staff or locked date */}
                    {!canEdit && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
                        <p className="text-xs text-amber-700 font-medium">
                          {isDateLocked && hasEditRole
                            ? `🔒 ล็อคแล้ว — ไม่สามารถแก้ไขบัญชีรายวันที่ผ่านไปเกิน ${LOCK_DAYS} วัน`
                            : `🔒 ดูย้อนหลังเท่านั้น — เฉพาะผู้จัดการ/เจ้าของสาขาแก้ไขได้`
                          }
                        </p>
                      </div>
                    )}

                    {/* Cash */}
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                        <Banknote className="h-4 w-4 text-green-700" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">เงินสด</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={cashAmount}
                          onChange={(e) => setCashAmount(e.target.value)}
                          placeholder="0.00"
                          className="mt-0.5"
                          disabled={!canEdit}
                        />
                      </div>
                    </div>

                    {/* Transfer */}
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                        <Smartphone className="h-4 w-4 text-blue-700" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">โอน / PromptPay</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={transferAmount}
                          onChange={(e) => setTransferAmount(e.target.value)}
                          placeholder="0.00"
                          className="mt-0.5"
                          disabled={!canEdit}
                        />
                      </div>
                    </div>

                    {/* EDC */}
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <CreditCard className="h-4 w-4 text-purple-700" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">EDC (บัตรเครดิต/เดบิต)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={edcAmount}
                          onChange={(e) => setEdcAmount(e.target.value)}
                          placeholder="0.00"
                          className="mt-0.5"
                          disabled={!canEdit}
                        />
                      </div>
                    </div>

                    {/* Delivery */}
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-orange-100 flex items-center justify-center shrink-0">
                        <Truck className="h-4 w-4 text-orange-700" />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Delivery (GrabFood, LINE MAN, ฯลฯ)</Label>
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={deliveryAmount}
                          onChange={(e) => setDeliveryAmount(e.target.value)}
                          placeholder="0.00"
                          className="mt-0.5"
                          disabled={!canEdit}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Extra Channels */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-foreground">ช่องทางเพิ่มเติม</p>
                      {canEdit && (
                        <Button variant="outline" size="sm" onClick={addExtraChannel} className="text-xs h-7">
                          <Plus className="h-3 w-3 mr-1" />
                          เพิ่ม
                        </Button>
                      )}
                    </div>

                    {extraChannels.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-2">
                        ยังไม่มีช่องทางเพิ่มเติม กดปุ่ม "เพิ่ม" เพื่อเพิ่มช่องทาง
                      </p>
                    )}

                    {extraChannels.map((ch, i) => (
                      <div key={i} className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label className="text-[10px] text-muted-foreground">ชื่อช่องทาง</Label>
                          <Input
                            value={ch.channelName}
                            onChange={(e) => updateExtraChannel(i, "channelName", e.target.value)}
                            placeholder="เช่น Shopee, Lazada"
                            className="text-sm"
                            disabled={!canEdit}
                          />
                        </div>
                        <div className="w-28">
                          <Label className="text-[10px] text-muted-foreground">จำนวน</Label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={ch.amount}
                            onChange={(e) => updateExtraChannel(i, "amount", e.target.value)}
                            placeholder="0.00"
                            className="text-sm"
                            disabled={!canEdit}
                          />
                        </div>
                        {canEdit && (
                          <Button variant="ghost" size="icon" className="h-9 w-9 text-red-500 shrink-0" onClick={() => removeExtraChannel(i)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* ── Category Items (ยอดขายแยกหมวดหมู่) ── */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">ยอดขายแยกหมวดหมู่</p>
                      </div>
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowCategoryManager(!showCategoryManager)}
                          className="text-xs h-7"
                        >
                          <Settings className="h-3 w-3 mr-1" />
                          จัดการ
                        </Button>
                      )}
                    </div>

                    {/* Category Manager (toggle) */}
                    {showCategoryManager && (
                      <div className="bg-muted/50 rounded-lg p-3 space-y-3">
                        <p className="text-xs font-medium text-muted-foreground">สร้างหมวดหมู่ใหม่</p>
                        <div className="flex gap-2">
                          <Input
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            placeholder="ชื่อหมวดหมู่ เช่น หน้าร้าน"
                            className="text-sm flex-1"
                          />
                          <Input
                            type="number"
                            inputMode="decimal"
                            value={newCategoryCommission}
                            onChange={(e) => setNewCategoryCommission(e.target.value)}
                            placeholder="คอมฯ %"
                            className="text-sm w-20"
                          />
                          <Button
                            size="sm"
                            className="h-9"
                            disabled={!newCategoryName.trim() || createCategoryMut.isPending}
                            onClick={() => {
                              createCategoryMut.mutate({
                                name: newCategoryName.trim(),
                                commissionRate: parseFloat(newCategoryCommission) || 0,
                                branchId: branchIdParam || null,
                              });
                            }}
                          >
                            {createCategoryMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          </Button>
                        </div>

                        {/* Existing categories list */}
                        {categories && categories.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground">หมวดหมู่ที่มี:</p>
                            {categories.map((cat: any) => (
                              <div key={cat.id} className="bg-background rounded-md px-2 py-1.5">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <span className="text-xs font-medium truncate">{cat.name}</span>
                                    {Number(cat.commissionRate) > 0 && (
                                      <Badge variant="secondary" className="text-[9px] shrink-0">
                                        คอมฯ {cat.commissionRate}%
                                      </Badge>
                                    )}
                                    {cat.isStandard && (
                                      <Badge variant="outline" className="text-[9px] border-blue-300 text-blue-600 shrink-0">มาตรฐาน</Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 text-muted-foreground hover:text-primary"
                                      onClick={() => {
                                        setEditingCategoryId(cat.id);
                                        setEditingCommission(String(cat.commissionRate || 0));
                                      }}
                                    >
                                      <Pencil className="h-3 w-3" />
                                    </Button>
                                    {!cat.isStandard && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-red-500"
                                        onClick={() => {
                                          if (confirm(`ลบหมวดหมู่ "${cat.name}" ?`)) {
                                            deleteCategoryMut.mutate({ id: cat.id });
                                          }
                                        }}
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                                {/* Inline edit commission */}
                                {editingCategoryId === cat.id && (
                                  <div className="flex items-center gap-2 mt-1.5 pl-1">
                                    <span className="text-[10px] text-muted-foreground">คอมฯ %:</span>
                                    <Input
                                      type="number"
                                      inputMode="decimal"
                                      value={editingCommission}
                                      onChange={(e) => setEditingCommission(e.target.value)}
                                      className="h-7 text-xs w-20"
                                      placeholder="0"
                                    />
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-green-600"
                                      disabled={updateCategoryMut.isPending}
                                      onClick={() => {
                                        updateCategoryMut.mutate({
                                          id: cat.id,
                                          commissionRate: parseFloat(editingCommission) || 0,
                                        });
                                      }}
                                    >
                                      {updateCategoryMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6 text-muted-foreground"
                                      onClick={() => { setEditingCategoryId(null); setEditingCommission(""); }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Category amount inputs */}
                    {!categories || categories.length === 0 ? (
                      <div className="text-center py-3">
                        <Tag className="h-8 w-8 mx-auto text-muted-foreground/30 mb-1" />
                        <p className="text-xs text-muted-foreground">ยังไม่มีหมวดหมู่</p>
                        <p className="text-[10px] text-muted-foreground">กด "จัดการ" เพื่อสร้างหมวดหมู่ เช่น หน้าร้าน, สินค้ากลับบ้าน</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categories.map((cat: any) => (
                          <div key={cat.id} className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                              <Tag className="h-4 w-4 text-teal-700" />
                            </div>
                            <div className="flex-1">
                              <Label className="text-xs text-muted-foreground">
                                {cat.name}
                                {Number(cat.commissionRate) > 0 && <span className="text-primary ml-1">(คอมฯ {cat.commissionRate}%)</span>}
                              </Label>
                              <Input
                                type="number"
                                inputMode="decimal"
                                value={categoryAmounts[cat.id] || ""}
                                onChange={(e) => setCategoryAmounts(prev => ({ ...prev, [cat.id]: e.target.value }))}
                                placeholder="0.00"
                                className="mt-0.5"
                                disabled={!canEdit}
                              />
                            </div>
                          </div>
                        ))}

                        {totalCategoryAmount > 0 && (
                          <div className="flex items-center justify-between pt-2 border-t">
                            <span className="text-xs text-muted-foreground">รวมยอดตามหมวดหมู่</span>
                            <span className="text-sm font-semibold text-teal-700">฿{formatCurrency(totalCategoryAmount)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Note */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <Label className="text-xs text-muted-foreground">หมายเหตุ</Label>
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                      rows={2}
                      className="mt-1 text-sm"
                      disabled={!canEdit}
                    />
                  </CardContent>
                </Card>

                {/* Total & Save */}
                <Card className="border-0 shadow-sm bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium">ยอดรวมทั้งวัน</p>
                      <p className="text-xl font-bold text-primary">
                        ฿{formatCurrency(totalAmount)}
                      </p>
                    </div>
                    {canEdit && (
                      <Button
                        className="w-full"
                        size="lg"
                        disabled={upsertMut.isPending}
                        onClick={handleSave}
                      >
                        {upsertMut.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {isEditing ? "อัปเดตยอดขาย" : "บันทึกยอดขาย"}
                      </Button>
                    )}

                    {/* Daily Expense Summary Export */}
                    <div className={isMobile ? "flex flex-col gap-2 mt-3" : "flex gap-2 mt-3"}>
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        className={isMobile ? "w-full h-11 text-sm" : "flex-1"}
                        onClick={() => handleExportSummary("pdf")}
                        disabled={!!exportLoading}
                      >
                        {exportLoading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileDown className="h-4 w-4 mr-2 text-red-600" />}
                        สรุปรายจ่าย PDF
                      </Button>
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        className={isMobile ? "w-full h-11 text-sm" : "flex-1"}
                        onClick={() => handleExportSummary("csv")}
                        disabled={!!exportLoading}
                      >
                        {exportLoading === "csv" ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2 text-green-600" />}
                        สรุปรายจ่าย CSV
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* ── History Tab ── */}
          <TabsContent value="history" className="space-y-3">
            {loadingHistory ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : !historyData?.records?.length ? (
              <div className="text-center py-12">
                <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลยอดขาย</p>
              </div>
            ) : (
              historyData.records.map((record: any) => {
                const date = new Date(record.salesDate);
                return (
                  <Card key={record.id} className="border-0 shadow-sm cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => {
                      setSelectedDate(date.toISOString().split("T")[0]);
                      setTab("record");
                    }}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium">
                          {formatDate(date, { shortYear: true })}
                        </p>
                        <p className="text-sm font-bold text-primary">
                          ฿{formatCurrency(Number(record.totalAmount) || 0)}
                        </p>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        {Number(record.cashAmount) > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Banknote className="h-3 w-3" />
                            ฿{formatCurrency(Number(record.cashAmount))}
                          </Badge>
                        )}
                        {Number(record.transferAmount) > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Smartphone className="h-3 w-3" />
                            ฿{formatCurrency(Number(record.transferAmount))}
                          </Badge>
                        )}
                        {Number(record.edcAmount) > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <CreditCard className="h-3 w-3" />
                            ฿{formatCurrency(Number(record.edcAmount))}
                          </Badge>
                        )}
                        {Number(record.deliveryAmount) > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Truck className="h-3 w-3" />
                            ฿{formatCurrency(Number(record.deliveryAmount))}
                          </Badge>
                        )}
                        {Number(record.extraTotal) > 0 && (
                          <Badge variant="secondary" className="text-[10px] gap-1">
                            <Plus className="h-3 w-3" />
                            ฿{formatCurrency(Number(record.extraTotal))}
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </TabsContent>

          {/* ── Summary Tab ── */}
          <TabsContent value="summary" className="space-y-4">
            {/* Date Range Selector — tap to open sheet */}
            <Card className="border-0 shadow-sm cursor-pointer" onClick={() => setShowDateRangeSheet(true)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarRange className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">ช่วงเวลา</p>
                      <p className="text-sm font-semibold">
                        {rangeMode === "month"
                          ? `${thaiMonths[summaryMonth - 1]} ${summaryYear + 543}`
                          : customRange?.from
                            ? customRange.to && customRange.from.getTime() !== customRange.to.getTime()
                              ? `${formatThaiDate(customRange.from)} — ${formatThaiDate(customRange.to)}`
                              : formatThaiDate(customRange.from)
                            : "เลือกช่วงเวลา"}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            {/* Date Range Sheet (popup like reference image) */}
            <Sheet open={showDateRangeSheet} onOpenChange={setShowDateRangeSheet}>
              <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
                <SheetHeader className="pb-2">
                  <SheetTitle className="text-base">เลือกช่วงเวลา</SheetTitle>
                </SheetHeader>

                <div className="flex gap-3">
                  {/* Left: Preset buttons */}
                  <div className="flex flex-col gap-1.5 min-w-[110px] shrink-0">
                    {[
                      { key: "today", label: "วันนี้" },
                      { key: "yesterday", label: "เมื่อวาน" },
                      { key: "7days", label: "7 วันก่อนหน้า" },
                      { key: "14days", label: "14 วันก่อนหน้า" },
                      { key: "30days", label: "30 วันก่อนหน้า" },
                      { key: "thisMonth", label: "เดือนนี้" },
                      { key: "thisYear", label: "ปีนี้" },
                      { key: "lastYear", label: "ปีที่แล้ว" },
                    ].map((p) => (
                      <Button
                        key={p.key}
                        variant="outline"
                        size="sm"
                        className="justify-start text-xs h-8 px-3 font-normal"
                        onClick={() => applyPreset(p.key)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>

                  {/* Right: Date inputs + Calendar */}
                  <div className="flex-1 space-y-3">
                    {/* Date input row */}
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <button
                          className="w-full flex items-center gap-1.5 border rounded-lg px-3 py-2 text-xs bg-background hover:bg-muted/50 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{customRange?.from ? formatThaiDate(customRange.from) : "วันเริ่มต้น"}</span>
                        </button>
                      </div>
                      <div className="flex-1">
                        <button
                          className="w-full flex items-center gap-1.5 border rounded-lg px-3 py-2 text-xs bg-background hover:bg-muted/50 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>{customRange?.to ? formatThaiDate(customRange.to) : "วันสิ้นสุด"}</span>
                        </button>
                      </div>
                    </div>

                    {/* Calendar */}
                    <div className="flex justify-center">
                      <CalendarComponent
                        mode="range"
                        selected={customRange}
                        onSelect={(range) => {
                          setCustomRange(range);
                          if (range?.from && range?.to) {
                            setRangeMode("custom");
                          }
                        }}
                        numberOfMonths={1}
                        className="rounded-md"
                      />
                    </div>

                    {/* Apply button */}
                    <Button
                      className="w-full"
                      size="sm"
                      disabled={!customRange?.from}
                      onClick={() => {
                        if (customRange?.from) {
                          setRangeMode("custom");
                          setShowDateRangeSheet(false);
                        }
                      }}
                    >
                      ยืนยัน
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            {loadingRangeSummary ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                <p className="text-xs text-muted-foreground mt-2">กำลังโหลดข้อมูล...</p>
              </div>
            ) : !rangeSummary?.summary ? (
              <div className="text-center py-12">
                <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลในช่วงเวลานี้</p>
              </div>
            ) : (
              <>
                {/* Grand Total */}
                <Card className="border-0 shadow-sm bg-primary/5">
                  <CardContent className="p-5 text-center">
                    <p className="text-xs text-muted-foreground mb-1">ยอดรวมรายรับ</p>
                    <p className="text-3xl font-bold text-primary">
                      ฿{formatCurrency(Number(rangeSummary.summary.grandTotal) || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      จำนวน {rangeSummary.summary.recordCount} วันที่บันทึก
                    </p>
                    {rangeSummary.totalExpenses > 0 && (
                      <div className="mt-3 pt-3 border-t border-primary/10">
                        <div className="flex justify-center gap-6 text-xs">
                          <div>
                            <span className="text-muted-foreground">รายจ่าย: </span>
                            <span className="font-semibold text-red-600">฿{formatCurrency(rangeSummary.totalExpenses)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">กำไรสุทธิ: </span>
                            <span className={`font-semibold ${rangeSummary.netProfit >= 0 ? "text-green-700" : "text-red-600"}`}>
                              ฿{formatCurrency(rangeSummary.netProfit)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Export Buttons */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm font-semibold mb-3">ส่งออกรายงาน</p>
                    <div className={isMobile ? "grid grid-cols-2 gap-2" : "grid grid-cols-4 gap-2"}>
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        className={isMobile ? "h-12 text-sm flex flex-col gap-0.5 py-1" : "text-xs h-9"}
                        onClick={() => handleExportRangeSummary("pdf")}
                        disabled={!!summaryExportLoading}
                      >
                        {summaryExportLoading === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4 text-red-600" />}
                        <span>PDF</span>
                      </Button>
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        className={isMobile ? "h-12 text-sm flex flex-col gap-0.5 py-1" : "text-xs h-9"}
                        onClick={() => handleExportRangeSummary("csv")}
                        disabled={!!summaryExportLoading}
                      >
                        {summaryExportLoading === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4 text-green-600" />}
                        <span>CSV</span>
                      </Button>
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        className={isMobile ? "h-12 text-sm flex flex-col gap-0.5 py-1" : "text-xs h-9"}
                        onClick={() => handleExportRangeSummary("xlsx")}
                        disabled={!!summaryExportLoading}
                      >
                        {summaryExportLoading === "xlsx" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4 text-green-700" />}
                        <span>XLSX</span>
                      </Button>
                      <Button
                        variant="outline"
                        size={isMobile ? "default" : "sm"}
                        className={isMobile ? "h-12 text-sm flex flex-col gap-0.5 py-1" : "text-xs h-9"}
                        onClick={handleExportGoogleSheet}
                        disabled={!!summaryExportLoading}
                      >
                        <SheetIcon className="h-4 w-4 text-emerald-600" />
                        <span>Google Sheet</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Channel Breakdown */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-semibold">แยกตามช่องทาง</p>
                    <div className="space-y-2">
                      {[
                        { icon: Banknote, label: "เงินสด", value: rangeSummary.summary.totalCash, bg: "bg-green-100", fg: "text-green-700" },
                        { icon: Smartphone, label: "โอน/PromptPay", value: rangeSummary.summary.totalTransfer, bg: "bg-blue-100", fg: "text-blue-700" },
                        { icon: CreditCard, label: "EDC", value: rangeSummary.summary.totalEdc, bg: "bg-purple-100", fg: "text-purple-700" },
                        { icon: Truck, label: "Delivery", value: rangeSummary.summary.totalDelivery, bg: "bg-orange-100", fg: "text-orange-700" },
                        ...(Number(rangeSummary.summary.totalExtra) > 0 ? [{ icon: Plus, label: "ช่องทางอื่น", value: rangeSummary.summary.totalExtra, bg: "bg-gray-100", fg: "text-gray-700" }] : []),
                      ].map((ch) => (
                        <div key={ch.label} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-7 w-7 rounded-md ${ch.bg} flex items-center justify-center`}>
                              <ch.icon className={`h-3.5 w-3.5 ${ch.fg}`} />
                            </div>
                            <span className="text-sm">{ch.label}</span>
                          </div>
                          <span className="text-sm font-medium">฿{formatCurrency(Number(ch.value) || 0)}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown - LARGE */}
                {rangeSummary.categoryBreakdown.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Tag className="h-5 w-5 text-teal-600" />
                        <p className="text-lg font-bold">รวมยอดตามหมวดหมู่</p>
                      </div>
                      <div className="text-center py-2">
                        <p className="text-3xl font-bold text-teal-700">
                          ฿{formatCurrency(rangeSummary.categoryBreakdown.reduce((sum, cb) => sum + (Number(cb.totalAmount) || 0), 0))}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {rangeSummary.categoryBreakdown.map((cb) => (
                          <div key={cb.categoryName} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-md bg-teal-100 flex items-center justify-center">
                                <Tag className="h-3.5 w-3.5 text-teal-700" />
                              </div>
                              <span className="text-sm">{cb.categoryName}</span>
                            </div>
                            <span className="text-sm font-medium">฿{formatCurrency(Number(cb.totalAmount) || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Daily Records List - clickable for detail popup */}
                {rangeSummary.dailyRecords.length > 0 && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 space-y-2">
                      <p className="text-sm font-semibold mb-2">รายละเอียดรายวัน (กดดูรายละเอียด)</p>
                      {rangeSummary.dailyRecords.map((r) => {
                        const d = new Date(r.salesDate);
                        const dateKey = d.toISOString().split("T")[0];
                        const dayStr = d.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short" });
                        return (
                          <button
                            key={dateKey}
                            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 transition-colors text-left"
                            onClick={() => setDayDetailDate(dateKey)}
                          >
                            <div>
                              <p className="text-sm font-medium">{dayStr}</p>
                              <p className="text-xs text-muted-foreground">
                                สด:{formatCurrency(r.cashAmount)} | โอน:{formatCurrency(r.transferAmount)} | Del:{formatCurrency(r.deliveryAmount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-primary">฿{formatCurrency(r.totalAmount)}</p>
                              <Eye className="h-3 w-3 text-muted-foreground ml-auto" />
                            </div>
                          </button>
                        );
                      })}
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {/* Day Detail Popup Dialog */}
            <Dialog open={!!dayDetailDate} onOpenChange={(open) => !open && setDayDetailDate(null)}>
              <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-base">
                    รายละเอียดวันที่ {dayDetailDate ? new Date(dayDetailDate).toLocaleDateString("th-TH", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : ""}
                  </DialogTitle>
                </DialogHeader>
                {loadingDayDetail ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                  </div>
                ) : dayDetail ? (
                  <div className="space-y-4">
                    {/* Income */}
                    <div>
                      <p className="text-sm font-semibold mb-2">รายรับ</p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-sm"><span>เงินสด</span><span>฿{formatCurrency(dayDetail.income.cash)}</span></div>
                        <div className="flex justify-between text-sm"><span>โอน/PromptPay</span><span>฿{formatCurrency(dayDetail.income.transfer)}</span></div>
                        <div className="flex justify-between text-sm"><span>EDC</span><span>฿{formatCurrency(dayDetail.income.edc)}</span></div>
                        <div className="flex justify-between text-sm"><span>Delivery</span><span>฿{formatCurrency(dayDetail.income.delivery)}</span></div>
                        {dayDetail.income.extra.map((ch) => (
                          <div key={ch.channelName} className="flex justify-between text-sm"><span>{ch.channelName}</span><span>฿{formatCurrency(ch.amount)}</span></div>
                        ))}
                        <div className="flex justify-between text-sm font-bold pt-1 border-t"><span>รวมรายรับ</span><span className="text-primary">฿{formatCurrency(dayDetail.totalIncome)}</span></div>
                      </div>
                    </div>
                    {/* Expenses */}
                    {dayDetail.expenses.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-2">รายจ่าย</p>
                        <div className="space-y-1.5">
                          {dayDetail.expenses.map((exp, i) => (
                            <div key={i} className="flex justify-between text-sm">
                              <span className="text-red-600">{exp.description}{exp.category ? ` (${exp.category})` : ""}</span>
                              <span className="text-red-600">฿{formatCurrency(exp.amount)}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-bold pt-1 border-t"><span>รวมรายจ่าย</span><span className="text-red-600">฿{formatCurrency(dayDetail.totalExpenses)}</span></div>
                        </div>
                      </div>
                    )}
                    {/* Net */}
                    <div className={`p-3 rounded-lg text-center ${dayDetail.netProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                      <p className="text-xs text-muted-foreground">กำไรสุทธิ</p>
                      <p className={`text-xl font-bold ${dayDetail.netProfit >= 0 ? "text-green-700" : "text-red-600"}`}>
                        ฿{formatCurrency(dayDetail.netProfit)}
                      </p>
                    </div>
                    {dayDetail.note && (
                      <div className="p-2 bg-muted/50 rounded text-xs text-muted-foreground">
                        <strong>หมายเหตุ:</strong> {dayDetail.note}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-4">ไม่พบข้อมูลวันนี้</p>
                )}
              </DialogContent>
            </Dialog>
          </TabsContent>

          {/* ── In-Store Sales Tab ── */}
          <TabsContent value="instore" className="space-y-4">
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 text-center">
                <Store className="h-8 w-8 mx-auto text-primary/30 mb-2" />
                <p className="text-sm font-medium">ยอดขายสินค้าหน้าร้าน</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ลงยอดขายสินค้าหน้าร้าน (ผงชา, อุปกรณ์ชงชา ฯลฯ) แยกจากเครื่องดื่ม
                </p>
                <Button
                  className="mt-3"
                  size="sm"
                  onClick={() => setLocation("/admin/in-store-sales")}
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  ไปหน้าลงยอดสินค้าหน้าร้าน
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Commission Tab ── */}
          <TabsContent value="commission" className="space-y-4">
            {/* Month Navigation */}
            <div className="flex items-center justify-between bg-card rounded-xl p-3 shadow-sm">
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <p className="text-sm font-medium">
                {thaiMonths[summaryMonth - 1]} {summaryYear + 543}
              </p>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {loadingCommission ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : !commissionData || commissionData.length === 0 ? (
              <div className="text-center py-12">
                <Percent className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">ยังไม่มีข้อมูลค่าคอมมิชชั่น</p>
                <p className="text-xs text-muted-foreground mt-1">
                  ต้องสร้างหมวดหมู่พร้อมกำหนด % คอมมิชชั่น และลงยอดขายแยกหมวดหมู่ก่อน
                </p>
              </div>
            ) : (
              <>
                {/* Total Commission */}
                <Card className="border-0 shadow-sm bg-amber-50">
                  <CardContent className="p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">ค่าคอมมิชชั่นรวมทั้งเดือน</p>
                    <p className="text-2xl font-bold text-amber-700">
                      ฿{formatCurrency(commissionData.reduce((sum: number, c: any) => sum + (Number(c.commission) || 0), 0))}
                    </p>
                  </CardContent>
                </Card>

                {/* Commission by Category */}
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-amber-600" />
                      <p className="text-sm font-semibold">รายละเอียดคอมมิชชั่น</p>
                    </div>

                    <div className="space-y-3">
                      {commissionData.map((c: any) => (
                        <div key={c.categoryId} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{c.categoryName}</span>
                            <Badge variant="secondary" className="text-[10px]">
                              คอมฯ {c.commissionRate}%
                            </Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>ยอดขาย: ฿{formatCurrency(Number(c.totalSales) || 0)}</span>
                            <span className="font-semibold text-amber-700">
                              คอมฯ: ฿{formatCurrency(Number(c.commission) || 0)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly summary reference */}
                {monthlySummary && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <p className="text-xs text-muted-foreground mb-2">อ้างอิงยอดรวมเดือนนี้</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">ยอดขายรวม</span>
                        <span className="text-sm font-bold text-primary">
                          ฿{formatCurrency(Number(monthlySummary.grandTotal) || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>

          {/* ── Audit Trail Tab ── */}
          {hasEditRole && (
            <TabsContent value="audit" className="space-y-3">
              <AuditTrailSection branchId={selectedBranchId} />
            </TabsContent>
          )}
        </Tabs>
      </PremiumPageContent>
    </MobileLayout>
  );
}

// Audit Trail Sub-component
function AuditTrailSection({ branchId }: { branchId: number | null }) {
  const auditLogs = trpc.dailySales.branchAuditLogs.useQuery(
    { branchId: branchId!, limit: 50 },
    { enabled: !!branchId }
  );

  if (!branchId) return <p className="text-sm text-muted-foreground text-center py-4">กรุณาเลือกสาขา</p>;
  if (auditLogs.isLoading) return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!auditLogs.data || auditLogs.data.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">ยังไม่มีประวัติการแก้ไข</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-foreground">ประวัติการแก้ไขล่าสุด 50 รายการ</p>
      {auditLogs.data.map((log) => {
        const before = log.beforeData ? JSON.parse(log.beforeData) : null;
        const after = JSON.parse(log.afterData);
        const isCreate = log.action === "create";
        return (
          <Card key={log.id} className="border-0 shadow-sm">
            <CardContent className="p-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Badge variant={isCreate ? "default" : "secondary"} className="text-[10px]">
                    {isCreate ? "สร้างใหม่" : "แก้ไข"}
                  </Badge>
                  <span className="text-xs font-medium">{log.userName || `พนักงาน #${log.userId}`}</span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(log.createdAt).toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </div>
              {!isCreate && before && (
                <div className="text-xs space-y-0.5 mt-1">
                  {before.totalAmount !== after.totalAmount && (
                    <p className="text-muted-foreground">
                      ยอดรวม: <span className="line-through text-red-500">฿{(before.totalAmount / 100).toLocaleString()}</span>
                      {" "}→{" "}
                      <span className="text-green-600 font-medium">฿{(after.totalAmount / 100).toLocaleString()}</span>
                    </p>
                  )}
                  {before.cashAmount !== after.cashAmount && (
                    <p className="text-muted-foreground">เงินสด: {(before.cashAmount / 100).toLocaleString()} → {(after.cashAmount / 100).toLocaleString()}</p>
                  )}
                  {before.transferAmount !== after.transferAmount && (
                    <p className="text-muted-foreground">โอน: {(before.transferAmount / 100).toLocaleString()} → {(after.transferAmount / 100).toLocaleString()}</p>
                  )}
                  {before.note !== after.note && (
                    <p className="text-muted-foreground">หมายเหตุ: "{before.note || '-'}" → "{after.note || '-'}"</p>
                  )}
                </div>
              )}
              {isCreate && (
                <p className="text-xs text-muted-foreground mt-1">ยอดรวม: ฿{(after.totalAmount / 100).toLocaleString()}</p>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
