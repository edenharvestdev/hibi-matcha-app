import MobileLayout from "@/components/MobileLayout";
import PremiumPageContent from "@/components/PremiumPageContent";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useEffect, useState, useRef } from "react";
import { Loader2, AlertTriangle, Phone, CheckCircle2, Clock, XCircle, ArrowUpRight, Camera, X, Image as ImageIcon, Plus } from "lucide-react";
import ImageLightbox from "@/components/ImageLightbox";
import { formatDateTime } from "@/lib/dateUtils";

const MAX_IMAGES = 5;

const CATEGORY_LABELS: Record<string, string> = {
  wrong_order: "ออเดอร์ผิด",
  missing_item: "ของขาด/ไม่ครบ",
  quality: "คุณภาพไม่ดี",
  late_delivery: "จัดส่งล่าช้า",
  damaged: "สินค้าเสียหาย",
  other: "อื่นๆ",
};

const APP_LABELS: Record<string, string> = {
  shopee: "Shopee Food",
  lineman: "LINE MAN",
  grab: "Grab Food",
  gpos: "GPOS (หน้าร้าน)",
  walk_in: "หน้าร้าน (ไม่มีบิล)",
};

const ORDER_ID_LABELS: Record<string, string> = {
  shopee: "เลขออเดอร์ Shopee",
  grab: "เลขออเดอร์ Grab",
  lineman: "เลขออเดอร์ LINE MAN",
  gpos: "เลขที่ใบเสร็จ GPOS",
  walk_in: "",
};

const ORDER_ID_HINTS: Record<string, string> = {
  shopee: "ตัวเลข 13-19 หลัก เช่น 2966366660490752985",
  grab: "ขึ้นต้น A- เช่น A-9WERMBQGW4SJAV",
  lineman: "รูปแบบ LMF-YYMMDD-XXXXXXXXX เช่น LMF-260218-234745909",
  gpos: "เลขที่ใบเสร็จ 13 หลัก เช่น 0105536123457",
  walk_in: "",
};

const STATUS_CONFIG: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  open: { label: "รอตรวจสอบ", icon: Clock, color: "text-amber-500 bg-amber-50" },
  acknowledged: { label: "รับทราบแล้ว", icon: CheckCircle2, color: "text-blue-500 bg-blue-50" },
  in_progress: { label: "กำลังดำเนินการ", icon: ArrowUpRight, color: "text-indigo-500 bg-indigo-50" },
  resolved: { label: "แก้ไขแล้ว", icon: CheckCircle2, color: "text-green-500 bg-green-50" },
  escalated: { label: "ส่งต่อ Super Admin", icon: AlertTriangle, color: "text-orange-500 bg-orange-50" },
  closed: { label: "ปิดแล้ว", icon: XCircle, color: "text-gray-500 bg-gray-50" },
};

interface ImageItem {
  preview: string;
  base64: string;
  type: string;
}

