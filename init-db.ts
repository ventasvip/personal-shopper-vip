import { db } from '@/db';
import { products, exchangeRateSettings } from '@/db/schema';
import { SEED_PRODUCTS } from './seed-data';
import { count, inArray } from 'drizzle-orm';
import { hasRelatedImage } from './product-images';

export async function ensureDbSeeded() {
  try {
    // Limpieza: se eliminan los artículos cuya imagen no es una fotografía propia del artículo
    // (fotos genéricas de stock o vacías). Si el catálogo queda vacío, se vuelve a cargar abajo.
    const stored = await db.select({ id: products.id, imageUrl: products.imageUrl }).from(products);
    const withoutPhoto = stored.filter((p) => !hasRelatedImage(p.imageUrl)).map((p) => p.id);
    if (withoutPhoto.length > 0) await db.delete(products).where(inArray(products.id, withoutPhoto));

    const [countResult] = await db.select({ value: count() }).from(products);
    const existingCount = Number(countResult?.value || 0);

    if (existingCount === 0) {
      console.log('Seeding initial products database...');
      for (const item of SEED_PRODUCTS) {
        await db.insert(products).values({
          title: item.title,
          description: item.description,
          priceUsd: item.priceUsd.toString(),
          originalPriceUsd: item.originalPriceUsd ? item.originalPriceUsd.toString() : null,
          store: item.store,
          storeUrl: item.storeUrl,
          imageUrl: item.imageUrl,
          category: item.category,
          rating: item.rating.toString(),
          reviewsCount: item.reviewsCount,
          weightLbs: item.weightLbs.toString(),
          sku: item.sku,
          brand: item.brand,
          features: item.features,
          inStock: true,
        });
      }

      // Initialize exchange settings if not present
      const [settingsCount] = await db.select({ value: count() }).from(exchangeRateSettings);
      if (Number(settingsCount?.value || 0) === 0) {
        await db.insert(exchangeRateSettings).values({
          rateUsdToCop: '4100.00',
          usTaxPct: '7.50',
          insurancePct: '5.00',
          logisticsPct: '5.00',
          transportPerLbCop: '25000',
          nationalShippingCop: '20000',
          trmSource: 'TRM automática USD/COP',
        });
      }
      console.log('Seed completed successfully!');
    }
  } catch (err) {
    console.error('Error during ensureDbSeeded:', err);
  }
}
