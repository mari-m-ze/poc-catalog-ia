import { Router } from 'express';
import { db } from '../db';
import { beerProducts } from '@shared/schema';
import { sql } from 'drizzle-orm';

const router = Router();

router.get('/stats', async (req, res) => {
  try {
    const stats = await db.execute(sql`
      SELECT 
        categoria as name,
        COUNT(*) as "totalProducts",
        COUNT(CASE WHEN ai_enhanced = true THEN 1 END) as "enhancedProducts",
        COUNT(CASE WHEN ai_enhanced = false OR ai_enhanced IS NULL THEN 1 END) as "needsEnhancement"
      FROM beer_products
      GROUP BY categoria
      ORDER BY "totalProducts" DESC
    `);

    res.json(stats.rows);
  } catch (error) {
    console.error('Error fetching category statistics:', error);
    res.status(500).json({ error: 'Failed to fetch category statistics' });
  }
});

export default router; 