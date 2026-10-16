import { test, expect } from '@playwright/test';
import { TERMS_INTRODUCTION, TERMS_SECTIONS, TERMS_TITLE } from '../src/lib/terms';

const baseURL = process.env.TEST_BASE_URL || 'http://localhost:3000';
test.use({ baseURL });

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

async function expectCompleteDocument(text: string) {
  const normalized = normalize(text);
  expect(normalized).toContain(normalize(TERMS_INTRODUCTION));
  expect(TERMS_SECTIONS).toHaveLength(8);
  for (const section of TERMS_SECTIONS) {
    expect(normalized).toContain(normalize(section.title));
    for (const block of section.blocks) {
      if (block.type === 'list') {
        for (const item of block.items) {
          expect(normalized).toContain(normalize(`${item.label || ''} ${item.text}`));
        }
      } else {
        expect(normalized).toContain(normalize(block.text));
        if (block.type === 'notice') expect(normalized).toContain(block.title);
      }
    }
  }
}

test.beforeEach(async ({ page }) => {
  // Keep these UI checks independent from third-party stores and rate providers.
  await page.route('**/api/products?*', (route) => route.fulfill({ json: { success: true, items: [], trm: 4000 } }));
  await page.route('**/api/trm*', (route) => route.fulfill({ json: { success: true, trm: 4000, source: 'Prueba de interfaz', updatedAt: new Date().toISOString() } }));
});

test('La página independiente publica el texto completo y se puede imprimir', async ({ page }) => {
  await page.goto('/terminos-y-condiciones', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: TERMS_TITLE, exact: true })).toBeVisible();
  await expect(page.locator('article h2')).toHaveCount(8);
  await expectCompleteDocument(await page.locator('article').innerText());
  await expect(page.locator('#reemplazos-por-garantia')).toHaveClass(/border-amber-400/);
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toHaveAttribute('href', '/');
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('#terms-page')).toBeVisible();
  expect(await page.locator('article').evaluate((element) => getComputedStyle(element).visibility)).toBe('visible');
  await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeHidden();
});

test('El botón superior abre el documento, Escape cierra y restaura el foco', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const opener = page.getByRole('navigation', { name: 'Información del servicio', exact: true }).getByRole('button', { name: 'Términos y Condiciones', exact: true });
  await opener.click();
  const dialog = page.getByRole('dialog', { name: TERMS_TITLE, exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('heading', { level: 3 })).toHaveCount(8);
  await expectCompleteDocument(await dialog.locator('article').innerText());
  expect(await page.locator('body').evaluate((element) => element.style.overflow)).toBe('hidden');
  await page.keyboard.press('Tab');
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(opener).toBeFocused();
  expect(await page.locator('body').evaluate((element) => element.style.overflow)).not.toBe('hidden');
});

test('El botón inferior y el aviso visible abren el mismo documento sin aceptación automática', async ({ page }) => {
  const writes: string[] = [];
  page.on('request', (request) => { if (request.method() !== 'GET' && request.method() !== 'HEAD') writes.push(request.url()); });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const bottom = page.getByRole('navigation', { name: 'Información legal', exact: true }).getByRole('button', { name: 'Términos y Condiciones', exact: true });
  await bottom.click();
  const dialog = page.getByRole('dialog', { name: TERMS_TITLE, exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Abrir página completa' })).toHaveAttribute('href', '/terminos-y-condiciones');
  await expect(dialog.getByRole('link', { name: 'Abrir página completa' })).toHaveAttribute('target', '_blank');
  await dialog.getByRole('button', { name: 'Cerrar y volver', exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(bottom).toBeFocused();
  await page.getByRole('button', { name: 'Leer condiciones del servicio', exact: true }).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button', { name: 'Cerrar términos y condiciones', exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(writes.filter((url) => url.startsWith(baseURL))).toHaveLength(0);
});

test('En celular se puede leer hasta la cláusula 8 y cerrar sin desbordamiento horizontal', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.getByRole('navigation', { name: 'Información del servicio', exact: true }).getByRole('button', { name: 'Términos y Condiciones', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: TERMS_TITLE, exact: true });
  await expect(dialog).toBeVisible();
  const box = await dialog.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(8);
  expect(box!.width).toBeLessThanOrEqual(374);
  expect(box!.height).toBeLessThanOrEqual(761);
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth + 1)).toBe(true);
  const clause = dialog.locator('#dialog-reemplazos-por-garantia');
  await clause.getByRole('heading').scrollIntoViewIfNeeded();
  await expect(clause.getByRole('heading')).toBeInViewport();
  await expect(dialog.getByRole('button', { name: 'Cerrar y volver', exact: true })).toBeInViewport();
  await dialog.getByRole('button', { name: 'Cerrar y volver', exact: true }).click();
  await expect(dialog).toBeHidden();
});
