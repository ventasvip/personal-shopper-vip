// Fallbacks inteligentes a través de Encárguelo.com y Google cuando la tienda oficial
// bloquea el acceso o no entrega título/imagen/precio/peso.
import { ExtractedProduct } from './scraper';

interface FallbackCandidate {
  title: string | null;
  priceUsd: number | null;
  imageUrl: string | null;
  imageCandidates: string[];
  weightLbs: number | null;
  sourceUrl: string | null;
  officialStoreUrl: string | null;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\\u002F/g, '/')
    .replace(/\\\//g, '/')
    .trim();
}

/**
 * 1) Búsqueda en encarguelo.com
 * Soporta dos vías:
 * - Por ASIN / ID de producto si viene de una URL
 * - Por nombre / palabras clave del artículo
 */
export async function searchEncarguelo(queryOrAsin: string): Promise<FallbackCandidate | null> {
  try {
    const cleanQuery = queryOrAsin.trim();
    if (!cleanQuery) return null;

    // Si es un ASIN directo (ej. B0B2FCT81R)
    const asinMatch = cleanQuery.match(/^[A-Z0-9]{10}$/i);
    let targetProductUrl: string | null = null;

    if (asinMatch) {
      // Intentar fetch directo de encarguelo.com/producto/{ASIN}
      const directUrl = `https://encarguelo.com/producto/${asinMatch[0]}`;
      const productData = await fetchEncargueloProduct(directUrl, asinMatch[0]);
      if (productData) return productData;
    }

    // Buscar en encarguelo.com/productos?search={query}
    const searchUrl = `https://encarguelo.com/productos?search=${encodeURIComponent(cleanQuery)}`;
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(searchUrl, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
      },
    });
    clearTimeout(id);
    if (!res.ok) return null;
    const html = await res.text();

    // Extraer primer enlace a producto /producto/{ASIN}/slug
    const match = html.match(/href=["'](https:\/\/encarguelo\.com\/producto\/([A-Z0-9]{10})[^\s"']*)["']/i) ||
                  html.match(/href=["'](\/producto\/([A-Z0-9]{10})[^\s"']*)["']/i);

    if (match) {
      const fullUrl = match[1].startsWith('http') ? match[1] : `https://encarguelo.com${match[1]}`;
      const foundAsin = match[2];
      const productData = await fetchEncargueloProduct(fullUrl, foundAsin);
      if (productData) return productData;
    }

    return null;
  } catch (err) {
    console.warn('searchEncarguelo error:', err);
    return null;
  }
}

/**
 * Lee una página de producto de encarguelo.com para extraer título, imagen, peso empacado y precio USD.
 */
