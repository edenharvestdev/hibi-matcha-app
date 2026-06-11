import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * Saves scroll position for each route and restores it when navigating back.
 *
 * How it works:
 * - On every scroll, the current position is saved to sessionStorage keyed by path.
 * - When the route changes, if the navigation was a browser "back" (popstate),
 *   the saved scroll position is restored after a short delay (to let the page render).
 * - Forward navigations (setLocation / link clicks) scroll to top.
 *
 * This hook should be called once in MobileLayout so it covers all pages.
 */
export function useScrollRestoration() {
  const [location] = useLocation();
  const prevLocationRef = useRef(location);
  const isPopstateRef = useRef(false);

  // Listen for popstate (browser back/forward) to distinguish from programmatic nav
  useEffect(() => {
    const handlePopstate = () => {
      isPopstateRef.current = true;
    };
    window.addEventListener("popstate", handlePopstate);
    return () => window.removeEventListener("popstate", handlePopstate);
  }, []);

  // Save scroll position on scroll (throttled)
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        try {
          sessionStorage.setItem(
            `scroll_${location}`,
            String(window.scrollY)
          );
        } catch {
          // sessionStorage full — ignore
        }
        ticking = false;
      });
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [location]);

  // On route change: restore or scroll to top
  useEffect(() => {
    if (location === prevLocationRef.current) return;

    const wasPopstate = isPopstateRef.current;
    isPopstateRef.current = false; // reset flag

    if (wasPopstate) {
      // Navigating back — restore saved position
      const saved = sessionStorage.getItem(`scroll_${location}`);
      if (saved) {
        const y = parseInt(saved, 10);
        // Use a small delay to let the page render before scrolling
        const tryRestore = (attempts: number) => {
          if (attempts <= 0) return;
          requestAnimationFrame(() => {
            window.scrollTo(0, y);
            // If the page hasn't rendered enough content yet, try again
            if (window.scrollY !== y && document.body.scrollHeight > y) {
              return;
            }
            setTimeout(() => tryRestore(attempts - 1), 50);
          });
        };
        // Try restoring after a short delay to allow React to render
        setTimeout(() => tryRestore(5), 50);
      }
    } else {
      // Forward navigation — scroll to top
      window.scrollTo(0, 0);
    }

    prevLocationRef.current = location;
  }, [location]);
}
