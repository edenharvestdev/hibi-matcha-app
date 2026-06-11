import { useLocation } from "wouter";
import { motion, type Variants } from "framer-motion";
import {
  Sparkles, Diamond, ShieldCheck, Building2, Truck, CalendarHeart, ChevronRight, Leaf, LogIn, UserPlus
} from "lucide-react";
import { useEffect, useState } from "react";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029164707/lBgSgkEWqcVXTljA.jpeg";
const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029164707/Vnv2Yn9Lbgw8vJ5BLPM68j/welcome-barista-admin-WtG7UzJzYMGzPdHPsTaTLv.webp";

const categories = [
  {
    id: "A",
    icon: Sparkles,
    label: "รีวิวรับโค้ดฟรี / แลกโค้ด",
    desc: "สั่ง 1 ออเดอร์ รีวิวรับ 1 โค้ดเครื่องดื่มฟรี",
    gradient: "from-amber-400 via-yellow-500 to-orange-500",
    bgGlow: "shadow-amber-200/40",
    ring: "ring-amber-100",
    path: "/login",
    requiresLogin: true,
  },
  {
    id: "B",
    icon: Diamond,
    label: "สะสมแต้ม",
    desc: "กรอกเลขบิล/สั่งซื้อ + ยอดเงิน รอเจ้าหน้าที่อนุมัติ",
    gradient: "from-violet-400 via-purple-500 to-indigo-600",
    bgGlow: "shadow-violet-200/40",
    ring: "ring-violet-100",
    path: "/login",
    requiresLogin: true,
  },
  {
    id: "C",
    icon: ShieldCheck,
    label: "แจ้งปัญหาออเดอร์",
    desc: "ออเดอร์ไม่สมบูรณ์? เลือกสาขาแจ้งปัญหาได้เลย",
    gradient: "from-rose-400 via-pink-500 to-fuchsia-600",
    bgGlow: "shadow-rose-200/40",
    ring: "ring-rose-100",
    path: "/login",
    requiresLogin: true,
  },
  {
    id: "D",
    icon: Building2,
    label: "สอบถามซื้อแฟรนไชส์",
    desc: "สนใจเปิดร้าน Hibi Matcha สาขาของคุณ",
    gradient: "from-emerald-400 via-green-500 to-teal-600",
    bgGlow: "shadow-emerald-200/40",
    ring: "ring-emerald-100",
    path: "/contact/franchise",
    requiresLogin: false,
  },
  {
    id: "E",
    icon: Truck,
    label: "สั่งซื้อชาราคาส่ง",
    desc: "สั่งซื้อ Matcha คุณภาพสำหรับร้านค้า/ธุรกิจ",
    gradient: "from-sky-400 via-cyan-500 to-blue-600",
    bgGlow: "shadow-sky-200/40",
    ring: "ring-sky-100",
    path: "/contact/wholesale",
    requiresLogin: false,
  },
  {
    id: "F",
    icon: CalendarHeart,
    label: "ติดต่อธุรกิจ / จัดงาน Event",
    desc: "จัดเลี้ยง, Event, Catering, Corporate Break",
    gradient: "from-indigo-400 via-blue-500 to-slate-700",
    bgGlow: "shadow-indigo-200/40",
    ring: "ring-indigo-100",
    path: "/contact/event",
    requiresLogin: false,
  },
];

