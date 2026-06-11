import 'dotenv/config';
import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { sql } from 'drizzle-orm';

const pool = mysql.createPool(process.env.DATABASE_URL);
const db = drizzle(pool);

async function main() {
  // 1. Count total codes
  const [totalResult] = await db.execute(sql`SELECT COUNT(*) as cnt FROM codes`);
  console.log(`\n=== รายงานคูปอง/โค้ดที่ไม่มีข้อมูลเมนู ===\n`);
  console.log(`จำนวนโค้ดทั้งหมด: ${totalResult[0].cnt}`);

  // 2. Count codes WITHOUT selectedMenuItemId (customer hasn't selected menu)
  const [noMenuResult] = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM codes 
    WHERE codeSelectedMenuItemId IS NULL AND codeSelectedMenuCode IS NULL AND codeSelectedMenuName IS NULL
  `);
  console.log(`โค้ดที่ยังไม่เลือกเมนู: ${noMenuResult[0].cnt}`);

  // 3. Count codes WITH selectedMenuItemId
  const [withMenuResult] = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM codes 
    WHERE codeSelectedMenuItemId IS NOT NULL OR codeSelectedMenuCode IS NOT NULL OR codeSelectedMenuName IS NOT NULL
  `);
  console.log(`โค้ดที่เลือกเมนูแล้ว: ${withMenuResult[0].cnt}`);

  // 4. Break down by status
  const [byStatus] = await db.execute(sql`
    SELECT codeStatus, 
      SUM(CASE WHEN codeSelectedMenuItemId IS NULL AND codeSelectedMenuCode IS NULL THEN 1 ELSE 0 END) as no_menu,
      SUM(CASE WHEN codeSelectedMenuItemId IS NOT NULL OR codeSelectedMenuCode IS NOT NULL THEN 1 ELSE 0 END) as has_menu,
      COUNT(*) as total
    FROM codes 
    GROUP BY codeStatus
  `);
  console.log(`\n--- แยกตามสถานะ ---`);
  for (const row of byStatus) {
    console.log(`${row.codeStatus}: ไม่มีเมนู ${row.no_menu} / มีเมนู ${row.has_menu} / รวม ${row.total}`);
  }

  // 5. Break down by type (RV vs CL)
  const [byType] = await db.execute(sql`
    SELECT codeType, 
      SUM(CASE WHEN codeSelectedMenuItemId IS NULL AND codeSelectedMenuCode IS NULL THEN 1 ELSE 0 END) as no_menu,
      SUM(CASE WHEN codeSelectedMenuItemId IS NOT NULL OR codeSelectedMenuCode IS NOT NULL THEN 1 ELSE 0 END) as has_menu,
      COUNT(*) as total
    FROM codes 
    GROUP BY codeType
  `);
  console.log(`\n--- แยกตามประเภท ---`);
  for (const row of byType) {
    const typeName = row.codeType === 'RV' ? 'รีวิว (RV)' : 'ชดเชย (CL)';
    console.log(`${typeName}: ไม่มีเมนู ${row.no_menu} / มีเมนู ${row.has_menu} / รวม ${row.total}`);
  }

  // 6. List codes that have been REDEEMED but have no menu selection (problematic ones)
  const [redeemedNoMenu] = await db.execute(sql`
    SELECT c.id, c.code, c.codeType, c.codeStatus, c.codeSelectedMenuCode, c.codeSelectedMenuName, 
           c.codeActivatedAt, c.redeemedAt,
           cust.name as custName, cust.phone
    FROM codes c
    LEFT JOIN customers cust ON c.customerId = cust.id
    WHERE c.codeStatus = 'redeemed' 
      AND c.codeSelectedMenuItemId IS NULL 
      AND c.codeSelectedMenuCode IS NULL
    ORDER BY c.redeemedAt DESC
    LIMIT 50
  `);
  console.log(`\n--- โค้ดที่ถูกใช้แล้วแต่ไม่มีเมนู (${redeemedNoMenu.length} รายการ) ---`);
  for (const row of redeemedNoMenu) {
    console.log(`  ID: ${row.id} | ${row.code} | ${row.codeType} | ลูกค้า: ${row.custName || '-'} | เบอร์: ${row.phone || '-'} | ใช้เมื่อ: ${row.redeemedAt || '-'}`);
  }

  // 7. List ISSUED codes (active, not yet used) without menu
  const [issuedNoMenu] = await db.execute(sql`
    SELECT c.id, c.code, c.codeType, c.codeStatus, c.codeSelectedMenuCode, c.codeSelectedMenuName, 
           c.codeActivatedAt, c.expiresAt,
           cust.name as custName, cust.phone
    FROM codes c
    LEFT JOIN customers cust ON c.customerId = cust.id
    WHERE c.codeStatus = 'issued' 
      AND c.codeSelectedMenuItemId IS NULL 
      AND c.codeSelectedMenuCode IS NULL
    ORDER BY c.issuedAt DESC
    LIMIT 50
  `);
  console.log(`\n--- โค้ดที่ยังไม่ใช้ + ไม่มีเมนู (${issuedNoMenu.length} รายการ) ---`);
  for (const row of issuedNoMenu) {
    console.log(`  ID: ${row.id} | ${row.code} | ${row.codeType} | ลูกค้า: ${row.custName || '-'} | เบอร์: ${row.phone || '-'} | หมดอายุ: ${row.expiresAt || '-'}`);
  }

  // 8. Check if there's an "activated" state - codes that customer selected menu but not yet redeemed
  const [activatedWithMenu] = await db.execute(sql`
    SELECT COUNT(*) as cnt FROM codes 
    WHERE codeActivatedAt IS NOT NULL 
      AND (codeSelectedMenuItemId IS NOT NULL OR codeSelectedMenuCode IS NOT NULL)
  `);
  console.log(`\nโค้ดที่ลูกค้าเลือกเมนูแล้ว (activated): ${activatedWithMenu[0].cnt}`);

  await pool.end();
}

main().catch(console.error);