async function fetchEncargueloProduct(url: string, asin?: string): Promise<FallbackCandidate | null> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9',
      },
    });
    clearTimeout(id);
    if (!res.ok) return null;
    const html = await res.text();

    let title: string | null = null;
    let priceUsd: number | null = null;
    let weightLbs: number | null = null;
    const imageCandidates: string[] = [];

    // 1. JSON-LD Product schema en encarguelo
    const jsonLdBlocks = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
    for (const b of jsonLdBlocks) {
      try {
        const data = JSON.parse(b[1].trim());
        if (data['@type'] === 'Product') {
          if (!title && data.name) title = decodeEntities(data.name);
          if (Array.isArray(data.image)) {
            for (const img of data.image) {
              if (typeof img === 'string' && img.startsWith('http') && !imageCandidates.includes(img)) {
                // Upgrade a alta resolución
                const hires = img.replace(/\._[^./]+_\./, '._AC_SL1500_.');
                imageCandidates.push(hires);
              }
            }
          } else if (typeof data.image === 'string' && data.image.startsWith('http')) {
            imageCandidates.push(data.image.replace(/\._[^./]+_\./, '._AC_SL1500_.'));
          }
        }
      } catch {}
    }

    // 2. Extracción de peso empacado
    // Patrón 1: snapshot JSON de encarguelo &quot;weight&quot;: 5
    const weightMatch = html.match(/(?:&quot;|")weight(?:&quot;|")\s*:\s*([0-9.]+)/i);
    if (weightMatch) {
      const w = parseFloat(weightMatch[1]);
      if (w > 0 && w < 100) weightLbs = w;
    }
    // Patrón 2: Texto visible "Peso: X Lb"
    if (!weightLbs) {
      const pesoText = html.match(/Peso:\s*([0-9.]+)\s*(?:libras?|lbs?|lb)/i) ||
                       html.match(/(?:Shipping Weight|Peso del paquete|Peso)\s*:\s*([0-9.]+)\s*(?:libras?|lbs?|lb)/i);
      if (pesoText) {
        const w = parseFloat(pesoText[1]);
        if (w > 0 && w < 100) weightLbs = w;
      }
    }

    // 3. Extracción de precio en USD (api_price en snapshot de encarguelo)
    const apiPriceMatch = html.match(/(?:&quot;|")api_price(?:&quot;|")\s*:\s*([0-9.]+)/i);
    if (apiPriceMatch) {
      const p = parseFloat(apiPriceMatch[1]);
      if (p > 1 && p < 50000) priceUsd = p;
    }

    // Si no hay api_price pero hay cop_price, convertir a USD aproximado
    if (!priceUsd) {
      const copPriceMatch = html.match(/(?:&quot;|")cop_price(?:&quot;|")\s*:\s*([0-9.]+)/i) ||
                            html.match(/"price"\s*:\s*"([0-9.]+)"/i);
      if (copPriceMatch) {
        const cop = parseFloat(copPriceMatch[1]);
        if (cop > 50000) {
          // Encarguelo incluye sus propios márgenes (aprox 1.25x sobre TRM). Despejar USD de referencia
          priceUsd = Math.round((cop / (4200 * 1.2)) * 100) / 100;
        }
      }
    }

    // 4. Si falta título, buscar en og:title o <title>
    if (!title) {
      const tMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
                     html.match(/<title>([^<]+)<\/title>/i);
      if (tMatch) title = decodeEntities(tMatch[1]).replace(/\s*\|\s*Encarguelo.*$/i, '').trim();
    }

    // 5. Si faltan imágenes, buscar en el HTML
    if (imageCandidates.length === 0) {
      for (const m of html.matchAll(/(https:\/\/(?:m\.media-amazon\.com|images-na\.ssl-images-amazon\.com)\/images\/I\/[A-Za-z0-9._%+-]+)/gi)) {
        const hires = m[1].replace(/\._[^./]+_\./, '._AC_SL1500_.');
        if (!imageCandidates.includes(hires)) imageCandidates.push(hires);
      }
    }

    if (title || imageCandidates.length > 0 || priceUsd) {
      // Reconstruir URL oficial en Amazon si tenemos el ASIN
      const officialStoreUrl = asin ? `https://www.amazon.com/dp/${asin}` : null;
      return {
        title,
        priceUsd,
        imageUrl: imageCandidates[0] || null,
        imageCandidates,
        weightLbs: weightLbs || 2.0,
        sourceUrl: url,
        officialStoreUrl,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * 2) Búsqueda en Google (vía Google Search HTML parser)
 * Busca el producto en tiendas oficiales (Amazon, B&H, Walmart, Adorama) o imágenes.
 */
export async function searchGoogleFallback(query: string): Promise<FallbackCandidate | null> {
  try {
    const q = encodeURIComponent(`${query} (site:amazon.com/dp OR site:bhphotovideo.com/c/product OR site:walmart.com/ip OR site:adorama.com)`);
    const searchUrl = `https://www.google.com/search?q=${q}&hl=es&gl=co`;
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(searchUrl, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'es-CO,es;q=0.9,en;q=0.8',
      },
    });
    clearTimeout(id);
    if (!res.ok) return null;
    const html = await res.text();

    // Extraer primer enlace oficial de tienda en los resultados
    const storeLinkMatch =
      html.match(/href=["'](https:\/\/(?:www\.)?amazon\.com\/[^\s"']*\/dp\/[A-Z0-9]{10}[^\s"']*)["']/i) ||
      html.match(/href=["'](https:\/\/(?:www\.)?bhphotovideo\.com\/c\/product\/[^\s"']+)["']/i) ||
      html.match(/href=["'](https:\/\/(?:www\.)?walmart\.com\/ip\/[^\s"']+)["']/i) ||
      html.match(/href=["'](https:\/\/(?:www\.)?adorama\.com\/[^\s"']+\.html)["']/i);

    let officialStoreUrl: string | null = null;
    if (storeLinkMatch) {
      officialStoreUrl = storeLinkMatch[1].replace(/&amp;/g, '&');
    }

    // Extraer snippets de precio ($XX.XX USD)
    const priceMatch = html.match(/\$\s*([0-9]{1,4}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/);
    const priceUsd = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;

    // Extraer título sugerido
    const titleMatch = html.match(/<h3[^>]*>([^<]{10,120})<\/h3>/i);
    const title = titleMatch ? decodeEntities(titleMatch[1]).replace(/\s*-\s*(Amazon|B&H|Walmart|Adorama).*$/i, '').trim() : null;

    if (officialStoreUrl || (title && priceUsd)) {
      return {
        title,
        priceUsd: priceUsd && priceUsd > 1 ? priceUsd : null,
        imageUrl: null,
        imageCandidates: [],
        weightLbs: 2.0,
        sourceUrl: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
        officialStoreUrl,
      };
    }

    return null;
  } catch (err) {
    console.warn('searchGoogleFallback error:', err);
    return null;
  }
}
