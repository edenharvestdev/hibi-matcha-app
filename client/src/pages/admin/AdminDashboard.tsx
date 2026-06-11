import MobileLayout from "@/components/MobileLayout";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, QrCode, FileText, Building2, Users, BarChart3, Shield, ChevronRight, Database, ClipboardList, Gift, Coins, Clock, Star, AlertTriangle, MessageCircle, Ticket, Megaphone, Coffee, List, Bell, FileImage, Settings2, KeyRound, UserCog, ShoppingBag, Package, Percent, Calculator, MapPin, LayoutDashboard, TrendingUp, Handshake, Store, Receipt, Monitor, UtensilsCrossed, CreditCard, Tags, Hash, Printer, ExternalLink, Sparkles, Leaf, ChevronDown, MinusCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { motion, AnimatePresence } from "framer-motion";


/* ===== Color Palette: Olive/Sage/Forest/Moss/Khaki/Hunter Green + White ===== */
const COLORS = {
  olive: { bg: "rgba(85,107,47,0.08)", text: "#556B2F", accent: "#556B2F" },
  sage: { bg: "rgba(143,162,139,0.10)", text: "#5F7A5A", accent: "#8FA28B" },
  forest: { bg: "rgba(34,139,34,0.08)", text: "#1B6B1B", accent: "#228B22" },
  moss: { bg: "rgba(138,154,91,0.10)", text: "#6B7B3A", accent: "#8A9A5B" },
  khaki: { bg: "rgba(189,183,107,0.12)", text: "#7A7540", accent: "#BDB76B" },
  hunter: { bg: "rgba(53,94,59,0.08)", text: "#355E3B", accent: "#355E3B" },
};

/* ===== Organic Live Wallpaper ===== */
function LiveWallpaper() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Layered gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-[#f7faf5] to-[#f0f5ec]" />
      
      {/* Organic blob layers */}
      <motion.div
        className="absolute -top-20 -right-20 w-[300px] h-[300px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(85,107,47,0.06) 0%, transparent 70%)" }}
        animate={{ scale: [1, 1.15, 1], rotate: [0, 30, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-[30%] -left-16 w-[250px] h-[250px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(143,162,139,0.08) 0%, transparent 70%)" }}
        animate={{ scale: [1.1, 0.95, 1.1], y: [-10, 10, -10] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <motion.div
        className="absolute bottom-[10%] right-[10%] w-[200px] h-[200px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(53,94,59,0.05) 0%, transparent 70%)" }}
        animate={{ scale: [0.9, 1.1, 0.9], x: [-8, 8, -8] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 4 }}
      />
      
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />
      
      {/* Floating leaf particles */}
      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{
            background: i % 2 === 0 ? COLORS.sage.accent : COLORS.olive.accent,
            opacity: 0.15,
            top: `${20 + i * 15}%`,
            left: `${10 + i * 18}%`,
          }}
          animate={{
            y: [-20, 20, -20],
            x: [-5, 5, -5],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{ duration: 6 + i * 1.5, repeat: Infinity, ease: "easeInOut", delay: i * 0.8 }}
        />
      ))}
    </div>
  );
}

/* BranchPOSLinks removed — replaced by POS V2 Launcher */

/* ===== Glass Card Menu Item ===== */
function MenuItemCard({ item, index, setLocation }: { item: any; index: number; setLocation: (path: string) => void }) {
  const handleClick = () => {
    if (item.external) {
      setLocation(item.path); // Navigate to launcher page which handles audit + open
    } else {
      setLocation(item.path);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.025, type: "spring", stiffness: 400, damping: 30 }}
      whileTap={{ scale: 0.98 }}
    >
      <div
        className="flex items-center gap-3 p-3 rounded-2xl bg-white/80 backdrop-blur-sm border border-[#edf2ea] hover:border-[#d4dece] hover:bg-white hover:shadow-[0_2px_12px_rgba(85,107,47,0.06)] cursor-pointer transition-all duration-200"
        onClick={handleClick}
      >
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
          <item.icon className="h-[18px] w-[18px]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[13px] text-gray-800 truncate">{item.label}</p>
          <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">{item.desc}</p>
        </div>
        {item.external ? (
          <ExternalLink className="h-4 w-4 text-gray-300 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
        )}
      </div>
    </motion.div>
  );
}

