// Enlaces Amazon Associates para IMPORTACIONES VIP.
// La etiqueta es un identificador público de afiliado, no una credencial secreta.
export const AMAZON_ASSOCIATE_TAG = 'dpcolombiano2-20';

function cleanAmazonUrl(url: URL): string | null {
  // Conserva el ASIN si la URL es una página Amazon directa.
  const asin =
    url.pathname.match(/\/dp\/([A-Z0-9]{10})/i)?.[1] ||
    url.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i)?.[1] ||
    url.pathname.match(/\/product\/([A-Z0-9]{10})/i)?.[1];
  if (asin) return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_ASSOCIATE_TAG}`;
  return null;
}

/**
 * Siempre produce un destino Amazon con tag de afiliado.
 * - Si el producto ya es Amazon/ASIN: enlace directo a la ficha.
 * - Si procede de eBay, B&H, Walmart, Adorama u otra tienda: búsqueda Amazon por título/referencia.
 */
export function toAmazonAffiliateUrl(productTitle: string, sourceUrl?: string | null, sku?: string | null): string {
  if (sourceUrl) {
    try {
      const parsed = new URL(sourceUrl);
      if (/(^|\.)amazon\./i.test(parsed.hostname) || parsed.hostname.toLowerCase() === 'a.co' || parsed.hostname.toLowerCase().endsWith('amzn.to')) {
        const direct = cleanAmazonUrl(parsed);
        if (direct) return direct;
      }
    } catch {
      // Fall through to Amazon search
    }
  }

  const query = [productTitle, sku].filter(Boolean).join(' ').trim();
  return `https://www.amazon.com/s?k=${encodeURIComponent(query)}&tag=${AMAZON_ASSOCIATE_TAG}`;
}

export function getAmazonAffiliateLabel(sourceUrl?: string | null): 'direct' | 'search' {
  if (!sourceUrl) return 'search';
  try {
    const u = new URL(sourceUrl);
    return cleanAmazonUrl(u) ? 'direct' : 'search';
  } catch {
    return 'search';
  }
}
