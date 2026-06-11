# Bug Analysis

## Bug 1: Date shows as Buddhist Era (BE 2569)
- `<input type="date">` on iOS Safari uses device locale
- Thai locale shows dates in Buddhist Era (พ.ศ.)
- Solution: Replace native `<input type="date">` with custom Calendar + Popover from shadcn/ui
- The Calendar component uses react-day-picker which renders in CE by default
- date-fns is available for formatting

## Bug 2: SQL Error on point_claims insert
- Error from screenshot: "Failed query: insert into `point_claims` (`id`, `customerId`, `branchId`, `claimDeliveryApp`, `claimPointOrderId`, `gfNumber`, `bookingId`, `shopeeOrderNumber`, `shopeeOrderId`, `linemanOrderNumber`, `linemanOrderId`, `orderDate`, `orderAmount`, `screenshotUrl`, `claimStatus`, `pointsAwarded`, `reviewedBy`, `claimRejectionReason`, `claimCreatedAt`, `claimUpdatedAt`) values (default, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, default, default, default, default, default)"
- params: 4740001,1,lineman,#2250,,,,#2250,LMF-260404-582612250,2026-04-04 00:00:00.000,131,https://...
- The error shows empty params for gfNumber, bookingId, shopeeOrderNumber, shopeeOrderId
- These are being passed as empty strings "" instead of null
- MySQL might reject empty string for varchar columns or the issue is the orderDate timestamp format

## Key files:
- ClaimPoints.tsx: line 546-549 has the date input
- routers.ts: line 1081-1211 has submitClaim procedure
- db.ts: line 638-643 has createPointClaim function
- schema.ts: point_claims table definition

## Fix plan:
1. Replace `<input type="date">` with Calendar + Popover (CE format)
2. Fix the orderDate parsing to ensure proper Date object
3. Ensure null values are properly passed for unused delivery app fields

## Bug 3: Give Points - ใส่ยอดเงินคำนวณคะแนนไม่ได้

### Backend flow:
- earnAtStore uses branchAdminProcedure
- calculatePoints(amount, tier) → Math.floor(amount / 10)
- addPoints returns { totalPoints, lifetimePoints, tier, pointsEarned }
- earnAtStore returns { ...result, customerName, branchId }

### Issue found:
- Frontend displays `giveSuccess.newBalance` but backend returns `totalPoints` → shows undefined
- The `newBalance` field doesn't exist in the response

### Fix:
- Update backend to also return `newBalance` (totalPoints - usedPoints)
