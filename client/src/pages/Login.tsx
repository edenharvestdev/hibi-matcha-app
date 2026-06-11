import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useHibiAuth } from "@/hooks/useHibiAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Phone, Lock, Eye, EyeOff, Leaf, Shield, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const LOGO_URL = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029164707/lBgSgkEWqcVXTljA.jpeg";
const HERO_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/310419663029164707/Vnv2Yn9Lbgw8vJ5BLPM68j/matcha-login-hero-7wMFXP9EwtQx82ZiL8Anad.webp";
const BARISTA_IMG = "https://files.manuscdn.com/user_upload_by_module/session_file/310419663029164707/rreCqMGdtCkcXIFT.png";

export default function Login() {
  const [, setLocation] = useLocation();
  const { session, loading: authLoading } = useHibiAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const utils = trpc.useUtils();

  const loginMutation = trpc.hibiAuth.login.useMutation({
    onSuccess: (data) => {
      toast.success(`ยินดีต้อนรับ ${data.name}`);
      utils.hibiAuth.me.invalidate();
      if (data.role === "customer") setLocation("/customer");
      else if (["branch_owner", "branch_manager", "branch_staff", "area_manager"].includes(data.role)) setLocation("/branch");
      else if (data.role === "support_staff") setLocation("/admin");
      else setLocation("/admin");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const staffLoginMutation = trpc.hibiAuth.staffLogin.useMutation({
    onSuccess: (data) => {
      toast.success(`ยินดีต้อนรับ ${data.name}`);
      utils.hibiAuth.me.invalidate();
      if (["branch_owner", "branch_manager", "branch_staff", "area_manager"].includes(data.role)) setLocation("/branch");
      else if (data.role === "support_staff") setLocation("/admin");
      else setLocation("/admin");
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  useEffect(() => {
    if (!authLoading && session) {
      if (session.role === "customer") setLocation("/customer");
      else if (["branch_owner", "branch_manager", "branch_staff", "area_manager"].includes(session.role)) setLocation("/branch");
      else if (session.role === "support_staff") setLocation("/admin");
      else setLocation("/admin");
    }
  }, [authLoading, session, setLocation]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf8]">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <img src={LOGO_URL} alt="Hibi Matcha" className="h-16 w-16 rounded-full border-2 border-emerald-100 shadow-md object-cover" />
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </motion.div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faf8]">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
      </div>
    );
  }

  const normalizePhone = (val: string) => val.replace(/\D/g, "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) {
      toast.error("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (isAdmin) {
      // Try login with phone first, if it looks like a phone number
      const isPhoneNumber = /^\d+$/.test(phone);
      if (isPhoneNumber) {
        loginMutation.mutate({ phone: normalizePhone(phone), password });
      } else {
        // It's an employee code
        staffLoginMutation.mutate({ employeeCode: phone, password });
      }
      return;
    }
    loginMutation.mutate({ phone: normalizePhone(phone), password });
  };

  const handleToggleMode = () => {
    setIsAdmin(!isAdmin);
    setPhone("");
    setPassword("");
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#fafcfa] overflow-hidden">
      {/* ===== DESKTOP LAYOUT ===== */}
      {/* AnimatePresence handles the swap animation on desktop */}
      <AnimatePresence mode="wait" initial={false}>
        {!isAdmin ? (
          <motion.div
            key="customer-layout"
            className="hidden lg:flex flex-1 flex-row min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Form LEFT */}
            <motion.div
              className="flex-1 flex flex-col justify-center px-14 xl:px-20 relative"
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            >
              <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #166534 1px, transparent 0)', backgroundSize: '28px 28px' }} />
              <div className="relative w-full max-w-md mx-auto">
                <DesktopForm isAdmin={isAdmin} onToggle={handleToggleMode} phone={phone} setPhone={setPhone} password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} handleSubmit={handleSubmit} isPending={loginMutation.isPending} setLocation={setLocation} />
              </div>
            </motion.div>
            {/* Image RIGHT */}
            <motion.div
              className="w-[45%] xl:w-[48%] relative"
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
            >
              <ImagePanel isAdmin={isAdmin} />
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="admin-layout"
            className="hidden lg:flex flex-1 flex-row min-h-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Image LEFT */}
            <motion.div
              className="w-[45%] xl:w-[48%] relative"
              initial={{ x: -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.15 }}
            >
              <ImagePanel isAdmin={isAdmin} />
            </motion.div>
            {/* Form RIGHT */}
            <motion.div
              className="flex-1 flex flex-col justify-center px-14 xl:px-20 relative"
              initial={{ x: 60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1], delay: 0.1 }}
            >
              <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #1f2937 1px, transparent 0)', backgroundSize: '28px 28px' }} />
              <div className="relative w-full max-w-md mx-auto">
                <DesktopForm isAdmin={isAdmin} onToggle={handleToggleMode} phone={phone} setPhone={setPhone} password={password} setPassword={setPassword} showPassword={showPassword} setShowPassword={setShowPassword} handleSubmit={handleSubmit} isPending={loginMutation.isPending} setLocation={setLocation} />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ===== MOBILE LAYOUT ===== */}
      <div className="lg:hidden flex flex-col min-h-screen">
        {/* Mobile hero image — top section */}
        <div className="relative h-48 overflow-hidden flex-shrink-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={isAdmin ? "mobile-img-admin" : "mobile-img-customer"}
              className="absolute inset-0"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4 }}
            >
              <img
                src={isAdmin ? BARISTA_IMG : HERO_IMG}
                alt="Matcha"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className={`absolute inset-0 ${
                isAdmin
                  ? "bg-gradient-to-b from-gray-900/40 via-emerald-900/30 to-[#fafcfa]"
                  : "bg-gradient-to-b from-emerald-900/40 via-emerald-800/30 to-[#fafcfa]"
              }`} />
              {/* Brand overlay on image */}
              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  className="text-center"
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 mb-2">
                    <motion.div
                      className="h-1.5 w-1.5 rounded-full bg-emerald-400"
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-white/90 text-xs font-medium">
                      {isAdmin ? "Staff Portal" : "Premium Matcha"}
                    </span>
                  </div>
                  <p className="text-white font-bold text-lg drop-shadow-md">
                    {isAdmin ? "พร้อมให้บริการ ทุกวัน" : "ชาเขียวคุณภาพ จากใจ สู่แก้ว"}
                  </p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Mobile form — main content */}
        <div className="flex-1 flex flex-col px-6 pt-6 pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={isAdmin ? "mobile-admin-form" : "mobile-customer-form"}
              className="flex-1 flex flex-col"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.35 }}
            >
              {/* Toggle + Logo row */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <img
                    src={LOGO_URL}
                    alt="Hibi Matcha"
                    className="h-10 w-10 rounded-full border-2 border-emerald-100 shadow-sm object-cover"
                  />
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">Hibi Matcha</h2>
                    <p className="text-[10px] text-gray-400">日々 Matcha Cafe</p>
                  </div>
                </div>
                <button
                  onClick={handleToggleMode}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium transition-all duration-300 shadow-sm ${
                    isAdmin
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-gray-50 text-gray-600 border border-gray-200"
                  }`}
                >
                  {isAdmin ? <User className="h-3.5 w-3.5" /> : <Shield className="h-3.5 w-3.5" />}
                  <span>{isAdmin ? "ลูกค้า" : "Admin"}</span>
                </button>
              </div>

              {/* Title */}
              <div className="mb-5">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                  {isAdmin ? "เข้าสู่ระบบ Admin" : "เข้าสู่ระบบ"}
                </h1>
                <p className="text-sm text-gray-500 mt-1">
                  {isAdmin ? "สำหรับพนักงานและผู้จัดการสาขา" : "กรอกข้อมูลเพื่อเข้าใช้งาน"}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 flex-1 flex flex-col">
                <div className="space-y-1.5">
                  <label htmlFor="m-phone" className="text-xs font-medium text-gray-600">
                    {isAdmin ? "เบอร์โทร / รหัสพนักงาน" : "เบอร์โทรศัพท์"}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="m-phone"
                      type={isAdmin ? "text" : "tel"}
                      inputMode={isAdmin ? "text" : "numeric"}
                      placeholder={isAdmin ? "เบอร์โทร หรือ รหัสพนักงาน" : "0812345678"}
                      value={phone}
                      onChange={(e) => setPhone(isAdmin ? e.target.value : normalizePhone(e.target.value))}
                      className="pl-10 h-12 bg-gray-50/80 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                      autoComplete={isAdmin ? "username" : "tel"}
                      maxLength={20}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="m-password" className="text-xs font-medium text-gray-600">
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="m-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 bg-gray-50/80 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {!isAdmin && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => setLocation("/forgot-password")}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      ลืมรหัสผ่าน?
                    </button>
                  </div>
                )}

                <div className="flex-1" />

                <Button
                  type="submit"
                  className={`w-full h-12 font-semibold text-base rounded-xl shadow-lg border-0 transition-all duration-300 ${
                    isAdmin
                      ? "bg-gray-900 hover:bg-gray-800 text-white shadow-gray-900/20"
                      : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                  }`}
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังเข้าสู่ระบบ...</>
                  ) : (
                    "เข้าสู่ระบบ"
                  )}
                </Button>

                {!isAdmin && (
                  <p className="text-center text-sm text-gray-500 pt-2">
                    ยังไม่มีบัญชี?{" "}
                    <button
                      type="button"
                      onClick={() => setLocation("/register")}
                      className="text-emerald-600 hover:text-emerald-700 font-semibold"
                    >
                      สมัครสมาชิก
                    </button>
                  </p>
                )}
              </form>

              {/* Social Login */}
              {!isAdmin && <SocialLoginButtons />}

              {/* Footer */}
              <p className="text-center text-[10px] text-gray-300 mt-4">
                Hibi Matcha Cafe © {new Date().getFullYear()}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ===== Desktop Form Component ===== */
function DesktopForm({
  isAdmin, onToggle, phone, setPhone, password, setPassword,
  showPassword, setShowPassword, handleSubmit, isPending, setLocation
}: {
  isAdmin: boolean;
  onToggle: () => void;
  phone: string;
  setPhone: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isPending: boolean;
  setLocation: (path: string) => void;
}) {
  const normalizePhone = (val: string) => val.replace(/\D/g, "");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="space-y-7"
    >
      {/* Toggle button */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
      >
        <button
          onClick={onToggle}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 shadow-sm hover:shadow-md active:scale-95 ${
            isAdmin
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
              : "bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          {isAdmin ? (
            <><User className="h-4 w-4" /><span>สำหรับลูกค้า</span></>
          ) : (
            <><Shield className="h-4 w-4" /><span>Admin</span></>
          )}
        </button>
      </motion.div>

      {/* Logo & Brand */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-5"
      >
        <div className="flex items-center gap-3">
          <motion.img
            src={LOGO_URL}
            alt="Hibi Matcha"
            className="h-12 w-12 rounded-full border-2 border-emerald-100 shadow-sm object-cover"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 300 }}
          />
          <div>
            <h2 className="text-lg font-semibold text-gray-900 tracking-tight">Hibi Matcha</h2>
            <p className="text-xs text-gray-400">日々 Matcha Cafe</p>
          </div>
        </div>

        <div className="space-y-1.5">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
            {isAdmin ? "เข้าสู่ระบบ Admin" : "เข้าสู่ระบบ"}
          </h1>
          <p className="text-gray-500 text-base">
            {isAdmin
              ? "สำหรับพนักงานและผู้จัดการสาขา"
              : "กรอกข้อมูลเพื่อเข้าใช้งานระบบ Hibi Matcha"}
          </p>
        </div>
      </motion.div>

      {/* Form */}
      <motion.form
        onSubmit={handleSubmit}
        className="space-y-5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
      >
        <div className="space-y-2">
          <label htmlFor="phone" className="text-sm font-medium text-gray-700">
            {isAdmin ? "เบอร์โทรศัพท์ / รหัสพนักงาน" : "เบอร์โทรศัพท์"}
          </label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
            <Input
              id="phone"
              type={isAdmin ? "text" : "tel"}
              inputMode={isAdmin ? "text" : "numeric"}
              placeholder={isAdmin ? "เบอร์โทร หรือ รหัสพนักงาน" : "0812345678"}
              value={phone}
              onChange={(e) => setPhone(isAdmin ? e.target.value : normalizePhone(e.target.value))}
              className="pl-12 h-13 bg-gray-50/80 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-base"
              autoComplete={isAdmin ? "username" : "tel"}
              maxLength={20}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            รหัสผ่าน
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-gray-400" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-12 pr-12 h-13 bg-gray-50/80 border-gray-200 rounded-xl text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-emerald-500/20 transition-all text-base"
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>
        </div>

        {!isAdmin && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setLocation("/forgot-password")}
              className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
            >
              ลืมรหัสผ่าน?
            </button>
          </div>
        )}

        <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}>
          <Button
            type="submit"
            className={`w-full h-13 font-semibold text-base rounded-xl shadow-lg border-0 transition-all duration-300 ${
              isAdmin
                ? "bg-gray-900 hover:bg-gray-800 text-white shadow-gray-900/20"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
            }`}
            disabled={isPending}
          >
            {isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" />กำลังเข้าสู่ระบบ...</>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </Button>
        </motion.div>
      </motion.form>

            {/* Social Login */}
      {!isAdmin && <SocialLoginButtons />}
      {/* Bottom links */}
      {!isAdmin && (
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <p className="text-sm text-gray-500">
            ยังไม่มีบัญชี?{" "}
            <button
              onClick={() => setLocation("/register")}
              className="text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
            >
              สมัครสมาชิก
            </button>
          </p>
        </motion.div>
      )}
      {/* Footer */}
      <p className="text-center text-xs text-gray-300 pt-2">
        Hibi Matcha Cafe © {new Date().getFullYear()}
      </p>
    </motion.div>
  );
}

/* ===== Image Panel Component ===== */
function ImagePanel({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="absolute inset-0">
      {/* Background image */}
      <AnimatePresence mode="wait">
        <motion.img
          key={isAdmin ? "barista" : "hero"}
          src={isAdmin ? BARISTA_IMG : HERO_IMG}
          alt="Matcha"
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </AnimatePresence>

      {/* Green gradient overlay */}
      <div className={`absolute inset-0 transition-all duration-700 ${
        isAdmin
          ? "bg-gradient-to-br from-gray-900/55 via-emerald-900/35 to-gray-900/45"
          : "bg-gradient-to-br from-emerald-900/55 via-emerald-800/35 to-emerald-700/45"
      }`} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10" />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-[20%] left-[15%] w-3 h-3 bg-white/10 rounded-full blur-[1px]"
          animate={{ y: [-10, 10, -10], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-[40%] right-[20%] w-2 h-2 bg-emerald-300/20 rounded-full"
          animate={{ y: [10, -10, 10], opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        />
        <motion.div
          className="absolute bottom-[30%] left-[30%] w-4 h-4 bg-white/5 rounded-full blur-[2px]"
          animate={{ y: [-15, 15, -15], x: [-5, 5, -5] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        />
        <motion.div
          className="absolute top-[60%] right-[35%] w-2.5 h-2.5 bg-emerald-200/15 rounded-full"
          animate={{ y: [5, -15, 5], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        />
        <motion.div
          className="absolute top-[15%] right-[10%] w-2 h-2 bg-white/8 rounded-full"
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
            className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10"
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
          transition={{ delay: 0.3, duration: 0.6 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/15"
            whileHover={{ scale: 1.03 }}
          >
            <motion.div
              className="h-2 w-2 rounded-full bg-emerald-400"
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-white/85 text-sm font-medium">
              {isAdmin ? "Staff Portal" : "Premium Matcha"}
            </span>
          </motion.div>
          <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
            {isAdmin ? (
              <>พร้อมให้บริการ<br /><span className="text-emerald-300">ทุกวัน ทุกสาขา</span></>
            ) : (
              <>ชาเขียวคุณภาพ<br /><span className="text-emerald-300">จากใจ สู่แก้ว</span></>
            )}
          </h2>
          <p className="text-white/50 text-base max-w-sm leading-relaxed">
            {isAdmin
              ? "ระบบจัดการสาขา แต้มสะสม และรีวิว สำหรับทีม Hibi Matcha"
              : "นำเข้ามัทฉะเกรดพรีเมียมจากญี่ปุ่นและจีน เบลนด์สูตรเฉพาะ"}
          </p>
        </motion.div>

        {/* Bottom — tagline */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex-1 h-px bg-white/15" />
          <p className="text-white/30 text-sm italic tracking-wide">日々 — ทุกวัน ทุกแก้ว</p>
          <div className="flex-1 h-px bg-white/15" />
        </motion.div>
      </div>
    </div>
  );
}

/* ===== Social Login Buttons ===== */
function SocialLoginButtons() {
  const oauthEnabled = import.meta.env.VITE_ENABLE_OAUTH === "true";
  if (!oauthEnabled) return null;

  const handleOAuth = (provider: "google" | "facebook" | "line") => {
    const redirectUri = `${window.location.origin}/oauth/callback`;
    const state = JSON.stringify({ provider, mode: "login", ts: Date.now() });
    const stateB64 = btoa(state).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    let url = "";
    if (provider === "google") {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || "",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state: stateB64,
        access_type: "offline",
        prompt: "select_account",
      });
      url = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
    } else if (provider === "facebook") {
      const params = new URLSearchParams({
        client_id: import.meta.env.VITE_FACEBOOK_APP_ID || "",
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "email,public_profile",
        state: stateB64,
      });
      url = `https://www.facebook.com/v19.0/dialog/oauth?${params}`;
    } else {
      const params = new URLSearchParams({
        response_type: "code",
        client_id: import.meta.env.VITE_LINE_CHANNEL_ID || "",
        redirect_uri: redirectUri,
        state: stateB64,
        scope: "profile openid email",
      });
      url = `https://access.line.me/oauth2/v2.1/authorize?${params}`;
    }
    window.location.href = url;
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-3 text-gray-400">หรือเข้าด้วย</span>
        </div>
      </div>
      <div className="flex gap-3 justify-center">
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          className="flex items-center justify-center w-12 h-12 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm"
          title="Google"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("facebook")}
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#1877F2] hover:bg-[#166FE5] transition-colors shadow-sm"
          title="Facebook"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        </button>
        <button
          type="button"
          onClick={() => handleOAuth("line")}
          className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#06C755] hover:bg-[#05B34B] transition-colors shadow-sm"
          title="LINE"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
            <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
