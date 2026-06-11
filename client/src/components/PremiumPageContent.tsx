import { ReactNode, useState, useEffect } from "react";

interface PremiumPageContentProps {
  children: ReactNode;
  loading?: boolean;
  /** Show a section title at top of content */
  title?: string;
  /** Subtitle below title */
  subtitle?: string;
  /** Custom icon next to title */
  icon?: ReactNode;
}

function SkeletonPulse({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-xl bg-gradient-to-r from-[#e8ede5] via-[#f0f4ee] to-[#e8ede5] bg-[length:200%_100%] animate-[shimmer_1.5s_ease-in-out_infinite] ${className}`} />
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-5" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/70 backdrop-blur-sm border border-[#e8ede5]/60 p-4 space-y-3"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="flex items-center justify-between">
              <SkeletonPulse className="w-9 h-9 rounded-xl" />
              <SkeletonPulse className="w-12 h-4" />
            </div>
            <SkeletonPulse className="w-20 h-6" />
            <SkeletonPulse className="w-16 h-3" />
          </div>
        ))}
      </div>

      {/* List items skeleton */}
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-white/70 backdrop-blur-sm border border-[#e8ede5]/60 p-4 flex items-center gap-3"
            style={{ animationDelay: `${(i + 4) * 0.06}s` }}
          >
            <SkeletonPulse className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="w-3/4 h-4" />
              <SkeletonPulse className="w-1/2 h-3" />
            </div>
            <SkeletonPulse className="w-6 h-6 rounded-lg flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * PremiumPageContent — A lightweight content wrapper that adds the premium 2026 design system
 * (live wallpaper, glass morphism background, loading skeleton, fade-in animations)
 * INSIDE MobileLayout. Use this for Customer and Branch pages that already have
 * MobileLayout providing the header and bottom nav.
 */
export default function PremiumPageContent({ children, loading, title, subtitle, icon }: PremiumPageContentProps) {
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setShowContent(true), 80);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [loading]);

  return (
    <div className="relative min-h-[calc(100vh-140px)] bg-gradient-to-br from-white via-[#f8faf7] to-[#f0f4ee]">
      {/* Live Wallpaper */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-[0.08] blur-3xl"
          style={{ background: 'radial-gradient(circle, #8FA28B, transparent)', animation: 'float 20s ease-in-out infinite' }}
        />
        <div
          className="absolute top-1/2 -right-20 w-80 h-80 rounded-full opacity-[0.06] blur-3xl"
          style={{ background: 'radial-gradient(circle, #556B2F, transparent)', animation: 'float 25s ease-in-out infinite reverse' }}
        />
        <div
          className="absolute -bottom-10 left-1/3 w-64 h-64 rounded-full opacity-[0.05] blur-3xl"
          style={{ background: 'radial-gradient(circle, #BDB76B, transparent)', animation: 'float 18s ease-in-out infinite 5s' }}
        />
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-[#8FA28B]/20"
            style={{
              top: `${20 + i * 20}%`,
              left: `${15 + i * 18}%`,
              animation: `pulse-gentle ${3 + i * 0.5}s ease-in-out infinite ${i * 0.7}s`
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 px-4 py-5">
        {/* Optional section title */}
        {title && (
          <div className="mb-4" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
            <div className="flex items-center gap-2.5">
              {icon && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#556B2F]/10 to-[#8FA28B]/10 flex items-center justify-center ring-1 ring-[#8FA28B]/20">
                  {icon}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold text-[#2d4a2e]">{title}</h2>
                {subtitle && <p className="text-xs text-[#556B2F]/60">{subtitle}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Page Content with transition */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
          <div
            className={`transition-all duration-300 ease-out ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}
            style={{ animation: showContent ? 'fadeSlideIn 0.4s ease-out both' : 'none' }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