/* ===== Section Header with organic style ===== */
function SectionHeader({ icon: Icon, title, count, color }: { icon: any; title: string; count: number; color: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: `${color}14` }}>
        <Icon className="h-3.5 w-3.5" style={{ color }} />
      </div>
      <h3 className="font-bold text-[13px] text-gray-700">{title}</h3>
      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-gray-100/80 text-gray-400">{count}</span>
    </div>
  );
}

/* ===== Stat Card with layered design ===== */
function StatCard({ stat, index, setLocation }: { stat: any; index: number; setLocation: (path: string) => void }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12, scale: 0.96 },
        visible: { opacity: 1, y: 0, scale: 1 }
      }}
      whileTap={{ scale: 0.96 }}
      className="cursor-pointer"
      onClick={() => setLocation(stat.path)}
    >
      <div className="relative rounded-2xl border border-[#edf2ea] bg-white/90 backdrop-blur-sm p-4 overflow-hidden hover:shadow-[0_4px_20px_rgba(85,107,47,0.08)] hover:border-[#d4dece] transition-all duration-300">
        {/* Layered accent */}
        <div className="absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2" style={{ background: `${stat.accentColor}08` }} />
        <div className="absolute bottom-0 left-0 w-10 h-10 rounded-full translate-y-1/2 -translate-x-1/2" style={{ background: `${stat.accentColor}05` }} />
        
        <div className="relative">
          <div className="h-9 w-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${stat.accentColor}12` }}>
            <stat.icon className="h-4 w-4" style={{ color: stat.accentColor }} />
          </div>
          <p className="text-2xl font-bold text-gray-800 tracking-tight">{stat.value}</p>
          <p className="text-[11px] text-gray-400 mt-1 font-medium">{stat.label}</p>
        </div>
      </div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const { session, loading, isSuperAdmin, isAdmin, canViewCustomers } = useHibiAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !session) setLocation("/login");
    if (!loading && session && !isAdmin) setLocation("/login");
  }, [loading, session, isAdmin, setLocation]);

  const { data: stats } = trpc.dashboard.stats.useQuery(undefined, { enabled: !!session && isAdmin });
  const { data: unreadData } = trpc.staffNotifications.unreadCount.useQuery(undefined, { enabled: !!session && isAdmin, refetchInterval: 60000 });
  const unreadCount = unreadData?.count ?? 0;
  const { data: pendingResets } = trpc.passwordReset.countPending.useQuery(undefined, { enabled: !!session && isSuperAdmin, refetchInterval: 60000 });

  if (loading || !session) return null;

  const codesPath = isSuperAdmin ? "/admin/reports" : "/admin/codes";
  const statCards = [
    { icon: AlertCircle, label: "รีวิวรออนุมัติ", value: stats?.totalPendingReviews ?? 0, accentColor: "#B8860B", path: "/admin/reviews" },
    { icon: CheckCircle2, label: "อนุมัติวันนี้", value: stats?.totalApprovedToday ?? 0, accentColor: "#355E3B", path: "/admin/reviews" },
    { icon: QrCode, label: "โค้ดที่ออก", value: stats?.totalCodesIssued ?? 0, accentColor: "#556B2F", path: codesPath },
    { icon: FileText, label: "โค้ดที่ใช้แล้ว", value: stats?.totalCodesRedeemed ?? 0, accentColor: "#8A9A5B", path: codesPath },
  ];

  const operationItems = [
    { icon: Coins, label: "ให้แต้มหน้าร้าน", desc: "สแกน QR ลูกค้า หรือค้นหาเบอร์โทร", path: "/admin/give-points", color: "bg-[#556B2F]/8 text-[#556B2F]" },
    { icon: MinusCircle, label: "หักแต้มลูกค้า", desc: "เพิกถอนแต้มที่ให้ผิด (Manager+)", path: "/admin/deduct-points", color: "bg-red-50 text-red-600", managerOnly: true },
    { icon: Clock, label: "คำขอแต้ม Delivery", desc: "ตรวจสอบและอนุมัติแต้ม", path: "/admin/point-claims", color: "bg-[#B8860B]/8 text-[#8B6914]" },
    { icon: ClipboardList, label: "รีวิวรออนุมัติ", desc: "ตรวจสอบและอนุมัติ/ปฏิเสธรีวิว", path: "/admin/reviews", color: "bg-[#8FA28B]/12 text-[#5F7A5A]" },
    { icon: Gift, label: "สร้างโค้ดชดเชย", desc: "ออกโค้ดชดเชยให้ลูกค้า (2 โค้ด)", path: "/admin/create-claim", color: "bg-[#BDB76B]/10 text-[#7A7540]" },
    { icon: QrCode, label: "ใช้โค้ด", desc: "ตรวจสอบและ Redeem โค้ด", path: "/admin/redeem", color: "bg-[#355E3B]/8 text-[#355E3B]" },
    { icon: List, label: "รายการโค้ดทั้งหมด", desc: "ดู/ค้นหา/แก้ไขโค้ดที่ออกแล้ว", path: "/admin/codes", color: "bg-gray-100/80 text-gray-600" },
    { icon: Ticket, label: "โค้ดค้าง (ยังไม่ใช้)", desc: "สรุปจำนวนโค้ดที่ยังไม่ถูกรีดีม แยกตามสาขา", path: "/admin/pending-codes", color: "bg-[#8A9A5B]/10 text-[#6B7B3A]" },
    { icon: BarChart3, label: "รายงานสรุป", desc: "สรุปข้อมูลรีวิว โค้ด แยกตามสาขา", path: "/admin/area-reports", color: "bg-[#228B22]/8 text-[#1B6B1B]" },
  ];

  const menuItems = [
    { icon: Building2, label: "จัดการสาขา", desc: "เพิ่ม/แก้ไข/ปิดสาขา", path: "/admin/branches", color: "bg-[#355E3B]/8 text-[#355E3B]" },
    { icon: Users, label: "จัดการพนักงาน", desc: "เพิ่ม/แก้ไขสิทธิ์พนักงาน", path: "/admin/staff", color: "bg-[#556B2F]/8 text-[#556B2F]" },
    { icon: BarChart3, label: "รายงาน", desc: "สรุปข้อมูลและ Export CSV", path: "/admin/reports", color: "bg-[#B8860B]/8 text-[#8B6914]" },
    { icon: Database, label: "ข้อมูลลูกค้า", desc: "ดูรายชื่อลูกค้าที่ลงทะเบียน", path: "/admin/customers", color: "bg-[#8FA28B]/12 text-[#5F7A5A]" },
    { icon: Shield, label: "Audit Logs", desc: "บันทึกการดำเนินการทั้งหมด", path: "/admin/audit-logs", color: "bg-gray-100/80 text-gray-600" },
    { icon: Star, label: "จัดการรางวัล", desc: "เพิ่ม/แก้ไข/ปิดรางวัลสะสมแต้ม", path: "/admin/rewards", color: "bg-[#BDB76B]/10 text-[#7A7540]" },
    { icon: AlertTriangle, label: "ปัญหาออเดอร์", desc: "จัดการเรื่องร้องเรียนจากลูกค้า (SLA 24/48 ชม.)", path: "/admin/order-issues", color: "bg-red-50 text-red-600" },
    { icon: BarChart3, label: "Dashboard ปัญหา", desc: "สรุปภาพรวมปัญหาแยกตามประเภท/สาขา + SLA", path: "/admin/issue-dashboard", color: "bg-[#8A9A5B]/10 text-[#6B7B3A]" },
    { icon: MessageCircle, label: "ข้อมูลติดต่อ", desc: "แฟรนไชส์, ราคาส่ง, Event", path: "/admin/inquiries", color: "bg-[#228B22]/8 text-[#1B6B1B]" },
    { icon: Ticket, label: "แคมเปญแก้วแถม", desc: "สร้าง/จัดการแคมเปญ Free Drink Code", path: "/admin/campaigns", color: "bg-[#355E3B]/8 text-[#355E3B]" },
    { icon: Megaphone, label: "ประกาศ & โปรโมชัน", desc: "สร้างประกาศ/โปรโมชัน/อีเวนต์สำหรับลูกค้า", path: "/admin/announcements", color: "bg-[#556B2F]/8 text-[#556B2F]" },
    { icon: Coffee, label: "เมนูรีวิว", desc: "จัดการเมนูที่ลูกค้าเลือกหลังรับโค้ดรีวิว", path: "/admin/review-menu", color: "bg-[#8FA28B]/12 text-[#5F7A5A]" },
    { icon: Settings2, label: "ตัวเลือกเมนู (Options)", desc: "จัดการกลุ่มตัวเลือก เช่น ความหวาน, ร้อน/เย็น", path: "/admin/option-groups", color: "bg-[#BDB76B]/10 text-[#7A7540]" },
    { icon: FileImage, label: "จัดการเนื้อหา", desc: "อัปโหลดรูปแนะนำวิธีรีวิว และเนื้อหาอื่นๆ", path: "/admin/content", color: "bg-[#8A9A5B]/10 text-[#6B7B3A]" },
    { icon: ShoppingBag, label: "จัดการร้านค้า", desc: "เพิ่ม/แก้ไขสินค้า หมวดหมู่ ราคาปลีก-ส่ง", path: "/admin/shop-products", color: "bg-[#355E3B]/8 text-[#355E3B]" },
    { icon: Package, label: "คำสั่งซื้อร้านค้า", desc: "ดู/อัปเดตสถานะคำสั่งซื้อ ตรวจสลิปโอนเงิน", path: "/admin/shop-orders", color: "bg-[#556B2F]/8 text-[#556B2F]" },
    { icon: Percent, label: "คอมมิชชันสาขา", desc: "ตั้งค่าอัตราคอมมิชชันแต่ละสาขา", path: "/admin/commissions", color: "bg-[#B8860B]/8 text-[#8B6914]" },
    { icon: Calculator, label: "รายงานยอดขายสาขา", desc: "ดูยอดขายรายวันรวมทุกสาขา แยกตามช่องทาง", path: "/admin/sales-report", color: "bg-[#8FA28B]/12 text-[#5F7A5A]" },
    { icon: MapPin, label: "จัดการเขตบริการ", desc: "สร้าง/แก้ไขเขตบริการ จัดกลุ่มสาขาตามเขต", path: "/admin/zones", color: "bg-[#228B22]/8 text-[#1B6B1B]" },
    { icon: Handshake, label: "เจ้าของแฟรนไชส์", desc: "จัดการเจ้าของแฟรนไชส์ ผูกสาขากับเจ้าของ", path: "/admin/franchise-owners", color: "bg-[#BDB76B]/10 text-[#7A7540]" },
    { icon: Store, label: "ขายสินค้าหน้าร้าน", desc: "ลงยอดขายสินค้าหน้าร้าน แนบสลิป คิดคอมมิชชั่น", path: "/admin/in-store-sales", color: "bg-[#355E3B]/8 text-[#355E3B]" },
    { icon: Receipt, label: "รายงานคอมมิชชั่น", desc: "สรุปคอมมิชชั่นรายเดือน แยกตามพนักงาน", path: "/admin/commission-report", color: "bg-[#8A9A5B]/10 text-[#6B7B3A]" },
    { icon: LayoutDashboard, label: "ภาพรวมทุกสาขา", desc: "ดูยอดขาย/เงินสดย่อย/รีวิว/ปัญหา รวมทุกสาขา", path: "/admin/overview", color: "bg-[#556B2F]/8 text-[#556B2F]" },
    { icon: TrendingUp, label: "Marketing Dashboard", desc: "วิเคราะห์คูปอง/แต้มตามสาขา เจาะการตลาด", path: "/admin/marketing", color: "bg-[#228B22]/8 text-[#1B6B1B]" },
  ];

  const posItems = [
    { icon: Monitor, label: "เปิด POS V2", desc: "pos.hibimatcha.love — เปิดในแท็บใหม่", path: "/pos", color: "bg-[#228B22]/8 text-[#228B22]", external: true },
  ];

  const pendingResetCount = pendingResets?.count ?? 0;

  return (
    <MobileLayout title="Super Admin">
      {/* Live Wallpaper */}
      <LiveWallpaper />
      
      <div className="relative z-10 px-4 py-5 space-y-5">
        {/* ── Welcome Card ── */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, type: "spring", stiffness: 250 }}
        >
          <div className="relative rounded-3xl overflow-hidden" style={{ background: "linear-gradient(135deg, #355E3B 0%, #556B2F 50%, #3D6B44 100%)" }}>
            {/* Layered decorative elements */}
            <div className="absolute inset-0">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.04] -translate-y-1/3 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/[0.03] translate-y-1/3 -translate-x-1/4" />
              <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-[#8FA28B]/10 blur-xl" />
            </div>
            
            {/* Content */}
            <div className="relative p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <motion.div
                      animate={{ rotate: [0, 8, -8, 0] }}
                      transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Leaf className="h-4 w-4 text-[#BDB76B]" />
                    </motion.div>
                    <span className="text-[12px] font-medium text-white/60 tracking-wide uppercase">Dashboard</span>
                  </div>
                  <p className="font-bold text-xl text-white tracking-tight">{session.name}</p>
                  <p className="text-[12px] text-white/50 mt-1.5 font-medium">
                    {isSuperAdmin ? 'Super Admin' : session.role === 'area_manager' ? 'เจ้าของแฟรนไชส์' : 'Branch Admin'}
                  </p>
                </div>
                {/* Notification */}
                <motion.button
                  onClick={() => setLocation('/admin/notifications')}
                  className="h-11 w-11 rounded-2xl bg-white/10 hover:bg-white/15 backdrop-blur-sm flex items-center justify-center transition-colors border border-white/10"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Bell className="h-5 w-5 text-white/80" />
                  {unreadCount > 0 && (
                    <motion.span
                      className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1 shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    >
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </motion.span>
                  )}
                </motion.button>
              </div>

            </div>
          </div>
        </motion.div>

        {/* ── Stats Grid ── */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.06, delayChildren: 0.15 } }
          }}
        >
          {statCards.map((stat) => (
            <StatCard key={stat.label} stat={stat} index={0} setLocation={setLocation} />
          ))}
        </motion.div>

        {/* ── Password Reset & Member Management ── */}
        {isSuperAdmin && (
          <motion.div
            className="space-y-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <SectionHeader icon={KeyRound} title="สมาชิก & รีเซ็ตรหัสผ่าน" count={2} color="#B8860B" />
            
            <div className="space-y-1.5">
              {/* Password Reset */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <div
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/90 backdrop-blur-sm border border-[#edf2ea] hover:border-[#d4dece] hover:shadow-[0_2px_12px_rgba(85,107,47,0.06)] cursor-pointer transition-all duration-200"
                  onClick={() => setLocation("/admin/password-resets")}
                >
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center relative" style={{ background: "rgba(184,134,11,0.1)" }}>
                    <KeyRound className="h-5 w-5" style={{ color: "#B8860B" }} />
                    {pendingResetCount > 0 && (
                      <motion.span
                        className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] rounded-full flex items-center justify-center px-0.5"
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        {pendingResetCount > 99 ? '99+' : pendingResetCount}
                      </motion.span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[13px] text-gray-800">คำขอรีเซ็ตรหัสผ่าน</p>
                      {pendingResetCount > 0 && (
                        <Badge className="text-[9px] bg-red-50 text-red-600 border-0 px-1.5 py-0">{pendingResetCount} รอดำเนินการ</Badge>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400 mt-0.5">ดูคำขอรีเซ็ตรหัสผ่านจากลูกค้า + สร้างลิงก์</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </motion.div>

              {/* Member Management */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <div
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/90 backdrop-blur-sm border border-[#edf2ea] hover:border-[#d4dece] hover:shadow-[0_2px_12px_rgba(85,107,47,0.06)] cursor-pointer transition-all duration-200"
                  onClick={() => setLocation("/admin/members")}
                >
                  <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ background: "rgba(85,107,47,0.1)" }}>
                    <UserCog className="h-5 w-5" style={{ color: "#556B2F" }} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[13px] text-gray-800">จัดการสมาชิก</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">ค้นหา/ดูข้อมูลสมาชิก + รีเซ็ตรหัสผ่าน</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-300" />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* ── Operations Section ── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Collapsible defaultOpen>
            <CollapsibleTrigger className="w-full flex items-center justify-between py-2 group">
              <SectionHeader icon={ClipboardList} title="ดำเนินการ" count={operationItems.length} color="#355E3B" />
              <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="space-y-1.5 mt-2">
                {operationItems.filter(item => !(item as any).managerOnly || ["branch_manager", "branch_owner", "area_manager", "super_admin"].includes(session?.role || "")).map((item, idx) => (
                  <MenuItemCard key={item.path} item={item} index={idx} setLocation={setLocation} />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        </motion.div>

        {/* Quick Access - permission-based */}
        {canViewCustomers && !isSuperAdmin && (
          <motion.div whileTap={{ scale: 0.98 }}>
            <div
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/90 backdrop-blur-sm border border-[#edf2ea] hover:border-[#d4dece] hover:shadow-[0_2px_12px_rgba(85,107,47,0.06)] cursor-pointer transition-all duration-200"
              onClick={() => setLocation("/admin/customers")}
            >
              <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ background: COLORS.sage.bg }}>
                <Database className="h-[18px] w-[18px]" style={{ color: COLORS.sage.text }} />
              </div>
              <div className="flex-1">
                <p className="font-medium text-[13px] text-gray-800">ข้อมูลลูกค้า</p>
                <p className="text-[11px] text-gray-400">ดูรายชื่อลูกค้าที่ลงทะเบียน</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300" />
            </div>
          </motion.div>
        )}

        {/* ── POS System Section ── */}
        {isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full flex items-center justify-between py-2 group">
                <SectionHeader icon={Monitor} title="ระบบ POS หน้าร้าน" count={posItems.length} color="#228B22" />
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1.5 mt-2">
                  {posItems.map((item, idx) => (
                    <MenuItemCard key={item.path} item={item} index={idx} setLocation={setLocation} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        )}

        {/* ── Management Menu Section ── */}
        {isSuperAdmin && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="w-full flex items-center justify-between py-2 group">
                <SectionHeader icon={Settings2} title="การจัดการ (Super Admin)" count={menuItems.length} color="#556B2F" />
                <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="space-y-1.5 mt-2">
                  {menuItems.map((item, idx) => (
                    <MenuItemCard key={item.path} item={item} index={idx} setLocation={setLocation} />
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </motion.div>
        )}

        {/* Bottom spacing */}
        <div className="h-4" />
      </div>
    </MobileLayout>
  );
}
