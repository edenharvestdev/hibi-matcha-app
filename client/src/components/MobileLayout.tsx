import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import {
  Home, Star, ClipboardList, QrCode, BarChart3, Users, Building2, FileText, Shield, LogOut, Menu, X, ChevronLeft, Coins, Gift, Wallet, Calculator, AlertTriangle, LayoutDashboard, Eye, Bell
} from "lucide-react";
import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import RealtimeClock from "@/components/common/RealtimeClock";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029164707/lBgSgkEWqcVXTljA.jpeg";

// Notification sound - short beep
const NOTIFICATION_SOUND_URL = "/notification-sound.wav";

interface MobileLayoutProps {
  children: React.ReactNode;
  title?: string;
  showBack?: boolean;
  backPath?: string;
}

export default function MobileLayout({ children, title, showBack, backPath }: MobileLayoutProps) {
  const { session, logout, isCustomer, isBranchOwner, isBranchManager, isBranchStaff, isBranchAdmin, isAreaManager, isSuperAdmin, hasPermission } = useHibiAuth();
  const [location, setLocation] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const prevUnreadStaffRef = useRef<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Fetch unread announcement count for customers
  const { data: unreadData } = trpc.announcements.unreadCount.useQuery(undefined, {
    enabled: !!session && isCustomer,
    refetchInterval: 60000,
  });
  const unreadCount = unreadData?.count ?? 0;

  // Fetch unread staff notification count for branch_manager and super_admin
  const isStaffWithBell = !!(session && (isBranchManager || isSuperAdmin));
  const { data: staffUnreadData } = trpc.staffNotifications.unreadCount.useQuery(undefined, {
    enabled: isStaffWithBell,
    refetchInterval: 60000,
    refetchIntervalInBackground: false,
  });
  const staffUnreadCount = staffUnreadData?.count ?? 0;

  // Sound alert when new notification arrives
  useEffect(() => {
    if (!isStaffWithBell) return;
    if (staffUnreadCount > prevUnreadStaffRef.current && prevUnreadStaffRef.current >= 0) {
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio(NOTIFICATION_SOUND_URL);
          audioRef.current.volume = 0.5;
        }
        audioRef.current.play().catch(() => {});
      } catch {}
    }
    prevUnreadStaffRef.current = staffUnreadCount;
  }, [staffUnreadCount, isStaffWithBell]);

  // Branch nav varies by role - MUST be before any early return to keep hook count stable
  const branchNavItems = useMemo(() => {
    const items: { icon: any; label: string; path: string }[] = [
      { icon: BarChart3, label: "แดชบอร์ด", path: "/branch" },
    ];

    if (isBranchOwner || isBranchManager || isAreaManager || hasPermission("approve_reviews")) {
      items.push({ icon: ClipboardList, label: "รีวิว", path: "/branch/reviews" });
    }

    if (isBranchOwner || isBranchManager || isAreaManager) {
      items.push({ icon: AlertTriangle, label: "ปัญหาออเดอร์", path: "/branch/order-issues" });
    }

    if (isAreaManager) {
      items.push({ icon: LayoutDashboard, label: "ภาพรวมสาขา", path: "/branch/overview" });
    }

    if (!isAreaManager) {
      items.push({ icon: QrCode, label: "ใช้โค้ด", path: "/branch/redeem" });
    }
    items.push({ icon: Calculator, label: "บัญชีรายวัน", path: "/branch/daily-sales" });
    items.push({ icon: Wallet, label: "เงินสดย่อย", path: "/branch/petty-cash" });

    if (isBranchOwner || isAreaManager) {
      items.push({ icon: Users, label: "พนักงาน", path: "/branch/staff" });
    }

    return items;
  }, [isBranchOwner, isBranchManager, isBranchStaff, isAreaManager, hasPermission]);

  // Early return AFTER all hooks to prevent React error #310
  if (!session) return <>{children}</>;

  const customerNav = [
    { icon: Home, label: "หน้าหลัก", path: "/customer" },
    { icon: Coins, label: "แต้มสะสม", path: "/customer/my-points" },
    { icon: Gift, label: "แลกรางวัล", path: "/customer/rewards" },
    { icon: QrCode, label: "โค้ดของฉัน", path: "/customer/my-codes" },
  ];

  const adminNav = [
    { icon: BarChart3, label: "แดชบอร์ด", path: "/admin" },
    { icon: Wallet, label: "เงินสดย่อย", path: "/branch/petty-cash" },
    { icon: Calculator, label: "บัญชีรายวัน", path: "/branch/daily-sales" },
    { icon: ClipboardList, label: "รีวิว", path: "/admin/reviews" },
    { icon: QrCode, label: "ใช้โค้ด", path: "/admin/redeem" },
    { icon: Building2, label: "สาขา", path: "/admin/branches" },
    { icon: LayoutDashboard, label: "ภาพรวมสาขา", path: "/admin/overview" },
    { icon: Eye, label: "ทดสอบสิทธิ์", path: "/admin/impersonate" },
  ];

  const navItems = isCustomer ? customerNav : (isBranchAdmin || isAreaManager) ? branchNavItems : adminNav;

  // Bottom nav: show up to 4 items for branch (5 for admin/area_manager)
  const bottomNavCount = (isSuperAdmin || isAreaManager) ? 5 : 4;

  // Determine notification bell path based on role
  const notifPath = isSuperAdmin ? "/admin/notifications" : "/branch/notifications";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header — Glass Morphism */}
      <header className="sticky top-0 z-50">
        {/* Layered glass background */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-[#e8ede5]" />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#556B2F]/5 via-transparent to-transparent" />
        {/* Ambient glow on bottom edge */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8FA28B]/30 to-transparent" />
        
        <div className="relative flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            {showBack ? (
              <button onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else if (backPath) {
                  setLocation(backPath);
                } else {
                  setLocation("/");
                }
              }} className="p-1">
                <ChevronLeft className="h-5 w-5 text-[#355E3B]" />
              </button>
            ) : (
              <img src={LOGO_URL} alt="Hibi Matcha" className="h-8 w-8 rounded-full bg-white object-cover" />
            )}
            <span className="font-semibold text-base truncate text-[#355E3B]">
              {title || "Hibi Matcha"}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Real-time Clock */}
            <RealtimeClock />
            {/* Notification Bell - customer */}
            {isCustomer && (
              <button
                onClick={() => setLocation("/customer/announcements")}
                className="relative p-2 rounded-full hover:bg-[#556B2F]/10 transition-colors"
                aria-label="ประกาศ"
              >
                <Bell className="h-5 w-5 text-[#556B2F]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 animate-in zoom-in-50">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>
            )}
            {/* Notification Bell - branch_manager and super_admin */}
            {isStaffWithBell && (
              <button
                onClick={() => setLocation(notifPath)}
                className="relative p-2 rounded-full hover:bg-[#556B2F]/10 transition-colors"
                aria-label="การแจ้งเตือน"
              >
                <Bell className="h-5 w-5 text-[#556B2F]" />
                {staffUnreadCount > 0 && (
                  <>
                    <span className="absolute top-0.5 right-0.5 min-w-[20px] h-[20px] flex items-center justify-center bg-red-500 text-white text-[11px] font-bold rounded-full px-1 shadow-lg border-2 border-white animate-pulse">
                      {staffUnreadCount > 99 ? "99+" : staffUnreadCount}
                    </span>
                  </>
                )}
              </button>
            )}
            <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 rounded-full hover:bg-[#556B2F]/10 transition-colors">
              {menuOpen ? <X className="h-5 w-5 text-[#355E3B]" /> : <Menu className="h-5 w-5 text-[#556B2F]" />}
            </button>
          </div>
        </div>

        {/* Slide menu — Glass Morphism with smooth animation */}
        {menuOpen && (
          <>
            {/* Backdrop overlay with fade */}
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              style={{ animation: 'fadeIn 0.25s ease-out' }}
              onClick={() => setMenuOpen(false)}
            />
            {/* Menu panel */}
            <div
              className="absolute top-14 left-0 right-0 z-50 mx-3 mt-2 rounded-2xl overflow-hidden shadow-2xl shadow-[#556B2F]/10"
              style={{ animation: 'slideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
            >
              {/* Glass background layers */}
              <div className="absolute inset-0 bg-white/85 backdrop-blur-2xl" />
              <div className="absolute inset-0 bg-gradient-to-b from-[#556B2F]/3 via-transparent to-[#8FA28B]/3" />
              <div className="absolute inset-0 border border-white/60 rounded-2xl" />

              {/* Content */}
              <div className="relative">
                {/* User profile section */}
                <div className="p-4 border-b border-[#e8ede5]/60">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-11 w-11 border-2 border-[#8FA28B]/30 shadow-md">
                        <AvatarFallback className="bg-gradient-to-br from-[#556B2F]/20 to-[#8FA28B]/20 text-[#355E3B] font-semibold">
                          {session.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-[#2d4a2e]">{session.name}</p>
                      <p className="text-xs text-[#556B2F]/70">{session.phone}</p>
                      <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] font-medium rounded-full bg-gradient-to-r from-[#556B2F]/10 to-[#8FA28B]/10 text-[#355E3B] border border-[#8FA28B]/20">
                        {session.role === "customer" ? "ลูกค้า" : session.role === "branch_owner" ? "เจ้าของสาขา" : session.role === "branch_manager" ? "ผู้จัดการสาขา" : session.role === "branch_staff" ? "พนักงานสาขา" : session.role === "area_manager" ? "เจ้าของแฟรนไชส์" : session.role === "support_staff" ? "Support" : "Super Admin"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Navigation items with stagger animation */}
                <div className="py-1">
                  {navItems.map((item, index) => (
                    <button
                      key={item.path}
                      onClick={() => { setLocation(item.path); setMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-5 py-3 text-sm transition-all duration-200 hover:bg-[#556B2F]/5 hover:pl-6 ${
                        location === item.path
                          ? "bg-gradient-to-r from-[#556B2F]/8 to-transparent text-[#355E3B] font-medium border-l-2 border-[#556B2F]"
                          : "text-[#4a5e4a]"
                      }`}
                      style={{ animation: `fadeSlideIn 0.3s ease-out ${index * 0.04}s both` }}
                    >
                      <div className={`p-1.5 rounded-lg ${
                        location === item.path
                          ? "bg-[#556B2F]/10"
                          : "bg-[#8FA28B]/8"
                      }`}>
                        <item.icon className="h-4 w-4" />
                      </div>
                      {item.label}
                      {location === item.path && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#556B2F]" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Logout section */}
                <div className="border-t border-[#e8ede5]/60 py-1">
                  <button
                    onClick={() => { logout(); setLocation("/login"); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm text-red-500/80 hover:bg-red-50/50 hover:text-red-600 transition-all duration-200 hover:pl-6"
                    style={{ animation: `fadeSlideIn 0.3s ease-out ${navItems.length * 0.04}s both` }}
                  >
                    <div className="p-1.5 rounded-lg bg-red-50">
                      <LogOut className="h-4 w-4" />
                    </div>
                    ออกจากระบบ
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 pb-24" style={{ paddingTop: sessionStorage.getItem('hibi_impersonate') ? '48px' : undefined }}>
        {children}
      </main>

      {/* ══════════════════════════════════════════════════════════════
          Premium Bottom Navigation Bar — 2026 Design
          Glass morphism + organic green palette + active indicator animation
         ══════════════════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-40">
        {/* Layered background */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-t border-[#e8ede5]" />
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
        {/* Ambient glow on top edge */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#8FA28B]/30 to-transparent" />
        
        <div className="relative flex justify-around items-center h-[72px] max-w-lg mx-auto px-2">
          {navItems.slice(0, bottomNavCount).map((item) => {
            const isActive = location === item.path || (item.path !== "/" && item.path !== "/admin" && item.path !== "/branch" && item.path !== "/customer" && location.startsWith(item.path));
            const isExactActive = location === item.path;
            return (
              <button
                key={item.path}
                onClick={() => setLocation(item.path)}
                className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 group"
                style={{ minWidth: '60px' }}
              >
                {/* Active background pill */}
                {isExactActive && (
                  <div 
                    className="absolute inset-0 rounded-2xl transition-all duration-300"
                    style={{ 
                      background: "linear-gradient(135deg, rgba(85,107,47,0.08) 0%, rgba(143,162,139,0.12) 100%)",
                      boxShadow: "0 2px 8px rgba(85,107,47,0.08)"
                    }}
                  />
                )}
                
                {/* Icon container with frame */}
                <div className="relative z-10 flex items-center justify-center">
                  {/* Active indicator dot */}
                  {isExactActive && (
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#556B2F] animate-pulse" />
                  )}
                  
                  <div 
                    className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all duration-300 ${
                      isExactActive 
                        ? "bg-gradient-to-br from-[#556B2F] to-[#355E3B] shadow-md" 
                        : "bg-transparent group-hover:bg-[#f5f8f3]"
                    }`}
                    style={isExactActive ? { boxShadow: "0 3px 12px rgba(85,107,47,0.25)" } : {}}
                  >
                    <item.icon 
                      className={`transition-all duration-300 ${
                        isExactActive 
                          ? "h-[18px] w-[18px] text-white stroke-[2.5]" 
                          : "h-[18px] w-[18px] text-gray-400 group-hover:text-[#556B2F]"
                      }`} 
                    />
                  </div>
                </div>
                
                {/* Label */}
                <span 
                  className={`relative z-10 text-[10px] font-medium transition-all duration-300 leading-tight ${
                    isExactActive 
                      ? "text-[#355E3B] font-semibold" 
                      : "text-gray-400 group-hover:text-[#556B2F]"
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {/* Safe area padding for notched devices */}
        <div className="h-[env(safe-area-inset-bottom,0px)] bg-white/80 backdrop-blur-xl" />
      </nav>
    </div>
  );
}