export default function ReportIssue() {
  const { session, loading, isCustomer } = useHibiAuth();
  const [, setLocation] = useLocation();

  const [branchId, setBranchId] = useState<string>("");
  const [deliveryApp, setDeliveryApp] = useState<string>("");
  const [orderId, setOrderId] = useState("");
  const [orderDetails, setOrderDetails] = useState("");
  const [category, setCategory] = useState<string>("");
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(true);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const openLightbox = (imgs: string[], idx: number) => {
    setLightboxImages(imgs);
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  // Multi-image upload state
  const [images, setImages] = useState<ImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isCustomer) setLocation("/branch");
  }, [loading, session, isCustomer, setLocation]);

  const { data: branches } = trpc.branches.list.useQuery(undefined, { enabled: !!session });
  const { data: myIssues, refetch } = trpc.orderIssues.myIssues.useQuery(undefined, { enabled: !!session && isCustomer });
  const submitMutation = trpc.orderIssues.submit.useMutation({
    onSuccess: () => {
      toast.success("แจ้งปัญหาเรียบร้อยแล้ว! ระบบได้ส่งเรื่องไปยังสาขาที่เกี่ยวข้องแล้ว สาขาจะตรวจสอบและตอบกลับภายใน 24 ชั่วโมง หากเป็นปัญหาเร่งด่วน ทางร้านจะออกโค้ดชดเชยให้คุณค่ะ");
      setBranchId(""); setDeliveryApp(""); setOrderId(""); setOrderDetails(""); setCategory(""); setDescription("");
      setImages([]);
      setShowForm(false);
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const selectedBranch = branches?.find(b => String(b.id) === branchId);

  // Check if order ID is required for this delivery app
  const isOrderIdRequired = deliveryApp && deliveryApp !== "walk_in";

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) {
      toast.error(`แนบรูปได้สูงสุด ${MAX_IMAGES} รูป`);
      return;
    }

    const filesToProcess = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      toast.info(`เลือกได้อีก ${remaining} รูป (สูงสุด ${MAX_IMAGES} รูป)`);
    }

    filesToProcess.forEach(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} ใหญ่เกิน 5MB — ข้ามไฟล์นี้`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} ไม่ใช่ไฟล์รูปภาพ — ข้ามไฟล์นี้`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target?.result as string;
        const base64 = dataUrl.split(",")[1];
        setImages(prev => {
          if (prev.length >= MAX_IMAGES) return prev;
          return [...prev, { preview: dataUrl, base64, type: file.type }];
        });
      };
      reader.readAsDataURL(file);
    });

    // Reset input so same file can be selected again
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!branchId || !deliveryApp || !category || !description) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    // Validate order ID required for non-walk_in
    if (isOrderIdRequired && !orderId.trim()) {
      toast.error("กรุณากรอกเลขออเดอร์");
      return;
    }
    submitMutation.mutate({
      branchId: parseInt(branchId),
      deliveryApp: deliveryApp as any,
      orderId: orderId || undefined,
      orderDetails: orderDetails || undefined,
      category: category as any,
      description,
      images: images.length > 0
        ? images.map(img => ({ base64: img.base64, type: img.type }))
        : undefined,
    });
  };

  if (loading || !session) return null;

  return (
    <MobileLayout title="แจ้งปัญหาออเดอร์" showBack backPath="/customer">
      <PremiumPageContent>
        {/* Toggle */}
        <div className="flex gap-2">
          <Button variant={showForm ? "default" : "outline"} size="sm" onClick={() => setShowForm(true)} className="flex-1 text-xs">
            แจ้งปัญหาใหม่
          </Button>
          <Button variant={!showForm ? "default" : "outline"} size="sm" onClick={() => setShowForm(false)} className="flex-1 text-xs">
            ปัญหาของฉัน ({myIssues?.length ?? 0})
          </Button>
        </div>

        {showForm ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5 space-y-4">
              {/* Branch selection */}
              <div>
                <Label className="text-xs font-medium mb-1.5 block">เลือกสาขา *</Label>
                <Select value={branchId} onValueChange={setBranchId}>
                  <SelectTrigger><SelectValue placeholder="เลือกสาขาที่สั่ง" /></SelectTrigger>
                  <SelectContent>
                    {branches?.filter(b => b.isActive).map(b => (
                      <SelectItem key={b.id} value={String(b.id)}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Branch phone - urgent contact */}
              {selectedBranch && (selectedBranch as any).phone && (
                <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <Phone className="h-5 w-5 text-amber-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-amber-800">กรณีเร่งด่วน โทรตรงสาขา</p>
                    <a href={`tel:${(selectedBranch as any).phone}`} className="text-sm font-bold text-amber-700 hover:underline">
                      {(selectedBranch as any).phone}
                    </a>
                  </div>
                </div>
              )}

              {/* Delivery App */}
              <div>
                <Label className="text-xs font-medium mb-1.5 block">ช่องทางสั่งซื้อ *</Label>
                <Select value={deliveryApp} onValueChange={(v) => { setDeliveryApp(v); setOrderId(""); }}>
                  <SelectTrigger><SelectValue placeholder="เลือกช่องทาง" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpos">GPOS (หน้าร้าน)</SelectItem>
                    <SelectItem value="shopee">Shopee Food</SelectItem>
                    <SelectItem value="lineman">LINE MAN</SelectItem>
                    <SelectItem value="grab">Grab Food</SelectItem>
                    <SelectItem value="walk_in">หน้าร้าน (ไม่มีบิล)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Order ID — show for all except walk_in, required */}
              {deliveryApp && deliveryApp !== "walk_in" && (
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">
                    {ORDER_ID_LABELS[deliveryApp] || "หมายเลขออเดอร์"} <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder={ORDER_ID_HINTS[deliveryApp] || "หมายเลขออเดอร์"}
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {ORDER_ID_HINTS[deliveryApp]}
                  </p>
                </div>
              )}

              {/* Order Details — show for ALL channels including walk_in */}
              {deliveryApp && (
                <div>
                  <Label className="text-xs font-medium mb-1.5 block">
                    รายละเอียดคำสั่งซื้อ <span className="text-destructive">*</span>
                  </Label>
                  <Textarea
                    value={orderDetails}
                    onChange={(e) => setOrderDetails(e.target.value)}
                    placeholder="สั่งอะไรบ้าง เช่น Matcha Latte หวานน้อย เย็น 1 แก้ว, Hojicha ร้อน 1 แก้ว"
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    ระบุรายการที่สั่งทั้งหมด เพื่อให้สาขาตรวจสอบได้ง่าย
                  </p>
                </div>
              )}

              {/* Category */}
              <div>
                <Label className="text-xs font-medium mb-1.5 block">ประเภทปัญหา *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="เลือกประเภทปัญหา" /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div>
                <Label className="text-xs font-medium mb-1.5 block">รายละเอียดปัญหา *</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="อธิบายปัญหาที่พบ เช่น สั่ง Matcha Latte แต่ได้ Hojicha, ของขาด 1 รายการ"
                  rows={4}
                  className="resize-none"
                />
              </div>

              {/* Multi-Image Upload */}
              <div>
                <Label className="text-xs font-medium mb-1.5 block">
                  แนบรูปภาพหลักฐาน
                  <span className="text-muted-foreground font-normal ml-1">({images.length}/{MAX_IMAGES})</span>
                </Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {images.length > 0 ? (
                  <div className="space-y-3">
                    {/* Image grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {images.map((img, idx) => (
                        <div key={idx} className="relative group aspect-square">
                          <img
                            src={img.preview}
                            alt={`หลักฐาน ${idx + 1}`}
                            className="w-full h-full object-cover rounded-xl border border-border"
                          />
                          <button
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-80 group-hover:opacity-100"
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full">
                            {idx + 1}
                          </div>
                        </div>
                      ))}

                      {/* Add more button */}
                      {images.length < MAX_IMAGES && (
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="aspect-square border-2 border-dashed border-muted-foreground/25 rounded-xl flex flex-col items-center justify-center gap-1 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                        >
                          <Plus className="h-5 w-5 text-muted-foreground/40" />
                          <span className="text-[9px] text-muted-foreground">เพิ่มรูป</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center">
                      แนบได้สูงสุด {MAX_IMAGES} รูป (ไฟล์ละไม่เกิน 5MB)
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-28 border-2 border-dashed border-muted-foreground/25 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-colors"
                  >
                    <Camera className="h-7 w-7 text-muted-foreground/40" />
                    <span className="text-xs text-muted-foreground">ถ่ายรูปหรือเลือกจากอัลบั้ม (สูงสุด {MAX_IMAGES} รูป)</span>
                    <span className="text-[10px] text-muted-foreground/60">ไฟล์ละไม่เกิน 5MB (jpg, png)</span>
                  </button>
                )}
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending || !branchId || !deliveryApp || !category || !description || (!!isOrderIdRequired && !orderId.trim())}
                className="w-full"
              >
                {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <AlertTriangle className="h-4 w-4 mr-2" />}
                แจ้งปัญหา
              </Button>

              <div className="p-3 bg-blue-50 rounded-lg text-center space-y-1">
                <p className="text-[11px] text-blue-700 font-medium">
                  สาขาจะตอบรับภายใน 24 ชั่วโมง และแก้ไขภายใน 48 ชั่วโมง
                </p>
                <p className="text-[10px] text-blue-600">
                  หากเป็นปัญหาเร่งด่วน ทางร้านจะออกโค้ดชดเชยให้คุณเพื่อนำไปรับเมนูใหม่ได้ทันที
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {!myIssues?.length ? (
              <Card className="border-0 shadow-sm">
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">ยังไม่มีปัญหาที่แจ้ง</p>
                </CardContent>
              </Card>
            ) : (
              myIssues.map((issue: any) => {
                const statusCfg = STATUS_CONFIG[issue.status] || STATUS_CONFIG.open;
                const StatusIcon = statusCfg.icon;
                const issueImages: string[] = issue.images || (issue.imageUrl ? [issue.imageUrl] : []);
                return (
                  <Card key={issue.id} className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium">{CATEGORY_LABELS[issue.category] || issue.category}</p>
                          <p className="text-xs text-muted-foreground">
                            {APP_LABELS[issue.deliveryApp] || issue.deliveryApp}
                            {issue.orderId && ` #${issue.orderId}`}
                          </p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${statusCfg.color}`}>
                          <StatusIcon className="h-3 w-3" />
                          {statusCfg.label}
                        </span>
                      </div>
                      {/* Order details */}
                      {issue.orderDetails && (
                        <div className="mb-2 p-2 bg-muted/30 rounded-lg">
                          <p className="text-[10px] text-muted-foreground font-medium mb-0.5">รายการที่สั่ง</p>
                          <p className="text-xs">{issue.orderDetails}</p>
                        </div>
                      )}
                      {/* Show attached images */}
                      {issueImages.length > 0 && (
                        <div className="mb-2">
                          {issueImages.length === 1 ? (
                            <img
                              src={issueImages[0]}
                              alt="หลักฐาน"
                              className="w-full h-32 object-cover rounded-lg border border-border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => openLightbox(issueImages, 0)}
                            />
                          ) : (
                            <div className="grid grid-cols-3 gap-1.5">
                              {issueImages.slice(0, 3).map((url, idx) => (
                                <div key={idx} className="relative aspect-square cursor-pointer" onClick={() => openLightbox(issueImages, idx)}>
                                  <img
                                    src={url}
                                    alt={`หลักฐาน ${idx + 1}`}
                                    className="w-full h-full object-cover rounded-lg border border-border hover:opacity-90 transition-opacity"
                                  />
                                  {idx === 2 && issueImages.length > 3 && (
                                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                                      <span className="text-white text-sm font-bold">+{issueImages.length - 3}</span>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground line-clamp-2">{issue.description}</p>
                      {issue.adminNote && (
                        <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                          <p className="text-xs text-blue-700"><span className="font-medium">ข้อความจากทางร้าน:</span> {issue.adminNote}</p>
                        </div>
                      )}
                      {issue.resolution && (
                        <div className="mt-2 p-2 bg-green-50 rounded-lg">
                          <p className="text-xs text-green-700"><span className="font-medium">การแก้ไข:</span> {issue.resolution}</p>
                        </div>
                      )}
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {formatDateTime(issue.createdAt, { shortYear: true })}
                      </p>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        )}
      </PremiumPageContent>
      {/* Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </MobileLayout>
  );
}
