// Extractor real de producto desde enlace de tienda USA.
// Estrategia en capas para obtener IMAGEN REAL (no genérica):
// 1) Fetch directo con headers de navegador -> JSON-LD, OpenGraph, y patrones por tienda (Amazon/eBay/Walmart/B&H/Adorama)
// 2) Si Amazon/eBay bloquea (captcha), lector alternativo r.jina.ai que devuelve el contenido con imágenes reales
// 3) Validación de cada imagen candidata (HEAD/GET, content-type image) y upgrade a alta resolución

export interface ExtractedProduct {
  title: string | null;
  priceUsd: number | null;
  priceConfidence: 'high' | 'low' | null;
  imageUrl: string | null;
  imageCandidates: string[];
  description: string | null;
  weightLbs: number | null;
  source: 'direct' | 'reader' | 'none';
  blocked: boolean;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/\\u002F/g, '/').replace(/\\\//g, '/').trim();
}

function normalizeImageUrl(raw: string, baseUrl: string): string | null {
  try {
    let u = decodeEntities(raw).trim();
    if (!u || u.startsWith('data:') || u.includes('sprite') || u.includes('transparent') || u.includes('placeholder') || u.includes('1x1') || u.includes('pixel')) return null;
    if (u.startsWith('//')) u = 'https:' + u;
    else if (u.startsWith('/')) u = new URL(u, baseUrl).href;
    else if (!u.startsWith('http')) u = new URL(u, baseUrl).href;
    u = u.replace(/^http:\/\//i, 'https://');

    // --- Upgrades a alta resolución por tienda ---
    // Amazon: .../images/I/XXXX._AC_UL320_.jpg -> ._AC_SL1500_. ; también _SR, _SX, etc.
    if (u.includes('media-amazon.com') || u.includes('images-amazon.com') || u.includes('ssl-images-amazon')) {
      u = u.replace(/\._[^./]+_\./, '._AC_SL1500_.');
      u = u.replace(/_AC_US\d+_/, '_AC_SL1500_');
    }
    // eBay: s-l64/s-l225/s-l500 -> s-l1600
    if (u.includes('ebayimg.com')) {
      u = u.replace(/s-l\d+/i, 's-l1600');
    }
    // Walmart: solicitar imagen grande
    if (u.includes('walmartimages.com')) {
      u = u.replace(/odnHeight=\d+/, 'odnHeight=1000').replace(/odnWidth=\d+/, 'odnWidth=1000');
      if (!u.includes('odnHeight=')) u += (u.includes('?') ? '&' : '?') + 'odnHeight=1000&odnWidth=1000&odnBg=FFFFFF';
    }
    // B&H: images500x500 -> images2500x2500
    if (u.includes('bhphotovideo.com')) {
      u = u.replace(/images\d+x\d+/, 'images2500x2500');
    }
    // Adorama: quitar query de thumbnail si existe
    // (se deja URL limpia)
    return u;
  } catch { return null; }
}

function pushCandidate(list: string[], raw: string | null | undefined, baseUrl: string) {
  if (!raw) return;
  // raw puede ser srcset: tomar la más grande (última)
  const parts = String(raw).split(',').map((p) => p.trim().split(/\s+/)[0]).filter(Boolean);
  for (const p of parts) {
    const n = normalizeImageUrl(p, baseUrl);
    if (n && !list.includes(n)) list.push(n);
  }
}

function extractImagesFromHtml(html: string, baseUrl: string): string[] {
  const list: string[] = [];

  // 1) JSON-LD Product image (string | array | {url})
  const jsonLd = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of jsonLd) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const nodes: any[] = [];
      const walk = (o: any) => {
        if (!o || typeof o !== 'object') return;
        nodes.push(o);
        if (Array.isArray(o)) o.forEach(walk);
        else Object.values(o).forEach(walk);
      };
      walk(parsed);
      for (const n of nodes) {
        if (n.image) {
          if (typeof n.image === 'string') pushCandidate(list, n.image, baseUrl);
          else if (Array.isArray(n.image)) n.image.forEach((i: any) => pushCandidate(list, typeof i === 'string' ? i : i?.url, baseUrl));
          else if (n.image.url) pushCandidate(list, n.image.url, baseUrl);
        }
        // Amazon/B&H a veces anidan offers pero imagen está en subjectOf/mainEntity
      }
    } catch { /* ignore */ }
  }

  // 2) Meta OpenGraph / Twitter (orden importa: secure_url primero)
  const metaPatterns = [
    /<meta[^>]+property=["']og:image:secure_url["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image:secure_url["']/gi,
    /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/gi,
    /<meta[^>]+name=["']twitter:image(?::src)?["'][^>]+content=["']([^"']+)["']/gi,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image(?::src)?["']/gi,
    /<link[^>]+rel=["']image_src["'][^>]+href=["']([^"']+)["']/gi,
  ];
  for (const pat of metaPatterns) {
    for (const m of html.matchAll(pat)) pushCandidate(list, m[1], baseUrl);
  }

  // 3) Patrones específicos por tienda en scripts/HTML
  // Amazon: data-old-hires, landingImage, data-a-dynamic-image (JSON con URLs), "hiRes":"..."
  for (const m of html.matchAll(/data-old-hires=["']([^"']+)["']/gi)) pushCandidate(list, m[1], baseUrl);
  for (const m of html.matchAll(/id=["']landingImage["'][^>]*src=["']([^"']+)["']/gi)) pushCandidate(list, m[1], baseUrl);
  for (const m of html.matchAll(/"hiRes"\s*:\s*"(https:[^"]+)"/gi)) pushCandidate(list, m[1], baseUrl);
  for (const m of html.matchAll(/"large"\s*:\s*"(https:[^"]*media-amazon[^"]+)"/gi)) pushCandidate(list, m[1], baseUrl);
  for (const m of html.matchAll(/(https:(?:\\\/\\\/|\/\/)m\.media-amazon\.com\/images\/I\/[A-Za-z0-9._%+-]+)/gi)) pushCandidate(list, m[1], baseUrl);
  // eBay imágenes directas
  for (const m of html.matchAll(/(https:\/\/i\.ebayimg\.com\/images\/g\/[A-Za-z0-9._~/-]+)/gi)) pushCandidate(list, m[1], baseUrl);
  // Walmart / B&H / Adorama imágenes directas conocidas
  for (const m of html.matchAll(/(https:\/\/i5\.wal\.co\/[^\s"'<>]+|https:\/\/product-images\.walmart\.com[^\s"'<>]+|https:\/\/www\.bhphotovideo\.com\/images\/[^\s"'<>]+|https:\/\/www\.adorama\.com\/images\/[^\s"'<>]+)/gi)) pushCandidate(list, m[1], baseUrl);

  // 4) <img> con src/srcset relevantes (evitar logos/iconos)
  const imgTags = [...html.matchAll(/<img[^>]+>/gi)].slice(0, 80);
  for (const t of imgTags) {
    const tag = t[0];
    if (/logo|icon|sprite|avatar|badge|flag|payment|rating|star/i.test(tag)) continue;
    const srcset = tag.match(/srcset=["']([^"']+)["']/i)?.[1];
    const src = tag.match(/\bsrc=["']([^"']+)["']/i)?.[1];
    const dataSrc = tag.match(/data-src=["']([^"']+)["']/i)?.[1];
    if (srcset) pushCandidate(list, srcset, baseUrl);
    else if (dataSrc) pushCandidate(list, dataSrc, baseUrl);
    else if (src) pushCandidate(list, src, baseUrl);
  }

  // Ranking: preferir URLs con indicadores de tamaño grande
  const score = (u: string) => {
    let s = 0;
    if (/SL1500|s-l1600|2500x2500|odnHeight=1000/.test(u)) s += 50;
    if (/1500|1600|1200|1000|large|hiRes/i.test(u)) s += 20;
    if (/media-amazon|ebayimg|walmart|bhphotovideo|adorama/.test(u)) s += 15;
    if (/thumb|small|_t\.|50x50|100x100/i.test(u)) s -= 30;
    return s;
  };
  return list.sort((a, b) => score(b) - score(a)).slice(0, 12);
}

function extractTitleFromHtml(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']+)["']/i,
    /<span[^>]+id=["']productTitle["'][^>]*>([^<]+)</i, // Amazon
    /<title[^>]*>([^<]{8,220})<\/title>/i,
    /<h1[^>]*>([^<]{8,200})<\/h1>/i,
  ];
  for (const pat of patterns) {
    const m = html.match(pat);
    if (m?.[1]) {
      let t = decodeEntities(m[1].replace(/\s+/g, ' '));
      t = t.replace(/\s*\|\s*(Amazon|eBay|Walmart|Adorama).*$/i, '').replace(/\s*:\s*B&H Photo.*$/i, '').replace(/\s*-\s*(B&H|Adorama).*$/i, '').trim();
      // Rechazar títulos genéricos tipo "Amazon.com" (no es el artículo)
      if (/^(amazon(\.com|\.com\.mx)?|walmart(\.com)?|ebay(\.com)?|adorama|b&h photo( video)?|best buy|target)$/i.test(t)) continue;
      if (t.length >= 8 && !/captcha|robot|verify you are human|access denied/i.test(t)) return t.slice(0, 220);
    }
  }
  return null;
}

function extractPriceFromHtml(html: string): number | null {
  // JSON-LD offers primero (más fiable)
  const jsonLd = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const m of jsonLd) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const stack: any[] = [parsed];
      while (stack.length) {
        const cur = stack.pop();
        if (!cur || typeof cur !== 'object') continue;
        const offers = (cur as any).offers;
        const offerArr = Array.isArray(offers) ? offers : offers ? [offers] : [];
        for (const o of offerArr) {
          const p = parseFloat(String(o?.price ?? o?.lowPrice ?? ''));
          if (!isNaN(p) && p > 1 && p < 100000) return p;
        }
        Object.values(cur).forEach((v) => stack.push(v));
      }
    } catch { /* ignore */ }
  }
  const metaPats = [
    /<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([0-9.,]+)["']/i,
    /<meta[^>]+property=["']og:price:amount["'][^>]+content=["']([0-9.,]+)["']/i,
    /itemprop=["']price["'][^>]+content=["']([0-9.,]+)["']/i,
    // Amazon buy box
    /id=["']priceblock_(?:ourprice|dealprice)["'][^>]*>\s*\$?([0-9,]+\.[0-9]{2})/i,
    /class=["'][^"']*a-price-whole["'][^>]*>\s*([0-9,]+)/i,
    /"price"\s*:\s*"?\$?([0-9]+\.[0-9]{2})"?/i,
  ];
  for (const pat of metaPats) {
    const m = html.match(pat);
    if (m?.[1]) {
      const v = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(v) && v > 1 && v < 100000) return v;
    }
  }
  return null;
}

function extractWeightFromHtml(html: string): number | null {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  const pats = [
    /(?:Item Weight|Shipping Weight|Package Weight|Peso del producto|Product Weight)[^0-9]{0,40}([0-9]+(?:\.[0-9]+)?)\s*(pounds?|lbs?|ounces?|oz|kg|g)\b/i,
    /([0-9]+(?:\.[0-9]+)?)\s*(pounds?|lbs?)\b[^.]{0,30}(?:weight|shipping)/i,
  ];
  for (const pat of pats) {
    const m = text.match(pat);
    if (m) {
      const val = parseFloat(m[1]);
      const unit = m[2].toLowerCase();
      if (isNaN(val)) continue;
      if (unit.startsWith('pound') || unit.startsWith('lb')) return Math.min(80, val);
      if (unit.startsWith('ounce') || unit === 'oz') return Math.min(80, val / 16);
      if (unit === 'kg') return Math.min(80, val * 2.20462);
      if (unit === 'g') return Math.min(80, val / 453.6);
    }
  }
  return null;
}

function isBlocked(html: string): boolean {
  const l = html.toLowerCase();
  return l.includes('enter the characters you see below') || l.includes('type the characters you see in this image') ||
    l.includes('robot check') || l.includes('verify you are human') || l.includes('pardon our interruption') ||
    l.includes('sorry, something went wrong') || l.includes('error page | ebay') || l.includes('discover | ebay') ||
    l.includes('this listing was ended') || l.includes('this item is out of stock') ||
    (l.includes('access denied') && l.length < 8000);
}

async function validateImage(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 4500);
    // HEAD a veces bloqueado; si falla, intentamos GET con rango
    let res = await fetch(url, { method: 'HEAD', signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } }).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0', Range: 'bytes=0-2048' } }).catch(() => null);
    }
    clearTimeout(id);
    if (!res) return false;
    const ct = res.headers.get('content-type') || '';
    // Amazon/eBay devuelven 200 con image/* ; si no hay header, aceptamos si status 200/206
    return (res.status === 200 || res.status === 206) && (ct === '' || ct.includes('image') || ct.includes('octet-stream'));
  } catch { return false; }
}

async function pickValidImage(candidates: string[]): Promise<string | null> {
  // Validar en orden de ranking, máximo 6 intentos. Una imagen 404 NUNCA se devuelve como "real".
  for (const c of candidates.slice(0, 6)) {
    if (await validateImage(c)) return c;
  }
  return null;
}

function parseReaderMarkdown(md: string, baseUrl: string): Partial<ExtractedProduct> {
  // r.jina.ai devuelve markdown: Title:, ![Image](url), precios $...
  const titleMatch = md.match(/^Title:\s*(.+)$/m) || md.match(/^#\s+(.+)$/m);
  let title = titleMatch ? decodeEntities(titleMatch[1]).slice(0, 220) : null;
  if (title && /just a moment|performing security|are you a robot/i.test(title)) title = null;
  const imgs: string[] = [];
  for (const m of md.matchAll(/!\[[^\]]*\]\((https:[^)\s]+)\)/g)) {
    if (/favicon|logo|icon|\.ico($|\?)/i.test(m[1])) continue;
    pushCandidate(imgs, m[1], baseUrl);
  }
  for (const m of md.matchAll(/(https:\/\/(?:m\.media-amazon\.com|i\.ebayimg\.com)[^\s)"']+)/g)) pushCandidate(imgs, m[1], baseUrl);
  const priceMatch = md.match(/\$\s*([0-9]{1,5}(?:,[0-9]{3})*(?:\.[0-9]{2})?)/);
  const priceUsd = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : null;
  return { title, priceUsd: priceUsd && priceUsd > 1 ? priceUsd : null, imageCandidates: imgs };
}

async function tryMicrolink(url: string): Promise<Partial<ExtractedProduct>> {
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 15000);
    const res = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&meta=true`, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
    clearTimeout(id);
    if (!res.ok) return {};
    const text = await res.text();
    const imgs: string[] = [];
    // Buscar cualquier URL de imagen de tienda en toda la respuesta (incluye headers preload de B&H)
    for (const m of text.matchAll(/(https:(?:\\\/\\\/|\/\/)(?:www\.bhphotovideo\.com\/images\/|m\.media-amazon\.com\/images\/|i\.ebayimg\.com\/|i5\.wal\.co\/|www\.adorama\.com\/images\/)[^"\\,\s<>]+)/gi)) pushCandidate(imgs, m[1], url);
    try {
      const json: any = JSON.parse(text);
      const d = json?.data || {};
      const imgUrl: string | undefined = d?.image?.url;
      if (imgUrl && imgUrl.startsWith('http') && !/favicon|logo/i.test(imgUrl)) pushCandidate(imgs, imgUrl, url);
      const title = typeof d?.title === 'string' && d.title.length >= 8 ? decodeEntities(d.title).slice(0, 220) : null;
      return { title, imageCandidates: imgs };
    } catch {
      return { imageCandidates: imgs };
    }
  } catch { return {}; }
}

export async function extractProductFromUrl(rawUrl: string): Promise<ExtractedProduct> {
  const url = rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`;
  let html = '';
  let blocked = false;
  let source: ExtractedProduct['source'] = 'none';

  // --- Intento 1: fetch directo ---
  try {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), 9000);
    const res = await fetch(url, {
      signal: ctrl.signal, redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,es;q=0.7',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(id);
    if (res.ok) {
      html = await res.text();
      blocked = isBlocked(html);
      if (!blocked && html.length > 1500) source = 'direct';
    } else {
      blocked = res.status === 403 || res.status === 503;
    }
  } catch { blocked = true; }

  let title = html && !blocked ? extractTitleFromHtml(html) : null;
  if (title && /^(amazon(\.com)?|walmart(\.com)?|ebay(\.com)?|adorama|b&h photo( video)?)$/i.test(title.trim())) title = null;
  // eBay entrega con frecuencia "Error Page | eBay" / "Discover | eBay" aun con HTTP 200.
  // Esas páginas nunca son fichas y no pueden usarse para cotizar.
  if (title && /^(error page|discover|sorry).*\|?\s*ebay/i.test(title.trim())) title = null;
  let priceUsd = html && !blocked ? extractPriceFromHtml(html) : null;
  let priceConfidence: ExtractedProduct['priceConfidence'] = priceUsd ? 'high' : null;
  let candidates = html && !blocked ? extractImagesFromHtml(html, url) : [];
  let weightLbs = html && !blocked ? extractWeightFromHtml(html) : null;

  // --- Intento 2: lector alternativo si falta imagen/precio o hubo bloqueo ---
  if (!candidates.length || !priceUsd || blocked) {
    try {
      const ctrl = new AbortController();
      const id = setTimeout(() => ctrl.abort(), 12000);
      const readerUrl = `https://r.jina.ai/${url}`;
      const res = await fetch(readerUrl, { signal: ctrl.signal, headers: { 'Accept': 'text/plain', 'User-Agent': 'Mozilla/5.0' } });
      clearTimeout(id);
      if (res.ok) {
        const md = await res.text();
          if (md && md.length > 300 && !/captcha|error page \| ebay|title: discover \| ebay|something went wrong/i.test(md.slice(0, 1200))) {
            const parsed = parseReaderMarkdown(md, url);
            if (!title && parsed.title && !/^(amazon(\.com)?|walmart|ebay|adorama)$/i.test(parsed.title.trim()) && !/^(error page|discover|sorry).*ebay/i.test(parsed.title.trim())) title = parsed.title;
          if (!priceUsd && parsed.priceUsd) { priceUsd = parsed.priceUsd; priceConfidence = 'low'; // primer $ del lector: baja confianza, se pedirá confirmación si no hay catálogo
          }
          if (parsed.imageCandidates?.length) {
            const merged = [...parsed.imageCandidates];
            for (const c of candidates) if (!merged.includes(c)) merged.push(c);
            candidates = merged;
          }
          if (candidates.length || priceUsd) source = 'reader';
        }
      }
    } catch { /* lector no disponible */ }
  }

  // Patrón CDN público de Adorama: /images/Large/{sku}.jpg (sku = nombre del archivo del enlace)
  try {
    const u = new URL(url);
    if (u.hostname.includes('adorama.com')) {
      const sku = u.pathname.split('/').pop()?.replace(/\.(html?|aspx)$/i, '').toLowerCase();
      if (sku) {
        const cdn = `https://www.adorama.com/images/Large/${sku}.jpg`;
        if (!candidates.includes(cdn)) candidates.unshift(cdn);
      }
    }
  } catch {}

  // --- Intento 3: metadatos públicos (Microlink) — recupera imagen real cuando la tienda pone Cloudflare ---
  if (!candidates.length || !title) {
    const micro = await tryMicrolink(url);
    if (!title && micro.title && !/^(error page|discover|sorry).*ebay/i.test(micro.title.trim())) title = micro.title;
    if (micro.imageCandidates?.length) {
      const merged = [...micro.imageCandidates];
      for (const c of candidates) if (!merged.includes(c)) merged.push(c);
      candidates = merged;
      if (source === 'none') source = 'reader';
    }
  }

  const imageUrl = candidates.length ? await pickValidImage(candidates) : null;

  return {
    title,
    priceUsd,
    priceConfidence,
    imageUrl,
    imageCandidates: candidates,
    description: null,
    weightLbs,
    source,
    blocked,
  };
}