export default function Welcome() {
  const [, setLocation] = useLocation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.25,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 16, scale: 0.96 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 260, damping: 20 },
    },
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white overflow-hidden">
      {/* ===== LEFT SIDE — Content ===== */}
      <motion.div
        className="flex-1 flex flex-col justify-center px-5 sm:px-8 lg:px-12 xl:px-16 py-8 lg:py-0 relative order-2 lg:order-1"
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Subtle background texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #166534 1px, transparent 0)', backgroundSize: '32px 32px' }} />

        <div className="relative w-full max-w-md mx-auto lg:mx-0">
          {/* Logo & Brand */}
          <motion.div
            className="flex items-center gap-3.5 mb-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div
              className="relative"
              whileHover={{ scale: 1.08 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <img
                src={LOGO_URL}
                alt="Hibi Matcha"
                className="h-14 w-14 rounded-2xl border-2 border-emerald-100 shadow-lg shadow-emerald-100/40 object-cover"
              />
              <motion.div
                className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 border-2 border-white"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Hibi Matcha</h2>
              <p className="text-xs text-gray-400 font-medium">日々 Matcha Cafe</p>
            </div>
          </motion.div>

          {/* Title */}
          <motion.div
            className="mb-7"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight leading-tight">
              ยินดีต้อนรับ
            </h1>
            <p className="text-sm text-gray-500 mt-2 font-medium">
              เลือกบริการที่ต้องการด้านล่าง
            </p>
          </motion.div>

          {/* Categories */}
          <motion.div
            className="space-y-3"
            variants={containerVariants}
            initial="hidden"
            animate={mounted ? "visible" : "hidden"}
          >
            {categories.map((cat) => (
              <motion.div
                key={cat.id}
                variants={itemVariants}
                whileHover={{ x: 6, transition: { duration: 0.2 } }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setLocation(cat.path)}
                className="group cursor-pointer"
              >
                <div className={`flex items-center gap-4 p-4 rounded-2xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg ${cat.bgGlow} transition-all duration-300`}>
                  {/* Premium gradient icon with inner glow */}
                  <div className={`relative h-12 w-12 rounded-xl bg-gradient-to-br ${cat.gradient} flex items-center justify-center flex-shrink-0 shadow-md ring-1 ${cat.ring}`}>
                    <div className="absolute inset-0 rounded-xl bg-white/10" />
                    <cat.icon className="h-5.5 w-5.5 text-white relative z-10 drop-shadow-sm" strokeWidth={1.8} />
                  </div>
                  {/* Text */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 group-hover:text-gray-900 transition-colors">
                      {cat.label}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {cat.desc}
                    </p>
                  </div>
                  {/* Arrow */}
                  <motion.div
                    className="flex-shrink-0"
                    initial={{ x: 0 }}
                    whileHover={{ x: 3 }}
                  >
                    <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
                  </motion.div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Login / Register buttons */}
          <motion.div
            className="mt-8 flex gap-3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
          >
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation("/login")}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-semibold text-sm shadow-lg shadow-emerald-600/25 hover:shadow-xl hover:shadow-emerald-600/30 transition-shadow"
            >
              <LogIn className="h-4 w-4" />
              เข้าสู่ระบบ
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation("/register")}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gray-50 border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-100 hover:border-gray-300 transition-all"
            >
              <UserPlus className="h-4 w-4" />
              สมัครสมาชิก
            </motion.button>
          </motion.div>

          {/* Footer */}
          <motion.p
            className="text-center text-[10px] text-gray-300 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
          >
            Hibi Matcha Cafe © {new Date().getFullYear()}
          </motion.p>
        </div>
      </motion.div>

      {/* ===== RIGHT SIDE — Image Panel (Desktop) ===== */}
      <motion.div
        className="hidden lg:block w-[45%] xl:w-[48%] relative order-2"
        initial={{ opacity: 0, x: 60 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
      >
        <WelcomeImagePanel />
      </motion.div>

      {/* ===== MOBILE — Hero Image (Top) ===== */}
      <div className="lg:hidden relative h-48 overflow-hidden flex-shrink-0 order-1">
        <img
          src={HERO_IMG}
          alt="Matcha Barista"
          className="absolute inset-0 w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/40 via-emerald-800/20 to-white" />
        {/* Brand overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 mb-2">
              <motion.div
                className="h-2 w-2 rounded-full bg-emerald-400"
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <span className="text-white text-xs font-semibold tracking-wide">Premium Matcha</span>
            </div>
            <p className="text-white font-bold text-xl drop-shadow-lg">
              ชาเขียวคุณภาพ <span className="text-emerald-300">จากใจ สู่แก้ว</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

/* ===== Desktop Image Panel ===== */
function WelcomeImagePanel() {
  return (
    <div className="absolute inset-0">
      {/* Background image — barista */}
      <img
        src={HERO_IMG}
        alt="Matcha Barista"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Green gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 via-emerald-800/30 to-emerald-700/40" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[18%] left-[12%] w-3 h-3 bg-white/10 rounded-full blur-[1px]"
          animate={{ y: [-12, 12, -12], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[38%] right-[18%] w-2.5 h-2.5 bg-emerald-300/20 rounded-full"
          animate={{ y: [8, -12, 8], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-[28%] left-[28%] w-4 h-4 bg-white/5 rounded-full blur-[2px]"
          animate={{ y: [-15, 15, -15], x: [-5, 5, -5] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-[55%] right-[30%] w-2 h-2 bg-emerald-200/15 rounded-full"
          animate={{ y: [5, -15, 5], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <motion.div
          className="absolute top-[12%] right-[8%] w-2 h-2 bg-white/8 rounded-full"
          animate={{ y: [-8, 8, -8], x: [3, -3, 3] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        />
      </div>

      {/* Content overlay */}
      <div className="relative h-full flex flex-col justify-between p-10 xl:p-14">
        {/* Top — decorative leaf */}
        <motion.div
          className="flex justify-end"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <motion.div
            className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15"
            whileHover={{ scale: 1.1, rotate: 15 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Leaf className="h-5 w-5 text-white/80" />
          </motion.div>
        </motion.div>

        {/* Center — brand message */}
        <motion.div
          className="space-y-5"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20"
            whileHover={{ scale: 1.03 }}
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-white/90 text-sm font-semibold tracking-wide">Premium Matcha</span>
          </motion.div>
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
            ชาเขียวคุณภาพ<br /><span className="text-emerald-300">จากใจ สู่แก้ว</span>
          </h2>
          <p className="text-white/55 text-base max-w-sm leading-relaxed">
            นำเข้ามัทฉะเกรดพรีเมียมจากญี่ปุ่นและจีน เบลนด์สูตรเฉพาะ
          </p>
        </motion.div>

        {/* Bottom — tagline */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <div className="flex-1 h-px bg-white/15" />
          <p className="text-white/35 text-sm italic tracking-wide">日々 — ทุกวัน ทุกแก้ว</p>
          <div className="flex-1 h-px bg-white/15" />
        </motion.div>
      </div>
    </div>
  );
}
