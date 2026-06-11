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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet, Plus, Minus, ArrowDownCircle, ArrowUpCircle, Loader2,
  AlertTriangle, Camera, Receipt, Calendar, ChevronLeft, ChevronRight,
  Send, Banknote, CreditCard, Smartphone, ImageIcon, TrendingUp, TrendingDown,
  Scissors, Merge, Eye,
} from "lucide-react";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { formatDate, formatDateTime, formatMonthYear } from "@/lib/dateUtils";
import { useIsMobile } from "@/hooks/useMobile";

const CATEGORIES = [
  { value: "ingredients", label: "วัตถุดิบ" },
  { value: "packaging", label: "บรรจุภัณฑ์" },
  { value: "cleaning", label: "อุปกรณ์ทำความสะอาด" },
  { value: "transport", label: "ค่าเดินทาง/ขนส่ง" },
  { value: "repair", label: "ซ่อมแซม" },
  { value: "office", label: "อุปกรณ์สำนักงาน" },
  { value: "other", label: "อื่นๆ" },
];

const TRANSFER_METHODS = [
  { value: "cash", label: "เงินสด", icon: Banknote },
  { value: "transfer", label: "โอนธนาคาร", icon: CreditCard },
  { value: "promptpay", label: "PromptPay", icon: Smartphone },
];

const THAI_MONTHS_SHORT_LOCAL = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

type PeriodData = { totalDeposits: number; totalExpenses: number; transactionCount: number };

