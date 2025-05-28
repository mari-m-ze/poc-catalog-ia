import 'dotenv/config';
import { db } from "./db";
import { beerProducts } from "@shared/schema";
import { eq } from "drizzle-orm";

async function updateCategoria() {
  try {
    const result = await db
      .update(beerProducts)
      .set({ categoria: "Cerveja" })
      .returning();
    
    console.log(`Successfully updated ${result.length} products`);
    console.log("Update completed successfully!");
  } catch (error) {
    console.error("Error updating products:", error);
  }
}

// Run the update
updateCategoria(); 