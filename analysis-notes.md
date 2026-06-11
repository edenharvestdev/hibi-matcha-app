# Bug Analysis Notes

## Bug 1: ลูกค้าสมัครซ้ำ
- ระบบเช็ค phone ซ้ำแล้ว (line 279 routers.ts) → throw CONFLICT
- แต่ไม่ได้เช็ค email ซ้ำ! → ต้องเพิ่ม getCustomerByEmail check
- ปัญหา: phone ถูก normalize (strip non-digit) แต่ถ้าลูกค้าใส่ "06-1616-6213" vs "0616166213" → normalize แล้วเหมือนกัน ควรจะ block ได้
- ดูจากรูป: ID 5340002 phone=0616166213, ID 4380001 phone=06-1616-6213 → normalize แล้วเหมือนกัน!
  - อาจเป็นไปได้ว่า phone ถูก store แบบมี dash → ทำให้ getCustomerByPhone ไม่เจอ
  - ต้องเช็คว่า createCustomer เก็บ phone แบบ clean หรือไม่

## Bug 2: ใส่ยอดเงินคำนวณคะแนนไม่ได้
- Frontend code ดูปกติ: handleGivePoints → earnMutation.mutate
- calculatePoints(amountBaht, tier) → Math.floor(amountBaht / 10) → ควรทำงานได้
- Backend earnAtStore: ดูปกติ
- ต้องเช็ค browser console log ว่ามี error อะไร
- อาจเป็นปัญหา branchAdminProcedure → ต้องเช็คว่า staff มี permission หรือไม่

## Action Items
1. Query DB หาลูกค้าซ้ำ (phone/email)
2. เพิ่ม email duplicate check ใน register
3. เช็ค phone storage format
4. ตรวจสอบ browser error สำหรับ earnAtStore
