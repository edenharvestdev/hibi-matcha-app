import { useScrollRestoration } from "@/hooks/useScrollRestoration";

/**
 * Global scroll restoration component.
 * Place once in App.tsx to cover all routes (including pages without MobileLayout).
 * 
 * - On browser back: restores the saved scroll position
 * - On forward navigation: scrolls to top
 */
export default function ScrollRestoration() {
  useScrollRestoration();
  return null;
}
