import { formatCOP } from './pricing';
import { TERMS_INTRODUCTION, TERMS_SECTIONS, TERMS_TITLE } from './terms';

export const VIP_CONTACT = {
  brand: 'Personal Shopper V.I.P',
  tagline: 'Tecnología de U.S.A a Colombia · 100% seguro',
  advisor: 'John Reyes Calderon',
  email: 'ventas@vipaudiovisual.com',
  phoneDisplay: '3103480565',
  phoneIntl: '573103480565',
  delivery: '12 a 15 días hábiles',
};

export interface QuoteDocData {
  title: string;
  store: string;
  priceUsd: number;
  totalCop: number;
  trm: number | null;
  trmSource?: string;
  url?: string | null;
  imageUrl?: string | null;
  weightLbs?: number;
  city?: string;
  customerName?: string;
}

export function quoteDateCO(d = new Date()): string {
  return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function buildWhatsAppShareText(q: QuoteDocData): string {
  const lines = [
    `📦 *COTIZACIÓN ${VIP_CONTACT.brand}* 📦`,
    '',
    `📅 Fecha: ${quoteDateCO()}`,
    `🛒 Artículo: ${q.title}`,
    `🏪 Tienda: ${q.store}`,
    `💵 Precio en tienda: $${q.priceUsd} USD`,
    `💱 T.R.M. del día: ${q.trm ? `1 USD = ${formatCOP(q.trm)}` : 'automática del día'}`,
    `💰 *PRECIO TOTAL EN COLOMBIA: ${formatCOP(q.totalCop)}*`,
    `🚚 Entrega: ${VIP_CONTACT.delivery} · Todo incluido`,
    q.url ? `🔗 Enlace: ${q.url}` : '',
    '',
    'Atentamente:',
    `✍️ ${VIP_CONTACT.advisor}`,
    `🏢 ${VIP_CONTACT.brand}`,
    `✉️ ${VIP_CONTACT.email} · 📱 Cel ${VIP_CONTACT.phoneDisplay}`,
  ];
  return lines.filter((l) => l !== undefined).join('\n');
}

export function buildWhatsAppBuyText(q: QuoteDocData): string {
  return [
    `Hola ${VIP_CONTACT.brand} 👋, quiero comprar este artículo:`,
    '',
    `🛒 ${q.title}`,
    `🏪 ${q.store} · $${q.priceUsd} USD`,
    `💰 Total: ${formatCOP(q.totalCop)} (${quoteDateCO()} · T.R.M. ${q.trm ? `1 USD = ${formatCOP(q.trm)}` : 'del día'})`,
    q.url ? `🔗 ${q.url}` : '',
    '',
    '¿Me confirmas disponibilidad y medio de pago? Gracias.',
  ]
    .filter(Boolean)
    .join('\n');
}

const safe = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Segunda página del documento impreso: términos y condiciones del servicio. */
function buildTermsPageHtml(): string {
  const sections = TERMS_SECTIONS.map((section) => {
    const blocks = section.blocks
      .map((block) => {
        if (block.type === 'list') {
          const items = block.items
            .map((item) => `<li>${item.label ? `<strong>${safe(item.label)}</strong> ` : ''}${safe(item.text)}</li>`)
            .join('');
          return `<ul>${items}</ul>`;
        }
        if (block.type === 'notice') {
          return `<div class="terms-notice"><p>${safe(block.title)}</p><p>${safe(block.text)}</p></div>`;
        }
        return `<p${block.emphasis ? ' class="terms-emphasis"' : ''}>${safe(block.text)}</p>`;
      })
      .join('');
    return `<section class="terms-section${section.highlighted ? ' terms-highlight' : ''}"><h3>${safe(section.title)}</h3>${blocks}</section>`;
  }).join('\n        ');
  return `<section class="terms-page">
    <h2 class="terms-title">${safe(TERMS_TITLE)}</h2>
    <p class="terms-intro">${safe(TERMS_INTRODUCTION)}</p>
    <div class="terms-columns">
        ${sections}
    </div>
  </section>`;
}

/**
 * Documento HTML autónomo para imprimir / guardar como PDF, SIN LOGO:
 * página 1 con la cotización y los datos de contacto; página 2 con los términos y condiciones.
 */
export function buildQuotePrintHtml(q: QuoteDocData): string {
  const date = quoteDateCO();
  const trmText = q.trm ? `1 USD = ${formatCOP(q.trm)}` : 'T.R.M. automática del día';
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Cotización ${safe(VIP_CONTACT.brand)} — ${safe(q.title).slice(0, 60)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; color: #111; margin: 0; padding: 32px; background: #fff; }
  .sheet { max-width: 720px; margin: 0 auto; border: 2px solid #b8860b; border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
  .header { background: #0a0a0a; color: #fff; text-align: center; padding: 22px 24px 18px; border-bottom: 3px solid #f5c518; }
  .header h1 { margin: 0; font-size: 24px; letter-spacing: 1.5px; font-weight: 900; }
  .header h1 span { color: #f5c518; }
  .header p { margin: 6px 0 0; font-size: 12px; color: #d4d4d4; letter-spacing: 0.5px; }
  .body { padding: 26px 32px; }
  .meta { display: flex; justify-content: space-between; font-size: 12px; color: #555; margin-bottom: 14px; border-bottom: 1px dashed #ddd; padding-bottom: 8px; }
  .title { font-size: 19px; font-weight: 800; margin: 0 0 6px; color: #0a0a0a; line-height: 1.3; }
  .store { display: inline-block; font-size: 11px; font-weight: 800; background: #0a0a0a; color: #f5c518; border-radius: 999px; padding: 3px 12px; margin-bottom: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
  table { width: 100%; border-collapse: collapse; margin: 10px 0 6px; font-size: 13px; }
  td { padding: 8px 10px; border-bottom: 1px solid #eee; vertical-align: top; }
  td.k { color: #555; width: 40%; font-weight: 500; }
  td.v { font-weight: bold; color: #0a0a0a; }
  .product { display: flex; gap: 18px; align-items: flex-start; margin: 8px 0 4px; }
  .product img { width: 150px; height: 150px; object-fit: contain; border: 1px solid #e5e5e5; border-radius: 10px; background: #fff; flex-shrink: 0; padding: 4px; }
  .total { background: #0a0a0a; color: #f5c518; border-radius: 12px; padding: 18px 22px; margin-top: 16px; text-align: center; border: 1px solid #f5c518; }
  .total .lbl { font-size: 11px; letter-spacing: 2px; color: #e7c65a; font-weight: 900; }
  .total .val { font-size: 34px; font-weight: 900; margin-top: 4px; color: #f5c518; }
  .total .sub { font-size: 11px; color: #d4d4d4; margin-top: 6px; font-weight: 500; }
  .note { font-size: 11px; color: #666; margin-top: 14px; line-height: 1.5; font-style: italic; }
  .sign-box { margin-top: 24px; border: 1px solid #e0c568; background: #fffdf5; border-radius: 10px; padding: 16px 20px; }
  .sign-name { font-size: 17px; font-weight: 900; color: #0a0a0a; font-family: "Georgia", serif; font-style: italic; }
  .sign-role { font-size: 12px; font-weight: 800; color: #b8860b; margin-top: 2px; }
  .sign-contact { font-size: 12px; color: #333; margin-top: 6px; line-height: 1.6; }
  .sign-contact strong { color: #0a0a0a; }
  .url-text { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; }
  .footer { text-align: center; font-size: 11px; color: #777; padding: 14px; border-top: 1px solid #eee; background: #fafafa; }
  .terms-page { max-width: 720px; margin: 24px auto 0; padding: 22px 26px; border: 1px solid #e5e5e5; border-radius: 14px; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 8.5px; line-height: 1.3; color: #111; break-before: page; page-break-before: always; }
  .terms-title { margin: 0 0 6px; padding-bottom: 5px; border-bottom: 2px solid #b8860b; font-size: 12px; font-weight: 900; letter-spacing: 0.3px; color: #0a0a0a; }
  .terms-intro { margin: 0 0 8px; }
  .terms-columns { column-count: 2; column-gap: 16px; column-rule: 1px solid #ece4c8; }
  .terms-section h3 { margin: 7px 0 3px; font-size: 9px; font-weight: 800; color: #0a0a0a; break-after: avoid; page-break-after: avoid; }
  .terms-section:first-child h3 { margin-top: 0; }
  .terms-section p { margin: 0 0 4px; }
  .terms-section ul { margin: 0 0 4px; padding-left: 11px; list-style: disc; }
  .terms-section li { margin: 0 0 2px; }
  .terms-section strong { font-weight: 700; }
  .terms-emphasis { padding-left: 6px; border-left: 2px solid #b8860b; font-weight: 700; }
  .terms-highlight { margin-top: 7px; padding: 6px 7px; border: 1.5px solid #b8860b; border-radius: 6px; break-inside: avoid; page-break-inside: avoid; }
  .terms-highlight h3 { margin-top: 0; color: #8a6d1c; }
  .terms-notice p { font-weight: 700; }
  @media print {
    body { padding: 0; background: #fff; }
    .sheet { border-radius: 0; border: none; box-shadow: none; max-width: 100%; }
    .terms-page { max-width: 100%; margin: 0; padding: 0; border: none; border-radius: 0; }
  }
</style>
</head>
<body>
  <div class="sheet">
    <div class="header">
      <h1>Personal Shopper <span>V.I.P</span></h1>
      <p>${VIP_CONTACT.tagline}</p>
    </div>
    <div class="body">
      <div class="meta"><span><strong>Cotización Oficial</strong></span><span>Fecha: <strong>${date}</strong></span></div>
      <p class="title">${safe(q.title)}</p>
      <span class="store">${safe(q.store)}</span>
      <div class="product">
        ${q.imageUrl ? `<img src="${safe(q.imageUrl)}" alt="Artículo" />` : ''}
        <table>
          <tr><td class="k">Precio en tienda (USD)</td><td class="v">$${q.priceUsd} USD</td></tr>
          <tr><td class="k">T.R.M. del día</td><td class="v">${safe(trmText)}</td></tr>
          ${q.weightLbs ? `<tr><td class="k">Peso considerado</td><td class="v">${q.weightLbs} lb</td></tr>` : ''}
          ${q.city ? `<tr><td class="k">Ciudad de entrega</td><td class="v">${safe(q.city)}</td></tr>` : ''}
          <tr><td class="k">Tiempo de entrega</td><td class="v">${VIP_CONTACT.delivery}</td></tr>
          ${q.url ? `<tr><td class="k">Enlace del artículo</td><td class="v" style="font-size:11px;word-break:break-all;"><div class="url-text">${safe(q.url)}</div></td></tr>` : ''}
        </table>
      </div>
      <div class="total">
        <div class="lbl">PRECIO TOTAL PUESTO EN COLOMBIA</div>
        <div class="val">${formatCOP(q.totalCop)}</div>
        <div class="sub">Todo incluido · Sin pagos adicionales al recibir · Entrega en ${VIP_CONTACT.delivery}</div>
      </div>
      <p class="note">Cotización válida con la T.R.M. del día (${date}). El valor mostrado es el precio final cerrado puesto en Colombia.</p>
      
      <div class="sign-box">
        <div class="sign-name">${VIP_CONTACT.advisor}</div>
        <div class="sign-role">${VIP_CONTACT.brand}</div>
        <div class="sign-contact">
          ✉️ Correo: <strong>${VIP_CONTACT.email}</strong><br />
          📱 Celular / WhatsApp: <strong>${VIP_CONTACT.phoneDisplay}</strong>
        </div>
      </div>
    </div>
    <div class="footer">${VIP_CONTACT.brand} · ${VIP_CONTACT.tagline} · ${VIP_CONTACT.email} · Cel ${VIP_CONTACT.phoneDisplay}</div>
  </div>
  ${buildTermsPageHtml()}
  <script>window.onload = () => setTimeout(() => window.print(), 500);</script>
</body>
</html>`;
}

/** Abre el documento de cotización en una ventana nueva lista para imprimir / guardar PDF. */
export function openQuotePrintWindow(q: QuoteDocData): void {
  const html = buildQuotePrintHtml(q);
  const w = window.open('', '_blank', 'width=900,height=1000');
  if (!w) {
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Cotizacion_Personal_Shopper_VIP_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return;
  }
  w.document.open();
  w.document.write(html);
  w.document.close();
}
