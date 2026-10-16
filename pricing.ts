export interface CalculationConfig {
  usdToCop: number; // TRM automática
  usTaxPct: number; // 7.5
  insurancePct: number; // 5
  logisticsPct: number; // 5
  transportPerLbCop: number; // 25000 COP por libra o fracción
  nationalShippingCop: number; // 20000 COP envío nacional/local
  trmSource?: string;
  trmUpdatedAt?: string;
}

export const DEFAULT_CONFIG: CalculationConfig = {
  usdToCop: 4100,
  usTaxPct: 7.5,
  insurancePct: 5,
  logisticsPct: 5,
  transportPerLbCop: 25000,
  nationalShippingCop: 20000,
  trmSource: 'Referencia automática USD/COP',
};

// Alias kept for backwards compat imports in old files (will be removed as we migrate)
export type QuoteBreakdown = LandedPrice;

export interface LandedPrice {
  // ONLY total is exposed to customer — no breakdown by design (IMPORTACIONES VIP policy)
  totalCop: number;
  priceUsd: number;
  weightLbs: number;
  billableWeightLbs: number; // ceil(weight)
  usdToCopRate: number;
  trmSource?: string;
  deliveryEstimate: string;
  deliveryMinDays: number;
  deliveryMaxDays: number;
}

export function calculateLandedCop(
  priceUsd: number,
  weightLbs: number = 2.0,
  config: CalculationConfig = DEFAULT_CONFIG
): LandedPrice {
  const safePrice = Math.max(0, Number(priceUsd) || 0);
  const effectiveWeight = Math.max(0.1, Number(weightLbs) || 2.0);
  const billableWeightLbs = Math.max(1, Math.ceil(effectiveWeight)); // por libra o fracción

  const baseCop = safePrice * config.usdToCop;
  const surchargePct = (config.usTaxPct + config.insurancePct + config.logisticsPct) / 100; // 17.5%
  const withSurcharges = baseCop * (1 + surchargePct);
  const transportCop = billableWeightLbs * config.transportPerLbCop;
  const totalRaw = withSurcharges + transportCop + config.nationalShippingCop;
  // Precio VIP cerrado: redondeado a la centena superior para precio final limpio
  const totalCop = Math.ceil(totalRaw / 100) * 100;

  return {
    totalCop,
    priceUsd: safePrice,
    weightLbs: effectiveWeight,
    billableWeightLbs,
    usdToCopRate: config.usdToCop,
    trmSource: config.trmSource,
    deliveryEstimate: '12 a 15 días hábiles',
    deliveryMinDays: 12,
    deliveryMaxDays: 15,
  };
}

export function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(amount);
}

export interface StoreInfo {
  name: string;
  badgeColor: string;
  logoText: string;
  domain: string;
  iconBg: string;
}

export const SUPPORTED_STORES: Record<string, StoreInfo> = {
  amazon: { name: 'Amazon', badgeColor: 'bg-amber-500/10 text-amber-500 border-amber-500/30', logoText: 'Amazon USA', domain: 'amazon.com', iconBg: 'from-amber-500 to-orange-600' },
  ebay: { name: 'eBay', badgeColor: 'bg-blue-500/10 text-blue-500 border-blue-500/30', logoText: 'eBay Deals', domain: 'ebay.com', iconBg: 'from-blue-600 to-indigo-600' },
  bhphoto: { name: 'B&H Photo Video', badgeColor: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30', logoText: 'B&H NYC', domain: 'bhphotovideo.com', iconBg: 'from-emerald-600 to-teal-700' },
  adorama: { name: 'Adorama', badgeColor: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/30', logoText: 'Adorama Camera', domain: 'adorama.com', iconBg: 'from-cyan-600 to-blue-600' },
  walmart: { name: 'Walmart', badgeColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30', logoText: 'Walmart USA', domain: 'walmart.com', iconBg: 'from-blue-500 to-yellow-500' },
  bestbuy: { name: 'Best Buy', badgeColor: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30', logoText: 'Best Buy USA', domain: 'bestbuy.com', iconBg: 'from-yellow-400 to-amber-600' },
  apple: { name: 'Apple Store', badgeColor: 'bg-zinc-500/10 text-zinc-300 border-zinc-500/30', logoText: 'Apple Store US', domain: 'apple.com', iconBg: 'from-zinc-600 to-zinc-900' },
  target: { name: 'Target', badgeColor: 'bg-rose-500/10 text-rose-500 border-rose-500/30', logoText: 'Target USA', domain: 'target.com', iconBg: 'from-rose-600 to-red-600' },
};

export function detectStoreFromUrl(url: string): { storeKey: string; storeName: string } {
  const lower = url.toLowerCase();
  if (lower.includes('amazon.') || lower.includes('amzn.') || lower.includes('a.co/')) return { storeKey: 'amazon', storeName: 'Amazon' };
  if (lower.includes('ebay.')) return { storeKey: 'ebay', storeName: 'eBay' };
  if (lower.includes('bhphotovideo.') || lower.includes('bhphoto')) return { storeKey: 'bhphoto', storeName: 'B&H Photo Video' };
  if (lower.includes('adorama.')) return { storeKey: 'adorama', storeName: 'Adorama' };
  if (lower.includes('walmart.')) return { storeKey: 'walmart', storeName: 'Walmart' };
  if (lower.includes('bestbuy.')) return { storeKey: 'bestbuy', storeName: 'Best Buy' };
  if (lower.includes('apple.')) return { storeKey: 'apple', storeName: 'Apple Store' };
  if (lower.includes('target.')) return { storeKey: 'target', storeName: 'Target' };
  if (lower.includes('newegg.')) return { storeKey: 'otro', storeName: 'Newegg' };
  return { storeKey: 'otro', storeName: 'Tienda USA' };
}

export function isProbablyUrl(input: string): boolean {
  const t = input.trim().toLowerCase();
  const known = ['amazon.', 'bhphotovideo.', 'adorama.', 'walmart.', 'ebay.', 'bestbuy.', 'target.', 'apple.', 'amzn.to', 'a.co/', 'newegg.'];
  if (known.some((d) => t.includes(d))) return true;
  if ((t.startsWith('http://') || t.startsWith('https://')) && t.includes('/')) return true;
  return false;
}
