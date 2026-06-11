import { createConnection } from 'mysql2/promise';

const conn = await createConnection(process.env.DATABASE_URL);

console.log("=== 1. All review_requests for customerId 8400004 ===");
const [reviews] = await conn.execute('SELECT id, customerId, branchId, deliveryApp, orderId, status, reviewedBy, createdAt, updatedAt, shopeeOrderId, shopeeOrderNumber FROM review_requests WHERE customerId = 8400004 ORDER BY createdAt ASC');
console.log(JSON.stringify(reviews, null, 2));

console.log("\n=== 2. Find tables related to codes/rewards/coupons ===");
const [tables] = await conn.execute("SHOW TABLES");
const allTables = tables.map(t => Object.values(t)[0]);
const relevantTables = allTables.filter(t => 
  t.includes('code') || t.includes('coupon') || t.includes('voucher') || t.includes('reward') || t.includes('point')
);
console.log(relevantTables.join('\n'));

console.log("\n=== 3. Check point_transactions for customerId 8400004 ===");
const [points] = await conn.execute('SELECT * FROM point_transactions WHERE customerId = 8400004');
console.log("Point transactions count:", points.length);
console.log(JSON.stringify(points, null, 2));

// Check each reward-related table for this customer
for (const table of relevantTables) {
  try {
    const [cols] = await conn.execute(`DESCRIBE ${table}`);
    const colNames = cols.map(c => c.Field);
    const customerCol = colNames.find(c => c.toLowerCase().includes('customer'));
    const reviewCol = colNames.find(c => c.toLowerCase().includes('review'));
    if (customerCol || reviewCol) {
      console.log(`\n=== Checking ${table} (cols: ${colNames.join(', ')}) ===`);
      if (customerCol) {
        const [rows] = await conn.execute(`SELECT * FROM ${table} WHERE ${customerCol} = 8400004 LIMIT 10`);
        if (rows.length > 0) console.log(JSON.stringify(rows, null, 2));
        else console.log("No records for customer 8400004");
      }
      if (reviewCol && !customerCol) {
        const [rows] = await conn.execute(`SELECT * FROM ${table} WHERE ${reviewCol} = 7920010 LIMIT 10`);
        if (rows.length > 0) console.log(JSON.stringify(rows, null, 2));
        else console.log("No records for reviewRequestId 7920010");
      }
    }
  } catch(e) {
    console.log(`Error checking ${table}: ${e.message}`);
  }
}

await conn.end();
process.exit(0);
