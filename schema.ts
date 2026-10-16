import { pgTable, text, serial, numeric, integer, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  priceUsd: numeric('price_usd', { precision: 10, scale: 2 }).notNull(),
  originalPriceUsd: numeric('original_price_usd', { precision: 10, scale: 2 }),
  store: text('store').notNull(),
  storeUrl: text('store_url').notNull(),
  imageUrl: text('image_url').notNull(),
  category: text('category').notNull(),
  rating: numeric('rating', { precision: 3, scale: 1 }).default('4.8'),
  reviewsCount: integer('reviews_count').default(120),
  weightLbs: numeric('weight_lbs', { precision: 5, scale: 2 }).default('2.0'),
  inStock: boolean('in_stock').default(true),
  sku: text('sku'),
  brand: text('brand').default('Genérico'),
  features: jsonb('features').$type<string[]>(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const quotes = pgTable('quotes', {
  id: serial('id').primaryKey(),
  sourceUrl: text('source_url').notNull(),
  detectedStore: text('detected_store').notNull(),
  itemTitle: text('item_title').notNull(),
  itemPriceUsd: numeric('item_price_usd', { precision: 10, scale: 2 }).notNull(),
  itemImageUrl: text('item_image_url'),
  weightLbs: numeric('weight_lbs', { precision: 5, scale: 2 }).default('2.0'),
  calculatedCop: numeric('calculated_cop', { precision: 14, scale: 0 }).notNull(),
  exchangeRate: numeric('exchange_rate', { precision: 8, scale: 2 }).notNull(),
  shippingCop: numeric('shipping_cop', { precision: 12, scale: 0 }).notNull().default('0'),
  customsTaxCop: numeric('customs_tax_cop', { precision: 12, scale: 0 }).notNull().default('0'),
  handlingFeeCop: numeric('handling_fee_cop', { precision: 12, scale: 0 }).notNull().default('0'),
  status: text('status').default('cotizado'),
  customerEmail: text('customer_email'),
  customerPhone: text('customer_phone'),
  customerCity: text('customer_city'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const exchangeRateSettings = pgTable('exchange_rate_settings', {
  id: serial('id').primaryKey(),
  rateUsdToCop: numeric('rate_usd_to_cop', { precision: 8, scale: 2 }).notNull().default('4100.00'),
  // Legacy columns (kept for DB compat, no longer used in VIP formula)
  importTaxPctBelow200: numeric('import_tax_pct_below_200', { precision: 5, scale: 2 }).default('0.00'),
  importTaxPctAbove200: numeric('import_tax_pct_above_200', { precision: 5, scale: 2 }).default('19.00'),
  shippingPerLbUsd: numeric('shipping_per_lb_usd', { precision: 6, scale: 2 }).default('5.50'),
  handlingFeeUsd: numeric('handling_fee_usd', { precision: 6, scale: 2 }).default('7.00'),
  // IMPORTACIONES VIP formula
  usTaxPct: numeric('us_tax_pct', { precision: 5, scale: 2 }).default('7.50'),
  insurancePct: numeric('insurance_pct', { precision: 5, scale: 2 }).default('5.00'),
  logisticsPct: numeric('logistics_pct', { precision: 5, scale: 2 }).default('5.00'),
  transportPerLbCop: numeric('transport_per_lb_cop', { precision: 10, scale: 0 }).default('25000'),
  nationalShippingCop: numeric('national_shipping_cop', { precision: 10, scale: 0 }).default('20000'),
  trmSource: text('trm_source'),
  updatedAt: timestamp('updated_at').defaultNow(),
});
