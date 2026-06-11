import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Store, Plus, Search, Loader2, User, Package, Receipt, Image, X, UserPlus, Users, Smartphone } from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";

export default function InStoreSales() {
  const { session, loading, isAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();

  // Sale form state
  const [showSaleDialog, setShowSaleDialog] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState("1");
  const [unitPrice, setUnitPrice] = useState("");
  const [note, setNote] = useState("");
  const [slipBase64, setSlipBase64] = useState("");
  const [slipFileName, setSlipFileName] = useState("");
  const [slipContentType, setSlipContentType] = useState("");

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCustomerName, setSelectedCustomerName] = useState("");

  // Staff selection (max 3)
  const [selectedStaffIds, setSelectedStaffIds] = useState<number[]>([]);

  // App sale toggle
  const [isAppSale, setIsAppSale] = useState(false);

  // Filter state
  const [filterBranchId, setFilterBranchId] = useState<string>("all");
  const [filterDate, setFilterDate] = useState(new Date().toISOString().slice(0, 10));

  // Quick register customer
  const [showQuickRegDialog, setShowQuickRegDialog] = useState(false);
  const [quickRegPhone, setQuickRegPhone] = useState("");
  const [quickRegName, setQuickRegName] = useState("");
  const [quickRegEmail, setQuickRegEmail] = useState("");

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) { toast.error("ไม่มีสิทธิ์เข้าถึง"); setLocation("/admin"); }
  }, [loading, session, isAdmin, setLocation]);

  const utils = trpc.useUtils();
  const { data: branches } = trpc.branches.listAll.useQuery(undefined, { enabled: !!session && isAdmin });

  // Get selected branch's commission mode
  const selectedBranch = useMemo(() => {
    if (!selectedBranchId || !branches) return null;
    return branches.find((b: any) => b.id === Number(selectedBranchId));
  }, [selectedBranchId, branches]);
  const commissionMode = (selectedBranch as any)?.commissionMode || "product";
  const { data: products } = trpc.shopProducts.listAll.useQuery(undefined, { enabled: !!session && isAdmin });
  const { data: staffList } = trpc.staff.list.useQuery(
    selectedBranchId ? { branchId: Number(selectedBranchId) } : undefined,
    { enabled: !!session && isAdmin && !!selectedBranchId }
  );

  const { data: salesData, isLoading: salesLoading } = trpc.inStoreSales.list.useQuery(
    {
      branchId: filterBranchId !== "all" ? Number(filterBranchId) : undefined,
      startDate: filterDate,
      endDate: filterDate,
      limit: 50,
    },
    { enabled: !!session && isAdmin }
  );

  // Customer lookup
  const cleanPhone = customerSearch.replace(/\D/g, "");
  const { data: customerResult } = trpc.loyalty.lookupCustomer.useQuery(
    { phone: cleanPhone },
    { enabled: !!session && isAdmin && cleanPhone.length >= 9 }
  );

  const selectedProduct = useMemo(() => {
    if (!selectedProductId || !products) return null;
    return products.products?.find((p: any) => p.id === Number(selectedProductId));
  }, [selectedProductId, products]);

  // Auto-fill price when product selected
  useEffect(() => {
    if (selectedProduct) {
      setUnitPrice(String(selectedProduct.retailPrice / 100));
    }
  }, [selectedProduct]);

  const totalAmount = useMemo(() => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    return qty * price;
  }, [quantity, unitPrice]);

  // Cost info from product
  const costInfo = useMemo(() => {
    if (!selectedProduct) return null;
    const costPrice = (selectedProduct as any).costPrice ?? 0;
    if (costPrice === 0) return null;
    const qty = Number(quantity) || 0;
    const totalCostSatang = costPrice * qty;
    const totalCostBaht = totalCostSatang / 100;
    const profit = totalAmount - totalCostBaht;
    return { costPerUnit: costPrice / 100, totalCost: totalCostBaht, profit };
  }, [selectedProduct, quantity, totalAmount]);

  // Commission info based on branch mode
  const commissionInfo = useMemo(() => {
    // App sales = no commission
    if (isAppSale) return null;
    if (commissionMode === "product") {
      // Mode A: commission from product settings
      if (!selectedProduct) return null;
      const commType = selectedProduct.commissionType;
      const commValue = selectedProduct.commissionValue ?? 0;
      if (!commType || commValue === 0) return null;
      if (commType === "percent") {
        const totalSatang = totalAmount * 100;
        return { mode: "product" as const, type: "percent", value: commValue, total: Math.floor(totalSatang * commValue / 10000) / 100 };
      } else {
        return { mode: "product" as const, type: "fixed", value: commValue / 100, total: (commValue / 100) * (Number(quantity) || 0) };
      }
    } else {
      // Mode B: commission from staff settings - show per-staff rates
      if (selectedStaffIds.length === 0 || !staffList) return null;
      const staffCommissions = selectedStaffIds.map(sid => {
        const staff = staffList.find((s: any) => s.id === sid);
        const commType = (staff as any)?.commissionType || null;
        const commValue = (staff as any)?.commissionValue || 0;
        if (!commType || commValue === 0) return { staffId: sid, staffName: staff?.name || "", amount: 0 };
        let amount = 0;
        if (commType === "percent") {
          amount = Math.floor(totalAmount * 100 * commValue / 10000) / 100;
        } else {
          amount = (commValue / 100) * (Number(quantity) || 0);
        }
        return { staffId: sid, staffName: staff?.name || "", amount, commType, commValue };
      });
      const totalComm = staffCommissions.reduce((sum, sc) => sum + sc.amount, 0);
      return { mode: "staff" as const, staffCommissions, total: totalComm };
    }
  }, [isAppSale, commissionMode, selectedProduct, totalAmount, quantity, selectedStaffIds, staffList]);

  const createSaleMutation = trpc.inStoreSales.create.useMutation({
    onSuccess: (data) => {
      toast.success(`บันทึกยอดขายสำเร็จ! แต้มที่ได้: ${data.pointsAwarded}`);
      utils.inStoreSales.list.invalidate();
      closeSaleDialog();
    },
    onError: (err) => toast.error(err.message),
  });

  const uploadSlipMutation = trpc.inStoreSales.uploadSlip.useMutation();

  const quickRegisterMutation = trpc.inStoreSales.quickRegisterCustomer.useMutation({
    onSuccess: (data) => {
      if (data.isExisting) {
        toast.info(`ลูกค้ามีอยู่แล้ว: ${data.customerName}`);
      } else {
        toast.success(`สมัครสมาชิกสำเร็จ! รหัสผ่านชั่วคราว: ${data.tempPassword}`);
      }
      // Auto-select the customer
      setSelectedCustomerId(data.customerId);
      setSelectedCustomerName(`${data.customerName} (${data.customerPhone})`);
      setShowQuickRegDialog(false);
      setQuickRegName(""); setQuickRegEmail("");
    },
    onError: (err) => toast.error(err.message),
  });

  const closeSaleDialog = () => {
    setShowSaleDialog(false);
    setSelectedBranchId(""); setSelectedProductId("");
    setQuantity("1"); setUnitPrice(""); setNote("");
    setSlipBase64(""); setSlipFileName(""); setSlipContentType("");
    setCustomerSearch(""); setSelectedCustomerId(null); setSelectedCustomerName("");
    setSelectedStaffIds([]); setIsAppSale(false);
  };

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ใหญ่เกิน 5MB"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      setSlipBase64(base64);
      setSlipFileName(file.name);
      setSlipContentType(file.type);
    };
    reader.readAsDataURL(file);
  }, []);

  const selectCustomer = (c: any) => {
    setSelectedCustomerId(c.id);
    setSelectedCustomerName(`${c.name} (${c.phone})`);
  };

  const toggleStaff = (staffId: number) => {
    setSelectedStaffIds(prev => {
      if (prev.includes(staffId)) return prev.filter(id => id !== staffId);
      // Mode product: max 3 staff, Mode staff: unlimited
      if (commissionMode === "product" && prev.length >= 3) { toast.error("โหมดตามสินค้า: เลือกพนักงานได้สูงสุด 3 คน"); return prev; }
      return [...prev, staffId];
    });
  };

  const handleSubmitSale = async () => {
    if (!selectedBranchId) { toast.error("กรุณาเลือกสาขา"); return; }
    if (!selectedProductId) { toast.error("กรุณาเลือกสินค้า"); return; }
    if (!selectedCustomerId) { toast.error("กรุณาเลือกลูกค้า"); return; }
    if (selectedStaffIds.length === 0) { toast.error("กรุณาเลือกพนักงานผู้ขายอย่างน้อย 1 คน"); return; }
    if (!unitPrice || Number(unitPrice) <= 0) { toast.error("กรุณากรอกราคา"); return; }

    let paymentSlipUrl: string | undefined;
    if (slipBase64) {
      try {
        const result = await uploadSlipMutation.mutateAsync({
          fileName: slipFileName,
          base64: slipBase64,
          contentType: slipContentType,
        });
        paymentSlipUrl = result.url;
      } catch {
        toast.error("อัปโหลดสลิปไม่สำเร็จ");
        return;
      }
    }

    createSaleMutation.mutate({
      branchId: Number(selectedBranchId),
      customerId: selectedCustomerId,
      productId: Number(selectedProductId),
      quantity: Number(quantity),
      unitPrice: Math.round(Number(unitPrice) * 100), // convert to satang
      paymentSlipUrl,
      staffIds: selectedStaffIds,
      saleDate: filterDate,
      note: note || undefined,
      isAppSale,
    });
  };

  if (loading || !session) return null;

  return (
    <AdminPageWrapper title="ขายสินค้าหน้าร้าน" backPath="/admin" loading={salesLoading}>
      <div className="space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={filterBranchId} onValueChange={setFilterBranchId}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="ทุกสาขา" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกสาขา</SelectItem>
              {branches?.map((b: any) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-36"
          />
        </div>

        <Button className="w-full" onClick={() => setShowSaleDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          ลงยอดขายสินค้าหน้าร้าน
        </Button>

        {/* Daily Summary */}
        {(salesData?.sales?.length ?? 0) > 0 && salesData && (
          <Card className="border-0 shadow-sm bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">สรุปยอดขายวันนี้</p>
              {(() => {
                const sales = salesData.sales as any[];
                const totalAmt = sales.reduce((s, r) => s + (r.totalAmount || 0), 0);
                const totalCost = sales.reduce((s, r) => s + (r.totalCost || 0), 0);
                const totalComm = sales.reduce((s, r) => s + (r.totalCommission || 0), 0);
                const profit = totalAmt - totalCost;
                const hasAppSales = sales.some(s => s.isAppSale === 1);
                const appAmt = sales.filter(s => s.isAppSale === 1).reduce((sum, s) => sum + (s.totalAmount || 0), 0);
                const walkInAmt = sales.filter(s => s.isAppSale !== 1).reduce((sum, s) => sum + (s.totalAmount || 0), 0);
                return (
                  <>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-muted-foreground">ยอดขายรวม</p>
                        <p className="font-bold text-sm text-primary">฿{(totalAmt / 100).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">ต้นทุนรวม</p>
                        <p className="font-bold text-sm text-red-500">฿{(totalCost / 100).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">กำไรรวม</p>
                        <p className={`font-bold text-sm ${profit >= 0 ? "text-green-600" : "text-red-600"}`}>฿{(profit / 100).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">คอมรวม</p>
                        <p className="font-bold text-sm text-amber-600">฿{(totalComm / 100).toLocaleString()}</p>
                      </div>
                    </div>
                    {hasAppSales && (
                      <div className="mt-2 pt-2 border-t border-primary/10 flex gap-4 text-[11px]">
                        <span className="text-blue-600">ผ่านแอพ: ฿{(appAmt / 100).toLocaleString()}</span>
                        <span className="text-muted-foreground">หน้าร้าน: ฿{(walkInAmt / 100).toLocaleString()}</span>
                      </div>
                    )}
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Sales list */}
        {salesLoading ? (
          <div className="text-center py-12 text-muted-foreground">กำลังโหลด...</div>
        ) : !salesData?.sales?.length ? (
          <div className="text-center py-12">
            <Store className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">ยังไม่มียอดขายสินค้าหน้าร้านวันนี้</p>
          </div>
        ) : (
          salesData.sales.map((sale: any) => (
            <Card key={sale.id} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm">{sale.productName || `สินค้า #${sale.productId}`}</p>
                      {sale.isAppSale === 1 && (
                        <Badge className="text-[9px] bg-blue-100 text-blue-700 border-blue-200 px-1.5 py-0">
                          <Smartphone className="h-2.5 w-2.5 mr-0.5" />
                          ผ่านแอพ
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ลูกค้า: {sale.customerName || sale.customerId} • จำนวน: {sale.quantity}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      สาขา: {sale.branchName || sale.branchId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-primary">฿{((sale.totalAmount || 0) / 100).toLocaleString()}</p>
                    {sale.totalCost > 0 && (
                      <p className="text-[10px] text-muted-foreground">
                        ต้นทุน ฿{(sale.totalCost / 100).toLocaleString()} • <span className={(sale.totalAmount - sale.totalCost) >= 0 ? "text-green-600" : "text-red-600"}>กำไร ฿{((sale.totalAmount - sale.totalCost) / 100).toLocaleString()}</span>
                      </p>
                    )}
                    {sale.totalCommission > 0 && (
                      <Badge variant="outline" className="text-[10px] mt-1">
                        คอม ฿{(sale.totalCommission / 100).toLocaleString()}
                      </Badge>
                    )}
                    {sale.isAppSale === 1 && sale.totalCommission === 0 && (
                      <Badge variant="outline" className="text-[10px] mt-1 text-blue-600 border-blue-200">
                        ไม่คิดคอม
                      </Badge>
                    )}
                    {sale.pointsAwarded > 0 && (
                      <p className="text-[10px] text-amber-600 mt-0.5">+{sale.pointsAwarded} แต้ม</p>
                    )}
                  </div>
                </div>
                {sale.paymentSlipUrl && (
                  <div className="mt-2">
                    <Badge variant="secondary" className="text-[10px]">
                      <Image className="h-3 w-3 mr-1" />
                      มีสลิปแนบ
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Sale Dialog */}
      <Dialog open={showSaleDialog} onOpenChange={setShowSaleDialog}>
        <DialogContent className="max-w-[95vw] rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>ลงยอดขายสินค้าหน้าร้าน</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* App Sale Toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50/50">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">ลูกค้าซื้อผ่านแอพ</p>
                  <p className="text-[10px] text-blue-600">ยอดร้าน ไม่คิดคอมมิชชั่น</p>
                </div>
              </div>
              <Switch checked={isAppSale} onCheckedChange={setIsAppSale} />
            </div>
            {isAppSale && (
              <div className="p-2 rounded-lg bg-blue-100 border border-blue-300">
                <p className="text-xs text-blue-800 font-medium">โหมดยอดร้าน: ไม่คิดคอมมิชชั่น ยอดขายนับเป็นยอดร้าน</p>
              </div>
            )}

            {/* Branch */}
            <div className="space-y-2">
              <Label>สาขา <span className="text-destructive">*</span></Label>
              <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสาขา" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.filter((b: any) => b.isActive).map((b: any) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Customer search */}
            <div className="space-y-2">
              <Label>ลูกค้า <span className="text-destructive">*</span></Label>
              {selectedCustomerId ? (
                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm flex-1">{selectedCustomerName}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSelectedCustomerId(null); setSelectedCustomerName(""); setCustomerSearch(""); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="ค้นหาเบอร์โทรลูกค้า..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  {customerResult && (
                    <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => selectCustomer(customerResult)}>
                      <CardContent className="p-3 flex items-center gap-3">
                        <User className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{customerResult.name}</p>
                          <p className="text-xs text-muted-foreground">{customerResult.phone} • แต้ม: {customerResult.availablePoints}</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  {cleanPhone.length >= 9 && !customerResult && (
                    <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <UserPlus className="h-4 w-4 text-amber-600 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-amber-700 font-medium">ไม่พบลูกค้า</p>
                        <p className="text-[10px] text-amber-600">สมัครสมาชิกใหม่ให้ลูกค้าได้เลย</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs border-amber-300 text-amber-700 hover:bg-amber-100" onClick={() => { setQuickRegPhone(cleanPhone); setShowQuickRegDialog(true); }}>
                        <UserPlus className="h-3 w-3 mr-1" />
                        สมัคร
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Product */}
            <div className="space-y-2">
              <Label>สินค้า <span className="text-destructive">*</span></Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="เลือกสินค้า" />
                </SelectTrigger>
                <SelectContent>
                  {products?.products?.filter((p: any) => p.isActive).map((p: any) => (
                    <SelectItem key={p.id} value={String(p.id)}>
                      {p.name} — ฿{(p.retailPrice / 100).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {commissionMode === "product" && selectedProduct && selectedProduct.commissionType && (
                <p className="text-xs text-amber-600">
                  คอมมิชชั่นสินค้า: {selectedProduct.commissionType === "percent"
                    ? `${((selectedProduct.commissionValue ?? 0) / 100).toFixed(2)}%`
                    : `฿${((selectedProduct.commissionValue ?? 0) / 100).toLocaleString()} ต่อชิ้น`}
                </p>
              )}
              {commissionMode === "staff" && (
                <p className="text-[11px] text-blue-600">โหมดคอมมิชชั่น: ตามพนักงาน (ดูคอมที่ส่วนพนักงานด้านล่าง)</p>
              )}
            </div>

            {/* Quantity & Price */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>จำนวน</Label>
                <Input type="number" min="1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>ราคาต่อชิ้น (บาท)</Label>
                <Input type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} />
              </div>
            </div>

            {/* Total */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between text-sm">
                <span>ยอดรวม</span>
                <span className="font-bold text-primary">฿{totalAmount.toLocaleString()}</span>
              </div>
              {commissionInfo && commissionInfo.mode === "product" && (
                <div className="flex justify-between text-xs text-amber-600 mt-1">
                  <span>คอมมิชชั่นรวม ({commissionInfo.type === "percent" ? `${(commissionInfo.value / 100).toFixed(2)}%` : `฿${commissionInfo.value}/ชิ้น`})</span>
                  <span>฿{commissionInfo.total.toLocaleString()}</span>
                </div>
              )}
              {commissionInfo && commissionInfo.mode === "product" && selectedStaffIds.length > 1 && (
                <div className="flex justify-between text-xs text-muted-foreground mt-0.5">
                  <span>คอมต่อคน ({selectedStaffIds.length} คน หารเท่า)</span>
                  <span>฿{(commissionInfo.total / selectedStaffIds.length).toFixed(2)}</span>
                </div>
              )}
              {commissionInfo && commissionInfo.mode === "staff" && commissionInfo.staffCommissions && (
                <div className="mt-1 space-y-0.5">
                  <p className="text-xs text-amber-600 font-medium">คอมมิชชั่น (โหมดตามพนักงาน):</p>
                  {commissionInfo.staffCommissions.map((sc: any) => (
                    <div key={sc.staffId} className="flex justify-between text-[11px] text-amber-600">
                      <span>{sc.staffName} {sc.commType === "percent" ? `(${(sc.commValue / 100).toFixed(2)}%)` : sc.commType === "fixed" ? `(฿${(sc.commValue / 100).toFixed(0)}/ชิ้น)` : "(ไม่มีคอม)"}</span>
                      <span>฿{sc.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs text-amber-700 font-medium border-t border-amber-200 pt-0.5">
                    <span>รวมคอมมิชชั่น</span>
                    <span>฿{commissionInfo.total.toLocaleString()}</span>
                  </div>
                </div>
              )}
              {costInfo && (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground mt-1 border-t border-border/50 pt-1">
                    <span>ต้นทุน (ต่อชิ้น ฿{costInfo.costPerUnit.toLocaleString()} × {quantity})</span>
                    <span className="text-red-500">฿{costInfo.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium mt-0.5">
                    <span>กำไร</span>
                    <span className={costInfo.profit >= 0 ? "text-green-600" : "text-red-600"}>฿{costInfo.profit.toLocaleString()}</span>
                  </div>
                </>
              )}
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>แต้มที่ลูกค้าจะได้</span>
                <span>{Math.floor(totalAmount / 10)} แต้ม</span>
              </div>
            </div>

            {/* Staff selection */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                พนักงานผู้ขาย <span className="text-destructive">*</span>
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {selectedStaffIds.length}/{commissionMode === "product" ? "3" : "∞"}
                </Badge>
              </Label>
              {commissionMode === "staff" && (
                <p className="text-[10px] text-blue-600 -mt-1">โหมดคอมตามพนักงาน — คอมคำนวณแยกตามอัตราของแต่ละคน</p>
              )}
              {!selectedBranchId ? (
                <p className="text-xs text-muted-foreground">เลือกสาขาก่อนเพื่อแสดงรายชื่อพนักงาน</p>
              ) : (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {staffList?.map((s: any) => {
                    const isSelected = selectedStaffIds.includes(s.id);
                    return (
                      <Card
                        key={s.id}
                        className={`cursor-pointer transition-all border ${isSelected ? "border-primary bg-primary/5" : "border-border"}`}
                        onClick={() => toggleStaff(s.id)}
                      >
                        <CardContent className="p-2.5 flex items-center gap-2">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? "border-primary bg-primary" : "border-muted-foreground/30"}`}>
                            {isSelected && <span className="text-white text-[10px]">✓</span>}
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-medium">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">{s.role}</p>
                          </div>
                          {commissionMode === "staff" && (s as any).commissionType && (
                            <Badge variant="outline" className="text-[9px] shrink-0">
                              {(s as any).commissionType === "percent"
                                ? `${((s as any).commissionValue / 100).toFixed(2)}%`
                                : `฿${((s as any).commissionValue / 100).toFixed(0)}/ชิ้น`}
                            </Badge>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment slip */}
            <div className="space-y-2">
              <Label>สลิปการโอนเงิน</Label>
              {slipBase64 ? (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <Image className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700 flex-1 truncate">{slipFileName}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setSlipBase64(""); setSlipFileName(""); }}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <Input type="file" accept="image/*" onChange={handleFileChange} />
              )}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label>หมายเหตุ</Label>
              <Textarea placeholder="หมายเหตุเพิ่มเติม..." value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={closeSaleDialog}>ยกเลิก</Button>
            <Button onClick={handleSubmitSale} disabled={createSaleMutation.isPending || uploadSlipMutation.isPending}>
              {(createSaleMutation.isPending || uploadSlipMutation.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              บันทึกยอดขาย
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Register Customer Dialog */}
      <Dialog open={showQuickRegDialog} onOpenChange={setShowQuickRegDialog}>
        <DialogContent className="max-w-[90vw] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              สมัครสมาชิกใหม่
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>เบอร์โทร <span className="text-destructive">*</span></Label>
              <Input
                value={quickRegPhone}
                onChange={(e) => setQuickRegPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="0812345678"
                maxLength={15}
              />
            </div>
            <div className="space-y-2">
              <Label>ชื่อลูกค้า <span className="text-destructive">*</span></Label>
              <Input
                value={quickRegName}
                onChange={(e) => setQuickRegName(e.target.value)}
                placeholder="ชื่อ-นามสกุล"
              />
            </div>
            <div className="space-y-2">
              <Label>อีเมล (ไม่บังคับ)</Label>
              <Input
                type="email"
                value={quickRegEmail}
                onChange={(e) => setQuickRegEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
              <p className="text-xs text-blue-700">ระบบจะสร้างรหัสผ่านชั่วคราวให้ลูกค้า ลูกค้าสามารถเปลี่ยนรหัสผ่านภายหลังได้</p>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setShowQuickRegDialog(false)}>ยกเลิก</Button>
            <Button
              onClick={() => quickRegisterMutation.mutate({
                phone: quickRegPhone,
                name: quickRegName,
                email: quickRegEmail || undefined,
              })}
              disabled={quickRegisterMutation.isPending || !quickRegPhone || !quickRegName}
            >
              {quickRegisterMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              สมัครสมาชิก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminPageWrapper>
  );
}
