import 'dotenv/config';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const conn = await mysql.createConnection(DATABASE_URL);
  
  console.log("=== ตรวจหาลูกค้าซ้ำในระบบ ===\n");

  // 1. Find duplicates by normalized phone (strip non-digits)
  console.log("--- ลูกค้าที่เบอร์โทรซ้ำกัน (หลัง normalize) ---");
  const [phoneRows] = await conn.execute(`
    SELECT 
      REPLACE(REPLACE(REPLACE(REPLACE(phone, '-', ''), ' ', ''), '(', ''), ')', '') AS clean_phone,
      GROUP_CONCAT(id ORDER BY id SEPARATOR ', ') AS ids,
      GROUP_CONCAT(name ORDER BY id SEPARATOR ' | ') AS names,
      GROUP_CONCAT(phone ORDER BY id SEPARATOR ' | ') AS phones,
      GROUP_CONCAT(COALESCE(email, 'N/A') ORDER BY id SEPARATOR ' | ') AS emails,
      COUNT(*) AS cnt
    FROM customers
    GROUP BY clean_phone
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);
  
  if (phoneRows.length === 0) {
    console.log("ไม่พบเบอร์โทรซ้ำ\n");
  } else {
    console.log(`พบ ${phoneRows.length} กลุ่มเบอร์โทรซ้ำ:\n`);
    for (const row of phoneRows) {
      console.log(`  เบอร์: ${row.clean_phone}`);
      console.log(`  IDs: ${row.ids}`);
      console.log(`  ชื่อ: ${row.names}`);
      console.log(`  เบอร์ดิบ: ${row.phones}`);
      console.log(`  อีเมล: ${row.emails}`);
      console.log(`  จำนวน: ${row.cnt} รายการ`);
      console.log("");
    }
  }

  // 2. Find duplicates by email
  console.log("--- ลูกค้าที่อีเมลซ้ำกัน ---");
  const [emailRows] = await conn.execute(`
    SELECT 
      LOWER(TRIM(email)) AS clean_email,
      GROUP_CONCAT(id ORDER BY id SEPARATOR ', ') AS ids,
      GROUP_CONCAT(name ORDER BY id SEPARATOR ' | ') AS names,
      GROUP_CONCAT(phone ORDER BY id SEPARATOR ' | ') AS phones,
      COUNT(*) AS cnt
    FROM customers
    WHERE email IS NOT NULL AND email != ''
    GROUP BY clean_email
    HAVING cnt > 1
    ORDER BY cnt DESC
  `);
  
  if (emailRows.length === 0) {
    console.log("ไม่พบอีเมลซ้ำ\n");
  } else {
    console.log(`พบ ${emailRows.length} กลุ่มอีเมลซ้ำ:\n`);
    for (const row of emailRows) {
      console.log(`  อีเมล: ${row.clean_email}`);
      console.log(`  IDs: ${row.ids}`);
      console.log(`  ชื่อ: ${row.names}`);
      console.log(`  เบอร์: ${row.phones}`);
      console.log(`  จำนวน: ${row.cnt} รายการ`);
      console.log("");
    }
  }

  // 3. Summary: total customers and duplicates
  const [[{ total }]] = await conn.execute(`SELECT COUNT(*) as total FROM customers`);
  console.log(`\n=== สรุป ===`);
  console.log(`ลูกค้าทั้งหมด: ${total} คน`);
  console.log(`กลุ่มเบอร์โทรซ้ำ: ${phoneRows.length} กลุ่ม`);
  console.log(`กลุ่มอีเมลซ้ำ: ${emailRows.length} กลุ่ม`);

  // 4. For each duplicate, show loyalty points
  if (phoneRows.length > 0 || emailRows.length > 0) {
    console.log("\n--- รายละเอียดแต้มสะสมของลูกค้าซ้ำ ---");
    
    // Collect all duplicate IDs
    const allDupIds = new Set();
    for (const row of phoneRows) {
      row.ids.split(', ').forEach(id => allDupIds.add(parseInt(id)));
    }
    for (const row of emailRows) {
      row.ids.split(', ').forEach(id => allDupIds.add(parseInt(id)));
    }
    
    if (allDupIds.size > 0) {
      const idList = [...allDupIds].join(',');
      const [pointRows] = await conn.execute(`
        SELECT c.id, c.name, c.phone, c.email, c.createdAt,
               COALESCE(lp.totalPoints, 0) AS totalPoints, 
               COALESCE(lp.usedPoints, 0) AS usedPoints,
               COALESCE(lp.lifetimePoints, 0) AS lifetimePoints,
               COALESCE(lp.tier, 'none') AS tier
        FROM customers c
        LEFT JOIN loyalty_points lp ON lp.customerId = c.id
        WHERE c.id IN (${idList})
        ORDER BY c.id
      `);
      
      console.log("");
      for (const row of pointRows) {
        console.log(`  ID: ${row.id} | ${row.name} | ${row.phone} | ${row.email}`);
        console.log(`    สมัคร: ${row.createdAt} | แต้มรวม: ${row.totalPoints} | ใช้ไป: ${row.usedPoints} | ตลอดชีพ: ${row.lifetimePoints} | Tier: ${row.tier}`);
      }
    }
  }

  await conn.end();
}

main().catch(console.error);
