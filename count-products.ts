import 'dotenv/config';
import { db } from "./server/db";
import { sql } from "drizzle-orm";

async function countProducts() {
  try {
    const result = await db.execute(sql`SELECT COUNT(*) as count FROM beer_products`);
    console.log(`Total number of products: ${result.rows[0].count}`);
  } catch (error) {
    console.error("Error counting products:", error);
  } finally {
    process.exit(0);
  }
}

countProducts(); 