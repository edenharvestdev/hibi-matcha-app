import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PWAInstallBanner } from "./components/PWAInstallBanner";
import { SystemUpdatePopup } from "./components/SystemUpdatePopup";
import ImpersonateBar from "./components/ImpersonateBar";
import ScrollRestoration from "./components/ScrollRestoration";
import { lazy, Suspense } from "react";

// Lazy-loaded page components for code splitting
const NotFound = lazy(() => import("@/pages/NotFound"));

// Auth pages
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const StaffLogin = lazy(() => import("./pages/StaffLogin"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Customer pages
const CustomerHome = lazy(() => import("./pages/customer/CustomerHome"));
const SubmitReview = lazy(() => import("./pages/customer/SubmitReview"));
const MyRequests = lazy(() => import("./pages/customer/MyRequests"));
const MyCodes = lazy(() => import("./pages/customer/MyCodes"));
const MyPoints = lazy(() => import("./pages/customer/MyPoints"));
const PointsHistory = lazy(() => import("./pages/customer/PointsHistory"));
const ClaimPoints = lazy(() => import("./pages/customer/ClaimPoints"));
const RewardsCatalog = lazy(() => import("./pages/customer/RewardsCatalog"));
const ReportIssue = lazy(() => import("./pages/customer/ReportIssue"));
const FreeDrinks = lazy(() => import("./pages/customer/FreeDrinks"));
const CustomerAnnouncements = lazy(() => import("./pages/customer/Announcements"));
const SelectMenu = lazy(() => import("./pages/customer/SelectMenu"));
const SelectMenuCode = lazy(() => import("./pages/customer/SelectMenuCode"));
const HowToUse = lazy(() => import("./pages/customer/HowToUse"));
const Shop = lazy(() => import("./pages/customer/Shop"));
const ShopProductDetail = lazy(() => import("./pages/customer/ShopProductDetail"));
const ShopCart = lazy(() => import("./pages/customer/ShopCart"));
const ShopCheckout = lazy(() => import("./pages/customer/ShopCheckout"));
const ShopOrders = lazy(() => import("./pages/customer/ShopOrders"));
const ShopOrderDetail = lazy(() => import("./pages/customer/ShopOrderDetail"));
const OAuthCallback = lazy(() => import("./pages/customer/OAuthCallback"));
const ConnectedAccounts = lazy(() => import("./pages/customer/ConnectedAccounts"));

// Branch Admin pages
const BranchDashboard = lazy(() => import("./pages/branch/BranchDashboard"));
const ReviewQueue = lazy(() => import("./pages/branch/ReviewQueue"));
const ReviewDetail = lazy(() => import("./pages/branch/ReviewDetail"));
const CreateClaim = lazy(() => import("./pages/branch/CreateClaim"));
const RedeemCode = lazy(() => import("./pages/branch/RedeemCode"));
const GivePoints = lazy(() => import("./pages/branch/GivePoints"));
const PointClaimsQueue = lazy(() => import("./pages/branch/PointClaimsQueue"));
const BranchOrderIssues = lazy(() => import("./pages/branch/BranchOrderIssues"));
const BranchNotifications = lazy(() => import("./pages/branch/BranchNotifications"));
const StaffCodeRedeem = lazy(() => import("./pages/branch/StaffCodeRedeem"));
const BranchMenuAvailability = lazy(() => import("./pages/branch/BranchMenuAvailability"));
const EditCode = lazy(() => import("./pages/branch/EditCode"));
const BranchStaffManagement = lazy(() => import("./pages/branch/BranchStaffManagement"));
const BranchPendingCodesDashboard = lazy(() => import("./pages/branch/PendingCodesDashboard"));
const DailySales = lazy(() => import("./pages/branch/DailySales"));
const PettyCash = lazy(() => import("./pages/branch/PettyCash"));
const PettyCashSettings = lazy(() => import("./pages/branch/PettyCashSettings"));
const MultiBranchOverview = lazy(() => import("./pages/branch/MultiBranchOverview"));

// Super Admin pages
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const BranchManagement = lazy(() => import("./pages/admin/BranchManagement"));
const StaffManagement = lazy(() => import("./pages/admin/StaffManagement"));
const Reports = lazy(() => import("./pages/admin/Reports"));
const AreaManagerReport = lazy(() => import("./pages/admin/AreaManagerReport"));
const ContentManagement = lazy(() => import("./pages/admin/ContentManagement"));
const StaffNotificationList = lazy(() => import("./pages/admin/StaffNotificationList"));
const AuditLogs = lazy(() => import("./pages/admin/AuditLogs"));
const CustomerDatabase = lazy(() => import("./pages/admin/CustomerDatabase"));
const AdminReviewQueue = lazy(() => import("./pages/admin/AdminReviewQueue"));
const AdminReviewDetail = lazy(() => import("./pages/admin/AdminReviewDetail"));
const AdminCreateClaim = lazy(() => import("./pages/admin/AdminCreateClaim"));
const AdminRedeemCode = lazy(() => import("./pages/admin/AdminRedeemCode"));
const AdminRewards = lazy(() => import("./pages/admin/AdminRewards"));
const AdminGivePoints = lazy(() => import("./pages/admin/AdminGivePoints"));
const AdminDeductPoints = lazy(() => import("./pages/admin/AdminDeductPoints"));
const AdminPointClaims = lazy(() => import("./pages/admin/AdminPointClaims"));
const AdminOrderIssues = lazy(() => import("./pages/admin/AdminOrderIssues"));
const AdminInquiries = lazy(() => import("./pages/admin/AdminInquiries"));
const IssueDashboard = lazy(() => import("./pages/admin/IssueDashboard"));
const AdminCampaigns = lazy(() => import("./pages/admin/AdminCampaigns"));
const AdminAnnouncements = lazy(() => import("./pages/admin/AdminAnnouncements"));
const CodeList = lazy(() => import("./pages/admin/CodeList"));
const AdminReviewMenu = lazy(() => import("./pages/admin/AdminReviewMenu"));
const AdminOptionGroups = lazy(() => import("./pages/admin/AdminOptionGroups"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminPasswordResets = lazy(() => import("./pages/admin/AdminPasswordResets"));
const PendingCodesDashboard = lazy(() => import("./pages/admin/PendingCodesDashboard"));
const AdminShopProducts = lazy(() => import("./pages/admin/AdminShopProducts"));
const AdminShopOrders = lazy(() => import("./pages/admin/AdminShopOrders"));
const AdminCommissions = lazy(() => import("./pages/admin/AdminCommissions"));
const FranchiseOwnerManagement = lazy(() => import("./pages/admin/FranchiseOwnerManagement"));
const InStoreSales = lazy(() => import("./pages/admin/InStoreSales"));
const CommissionReport = lazy(() => import("./pages/admin/CommissionReport"));
const AdminSalesReport = lazy(() => import("./pages/admin/AdminSalesReport"));
const ZoneManagement = lazy(() => import("./pages/admin/ZoneManagement"));
const ImpersonatePanel = lazy(() => import("./pages/admin/ImpersonatePanel"));
const MarketingDashboard = lazy(() => import("./pages/admin/MarketingDashboard"));
const AnnouncementAnalytics = lazy(() => import("./pages/admin/AnnouncementAnalytics"));

// LINE LIFF page
const LinePage = lazy(() => import("./pages/LinePage"));

// Welcome & Contact
const Welcome = lazy(() => import("./pages/Welcome"));
const ContactForm = lazy(() => import("./pages/ContactForm"));

// POS Launcher (replaces old POS pages)
const POSLauncher = lazy(() => import("./pages/pos/POSLauncher"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-green-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">กำลังโหลด...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        {/* Welcome */}
        <Route path="/" component={Welcome} />
        <Route path="/welcome" component={Welcome} />

        {/* Auth */}
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/staff-login" component={StaffLogin} />
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPassword} />

        {/* Customer */}
        <Route path="/customer" component={CustomerHome} />
        <Route path="/customer/submit-review" component={SubmitReview} />
        <Route path="/customer/my-requests" component={MyRequests} />
        <Route path="/customer/my-codes" component={MyCodes} />
        <Route path="/customer/my-points" component={MyPoints} />
        <Route path="/customer/points-history" component={PointsHistory} />
        <Route path="/customer/claim-points" component={ClaimPoints} />
        <Route path="/customer/rewards" component={RewardsCatalog} />
        <Route path="/customer/report-issue" component={ReportIssue} />
        <Route path="/customer/free-drinks" component={FreeDrinks} />
        <Route path="/customer/announcements" component={CustomerAnnouncements} />
        <Route path="/customer/select-menu" component={SelectMenu} />
        <Route path="/customer/select-menu-code" component={SelectMenuCode} />
        <Route path="/customer/how-to-use" component={HowToUse} />
        <Route path="/customer/shop" component={Shop} />
        <Route path="/customer/shop/:id" component={ShopProductDetail} />
        <Route path="/customer/cart" component={ShopCart} />
        <Route path="/customer/checkout" component={ShopCheckout} />
        <Route path="/customer/orders" component={ShopOrders} />
        <Route path="/customer/orders/:id" component={ShopOrderDetail} />
        <Route path="/customer/connected-accounts" component={ConnectedAccounts} />

        {/* OAuth Callback */}
        <Route path="/oauth/callback" component={OAuthCallback} />

        {/* Branch Admin */}
        <Route path="/branch" component={BranchDashboard} />
        <Route path="/branch/reviews" component={ReviewQueue} />
        <Route path="/branch/reviews/:id" component={ReviewDetail} />
        <Route path="/branch/create-claim" component={CreateClaim} />
        <Route path="/branch/redeem" component={RedeemCode} />
        <Route path="/branch/give-points" component={GivePoints} />
        <Route path="/branch/point-claims" component={PointClaimsQueue} />
        <Route path="/branch/order-issues" component={BranchOrderIssues} />
        <Route path="/branch/notifications" component={BranchNotifications} />
        <Route path="/branch/code-redeem" component={StaffCodeRedeem} />
        <Route path="/branch/menu-availability" component={BranchMenuAvailability} />
        <Route path="/branch/codes" component={CodeList} />
        <Route path="/branch/edit-code/:id" component={EditCode} />
        <Route path="/branch/staff" component={BranchStaffManagement} />
        <Route path="/branch/pending-codes" component={BranchPendingCodesDashboard} />
        <Route path="/branch/daily-sales" component={DailySales} />
        <Route path="/branch/petty-cash" component={PettyCash} />
        <Route path="/branch/petty-cash/settings" component={PettyCashSettings} />
        <Route path="/branch/overview" component={MultiBranchOverview} />
        <Route path="/admin/edit-code/:id" component={EditCode} />

        {/* Super Admin */}
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/branches" component={BranchManagement} />
        <Route path="/admin/staff" component={StaffManagement} />
        <Route path="/admin/reports" component={Reports} />
        <Route path="/admin/area-reports" component={AreaManagerReport} />
        <Route path="/admin/content" component={ContentManagement} />
        <Route path="/admin/notifications" component={StaffNotificationList} />
        <Route path="/admin/audit-logs" component={AuditLogs} />
        <Route path="/admin/customers" component={CustomerDatabase} />
        <Route path="/admin/reviews" component={AdminReviewQueue} />
        <Route path="/admin/reviews/:id" component={AdminReviewDetail} />
        <Route path="/admin/create-claim" component={AdminCreateClaim} />
        <Route path="/admin/redeem" component={AdminRedeemCode} />
        <Route path="/admin/rewards" component={AdminRewards} />
        <Route path="/admin/give-points" component={AdminGivePoints} />
        <Route path="/admin/deduct-points" component={AdminDeductPoints} />
        <Route path="/admin/point-claims" component={AdminPointClaims} />
        <Route path="/admin/order-issues" component={AdminOrderIssues} />
        <Route path="/admin/inquiries" component={AdminInquiries} />
        <Route path="/admin/issue-dashboard" component={IssueDashboard} />
        <Route path="/admin/campaigns" component={AdminCampaigns} />
        <Route path="/admin/announcements" component={AdminAnnouncements} />
        <Route path="/admin/codes" component={CodeList} />
        <Route path="/admin/review-menu" component={AdminReviewMenu} />
        <Route path="/admin/option-groups" component={AdminOptionGroups} />
        <Route path="/admin/members" component={AdminCustomers} />
        <Route path="/admin/password-resets" component={AdminPasswordResets} />
        <Route path="/admin/pending-codes" component={PendingCodesDashboard} />
        <Route path="/admin/shop-products" component={AdminShopProducts} />
        <Route path="/admin/shop-orders" component={AdminShopOrders} />
        <Route path="/admin/commissions" component={AdminCommissions} />
        <Route path="/admin/franchise-owners" component={FranchiseOwnerManagement} />
        <Route path="/admin/in-store-sales" component={InStoreSales} />
        <Route path="/admin/commission-report" component={CommissionReport} />
        <Route path="/admin/sales-report" component={AdminSalesReport} />
        <Route path="/admin/zones" component={ZoneManagement} />
        <Route path="/admin/overview" component={MultiBranchOverview} />
        <Route path="/admin/impersonate" component={ImpersonatePanel} />
        <Route path="/admin/marketing" component={MarketingDashboard} />
        <Route path="/admin/announcement-analytics" component={AnnouncementAnalytics} />

        {/* POS Launcher */}
        <Route path="/pos" component={POSLauncher} />
        <Route path="/pos/:rest*">{() => <Redirect to="/pos" />}</Route>
        <Route path="/admin/pos/:rest*">{() => <Redirect to="/pos" />}</Route>

        {/* Contact forms (public) */}
        <Route path="/contact/:type" component={ContactForm} />

        {/* LINE LIFF */}
        <Route path="/line" component={LinePage} />

        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <ScrollRestoration />
          <ImpersonateBar />
          <Toaster />
          <Router />
          <PWAInstallBanner />
          <SystemUpdatePopup />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
