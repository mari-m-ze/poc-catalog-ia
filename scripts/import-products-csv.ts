#!/usr/bin/env tsx

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { parse } from 'csv-parse';
import { createReadStream } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ws from "ws";
import { products } from '../shared/schema-catalog-wine.ts';

neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool });

interface CSVRow {
  product_id: string;
  product_variant_id: string;
  product_variant_title: string;
  pais: string;
  tipo: string;
  classificacao: string;
  uva: string;
  tamanho: string;
  tampa: string;
  harmonizacao: string;
}

async function importProductsFromCSV(csvFilePath: string) {
  const records: any[] = [];
  
  console.log(`Reading CSV file: ${csvFilePath}`);
  
  return new Promise((resolve, reject) => {
    createReadStream(csvFilePath)
      .pipe(parse({ 
        columns: true, 
        skip_empty_lines: true,
        trim: true 
      }))
      .on('data', (row: CSVRow) => {
        // Map CSV columns to database fields
        const productData = {
          id: parseInt(row.product_id),
          product_variant_id: row.product_variant_id ? parseInt(row.product_variant_id) : null,
          title: row.product_variant_title || null,
          country: row.pais || null,
          type: row.tipo || null,
          classification: row.classificacao || null,
          grape_variety: row.uva || null,
          size: row.tamanho || null,
          closure: row.tampa || null,
          pairings: row.harmonizacao || null,
        };
        
        records.push(productData);
      })
      .on('error', (error) => {
        console.error('Error reading CSV:', error);
        reject(error);
      })
      .on('end', async () => {
        console.log(`Parsed ${records.length} records from CSV`);
        
        try {
          // Insert records in batches
          const batchSize = 100;
          let insertedCount = 0;
          
          for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            
            console.log(`Inserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} records)...`);
            
            await db.insert(products).values(batch).onConflictDoNothing();
            
            insertedCount += batch.length;
            console.log(`Progress: ${insertedCount}/${records.length} records processed`);
          }
          
          console.log(`✅ Successfully imported ${insertedCount} products`);
          resolve(insertedCount);
        } catch (error) {
          console.error('Error inserting data:', error);
          reject(error);
        }
      });
  });
}

async function main() {
  const csvFilePath = process.argv[2];
  
  if (!csvFilePath) {
    console.error('Usage: tsx scripts/import-products-csv.ts <path-to-csv-file>');
    console.error('');
    console.error('Example: tsx scripts/import-products-csv.ts ./products.csv');
    console.error('');
    console.error('CSV should have headers: product_id,product_variant_id,product_variant_title,pais,tipo,classificacao,uva,tamanho,tampa,harmonizacao');
    process.exit(1);
  }
  
  try {
    await importProductsFromCSV(csvFilePath);
    console.log('Import completed successfully!');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(console.error); 