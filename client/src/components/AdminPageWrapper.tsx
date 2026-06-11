import { ReactNode, useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import { useLocation } from "wouter";
import RealtimeClock from "@/components/common/RealtimeClock";

interface AdminPageWrapperProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  backPath?: string;
  actions?: ReactNode;
  icon?: ReactNode;
  loading?: boolean;
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

export default function AdminPageWrapper({ children, title, subtitle, backPath = "/admin", actions, icon, loading }: AdminPageWrapperProps) {
  const [, setLocation] = useLocation();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Small delay to ensure smooth transition from skeleton to content
    if (!loading) {
      const timer = setTimeout(() => setShowContent(true), 80);
      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [loading]);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-white via-[#f8faf7] to-[#f0f4ee]">
      {/* Live Wallpaper */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
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
      <div className="relative z-10 pb-4">
        {/* Header */}
        <div
          className="sticky top-0 z-20 backdrop-blur-xl bg-white/80 border-b border-[#e8ede5]/50 shadow-sm shadow-[#556B2F]/5"
          style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
        >
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8FA28B]/30 to-transparent" />
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (window.history.length > 1) {
                    window.history.back();
                  } else if (backPath) {
                    setLocation(backPath);
                  } else {
                    setLocation('/admin');
                  }
                }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#556B2F]/10 to-[#8FA28B]/10 flex items-center justify-center ring-1 ring-[#8FA28B]/20 transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-md hover:shadow-[#556B2F]/10"
              >
                <ChevronLeft className="h-5 w-5 text-[#355E3B]" />
              </button>
              <div className="flex items-center gap-2">
                {icon && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#556B2F]/10 to-[#8FA28B]/10 flex items-center justify-center">
                    {icon}
                  </div>
                )}
                <div>
                  <h1 className="text-base font-bold text-[#2d4a2e]">{title}</h1>
                  {subtitle && <p className="text-xs text-[#556B2F]/60">{subtitle}</p>}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RealtimeClock />
              {actions}
            </div>
          </div>
        </div>

        {/* Page Content with transition */}
        <div className="px-4 pt-4">
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
    </div>
  );
}
