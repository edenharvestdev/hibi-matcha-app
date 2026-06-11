import AdminPageWrapper from "@/components/AdminPageWrapper";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PremiumButton from "@/components/PremiumButton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, Image as ImageIcon, FileText, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const CONTENT_ITEMS = [
  { key: "review_howto_image", label: "รูปแนะนำวิธีรีวิว (Popup)", type: "image", description: "แสดงก่อนส่งรีวิว — วิธีลงทะเบียนรับสิทธิ์และส่งรีวิว (แนะนำ 600×800px)" },
  { key: "redeem_howto_image", label: "รูปแนะนำวิธีใช้โค้ด (Popup)", type: "image", description: "แสดงก่อนเข้าหน้าโค้ดของฉัน — วิธีใช้สิทธิ์/โค้ด (แนะนำ 600×800px)" },
  { key: "loyalty_howto_image", label: "รูปแนะนำวิธีสะสมแต้ม (Popup)", type: "image", description: "แสดงก่อนเข้าหน้าสะสมแต้ม — วิธีส่งบิลและรับแต้ม (แนะนำ 600×800px)" },
  { key: "reward_redeem_howto_image", label: "รูปแนะนำวิธีรีดีมแต้ม (Popup)", type: "image", description: "แสดงก่อนเข้าหน้าแลกรางวัล — วิธีใช้แต้มแลกรางวัล (แนะนำ 600×800px)" },
];

export default function ContentManagement() {
  const { session, loading, isSuperAdmin } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isSuperAdmin) { toast.error("เฉพาะ Super Admin เท่านั้น"); setLocation("/admin"); }
  }, [loading, session, isSuperAdmin, setLocation]);

  const { data: contentList, isLoading, refetch } = trpc.siteContent.list.useQuery(undefined, { enabled: !!session && isSuperAdmin });
  const uploadMut = trpc.siteContent.upload.useMutation({
    onSuccess: () => { toast.success("อัปโหลดสำเร็จ"); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  if (loading || !session) return null;

  const getContentValue = (key: string) => contentList?.find(c => c.contentKey === key)?.contentValue || null;

  return (
    <AdminPageWrapper title="จัดการเนื้อหา" backPath="/admin" loading={isLoading}>
      <div className="px-4 py-6 space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-primary-foreground">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="h-6 w-6" />
            <h1 className="font-bold text-lg">จัดการเนื้อหา</h1>
          </div>
          <p className="text-sm opacity-80">อัปโหลดและจัดการรูปภาพ/เนื้อหาที่แสดงในระบบ</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-4">
            {CONTENT_ITEMS.map(item => (
              <ContentCard
                key={item.key}
                contentKey={item.key}
                label={item.label}
                description={item.description}
                currentUrl={getContentValue(item.key)}
                onUpload={async (base64, mimeType) => {
                  await uploadMut.mutateAsync({ key: item.key, label: item.label, imageBase64: base64, imageType: mimeType });
                }}
                isUploading={uploadMut.isPending}
                onPreview={(url) => setPreviewUrl(url)}
              />
            ))}
          </div>
        )}

        {/* Preview Dialog */}
        <Dialog open={!!previewUrl} onOpenChange={(open) => { if (!open) setPreviewUrl(null); }}>
          <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto p-0">
            {previewUrl && (
              <img src={previewUrl} alt="Preview" className="w-full h-auto rounded-lg" />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminPageWrapper>
  );
}

function ContentCard({ contentKey, label, description, currentUrl, onUpload, isUploading, onPreview }: {
  contentKey: string;
  label: string;
  description: string;
  currentUrl: string | null;
  onUpload: (base64: string, mimeType: string) => Promise<void>;
  isUploading: boolean;
  onPreview: (url: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("ไฟล์ใหญ่เกิน 5MB"); return; }
    if (!file.type.startsWith("image/")) { toast.error("กรุณาเลือกไฟล์รูปภาพ"); return; }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(",")[1];
      setLocalPreview(reader.result as string);
      await onUpload(base64, file.type);
      setLocalPreview(null);
    };
    reader.readAsDataURL(file);
    // Reset input
    if (fileRef.current) fileRef.current.value = "";
  };

  const displayUrl = localPreview || currentUrl;

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-10 w-10 rounded-xl flex items-center justify-center bg-green-50 text-green-600 shrink-0">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">{label}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>

        {/* Current image preview */}
        {displayUrl && (
          <div className="mb-3 relative group">
            <img
              src={displayUrl}
              alt={label}
              className="w-full max-h-48 object-contain rounded-lg bg-gray-50 cursor-pointer"
              onClick={() => onPreview(displayUrl)}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors rounded-lg flex items-center justify-center">
              <Eye className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        )}

        {/* Upload button */}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          variant="outline"
          className="w-full"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <><Loader2 className="h-4 w-4 animate-spin mr-2" /> กำลังอัปโหลด...</>
          ) : (
            <><Upload className="h-4 w-4 mr-2" /> {currentUrl ? "เปลี่ยนรูป" : "อัปโหลดรูป"}</>
          )}
        </Button>

        {currentUrl && (
          <p className="text-[10px] text-muted-foreground mt-2 text-center">กดที่รูปเพื่อดูขนาดเต็ม</p>
        )}
      </CardContent>
    </Card>
  );
}
