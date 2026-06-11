/**
 * Migration script: Strip dashes and non-digit characters from phone numbers
 * in customers and staff_members tables.
 * 
 * Run: node server/migrate-phones.mjs
 */
import mysql from "mysql2/promise";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL not set");
  process.exit(1);
}

async function main() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // 1. Find customers with non-digit characters in phone
    const [badCustomers] = await connection.execute(
      "SELECT id, phone FROM customers WHERE phone REGEXP '[^0-9]'"
    );
    console.log(`Found ${badCustomers.length} customers with non-digit phone numbers`);
    
    for (const c of badCustomers) {
      const cleanPhone = c.phone.replace(/\D/g, "");
      // Check if clean phone already exists (would cause duplicate)
      const [existing] = await connection.execute(
        "SELECT id FROM customers WHERE phone = ? AND id != ?",
        [cleanPhone, c.id]
      );
      if (existing.length > 0) {
        console.log(`  SKIP customer ${c.id}: ${c.phone} -> ${cleanPhone} (duplicate exists: ID ${existing[0].id})`);
        continue;
      }
      await connection.execute(
        "UPDATE customers SET phone = ? WHERE id = ?",
        [cleanPhone, c.id]
      );
      console.log(`  FIXED customer ${c.id}: ${c.phone} -> ${cleanPhone}`);
    }
    
    // 2. Find staff with non-digit characters in phone
    const [badStaff] = await connection.execute(
      "SELECT id, phone FROM staff WHERE phone REGEXP '[^0-9]'"
    );
    console.log(`Found ${badStaff.length} staff with non-digit phone numbers`);
    
    for (const s of badStaff) {
      const cleanPhone = s.phone.replace(/\D/g, "");
      const [existing] = await connection.execute(
        "SELECT id FROM staff WHERE phone = ? AND id != ?",
        [cleanPhone, s.id]
      );
      if (existing.length > 0) {
        console.log(`  SKIP staff ${s.id}: ${s.phone} -> ${cleanPhone} (duplicate exists: ID ${existing[0].id})`);
        continue;
      }
      await connection.execute(
        "UPDATE staff SET phone = ? WHERE id = ?",
        [cleanPhone, s.id]
      );
      console.log(`  FIXED staff ${s.id}: ${s.phone} -> ${cleanPhone}`);
    }
    
    // 3. free_drink_codes uses customerId (no phone column), so no migration needed there
    
    console.log("\nMigration complete!");
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
