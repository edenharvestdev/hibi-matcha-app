# Hibi Matcha Cafe - Reward Code System TODO

## Database & Schema
- [x] Design and create all database tables (users, branches, staff, review_requests, codes, audit_logs)
- [x] Run migrations and verify schema

## Backend - Authentication
- [x] Phone + Password authentication (register/login)
- [x] Password hashing with bcrypt
- [x] Role-based access control (customer, branch_admin, super_admin)

## Backend - Business Logic
- [x] Review Reward (RV) submission and approval flow
- [x] Unique constraint for (delivery_app + order_id)
- [x] Code generation (unique codes with 30-day expiry)
- [x] Claim Compensation (CL) - auto-generate 2 codes
- [x] Code redemption system
- [x] Code status management (Issued/Redeemed/Expired/Cancelled)
- [x] Audit log recording for all actions
- [x] Image upload for review screenshots (S3)

## Frontend - Theme & Layout
- [x] Matcha green theme with Hibi logo
- [x] Mobile-first responsive design for Line Official Menu
- [x] Role-based navigation and routing

## Frontend - Customer Pages
- [x] Register page (phone, password, email, name)
- [x] Login page (phone + password)
- [x] Submit Review page (branch, delivery app, order ID, screenshot upload)
- [x] My Requests page (list with status)
- [x] Code Detail page (code, expiry, usage instructions)

## Frontend - Branch Admin Pages
- [x] Branch Dashboard (statistics summary)
- [x] Review Queue (pending reviews list)
- [x] Review Detail (approve/reject with image viewer)
- [x] Create Claim (auto-generate 2 codes)
- [x] Redeem Code (verify and redeem)

## Frontend - Super Admin Pages
- [x] Branch Management (CRUD branches)
- [x] Staff Management (manage staff and roles)
- [x] Reports (code usage reports)
- [x] Audit Logs (all actions log viewer)

## Testing
- [x] Unit tests for authentication
- [x] Unit tests for code generation and redemption
- [x] Unit tests for review approval flow

## Full Spec Updates
- [x] DB: Add `address` field to branches table
- [x] DB: Add `order_image_url` to review_requests
- [x] DB: Add `claim_reason`, `claim_order_id` to codes table
- [x] DB: Change audit_logs `details` to `before_data` (json) + `after_data` (json)
- [x] Backend: Update code format to HIBI-RV-XXXXXX / HIBI-CL-XXXXXX
- [x] Backend: Update claim creation with claim_reason and claim_order_id
- [x] Backend: Update audit log to use before_data/after_data json
- [x] Backend: Add reporting endpoints (per branch, approval rate, CSV export)
- [x] Frontend: Create ReviewDetail page (approve/reject with image viewer)
- [x] Frontend: Create CreateClaim page (with claim_reason, claim_order_id)
- [x] Frontend: Create RedeemCode page
- [x] Frontend: Create AdminDashboard page
- [x] Frontend: Create BranchManagement page
- [x] Frontend: Create StaffManagement page
- [x] Frontend: Create Reports page (with CSV export)
- [x] Frontend: Create AuditLogs page
- [x] Tests: Unit tests for code generation
- [x] Tests: Duplicate order prevention tests
- [x] Tests: Approval flow tests
- [x] Tests: Redeem flow tests
- [x] Tests: Permission access tests

## Admin Setup
- [x] Create initial Super Admin account in database

## Bug Fixes
- [x] Fix Super Admin Dashboard - navigation works via cards + bottom nav
- [x] Verify BranchManagement page has add/edit/delete functionality
- [x] Verify StaffManagement page has add/edit/delete functionality

## Customer Database Feature
- [x] Backend: Add API to list all customers with stats (total reviews, total codes)
- [x] Frontend: Create CustomerDatabase page for Super Admin
- [x] Add route and navigation link for Customer Database

## Bug: Cannot access system after login
- [x] Debug and fix post-login navigation/access issue

## Bug: Super Admin cannot access review queue to approve/reject
- [x] Make stat cards clickable on Admin Dashboard (link to review queue)
- [x] Add review queue page/route for Super Admin
- [x] Add review detail page for Super Admin to approve/reject
- [x] Update bottom nav to include review queue for Super Admin
- [x] Ensure Super Admin can approve/reject reviews and generate codes

## E2E Flow Testing
- [x] Test customer registration flow
- [x] Test customer submit review flow
- [x] Test admin approve review and code generation
- [x] Test code redemption flow
- [x] Fix any bugs found during testing

## Email Notification System
- [ ] Add email sending capability using Notification API
- [ ] Send code via email when review is approved
- [ ] Send codes via email when claim compensation is created
- [ ] Include code details, expiry date, and usage instructions in email

## Owner Notification Feature
- [x] Add notifyOwner when review is approved (include code + customer email)
- [x] Add notifyOwner when claim codes are created
- [x] Add notifyOwner when code is redeemed
- [x] Add notifyOwner when new review is submitted

## QR Code Feature
- [x] Install QR Code generation library (qrcode.react)
- [x] Add QR Code display on Code Detail page for customers
- [x] Add QR Code display on admin code views
- [x] QR Code should encode the code string for easy scanning at the store

## Improve New Review Notification
- [x] Enhance notification when new review is submitted with full details (customer name, branch, delivery app, order ID)

## QR Code Scanner Feature
- [x] Install QR code scanner library (html5-qrcode)
- [x] Create reusable QRScanner component with camera access
- [x] Add QR Scanner button/mode in branch RedeemCode page
- [x] Add QR Scanner button/mode in admin AdminRedeemCode page
- [x] Auto-fill scanned code into the search field and trigger lookup
- [x] Handle camera permissions and error states gracefully

## Loyalty Points System (Phase 1)
- [x] Create loyalty database tables (loyalty_points, point_transactions, point_claims, rewards)
- [x] Generate and apply migration SQL
- [x] Create DB helper functions for loyalty system
- [x] Create tRPC procedures for loyalty (earn, claim, redeem, history)
- [x] Customer page: My Points (balance, tier, QR code, progress bar)
- [x] Customer page: Points History (transaction list)
- [x] Customer page: Claim Points from Delivery (form with Order ID + screenshot)
- [x] Customer page: Rewards Catalog and Redeem
- [x] Branch staff page: Give Points at store (scan QR / search phone)
- [x] Branch staff page: Review delivery point claims queue
- [x] Admin page: Manage Rewards (CRUD)
- [x] Admin page: Review/approve delivery point claims
- [x] Admin page: Points settings (rate, tier thresholds) — hardcoded in Phase 1, configurable in Phase 2
- [x] Integrate with existing code redemption system for reward codes
- [x] Customer personal QR Code for identification at store
- [x] Design API structure for future Native App compatibility — tRPC procedures cleanly separated
- [x] Write vitest tests for loyalty system

## Seed Default Rewards
- [x] Add default rewards to database (Matcha Latte ฟรี, Topping ฟรี, etc.)
- [x] Verify rewards appear in customer catalog and admin panel

## Back-of-House System Analysis
- [x] Analyze how cost calculation and daily sales report can integrate with existing system

## PWA (Progressive Web App) Upgrade
- [x] Create PWA manifest.json (app name, icons, theme color, display: standalone)
- [x] Generate app icons in multiple sizes (192x192, 512x512)
- [x] Create service worker for offline caching
- [x] Add install prompt banner for mobile users
- [x] Add offline fallback page
- [x] Register service worker in main.tsx
- [x] Add meta tags for iOS (apple-touch-icon, apple-mobile-web-app-capable)
- [x] Test PWA installability

## Native App Design Spec
- [x] Create Native App design document with UI/UX flows
- [x] Define screen layouts for customer app (points, rewards, QR, claim)
- [x] Define screen layouts for staff app (give points, scan QR, redeem)
- [x] Document API endpoints needed for Native App
- [x] Technology recommendation (React Native / Flutter)

## LINE OA Notification System
- [ ] Create LINE Messaging API helper (push message, flex message)
- [ ] Request LINE_CHANNEL_ACCESS_TOKEN and LINE_CHANNEL_SECRET secrets
- [ ] Add LINE user ID field to customer profile (link LINE account)
- [ ] Send LINE notification when review is approved (with code)
- [ ] Send LINE notification when claim code is created
- [ ] Send LINE notification when delivery points are approved
- [ ] Send LINE notification when reward is redeemed (with redemption code)
- [ ] Create admin page for LINE OA settings and test message
- [ ] Add LINE account linking flow for customers
- [ ] Write vitest tests for LINE notification system

## Reward Images & LINE OA Integration
- [x] Add image upload to admin reward create/edit form (upload to S3)
- [x] Add tRPC procedure for reward image upload
- [x] Update rewards catalog UI to show reward images prominently
- [x] Improve reward card design with image, name, points, description
- [x] Create LINE LIFF-ready page (/line) for viewing codes and points from LINE OA
- [x] LIFF page: show customer codes, points balance, tier, rewards catalog
- [x] Add instructions for setting up LINE OA Rich Menu to link to LIFF page
- [x] Write vitest tests for reward image upload and CRUD

## Welcome Message System (A-I Categories)
- [x] Create Welcome/Landing page with 7 service categories (A-I)
- [x] A: รีวิวรับโค้ดฟรี + แลกโค้ด — link to existing review/code pages
- [x] B: สะสมแต้ม — add delivery app order ID format validation (Shopee/Lineman/Grab patterns)
- [x] B: สะสมแต้ม — order amount must match, branch approval required
- [x] C: แจ้งปัญหาออเดอร์ — DB schema for order_issues table with SLA tracking
- [x] C: แจ้งปัญหาออเดอร์ — customer form: select branch, describe issue, show branch phone for urgent
- [x] C: แจ้งปัญหาออเดอร์ — branch admin queue to review/resolve issues within SLA
- [x] C: แจ้งปัญหาออเดอร์ — SLA timer (24h response, 48h resolution) with escalation
- [x] D: สอบถามซื้อแฟรนไชส์ — contact inquiry form
- [x] F: สั่งซื้อชาราคาส่ง — wholesale inquiry form
- [x] I: ติดต่อธุรกิจ/จัดงาน Event — business/event inquiry form
- [x] DB: Create order_issues table with SLA fields
- [x] DB: Create contact_inquiries table for D/F/I
- [x] Backend: tRPC procedures for order issues CRUD + SLA
- [x] Backend: tRPC procedures for contact inquiries
- [x] Frontend: Welcome page with beautiful category cards
- [x] Frontend: Order issue form (C) with branch selection + phone display
- [x] Frontend: Contact/inquiry forms for D/F/I
- [x] Frontend: Branch admin order issues queue
- [x] Frontend: Admin view all inquiries
- [x] Add branch phone number field to branches table
- [x] Write vitest tests for new features (26 tests passed)

## GPOS (หน้าร้าน) Integration
- [x] Add "gpos" to delivery app enum in schema + routers
- [x] Add GPOS receipt number validation (13-digit format, e.g. 0105536123457)
- [x] Update ClaimPoints frontend to include GPOS option
- [x] Update ReportIssue frontend to include GPOS option
- [x] Update Welcome page description for walk-in customers
- [x] Write/update vitest tests for GPOS validation (115 tests passed)

## Bug Fixes
- [x] Fix "Failed to fetch" TRPCClientError on /login page (transient error from sandbox hibernation, server restarted)

## Health Check Endpoint
- [x] Add /api/health endpoint with server status + DB connectivity check
- [x] Write vitest test for health endpoint (5 tests passed)

## Admin Management System (Internal)
- [x] DB: Extended staff table with area_manager + support_staff roles
- [x] DB: Created staff_branches table for area_manager multi-branch assignment
- [x] DB: Created staff_permissions table for granular permission control
- [x] Define admin roles: super_admin, area_manager, branch_admin, support_staff
- [x] Define permissions: manage_branches, manage_staff, approve_reviews, approve_points, manage_rewards, view_reports, manage_issues, manage_inquiries, manage_customers, view_audit_logs
- [x] Backend: CRUD procedures for staff with roles + permissions + branch assignments
- [x] Backend: Permission check middleware (hasPermission) for admin actions
- [x] Backend: Default permissions per role
- [x] Frontend: Updated StaffManagement page with role selection + permission checkboxes + multi-branch
- [x] Frontend: Updated Login routing for new roles
- [x] Frontend: Updated useHibiAuth hook for new role checks
- [x] Write vitest tests for admin management (15 tests passed)

## Bug Fix + Order Issue Image Upload
- [x] Fix React hooks invalid call error (cleared Vite cache + added resolve.dedupe for React in vite.config.ts)
- [x] Add image upload to order issue report form (C) for customers to attach evidence photos
- [x] Backend: S3 upload for order issue images in tRPC procedure
- [x] Frontend: Image picker (camera/gallery) with preview and remove in ReportIssue form
- [x] Frontend: Display attached images in customer issue history
- [x] Frontend: Display images in admin/branch order issues detail dialog
- [x] Write vitest tests for image upload in order issues (3 tests added, 138 total passed)

## Multi-Image Upload for Order Issues (C)
- [x] DB: Create order_issue_images table to store multiple images per issue
- [x] Backend: Update tRPC submit procedure to accept array of images (max 5)
- [x] Backend: Upload multiple images to S3 and store URLs in new table
- [x] Backend: Backward compatible with legacy single imageBase64 field
- [x] Frontend: Update ReportIssue form to support multi-image picker (up to 5 images)
- [x] Frontend: Image grid preview with individual remove buttons and counter
- [x] Frontend: Display multiple images in customer issue history (grid with +N overlay)
- [x] Frontend: Display multiple images in admin/branch order issues detail dialog (2-col grid with links)
- [x] Write vitest tests for multi-image upload (3 new tests, 141 total passed)

## Image Lightbox
- [x] Create reusable ImageLightbox component (fullscreen overlay, swipe gestures, keyboard nav)
- [x] Integrate Lightbox into ReportIssue customer history (click to expand)
- [x] Integrate Lightbox into AdminOrderIssues detail dialog (click to expand)
- [x] BranchOrderIssues shares AdminOrderIssues component (already integrated)

## Issue Dashboard (Admin)
- [x] Backend: Add getIssueStats() DB function + tRPC stats procedure (super admin only)
- [x] Frontend: Create IssueDashboard page with horizontal bar charts (by category, by branch)
- [x] Frontend: SLA compliance rate display (response 24h + resolution 48h) with progress bars
- [x] Frontend: Status distribution chips + 7-day trend mini bar chart
- [x] Add route /admin/issue-dashboard and navigation link in AdminDashboard

## LINE OA Notification (Prepared Structure)
- [x] Backend: Create LINE Messaging API helper (push message, multicast, flex message templates)
- [x] Backend: Pre-built templates for issue acknowledged + issue resolved notifications
- [ ] Backend: Wire LINE notification triggers into orderIssues.acknowledge/resolve procedures (needs TOKEN)
- [ ] Prepare secret request for LINE_CHANNEL_ACCESS_TOKEN (waiting for user)
- [ ] Add LINE user ID field to customer profile (for future linking)
- [x] Write vitest tests for issue dashboard stats (2 new tests, 143 total passed)

## Auto-Reply Email for D/F/I Inquiries
- [x] Backend: Create email notification helper (Forge API + Resend fallback)
- [x] Backend: Create HTML email templates for each inquiry type (D/F/I) with Hibi Matcha branding
- [x] Backend: Auto-send thank you + confirmation email when inquiry is submitted (non-blocking)
- [x] Backend: Add tRPC procedure for admin to send follow-up email (inquiries.sendEmail)
- [x] Frontend: Add "ส่งอีเมลตอบกลับ" button in AdminInquiries detail dialog
- [x] Frontend: Email compose dialog with pre-filled templates per type + custom message
- [x] Frontend: Show "มีอีเมล" indicator in inquiry list cards
- [x] Write vitest tests for email auto-reply system (4 new tests, 147 total passed)

## 1. Free Drink Code System
- [x] DB: Create free_drink_campaigns table (name, description, menuOptions JSON, maxCodesPerCustomer, validFrom/Until, isActive)
- [x] DB: Create free_drink_codes table (campaignId, customerId, code, menuCode/Name, sizeCode/Name, milkCode/Name, status, expiresAt)
- [x] Backend: HQ campaign CRUD (create/list/getById/update/deactivate)
- [x] Backend: Code generation logic with readable format HIBI-{menu}-{size}-{milk}-{random} e.g. HIBI-ML-L-OAT-A7K2
- [x] Backend: Code redemption procedure (validate, check expiry, mark used with branchId/usedAt)
- [x] Backend: Issue code to customer (check campaign limit, generate unique code)
- [x] Frontend: HQ campaign management page (create/edit/toggle campaigns, issue codes to customers)
- [x] Frontend: Customer free drink codes page (list codes, show status/expiry, copy code)
- [x] Frontend: Staff/branch view to verify and redeem codes (StaffCodeRedeem page)

## 2. Branch-Specific Loyalty
- [x] DB: Create branch_loyalty_points table (customerId, branchId, totalPoints, usedPoints)
- [x] Backend: Sync branch points when earning at store (earnAtStore) and approving delivery claims (approveClaim)
- [x] Backend: Customer query for branch-specific points (myBranchPoints)
- [x] Backend: Get points for specific branch (branchPoints)
- [x] Frontend: Show branch-specific points balance in MyPoints page with info tooltip
- [ ] Frontend: Admin aggregate loyalty dashboard (coming next)

## 3. PDPA Consent & Confirmation Popups
- [x] DB: Create customer_consents table (customerId, consentType enum, version, accepted, acceptedAt)
- [x] Backend: Check consent status (check), accept consent (accept), acceptAll, consent history
- [x] Frontend: PDPA/Terms consent popup (ConsentPopup component) shown on CustomerHome if not accepted
- [x] Frontend: Confirmation popup before code redemption (in FreeDrinks page)
- [x] Frontend: Confirmation popup before reward exchange — เพิ่ม dialog แสดงชื่อรางวัล + แต้มที่ใช้ + แต้มคงเหลือ
- [x] Backend: Store consent records with timestamps and version tracking
- [x] Write vitest tests for all new features (8 new tests, 155 total passed)

## Bug Fixes
- [x] Fix PDPA consent popup cannot scroll on mobile - changed to bottom sheet layout with overflow-y-auto, fixed header/footer, touch scroll support

## Separate Approval Pages (A: Review/Free Code vs B: Points Accumulation)
- [ ] Analyze current BranchApprovals page and understand combined approval flow
- [ ] Create separate Review Approval page (A) - for reviewing customer reviews and issuing free drink codes
- [ ] Create separate Points Approval page (B) - for verifying receipts and approving point accumulation
- [ ] Update branch navigation to show two separate menu items
- [ ] Update routes in App.tsx
- [ ] Write tests for separated approval flows

## Grab Order ID Validation Improvements
- [x] DB: Add gfNumber and bookingId columns to point_claims table
- [x] Backend: Validate Booking ID format (A- + 14 alphanumeric = 16 total, locked like ID card)
- [x] Backend: Check Booking ID uniqueness among approved claims (reject duplicate)
- [x] Backend: Check Booking ID not already pending
- [x] Backend: On rejection, release Booking ID (allow resubmit)
- [x] Frontend: Split Grab claim form into 2 fields: GF number + Booking ID
- [x] Frontend: Real-time character count and format validation (like ID card input)
- [x] Frontend: Copy button for Booking ID in staff view
- [x] Frontend: Show both GF number + Booking ID in PointClaimsQueue for staff verification
- [x] Write vitest tests for Grab order ID validation (6 new tests, 161 total passed)

## Shopee Food Order ID Validation
- [x] DB: Add shopeeOrderNumber and shopeeOrderId columns to point_claims table
- [x] Backend: Add Shopee dual validation - Order # (short, e.g. #212) + Order ID (numeric 16-20 digits e.g. 3011303289058816525)
- [x] Backend: Validate Order ID format (numeric digits only, 16-20 chars), check uniqueness among approved claims
- [x] Backend: On rejection, release Order ID for resubmission (same pattern as Grab bookingId)
- [x] Frontend: Split Shopee claim form into 2 fields: Order # + Order ID (with real-time validation)
- [x] Frontend: Real-time format validation for both fields (digit counter, green/red border)
- [x] Frontend: Copy button for Order ID in staff view (PointClaimsQueue detail dialog)
- [x] Frontend: Show both Order # and Order ID in PointClaimsQueue list + detail for staff verification
- [x] Write vitest tests for Shopee order ID validation (7 new tests, 168 total passed)

