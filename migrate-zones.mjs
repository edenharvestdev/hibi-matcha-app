import mysql from 'mysql2/promise';

async function run() {
  const url = process.env.DATABASE_URL;
  if (!url) { console.error('No DATABASE_URL found'); process.exit(1); }
  
  const conn = await mysql.createConnection(url);
  
  // Create service_zones table
  await conn.execute(`CREATE TABLE IF NOT EXISTS service_zones (
    id int AUTO_INCREMENT NOT NULL,
    sz_name varchar(255) NOT NULL,
    sz_description text,
    sz_isActive int NOT NULL DEFAULT 1,
    sz_createdAt timestamp NOT NULL DEFAULT (now()),
    sz_updatedAt timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT service_zones_id PRIMARY KEY(id)
  )`);
  console.log('Created service_zones table');
  
  // Add zoneId to branches
  try {
    await conn.execute('ALTER TABLE branches ADD zoneId int');
    console.log('Added zoneId column to branches');
  } catch(e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('zoneId column already exists');
    } else {
      throw e;
    }
  }
  
  await conn.end();
  console.log('Migration complete');
}
run().catch(e => { console.error(e); process.exit(1); });
