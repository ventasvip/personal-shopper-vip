import { test, expect, type Page } from '@playwright/test';

const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
test.use({ baseURL });

const PIXEL = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

function item(id: number, title: string, imageUrl: string | null) {
  return {
    id, title, description: 'Artículo de prueba', priceUsd: 100, originalPriceUsd: null, store: 'Amazon',
    storeUrl: 'https://www.amazon.com/s?k=prueba&tag=dpcolombiano2-20', imageUrl, category: 'Audio & Video',
    rating: 4.8, reviewsCount: 10, weightLbs: 1, sku: null, brand: 'Marca', features: [],
    landed: { totalCop: 500000, deliveryEstimate: '12 a 15 días hábiles' },
  };
}

async function mockCatalog(page: Page, items: unknown[]) {
  await page.route('**/api/products?*', (route) => route.fulfill({ json: { success: true, items, trm: 4000 } }));
  await page.route('**/api/trm*', (route) => route.fulfill({ json: { success: true, trm: 4000, source: 'Prueba', updatedAt: new Date().toISOString() } }));
  await page.route('https://img.test/ok/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: PIXEL }));
  await page.route('https://img.test/roto/**', (route) => route.fulfill({ status: 404, body: 'no existe' }));
}

test('La sección se llama «Recomendaciones del día» y ya no existe el filtro «Tienda»', async ({ page }) => {
  await mockCatalog(page, [item(1, 'Artículo con foto', 'https://img.test/ok/1.png')]);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 2, name: 'Recomendaciones del día', exact: true })).toBeVisible();
  // No debe quedar la etiqueta «Tienda» ni los botones de filtro por tienda.
  await expect(page.getByText('Tienda', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Todas las tiendas', exact: true })).toHaveCount(0);
  // Dentro de la sección de recomendaciones ya no hay botones de filtro por tienda.
  const section = page.locator('section', { has: page.getByRole('heading', { level: 2, name: 'Recomendaciones del día', exact: true }) });
  await expect(section.getByRole('button', { name: /^(Todas las tiendas|B&H Photo NYC|Adorama|Amazon USA|Walmart USA|eBay)$/ })).toHaveCount(0);
  // El orden y las categorías siguen disponibles.
  await expect(page.getByRole('button', { name: 'Cámaras & Óptica' })).toBeVisible();
  await expect(page.getByRole('combobox')).toBeVisible();
});

test('No se muestran artículos sin foto o con la foto rota', async ({ page }) => {
  await mockCatalog(page, [
    item(1, 'Con foto buena', 'https://img.test/ok/1.png'),
    item(2, 'Sin foto', null),
    item(3, 'Foto rota', 'https://img.test/roto/3.png'),
    item(4, 'Otra con foto buena', 'https://img.test/ok/4.png'),
  ]);
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 3, name: 'Con foto buena', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Otra con foto buena', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { level: 3, name: 'Sin foto', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 3, name: 'Foto rota', exact: true })).toHaveCount(0);
  // El contador solo cuenta los artículos que sí se muestran (2 de 4).
  await expect(page.locator('b.text-amber-300', { hasText: /^2$/ })).toBeVisible();
});