## LINE MAN Order ID Validation
- [x] DB: Add linemanOrderNumber and linemanOrderId columns to point_claims table
- [x] Backend: Add LINE MAN dual validation - Order # (short, e.g. #5175) + รหัสใบสั่งซื้อ (e.g. LMF-260321-538845175)
- [x] Backend: Validate รหัสใบสั่งซื้อ format (LMF-YYMMDD-XXXXXXXXX, locked dash positions), check uniqueness among approved claims
- [x] Backend: On rejection, release รหัสใบสั่งซื้อ for resubmission (same pattern as Grab/Shopee)
- [x] Frontend: Split LINE MAN claim form into 2 fields: Order # + รหัสใบสั่งซื้อ (with real-time validation)
- [x] Frontend: Real-time format validation with locked dashes for LMF format (step-by-step hints)
- [x] Frontend: Copy button for รหัสใบสั่งซื้อ in staff view (PointClaimsQueue detail dialog)
- [x] Frontend: Show both Order # and รหัสใบสั่งซื้อ in PointClaimsQueue list + detail for staff verification
- [x] Write vitest tests for LINE MAN order ID validation (7 new tests, 175 total passed)

## Bug Fix: Customer List Shows 0 Results
- [x] Investigated: Query works fine, added LIMIT 200 pagination to prevent timeout on large datasets

## Staff Login Separation
- [x] Add employeeCode column to staff schema (DB migration 0009)
- [x] Add employeeCode input to staff create/edit form with auto-uppercase + copy button
- [x] Create separate /staff-login page with employeeCode + password login (emerald theme)
- [x] Add "สำหรับพนักงาน" link on main login page
- [x] Backend: staffLogin endpoint using employeeCode + password (separate from customer login)
- [x] Staff who registered as customer can login via /staff-login independently
- [x] Write vitest tests for staff login with employee code (4 new tests, 179 total passed)

## In-Store QR Scan Point Collection (Branch Admin)
- [x] Already implemented: GivePoints page with QR scanner + phone search + instant point addition
- [x] Already implemented: lookupCustomer + earnAtStore backend procedures
- [x] Already implemented: Full logging of in-store point additions

## Bug Fix: Staff Login with Employee Code Fails
- [x] Root cause: Orrawan had no employeeCode (NULL), was using EMP001 which belonged to another staff
- [x] Fixed: Set EMP002 for Orrawan + reset password to Orrawan2542

## Delete Staff/Admin Feature
- [x] Already exists: Toggle switch to disable/enable staff (soft delete, sufficient for resignation)

## Delete Rewards Feature
- [x] Backend: deleteReward procedure (super_admin only)
- [x] Frontend: Delete button with confirmation dialog in AdminRewards
- [x] Write vitest test for delete reward

## Customer Point History Page
- [x] Already exists at /customer/points-history with full transaction list

## Announcement & Promotion System
- [x] DB: Create announcements table (migration 0010)
- [x] Backend: CRUD procedures for announcements (create/listAll/listActive/update/delete)
- [x] Frontend: AdminAnnouncements page for super admin (create/edit/delete/pin/toggle)
- [x] Frontend: CustomerAnnouncements page with promo code copy button
- [x] Navigation: Added to admin dashboard + customer home menus
- [x] Write vitest tests for announcements (186 total tests passed)

