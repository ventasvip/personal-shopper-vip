import { DEFAULT_CONFIG, CalculationConfig } from './pricing';

// TRM automática: intentamos Google Finance (fuente que muestra Google),
// luego la TRM oficial Superfinanciera vía datos.gov.co (misma que publica Google),
// y finalmente APIs públicas de forex en vivo. Cache 20 min en memoria.
let cache: { rate: number; source: string; updatedAt: string; ts: number } | null = null;
const CACHE_MS = 20 * 60 * 1000;

async function fetchWithTimeout(url: string, ms = 6000, headers: Record<string, string> = {}) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
        ...headers,
      },
      cache: 'no-store',
    });
    return res;
  } finally {
    clearTimeout(id);
  }
}

async function tryGoogleFinance(): Promise<{ rate: number; source: string } | null> {
  try {
    const res = await fetchWithTimeout('https://www.google.com/finance/quote/USD-COP', 6000);
    if (!res.ok) return null;
    const html = await res.text();
    // Google Finance: data-last-price="4123.45" o <div class="YMlKec fxKbKc">4.123,45</div>
    const m1 = html.match(/data-last-price="([0-9]+(?:\.[0-9]+)?)"/);
    if (m1) {
      const v = parseFloat(m1[1]);
      if (v > 2000 && v < 8000) return { rate: Math.round(v * 100) / 100, source: 'Google Finance USD/COP' };
    }
    const m2 = html.match(/class="YMlKec[^"]*"[^>]*>\s*([0-9.,]+)\s*</);
    if (m2) {
      const raw = m2[1].replace(/\./g, '').replace(',', '.');
      const v = parseFloat(raw);
      // If format was 4,123.45 english
      const v2 = parseFloat(m2[1].replace(/,/g, ''));
      const val = v > 2000 && v < 8000 ? v : v2;
      if (val > 2000 && val < 8000) return { rate: Math.round(val * 100) / 100, source: 'Google Finance USD/COP' };
    }
    return null;
  } catch { return null; }
}

async function tryDatosGovCo(): Promise<{ rate: number; source: string } | null> {
  try {
    // Dataset oficial TRM Superfinanciera en datos.gov.co (mcec-87by)
    const url = 'https://www.datos.gov.co/resource/mcec-87by.json?$limit=5&$order=vigenciadesde%20DESC';
    const res = await fetchWithTimeout(url, 6000, { Accept: 'application/json' });
    if (!res.ok) return null;
    const json: any = await res.json();
    const row = Array.isArray(json) ? json[0] : null;
    const valor = row?.valor ? parseFloat(String(row.valor)) : NaN;
    if (valor > 2000 && valor < 8000) {
      return { rate: Math.round(valor * 100) / 100, source: 'TRM oficial Superfinanciera (datos.gov.co) — referencia Google' };
    }
    return null;
  } catch { return null; }
}

async function tryOpenErApi(): Promise<{ rate: number; source: string } | null> {
  try {
    const res = await fetchWithTimeout('https://open.er-api.com/v6/latest/USD', 6000);
    if (!res.ok) return null;
    const json: any = await res.json();
    const v = json?.rates?.COP;
    if (typeof v === 'number' && v > 2000 && v < 8000) return { rate: Math.round(v * 100) / 100, source: 'Mercado USD/COP en vivo (referencia Google)' };
    return null;
  } catch { return null; }
}

async function tryExchangeRateApi(): Promise<{ rate: number; source: string } | null> {
  try {
    const res = await fetchWithTimeout('https://api.exchangerate-api.com/v4/latest/USD', 6000);
    if (!res.ok) return null;
    const json: any = await res.json();
    const v = json?.rates?.COP;
    if (typeof v === 'number' && v > 2000 && v < 8000) return { rate: Math.round(v * 100) / 100, source: 'Mercado USD/COP en vivo' };
    return null;
  } catch { return null; }
}

export async function fetchLiveTRM(force = false): Promise<{ rate: number; source: string; updatedAt: string }> {
  if (!force && cache && Date.now() - cache.ts < CACHE_MS) {
    return { rate: cache.rate, source: cache.source, updatedAt: cache.updatedAt };
  }
  const attempts = [tryGoogleFinance, tryDatosGovCo, tryOpenErApi, tryExchangeRateApi];
  for (const fn of attempts) {
    const r = await fn();
    if (r) {
      const updatedAt = new Date().toISOString();
      cache = { rate: r.rate, source: r.source, updatedAt, ts: Date.now() };
      return { rate: r.rate, source: r.source, updatedAt };
    }
  }
  // Fallback: última cache o default
  if (cache) return { rate: cache.rate, source: cache.source + ' (última conocida)', updatedAt: cache.updatedAt };
  return { rate: DEFAULT_CONFIG.usdToCop, source: 'TRM de referencia (sin conexión en vivo)', updatedAt: new Date().toISOString() };
}

export async function getPricingConfig(): Promise<CalculationConfig> {
  const trm = await fetchLiveTRM();
  return {
    usdToCop: trm.rate,
    usTaxPct: 7.5,
    insurancePct: 5,
    logisticsPct: 5,
    transportPerLbCop: 25000,
    nationalShippingCop: 20000,
    trmSource: trm.source,
    trmUpdatedAt: trm.updatedAt,
  };
}
