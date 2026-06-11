# Code Analysis Summary

## Current Schema (key tables)
- `codes` table: type RV/CL, branchId, customerId, reviewRequestId, email, status (issued/redeemed/expired/cancelled), claimReason, claimOrderId
- `freeDrinkCodes` table: code, campaignId, customerId, branchId, menuCode/Name, sizeCode/Name, milkCode/Name, status, sourceType (review/claim/campaign/manual), sourceId
- `freeDrinkCampaigns` table: menuOptions JSON, maxCodesPerCustomer, validFrom/Until, branchScope
- `rewardRedemptions` table: customerId, rewardId, pointsSpent, status, redemptionCode, branchId, usedAt, expiresAt
- `reviewRequests` table: customerId, branchId, deliveryApp, orderId, status (pending/approved/rejected)
- `pointClaims` table: customerId, branchId, deliveryApp, orderId, orderAmount, status

## Current Routers
- `reviews.approve` (line ~460): creates a `codes` table entry (type RV) when review approved
- `codes.redeem` (line ~524): staff redeems RV/CL code
- `codes.lookup` (line ~537): staff looks up code
- `loyalty.redeemReward` (line ~912): customer redeems reward with points → creates rewardRedemption
- `loyalty.useRedemption` (line ~951): staff uses redemption code
- `loyalty.lookupRedemption` (line ~968): staff looks up redemption code
- `freeDrinkCodes.issue` (line ~1247): staff issues free drink code
- `freeDrinkCodes.myCodes` (line ~1286): customer lists their free drink codes
- `freeDrinkCodes.redeem` (line ~1292): customer redeems free drink code
- `freeDrinkCodes.confirmRedeem` (line ~1318): customer confirms redemption
- `freeDrinkCodes.staffRedeem` (line ~1331): staff redeems free drink code at counter

## Current Pages
- AdminReviewQueue: shows pending reviews for admin
- AdminPointClaims: shows pending point claims for admin
- AdminRedeemCode: admin redeems codes (RV/CL + free drink + reward redemption)
- BranchDashboard: branch navigation (ReviewQueue, PointClaimsQueue, RedeemCode)
- ReviewQueue: branch review queue
- PointClaimsQueue: branch point claims queue
- RedeemCode: branch redeems codes
- MyCodes: customer sees their codes (RV/CL codes)
- FreeDrinks: customer sees free drink codes
- RewardsCatalog: customer browses & redeems rewards with points

## What needs to change

### 1. Split Approval pages: A (Review/Free codes) vs B (Point claims)
- AdminReviewQueue + AdminPointClaims are already separate pages ✓
- Need to add navigation tabs in admin/branch dashboards to separate them clearly

### 2. Confirmation popup before reward redemption
- RewardsCatalog already has some dialog - need to enhance with clear confirmation

### 3. Review Menu System
- Need new table: `review_menu_items` (admin manages menu items for review rewards)
- After customer gets review code → they select menu + sweetness + packing
- Generate copy text for delivery
- freeDrinkCodes already has menu selection - but review codes (RV type in `codes` table) don't
- Need to add: selectedMenuId, sweetness, packingType, deliveryOrderId to freeDrinkCodes or codes table

### 4. Staff mark code as used + Order ID for delivery
- Staff enters code → sees details → enters delivery Order ID → marks as used
- Already have codes.redeem and freeDrinkCodes.staffRedeem
- Need to add deliveryOrderId field when marking as used

## Plan
1. Add `review_menu_items` table for admin to manage review menus
2. Add columns to `freeDrinkCodes`: sweetness (int grams), packingType (enum), deliveryOrderId
3. Modify review approve flow: after approve, create freeDrinkCode (not just codes table entry) OR let customer choose menu after getting code
4. Create admin menu management page
5. Create customer menu selection flow after getting review code
6. Add copy-to-clipboard for delivery message
7. Enhance staff redeem to include deliveryOrderId
8. Split approval navigation clearly
9. Add confirmation popup to rewards
