'use client';
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, ShieldCheck, Check, Phone, Mail, MapPin, Clock3, ArrowRight, ImageOff, Link2, FileText, Printer, Share2, BadgeCheck } from 'lucide-react';
import { formatCOP, calculateLandedCop, DEFAULT_CONFIG } from '@/lib/pricing';
import { VIP_CONTACT, buildWhatsAppShareText, buildWhatsAppBuyText, openQuotePrintWindow, type QuoteDocData } from '@/lib/quote-doc';
import { VipQuotePrint } from './VipQuotePrint';

// Nombre histórico del archivo; el contenido ya NO muestra desglose: solo PRECIO TOTAL (política IMPORTACIONES VIP)
interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  quoteData: {
    url?: string;
    store: string;
    product: {
      title: string;
      description?: string;
      priceUsd: number;
      originalPriceUsd?: number | null;
      imageUrl: string | null;
      imageCandidates?: string[];
      weightLbs?: number;
      brand?: string;
      features?: string[];
      sku?: string;
    };
    landed: { totalCop: number; deliveryEstimate?: string };
    trm?: number;
  } | null;
  onOrderSaved?: (order: any) => void;
}

export function QuoteBreakdownModal({ isOpen, onClose, quoteData, onOrderSaved }: QuoteModalProps) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Bogotá, D.C.');
  const [notes, setNotes] = useState('');
  const [weight, setWeight] = useState(2);
  const [trm, setTrm] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const [customImageUrl, setCustomImageUrl] = useState('');

  const buildDoc = (img: string | null, total: number, trmVal: number | null, cityVal?: string): QuoteDocData => ({
    title: quoteData!.product.title,
    store,
    priceUsd: quoteData!.product.priceUsd,
    totalCop: total,
    trm: trmVal,
    url: url || null,
    imageUrl: img,
    weightLbs: weight,
    city: cityVal,
  });

  // Guardar en PDF: abre la cotización oficial con logo y firma (el navegador permite "Guardar como PDF")
  const handleSavePdf = (img: string | null, total: number, trmVal: number | null) => {
    openQuotePrintWindow(buildDoc(img, total, trmVal, city));
  };

  // Imprimir: usa la hoja de cotización oficial con logo y firma digital
  const handlePrint = () => {
    window.print();
  };

  // Compartir cotización por WhatsApp (con fecha del día y T.R.M.)
  const shareOnWhatsApp = (img: string | null, total: number, trmVal: number | null) => {
    const text = encodeURIComponent(buildWhatsAppShareText(buildDoc(img, total, trmVal, city)));
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  // Botón comprar: dirige al WhatsApp del asesor con el pedido pre-redactado
  const buyWhatsAppUrl = (img: string | null, total: number, trmVal: number | null) =>
    `https://wa.me/${VIP_CONTACT.phoneIntl}?text=${encodeURIComponent(buildWhatsAppBuyText(buildDoc(img, total, trmVal, city)))}`;

  useEffect(() => {
    if (isOpen && quoteData) {
      setWeight(quoteData.product.weightLbs || 2);
      setConfirmed(false);
      setImgIdx(0);
      setCustomImageUrl('');
      setTrm(quoteData.trm || null);
      if (!quoteData.trm) {
        fetch('/api/trm').then(r => r.json()).then(j => { if (j.success) setTrm(j.trm); }).catch(() => {});
      }
    }
  }, [isOpen, quoteData]);

  if (!isOpen || !quoteData) return null;
  const { product, store, url } = quoteData;

  const candidates = [customImageUrl, product.imageUrl, ...(product.imageCandidates || [])].filter(Boolean) as string[];
  const activeImage = candidates[imgIdx] || null;

  // Recálculo SOLO del total (sin mostrar ningún desglose)
  const config = { ...DEFAULT_CONFIG, usdToCop: trm || DEFAULT_CONFIG.usdToCop };
  const totalCop = trm ? calculateLandedCop(product.priceUsd, weight, config).totalCop : quoteData.landed.totalCop;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceUrl: url || 'https://importacionesvip.co', detectedStore: store, itemTitle: product.title, itemPriceUsd: product.priceUsd, itemImageUrl: activeImage, weightLbs: weight, customerEmail: email, customerPhone: phone, customerCity: city, notes }),
      });
      const j = await res.json();
      if (j.success) { setConfirmed(true); onOrderSaved?.(j.quote); }
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto bg-zinc-950 border border-amber-400/30 rounded-[28px] shadow-2xl p-5 sm:p-7 text-zinc-100">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/5 text-zinc-400 hover:text-white cursor-pointer z-10"><X className="w-5 h-5" /></button>

        {confirmed ? (
          <div className="py-10 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-400 text-black rounded-full flex items-center justify-center mx-auto"><Check className="w-8 h-8" /></div>
            <h3 className="text-2xl font-black">¡Pedido registrado en {VIP_CONTACT.brand}!</h3>
            <p className="text-sm text-zinc-300 max-w-md mx-auto">Congelamos tu precio total en <b className="text-amber-300">{formatCOP(totalCop)}</b>. Te contactaremos por WhatsApp/correo para confirmar la compra. Entrega estimada: <b className="text-white">12 a 15 días hábiles</b>.</p>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10 max-w-sm mx-auto text-left text-xs space-y-1.5 text-zinc-300">
              <div><b className="text-white">Artículo:</b> {product.title}</div>
              <div><b className="text-white">Tienda:</b> {store}</div>
              <div><b className="text-white">Entrega en:</b> {city} · 12 a 15 días hábiles</div>
              <div><b className="text-white">Precio total:</b> <span className="text-amber-300 font-black">{formatCOP(totalCop)}</span></div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <button onClick={() => handleSavePdf(activeImage, totalCop, trm)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-xs font-bold hover:bg-white/10 cursor-pointer flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-300" /> Guardar PDF
              </button>
              <button onClick={handlePrint} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-xs font-bold hover:bg-white/10 cursor-pointer flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-amber-300" /> Imprimir
              </button>
              <button onClick={() => shareOnWhatsApp(activeImage, totalCop, trm)} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-xs font-bold hover:bg-white/10 cursor-pointer flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-amber-300" /> Compartir por WhatsApp
              </button>
            </div>
            <div className="text-xs text-zinc-400">
              Atentamente: <strong className="text-white">{VIP_CONTACT.advisor}</strong> · {VIP_CONTACT.brand} · {VIP_CONTACT.email} · Cel {VIP_CONTACT.phoneDisplay}
            </div>
            {/* Hoja oficial de impresión también disponible tras confirmar */}
            <VipQuotePrint quote={buildDoc(activeImage, totalCop, trm, city)} />
            <button onClick={onClose} className="px-6 py-3 rounded-xl bg-amber-400 text-black font-black text-sm cursor-pointer">Seguir explorando</button>
          </div>
        ) : (
          <div>
            {/* Botones de acción: PDF, Imprimir, Compartir, Comprar */}
            <div className="flex flex-wrap gap-2 mb-5">
              <button
                onClick={() => handleSavePdf(activeImage, totalCop, trm)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-xs font-bold hover:bg-white/10 cursor-pointer flex items-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-amber-300" />
                Guardar PDF
              </button>
              <button
                onClick={handlePrint}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-xs font-bold hover:bg-white/10 cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-amber-300" />
                Imprimir
              </button>
              <button
                onClick={() => shareOnWhatsApp(activeImage, totalCop, trm)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/20 text-xs font-bold hover:bg-white/10 cursor-pointer flex items-center gap-1.5"
              >
                <Share2 className="w-4 h-4 text-amber-300" />
                Compartir por WhatsApp
              </button>
              <a
                href={buyWhatsAppUrl(activeImage, totalCop, trm)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-bold text-xs flex items-center gap-1.5 cursor-pointer"
              >
                📲 Comprar por WhatsApp
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-5">
              <div className="w-full sm:w-56 shrink-0">
                <div className="aspect-square rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 flex items-center justify-center">
                  {activeImage ? (
                    <img src={activeImage} alt={product.title} className="w-full h-full object-contain bg-white" onError={() => setImgIdx((v) => v + 1)} referrerPolicy="no-referrer" />
                  ) : (
                    <div className="text-center text-zinc-500 px-4"><ImageOff className="w-8 h-8 mx-auto mb-2" /><p className="text-xs">La tienda no permitió extraer la foto de este enlace.</p></div>
                  )}
                </div>
                {candidates.length > 1 && (
                  <div className="flex gap-1.5 mt-2 justify-center">
                    {candidates.slice(0, 5).map((c, i) => (
                      <button key={i} onClick={() => setImgIdx(i)} className={`w-10 h-10 rounded-lg overflow-hidden border ${i === imgIdx ? 'border-amber-400' : 'border-white/10'} cursor-pointer`}><img src={c} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" /></button>
                    ))}
                  </div>
                )}
                {!activeImage && (
                  <div className="mt-3">
                    <label className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1"><Link2 className="w-3 h-3" /> Pega la URL de la imagen del artículo</label>
                    <input value={customImageUrl} onChange={(e) => { setCustomImageUrl(e.target.value); setImgIdx(0); }} placeholder="https://m.media-amazon.com/images/I/..." className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs" />
                  </div>
                )}
                {activeImage && <p className="text-[10px] text-emerald-400 mt-2 text-center">✓ Imagen real extraída del enlace</p>}
              </div>

              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-400 text-black">{store}</span>
                <h2 className="text-lg sm:text-xl font-black leading-snug mt-2">{product.title}</h2>
                {product.description && <p className="text-xs text-zinc-400 mt-1 line-clamp-3">{product.description}</p>}
                
                {/* Botón destacado VER EL ARTÍCULO EN TIENDA */}
                {url && (
                  <div className="mt-3">
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/50 text-amber-300 hover:text-amber-200 font-black text-xs transition-colors cursor-pointer shadow-sm shadow-amber-400/10"
                      title="Abrir página del artículo en la tienda oficial"
                    >
                      <span>VER EL ARTÍCULO EN AMAZON</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                <div className="mt-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 p-4">
                  <div className="text-[10px] uppercase tracking-[0.16em] text-amber-200/70 font-black">Precio total puesto en Colombia</div>
                  <div className="text-3xl sm:text-4xl font-black text-amber-300 mt-1">{formatCOP(totalCop)}</div>
                  <div className="flex flex-wrap gap-2 mt-3 text-[11px]">
                    <span className="inline-flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Todo incluido, sin pagos al recibir</span>
                    <span className="inline-flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full"><Clock3 className="w-3.5 h-3.5 text-amber-300" /> Entrega: 12 a 15 días hábiles</span>
                  </div>
                  <label className="block text-[11px] text-zinc-300 mt-4 mb-1">Peso del artículo (si lo conoces, ajusta y el total se actualiza)</label>
                  <select value={weight} onChange={(e) => setWeight(parseFloat(e.target.value))} className="w-full sm:w-64 px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-sm">
                    <option value={1}>Hasta 1 libra</option><option value={2}>2 libras</option><option value={3}>3 libras</option><option value={4}>4 libras</option><option value={5}>5 libras</option><option value={7}>7 libras</option><option value={10}>10 libras</option><option value={15}>15 libras</option><option value={20}>20 libras</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Firma digital del asesor (visible en la cotización) */}
            <div className="mt-6 rounded-2xl border border-amber-400/30 bg-amber-400/5 p-4">
              <div className="text-[10px] uppercase tracking-wider font-extrabold text-amber-300 mb-1">
                Firma Digital &amp; Contacto Oficial
              </div>
              <div className="text-sm font-extrabold text-white flex items-center gap-1.5 italic font-serif">
                <BadgeCheck className="w-4 h-4 text-amber-300 not-italic shrink-0" />
                Atentamente: {VIP_CONTACT.advisor}
              </div>
              <div className="text-xs font-bold text-amber-200 mt-0.5">{VIP_CONTACT.brand}</div>
              <div className="text-xs text-zinc-300 mt-2 space-y-0.5">
                <div>✉️ Correo: <a href={`mailto:${VIP_CONTACT.email}`} className="text-amber-300 hover:underline">{VIP_CONTACT.email}</a></div>
                <div>📱 Celular / WhatsApp: <a href={`https://wa.me/${VIP_CONTACT.phoneIntl}`} target="_blank" rel="noopener noreferrer" className="text-amber-300 hover:underline">{VIP_CONTACT.phoneDisplay}</a></div>
              </div>
            </div>

            {/* Hoja oficial de impresión (logo + firma). Solo se muestra al imprimir. */}
            <VipQuotePrint quote={buildDoc(activeImage, totalCop, trm, city)} />

            <form onSubmit={submit} className="mt-6 space-y-3">
              <h4 className="text-sm font-black">Solicitar este artículo</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div><label className="text-[11px] text-zinc-400 flex gap-1 mb-1"><Mail className="w-3 h-3" /> Correo</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="tucorreo@gmail.com" className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm" /></div>
                <div><label className="text-[11px] text-zinc-400 flex gap-1 mb-1"><Phone className="w-3 h-3" /> WhatsApp</label><input required value={phone} onChange={e => setPhone(e.target.value)} placeholder="300 123 4567" className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm" /></div>
                <div><label className="text-[11px] text-zinc-400 flex gap-1 mb-1"><MapPin className="w-3 h-3" /> Ciudad</label><select value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm"><option>Bogotá, D.C.</option><option>Medellín</option><option>Cali</option><option>Barranquilla</option><option>Bucaramanga</option><option>Cartagena</option><option>Pereira</option><option>Otra ciudad</option></select></div>
              </div>
              <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notas (color, talla, modelo exacto…)" className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-sm" />
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <p className="text-[11px] text-zinc-500">Al solicitar, un asesor VIP confirma disponibilidad y te envía el medio de pago. Precio final cerrado.</p>
                <button disabled={submitting} className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black text-sm flex items-center justify-center gap-2 cursor-pointer">{submitting ? 'Procesando…' : 'Quiero este artículo'} <ArrowRight className="w-4 h-4" /></button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

// Alias con nombre correcto para nuevos imports
export { QuoteBreakdownModal as QuoteModal };