function PeriodComparisonCard({
  title,
  current,
  previous,
  previousLabel,
}: {
  title: string;
  current: PeriodData;
  previous: PeriodData;
  previousLabel: string;
}) {
  const depositChange = previous.totalDeposits > 0
    ? ((current.totalDeposits - previous.totalDeposits) / previous.totalDeposits) * 100
    : current.totalDeposits > 0 ? 100 : 0;
  const expenseChange = previous.totalExpenses > 0
    ? ((current.totalExpenses - previous.totalExpenses) / previous.totalExpenses) * 100
    : current.totalExpenses > 0 ? 100 : 0;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-4">
        <p className="text-xs font-semibold text-foreground mb-3">{title}</p>
        <div className="grid grid-cols-2 gap-3">
          {/* Deposits */}
          <div className="bg-green-50 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownCircle className="h-3.5 w-3.5 text-green-600" />
              <span className="text-[10px] text-green-700 font-medium">เบิกเข้า</span>
            </div>
            <p className="text-base font-bold text-green-700">฿{current.totalDeposits.toLocaleString()}</p>
            <ChangeIndicator change={depositChange} previousLabel={previousLabel} previousValue={previous.totalDeposits} />
          </div>
          {/* Expenses */}
          <div className="bg-red-50 rounded-lg p-3">
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpCircle className="h-3.5 w-3.5 text-red-500" />
              <span className="text-[10px] text-red-600 font-medium">ใช้ไป</span>
            </div>
            <p className="text-base font-bold text-red-600">฿{current.totalExpenses.toLocaleString()}</p>
            <ChangeIndicator change={expenseChange} previousLabel={previousLabel} previousValue={previous.totalExpenses} isExpense />
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-border/50">
          <span className="text-[10px] text-muted-foreground">รายการ {current.transactionCount} รายการ</span>
          <span className="text-[10px] text-muted-foreground">
            คงเหลือสุทธิ: <span className={`font-medium ${(current.totalDeposits - current.totalExpenses) >= 0 ? "text-green-600" : "text-red-500"}`}>
              ฿{(current.totalDeposits - current.totalExpenses).toLocaleString()}
            </span>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function ChangeIndicator({
  change,
  previousLabel,
  previousValue,
  isExpense,
}: {
  change: number;
  previousLabel: string;
  previousValue: number;
  isExpense?: boolean;
}) {
  if (change === 0 && previousValue === 0) {
    return <p className="text-[10px] text-muted-foreground mt-1">{previousLabel}: ฿0</p>;
  }
  const isUp = change > 0;
  // For expenses: going up is bad (red), going down is good (green)
  // For deposits: going up is good (green), going down is neutral
  const color = isExpense
    ? (isUp ? "text-red-500" : "text-green-600")
    : (isUp ? "text-green-600" : "text-orange-500");

  return (
    <div className="mt-1">
      <div className={`flex items-center gap-0.5 ${color}`}>
        {isUp ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span className="text-[10px] font-medium">
          {change > 0 ? "+" : ""}{Math.round(change)}%
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {previousLabel}: ฿{previousValue.toLocaleString()}
      </p>
    </div>
  );
}

// Receipt popup content - fetches images for a transaction and displays them
function ReceiptPopupContent({ txId, onZoom }: { txId: number | null; onZoom: (url: string) => void }) {
  const { data, isLoading } = trpc.pettyCash.getReceiptImages.useQuery(
    { transactionId: txId! },
    { enabled: txId !== null }
  );

  if (!txId) return null;
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground ml-2">กำลังโหลด...</span>
      </div>
    );
  }
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6">
        <ImageIcon className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">ไม่พบรูปใบเสร็จ</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {data.map((img: any) => (
        <div key={img.id} className="relative group">
          {img.fileType === "application/pdf" ? (
            <a href={img.imageUrl} target="_blank" rel="noopener noreferrer" className="block w-full aspect-square bg-red-50 rounded-lg border flex flex-col items-center justify-center hover:bg-red-100 transition-colors">
              <Receipt className="h-8 w-8 text-red-500" />
              <span className="text-[10px] text-red-600 mt-1">{img.fileName || "PDF"}</span>
              <span className="text-[9px] text-muted-foreground mt-0.5">กดเพื่อเปิด</span>
            </a>
          ) : (
            <img
              src={img.imageUrl}
              alt={img.fileName || "สลิป"}
              className="w-full aspect-square object-cover rounded-lg border cursor-zoom-in hover:opacity-90 transition-opacity"
              onClick={() => onZoom(img.imageUrl)}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function PettyCash() {
  const isMobile = useIsMobile();
  const { session, loading, isStaff, isBranchOwner, isBranchManager, isAreaManager, isSuperAdmin } = useHibiAuth();
  const { selectedBranchId, setSelectedBranchId, currentBranchName, branchIdParam, needsSelector, managedBranches } = useBranchSelector();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState("overview");
  const [page, setPage] = useState(0);
  const [depositPage, setDepositPage] = useState(0);
  const limit = 20;

  // Expense form — smart grouping: same bill = 1 entry with multiple images, different bill = new entry
  type ReceiptImage = { data: string; type: string; fileName?: string; preview: string };
  type ExpenseEntry = {
    id: string;
    amount: string;
    description: string;
    category: string;
    date: string;
    note: string;
    receipts: ReceiptImage[]; // multiple images per entry (same bill)
    ocrResult: any;
    ocrLoading: boolean;
    ocrProgress: number;
    confidence: any;
  };
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expEntries, setExpEntries] = useState<ExpenseEntry[]>([]);
  const [expenseMode, setExpenseMode] = useState<'scan' | 'manual'>('scan');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  // Full-screen image zoom
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  // Receipt popup for transaction history
  const [receiptPopupTxId, setReceiptPopupTxId] = useState<number | null>(null);

  // Deposit form (owner only)
  const [showDepositForm, setShowDepositForm] = useState(false);
  const [depAmount, setDepAmount] = useState("");
  const [depDesc, setDepDesc] = useState("");
  const [depMethod, setDepMethod] = useState("transfer");
  const [depNote, setDepNote] = useState("");
  const [depDate, setDepDate] = useState(() => new Date().toISOString().split("T")[0]);

  // Fund request form
  const [showFundRequest, setShowFundRequest] = useState(false);
  const [reqAmount, setReqAmount] = useState("");
  const [reqReason, setReqReason] = useState("");

  // Determine if user can edit (add/modify transactions)
  const canEdit = isBranchOwner || isBranchManager || isAreaManager || session?.role === "super_admin";
  // All staff can access the page (read-only for branch_staff)
  const canAccessAccounting = isStaff;

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isStaff) setLocation("/customer");
  }, [loading, session, isStaff, setLocation]);

  const { data: balance, isLoading: loadingBalance } = trpc.pettyCash.getBalance.useQuery({ branchId: branchIdParam }, { enabled: !!session && canAccessAccounting });
  const { data: settings } = trpc.pettyCash.getSettings.useQuery({ branchId: branchIdParam }, { enabled: !!session && canAccessAccounting });
  const { data: txData, isLoading: loadingTx } = trpc.pettyCash.listTransactions.useQuery(
    { limit, offset: page * limit, branchId: branchIdParam },
    { enabled: !!session && canAccessAccounting && tab === "transactions" }
  );
  // For super_admin/area_manager without specific branch: pass undefined branchId to see all
  const fundReqInput = (isSuperAdmin || isAreaManager) && !branchIdParam ? { status: undefined } : { branchId: branchIdParam };
  const { data: fundRequests } = trpc.pettyCash.listFundRequests.useQuery(fundReqInput as any, {
    enabled: !!session && canAccessAccounting && tab === "requests",
  });
  const { data: summary } = trpc.pettyCash.getSummary.useQuery({ branchId: branchIdParam }, {
    enabled: !!session && canAccessAccounting && tab === "overview",
  });

  // Deposit report (owner/area_manager/super_admin)
  const canViewDepositReport = isBranchOwner || isAreaManager || isSuperAdmin;
  const { data: depositData, isLoading: loadingDeposits } = trpc.pettyCash.listTransactions.useQuery(
    { limit, offset: depositPage * limit, branchId: branchIdParam, type: "deposit" },
    { enabled: !!session && canViewDepositReport && tab === "deposits" && !!branchIdParam }
  );

  const utils = trpc.useUtils();

  const addExpenseMut = trpc.pettyCash.addExpense.useMutation({
    onSuccess: (result) => {
      toast.success(`บันทึกรายจ่าย — คงเหลือ ฿${result.balanceAfter.toLocaleString()}`);
      if (result.isLowBalance) {
        toast.warning("⚠️ ยอดเงินสดเหลือน้อย กรุณาแจ้งเจ้าของสาขาเติมเงิน");
      }
      resetExpenseForm();
      utils.pettyCash.getBalance.invalidate();
      utils.pettyCash.listTransactions.invalidate();
      utils.pettyCash.getSummary.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const addDepositMut = trpc.pettyCash.addDeposit.useMutation({
    onSuccess: (result) => {
      toast.success(`เติมเงินสำเร็จ — คงเหลือ ฿${result.balanceAfter.toLocaleString()}`);
      resetDepositForm();
      utils.pettyCash.getBalance.invalidate();
      utils.pettyCash.listTransactions.invalidate();
      utils.pettyCash.getSummary.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const requestFundMut = trpc.pettyCash.requestFund.useMutation({
    onSuccess: () => {
      toast.success("ส่งคำขอเติมเงินแล้ว");
      setShowFundRequest(false);
      setReqAmount("");
      setReqReason("");
      utils.pettyCash.listFundRequests.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const processFundMut = trpc.pettyCash.processFundRequest.useMutation({
    onSuccess: (result) => {
      if (result.balanceAfter !== null) {
        toast.success(`อนุมัติแล้ว — คงเหลือ ฿${result.balanceAfter.toLocaleString()}`);
      } else {
        toast.success("ดำเนินการแล้ว");
      }
      utils.pettyCash.listFundRequests.invalidate();
      utils.pettyCash.getBalance.invalidate();
      utils.pettyCash.listTransactions.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const resetExpenseForm = () => {
    setShowExpenseForm(false);
    setExpEntries([]);
    setExpenseMode('scan');
  };

  const resetDepositForm = () => {
    setShowDepositForm(false);
    setDepAmount("");
    setDepDesc("");
    setDepMethod("transfer");
    setDepNote("");
    setDepDate(new Date().toISOString().split("T")[0]);
  };

  // OCR progress animation per entry
  useEffect(() => {
    const loadingEntries = expEntries.filter(e => e.ocrLoading);
    if (loadingEntries.length === 0) return;
    const interval = setInterval(() => {
      setExpEntries(prev => prev.map(entry => {
        if (!entry.ocrLoading) return entry;
        if (entry.ocrProgress >= 90) return entry;
        return { ...entry, ocrProgress: entry.ocrProgress + Math.random() * 8 + 2 };
      }));
    }, 500);
    return () => clearInterval(interval);
  }, [expEntries.filter(e => e.ocrLoading).length]);

  const ocrReceiptMut = trpc.pettyCash.ocrReceipt.useMutation();

  // Smart-group helper: check if OCR data matches an existing entry
  const isSameBill = (ocrData: any, entry: ExpenseEntry): boolean => {
    if (!ocrData || !entry.ocrResult) return false;
    // Compare amount (exact match)
    const ocrAmount = ocrData.amount ? Math.round(ocrData.amount) : 0;
    const entryAmount = parseInt(entry.amount) || 0;
    if (ocrAmount > 0 && entryAmount > 0 && ocrAmount === entryAmount) {
      // Amount matches - check vendor or description similarity
      const ocrVendor = (ocrData.vendor || ocrData.description || "").toLowerCase().trim();
      const entryVendor = (entry.ocrResult?.vendor || entry.description || "").toLowerCase().trim();
      if (ocrVendor && entryVendor) {
        // Simple similarity: starts with same prefix or contains same key words
        if (ocrVendor === entryVendor || ocrVendor.includes(entryVendor) || entryVendor.includes(ocrVendor)) {
          return true;
        }
      }
      // If amount matches and date matches, likely same bill
      const ocrDate = ocrData.date || "";
      const entryDate = entry.date || "";
      if (ocrDate && entryDate && ocrDate === entryDate) {
        return true;
      }
    }
    return false;
  };

  const triggerOcr = useCallback((entryId: string, imageData: string, imageType: string) => {
    setExpEntries(prev => prev.map(e => e.id === entryId ? { ...e, ocrLoading: true, ocrProgress: 5, ocrResult: null } : e));
    ocrReceiptMut.mutate(
      { imageData, imageType },
      {
        onSuccess: (result) => {
          if (result.success && result.data) {
            setExpEntries(prev => {
              // Find the entry that just got OCR'd
              const targetIdx = prev.findIndex(e => e.id === entryId);
              if (targetIdx === -1) return prev;
              const target = prev[targetIdx];

              // Check if this OCR result matches any EXISTING entry (not itself)
              const matchIdx = prev.findIndex((e, i) => i !== targetIdx && !e.ocrLoading && e.ocrResult && isSameBill(result.data, e));

              if (matchIdx !== -1) {
                // MERGE: same bill - add images to existing entry, remove the new entry
                const merged = [...prev];
                merged[matchIdx] = {
                  ...merged[matchIdx],
                  receipts: [...merged[matchIdx].receipts, ...target.receipts],
                };
                // Remove the duplicate entry
                merged.splice(targetIdx, 1);
                toast.success(`รูปนี้เป็นบิลเดียวกับรายการ ${String(matchIdx + 1).padStart(2, "0")} — รวมรูปแล้ว`);
                return merged;
              }

              // SEPARATE: different bill - update entry with OCR data
              const validCats = CATEGORIES.map(c => c.value);
              const updated = [...prev];
              updated[targetIdx] = {
                ...target,
                ocrLoading: false,
                ocrProgress: 100,
                ocrResult: result.data,
                confidence: result.data.confidence || null,
                amount: result.data.amount ? String(Math.round(result.data.amount)) : target.amount,
                description: result.data.description || target.description,
                category: (result.data.category && validCats.includes(result.data.category)) ? result.data.category : target.category,
                date: result.data.date || target.date,
              };
              toast.success("อ่านใบเสร็จสำเร็จ กรุณาตรวจสอบข้อมูล");
              return updated;
            });
          } else {
            setExpEntries(prev => prev.map(e => e.id === entryId ? { ...e, ocrLoading: false, ocrProgress: 0 } : e));
            toast.error(result.error || "ไม่สามารถอ่านได้ กรุณากรอกข้อมูลเอง");
          }
        },
        onError: () => {
          setExpEntries(prev => prev.map(e => e.id === entryId ? { ...e, ocrLoading: false, ocrProgress: 0 } : e));
          toast.error("เกิดข้อผิดพลาด OCR กรุณากรอกข้อมูลเอง");
        },
      }
    );
  }, [ocrReceiptMut]);

  const handleReceiptCapture = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const maxTotal = 10;
    const currentImageCount = expEntries.reduce((sum, entry) => sum + entry.receipts.length, 0);
    const filesToProcess = Array.from(files).slice(0, maxTotal - currentImageCount);
    if (filesToProcess.length === 0) {
      toast.error(`สูงสุด ${maxTotal} รูปรวม`);
      return;
    }
    for (const file of filesToProcess) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`ไฟล์ ${file.name} ใหญ่เกิน 10MB`);
        continue;
      }
      const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "application/pdf"];
      if (!allowedTypes.includes(file.type) && !file.type.startsWith("image/")) {
        toast.error(`ไฟล์ ${file.name} ไม่รองรับ`);
        continue;
      }
      const reader = new FileReader();
      const isImage = file.type.startsWith("image/");
      const entryId = `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        const preview = file.type === "application/pdf" ? "pdf" : (reader.result as string);
        const receiptImg: ReceiptImage = { data: base64, type: file.type, fileName: file.name, preview };
        // Always create a new entry first; OCR will merge if same bill
        const newEntry: ExpenseEntry = {
          id: entryId,
          amount: "",
          description: "",
          category: "other",
          date: new Date().toISOString().split("T")[0],
          note: "",
          receipts: [receiptImg],
          ocrResult: null,
          ocrLoading: false,
          ocrProgress: 0,
          confidence: null,
        };
        setExpEntries(prev => [...prev, newEntry]);
        // Auto-trigger OCR for images
        if (isImage) {
          setTimeout(() => triggerOcr(entryId, base64, file.type), 100);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }, [expEntries, triggerOcr]);

  const removeEntry = useCallback((entryId: string) => {
    setExpEntries(prev => prev.filter(e => e.id !== entryId));
  }, []);

  const addManualEntry = useCallback(() => {
    if (expEntries.length >= 10) return;
    const newEntry: ExpenseEntry = {
      id: crypto.randomUUID(),
      amount: '',
      description: '',
      category: 'other',
      date: new Date().toISOString().split('T')[0],
      note: '',
      receipts: [],
      ocrResult: null,
      ocrLoading: false,
      ocrProgress: 0,
      confidence: null,
    };
    setExpEntries(prev => [...prev, newEntry]);
  }, [expEntries.length]);

  const removeReceiptFromEntry = useCallback((entryId: string, receiptIdx: number) => {
    setExpEntries(prev => prev.map(e => {
      if (e.id !== entryId) return e;
      const newReceipts = e.receipts.filter((_, i) => i !== receiptIdx);
      if (newReceipts.length === 0) return null as any; // will be filtered
      return { ...e, receipts: newReceipts };
    }).filter(Boolean));
  }, []);

  // Split: extract one image from a multi-image entry into a new separate entry
  const splitEntry = useCallback((entryId: string, receiptIdx: number) => {
    setExpEntries(prev => {
      const entry = prev.find(e => e.id === entryId);
      if (!entry || entry.receipts.length <= 1) return prev;
      const splitReceipt = entry.receipts[receiptIdx];
      const remainingReceipts = entry.receipts.filter((_, i) => i !== receiptIdx);
      const newEntry: ExpenseEntry = {
        id: `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        amount: "",
        description: "",
        category: "other",
        date: entry.date,
        note: "",
        receipts: [splitReceipt],
        ocrResult: null,
        ocrLoading: false,
        ocrProgress: 0,
        confidence: null,
      };
      const updated = prev.map(e => e.id === entryId ? { ...e, receipts: remainingReceipts } : e);
      // Insert new entry right after the original
      const idx = updated.findIndex(e => e.id === entryId);
      updated.splice(idx + 1, 0, newEntry);
      toast.success("แยกรูปเป็นรายการใหม่แล้ว");
      return updated;
    });
  }, []);

  // Merge: combine two entries into one (target absorbs source)
  const [mergeMode, setMergeMode] = useState<string | null>(null); // entryId being merged
  const mergeEntries = useCallback((sourceId: string, targetId: string) => {
    setExpEntries(prev => {
      const source = prev.find(e => e.id === sourceId);
      const target = prev.find(e => e.id === targetId);
      if (!source || !target) return prev;
      const merged = prev.map(e => {
        if (e.id === targetId) {
          return { ...e, receipts: [...e.receipts, ...source.receipts] };
        }
        return e;
      }).filter(e => e.id !== sourceId);
      toast.success("รวมรายการสำเร็จ");
      return merged;
    });
    setMergeMode(null);
  }, []);

  const updateEntry = useCallback((entryId: string, field: keyof ExpenseEntry, value: string) => {
    setExpEntries(prev => prev.map(e => e.id === entryId ? { ...e, [field]: value } : e));
  }, []);

  const handleSubmitExpense = () => {
    if (expEntries.length === 0) { toast.error("กรุณาเพิ่มรายการอย่างน้อย 1 รายการ"); return; }
    // Validate each entry
    for (let i = 0; i < expEntries.length; i++) {
      const entry = expEntries[i];
      const amount = parseInt(entry.amount);
      if (!amount || amount <= 0) { toast.error(`รายการ ${String(i + 1).padStart(2, "0")}: กรุณากรอกจำนวนเงิน`); return; }
      if (!entry.description.trim()) { toast.error(`รายการ ${String(i + 1).padStart(2, "0")}: กรุณากรอกรายละเอียด`); return; }
    }
    // Submit each entry as separate transaction
    const submitNext = (index: number) => {
      if (index >= expEntries.length) {
        resetExpenseForm();
        return;
      }
      const entry = expEntries[index];
      const entryMethod = entry.receipts.length > 0 ? 'ocr' as const : 'manual' as const;
      addExpenseMut.mutate({
        amount: parseInt(entry.amount),
        description: entry.description.trim(),
        category: entry.category,
        receiptImages: entry.receipts.map(r => ({ data: r.data, type: r.type, fileName: r.fileName })),
        entryMethod,
        note: entry.note || undefined,
        transactionDate: entry.date,
        branchId: branchIdParam,
      }, {
        onSuccess: (result) => {
          if (index === expEntries.length - 1) {
            toast.success(`บันทึกสำเร็จ ${expEntries.length} รายการ — คงเหลือ ฿${result.balanceAfter.toLocaleString()}`);
            if (result.isLowBalance) {
              toast.warning("⚠️ ยอดเงินสดเหลือน้อย กรุณาแจ้งเจ้าของสาขาเติมเงิน");
            }
            resetExpenseForm();
            utils.pettyCash.getBalance.invalidate();
            utils.pettyCash.listTransactions.invalidate();
            utils.pettyCash.getSummary.invalidate();
          } else {
            submitNext(index + 1);
          }
        },
        onError: (err) => {
          toast.error(`รายการ ${String(index + 1).padStart(2, "0")} ผิดพลาด: ${err.message}`);
        },
      });
    };
    submitNext(0);
  };

  const handleSubmitDeposit = () => {
    const amount = parseInt(depAmount);
    if (!amount || amount <= 0) { toast.error("กรุณากรอกจำนวนเงิน"); return; }
    if (!depDesc.trim()) { toast.error("กรุณากรอกรายละเอียด"); return; }
    addDepositMut.mutate({
      amount,
      description: depDesc.trim(),
      transferMethod: depMethod as "cash" | "transfer" | "promptpay",
      note: depNote || undefined,
      transactionDate: depDate,
      branchId: branchIdParam,
    });
  };

  const currentBalance = balance?.balance ?? 0;
  const isLowBalance = settings && currentBalance < (settings.alertThreshold ?? 0);

  if (loading || !session) return null;

  // Check if system is active (only block branch_manager, privileged roles always pass through)
  const canDeposit = isBranchOwner || isAreaManager || session?.role === "super_admin";
  if (settings && !settings.isActive && !canDeposit) {
    return (
      <MobileLayout title="เงินสดย่อย" showBack backPath="/branch">
        <PremiumPageContent>
        <div className="px-4 py-12 text-center">
          <Wallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">ระบบเบิกจ่ายเงินสดยังไม่เปิดใช้งาน</p>
          <p className="text-xs text-muted-foreground mt-1">กรุณาติดต่อเจ้าของสาขาเพื่อเปิดใช้งาน</p>
        </div>
              </PremiumPageContent>
      </MobileLayout>
    );
  }

  // Using imported formatDate and formatDateTime from dateUtils

  const totalPages = txData ? Math.ceil(txData.total / limit) : 0;

  return (
    <MobileLayout title={`เงินสดย่อย${currentBranchName ? ` - ${currentBranchName}` : ""}`} showBack backPath="/branch">
      <PremiumPageContent>
      <div className="px-4 py-5 space-y-5">
        <BranchSelector
          selectedBranchId={selectedBranchId}
          onBranchChange={setSelectedBranchId}
          managedBranches={managedBranches}
          needsSelector={needsSelector}
        />
        {/* Balance Card */}
        <Card className={`border-0 shadow-md ${isLowBalance ? "bg-gradient-to-br from-red-50 to-red-100" : "bg-gradient-to-br from-primary/5 to-primary/10"}`}>
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Wallet className={`h-5 w-5 ${isLowBalance ? "text-red-600" : "text-primary"}`} />
                <span className="text-sm font-medium text-muted-foreground">ยอดคงเหลือ</span>
              </div>
              {isLowBalance && (
                <Badge variant="destructive" className="text-[10px]">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  เหลือน้อย
                </Badge>
              )}
            </div>
            {loadingBalance ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : (
              <p className={`text-3xl font-bold ${isLowBalance ? "text-red-600" : "text-foreground"}`}>
                ฿{currentBalance.toLocaleString()}
              </p>
            )}
            {settings && (
              <p className="text-xs text-muted-foreground mt-1">
                แจ้งเตือนเมื่อต่ำกว่า ฿{(settings.alertThreshold ?? 0).toLocaleString()}
              </p>
            )}
            {/* Read-only banner for branch_staff */}
            {!canEdit && (
              <div className="mt-4 p-2 bg-amber-50 border border-amber-200 rounded-lg text-center">
                <p className="text-xs text-amber-700 font-medium">ดูย้อนหลังเท่านั้น — ไม่สามารถเพิ่ม/แก้ไขรายการ</p>
              </div>
            )}
            {/* Action buttons - only for canEdit users */}
            {canEdit && (
              <div className="flex gap-2 mt-4">
                <Button
                  size={isMobile ? "default" : "sm"}
                  variant="default"
                  className="flex-1"
                  onClick={() => setShowExpenseForm(true)}
                >
                  <Minus className="h-4 w-4 mr-1" />
                  ลงรายจ่าย
                </Button>
                {(isBranchOwner || isAreaManager || session.role === "super_admin") && (
                  <Button
                    size={isMobile ? "default" : "sm"}
                    variant="outline"
                    className="flex-1 bg-white"
                    onClick={() => setShowDepositForm(true)}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    เติมเงิน
                  </Button>
                )}
                {!isBranchOwner && !isAreaManager && session.role !== "super_admin" && (
                  <Button
                    size={isMobile ? "default" : "sm"}
                    variant="outline"
                    className="flex-1 bg-white"
                    onClick={() => setShowFundRequest(true)}
                  >
                    <Send className="h-4 w-4 mr-1" />
                    ขอเติมเงิน
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bank Account Info */}
        {settings && (settings.bankAccountNumber || settings.promptPayId) && (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">ข้อมูลบัญชีสำหรับโอนเงิน</p>
              {settings.bankName && settings.bankAccountNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{settings.bankName}</span>
                  <span className="font-mono font-medium">{settings.bankAccountNumber}</span>
                </div>
              )}
              {settings.bankAccountName && (
                <p className="text-xs text-muted-foreground">{settings.bankAccountName}</p>
              )}
              {settings.promptPayId && (
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-muted-foreground">PromptPay</span>
                  <span className="font-mono font-medium">{settings.promptPayId}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className={`grid w-full ${canViewDepositReport ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="overview" className="text-xs">ภาพรวม</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs">รายการ</TabsTrigger>
            {canViewDepositReport && (
              <TabsTrigger value="deposits" className="text-xs">รายงานเติมเงิน</TabsTrigger>
            )}
            {canEdit && (
              <TabsTrigger value="requests" className="text-xs">คำขอ</TabsTrigger>
            )}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-3 mt-4">
            {summary ? (
              <>
                {/* All-time totals */}
                <div className="grid grid-cols-2 gap-3">
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 text-center">
                      <ArrowDownCircle className="h-5 w-5 text-green-600 mx-auto mb-1" />
                      <p className="text-lg font-bold text-green-600">฿{(summary.totalDeposits ?? 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">เงินเข้าทั้งหมด</p>
                    </CardContent>
                  </Card>
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 text-center">
                      <ArrowUpCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                      <p className="text-lg font-bold text-red-500">฿{(summary.totalExpenses ?? 0).toLocaleString()}</p>
                      <p className="text-[10px] text-muted-foreground">รายจ่ายทั้งหมด</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Monthly Comparison */}
                {summary.periodSummary && (
                  <PeriodComparisonCard
                    title={`เดือนนี้ (${THAI_MONTHS_SHORT_LOCAL[new Date().getMonth()]})`}
                    current={summary.periodSummary.thisMonth}
                    previous={summary.periodSummary.lastMonth}
                    previousLabel="เดือนก่อน"
                  />
                )}

                {/* Weekly Comparison */}
                {summary.periodSummary && (
                  <PeriodComparisonCard
                    title="สัปดาห์นี้"
                    current={summary.periodSummary.thisWeek}
                    previous={summary.periodSummary.lastWeek}
                    previousLabel="สัปดาห์ก่อน"
                  />
                )}

                <Card className="border-0 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-xs font-medium text-muted-foreground mb-2">จำนวนรายการ</p>
                    <div className="flex justify-between text-sm">
                      <span>รายการทั้งหมด</span>
                      <span className="font-medium">{summary.transactionCount ?? 0} รายการ</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            )}
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-3 mt-4">
            {loadingTx ? (
              <div className="text-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </div>
            ) : !txData || txData.transactions.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">ยังไม่มีรายการ</p>
              </div>
            ) : (
              <>
                {txData.transactions.map((tx: any) => (
                  <Card key={tx.id} className="border-0 shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex items-start gap-3">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${tx.type === "deposit" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"}`}>
                          {tx.type === "deposit" ? <ArrowDownCircle className="h-4 w-4" /> : <ArrowUpCircle className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">{tx.description}</p>
                            <p className={`text-sm font-bold shrink-0 ml-2 ${tx.type === "deposit" ? "text-green-600" : "text-red-500"}`}>
                              {tx.type === "deposit" ? "+" : "-"}฿{tx.amount.toLocaleString()}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground">{formatDateTime(tx.transactionDate)}</span>
                            {tx.category && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {CATEGORIES.find(c => c.value === tx.category)?.label || tx.category}
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            โดย {tx.createdByName} • คงเหลือ ฿{tx.balanceAfter.toLocaleString()}
                          </p>
                          {tx.receiptUrl && (
                            <button
                              className="text-[10px] text-primary flex items-center gap-1 mt-1 hover:underline"
                              onClick={() => setReceiptPopupTxId(tx.id)}
                            >
                              <Eye className="h-3 w-3" /> ดูสลิป/ใบเสร็จ
                            </button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <Button size={isMobile ? "default" : "sm"} variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-xs text-muted-foreground">{page + 1} / {totalPages}</span>
                    <Button size={isMobile ? "default" : "sm"} variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Deposit Report Tab */}
          {canViewDepositReport && (
            <TabsContent value="deposits" className="space-y-3 mt-4">
              {loadingDeposits ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
                </div>
              ) : !depositData || depositData.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <ArrowDownCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">ยังไม่มีรายการเติมเงิน</p>
                </div>
              ) : (
                <>
                  {/* Deposit Summary Card */}
                  <Card className="border-0 shadow-sm bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-green-700 font-medium">ยอดเติมเงินทั้งหมด</p>
                          <p className="text-lg font-bold text-green-700">
                            {depositData.transactions.reduce((sum: number, tx: any) => sum + tx.amount, 0).toLocaleString()} บาท
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-green-700 font-medium">จำนวนรายการ</p>
                          <p className="text-lg font-bold text-green-700">{depositData.total} รายการ</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Deposit List */}
                  {depositData.transactions.map((tx: any) => (
                    <Card key={tx.id} className="border-0 shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-start gap-3">
                          <div className="h-9 w-9 rounded-full flex items-center justify-center shrink-0 bg-green-50 text-green-600">
                            <ArrowDownCircle className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium truncate">{tx.description}</p>
                              <p className="text-sm font-bold shrink-0 ml-2 text-green-600">
                                +฿{tx.amount.toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground">{formatDateTime(tx.transactionDate)}</span>
                              {tx.transferMethod && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {TRANSFER_METHODS.find(m => m.value === tx.transferMethod)?.label || tx.transferMethod}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              โดย {tx.createdByName} • คงเหลือ ฿{tx.balanceAfter.toLocaleString()}
                            </p>
                            {tx.note && (
                              <p className="text-[10px] text-muted-foreground mt-0.5 italic">หมายเหตุ: {tx.note}</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  {/* Pagination */}
                  {(() => { const totalDepositPages = Math.ceil((depositData.total ?? 0) / limit); return totalDepositPages > 1 ? (
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <Button size={isMobile ? "default" : "sm"} variant="outline" disabled={depositPage === 0} onClick={() => setDepositPage(p => p - 1)}>
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground">{depositPage + 1} / {totalDepositPages}</span>
                      <Button size={isMobile ? "default" : "sm"} variant="outline" disabled={depositPage >= totalDepositPages - 1} onClick={() => setDepositPage(p => p + 1)}>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null; })()}
                </>
              )}
            </TabsContent>
          )}

          {/* Fund Requests Tab */}
          {canEdit && (
            <TabsContent value="requests" className="space-y-3 mt-4">
              {!fundRequests || fundRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Send className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">ไม่มีคำขอเติมเงิน</p>
                </div>
              ) : (
                fundRequests.map((req: any) => (
                  <Card key={req.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <span className="text-sm font-medium">{req.requestedByName}</span>
                          {req.branchName && (
                            <span className="text-[10px] text-muted-foreground ml-2">({req.branchName})</span>
                          )}
                        </div>
                        <Badge variant={req.status === "pending" ? "default" : req.status === "approved" ? "outline" : "destructive"} className="text-[10px]">
                          {req.status === "pending" ? "รอดำเนินการ" : req.status === "approved" ? "อนุมัติแล้ว" : "ปฏิเสธ"}
                        </Badge>
                      </div>
                      <p className="text-lg font-bold">฿{req.requestedAmount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground mt-1">{req.reason}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{formatDateTime(req.createdAt)}</p>
                      {req.status === "pending" && (isBranchOwner || isAreaManager || isSuperAdmin) && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size={isMobile ? "default" : "sm"}
                            className="flex-1"
                            disabled={processFundMut.isPending}
                            onClick={() => processFundMut.mutate({
                              id: req.id,
                              action: "approved",
                              depositAmount: req.requestedAmount,
                              transferMethod: "transfer",
                            })}
                          >
                            อนุมัติ + เติมเงิน
                          </Button>
                          <Button
                            size={isMobile ? "default" : "sm"}
                            variant="outline"
                            disabled={processFundMut.isPending}
                            onClick={() => processFundMut.mutate({
                              id: req.id,
                              action: "rejected",
                              note: "ปฏิเสธ",
                            })}
                          >
                            ปฏิเสธ
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* ── Expense Dialog (Multi-Entry) ── */}
      <Dialog open={showExpenseForm} onOpenChange={setShowExpenseForm}>
        <DialogContent className="max-w-[95vw] sm:max-w-[600px] rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Minus className="h-5 w-5 text-red-500" />
              ลงรายจ่าย
            </DialogTitle>
            <DialogDescription>ลงรายจ่าย — เลือกแนบสลิป (OCR) หรือกรอกเอง</DialogDescription>
          </DialogHeader>

          {/* Mode toggle: scan vs manual */}
          <div className="flex rounded-lg border overflow-hidden">
            <button
              type="button"
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                expenseMode === 'scan'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => setExpenseMode('scan')}
            >
              📷 แนบสลิป (OCR)
            </button>
            <button
              type="button"
              className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                expenseMode === 'manual'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
              onClick={() => setExpenseMode('manual')}
            >
              ✍️ กรอกเอง
            </button>
          </div>

          {/* Hidden file inputs */}
          <input ref={fileInputRef} type="file" accept="image/*,application/pdf" multiple className="hidden" onChange={handleReceiptCapture} />
          <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleReceiptCapture} />

          {/* Scan mode: Add receipt buttons */}
          {expenseMode === 'scan' && (
            <>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => cameraInputRef.current?.click()} disabled={expEntries.length >= 10}>
                  <Camera className="h-4 w-4 mr-1" /> ถ่ายรูป
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()} disabled={expEntries.length >= 10}>
                  <ImageIcon className="h-4 w-4 mr-1" /> เลือกรูป
                </Button>
              </div>
              {expEntries.length === 0 && (
                <p className="text-xs text-muted-foreground">แนบรูปสลิป/ใบเสร็จ — แต่ละรูปจะสร้างเป็น 1 รายการแยก (OCR อัตโนมัติ)</p>
              )}
              <p className="text-[10px] text-muted-foreground">รองรับ: JPG, PNG, PDF • สูงสุด 10 รายการ</p>
            </>
          )}

          {/* Manual mode: Add entry button */}
          {expenseMode === 'manual' && (
            <>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={addManualEntry} disabled={expEntries.length >= 10}>
                  <Plus className="h-4 w-4 mr-1" /> เพิ่มรายการ
                </Button>
              </div>
              {expEntries.length === 0 && (
                <p className="text-xs text-muted-foreground">กด "เพิ่มรายการ" เพื่อกรอกข้อมูลรายจ่ายด้วยตัวเอง (ไม่ต้องแนบรูป)</p>
              )}
              <p className="text-[10px] text-muted-foreground">สูงสุด 10 รายการ • กรอก amount + description เอง</p>
            </>
          )}

          {/* Entry list */}
          <div className="space-y-3 mt-2">
            {expEntries.map((entry, idx) => (
              <div key={entry.id} className="border rounded-lg p-3 relative bg-card">
                {/* Entry header */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="flex items-center gap-1">
                    {/* Split button - only show if entry has multiple images */}
                    {entry.receipts.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-[9px] text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                        onClick={() => splitEntry(entry.id, entry.receipts.length - 1)}
                        title="แยกรูปสุดท้ายออกเป็นรายการใหม่"
                      >
                        <Scissors className="h-3 w-3 mr-0.5" />แยก
                      </Button>
                    )}
                    {/* Merge button - only show if there are 2+ entries */}
                    {expEntries.length > 1 && !mergeMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 px-1.5 text-[9px] text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => setMergeMode(entry.id)}
                        title="รวมเข้ากับรายการอื่น"
                      >
                        <Merge className="h-3 w-3 mr-0.5" />รวม
                      </Button>
                    )}
                    {/* Merge target selection */}
                    {mergeMode && mergeMode !== entry.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-1.5 text-[9px] border-blue-400 text-blue-600 hover:bg-blue-50 animate-pulse"
                        onClick={() => mergeEntries(mergeMode, entry.id)}
                      >
                        รวมมาที่นี่
                      </Button>
                    )}
                    {/* Cancel merge mode */}
                    {mergeMode === entry.id && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-6 px-1.5 text-[9px] border-orange-400 text-orange-600"
                        onClick={() => setMergeMode(null)}
                      >
                        ยกเลิกรวม
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => removeEntry(entry.id)}>
                      ×
                    </Button>
                  </div>
                </div>
                {/* Merge mode instruction */}
                {mergeMode === entry.id && (
                  <div className="mb-2 p-1.5 bg-blue-50 rounded border border-blue-200 text-[9px] text-blue-700">
                    กดปุ่ม "รวมมาที่นี่" บนรายการที่ต้องการรวมเข้าด้วย
                  </div>
                )}

                {/* Receipt thumbnails (multiple images per entry) */}
                <div className="flex gap-2 flex-wrap">
                  {entry.receipts.map((receipt, rIdx) => (
                    <div key={rIdx} className="flex-shrink-0 w-16 h-16 relative group">
                      {receipt.preview === "pdf" ? (
                        <div className="w-full h-full bg-red-50 rounded-lg border flex flex-col items-center justify-center">
                          <Receipt className="h-4 w-4 text-red-500" />
                          <span className="text-[7px] text-red-600 mt-0.5 truncate max-w-full px-0.5">{receipt.fileName || "PDF"}</span>
                        </div>
                      ) : (
                        <img
                          src={receipt.preview}
                          alt={`สลิป ${idx + 1}-${rIdx + 1}`}
                          className="w-full h-full object-cover rounded-lg border cursor-zoom-in"
                          onClick={() => setZoomImage(receipt.preview)}
                        />
                      )}
                      {/* Remove single image from entry */}
                      {entry.receipts.length > 1 && (
                        <button
                          className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeReceiptFromEntry(entry.id, rIdx)}
                        >
                          ×
                        </button>
                      )}
                      {/* Re-OCR button on first image */}
                      {rIdx === 0 && receipt.preview !== "pdf" && !entry.ocrLoading && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute bottom-0.5 right-0.5 h-3.5 px-0.5 text-[7px] opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => triggerOcr(entry.id, receipt.data, receipt.type)}
                        >
                          OCR
                        </Button>
                      )}
                    </div>
                  ))}
                  {/* Image count badge */}
                  {entry.receipts.length > 1 && (
                    <div className="flex items-center">
                      <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{entry.receipts.length} รูป</span>
                    </div>
                  )}
                </div>

                {/* OCR Loading */}
                {entry.ocrLoading && (
                  <div className="p-2 bg-blue-50 rounded border border-blue-200 mt-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                      <span className="text-[10px] font-medium text-blue-700">OCR กำลังอ่าน...</span>
                      <span className="text-[9px] text-blue-500 ml-auto">{Math.min(Math.round(entry.ocrProgress), 100)}%</span>
                    </div>
                    <div className="w-full bg-blue-200 rounded-full h-1.5 overflow-hidden">
                      <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min(entry.ocrProgress, 100)}%` }} />
                    </div>
                  </div>
                )}

                {/* Editable fields */}
                <div className="space-y-1.5 mt-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="จำนวนเงิน *"
                        value={entry.amount}
                        onChange={(e) => updateEntry(entry.id, "amount", e.target.value)}
                        className="h-8 text-sm font-bold"
                      />
                    </div>
                    <Select value={entry.category} onValueChange={(v) => updateEntry(entry.id, "category", v)}>
                      <SelectTrigger className="h-8 text-[11px] w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(c => (
                          <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Input
                    placeholder="รายละเอียด *"
                    value={entry.description}
                    onChange={(e) => updateEntry(entry.id, "description", e.target.value)}
                    className="h-8 text-sm"
                  />
                  <div className="flex gap-2">
                    <DatePickerCE
                      value={entry.date}
                      onChange={(v) => updateEntry(entry.id, "date", v)}
                      placeholder="วันที่"
                      maxDate={new Date()}
                    />
                  </div>
                </div>

                {/* Confidence indicators */}
                {entry.confidence && !entry.ocrLoading && (
                  <div className="mt-1.5 flex flex-wrap gap-x-2 gap-y-0.5">
                    {[
                      { key: "amount", label: "เงิน" },
                      { key: "description", label: "รายละเอียด" },
                      { key: "category", label: "หมวด" },
                    ].map(({ key, label }) => {
                      const score = entry.confidence?.[key] ?? 0;
                      const color = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-yellow-500" : "bg-red-500";
                      return (
                        <div key={key} className="flex items-center gap-0.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${color}`} />
                          <span className="text-[8px] text-muted-foreground">{label}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Total summary */}
          {expEntries.length > 0 && (
            <div className="mt-3 p-3 bg-muted/50 rounded-lg border">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">รวม {expEntries.length} รายการ</span>
                <span className="text-base font-bold text-destructive">
                  ฿{expEntries.reduce((sum, e) => sum + (parseInt(e.amount) || 0), 0).toLocaleString()}
                </span>
              </div>
              <p className="text-[9px] text-muted-foreground mt-1">แต่ละรายการจะบันทึกแยกกัน • สามารถแก้ไขข้อมูลแต่ละรายการได้ก่อนกดบันทึก</p>
            </div>
          )}

          <DialogFooter>
            <Button
              className="w-full"
              disabled={addExpenseMut.isPending || expEntries.length === 0 || expEntries.some(e => e.ocrLoading)}
              onClick={handleSubmitExpense}
            >
              {addExpenseMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Minus className="h-4 w-4 mr-2" />}
              บันทึก {expEntries.length} รายการ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Deposit Dialog ── */}
      <Dialog open={showDepositForm} onOpenChange={setShowDepositForm}>
        <DialogContent className="max-w-[92vw] rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Plus className="h-5 w-5 text-green-600" />
              เติมเงินสดย่อย
            </DialogTitle>
            <DialogDescription>เพิ่มเงินเข้าระบบเบิกจ่ายของสาขา</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">จำนวนเงิน (บาท) *</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={depAmount}
                onChange={(e) => setDepAmount(e.target.value)}
                className="text-lg font-bold mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">รายละเอียด *</Label>
              <Input
                placeholder="เช่น เติมเงินสดย่อยประจำสัปดาห์"
                value={depDesc}
                onChange={(e) => setDepDesc(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">วิธีโอน</Label>
              <Select value={depMethod} onValueChange={setDepMethod}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSFER_METHODS.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">วันที่</Label>
              <DatePickerCE
                value={depDate}
                onChange={setDepDate}
                placeholder="เลือกวันที่"
                maxDate={new Date()}
              />
            </div>
            <div>
              <Label className="text-sm">หมายเหตุ</Label>
              <Textarea
                placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
                value={depNote}
                onChange={(e) => setDepNote(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={addDepositMut.isPending}
              onClick={handleSubmitDeposit}
            >
              {addDepositMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              เติมเงิน
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Fund Request Dialog ── */}
      <Dialog open={showFundRequest} onOpenChange={setShowFundRequest}>
        <DialogContent className="max-w-[92vw] rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Send className="h-5 w-5 text-primary" />
              ขอเติมเงิน
            </DialogTitle>
            <DialogDescription>ส่งคำขอให้เจ้าของสาขาเติมเงินสดย่อย</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-sm">จำนวนเงินที่ต้องการ (บาท) *</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={reqAmount}
                onChange={(e) => setReqAmount(e.target.value)}
                className="text-lg font-bold mt-1"
              />
            </div>
            <div>
              <Label className="text-sm">เหตุผล *</Label>
              <Textarea
                placeholder="เช่น เงินสดใกล้หมด ต้องซื้อวัตถุดิบเพิ่ม"
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              disabled={requestFundMut.isPending}
              onClick={() => {
                const amount = parseInt(reqAmount);
                if (!amount || amount <= 0) { toast.error("กรุณากรอกจำนวนเงิน"); return; }
                if (!reqReason.trim()) { toast.error("กรุณากรอกเหตุผล"); return; }
                requestFundMut.mutate({ requestedAmount: amount, reason: reqReason.trim() });
              }}
            >
              {requestFundMut.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              ส่งคำขอ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receipt images popup for transaction history */}
      <Dialog open={receiptPopupTxId !== null} onOpenChange={(open) => { if (!open) setReceiptPopupTxId(null); }}>
        <DialogContent className="max-w-[85vw] rounded-xl max-h-[80vh] overflow-y-auto p-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <Eye className="h-4 w-4 text-primary" />
              รูปสลิป/ใบเสร็จ
            </DialogTitle>
          </DialogHeader>
          <ReceiptPopupContent txId={receiptPopupTxId} onZoom={(url) => { setReceiptPopupTxId(null); setZoomImage(url); }} />
        </DialogContent>
      </Dialog>

      {/* Full-screen image zoom overlay */}
      {zoomImage && (
        <div
          className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomImage(null)}
        >
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full w-10 h-10 flex items-center justify-center text-xl hover:bg-black/70 transition-colors"
            onClick={() => setZoomImage(null)}
          >
            ×
          </button>
          <img
            src={zoomImage}
            alt="รูปใบเสร็จขยาย"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
          </PremiumPageContent>
    </MobileLayout>
  );
}
