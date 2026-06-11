import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { HelpCircle, Loader2 } from "lucide-react";

interface HowToPopupProps {
  /** The site_content key to fetch the image from, e.g. "review_howto_image" */
  contentKey: string;
  /** sessionStorage key to track if user has seen this popup */
  storageKey: string;
  /** Fallback image URL if no content is set in DB */
  fallbackUrl?: string;
  /** Button label for the "understood" button */
  dismissLabel?: string;
  /** Label for the re-open link */
  linkLabel?: string;
  /** Whether to show the re-open link below the form */
  showLink?: boolean;
}

/**
 * Reusable popup component that shows a how-to infographic image.
 * - Shows automatically on first visit (per session)
 * - Fetches image URL from site_content DB
 * - Falls back to a provided URL if no DB content
 * - Provides a link to re-open the popup
 */
export function useHowToPopup(storageKey: string) {
  const [showPopup, setShowPopup] = useState(() => {
    const seen = sessionStorage.getItem(storageKey);
    return !seen;
  });

  const dismiss = () => {
    sessionStorage.setItem(storageKey, "1");
    setShowPopup(false);
  };

  const open = () => setShowPopup(true);

  return { showPopup, dismiss, open };
}

export default function HowToPopup({
  contentKey,
  storageKey,
  fallbackUrl,
  dismissLabel = "เข้าใจแล้ว",
  linkLabel = "วิธีใช้งาน",
  showLink = true,
}: HowToPopupProps) {
  const { showPopup, dismiss, open } = useHowToPopup(storageKey);

  const { data: content, isLoading } = trpc.siteContent.get.useQuery(
    { key: contentKey },
    { staleTime: 5 * 60 * 1000 }
  );

  const imageUrl = content?.contentValue || fallbackUrl;

  // Don't render anything if no image available and not loading
  if (!imageUrl && !isLoading && !showPopup) return null;

  return (
    <>
      {/* Popup Dialog */}
      <Dialog open={showPopup} onOpenChange={(o) => { if (!o) dismiss(); }}>
        <DialogContent className="max-w-sm mx-auto max-h-[90vh] overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="วิธีใช้งาน"
                className="w-full h-auto rounded-lg"
              />
              <Button
                onClick={dismiss}
                className="w-full bg-[#2d5016] hover:bg-[#3d6b1e] text-white mt-3"
              >
                {dismissLabel}
              </Button>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <HelpCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">ยังไม่มีรูปแนะนำวิธีใช้งาน</p>
              <Button onClick={dismiss} variant="outline" className="mt-4">
                ปิด
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Re-open link */}
      {showLink && imageUrl && (
        <button
          onClick={open}
          className="text-xs text-primary underline hover:text-primary/80 flex items-center gap-1"
        >
          <HelpCircle className="h-3 w-3" />
          {linkLabel}
        </button>
      )}
    </>
  );
}