## PWA Enhancement (Full Mobile App Experience)
- [x] Update manifest.json with complete PWA config (11 icon sizes, shortcuts, categories, display_override)
- [x] Generate high-quality app icons from Hibi Matcha logo (72-512px + maskable icons)
- [x] Create proper service worker v2 with multi-cache strategy (static/dynamic/CDN/fonts)
- [x] Add offline fallback page with auto-retry and online detection
- [x] Register service worker with update checking (every 60 min)
- [x] Add iOS-specific meta tags (apple-mobile-web-app-capable, black-translucent status bar, apple-touch-icon)
- [x] Add Android theme-color meta tag
- [x] Create install prompt component (beforeinstallprompt for Android, step-by-step iOS guide)
- [x] Add splash screen images for iOS (9 device sizes: iPhone 8 to iPad Pro 12.9")
- [x] Optimize viewport and mobile UX (viewport-fit=cover, safe-area-inset, overscroll-behavior)
- [x] Write vitest tests for PWA (45 tests covering manifest, SW, offline, meta tags, components, CSS)
- [x] All 231 tests passing (186 existing + 45 new PWA tests)

## Bug Fix: พนักงาน 2 คนล่าสุดเข้าระบบไม่ได้
- [x] Case 1 (HBCN-04): Login สำเร็จแล้ว redirect ไป /admin แล้วเกิด pushState error → แก้โดยให้ isAdmin เข้าได้
- [x] Case 2 (HBCN-03): Login ได้ เห็น dashboard แต่หน้าอนุมัติโค้ด/สะสมแต้มหมุนค้าง → แก้โดยให้ isAdmin เข้าได้
- [x] ตรวจสอบและแก้ไข redirect logic หลัง login → 7 หน้าใช้ isAdmin, 7 หน้า redirect ไป /admin
- [x] ตรวจสอบและแก้ไข loading state ในหน้า branch/admin
- [x] ทดสอบและยืนยันว่าแก้ไขสำเร็จ → 20 tests ผ่านทั้งหมด, 249 tests รวมผ่าน

## เปลี่ยนไอคอนแอพ PWA เป็นโลโก้ร้าน
- [x] สร้างไอคอน PWA ทุกขนาดจากโลโก้ร้าน Hibi Matcha (72-512px + maskable + favicon)
- [x] อัปโหลดไอคอนใหม่ขึ้น CDN (21 ไฟล์)
- [x] อัปเดต manifest.json ด้วย URL ไอคอนใหม่ (11 icons)
- [x] อัปเดต index.html (apple-touch-icon, favicon .ico/.png)
- [x] อัปเดต favicon ของเว็บ (16x16, 32x32, .ico)
- [x] ทดสอบ 251 tests ผ่านทั้งหมด

## Bug: รีวิว Grab ไม่แสดง Booking ID + ฟอร์มไม่บังคับกรอกครบ
- [x] DB: เพิ่มคอลัมน์ gfNumber, bookingId, shopeeOrderNumber, shopeeOrderId, linemanOrderNumber, linemanOrderId ใน review_requests
- [x] Backend: อัปเดต reviews.submit procedure รับ fields ใหม่ + validation
- [x] Frontend: แก้ฟอร์ม SubmitReview แยกช่องตามแอป + validation ครบ + lock ปุ่มส่ง
  - Grab: GF number + Booking ID (A- + 14 ตัว)
  - Shopee: เลขออเดอร์ + เลขคำสั่งซื้อ (16-20 หลัก)
  - LINE MAN: เลขออเดอร์ + รหัสใบสั่งซื้อ (LMF-YYMMDD-XXXXXXXXX)
  - GPOS: เลขที่ใบเสร็จ (13 หลัก)
- [x] Frontend: แก้หน้า AdminReviewDetail แสดงข้อมูลครบตามแอป
- [x] ทดสอบ 251 tests ผ่านทั้งหมด

## Bug: หน้าข้อมูลลูกค้าแสดง 0 รายการ + ระบบสิทธิ์ view_customers
- [x] แก้ bug: เปลี่ยน superAdminProcedure เป็น requirePermission("view_customers") + requirePermission("manage_customers")
- [x] เพิ่ม permission "view_customers" ใน ALL_PERMISSIONS + DEFAULT_ROLE_PERMISSIONS (area_manager ได้เป็น default)
- [x] อัปเดต backend: customerDb.list + stats ใช้ requirePermission("view_customers")
- [x] อัปเดต frontend: CustomerDatabase.tsx ใช้ canViewCustomers แทน isSuperAdmin
- [x] StaffManagement: view_customers อยู่ใน ALL_PERMISSIONS แล้ว → super_admin กำหนดได้ตอนสร้าง/แก้ไขพนักงาน
- [x] AdminDashboard: แสดงเมนู "ข้อมูลลูกค้า" สำหรับพนักงานที่มีสิทธิ์ canViewCustomers
- [x] ทดสอบ 251 tests ผ่าน + เพิ่ม permissions ใน AuthSession + hasPermission helper

## แยกหน้า Approval: A (รีวิว/โค้ดฟรี) vs B (สะสมแต้ม)
- [x] วิเคราะห์หน้า ReviewQueue + PointClaimsQueue ปัจจุบัน — แยกอยู่แล้วคนละหน้า
- [x] สร้างหน้า A: Review Approval — อนุมัติรีวิว + ออกโค้ดฟรี (แยกจาก point claims) — หน้าเดิมแยกอยู่แล้ว
- [x] สร้างหน้า B: Points Approval — ตรวจสอบบิล + อนุมัติสะสมแต้ม (แยกจาก reviews) — หน้าเดิมแยกอยู่แล้ว
- [x] อัปเดต navigation ใน AdminDashboard + branch menu ให้แสดง 2 เมนูแยก — แยกอยู่แล้ว
- [x] อัปเดต routes ใน App.tsx — แยกอยู่แล้ว

## Confirmation Popup ก่อนแลกรางวัล
- [x] เพิ่ม confirmation dialog ก่อนแลกรางวัล (rewards catalog) แสดงชื่อรางวัล + แต้มที่ใช้ + แต้มคงเหลือ + ไอคอนเตือน
- [x] ลูกค้าต้องกดยืนยันก่อนถึงจะแลกจริง

## ระบบเมนูรีวิว (Review Menu Selection)
- [x] DB: สร้างตาราง review_menu_items (id, code, name, description, isActive, sortOrder)
- [x] Backend: CRUD procedures สำหรับ admin จัดการเมนูรีวิว (create/list/update/delete/reorder)
- [x] Frontend: หน้า admin จัดการเมนูรีวิว (เพิ่ม/แก้ไข/ลบ/เรียงลำดับ)
- [x] DB: เพิ่มคอลัมน์ใน free_drink_codes — selectedMenuItemId, selectedMenuCode, selectedMenuName, sweetnessGrams, packagingType
- [x] Backend: procedure ให้ลูกค้าเลือกเมนู + ตัวเลือกหลังได้โค้ด
- [x] Frontend: หน้าเลือกเมนูสำหรับลูกค้า (เมนู + ความหวาน + แพ็คพร้อมดื่ม/แยกน้ำแข็ง)
- [x] Frontend: ปุ่ม Copy ข้อความสำเร็จรูป (โค้ด + เมนู + ตัวเลือก) สำหรับวางในแอป delivery
- [x] Frontend: แสดงข้อความ "ไม่สามารถเปลี่ยนนมได้" ชัดเจน
- [x] Frontend: แสดงสถานะโค้ด (ยังไม่ใช้/ใช้แล้ว/หมดอายุ) + วันหมดอายุ

## พนักงาน Mark โค้ดรีวิวใช้แล้ว + Order ID
- [x] Backend: procedure สำหรับพนักงาน mark โค้ดใช้แล้ว (staffCodeRedeem.lookup + staffCodeRedeem.redeem)
- [x] Backend: กรณี delivery ต้องกรอก Order ID ผูกกับโค้ด (1 โค้ด = 1 ออเดอร์)
- [x] Backend: กรณีหน้าร้าน ไม่ต้องกรอก Order ID
- [x] Frontend: หน้าพนักงานกรอกโค้ดรีวิว → แสดงข้อมูลเมนูที่ลูกค้าเลือก + ความหวาน + แพ็ค
- [x] Frontend: ฟอร์มกรอก Order ID (delivery) + เลือกแอป + ปุ่มยืนยัน mark ใช้แล้ว
- [x] Frontend: สรุปออเดอร์ในหน้า admin (เมนู + ความหวาน + แพ็ค + Order ID + พนักงานที่ทำ)
- [x] Write vitest tests สำหรับฟีเจอร์ใหม่ทั้งหมด (37 new tests, 288 total passed)

## เพิ่ม Super Admin ใหม่ (Nitirujzz@gmail.com)
- [x] สร้าง Super Admin account ใน DB (email: Nitirujzz@gmail.com, tel: 0992925456)
- [x] กำหนดรหัสงาน HBHQ-01 และรหัสผ่าน Niti@Hibi2026

## เพิ่ม Super Admin ใหม่ (Nitirujzz@gmail.com)
- [ ] สร้าง Super Admin account ใน DB (email: Nitirujzz@gmail.com, tel: 0992925456)

## Video Recording Script + คู่มือการใช้งาน
- [ ] สำรวจระบบทั้งหมด (routes, pages, features, roles)
- [ ] เขียน Vid- [x] Video Recording Script สำหรับ Training พนักงาน (11 Episodes)
- [x] คู่มือการใช้งานระบบฉบับสมบูรณ์ (แบ่งตาม Role)

## Bug: หน้าข้อมูลลูกค้า (/admin/customers) ไม่แสดงรายชื่อ
- [x] สาเหตุ: SQL subquery ใน listAllCustomers อ้างคอลัมน์ `status` แต่ตาราง codes ใช้ `codeStatus`
- [x] แก้ไข SQL subquery ให้ใช้ `codeStatus` แทน `status`
- [x] ทดสอบแล้วแสดงลูกค้า 143 คนถูกต้อง

## แสดงสาขาที่ลูกค้าสมัครใช้งานในหน้าข้อมูลลูกค้า
- [x] ตรวจสอบว่าลูกค้าผูกกับสาขาผ่าน review_requests.branchId (สาขาที่ลูกค้าส่งรีวิว)
- [x] แก้ไข backend listAllCustomers ให้ดึง primaryBranchName + branchNames
- [x] แก้ไข frontend CustomerDatabase ให้แสดงสาขาหลัก + สาขาทั้งหมดในแต่ละ card
- [x] เพิ่มตัวกรองตามสาขาในหน้าข้อมูลลูกค้า (dropdown เลือกสาขา)

## บังคับแนบรูปภาพรีวิว
- [x] แก้ไข frontend: เปลี่ยนจาก "ไม่บังคับ" เป็น "บังคับ" + validation + ปุ่มส่งจะ disabled ถ้าไม่แนบรูป
- [x] แก้ไข backend: imageBase64 เป็น required field (z.string().min(1))

## Bug: ลูกค้าที่โดนปฏิเสธรีวิวแล้วส่งใหม่ไม่ได้
- [x] สาเหตุ: unique index บน (deliveryApp, orderId) ทำให้ Order ID เดิมที่ถูก reject ส่งซ้ำไม่ได้
- [x] แก้ไข: เพิ่ม deleteRejectedReviewRequest() ลบ record ที่ถูก reject ก่อนสร้างใหม่

## แสดงรหัสคำสั่งซื้อครบถ้วนในหน้ารายละเอียดรีวิว
- [x] แก้ไข Branch ReviewDetail ให้แสดง GF Number + Booking ID (Grab), Shopee Order Number + Order ID, LINE MAN Order Number + Order ID
- [x] แก้ไข MyRequests ให้แสดงรหัสคำสั่งซื้อครบแทนแค่ orderId ตัวเดียว

## แสดงเหตุผลที่ถูกปฏิเสธในหน้าคำขอของฉัน
- [x] แสดง rejectionReason ชัดเจนในกล่องสีแดง + ปุ่ม "ส่งรีวิวใหม่" ในหน้าคำขอของฉัน

## ล็อกไม่ให้ส่งรีวิวซ้ำถ้า Order ID ได้รับโค้ดแล้ว
- [x] Backend: เพิ่ม checkApprovedReviewExists() ตรวจว่า Order ID ที่ approved แล้วไม่ให้ส่งซ้ำ (throw CONFLICT)
- [x] deleteRejectedReviewRequest ลบเฉพาะ rejected เท่านั้น (approved/pending ไม่โดนลบ)

## ปรับหน้าเลือกเมนูรีวิว: แสดงสรุป Copy ง่ายก่อนรีดีมโค้ด
- [x] ปรับ flow: หลังลูกค้าเลือกเมนู → แสดงสรุป (โค้ด + รหัสสินค้า + ชื่อเมนู + remark สั้นๆ) ก่อนหน้ารีดีมโค้ด
- [x] remark กระชับ: ระบุจำนวนอักษร เช่น ความหวาน เย็น/ร้อน
- [x] ปุ่ม Copy ข้อความทั้งหมดไปวางในแอป delivery ได้เลย
- [x] ต้องแสดงให้ลูกค้าเห็นก่อนใช้งานรีดีมโค้ด (ขั้นตอนชัดเจน)

## สาขา admin เปิดปิดรายการเมนูรีวิวแยกสาขา
- [x] DB: สร้างตาราง branch_menu_availability (branchId, menuItemId, isAvailable)
- [x] Backend: procedure ให้สาขา admin เปิด/ปิดเมนูรีวิวแต่ละรายการ
- [x] Backend: ลูกค้าเห็นเฉพาะเมนูที่สาขาเปิดอยู่
- [x] Frontend: หน้า Branch Admin จัดการเปิด/ปิดเมนูรีวิวแต่ละรายการ
- [x] Frontend: ลูกค้าเลือกเมนูจะเห็นเฉพาะเมนูที่สาขาเปิดอยู่
- [x] Write vitest tests สำหรับฟีเจอร์ใหม่ (18 tests passed)
## ปรับ SelectMenu ให้ filter เมนูตาม branchId ของโค้ดรีวิว
- [x] Backend: ปรับ listActive ให้รับ branchId แล้ว filter ตาม branch_menu_availability
- [x] Frontend: SelectMenu ส่ง branchId จากโค้ดไปดึงเมนูเฉพาะสาขา
- [x] ลูกค้าเห็นเฉพาะเมนูที่สาขาของโค้ดเปิดอยู่ (ไม่ต้องเลือกสาขาเอง)

## ปรับระบบสะสมแต้มให้แยกสาขา
- [x] ตรวจสอบ schema ปัจจุบัน: แต้มผูก branchId หรือยัง (มี branch_loyalty_points อยู่แล้ว)
- [x] DB: ปรับ/เพิ่ม branchId ในตาราง rewards/points ถ้ายังไม่มี (มีอยู่แล้ว)
- [x] Backend: แต้มสะสมแยกสาขา ไม่สามารถรวมข้ามสาขาแลกได้ (ปรับ redeemReward ใช้ spendBranchPoints)
- [x] Frontend: หน้าแลกของแสดงเฉพาะแต้มสาขานั้น (RewardsCatalog เลือกสาขาก่อนแลก)

## เพิ่มหน้าลูกค้าดูแต้มแยกสาขา
- [x] Frontend: หน้าลูกค้าแสดงแต้มแยกตามสาขา (เช่น ลาดพร้าว 20, นวมินทร์ 30) — มีใน MyPoints อยู่แล้ว
- [x] ลูกค้าเห็นชัดว่าแต่ละสาขามีกี่แต้ม แลกอะไรได้

## Redirect โดเมนเก่า → hibimatcha.love
- [x] ตั้ง redirect จาก URL เก่า (manus.space) → hibimatcha.love (Manus จัดการ DNS/proxy อัตโนมัติ ทั้ง 3 โดเมนใช้ได้)
- [x] ตรวจสอบว่า PWA ลูกค้าเดิมยังใช้งานได้ (URL เก่ายังใช้ได้ ไม่ถูกลบ)

## Vitest tests สำหรับฟีเจอร์ใหม่
- [x] Tests: branch-specific menu filtering (18 tests in branch-menu.test.ts)
- [x] Tests: branch-specific points/rewards (16 tests in branch-rewards.test.ts)

## Onboarding Pop-up หลังติดตั้งแอป
- [x] สร้าง OnboardingPopup component แสดงวิธีใช้งานระบบสะสมแต้ม (4 slides)
- [x] แสดงครั้งเดียวหลังลูกค้าล็อกอินครั้งแรก (localStorage flag)
- [x] ข้อความสั้น เข้าใจง่าย พร้อมภาพประกอบ icon
- [x] เพิ่มใน CustomerHome.tsx หลัง ConsentPopup (แสดงหลัง consent เสร็จ)
- [x] Write vitest tests (10 tests passed)

## ปรับระบบออกโค้ดชดเชย (one-by-one + รายละเอียดครบ)

- [x] DB: เพิ่ม fields ใน codes table (claimChannel, errorMenuCode, orderDetails, claimError, compensationMenuItemId/Code/Name, customExpiryDays)
- [x] Backend: ปรับ claims.create จาก 2 โค้ด → 1 โค้ด + รับ fields ใหม่ทั้งหมด
- [x] Backend: ระบุลูกค้าด้วย phone/openId/QR หรือ copy code เป็นตัวหนังสือ
- [x] Backend: กำหนดวันหมดอายุโค้ดได้ (customExpiryDays)
- [x] Frontend Admin: ฟอร์มออกโค้ดชดเชยใหม่ (ช่องทาง, สาขา, เลขออเดอร์, รหัสเมนู, รายละเอียดการสั่ง, ความผิดพลาด, ระบุลูกค้า, วันหมดอายุ)
- [x] Frontend Admin: ออก 1 โค้ด + แสดงโค้ดให้ copy ได้ (รหัสโค้ด + รหัสเมนู + รายละเอียด)
- [x] Frontend Branch: ปรับ CreateClaim.tsx ให้ตรงกับ API ใหม่
- [x] Frontend ลูกค้า: MyCodes แสดงรายละเอียดโค้ดครบ (ที่มา, เมนูชดเชย, วันหมดอายุ, ช่องทาง)
- [x] Frontend ลูกค้า: แยกแสดงโค้ดจากรีวิว / ให้ฟรี / ชดเชย (type badge)
- [x] Write vitest tests (26 tests in claim-codes.test.ts)

## ปรับฟอร์มแจ้งปัญหาออเดอร์ + ออกโค้ดชดเชยจากหน้าปัญหา

- [x] DB: เพิ่ม orderDetails column ใน order_issues table
- [x] Backend: ปรับ orderIssues.submit ให้รับ orderDetails field
- [x] Frontend ลูกค้า: ปรับฟอร์มแจ้งปัญหาทุกช่องทางให้มีเลขออเดอร์บังคับ (ยกเว้น walk_in) + ช่องรายละเอียดคำสั่งซื้อ
- [x] Frontend Admin/Branch: เพิ่มปุ่ม "ออกโค้ดชดเชย" ในหน้าปัญหาออเดอร์ (order-issues) dialog
- [x] Frontend Admin/Branch: auto-fill ข้อมูลลูกค้า + สาขา + ออเดอร์ + orderDetails จากปัญหาไปยังฟอร์มออกโค้ดชดเชย
- [x] Frontend Admin/Branch: แสดง orderDetails ใน issue detail dialog + issue list
- [x] Write vitest tests (21 tests ผ่าน: order details validation + compensation auto-fill)

## ระบบส่งเรื่องปัญหาไปสาขา + สาขาจัดการแก้ไขเอง

- [x] Backend: เมื่อลูกค้าแจ้งปัญหา → ส่งเรื่องไปสาขาที่เกี่ยวข้องอัตโนมัติ (notify owner + สาขา)
- [x] Backend: เพิ่มแนวทางแก้ปัญหาแนะนำ (suggested guideline) ตามประเภทปัญหา
- [x] Backend: เพิ่ม adminNote field สำหรับ admin ให้คำแนะนำสาขา
- [x] Frontend สาขา: ปรับหน้า BranchOrderIssues ให้จัดการได้เต็มรูปแบบ (รับทราบ, แก้ไข, ออกโค้ดชดเชย)
- [x] Frontend สาขา: แสดงแนวทางแก้ปัญหาแนะนำในแต่ละปัญหา
- [x] Frontend สาขา: แสดง adminNote คำแนะนำจาก HQ
- [x] Frontend Admin: เพิ่มช่องเขียนคำแนะนำ (adminNote) ส่งไปสาขา
- [x] Frontend Admin: ดูภาพรวมปัญหาทุกสาขา + ติดตามสถานะ
- [x] Frontend Admin: ส่งต่อปัญหาไปสาขาอื่นได้ (reassign)
- [x] Write vitest tests (13 tests ผ่าน: comp mode + remark + copyText)

## ปรับเมนูชดเชย: พิมพ์ชื่อเมนูที่พลาดเองได้

- [x] Frontend: เมนูชดเชยเลือกได้ 3 แบบ (ทำแก้วที่พลาดคืน / เลือกจากรายการ / พิมพ์เอง)
- [x] Frontend: ปรับทั้ง CreateClaim + AdminOrderIssues inline comp form
- [x] Backend: รองรับ customMenuName field สำหรับเมนูที่พิมพ์เอง

## เพิ่มรหัสเมนู + remark ในโค้ดชดเชย

- [x] Backend: เพิ่ม compensationRemark field ใน claims.create + copyText
- [x] Frontend CreateClaim: เพิ่มช่อง remark (หมายเหตุ เช่น หวานน้อย เย็น ไซส์ L)
- [x] Frontend AdminOrderIssues inline comp: เพิ่มช่อง remark
- [x] แสดงรหัสเมนู + remark ในผลลัพธ์โค้ด + copyText ให้หน้าร้านเห็นชัด

## ปรับ BranchOrderIssues จัดการปัญหาเต็มรูปแบบ

- [x] Frontend สาขา: dialog ดูรายละเอียดปัญหา + รูปภาพ + orderDetails
- [x] Frontend สาขา: ปุ่มรับทราบปัญหา (acknowledge)
- [x] Frontend สาขา: ปุ่มแก้ไขเสร็จ (resolve) พร้อมช่องบันทึกวิธีแก้
- [x] Frontend สาขา: ออกโค้ดชดเชยจากหน้าปัญหา (inline form 3 mode + remark)
- [x] Frontend สาขา: แสดงแนวทางแก้ปัญหาแนะนำ (suggested guideline)
- [x] Frontend สาขา: แสดง adminNote คำแนะนำจาก HQ

## เปลี่ยนสถานะอัตโนมัติเป็น resolved เมื่อออกโค้ดชดเชย

- [x] Backend: auto-resolve order issue เมื่อออกโค้ดชดเชยจากหน้าปัญหาสำเร็จ (ทั้ง admin + branch)
- [x] Frontend: แสดงสถานะ resolved อัตโนมัติหลังออกโค้ด

## Dashboard สรุปสถิติปัญหา

- [x] Backend: orderIssues.stats procedure มีอยู่แล้ว
- [x] Frontend: IssueDashboard มีอยู่แล้ว (/admin/issue-dashboard)
- [x] Frontend: route + navigation มีอยู่แล้ว
- [x] Write vitest tests (20 tests ผ่าน: branch issue mgmt + auto-resolve + SLA + guideline)

## Bug: โค้ดชดเชยไม่แสดงชื่อ/รหัสเมนู

- [x] ตรวจสอบ DB: ดูโค้ดที่ออกให้เบอร์ 0968129333 → compensationMenuCode/Name เป็น NULL
- [x] ตรวจสอบ backend claims.create: สาเหตุ = mode same_menu ไม่ได้ copy claimMenu ไป compensationMenu
- [x] แก้ bug: auto-fill compensationMenu จาก claimMenu เมื่อเลือก same_menu + copyText แสดงครบ

## เพิ่มเลขออเดอร์บังคับ + วันที่สั่งซื้อ ใน CreateClaim

- [x] Backend: เพิ่ม orderDate + compensationRemark columns ใน codes table + claims.create
- [x] Frontend CreateClaim: เพิ่มช่องวันที่สั่งซื้อ (date picker)
- [x] Frontend: แสดงเลขออเดอร์ + วันที่สั่งซื้อ ใน copyText + สรุปโค้ด

## เพิ่มหน้าแก้ไขโค้ด (Edit Code)

- [x] Backend: เพิ่ม codes.update + codes.getById procedures
- [x] Frontend: หน้า EditCode.tsx (แก้ชื่อเมนู, รหัสเมนู, remark, วันหมดอายุ, เลขออเดอร์, วันที่สั่ง)
- [x] Routes: /branch/edit-code/:id + /admin/edit-code/:id
- [x] Write vitest tests (20 tests ผ่าน: auto-fill bug fix + copyText + edit code + orderDate)

## เพิ่มปุ่มแก้ไขในหน้ารายการโค้ด

- [x] Frontend Admin: เพิ่มปุ่ม "แก้ไข" ในรายการโค้ด → ลิงก์ไป /admin/edit-code/:id (CodeList.tsx)
- [x] Frontend Branch: เพิ่มปุ่ม "แก้ไข" ในรายการโค้ด → ลิงก์ไป /branch/edit-code/:id (CodeList.tsx)

## แก้ไขโค้ดเบอร์ 0968129333

- [x] DB: อัปเดตโค้ด HIBI-CL-8G8USA เพิ่ม compensationMenuCode=HBC01M10C + compensationMenuName=Clear Matcha Saemidori

## แจ้งเตือนลูกค้าเมื่อโค้ดถูกแก้ไข

- [x] Backend: เพิ่ม notifyOwner เมื่อโค้ดถูกแก้ไข (codes.update)
- [x] Frontend: EditCode.tsx แสดง toast สำเร็จพร้อมข้อมูลที่แก้ไข

## แก้ไขข้อความตอบกลับแจ้งปัญหาออเดอร์

- [x] Backend: addAdminNote procedure มีอยู่แล้ว (สร้างในรอบก่อน)
- [x] Frontend Admin: adminNote แก้ไขได้ใน AdminOrderIssues dialog (มีอยู่แล้ว)
- [x] Frontend Branch: resolve + adminNote แสดงใน BranchOrderIssues (มีอยู่แล้ว)
- [x] Write vitest tests (มีอยู่แล้ว)

## เพิ่มปุ่มแก้ไขในหน้ารายการโค้ด + แก้โค้ด 0968129333 + แจ้งเตือน + แก้ข้อความตอบกลับ

- [x] Frontend Admin: สร้างหน้า CodeList.tsx รายการโค้ดทั้งหมด + ปุ่มแก้ไข + ค้นหา + filter
- [x] Frontend Branch: CodeList.tsx ใช้ร่วมกัน (/branch/codes)
- [x] เพิ่มลิงก์ใน AdminDashboard + BranchDashboard
- [x] DB: อัปเดตโค้ด HIBI-CL-8G8USA compensationMenuCode=HBC01M10C + Name=Clear Matcha Saemidori
- [x] Backend: เพิ่ม notifyOwner เมื่อโค้ดถูกแก้ไข
- [x] ปรับข้อความ toast + footer หลังแจ้งปัญหา (ละเอียดขึ้น + บอกโค้ดชดเชย)
- [x] Frontend ลูกค้า: แสดง adminNote (ข้อความจากทางร้าน) + resolution ในปัญหาของฉัน
- [x] Write vitest tests (14 tests ผ่าน)

## แสดงเมนูที่เคลม/ชดเชยในหน้า Redeem Code

- [x] Frontend Admin Redeem: เพิ่มแสดงเมนูที่เคลม (รหัส+ชื่อ) + เมนูชดเชย (รหัส+ชื่อ) + remark + เลขออเดอร์ + วันที่สั่ง
- [x] Frontend Branch Redeem: เพิ่มแสดงเมนูเหมือน Admin Redeem + ปุ่มแก้ไขโค้ด
- [x] Write vitest tests (20 tests ผ่าน - redeem-menu-display.test.ts)

## แก้ไขหน้าปัญหาออเดอร์ - ปุ่มแก้ไขข้อความ + ปุ่มกลับเมนู

- [x] Frontend Admin: เพิ่มปุ่มลบข้อความ resolution + adminNote แล้วเขียนใหม่
- [x] Frontend Branch: เพิ่มปุ่มลบข้อความ resolution + adminNote แล้วเขียนใหม่
- [x] Frontend: เพิ่มปุ่มกลับสู่เมนูหลัก (MobileLayout) ในหน้าปัญหาออเดอร์
- [x] Backend: เพิ่ม clearResolution + clearAdminNote procedure
- [x] Write vitest tests (18 tests ผ่าน - order-issue-clear.test.ts)

## แก้ไขหน้ารีวิว/สะสมแต้ม - แสดงข้อมูลเพิ่ม + ปุ่มอนุมัติจากปฏิเสธ

- [x] Frontend: แสดงวันที่สั่งคำขอใน dialog รายละเอียดคำขอ (Admin + Branch)
- [x] Frontend: แสดงเลขออเดอร์ 2 อัน (short + long) ใน list card + dialog (Admin + Branch)
- [x] Frontend: แสดงเลขคำสั่งซื้อแยกตามแอป (Grab/Shopee/LINE MAN) + ปุ่มคัดลอก
- [x] Frontend + Backend: เพิ่มปุ่มอนุมัติย้อนหลังจากสถานะปฏิเสธ (กรณีพนักงานเช็คผิด)
- [x] Write vitest tests (7 tests ผ่าน - point-claim-approve-rejected.test.ts)

## เพิ่ม Filter หน้าคำขอแต้ม

- [x] Backend: เพิ่ม branchId + date filter ใน claimsQueue procedure
- [x] Frontend Admin: เพิ่ม dropdown filter ตามสาขา
- [x] Frontend Branch: เพิ่ม filter ตามวันที่ (date picker + ปุ่มล้าง)
- [x] Write vitest tests (7 tests ผ่าน - claims-queue-filter.test.ts)

## Notification แจ้งเตือนคำขอแต้มใหม่

- [x] Backend: มี notifyOwner อยู่แล้วใน submitClaim procedure (แจ้งชื่อลูกค้า สาขา แอป ยอด)

## หาจุดตั้งค่าสินค้าแถมรีวิว

- [x] อยู่ที่ Admin Dashboard > "เมนูรีวิว" (path: /admin/review-menu) — AdminReviewMenu.tsx

## ระบบสิทธิ์สาขา (Branch Roles) — ปรับโครงสร้างใหม่

### Schema
- [x] เพิ่ม branch_owner + branch_staff ใน staffRole enum
- [x] เปลี่ยนชื่อ branch_admin → branch_manager ใน DB
- [x] อัปเดต drizzle schema ให้ตรงกับ DB

### Backend
- [x] อัปเดต middleware/procedures ให้รองรับ role ใหม่ทั้งหมด
- [x] Branch Owner: เพิ่ม/แก้ไข/ลบ staff ในสาขาตัวเอง + กำหนดสิทธิ์
- [x] Branch Owner: ดูข้อมูลสาขาตัวเองทั้งหมด (ยอด, ลูกค้า, คำขอแต้ม)
- [x] Branch Manager: สิทธิ์เหมือน branch_admin เดิม (เพิ่มโดย Owner)
- [x] Branch Staff: สิทธิ์จำกัดตามที่กำหนด

### Frontend
- [x] อัปเดต UI แสดง role ใหม่ทั้งระบบ
- [x] หน้าจัดการ staff สำหรับ Branch Owner
- [x] แยกสิทธิ์ UI ตาม role (owner/manager/staff)

### Tests
- [x] Write vitest tests สำหรับ role ใหม่

## เพิ่มวันที่สั่งซื้อ (orderDate) ในคำขอแต้ม Delivery
- [x] DB: เพิ่ม column orderDate ใน point_claims table
- [x] Backend: รับ orderDate ใน claimDeliveryPoints procedure
- [x] Frontend: เพิ่มช่องวันที่สั่งซื้อในฟอร์มลูกค้า ClaimPoints
- [x] Frontend: แสดงวันที่สั่งซื้อใน Admin/Branch Points Request dialog

## หน้าจัดการพนักงานสำหรับ Branch Owner
- [x] Backend: เพิ่ม procedure ให้ Branch Owner list staff ในสาขาตัวเอง
- [x] Backend: เพิ่ม procedure ให้ Branch Owner สร้าง staff ใหม่ (branch_manager/branch_staff) ในสาขาตัวเอง
- [x] Backend: เพิ่ม procedure ให้ Branch Owner แก้ไข/ปิดใช้งาน staff ในสาขาตัวเอง
- [x] Frontend: สร้างหน้า BranchStaffManagement.tsx สำหรับ Branch Owner
- [x] Frontend: เพิ่มเมนู "พนักงาน" ใน Branch Dashboard สำหรับ Owner

## แยก Dashboard ตาม role
- [x] Branch Owner: เห็นทุกเมนู (แดชบอร์ด, รีวิว, ใช้โค้ด, สาขา, พนักงาน)
- [x] Branch Manager: เห็นเมนูตามสิทธิ์ที่กำหนด
- [x] Branch Staff: เห็นเฉพาะเมนูที่มีสิทธิ์ (เช่น ใช้โค้ด, รีวิว)
- [x] ซ่อนเมนูที่ไม่มีสิทธิ์ใน MobileLayout bottom nav
- [x] Tests: เขียน vitest สำหรับ branch staff management + role-based menu (15 tests passed)

## Bug: พนักงานสาขาค้นหาโค้ดไม่เจอ แต่ Admin หาเจอ
- [x] ตรวจสอบ branch filtering ใน redeem/search code procedures
- [x] แก้ไขให้ branch staff ค้นหาโค้ดของสาขาตัวเองได้ (เปลี่ยน branchAdminProcedure → staffProcedure)
- [x] ทดสอบ + เขียน vitest (9 tests passed)

## Bug Round 2: ปัญหาระบบ admin หลังบ้าน
- [x] Bug 1: เจ้าของสาขา (branch_owner) ค้นหาโค้ด HIBI-RV-XY3D2P ใน Redeem ไม่เจอ — แต่ admin หลักหาเจอ (แก้ไขแล้วใน version ก่อนหน้า)
- [x] Bug 2: เจ้าของสาขาไม่มีหน้าเพิ่มพนักงานเอง + กำหนดสิทธิ์ไม่ได้ (มีอยู่แล้ว + เพิ่มปุ่ม re-enable)
- [x] Bug 3: ผู้จัดการเขต (area_manager) ที่มีสิทธิ์อนุมัติรีวิว กดอนุมัติไม่ได้จริง (ตรวจสอบแล้ว ทำงานถูกต้อง)
- [x] ทดสอบระบบทั้งหมดผ่าน browser

## เพิ่ม Branch Filter ในหน้ารีวิวรออนุมัติ
- [x] Backend: เพิ่ม branchId filter ใน review list procedure (มีอยู่แล้ว)
- [x] Frontend: เพิ่ม dropdown เลือกสาขาในหน้ารีวิวรออนุมัติ (Admin + Area Manager)
- [x] แสดงชื่อสาขาแทน #ID ในรายการรีวิว
- [x] ตรวจสอบ + แก้ปัญหาผู้จัดการเขตอนุมัติรีวิวไม่ได้ (ทำงานถูกต้อง)
- [x] ตรวจสอบหน้าจัดการพนักงานสำหรับเจ้าของสาขา + เพิ่มปุ่มเปิดใช้งานกลับ
- [x] เขียน vitest tests (12 tests passed)

## Pop-up แนะนำวิธีรีวิวก่อนส่งฟอร์ม
- [x] สร้าง pop-up/dialog แนะนำวิธีรีวิวที่ถูกต้อง (ต้องรีวิวในแอป + แคปหน้าจอ)
- [x] แสดง pop-up ก่อนเข้าฟอร์มส่งรีวิว (แสดงครั้งแรก + มีปุ่ม "เข้าใจแล้ว")
- [x] เพิ่มลิงก์ "วิธีรีวิว" ในหน้าฟอร์มเพื่อดูซ้ำได้
- [x] อัปเดตรูป infographic ใหม่ (CDN URL)

## Bug: Area Manager ดูรีวิวและอนุมัติไม่ได้
- [x] Bug: area_manager กดเข้ารีวิวรออนุมัติแล้วไม่มีรีวิวขึ้น (แก้ dashboard.stats + branchQueue ให้ดึงตาม assigned branches)
- [x] Bug: area_manager ไม่มีสิทธิ์เข้าถึงโค้ดที่ออก + โค้ดที่ใช้แล้ว (เพิ่ม listCodesByBranches + แก้ branchCodes procedure)
- [x] แก้ไข backend procedures ให้ area_manager ดูรีวิว + อนุมัติ + ดูโค้ดได้
- [x] แก้ไข frontend ให้ area_manager เข้าถึงหน้ารีวิว/โค้ดได้ (แก้ stat cards link)
- [x] เขียน vitest tests (17 tests passed)

## หน้ารายงานแบบย่อสำหรับ Area Manager
- [x] Backend: สร้าง getReportDataMultiBranch() ดึงข้อมูลรายงานเฉพาะ assigned branches
- [x] Backend: เพิ่ม reports.areaManagerSummary procedure
- [x] Frontend: สร้างหน้า AreaManagerReport.tsx แสดงสรุปรายงาน (รีวิว, โค้ด, แต้ม แยกตามสาขา)
- [x] Frontend: เพิ่มเมนู "รายงาน" ใน AdminDashboard สำหรับ area_manager
- [x] Route: เพิ่ม /admin/area-reports ใน App.tsx

## ระบบแจ้งเตือนรีวิวใหม่สำหรับ Area Manager
- [x] DB: สร้าง staff_notifications table
- [x] Backend: เพิ่ม notifyBranchStaff() เมื่อมีรีวิวใหม่เข้ามา (ใน submit review procedure)
- [x] Backend: แจ้งเตือนไปยัง area_manager + branch_owner/branch_manager ที่ดูแลสาขานั้น
- [x] Backend: CRUD procedures สำหรับ notifications (list, unreadCount, markRead, markAllRead)
- [x] Frontend: Bell icon บน AdminDashboard พร้อม badge จำนวนยังไม่อ่าน (auto-refresh 30s)
- [x] Frontend: หน้า StaffNotificationList แสดงรายการแจ้งเตือน + กดแล้วไปหน้ารีวิวที่เกี่ยวข้อง
- [x] เขียน vitest tests (22 tests passed)

## หน้าจัดการเนื้อหา (Infographic) สำหรับ Super Admin
- [x] DB: สร้าง site_content table เก็บ key-value (review_howto_image, etc.)
- [x] Backend: CRUD procedure สำหรับ site content (super_admin only) + upload รูปไป S3
- [x] Frontend: หน้า Admin จัดการเนื้อหา อัปโหลดรูป infographic + preview
- [x] Frontend: SubmitReview ดึงรูป infographic จาก DB แทน hardcode URL (fallback รูปเดิม)
- [x] Route: เพิ่ม /admin/content ใน App.tsx
- [x] เพิ่มเมนู "จัดการเนื้อหา" ใน AdminDashboard (Super Admin only)

## Popup แนะนำวิธีใช้งานเพิ่มเติม 3 จุด
- [x] เพิ่ม content keys ใน DB: redeem_howto_image, loyalty_howto_image, reward_redeem_howto_image
- [x] อัปเดตหน้าจัดการเนื้อหา (/admin/content) เพิ่มช่องอัปโหลดรูปสำหรับแต่ละ popup (4 ช่อง)
- [x] Popup วิธีลงทะเบียนรับสิทธิ์ — ใช้ HowToPopup component ใน SubmitReview (review_howto_image)
- [x] Popup วิธีใช้สิทธิ์ (ใช้โค้ด) — ใช้ HowToPopup component ใน MyCodes (redeem_howto_image)
- [x] Popup วิธีสะสมแต้ม — ใช้ HowToPopup component ใน ClaimPoints (loyalty_howto_image)
- [x] Popup วิธีรีดีมแต้ม — ใช้ HowToPopup component ใน RewardsCatalog (reward_redeem_howto_image)
- [x] เขียน vitest tests (9 tests passed)
- [x] Refactor SubmitReview ให้ใช้ HowToPopup component แทน inline popup

## ขั้นตอนเลือกเมนูก่อนใช้โค้ดรีวิว (ฝั่งลูกค้า)
- [ ] Backend: เพิ่ม public procedure ดึงรายการเมนูรีวิวที่ active สำหรับสาขาของโค้ด
- [ ] Frontend: เพิ่มขั้นตอนเลือกเมนูเมื่อกดใช้โค้ด (แสดงรหัส + ชื่อ + คำอธิบาย)
- [ ] Frontend: กรอก Remark (ข้อความอิสระ)
- [ ] Frontend: แสดงข้อความรวม (โค้ด | รหัสเมนู | Remark) พร้อมปุ่มก็อปปี้
- [ ] Frontend หน้าร้าน: เมื่อสแกน/กดรหัสโค้ดรีดีม แสดงเมนูเต็ม (รหัส + ชื่อ + Remark) + กดรีดีมได้เลย
- [ ] เขียน vitest tests

## แก้ระบบก็อปแค่รหัส + พนักงานสแกนถึงเห็นเมนู
- [x] FreeDrinks.tsx: ลบ buildOrderText / copyOrderText → ก็อปแค่รหัสโค้ดอย่างเดียว
- [x] FreeDrinks.tsx: ซ่อนข้อมูลเมนูที่ลูกค้าเลือกจากหน้าลูกค้า (ไม่แสดง selectedMenuName, ความหวาน, แพ็ค)
- [x] FreeDrinks.tsx: เพิ่มข้อความ hint "พนักงานจะสแกนโค้ดเพื่อดูเมนูที่คุณเลือกและยืนยันการใช้"
- [x] MyCodes.tsx: ก็อปแค่รหัสโค้ดอย่างเดียว ไม่แสดงเมนูชดเชย/รีวิว
- [x] MyCodes.tsx: เพิ่มข้อความ hint "พนักงานจะสแกน QR Code เพื่อดูเมนูและยืนยันการใช้โค้ด"
- [x] RedeemCode.tsx (branch): แสดงเมนูเต็มเมื่อสแกน + ปุ่มรีดีมเด่นชัด (สีแดง) + ข้อความ "ต้องกดยืนยันเพื่อป้องกันโค้ดค้าง"
- [x] AdminRedeemCode.tsx: แสดงเมนูเต็มเมื่อสแกน + ปุ่มรีดีมเด่นชัด + ข้อความบังคับกดรีดีม
- [x] StaffCodeRedeem.tsx: ไม่ต้องแก้ — แสดงเมนูเต็มอยู่แล้วเมื่อค้นหาโค้ด
- [x] เขียน vitest tests (13 tests passed)

## เพิ่ม QR Scanner ใน StaffCodeRedeem + Dashboard โค้ดค้าง
- [x] StaffCodeRedeem: เพิ่มปุ่มสแกน QR Code เหมือน RedeemCode
- [x] StaffCodeRedeem: Auto-fill โค้ดจาก QR และ trigger lookup
- [x] Dashboard โค้ดค้าง: Backend procedure สรุปจำนวนโค้ดที่ยังไม่ถูกรีดีม (แยกตามสาขา/ประเภท)
- [x] Dashboard โค้ดค้าง: Frontend page แสดงสรุปสถานะโค้ดค้าง
- [x] Dashboard โค้ดค้าง: เพิ่ม route + navigation link
- [x] เขียน vitest tests

## แก้ flow โค้ดรีวิว: กดใช้โค้ด → เลือกเมนูสาขา → activate ใช้ภายในวัน → แสดง QR
- [x] Backend: เพิ่ม activatedAt field ใน codes table
- [x] Backend: procedure เลือกเมนู + activate โค้ด (โหลดเมนูตามสาขาที่ออกโค้ด)
- [x] MyCodes.tsx: ไม่มีก็อป/QR → มีปุ่มใช้โค้ด → ไปหน้าเลือกเมนู → แสดง QR หลัง activate
- [- [x] SelectMenu.tsx: สร้าง SelectMenuCode.tsx ใหม่ โหลดเมนูตามสาขาที่ออกโค้ด + หลังเลือกแสดง QR (ใช้ภายในวัน)ในวัน)
- [x] vitest tests (10 tests passed)

## ลบฟังก์ชันเลือกความหวาน/แพ็ค → เปลี่ยนเป็น Remark
- [x] SelectMenuCode.tsx: ลบ Sweetness + Packaging → เพิ่มช่อง Remark ให้ลูกค้าพิมพ์เอง
- [x] Backend: เปลี่ยน sweetnessGrams/packagingType เป็น remark field
- [x] หน้าพนักงาน: แสดง Remark แทนความหวาน/แพ็ค
- [x] MyCodes.tsx: แสดง Remark แทนความหวาน/แพ็ค (ถ้ามี)
- [ ] vitest tests

## Bug: Role enum ไม่มี branch_owner + บันทึกพนักงานไม่ได้
- [x] Fix role enum ใน schema ให้มี branch_owner (มีอยู่แล้วถูกต้อง)
- [x] Fix frontend dropdown ให้มีตัวเลือก Branch Owner (มีอยู่แล้วถูกต้อง)
- [x] Fix StaffCodeRedeem TS errors (เปลี่ยนกลับเป็น sweetnessGrams/packagingType ตาม freeDrinkCodes table)

## Feature: ระบบ Option Groups สำหรับเมนูรีวิว
- [ ] Schema: สร้าง reviewMenuOptionGroups + reviewMenuOptions tables
- [ ] Backend: CRUD procedures สำหรับ option groups
- [ ] Admin UI: จัดการ option groups (สร้าง/แก้ไข/ลบ)
- [ ] SelectMenuCode: ลูกค้าเลือก options ตอนใช้โค้ด
- [ ] พนักงาน: เห็น options ที่ลูกค้าเลือกตอนสแกน
- [ ] vitest tests

## Bug: เมนูใน SelectMenuCode แสดง description ไม่ครบ (ถูกตัดข้อความ)
- [x] แก้ SelectMenuCode.tsx + SelectMenu.tsx ให้แสดง description ครบทั้งหมด ไม่ตัด (line-clamp)

## เพิ่มปุ่มคัดลอกโค้ดหลังยืนยันเลือกเมนู
- [x] เพิ่มปุ่ม "คัดลอกโค้ด" ในหน้า QR Code (SelectMenuCode.tsx) หลังยืนยันเลือกเมนู
- [x] เพิ่มปุ่ม "คัดลอกโค้ด" ในหน้า MyCodes.tsx สำหรับโค้ดที่ activate แล้ว (แสดง QR)

## Bug: หน้าสาขา RedeemCode ไม่แสดงข้อมูลเมนูที่ลูกค้าเลือก
- [x] ตรวจสอบ backend codes.lookup ว่า return selectedMenuCode, selectedMenuName, remark หรือไม่
- [x] ตรวจสอบ frontend RedeemCode.tsx ว่าแสดงข้อมูลเมนูที่ลูกค้าเลือกหรือไม่
- [x] แก้ไขให้แสดงเมนูที่ลูกค้าเลือก + remark ก่อนปุ่มยืนยัน

## Feature: Auto-expire โค้ดที่ activate แล้วรีเซ็ต selectedMenu หลังสิ้นวัน
- [x] เพิ่ม field activatedAt ใน codes table (มีอยู่แล้ว) เพื่อ track เวลาที่ลูกค้าเลือกเมนู
- [x] สร้าง backend logic ตรวจสอบว่า activatedAt ผ่านสิ้นวันหรือยัง → รีเซ็ต selectedMenu
- [x] ถ้าผ่านสิ้นวัน → รีเซ็ต selectedMenuCode, selectedMenuName, remark, activatedAt เป็น null
- [x] Frontend SelectMenuCode ให้ลูกค้าเลือกเมนูใหม่ได้เมื่อ selectedMenu ถูกรีเซ็ต

## Feature: ระบบ Option Groups (ความหวาน, ร้อน/เย็น ฯลฯ)
- [x] สร้าง option_groups table (id, name, type, sortOrder, isRequired, isActive)
- [x] สร้าง option_items table (id, groupId, name, sortOrder, isActive)
- [x] Admin CRUD สำหรับจัดการ Option Groups + Items (/admin/option-groups)
- [x] Frontend SelectMenuCode แสดง Option Groups (Radio/Checkbox) แทน free-text remark
- [x] บันทึก options ที่ลูกค้าเลือกลง remark field (รวม options + free text)

## Feature: แสดงข้อมูลเมนูในหน้า Redeem Success
- [x] หลังกดยืนยันใช้โค้ดสำเร็จ แสดงสรุปเมนูที่ต้องทำให้ลูกค้า (selectedMenuName + remark)
- [x] แสดง selectedMenuCode, selectedMenuName, remark/options ในหน้า success (RedeemCode.tsx)

## Feature: ผูก Option Groups กับเมนูรีวิว
- [x] สร้าง junction table menu_option_groups (menuType, menuId, optionGroupId)
- [x] เพิ่ม backend CRUD สำหรับผูก/ถอด option groups กับเมนูรีวิว
- [x] แก้ไข Admin Review Menu UI ให้เลือก option groups ได้ (เพิ่ม/แก้ไขเมนู)
- [x] แก้ไข SelectMenuCode ให้แสดง option groups เฉพาะที่ผูกกับเมนูที่ลูกค้าเลือก
- [x] ถ้าเมนูไม่มี option groups ผูก → ไม่แสดง option groups (fallback ไม่จำเป็น)

## Feature: ผูก Option Groups กับเมนูรีวิว + แลกสินค้า + สะสมแต้ม
- [x] สร้าง junction table menu_option_groups (menuType, menuId, optionGroupId) สำหรับผูก option groups กับเมนู
- [x] เพิ่ม backend CRUD สำหรับผูก/ถอด option groups กับเมนู
- [x] แก้ไข Admin Review Menu UI ให้เลือก option groups ได้ตอนสร้าง/แก้ไขเมนู
- [x] แก้ไข SelectMenuCode (รีวิว) ให้แสดง option groups เฉพาะที่ผูกกับเมนูที่เลือก
- [x] แก้ไขหน้าแลกสินค้า (Free Drink SelectMenu) ให้ใช้ option groups ตามเมนูที่เลือก + เพิ่ม remark column
- [x] หน้าสะสมแต้ม (RewardsCatalog) ไม่มีส่วนเลือกเมนู → ไม่ต้องเพิ่ม option groups

## Bug: เบอร์โทรลูกค้ารับตัวอักษรที่ไม่ใช่ตัวเลข
- [x] แก้ไข input เบอร์โทรตอนสมัคร — strip `-` ช่องว่าง ตัวอักษรอื่น รับเฉพาะตัวเลข
- [x] แก้ไข input เบอร์โทรตอน login — strip เหมือนกัน
- [x] แก้ไข backend validation — normalize เบอร์โทรก่อนบันทึก/ค้นหา
- [x] แก้ไข ContactForm, AdminGivePoints, BranchGivePoints, AdminCreateClaim, BranchCreateClaim — strip non-digits
- [x] แก้ไข backend staff.create + lookupCustomer — normalize phone

## Feature: ระบบรีเซ็ตรหัสผ่าน
- [x] สร้าง password_reset_requests table (id, customerId, phone/email, status, createdAt)
- [x] สร้าง password_reset_tokens table (id, customerId, token, expiresAt, usedAt)
- [x] สร้างหน้าลืมรหัสผ่าน — ลูกค้ากรอกเบอร์โทร/อีเมล ส่งคำขอ (/forgot-password)
- [x] สร้างหน้ารายการคำขอรีเซ็ต (Admin) — แสดงคำขอที่รอดำเนินการ (/admin/password-resets)
- [x] ปุ่มสร้างลิงก์รีเซ็ตรหัสผ่าน (มีอายุ 24 ชม.) + คัดลอกลิงก์
- [x] สร้างหน้าตั้งรหัสผ่านใหม่ — ลูกค้ากดลิงก์แล้วตั้งรหัสใหม่ (/reset-password)
- [x] เปลี่ยนสถานะคำขอเป็น "ดำเนินการแล้ว" เมื่อสร้างลิงก์
- [x] ลิงก์ "ลืมรหัสผ่าน?" ในหน้า Login

## Feature: หน้าจัดการสมาชิก (Admin)
- [x] สร้างหน้า Admin Members — ค้นหาสมาชิกด้วยชื่อ/เบอร์โทร/อีเมล (/admin/members)
- [x] แสดงข้อมูลสมาชิก (ชื่อ, เบอร์, อีเมล, วันสมัคร) + pagination
- [x] ปุ่มรีเซ็ตรหัสผ่านในหน้าข้อมูลสมาชิก (สร้างลิงก์ 24 ชม. + คัดลอก)
- [x] หน้าข้อมูลลูกค้า (/admin/customers) แสดงสถิติ + สาขา + รีวิว/โค้ด + filter สาขา

## Feature: ระบบเบิกจ่ายเงินสด (Petty Cash Management)
### Database & Schema
- [x] สร้าง petty_cash_settings table (branchId, alertThreshold, bankAccountInfo, allowedRole, isActive)
- [x] สร้าง petty_cash_transactions table (id, branchId, amount, type=deposit/expense/adjustment, description, category, receiptUrl, transferMethod, balanceAfter, createdBy, createdAt)
- [x] สร้าง petty_cash_fund_requests table (id, branchId, requestedAmount, reason, status, requestedBy, processedBy)
- [x] Run migration SQL

### Backend (tRPC + DB helpers)
- [x] DB helpers: getPettyCashSettings, upsertPettyCashSettings, getPettyCashBalance, listPettyCashTransactions, createPettyCashTransaction, getPettyCashSummary, countPettyCashTransactions
- [x] DB helpers: createFundRequest, listFundRequests, getFundRequestById, updateFundRequestStatus
- [x] tRPC router: pettyCash.getSettings / pettyCash.updateSettings (branch_owner only)
- [x] tRPC router: pettyCash.addDeposit (เงินเข้า — owner โอนให้พนักงาน)
- [x] tRPC router: pettyCash.addExpense (ลงรายจ่าย + แนบสลิป S3)
- [x] tRPC router: pettyCash.listTransactions (รายการเงินเข้า-ออก + pagination)
- [x] tRPC router: pettyCash.getBalance (ยอดคงเหลือปัจจุบัน)
- [x] tRPC router: pettyCash.requestFund / listFundRequests / processFundRequest
- [x] Low-balance alert logic (เช็คยอดหลังลงรายจ่าย ถ้าต่ำกว่า threshold → notify owner via staffNotifications)

### Frontend — Branch Staff/Manager
- [x] หน้า Petty Cash Dashboard (ยอดคงเหลือ, รายการล่าสุด, ปุ่มลงรายจ่าย)
- [x] ฟอร์มลงรายจ่าย (วันที่, ยอด, รายละเอียด, หมวดหมู่, ถ่ายรูป/แนบสลิป)
- [x] รายการธุรกรรมทั้งหมด (เงินเข้า/ออก + filter วันที่ + pagination)
- [x] แสดง alert เมื่อยอดต่ำกว่าที่ตั้งไว้ (badge + toast)

### Frontend — Branch Owner Settings
- [x] หน้าตั้งค่า Petty Cash (alertThreshold, bankAccount, allowedRole, isActive)
- [x] ฟอร์มเติมเงิน (จำนวน, วิธีโอน: cash/transfer/promptpay, หมายเหตุ)
- [x] ดูรายงานสรุปเบิกจ่ายของสาขา (ภาพรวม tab)

### Integration
- [x] เพิ่มเมนู Petty Cash ใน Branch navigation (bottom nav + dashboard quick action)
- [x] เพิ่มเมนู Petty Cash Settings ใน Branch Owner dashboard
- [x] Super Admin สามารถดูรายงาน petty cash ทุกสาขา (adminListBranches procedure)

## Bug: หน้า Dashboard ปัญหาออเดอร์ไม่มีปุ่มกลับหน้าหลัก
- [x] แก้ไขหน้า IssueDashboard ให้มีปุ่มกลับ / ใช้ MobileLayout ที่มี back button
- [x] แก้ไข AreaManagerReport, ContentManagement, StaffNotificationList ที่มี backPath แต่ไม่มี showBack

## Feature: แยกหมวดรีเซ็ตรหัสผ่านให้หาง่ายขึ้น
- [x] เพิ่มเมนูรีเซ็ตรหัสผ่านใน Admin Dashboard ให้เห็นชัดเจน + badge จำนวนคำขอรอ (แสดงจำนวนสีแดง)
- [x] หน้า AdminPasswordResets ใช้ MobileLayout พร้อม showBack + backPath
- [x] แยกหมวด "สมาชิก & รีเซ็ตรหัสผ่าน" ออกมาเป็น section แยกใน Dashboard

## Feature: ปรับปรุงระบบรางวัลแต้มสะสม
- [x] หมวดหมู่รางวัลตั้งค่าเองได้ (admin เพิ่ม/แก้ไข/ลบ) — reward_categories table + CRUD
- [x] ผูกรางวัลกับระบบ menu options (เหมือนแลกรีวิว — เลือก option groups ในฟอร์มสร้าง/แก้ไขรางวัล)
- [x] ช่องรายละเอียดเปลี่ยนเป็น textarea หลายบรรทัด
- [x] ยกเลิกระบบ tier — ทุกคนได้อัตราเดียวกัน 10 บาท = 1 แต้ม
- [x] ลบ tier badge/progress จาก MyPoints, LinePage, AdminGivePoints, BranchGivePoints, Announcements

## Feature: ระบบ Shop กลาง (Central Store)

### Database & Schema
- [x] สร้าง product_categories table (id, name, description, sortOrder, isActive)
- [x] สร้าง products table (id, name, description, images, retailPrice, wholesalePrice, wholesaleMinQty, sku, categoryId, stock, isActive)
- [x] สร้าง cart_items table (id, customerId, productId, quantity)
- [x] สร้าง orders table (id, customerId, orderNumber, status, totalAmount, shippingMethod, shippingFee, shippingAddress, paymentMethod, paymentSlipUrl, note, deliveryCodeId)
- [x] สร้าง order_items table (id, orderId, productId, productName, price, quantity, subtotal)
- [x] สร้าง branch_commission_settings table (id, branchId, commissionRate, minSalesForRate)
- [x] สร้าง commission_records table (id, orderId, branchId, amount, rate, status)
- [x] Run migration SQL

### Backend (tRPC + DB helpers)
- [x] Product CRUD (admin) — สร้าง/แก้ไข/ลบสินค้า + หมวดหมู่
- [x] Product catalog (public) — ดูสินค้า + filter หมวดหมู่ + ราคาปลีก/wholesale
- [x] Cart management — เพิ่ม/ลบ/แก้จำนวน + ดูตะกร้า
- [x] Order creation — checkout + เลือกวิธีรับ (รับเอง/จัดส่ง/โค้ด Delivery)
- [x] Payment — โอนเงิน+แนบสลิป (เตรียม payment gateway อนาคต)
- [x] Order management (admin) — ดูออเดอร์ + เปลี่ยนสถานะ + ยืนยันชำระเงิน
- [x] Commission calculation — คำนวณคอมมิชชันตามสาขาที่ลูกค้าสมัคร
- [x] Commission settings (admin) — ตั้งค่า % คอมต่อสาขา

### Frontend — ลูกค้า
- [x] หน้าแคตตาล็อกสินค้า (grid + filter หมวดหมู่ + ค้นหา)
- [x] หน้ารายละเอียดสินค้า (รูป, คำอธิบาย, ราคาปลีก/wholesale, เพิ่มตะกร้า)
- [x] หน้าตะกร้าสินค้า (แก้จำนวน, ลบ, ยอดรวม)
- [x] หน้า Checkout (เลือกวิธีรับ, กรอกที่อยู่, แนบสลิป)
- [x] หน้าประวัติคำสั่งซื้อ + ติดตามสถานะ

### Frontend — Admin
- [x] หน้าจัดการสินค้า (CRUD + อัพรูป + ตั้งราคาปลีก/wholesale)
- [x] หน้าจัดการหมวดหมู่สินค้า
- [x] หน้าจัดการออเดอร์ (ดูรายการ + เปลี่ยนสถานะ + ยืนยันชำระเงิน)
- [x] หน้าตั้งค่าคอมมิชชัน franchise (ต่อสาขา)
- [x] หน้ารายงานคอมมิชชัน (ยอดขายต่อสาขา + คอมที่ต้องจ่าย)

### Integration
- [x] เพิ่มเมนู Shop ใน customer navigation
- [x] เพิ่มเมนูจัดการ Shop ใน admin dashboard
- [x] ผูกคอมมิชชันกับสาขาที่ลูกค้าสมัคร (customers.registeredBranchId)

## Feature: ระบบแจ้งเตือนลูกค้า
- [ ] แจ้งเตือนเมื่อมีรางวัลใหม่
- [ ] แจ้งเตือนเมื่อแต้มใกล้หมดอายุ (ถ้ามีระบบหมดอายุ)
- [ ] แจ้งเตือนสถานะออเดอร์ shop

## Feature: รายงานสรุปรางวัล
- [ ] เพิ่มฟิลด์ต้นทุนรางวัล (costPrice) ในตาราง rewards
- [ ] เพิ่มราคาสินค้า (retailPrice) ในการแสดงรางวัล
- [ ] รายงานรางวัลยอดนิยม + จำนวนแลก + ต้นทุนรวม

### Testing
- [x] Vitest: Shop categories procedure existence (5 tests)
- [x] Vitest: Shop products procedure existence (7 tests)
- [x] Vitest: Cart procedure existence (5 tests)
- [x] Vitest: Shop orders procedure existence (6 tests)
- [x] Vitest: Commissions procedure existence (3 tests)
- [x] Vitest: Price formatting and wholesale eligibility (2 tests)
- [x] All 28 shop tests passing

## Bug: ลิงก์รีเซ็ตรหัสผ่านใช้ domain manus.space แทน custom domain
- [x] แก้ไขลิงก์รีเซ็ตรหัสผ่านให้ใช้ hibimatcha.love เสมอ (hardcode domain)
- [x] Hardcode domain hibimatcha.love สำหรับลิงก์รีเซ็ตรหัสผ่าน แทนการใช้ window.location.origin
- [x] เพิ่มปุ่ม "เปิดคำขอใหม่" + "สร้างลิงก์ใหม่" สำหรับคำขอที่ดำเนินการแล้ว

## Feature: ระบบบัญชีสาขาย่อยรายวัน (Daily Branch Accounting)
### Schema & Permissions
- [x] เพิ่ม permission "manage_accounting" ใน ALL_PERMISSIONS + DEFAULT_ROLE_PERMISSIONS
- [x] สร้าง daily_sales_records table (ยอดขายรายวัน: เงินสด, โอน, EDC, Delivery + ช่องทางเพิ่มเติม)
- [x] สร้าง daily_sales_extra_channels table (ช่องทางเพิ่มเติม)
- [x] Run migration SQL
### Petty Cash Permission Update
- [x] แก้ petty cash updateSettings ให้ branch_manager ตั้งค่าได้ (นอกจาก branch_owner/super_admin)
- [x] แก้ area_manager ตั้งค่า petty cash ให้สาขาในเขตได้
### Backend
- [x] DB helpers สำหรับ daily sales CRUD
- [x] tRPC procedures: บันทึกยอดขายรายวัน, ดูรายการ, สรุปรายเดือน, รายงานรวมทุกสาขา
### Frontend
- [x] หน้าบันทึกยอดขายรายวัน (เงินสด/โอน/EDC/Delivery + เพิ่มช่องทาง)
- [x] หน้าสรุปยอดขายรายเดือน/รายวัน
- [x] เพิ่มเมนูบัญชีสาขาใน branch admin navigation
- [x] อัปเดต petty cash settings UI ให้ branch_manager ตั้งค่าได้
- [x] รายงานยอดขายรวมทุกสาขา สำหรับ super admin / area manager
### Testing
- [x] Vitest: daily sales CRUD + permission checks (11 tests passed)

## Feature: บังคับแนบรูปสลิป/ใบเสร็จ Petty Cash
- [x] receiptUrl มีอยู่แล้วใน schema (ไม่ต้องเพิ่ม)
- [x] ไม่ต้อง migration (มี column อยู่แล้ว)
- [x] อัปเดต backend: บังคับ receiptImage ใน addExpense (z.string().min(1))
- [x] อัปเดต backend: ใช้ storagePut ที่มีอยู่แล้ว (บังคับ upload ทุกครั้ง)
- [x] อัปเดต frontend: เพิ่มฟอร์มอัปโหลดรูปสลิป (บังคับ) ก่อนบันทึกรายจ่าย
- [x] อัปเดต frontend: แสดงรูปสลิปในรายการ petty cash (มีอยู่แล้ว)
- [x] เขียน vitest tests (775 tests passed, backend validation enforced)

## Bug Fix: ผจก.เขต (area_manager) ไม่สามารถดูข้อมูลสาขาที่ดูแลได้
- [x] ตรวจสอบ backend: area_manager access ใน petty cash procedures
- [x] ตรวจสอบ backend: area_manager access ใน daily sales procedures
- [x] ตรวจสอบ backend: area_manager access ใน staff management procedures
- [x] แก้ไข backend: ให้ area_manager เข้าถึงข้อมูลสาขาที่ดูแลได้ (ใช้ managedBranchIds)
- [x] แก้ไข frontend: ให้ area_manager เลือกสาขาที่ดูแลเพื่อดู/ตั้งค่า petty cash
- [x] แก้ไข frontend: ให้ area_manager ดู daily sales ของสาขาที่ดูแลได้
- [x] แก้ไข frontend: ให้ area_manager จัดการพนักงานของสาขาที่ดูแลได้
- [x] ทดสอบและ checkpoint

## Area Manager Multi-Branch Access Fix
- [x] Area Manager: เพิ่ม managedBranchIds ใน AuthSession shared type
- [x] Area Manager: เพิ่ม helper function getEffectiveBranchId สำหรับ area_manager เลือกสาขา
- [x] Area Manager: แก้ dailySales procedures ให้รับ branchId optional input
- [x] Area Manager: แก้ pettyCash procedures ให้รับ branchId optional input
- [x] Area Manager: แก้ branchStaff procedures ให้รับ branchId optional input
- [x] Area Manager: เพิ่ม managedBranches ใน hibiAuth.me response
- [x] Area Manager: สร้าง BranchSelector component
- [x] Area Manager: แก้ MobileLayout ให้ area_manager เห็น branch nav items
- [x] Area Manager: แก้ Login redirect ให้ area_manager ไป /branch แทน /admin
- [x] Area Manager: แก้ BranchDashboard ให้ area_manager เห็น quick actions ทั้งหมด
- [x] Area Manager: แก้ DailySales page ให้ area_manager เลือกสาขาได้
- [x] Area Manager: แก้ PettyCash page ให้ area_manager เลือกสาขาได้
- [x] Area Manager: แก้ PettyCashSettings page ให้ area_manager เลือกสาขาได้
- [x] Area Manager: แก้ BranchStaffManagement page ให้ area_manager เลือกสาขาได้
- [x] Area Manager: เขียน vitest tests สำหรับ area manager multi-branch access

## ระบบเขตบริการ (Service Zone) + Multi-Branch Dashboard + Admin/Area Manager Access Expansion
- [x] DB: สร้างตาราง service_zones (id, name, description, isActive, createdAt, updatedAt)
- [x] DB: เพิ่ม zone_id ใน branches table (nullable FK)
- [x] DB: เพิ่ม zone_id ใน staff_branches table (optional, สำหรับ assign area_manager ตาม zone)
- [x] DB: Generate migration + apply SQL
- [x] Backend: Zone CRUD procedures (super_admin only)
- [x] Backend: เพิ่ม db helper functions สำหรับ zone (list, create, update, get, listBranchesByZone)
- [x] Backend: เพิ่ม multi-branch summary procedure สำหรับ dashboard (ยอดขาย + petty cash balance ทุกสาขา)
- [x] Backend: แก้ orderIssues.list ให้ area_manager เห็นเฉพาะสาขาที่ดูแล
- [x] Backend: แก้ allBranchesSummary ให้ filter ตาม zone ได้
- [x] Frontend: สร้าง Zone Management page (admin)
- [x] Frontend: เพิ่ม zone selector ใน Branch Management
- [x] Frontend: สร้าง Multi-Branch Overview Dashboard (area_manager + admin)
- [x] Frontend: แก้ MobileLayout ให้ area_manager เห็นเมนูรีวิว + ปัญหาออเดอร์
- [x] Frontend: แก้ BranchOrderIssues ให้ area_manager เลือกสาขาได้
- [x] Frontend: เพิ่ม zone filter ใน AdminSalesReport
- [x] Frontend: เพิ่ม zone filter ใน Admin Dashboard / Reports
- [x] Tests: เขียน vitest tests สำหรับ zone system + multi-branch dashboard

## Bug Fixes - วันที่ + SQL Error สะสมแต้ม
- [x] Bug: วันที่แสดงเป็น พ.ศ. (BE 2569) ใน date picker — เปลี่ยนเป็น DatePickerCE (ค.ศ.)
- [x] Bug: SQL Error "Failed query: insert into point_claims" — แก้ไม่ให้แสดง raw SQL error ให้ user
- [x] Bug: แก้ date display format ทั้งระบบให้เป็น ค.ศ. (สร้าง dateUtils.ts กลาง + แก้ 44 ไฟล์)
- [x] Tests: อัปเดต/เขียน vitest tests สำหรับ fixes (821 tests, 42 files)

## สิทธิ์อนุมัติเงิน + branch_owner ใช้ระบบบัญชี
- [ ] Backend: area_manager อนุมัติ fund request ได้ (processFundRequest)
- [ ] Backend: branch_owner ใช้ระบบบัญชีได้ (dailySales, pettyCash, staff management)
- [ ] Frontend: branch_owner เห็นเมนูบัญชี (ยอดขาย, เงินสดย่อย, พนักงาน) ใน MobileLayout
- [ ] Frontend: branch_owner เห็นปุ่มอนุมัติคำขอเติมเงินใน PettyCash
- [ ] Frontend: area_manager เห็นปุ่มอนุมัติคำขอเติมเงินใน PettyCash (ต้องมีช่องทางเข้าถึงได้จริง)
- [ ] Frontend: area_manager ต้องเห็นแท็บ "คำขอเติมเงิน" ของทุกสาขาที่ดูแล
- [ ] ป้องกันข้อมูลซ้ำซ้อน: กรณีคนเดียวมีหลายสิทธิ์ (เช่น branch_owner + area_manager)
- [ ] Tests: vitest tests สำหรับ fund approval permissions

## Petty Cash & Accounting - Permission Overhaul
- [x] แก้ area_manager เข้าหน้าเงินสดย่อยแล้วขึ้น "ยังไม่เปิดใช้งาน" - BranchSelector ต้อง auto-default สาขาแรก
- [x] Backend: เติมเงินเข้า (deposit) ได้เฉพาะ owner/area_manager/super_admin เท่านั้น (ห้าม branch_manager)
- [x] Backend: ห้าม branch_staff ใช้ระบบบัญชีทั้งหมด (petty cash + daily sales)
- [x] Backend: area_manager bypass isActive check ใน getBalance/listTransactions (เห็นข้อมูลได้แม้ยังไม่เปิดระบบ)
- [x] Frontend: branch_manager เห็นปุ่ม "ขอเติมเงิน" แทนปุ่ม "เติมเงิน"
- [x] Frontend: ซ่อนเมนูเงินสดย่อย+บัญชีรายวัน จาก branch_staff ใน MobileLayout
- [x] Frontend: BranchSelector แสดงเสมอสำหรับ area_manager (แม้มีสาขาเดียว)
- [x] branch_owner ใช้ทำบัญชีเองได้ครบ (ลงรายจ่าย+เติมเงิน+ดูข้อมูล) ร่วมกับผู้จัดการสาขา
- [x] ป้องกันข้อมูลซ้ำซ้อนเมื่อ user มีหลาย role

## Impersonate / Test Mode (Super Admin)
- [x] Backend: เพิ่ม X-Impersonate-Staff-Id header support ใน context.ts
- [x] Backend: เฉพาะ super_admin เท่านั้นที่ใช้ impersonate ได้
- [x] Backend: tRPC procedure สำหรับ list staff ที่ impersonate ได้
- [x] Frontend: UI เลือกพนักงาน/role ที่จะสวมสิทธิ์
- [x] Frontend: แถบสีแดงแสดงสถานะ impersonate + ปุ่มออก
- [x] Frontend: ส่ง header X-Impersonate ทุก API call เมื่อ active
- [x] Vitest: ทดสอบ impersonate context switching

## ปิดอีเมลแจ้งเตือนคำขอลูกค้า/โค้ดรีวิว
- [x] ค้นหาจุดที่ส่ง notifyOwner สำหรับคำขอลูกค้าและโค้ดรีวิว
- [x] ปิด/comment out การส่งอีเมลแจ้งเตือนที่เกี่ยวข้อง
- [x] แก้ notifyOwner ใน contact form ให้ส่งเฉพาะหมวด franchise และ event เท่านั้น
- [x] เพิ่ม Impersonate สำหรับลูกค้า (Backend: listTargets รวมลูกค้า + context switch)
- [x] เพิ่ม Impersonate สำหรับลูกค้า (Frontend: UI เลือกลูกค้า + แท็บแยกพนักงาน/ลูกค้า)
- [x] Bug: สวมสิทธิ์แล้วเกิด "An unexpected error occurred" เมื่อ redirect
- [x] Bug: Impersonate ลูกค้าแล้ว redirect ไป /customer เกิด error (แก้โดยใช้ SPA navigate)
- [x] Bug: PettyCash super_admin ค้าง loading (เพิ่ม BranchSelector รองรับ super_admin)
- [x] Feature: super_admin เห็นคำขอเติมเงินทุกสาขา + เลือกเติมเงินได้ทุกสาขา
- [x] Feature: อนุมัติคำขอเติมเงินแล้ว ยอดขึ้นให้ผจก.สาขา/เจ้าของสาขาเห็นด้วย (ยอดเข้าผ่าน balance ของสาขานั้น)

## รายงานการเติมเงินสำหรับเจ้าของสาขา
- [x] วิเคราะห์โค้ดปัจจุบัน: ดูว่า PettyCash แสดงรายการเติมเงินอย่างไร
- [x] เพิ่มรายงานการเติมเงินสำหรับเจ้าของสาขา (Backend + Frontend)

## สรุปยอดเงินสดย่อยรายเดือน/สัปดาห์ (ภาพรวม)
- [x] วิเคราะห์โค้ดปัจจุบัน: ดู Backend getSummary + Frontend แท็บภาพรวม
- [x] เพิ่ม Backend procedure สรุปยอดเดือนนี้ vs เดือนก่อน + สัปดาห์นี้ vs สัปดาห์ก่อน
- [x] อัปเดต Frontend แท็บภาพรวมให้แสดงสรุปเบิก/ใช้รายเดือน + % เปลี่ยนแปลง
- [x] เขียน Tests สำหรับ monthly/weekly summary (5 tests ใหม่, 844 tests ผ่านทั้งหมด)

## แก้บั๊ก: ลูกค้าซ้ำ + คำนวณคะแนนไม่ได้
- [x] ตรวจหาลูกค้าที่ซ้ำในฐานข้อมูล (เบอร์/อีเมลเดียวกัน) แล้วรายงานให้เจ้าของทราบ (4 กลุ่ม, 9 รายการ)
- [x] ป้องกันสมัครซ้ำ: เช็คเบอร์โทร + อีเมลก่อนสมัคร ถ้าซ้ำต้องแจ้ง error + normalize +66 prefix
- [x] แก้บั๊ก: ใส่ยอดเงินแล้วกดให้คะแนนไม่ได้ (fix: เพิ่ม newBalance ใน response + เพิ่ม branch_staff ใน allowed roles + inputMode numeric)
- [x] เขียน Tests สำหรับ duplicate prevention + point calculation (23 tests ใหม่, 867 tests ผ่านทั้งหมด)

## รวมลูกค้าซ้ำ: ตรวจสอบและ merge ID
- [x] ตรวจสอบ point claims + reviews ของลูกค้าซ้ำ 4 กลุ่ม
- [x] ย้ายข้อมูล claims/reviews/points ไปยัง ID หลัก แล้วลบ ID ซ้ำ (4 กลุ่ม เหลือ 1 ID ต่อคน)
- [x] ตรวจสอบผลลัพธ์ว่าข้อมูลถูกต้อง

## บั๊ก: ลูกค้ากดส่งคำขอสะสมแต้มแล้วขึ้น error
- [x] ตรวจสอบ server logs: พบว่า unique constraint (deliveryApp+orderId) บล็อคแม้ claim เก่าถูก reject แล้ว
- [x] แก้ไข: เพิ่ม checkExistingClaim + deletePointClaim ให้ลบ claim ที่ rejected ก่อนสร้างใหม่ (867 tests ผ่าน)

## ปรับปรุงข้อความ error ให้ชัดเจน (สะสมแต้ม + ทั้งระบบ)
- [x] ปรับข้อความ error Backend: ส่งซ้ำ, กรอกไม่ครบ, ถูก reject, ข้อมูลผิดรูปแบบ
- [x] ปรับ Frontend: แสดง error เป็นมิตร พร้อมคำแนะนำแก้ไข
- [x] ครอบคลุมทุกจุด: สมัคร, สะสมแต้ม, รีวิว, แจ้งปัญหาออเดอร์

## บังคับเลือกเมนูก่อนออกโค้ด
- [x] ตรวจหาคูปอง/โค้ดที่ออกไปแล้วไม่มีข้อมูลเมนู (149/172 ไม่มีเมนู, 15 ใช้แล้วไม่มีเมนู)
- [x] บังคับเลือกเมนูก่อนออกโค้ด: Backend บล็อค redeem ถ้าไม่เลือกเมนู + Frontend บังคับเลือกก่อนแสดง QR (867 tests ผ่าน)

## ระบบประกาศ/Notification สำหรับสมาชิก
- [x] ออกแบบ DB schema: announcements table (title, content, image, publishedAt, etc.)
- [x] สร้าง Backend procedures: CRUD ประกาศ (admin) + ดึงประกาศ (ลูกค้า) + mark as read
- [x] สร้าง Frontend admin: หน้าสร้าง/จัดการประกาศ พร้อมอัพโหลดรูป
- [x] สร้าง Frontend ลูกค้า: notification bell + หน้ารายการประกาศย้อนหลัง
- [x] เขียน Tests (19 tests ผ่าน)
- [x] DB: customer_announcement_reads table สำหรับ track ว่าลูกค้าอ่านประกาศไหนแล้ว
- [x] Backend: unreadCount, markRead, markAllRead procedures
- [x] Frontend: Bell icon + unread badge บน MobileLayout header
- [x] Frontend: CustomerHome แสดง badge จำนวนประกาศที่ยังไม่อ่าน
- [x] Frontend: เปิดหน้าประกาศแล้ว auto mark all as read

## Push Notification ผ่าน Service Worker
- [x] DB: สร้างตาราง push_subscriptions สำหรับเก็บ subscription ของลูกค้า
- [x] Backend: procedures สำหรับ subscribe/unsubscribe push notification
- [x] Backend: ส่ง push notification เมื่อสร้างประกาศใหม่
- [x] Frontend: ขอ permission + subscribe push notification จากลูกค้า (usePushNotifications hook)
- [x] Service Worker: รับและแสดง push notification (มีอยู่แล้ว sw.js)
- [x] Backend: sendPush procedure สำหรับ admin ส่ง push ซ้ำได้
- [x] Backend: ลบ subscription อัตโนมัติเมื่อ endpoint หมดอายุ (410/404)

## แยกประเภท Notification + ตัวกรอง
- [x] DB: ใช้ type field ที่มีอยู่แล้ว (announcement/promotion/event)
- [x] Backend: เพิ่ม listByCategory procedure + listAnnouncementsByCategory db helper
- [x] Frontend admin: category selector ในฟอร์มสร้าง/แก้ไขประกาศ (มีอยู่แล้ว)
- [x] Frontend ลูกค้า: เพิ่ม category filter tabs (ทั้งหมด/ประกาศ/โปรโมชัน/อีเวนต์)

## ตั้งเวลาเผยแพร่ประกาศ (Schedule)
- [x] DB: เพิ่ม scheduledAt field ใน announcements table
- [x] Backend: logic ตรวจสอบ scheduledAt เพื่อไม่แสดงประกาศที่ยังไม่ถึงเวลา
- [x] Backend: scheduled job (setInterval 60s) เพื่อส่ง push notification เมื่อถึงเวลาเผยแพร่
- [x] Frontend admin: เพิ่ม schedule toggle + datetime picker สำหรับตั้งเวลาเผยแพร่
- [x] Frontend admin: แสดง badge "ตั้งเวลา" + จำนวนประกาศที่ตั้งเวลาไว้
- [x] เขียน Tests สำหรับทั้ง 3 ฟีเจอร์ (23 tests ผ่าน)

## Dashboard ลูกค้า - คูปอง/แต้มตามสาขา (Marketing Analytics) (เสร็จ)
- [x] Backend: query สรุปคูปอง/แต้มตามสาขา (getCodeStatsByBranch, getPointsStatsByBranch)
- [x] Backend: query ลูกค้าที่ใช้คูปองมากสุดตามสาขา (getTopCustomersByPoints, getTopCodeRedeemers)
- [x] Frontend admin: หน้า MarketingDashboard แสดงสถิติคูปอง/แต้มตามสาขา
- [x] Frontend admin: แสดงลูกค้า top spenders / top redeemers ตามสาขา
- [x] เขียน Tests (15 tests ผ่าน)

## สถิติการอ่านประกาศ (Announcement Analytics) (เสร็จ)
- [x] Backend: query จำนวนคนอ่านต่อประกาศ + อัตราการเปิดอ่าน (readStats + readDetail)
- [x] Frontend admin: หน้า AnnouncementAnalytics แสดงสถิติการอ่านประกาศ
- [x] Frontend admin: แสดง read rate, unique readers, รายชื่อคนอ่านต่อประกาศ

## ประกาศเฉพาะสาขา (เสร็จ)
- [x] DB: เพิ่ม branchId field ใน announcements table (null = ทุกสาขา)
- [x] Backend: เพิ่ม branchId ใน create/update procedures
- [x] Frontend admin: เพิ่ม branch selector ในฟอร์มสร้างประกาศ + แสดง badge สาขาในรายการ
- [x] Frontend ลูกค้า: แสดงเฉพาะประกาศที่เกี่ยวข้องกับสาขาของตน

## Template ประกาศสำเร็จรูป (เสร็จ)
- [x] DB: สร้างตาราง announcement_templates
- [x] Backend: CRUD procedures สำหรับ templates (list, create, update, delete)
- [x] Frontend admin: UI เลือก template เมื่อสร้างประกาศใหม่ + สร้าง/ลบ template
- [ ] เพิ่ม default templates: โปรวันเกิด, โปรเปิดสาขาใหม่, โปรเทศกาล (admin สร้างเองได้)

## BUG FIX: เบอร์โทรมีขีด (-) ทำให้ลูกค้าล็อกอินไม่ได้ (เสร็จ)
- [x] Backend: strip ขีดออกจากเบอร์โทรตอนสมัคร (register) — มีอยู่แล้ว phone.replace(/\D/g, "")
- [x] Backend: strip ขีดออกจากเบอร์โทรตอนล็อกอิน (login) — มีอยู่แล้ว
- [x] Backend: strip ขีดออกจากเบอร์โทรตอนค้นหาสมาชิก (admin search) — เพิ่ม cleanPattern
- [x] Backend: strip ขีดออกจาก customerPhone ตอนสร้าง claim code
- [x] Frontend: strip ขีดออกจาก input เบอร์โทรก่อนส่ง — มีอยู่แล้วทุกหน้า
- [x] DB Migration: แก้เบอร์โทรเก่า 26 ลูกค้า + 1 พนักงาน (1 skip เพราะซ้ำ)
- [x] เขียน Tests สำหรับ phone normalization (17 tests ผ่าน)

## BUG FIX: React error #310 (useMemo) ตอนกดอนุมัติรีวิว (เสร็จ)
- [x] ตรวจสอบ review approval code หา useMemo error — พบว่า MobileLayout.tsx มี early return ก่อน useMemo
- [x] แก้ไข bug — ย้าย if (!session) return ไปหลัง useMemo เพื่อให้ hook count คงที่
- [x] แก้ scheduled announcements query error (ECONNRESET) เพิ่ม try-catch

## ระบบลงยอดขายแยกหมวดหมู่ + ค่าคอมมิชชั่นพนักงาน (เสร็จ)
- [x] DB: สร้างตาราง sales_categories + daily_sales_items
- [x] DB: เพิ่ม categoryId ใน daily_sales_items
- [x] Backend: CRUD หมวดหมู่ยอดขาย (สร้าง/แก้ไข/ลบ)
- [x] Backend: ลงยอดขายแยกตามหมวดหมู่ (upsertDailySalesItems)
- [x] Backend: สรุปยอดขายแยกตามหมวดหมู่ + คำนวณค่าคอมมิชชั่น (monthlyCategoryBreakdown + commission)
- [x] Frontend: เพิ่ม category selector + จัดการหมวดหมู่ในฟอร์มลงยอดรายวัน
- [x] Frontend: แสดงสรุปยอดแยกตามหมวดหมู่ในแท็บสรุป
- [x] Frontend: แท็บ "คอมฯ" แสดงค่าคอมมิชชั่นพนักงานตามสาขา
- [x] เขียน Tests (17 tests ผ่าน)

## Franchise Owner System
- [x] DB: สร้าง franchise_owners table (id, name, companyName, phone, email, isActive, createdAt)
- [x] DB: เพิ่ม franchiseOwnerId FK ใน branches table
- [x] Backend: CRUD procedures สำหรับ franchise owners (super admin only)
- [x] Backend: อัปเดต staff branch assignment ให้วนได้เฉพาะสาขาของ franchise owner เดียวกัน
- [x] Frontend: Franchise Owner Management page (super admin)
- [x] Frontend: อัปเดต Branch Management ให้ผูก franchise owner
- [x] Frontend: พนักงานเลือกสาขาทำงานได้เฉพาะใน franchise owner เดียวกัน

## In-Store Product Sales System (ขายสินค้าหน้าร้าน)
- [x] DB: สร้าง in_store_sales table + in_store_sale_staff table
- [x] DB: เพิ่ม commissionType + commissionValue ใน shop_products table
- [x] Backend: tRPC procedures สำหรับ in-store sales (create, list, getById)
- [x] Backend: พนักงานกดซื้อแทนลูกค้า + แนบสลิปโอนเงิน
- [x] Backend: ลูกค้าได้ point จากการซื้อสินค้าหน้าร้าน
- [ ] Backend: Quick register customer ตอนขาย (ถ้ายังไม่เป็น member) — ยังไม่ได้ทำ
- [x] Frontend: In-Store Sales page (พนักงาน/เมเนเจอร์) — เลือกสินค้า, ลูกค้า, แนบสลิป
- [x] Frontend: Sales History page (รวมอยู่ใน In-Store Sales page)

## Commission System
- [x] DB: สร้าง commission_records table (staffId, saleId, amount, month, status)
- [x] DB: สร้าง in_store_sale_staff table (saleId, staffId) — รองรับหลายคนขาย max 3 คน
- [x] Backend: คำนวณคอมมิชชั่นอัตโนมัติจาก commissionType/Value ของสินค้า
- [x] Backend: คอมมิชชั่นหารเท่ากันอัตโนมัติเมื่อมีพนักงานขายหลายคน (1-3 คน)
- [x] Backend: สรุปคอมมิชชั่นรายเดือนต่อพนักงาน
- [x] Frontend: Commission Settings ใน product form (% หรือ บาท)
- [x] Frontend: เลือกพนักงานผู้ขายได้สูงสุด 3 คน ตอนลงยอด
- [x] Frontend: Monthly Commission Report page (admin/franchise owner)

## Daily Sales แยกยอด
- [x] อัปเดต Daily Sales ให้แยกยอดเครื่องดื่มกับยอดสินค้าหน้าร้าน (เพิ่มแท็บสินค้าหน้าร้าน)
- [x] แสดงสรุปทั้ง 2 ยอดในหน้า Daily Sales

## Tests
- [x] เขียน vitest tests สำหรับ franchise owner system (978 tests passed)
- [x] เขียน vitest tests สำหรับ in-store sales + commission (978 tests passed)

## Quick Register Customer (In-Store Sales)
- [x] Frontend: เพิ่ม Quick Register dialog ในหน้า InStoreSales
- [x] Backend: quickRegisterCustomer procedure + ตรวจ duplicate phone + normalize +66
- [x] Frontend: หลังสมัครเสร็จ auto-select ลูกค้าใหม่ในฟอร์มขาย

## Export Commission Report to Excel
- [x] Frontend: เพิ่มปุ่ม Export CSV/Excel ในหน้า CommissionReport
- [x] สร้าง CSV พร้อม BOM สำหรับภาษาไทย + summary row

## Tests
- [x] เขียน vitest tests สำหรับ quick register (5 tests ใหม่, รวม 983 tests ผ่านทั้งหมด)

## BUG: สร้างรางวัลใหม่ไม่ได้ (Failed query: insert into rewards)
- [x] ตรวจสอบ rewards schema vs insert query — สาเหตุ: frontend ส่งชื่อหมวดหมู่ภาษาไทย แต่ DB enum รับแค่ English
- [x] แก้ไข: เพิ่ม Thai-to-English category mapping ใน createReward + updateReward procedures
- [x] ทดสอบสร้างรางวัลใหม่ได้สำเร็จ

## ปรับระบบคอมมิชชั่น 2 โหมด (per-branch setting)
- [x] DB: เพิ่ม commissionMode enum ('product'|'staff') ใน branches table
- [x] DB: เพิ่ม staffCommissionType + staffCommissionValue ใน staff table
- [x] Backend: ปรับ commission calculation logic รองรับ 2 โหมด
- [x] Backend: เพิ่ม procedure ตั้งค่า commission mode ต่อสาขา (via branch update)
- [x] Backend: เพิ่ม procedure ตั้งค่า commission rate ต่อพนักงาน (via staff create/update)
- [x] Frontend: เพิ่มช่องคอมมิชชั่นในฟอร์มแก้ไขสินค้า (โหมด A: product) — มีอยู่แล้ว
- [x] Frontend: เพิ่ม commission mode setting ในหน้า branch management
- [x] Frontend: เพิ่ม staff commission rate setting (ในฟอร์มจัดการพนักงาน)
- [x] Frontend: ปรับ In-Store Sales ให้รองรับ 2 โหมด (auto-detect จาก branch setting)
- [x] Frontend: ปรับ Commission Report ให้แสดงตามโหมดที่เลือก (badge แสดง type)
- [ ] ลูกค้าซื้อผ่านแอพ = ยอดร้าน ไม่คิดคอมมิชชั่น
- [x] เขียน vitest tests (988 tests passed, 51 files)

## ยอดขายผ่านแอพ (ไม่คิดคอม) + ต้นทุนสินค้า/กำไร
- [x] DB: เพิ่ม isAppSale flag (boolean) ใน in_store_sales table
- [x] DB: เพิ่ม costPrice (satang) ใน shop_products table
- [x] DB: เพิ่ม totalCost ใน in_store_sales table (คำนวณจาก costPrice * quantity)
- [x] Backend: ปรับ inStoreSales.create — ถ้า isAppSale=true ข้ามคอมมิชชั่น (commission=0)
- [x] Backend: เพิ่ม costPrice ใน shop product create/update procedures
- [x] Backend: คำนวณ totalCost และ profit ใน sale record
- [x] Backend: ปรับ summary/report ให้แสดงต้นทุน กำไร แยก app sale vs walk-in
- [x] Frontend: เพิ่ม toggle "ลูกค้าซื้อผ่านแอพ" ใน In-Store Sales form
- [x] Frontend: เพิ่มช่อง "ต้นทุน" ในฟอร์มสินค้า (Product form) + แสดงกำไรต่อชิ้น
- [x] Frontend: แสดงต้นทุน/กำไรในรายการขาย และ daily summary card
- [x] Frontend: แสดง badge "ผ่านแอพ" ในรายการขาย (ไม่คิดคอม)
- [x] เขียน vitest tests (993 tests passed, 51 files)

## ย้ายระบบ POS เข้า Hibi Matcha (รวมเป็นฐานเดียว)
- [x] DB: เพิ่ม POS tables (17 ตาราง + migration + seed payment methods)
- [x] Backend: เพิ่ม POS db helpers ใน server/db.ts (รวมไฟล์เดียวกับระบบเดิม)
- [x] Backend: เพิ่ม POS tRPC procedures ใน server/routers.ts (pos.* namespace)
- [x] Frontend: ย้าย POSTerminal.tsx (หน้าขายหน้าร้าน)
- [x] Frontend: ย้าย POSLogin.tsx (PIN pad login)
- [x] Frontend: ย้าย POSBranch.tsx (POS mode standalone)
- [x] Frontend: ย้าย KitchenDisplay.tsx (จอครัว/บาร์)
- [x] Frontend: ย้าย MenuManagement.tsx (จัดการเมนู)
- [x] Frontend: ย้าย CategoryManagement.tsx (จัดการหมวดหมู่)
- [x] Frontend: ย้าย OptionManagement.tsx (จัดการตัวเลือก/Add-on)
- [x] Frontend: ย้าย RetailManagement.tsx (สินค้าหน้าร้าน)
- [x] Frontend: ย้าย DiscountManagement.tsx (ส่วนลด/โปรโมชั่น)
- [x] Frontend: ย้าย PaymentMethodManagement.tsx (ช่องทางชำระเงิน)
- [x] Frontend: ย้าย StaffPinManagement.tsx (PIN พนักงาน)
- [x] Frontend: ย้าย OrderList.tsx (ออเดอร์ย้อนหลัง)
- [x] Frontend: ย้าย Reports.tsx (รายงาน POS) — ไม่มีใน source เดิม
- [x] Frontend: ย้าย ReceiptPrint, KitchenTicketPrint, POSBranchContext
- [x] Frontend: อัปเดต App.tsx routing (/pos/:branchId, /pos/:branchId/hub, และหน้าจัดการทั้งหมด)
- [x] Vitest: เขียน tests สำหรับ POS procedures (1,020 tests passed, 52 files)

## POS Enhancement: สิทธิ์เจ้าของสาขา + เมนูกลาง + Auto-setup + Thermal Print
### 1. สิทธิ์เจ้าของสาขา/แฟรนไชส์จัดการ POS
- [x] Backend: เพิ่ม branchOwnerProcedure ที่ตรวจสอบ staff role = branch_owner/branch_manager + branchId
- [x] Backend: ปรับ POS procedures ให้ branch_owner/branch_manager เข้าถึงได้ (ไม่ต้องเป็น super_admin)
- [x] Frontend: สร้างหน้า POS Management สำหรับ branch owner (เข้าจาก sidebar)
- [x] Frontend: branch owner เห็นเฉพาะสาขาตัวเอง (เมนู, PIN, รายงาน, stock)

### 2. เลือกเมนูจากระบบกลาง
- [x] Backend: เพิ่ม procedure สำหรับ branch เลือก/ยกเลิกเมนูจาก catalog กลาง
- [x] Backend: เมื่อเลือกเมนู ให้สร้าง pos_branch_menu_items record อัตโนมัติ
- [x] Frontend: หน้า "เลือกเมนูจากระบบกลาง" — แสดง catalog กลาง + toggle เปิด/ปิดต่อสาขา + ปรับราคาได้

### 3. เปิดสาขาใหม่ = POS พร้อมใช้
- [x] Backend: เมื่อสร้างสาขาใหม่ auto-setup: เพิ่มเมนูกลางทั้งหมดเข้า branch_menu_items
- [x] Backend: auto-create default PIN สำหรับ manager ของสาขาใหม่
- [x] Backend: auto-setup payment methods (ใช้ global payment methods)

### 4. Auto-Print 3 ใบหลังชำระเงิน
- [x] เช็คระบบ ReceiptPrint + KitchenTicketPrint — มี ESC/POS + Web Serial API ครบแล้ว
- [x] Auto-print ใบเสร็จลูกค้า (thermal) ทันทีหลังชำระ
- [x] Auto-print ใบหน้าร้าน (สำเนาสำหรับร้าน) ทันทีหลังชำระ
- [x] Auto-print ใบเข้าครัว/บาร์ อัตโนมัติตาม sendTo ของแต่ละ item
- [x] เพิ่มการตั้งค่า printer ต่อจุด (POS receipt, kitchen, bar) ต่อสาขา — จำ port ไว้ใน localStorage
- [x] ปรับ POSTerminal ให้ auto-print ทั้ง 3 ใบหลัง order.create สำเร็จ

### 5. Tests
- [x] เขียน vitest tests สำหรับ branch owner access + menu selection + auto-setup (20 tests passed)

## เพิ่มทางเข้าระบบ POS จาก Admin Dashboard
- [x] เพิ่ม POS section ใน sidebar navigation ของ Admin Dashboard
- [x] เพิ่มลิงก์ไปหน้า POS ทั้งหมด (เมนู, หมวดหมู่, ตัวเลือก, ส่วนลด, วิธีชำระ, PIN, ออเดอร์, รายงาน)
- [x] เพิ่มลิงก์ "เปิด POS สาขา" สำหรับเข้าหน้า POS Terminal ของแต่ละสาขา

## Bug Fixes - POS Category & Menu
- [x] Bug: หน้าจัดการหมวดหมู่ POS ไม่มีปุ่มเพิ่มหมวดหมู่ — ตรวจสอบแล้วมีปุ่มอยู่แล้ว (มุมขวาบน)
- [x] Bug: สร้างเมนูใหม่ ถ้าไม่เลือกหมวดหมู่จะกดสร้างต่อไม่ได้ (ควรเป็น optional)
- [x] เพิ่มปุ่ม "สร้างหมวดหมู่ใหม่" inline ในหน้าสร้างเมนู (ไม่ต้องออกไปหน้าอื่น)

## กฎหมาย + VAT + Menu Image Upload
- [ ] ศึกษากฎหมาย e-commerce ไทย สำหรับขายสินค้าในแอป (รับโอน, จัดส่ง, tracking)
- [ ] เพิ่มระบบออกบิล VAT สำหรับ POS (ทั้งเครื่องดื่มและสินค้า)
- [ ] เพิ่ม UI อัปโหลดรูปเมนูในหน้า MenuManagement
- [x] ตรวจสอบ Option Group — มีอยู่แล้วครบถ้วน (schema + backend + frontend + POS Terminal)

## Option Group Enhancement
- [x] Option Group ต้องผูกกับเมนูเฉพาะ (per-menu assignment) — มีแล้ว + เพิ่ม UI ใน MenuManagement
- [x] Option ไม่คิดเงิน (เช่น ระดับความหวาน, น้ำแข็ง) — priceAdjustment = 0 แสดง "ฟรี"
- [x] Option คิดเงินเพิ่ม (เช่น topping, add-on, เปลี่ยนขนาด) — priceAdjustment > 0 แสดง "+XX"
- [x] ต้นทุนของ option (costAdjustment field) สำหรับคำนวณกำไร — มีใน schema
- [x] POS Terminal คำนวณยอดรวม option ถูกต้อง — แสดง preview ก่อนยืนยัน
- [ ] รายงานยอดขาย/ต้นทุน option แยกได้ (ยังไม่ได้ทำ — ต้องเพิ่มในรายงาน)

## Menu Image Upload
- [x] Backend: เพิ่ม tRPC procedure สำหรับ upload รูปเมนูไป S3
- [x] Frontend: เพิ่ม UI อัปโหลดรูปในฟอร์มสร้าง/แก้ไขเมนู (MenuManagement)
- [x] Frontend: แสดงรูปเมนูบน POS Terminal menu grid (มีอยู่แล้ว)
- [x] Frontend: แสดงรูป preview ในรายการเมนู (MenuManagement)

## POS Navigation - Back Buttons
- [x] เพิ่มปุ่ม Back ในทุกหน้าจัดการ POS เพื่อกลับหน้าก่อนหน้า (10 หน้า: Menu, Category, Option, Retail, Discount, Payment, StaffPin, OrderList, Reports, KitchenDisplay)

## Admin Dashboard Restructure (Category Groups)
- [x] ปรับ Admin Dashboard จากรายการยาวเป็นหมวดหมู่หลัก (POS, Rewards, Branch, ฯลฯ) กดเข้าไปดูหัวข้อย่อย — ใช้ Collapsible
- [x] ลดการเลื่อนหน้าจอ — แสดงเฉพาะหมวดหมู่หลักก่อน แล้วค่อยขยายหัวข้อย่อย

## Staff PIN Integration into Branch Management
- [x] ย้ายลิงก์จัดการ PIN พนักงานไปอยู่ในหน้าจัดการสาขา (ปุ่ม "จัดการ PIN" ในแต่ละ branch card)
- [x] Fix bug: เลือกสาขาแล้ว PIN ไม่แสดง → เปลี่ยนจาก usePOSBranch เป็น local state + auto-select
- [x] Fix bug: OrderList + Reports มีปัญหาเดียวกัน → เปลี่ยนเป็น local state เช่นกัน
- [x] รองรับ 1 เจ้าของ franchise จัดการหลายสาขาในไอดีเดียว (branchAdminProcedure อนุญาต branch_owner role)

## Bug Fixes - POS & Customer Shop (May 2026)
- [x] 3.1 POS Terminal: กดชำระเงินแล้วขึ้น "กรุณาเลือกสาขา" → ใช้ routeBranchId จาก URL แทน usePOSBranch
- [x] 3.2 POS Terminal: option popup มีอยู่แล้ว → ต้องไปผูก option groups กับเมนูใน Admin
- [x] 4 POS ขึ้นทุกสาขาอัตโนมัติอยู่แล้ว — route /pos/:branchId ใช้ได้กับทุก branch ID
- [x] 5 หน้าร้านค้าลูกค้า → เปลี่ยนเป็น aspect-[4/3] + grid-cols-3 บน desktop
- [x] 6 หน้า /branch crash → ครอบ PWAInstallBanner ด้วย error boundary กัน crash ทั้งหน้า

## POS Terminal Mobile UX Fixes (May 2026)
- [x] POS Terminal มือถือ: ตะกร้าบังเมนูสินค้า → เปลี่ยนเป็น bottom drawer บนมือถือ
- [x] POS Terminal มือถือ: หมวดหมู่แสดงไม่ครบ → ปรับเป็น horizontal scroll + ขนาดเล็กลง
- [x] POS Terminal: เพิ่มปุ่ม Back กลับหน้าสาขา
- [x] POS Terminal: option popup มีอยู่แล้ว — ต้องผูก option groups กับเมนูใน Admin
- [x] หน้าสาขา: เพิ่มลิงก์จัดการหมวดหมู่ + ตัวเลือก สำหรับผู้จัดการสาขา (manager)

## Redeem Code Flow Fix (May 2026)
- [x] MyCodes: ซ่อนรหัสโค้ดจนกว่าลูกค้าจะเลือกเมนูเสร็จ + เพิ่มข้อความแจ้ง
- [x] FreeDrinks: ซ่อนรหัสโค้ดจนกว่าจะเลือกเมนูเสร็จ + แสดง "••••-••••-••••" แทน
- [x] SelectMenuCode: ซ่อนรหัสโค้ดในหน้าเลือกเมนู + confirm dialog ไม่แสดงรหัส
- [x] SelectMenu: ซ่อนรหัสโค้ดในหน้าเลือกเมนูแก้วแถม + preview ไม่แสดงรหัส
- [x] โค้ดเก่าที่ออกไปก่อนหน้า (selectedMenuItemId = null) จะถูกบังคับเลือกเมนูก่อนเช่นกัน

## FAQ / วิธีใช้โค้ด (May 2026)
- [x] สร้างหน้า FAQ สองภาษา (ไทย+อังกฤษ) แยกรายการตามประเภทโค้ด (RV, CL, FR, แลกแต้ม)
- [x] เพิ่ม popup อัตโนมัติเมื่อลูกค้าเข้าหน้าโค้ดครั้งแรก
- [x] เพิ่มลิงก์เข้า FAQ จากหน้าหลักเมนูลูกค้า
- [x] เน้นข้อจำกัด: อายุโค้ด, ต้องเลือกเมนูก่อน, ใช้ภายในวันที่เลือก

## Bug: อัปโหลดรูปไม่สำเร็จในหน้าประกาศ (May 2026)
- [x] ตรวจสอบและแก้ไขบัก image upload ในหน้าสร้างประกาศ/โปรโมชัน

## Bug: ประกาศไม่แสดงให้ลูกค้า + Push Notification default (May 2026)
- [x] ตรวจสอบและแก้ไข: ประกาศต้องแสดงให้ลูกค้าทุกคนทุกประกาศ
- [x] เปลี่ยน push notification toggle เป็นเปิดเป็นค่าเริ่มต้น (ลูกค้าปิดเองได้)

## Bug: ไม่สามารถ back จากหน้าสวมสิทธิ์ลูกค้า (May 2026)
- [x] แก้ไขปุ่ม "ออก" ในแถบสวมสิทธิ์ให้กลับไปหน้า admin ได้

## เพิ่ม Preview ประกาศก่อนเผยแพร่ (May 2026)
- [x] เพิ่มปุ่ม preview ในหน้าสร้าง/แก้ไขประกาศ ให้ admin เห็นตัวอย่างแบบลูกค้า

## Scheduled Push Notification (May 2026)
- [x] เพิ่มระบบส่ง push notification ตามเวลาที่ตั้งไว้ (scheduledAt) — มีอยู่แล้ว + เพิ่ม retry logic สำหรับ ECONNRESET

## ปรับ UI ประกาศเป็นแบบจดหมาย (May 2026)
- [x] ปรับหน้าประกาศลูกค้าให้แสดงแบบซองจดหมาย (กดเปิดอ่านเต็มจอ)
- [x] เพิ่มประกาศล่าสุดด้านบนสุดหน้าแรกลูกค้า (CustomerHome) เป็น banner/carousel

## แยกแต้มสะสมตามสาขา - Franchise (May 2026)
- [x] แก้ไข DB: เพิ่ม branchId ใน loyalty_points / point_transactions ให้แต้มแยกตามสาขา — มี branchLoyaltyPoints อยู่แล้ว
- [x] แก้ไข Backend: คำนวณแต้มแยกตามสาขา (ลูกค้า 1 คน มีแต้มหลายสาขา) — มี addBranchPoints/spendBranchPoints อยู่แล้ว
- [x] แก้ไข Frontend: แสดงแต้มแยกตามสาขาให้ลูกค้าเห็น — มีอยู่แล้ว (branchPoints ใน RewardsCatalog)
- [x] แก้ไข Redeem: ตรวจสอบสาขาตอน redeem โค้ด ถ้าผิดสาขาให้ฟ้องเตือน
- [x] แก้ไข Redeem: แจ้งพนักงานว่า "โค้ดนี้เป็นของสาขา X ไม่สามารถใช้ที่สาขานี้ได้"

## เพิ่มหน้าแต้มสะสมแยกสาขา (May 2026)
- [x] สร้างหน้า BranchPoints ให้ลูกค้าเห็นแต้มแต่ละสาขาชัดเจน — เขียนใหม่ MyPoints.tsx แสดง progress bar แยกสาขา
- [x] เพิ่มลิงก์เข้าจากหน้าหลักลูกค้า + tab แต้มสะสม — ใช้หน้า MyPoints เดิมที่ปรับปรุงแล้ว
- [x] แสดงชื่อสาขา + แต้มปัจจุบัน + ประวัติการได้/ใช้แต้ม — มี expandable details + ปุ่ม "แลกที่สาขานี้"

## เพิ่ม Read Receipt ประกาศ (May 2026)
- [x] สร้างตาราง announcement_reads (DB migration) — มี customer_announcement_reads อยู่แล้ว
- [x] เพิ่ม backend: บันทึกเมื่อลูกค้าเปิดอ่าน + query จำนวนคนอ่าน — getAnnouncementReadStats + getAnnouncementReaders
- [x] เพิ่ม tRPC procedures: announcements.readStats + announcements.readDetail
- [x] เพิ่ม frontend admin: แสดงจำนวนคนอ่านในหน้า AdminAnnouncements — badge "X คนอ่าน" + dialog รายชื่อผู้อ่าน

## POS Option เพิ่มราคา (May 2026)
- [x] DB: มี priceAdjustment + costAdjustment ใน pos_options อยู่แล้ว (0 = ฟรี, >0 = เพิ่มเงิน)
- [x] Backend: CRUD option items รองรับ price อยู่แล้ว
- [x] POS Terminal: แสดง "+ราคา" หรือ "ฟรี" ข้างตัวเลือก + คำนวณยอดรวมถูกต้อง
- [x] Admin: ฟอร์มสร้าง/แก้ไข option item มีช่องกรอกราคาเพิ่ม + ต้นทุนเพิ่มอยู่แล้ว

## Push Notification ประกาศแจ้งเตือนหน้าจอ (May 2026)
- [x] ตรวจสอบระบบ push notification ปัจจุบัน (Web Push API) — มีครบ: service worker, VAPID, web-push, subscribePush/unsubscribePush
- [x] ตรวจสอบว่า notification แสดงบนหน้าจอล็อค/notification center ได้ — sw.js มี push + notificationclick handler
- [x] ปรับปรุง: auto-request permission ทันทีที่ลูกค้าเปิดหน้า CustomerHome (ไม่ต้องกดปุ่ม)
- [x] ถ้าจะปิด: ไปปิดได้ที่หน้า ประกาศ & โปรโมชัน (toggle switch)

## Bug Fix: Admin ดูเงินสดย่อยรายละเอียด/ภาพไม่ได้ (May 2026)
- [x] ตรวจสอบหน้า admin petty cash detail view — backend + frontend ทำงานถูกต้อง แต่ไม่มีทางเข้าจาก admin nav
- [x] แก้ไข: เพิ่ม "เงินสดย่อย" + "บัญชีรายวัน" + "ภาพรวมสาขา" ใน admin bottom nav
- [x] ทำให้การ์ดสาขาใน MultiBranchOverview กดได้ — ไปหน้า petty cash/daily-sales/reviews ของสาขานั้นเลย
- [x] ปรับ useBranchSelector ให้อ่าน ?branchId=X จาก URL เพื่อ auto-select สาขา

## บัญชีรายวัน: สิทธิ์ดูย้อนหลัง vs แก้ไข (May 2026)
- [x] Backend: ปรับ read procedures (getByDate, list, monthlySummary, getById, monthlyCategoryBreakdown, commission) เป็น staffProcedure — พนักงานทุกคนดูได้
- [x] Backend: upsert ยังคงเป็น requirePermission("manage_accounting") — เฉพาะผู้จัดการ/เจ้าของสาขาแก้ไขได้
- [x] Frontend: พนักงานทั่วไปดูย้อนหลังได้ (input disabled + ปุ่มบันทึกซ่อน + แถบ "ดูย้อนหลังเท่านั้น")
- [x] Frontend: ผู้จัดการ/เจ้าของสาขาดูย้อนหลัง + แก้ไขได้
- [x] Navigation: เพิ่ม "บัญชีรายวัน" ใน bottom nav สำหรับพนักงานทุกคน
- [x] Test: อัปเดต accounting-permissions.test.ts ให้สอดคล้องกับสิทธิ์ใหม่

## เงินสดย่อย: สิทธิ์ดูย้อนหลัง read-only สำหรับพนักงาน (May 2026)
- [x] Backend: ปรับ read procedures (getBalance, listTransactions, getSummary) ลบการ throw FORBIDDEN สำหรับ branch_staff
- [x] Backend: create/update/delete ยังคง requirePermission("manage_accounting")
- [x] Frontend: พนักงานทั่วไปดูรายการ + ภาพสลิปได้ แต่ปุ่มเพิ่ม/แก้ไข/ลบซ่อน + แถบ "ดูย้อนหลังเท่านั้น"
- [x] Navigation: เพิ่ม "เงินสดย่อย" ใน bottom nav สำหรับพนักงานทุกคน

## Lock บัญชีรายวัน หลัง 3 วัน (May 2026)
- [x] Backend: เพิ่ม logic ใน upsert — ถ้า salesDate เกิน 3 วันจากวันนี้ ให้ throw FORBIDDEN
- [x] Frontend: แสดงแถบ "ล็อคแล้ว — ไม่สามารถแก้ไขได้" + disabled ทุก input เมื่อเกิน 3 วัน
- [x] Super admin / area_manager ยังแก้ไขได้ไม่จำกัดวัน (override lock)

## Audit Trail บัญชีรายวัน (May 2026)
- [x] DB: สร้างตาราง daily_sales_audit_logs (migration 0041)
- [x] Backend: บันทึก audit log ทุกครั้งที่ upsert (create + update) บัญชีรายวัน
- [x] Backend: tRPC procedures auditLogs + branchAuditLogs สำหรับ admin/manager
- [x] Frontend: tab "ประวัติแก้ไข" ในหน้าบัญชีรายวัน — แสดงใครแก้, เมื่อไหร่, ยอดเดิม/ใหม่

## Bug: ยอดขายแยกหมวดหมู่ไม่ควรแสดงถ้ายังไม่ตั้งค่า (May 2026)
- [x] แก้ไข: แสดง commission rate เสมอ (0.00% ถ้ายังไม่ตั้ง) + หมวดหมู่มาตรฐาน 7 รายการแสดงเสมอ

## ปรับปรุงระบบหมวดหมู่ยอดขาย + Commission (May 2026)
- [x] Admin ตั้งค่าหมวดหมู่มาตรฐาน (7 รายการ) — seed ใน DB + isStandard flag
- [x] ถ้าไม่ได้ตั้งค่า commission → แสดง 0.00% อัตโนมัติ
- [x] เจ้าของสาขาตั้งสิทธิ์ได้ว่าผู้จัดการแก้ไข % commission ได้หรือไม่ — allowManagerEditCommission ใน branches table
- [x] หมวดหมู่มาตรฐานจาก admin แสดงในทุกสาขาอัตโนมัติ + badge "มาตรฐาน" + ไม่สามารถลบได้
- [x] Frontend: แสดง commission rate เสมอทั้งใน category list และ input labels

## แก้ไขหมวดหมู่มาตรฐาน: เปลี่ยนจาก 7 → 5 รายการ (May 2026)
- [x] ลบหมวดหมู่มาตรฐานเก่า 7 รายการออกจาก DB
- [x] เพิ่ม 5 รายการใหม่: ยอดขายหน้าร้าน (โอนเงิน), ยอดขายสินค้าออนไลน์, ยอดขาย Grab, ยอดขาย Shopee Food, ยอดขาย Line Man
- [x] ซ่อน commission % เมื่อเป็น 0 (แสดงเฉพาะเมื่อ > 0%)
- [x] ตั้งค่า commission % ได้ตอนแก้ไขหมวดหมู่

## Bug: ผู้จัดการสาขาบันทึกยอดขายไม่ได้ (May 2026)
- [x] ผู้จัดการสาขา (branch_manager) กดบันทึกยอดขายแล้วขึ้น "ไม่มีสิทธิ์: manage_accounting" — แก้แล้ว
- [x] ออกจากการสวมสิทธิ์ไม่ได้ในแอพ — แก้ปุ่มใหญ่ขึ้น + safe area + touch-manipulation

## ปรับปรุงโครงสร้างสิทธิผู้ใช้ (May 2026)
- [x] เปลี่ยนชื่อ "ผู้จัดการเขต" (area_manager) → "เจ้าของแฟรนไชส์" ทุกที่ (DB label, frontend)
- [x] จำกัดเจ้าของแฟรนไชส์ให้เข้าดูได้เฉพาะสาขาที่ตนเองเป็นเจ้าของ
- [x] แฟรนไชส์รายเดี่ยว (1 สาขา) ห้ามแก้สิทธิเอง — Super Admin กำหนดเท่านั้น

## Meta Pixel Integration (May 2026)
- [x] เพิ่ม Meta Pixel Code (ID: 1676105200089906) ใน index.html — track PageView ทุกหน้า

## HIBI-CL Code Auto-Select Fix (May 2026)
- [x] Backend: CL code ข้ามขั้นตอนเลือกเมนู ดึง compensationMenuCode/Name อัตโนมัติ
- [x] Frontend: ลูกค้าไม่สามารถเลือกเมนูได้สำหรับ CL code — แสดงเมนูที่ผิดพลาดอัตโนมัติ
- [x] Backend: redeemCode อนุญาตให้ CL code ที่มี compensationMenu ผ่านได้โดยไม่ต้องมี selectedMenuItemId
- [x] Vitest tests สำหรับ CL auto-select flow (17 tests passed)

## Bug: ปัญหาออเดอร์ฝั่งผู้จัดการสาขา (May 2026 v2)
- [x] เพิ่ม badge วงกลมสีแดง+ตัวเลข ที่การ์ด "ปัญหาออเดอร์" ใน BranchDashboard เฉพาะ branch_manager
- [x] กรองปัญหาออเดอร์ให้แสดงเฉพาะสาขาของผู้จัดการสาขานั้นๆ (ไม่แสดงทุกสาขา)
- [x] Backend: เพิ่ม pendingCount procedure + แก้ branchId resolution จาก staff record
- [x] Vitest tests (7 tests passed)

## Notification Bell + Push + Sound (May 2026)
- [x] Super Admin: ย้ายระฆังแจ้งเตือนไปบน navbar ข้างๆ menu hamburger
- [x] ผู้จัดการสาขา: เพิ่มระฆังแจ้งเตือนบน navbar ข้างๆ menu hamburger
- [x] ผู้จัดการสาขา: แจ้งเตือนปัญหาออเดอร์ใหม่ใน notification bell
- [x] Push notification ทันที — ส่งแจ้งเตือนเมื่อลูกค้าแจ้งปัญหาใหม่
- [x] Sound alert — เล่นเสียงเมื่อมีปัญหาออเดอร์ใหม่
- [x] Vitest tests (9 tests passed)
- [x] แถบ "กำลังทดสอบในฐานะ" ปุ่มกากบาท (X) ยาวไปบังเนื้อหา — ขยับชิดซ้ายหลังข้อความ
- [x] แถบ "กำลังทดสอบในฐานะ" ปรับให้ไม่ยาวเต็มจอ — ขนาดพอดีข้อความ ปุ่มออกชิดหลังข้อความ
- [x] ปัญหาออเดอร์ (BranchOrderIssues) — เพิ่ม real-time polling ให้ refresh อัตโนมัติไม่ต้องรีเฟรชเอง
- [x] ระฆังแจ้งเตือน navbar — เพิ่มวงกลมสีแดงพร้อมตัวเลข + real-time polling
- [x] ระฆังแจ้งเตือน navbar ผู้จัดการสาขา — ตรวจสอบวงกลมสีแดง+ตัวเลขแสดงผลถูกต้อง (รวมปัญหาออเดอร์+แจ้งเตือนอื่นๆ)
- [x] หน้าบัญชีสาขารายวัน — เพิ่มปุ่มสรุปรายจ่ายต่อ 1 วัน พร้อม export PDF และ CSV
- [x] หน้าสรุป (Summary tab) — ปรับ UI ใหม่ทั้งหมด: เลือกช่วงวันที่ได้ (ปุ่มลัด 7 วัน/สัปดาห์/เดือน + ปฏิทิน)
- [x] หน้าสรุป — กดวันแล้ว popup แสดง detail ของวันนั้น
- [x] หน้าสรุป — "รวมยอดตามหมวดหมู่" แสดงตัวใหญ่เด่นชัด
- [x] หน้าสรุป — Export ได้ 4 แบบ: PDF, CSV, XLSX, Google Sheet
- [x] หน้าสรุป — ยอดที่ export แสดงทั้งจำนวนเต็มและทศนิยม
- [x] หน้าสรุป — ปรับ popup เลือกวันที่ใหม่: ปุ่มลัดซ้าย (วันนี้/เมื่อวาน/7/14/30วัน/เดือนนี้/ปีนี้/ปีที่แล้ว) + ช่องวันที่เริ่ม-สิ้นสุด + ปฏิทินไทย พ.ศ.
- [x] ปุ่มย้อนกลับ — กดแล้วกลับไปหน้าเดิมที่ตำแหน่ง scroll เดิม (ไม่ใช่กลับไปด้านบนสุด)
- [x] Bug: BranchDashboard — "Rendered more hooks than during the previous render" error
- [x] ปุ่มย้อนกลับ (←) ใน header — เปลี่ยนจาก hardcoded backPath เป็น history.back() เพื่อกลับไปหน้าเดิมที่ตำแหน่ง scroll เดิม
- [x] Branch Dashboard — ปรับ layout จัดกลุ่มเป็นหมวดหมู่ (งานด่วน / แต้ม&โค้ด / รายงาน&บัญชี / ตั้งค่า) + compact grid + visual hierarchy
- [x] Branch Dashboard — ปรับสีและไอคอนแต่ละกลุ่มเมนูให้แตกต่างและสังเกตได้ง่ายขึ้น
- [x] กดปุ่ม "การจัดการ (Super Admin)" แล้วให้ไปหน้า Admin เลย (เปลี่ยนเป็น defaultOpen)
- [x] หน้า Login — ปรับ design ให้สวยขึ้น premium matcha brand style
- [x] หน้า Login v2 — split layout (ซ้าย: form ขาวสะอาด, ขวา: รูป matcha + green overlay) ตาม reference Ecodrive
- [x] หน้า Login v3 (+ ปรับ mobile layout ให้กระชับ) — เพิ่ม animation/visual effects, ปุ่ม Admin บนซ้าย, สลับฝั่ง form/image พร้อม motion, ใช้รูป barista ใหม่, เรียบหรู
- [x] หน้าแรก (Welcome/Home) — ออกแบบ UI ใหม่ทั้งหมด + animation + visual effects + live wallpaper + ใช้ง่าย
- [x] หน้า Welcome — ปรับเป็น split layout คล้ายหน้า Login (ซ้าย: เมนูพื้นขาว, ขวา: รูป matcha + green overlay)
- [x] หน้า Welcome — เปลี่ยน icon ให้หรูหราขึ้น + เปลี่ยนรูปฝั่งขวาเป็นรูป barista (admin)

## Admin Dashboard Redesign (May 2026)
- [x] Admin Dashboard — ปรับ layout ใช้ง่าย + icon/สี โทนขาวตัดเขียว matcha + animation + visual effects + live wallpaper
- [x] BUG: database ไม่เชื่อมต่อ — ไม่สามารถ login ด้วยรหัสพนักงานได้ (FIX: input type=tel ไม่รองรับตัวอักษร เปลี่ยนเป็น type=text เมื่ออยู่ในโหมด Admin)
- [x] Admin Dashboard v2 — ปรับ frame/text/layout ให้สวยงามแบบ 2026, ใช้โทนสี Olive/Sage/Forest/Moss/Khaki/Hunter Green ตัดขาว, เพิ่ม layers + visual effects
- [x] Nav Bar — ปรับ frame icon, เพิ่ม animation, visual effects, live wallpaper ให้ดูทันสมัยและใช้งานง่าย
- [x] Header — ปรับเป็น glass morphism ให้เข้ากับ Nav Bar ด้านล่าง
- [x] Slide Menu — ปรับเป็น glass morphism + smooth animation เปิด-ปิด
- [x] All Admin Pages — ปรับ layout ทุกหน้าให้ใช้ premium design system (Color Palette, Glass Morphism, Animations, Live Wallpaper, Component Patterns, ปุ่มสวยงาม, ปุ่มย้อนกลับจัดวางดี)
- [x] AdminPageWrapper — เพิ่ม loading skeleton ให้การเปลี่ยนหน้าดูนุ่มนวลและต่อเนื่อง
- [x] ทุกหน้า Admin — ปรับ premium design ครบทุกปุ่ม + loading skeleton + แก้ back navigation ให้ย้อนกลับถูกหน้าตาม nav map

## Premium Design System — ปรับทุกหน้าที่เหลือ (Customer + Branch)
- [x] Customer pages (20 หน้า) — ปรับ premium design ครบ (live wallpaper, glass morphism, gradient icons, animations, backdrop blur)
- [x] Branch pages (18 หน้า) — ปรับ premium design ครบ (live wallpaper, glass morphism, gradient icons, animations, backdrop blur)

## Bug Fix: ระบบ Login ล่ม — ทุก user ต้องเข้าสู่ระบบได้
- [ ] ตรวจสอบ database users table และ schema
- [ ] ตรวจสอบ auth flow (OAuth, session, JWT)
- [ ] ตรวจสอบ login/register routes และ procedures
- [ ] แก้ไขปัญหาที่ทำให้ login ไม่ได้
- [ ] ทดสอบ login flow ทุก role (customer, branch_staff, branch_manager, branch_owner, area_manager, admin)

## Bug Fix: Admin login ไม่ได้ — input type="tel" ไม่รับ employee code
- [ ] แก้ Admin login form — เปลี่ยน input type จาก "tel" เป็น "text" เมื่อใช้ employee code
- [ ] แก้ backend login — ให้ detect อัตโนมัติว่าเป็น phone หรือ employee code แล้ว route ไปถูก procedure
- [ ] ทดสอบ login ด้วย employee code (HBHQ-00) และเบอร์โทร

## UI Fix: บัญชีสาขารายวัน — tab navigation ล้นจอ
- [x] ปรับ tab navigation ให้ horizontal scroll + pill-style + green gradient active — ไม่ล้นออกนอกจอบน mobile

## Critical Fix: Back Navigation ทั้งแอป — ย้อนกลับหน้าเดิมที่เดินทางมา
- [x] แก้ AdminPageWrapper ให้ใช้ browser history.back() แทน hardcoded backPath
- [x] แก้ทุกหน้า Admin/Branch/Customer/POS ที่มี hardcoded backPath ให้ใช้ history back
- [x] ทดสอบว่าทุกเมนูทุก role กดย้อนกลับแล้วกลับหน้าเดิม

## Mobile Responsive — ปรับ UI ให้ใช้งานได้ดีบน Android/iOS
- [x] สร้าง useIsMobile hook สำหรับ detect mobile vs desktop (มีอยู่แล้ว)
- [x] DailySales — export buttons responsive + ปุ่มย้อนกลับหลัง export
- [x] ทุกหน้าที่มี export (PDF/CSV) — ปรับ export buttons responsive
- [x] Admin Reports/CommissionReport — export buttons responsive
- [x] สร้าง MobileDataCard + ResponsiveTable components
- [x] Branch/POS pages (30 หน้า) — ปุ่มใหญ่ขึ้นบน mobile (size responsive)

## Petty Cash — Multi-Image + File Picker + OCR
- [x] Support multiple image uploads per petty cash transaction (currently single image only)
- [x] Allow file picker from gallery (not just camera capture) — support PNG, JPG, PDF
- [x] Implement OCR to extract text from receipt images/PDFs for auto-fill
- [x] Update database schema for multiple images per transaction
- [x] Update backend procedures for multi-image handling
- [x] Update frontend UI to show multiple image thumbnails + add/remove
- [x] Make OCR stable and accurate for Thai receipts

## Petty Cash — Auto OCR + Editable Results
- [x] Auto-trigger OCR immediately when image is attached (no manual button press needed)
- [x] Allow user to edit OCR-filled fields (amount, description, category, date) before submitting
- [x] Show OCR result summary that user can accept or modify

## Petty Cash — Full-screen Zoom + Confidence Score + Loading Animation
- [x] Full-screen zoom: click thumbnail to view receipt image in full-screen overlay with pinch-zoom
- [x] Confidence Score: OCR returns confidence per field, display color-coded indicators (green/yellow/red)
- [x] Loading animation: clear progress bar/animation during OCR processing with status text

## Petty Cash — Separate Transactions Per Receipt
- [x] Each image OCR'd separately and shown as numbered entry (01, 02, 03...)
- [x] Each entry has its own editable fields (amount, description, category, date)
- [x] Submit creates multiple separate transactions (one per receipt/entry)
- [x] Users can remove individual entries before submitting
- [x] Show total summary of all entries before submitting

## Petty Cash — Smart Group by OCR Similarity
- [x] After OCR, compare new image's data (amount, vendor, date) with existing entries
- [x] If data matches an existing entry → add image to that entry (multi-image per entry)
- [x] If data is different → create new separate entry automatically
- [x] Each entry supports multiple receipt images (same bill, different angles/pages)
- [x] Update backend addExpense to accept multiple images per entry (already done)
- [x] Show grouped images in entry card with count badge

## Petty Cash — Split/Merge + Receipt History Popup
- [x] Add "แยกรายการ" button: when entry has multiple images, allow splitting one image into a new separate entry
- [x] Add "รวมรายการ" button: allow user to manually merge 2 entries into one (combine images + keep one set of data)
- [x] Show receipt images in transaction history list as clickable thumbnails with popup preview
- [x] Receipt popup should be a small overlay/modal (no page navigation needed)
- [x] Make the whole flow smooth — no unnecessary page changes or back navigation

## Code Expiry — End of Day Fix
- [x] Fix code expiry to expire at 23:59:59 of the expiry date (not 00:00:00 start of day)
- [x] Customers can use codes throughout the entire last day until midnight

## Performance Optimization — Dashboard & All Pages
- [x] Diagnose slow loading causes (heavy queries, large bundle, unnecessary re-fetches)
- [x] Optimize backend queries (add indexes, reduce data fetched, pagination)
- [x] Add lazy loading for routes/pages (code splitting) — React.lazy + Suspense for all 100+ pages
- [x] Add proper skeleton/loading states for instant perceived performance
- [x] Reduce unnecessary re-renders and re-fetches on frontend — global staleTime 30s, refetchOnWindowFocus disabled
- [x] Optimize bundle size (tree shaking, dynamic imports) — code splitting via React.lazy
- [x] Make Dashboard load fast on both mobile and PC — polling reduced from 10s to 60s, staleTime 30s global

## Date & Time Range Filter — AdminPointClaims (/admin/point-claims)
- [x] Add datetime range picker UI (start date+time, end date+time) between branch filter and status tabs
- [x] Implement HH:MM time picker with calendar icon and clock icon
- [x] Add shortcut buttons: "วันนี้" / "7 วันล่าสุด" / "เดือนนี้" as pill/chip style
- [x] Add "ล้างตัวกรอง" text button to reset date filter
- [x] Filter by orderDate field (วันที่สั่งซื้อ) with AND condition alongside branch + status filters
- [x] Pass fromDate/toDate to backend claimsQueue query (already supported)
- [x] Polished UI: white card with shadow, border-radius, green theme, responsive mobile/desktop

## Refactor Date Filter to Button + Dropdown — AdminPointClaims
- [x] Replace always-visible date filter panel with a trigger button in the branch filter row
- [x] Implement dropdown with fade+slide animation, click-outside-to-close
- [x] Show summary text on button when filter is active (e.g. "16 พ.ค. – 18 พ.ค.")
- [x] Add "ใช้งาน" (apply) and "ล้าง" (clear) buttons inside dropdown
- [x] Responsive: 360px dropdown on desktop, full-width on mobile
- [x] Keep all filter logic (fromDate/toDate/useMemo) untouched

## Refactor Date Picker to Modal Popup with Calendar — AdminPointClaims
- [x] Change from dropdown to centered modal popup with backdrop
- [x] 2-column layout: shortcut list (left) + calendar (right)
- [x] Shortcut list: วันนี้/เมื่อวาน/7 วัน/14 วัน/30 วัน/เดือนนี้/ปีนี้/ปีที่แล้ว
- [x] Calendar: month view with range selection (start–end highlight green)
- [x] Date display fields above calendar showing selected start/end
- [x] Confirm button (green, full-width) at bottom
- [x] Modal: 480px width, border-radius 20px, X close button, click-outside-to-close
- [x] Animation: fade-in + scale-up, compact font/padding
- [x] Keep all filter logic untouched

## Real-time Clock on Admin Dashboard
- [x] Add real-time clock to header banner (green area with name/role)
- [x] Show Thai date (วันจันทร์ที่ 18 พฤษภาคม 2569) and time (HH:MM:SS)
- [x] Update every 1 second with proper cleanup on unmount
- [x] Responsive: hide/shrink on mobile if space is limited

## Back Button Audit & Consistency
- [x] Create reusable BackButton component in components/common/
- [x] Fix AdminInquiries — add back button to page header
- [x] Verify all pages have consistent back button style (audit: all 80+ non-root pages already have back buttons via AdminPageWrapper or MobileLayout showBack)

## Move Real-time Clock to Global Header
- [x] Remove RealtimeClock from AdminDashboard banner
- [x] Create standalone RealtimeClock component in components/common/
- [x] Add clock to AdminPageWrapper header (admin pages)
- [x] Add clock to MobileLayout header (branch/customer/branch pages)
- [x] POS pages — standalone layout, no shared header (POS is full-screen terminal mode)
- [x] Responsive: show time only on mobile, date+time on desktop
- [x] Font monospace for time digits, hover shows full date (title tooltip)

## Greeting Message in Global Header Clock
- [x] Add time-based greeting (สวัสดีตอนเช้า/บ่าย/เย็น/ดึก) next to clock in RealtimeClock component

## Date Range Picker & Features for 10 Admin Pages
- [x] 1. /admin/give-points — Add DateRangePicker + history list (ชื่อลูกค้า, แต้ม, วันเวลา, สาขา, ผู้ให้)
- [x] 2. /admin/point-claims — Refactored to use reusable DateRangePickerModal
- [x] 3. /admin/reviews — Add DateRangePicker filter by review submission date
- [x] 4. /admin/compensation-codes — Add DateRangePicker + history list (โค้ด, มูลค่า, สร้างโดย, วันเวลา, สถานะ)
- [x] 5. /admin/use-code — Add DateRangePicker + history list (โค้ด, ลูกค้า, วันเวลาใช้, สาขา, มูลค่า)
- [x] 6. /admin/reports — Add DateRangePicker + export history list
- [x] 7. /admin/audit-logs — Add DateRangePicker filter by log timestamp
- [x] 8. /admin/order-issues — Add DateRangePicker + "ผู้อนุมัติ" column/field
- [x] 9. /admin/contact — Fix back button (wrapped in AdminPageWrapper)
- [x] 10. /admin/branch-overview — Add DateRangePicker + Export CSV button

## Customer OTP Password Reset (Self-Service via Email)
- [x] Install resend package for email sending
- [x] Set up RESEND_API_KEY secret
- [x] Create server/lib/email.ts with sendOtpEmail helper
- [x] Add customerOtpReset.requestOtp endpoint (generate OTP, send via email)
- [x] Add customerOtpReset.confirmOtp endpoint (verify OTP, reset password)
- [x] Update ForgotPassword.tsx with OTP self-service flow + admin request flow
- [x] tsc --noEmit passes with 0 errors
- [x] All tests pass (1093 tests)

## System Update Popup Notification
- [x] Create SystemUpdatePopup component (one-time per device via localStorage)
- [x] Display password reset notice to all users (logged in or not)
- [x] "รับทราบ" button to dismiss permanently
- [x] Mount in App.tsx

## Bug Fix: Petty Cash transferMethod empty string
- [x] Backend: defensive null check in createPettyCashTransaction for empty string transferMethod
- [x] Backend: trim + cast transferMethod in addDeposit and processFundRequest procedures
- [x] tsc --noEmit passes with 0 errors

## Bug Fix: Duplicate review check uses short orderId instead of unique long ID
- [x] Fix checkApprovedReviewExists: use shopeeOrderId/linemanOrderId for Shopee/Lineman + check pending
- [x] Fix deleteRejectedReviewRequest: same unique ID logic
- [x] Drop unique_delivery_order index (deliveryApp, orderId) from review_requests
- [x] Unblock customer 8400004 review submission (Shopee #211, shopeeOrderId 1564561385644418)
- [x] Test: new 16-digit ID passes, duplicate 16-digit ID blocked, pending review blocked (9 tests passed)

## Bug Fix #2: PettyCash Scan/Manual Toggle
- [x] DB: Add pct_entryMethod ENUM('ocr','manual') column to petty_cash_transactions
- [x] Schema: Add entryMethod field to pettyCashTransactions in drizzle/schema.ts
- [x] Server: Modify addExpense - receiptImages min(0) + entryMethod field + save to DB
- [x] Client: Add expenseMode state + segmented toggle UI in PettyCash.tsx
- [x] Client: Add addManualEntry function to create empty entry
- [x] Client: Update validation message (generic for both modes)
- [x] Client: Pass entryMethod to server on submit
- [x] Test: Vitest for addExpense with empty receiptImages + entryMethod
- [x] Verify: tsc 0 errors + pnpm test all pass

## POS → Launcher Migration
- [x] Set VITE_POS_V2_URL env variable
- [x] Create POSLauncher.tsx page
- [x] Update App.tsx routes (remove 14 old, add launcher + catch-all)
- [x] Delete 17 POS files (14 pages + 2 components + 1 context)
- [x] Update AdminDashboard.tsx (remove POS section, add launcher link)
- [x] Update BranchManagement.tsx (remove staff-pins link)
- [x] tsc --noEmit 0 errors
- [x] pnpm test pass
- [x] Write vitest for launcher

## Deduct/Revoke Points Feature
- [x] Add deductPoints db helper function (type: 'adjust', negative points)
- [x] Add deductPoints tRPC procedure (manager+ permission)
- [x] Create AdminDeductPoints.tsx page
- [x] Add route in App.tsx
- [x] Add menu item in AdminDashboard (manager+ only visible)
- [x] Write vitest tests (5 tests pass)
- [x] Verify tsc + tests pass

## Fix Deduct Points - Require Branch Selection
- [x] Frontend: Add branch dropdown (mandatory) in AdminDeductPoints
- [x] Frontend: Show branch-specific points balance after selecting customer + branch
- [x] Backend: Make branchId required in deductPoints procedure
- [x] Backend: Fix audit log to always include branchId
- [x] Update vitest tests for new required branchId
- [x] Verify tsc + tests pass

## Fix Code Generation - No Duplicates & Ensure Usability
- [x] Make generateCode check DB for uniqueness (retry if duplicate exists)
- [x] Make generateFreeDrinkCode check DB for uniqueness (retry if duplicate exists)
- [x] Ensure redeemCode works correctly for all valid issued codes
- [x] Add vitest tests for unique code generation (14 tests pass)
- [x] Verify tsc + tests pass

## Fix: Middleware refresh role from DB
- [x] Middleware now reads fresh role from DB on every request (no need to re-login after role change)
- [x] Also invalidates session if staff is deactivated
- [x] tsc 0 errors

## Announcements - Add Staff Audience Type
- [x] Schema: add audienceType + staffBranchIds columns
- [x] Backend: update create/update/list procedures
- [x] Frontend: update dropdown + staff branch multi-select
- [x] Filter: customer sees customer/both, staff sees staff/both (own branch)

## Bug Fix: พนักงานไม่สามารถเข้าสู่ระบบได้
- [ ] ตรวจสอบและแก้ไขปัญหา staff login flow

## Social Login (OAuth 2.0) - Google, Facebook, LINE
- [x] DB: Create user_oauth_links table (id, user_id, provider, provider_user_id, email, linked_at)
- [x] Backend: Create server/lib/oauth.ts (Google, Facebook, LINE token exchange)
- [x] Backend: Add oauth router (handleCallback, linkAccount, unlinkAccount, listLinked)
- [x] Backend: DB helpers (getOauthLinkByProviderUser, getOauthLinksByUserId, createOauthLink, deleteOauthLink)
- [x] Frontend: Add SocialLoginButtons to Login.tsx (Google, Facebook, LINE with brand icons)
- [x] Frontend: Create OAuthCallback page (handle redirect, link flow)
- [x] Frontend: Create ConnectedAccounts settings page (connect/unlink providers)
- [x] Frontend: Add "บัญชีที่เชื่อมต่อ" menu item to CustomerHome
- [x] Frontend: Add routes in App.tsx (/oauth/callback, /customer/connected-accounts)

## Code System Fixes (Jun 2026)
- [x] CASE 1 (HIBI-CL): redeemCode() อนุญาตให้ CL code ทุกตัวผ่านได้โดยไม่ต้องมี selectedMenu — ไม่ต้องเช็ค compensationMenuCode อีกต่อไป
- [x] CASE 2 (HIBI-PT): codes.lookup ค้นหา reward_redemptions table เป็น fallback สำหรับ PT codes; RedeemCode.tsx + AdminRedeemCode.tsx รองรับ PT codes (redeemPTMutation, isPTCode flag, status badge, type label)
- [x] CASE 3 (HIBI-PT expiry): ตรวจสอบแล้ว — ไม่มี PT→RV conversion logic ใน codebase, PT codes มี expiresAt อยู่แล้ว, ไม่ต้องแก้ไข

## Bug Fix: Grab GF Number Duplicate False Positive (Jun 10, 2026)
- [x] Fix Point Claims: Grab should skip checkExistingClaim (GF number reuses) — Booking ID is the real unique key
- [x] Fix Review Submit: Grab should use bookingId for dedup instead of orderId (GF number)
