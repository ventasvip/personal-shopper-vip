'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Search, Link as LinkIcon, Loader2, Sparkles, ArrowRight, AlertTriangle, Info, CheckCircle2, ExternalLink, Image as ImageIcon, TrendingUp, Clock3 } from 'lucide-react';
import { isProbablyUrl, formatCOP } from '@/lib/pricing';

interface Props {
  onKeywordResults: (data: any) => void;
  onUrlQuote: (data: any) => void;
  onUrlRequiresManual: (info: any) => void;
  onResultSelect: (item: any) => void;
}

const EXAMPLES = [
  { store: 'Amazon', label: 'MacBook Pro M3 Pro', url: 'https://www.amazon.com/dp/B0CM5JVV3N' },
  { store: 'B&H Photo', label: 'Sony a7 IV', url: 'https://www.bhphotovideo.com/c/product/1667800-REG/sony_ilce_7m4_b_alpha_a7_iv_mirrorless.html' },
  { store: 'Adorama', label: 'Sigma 24-70mm', url: 'https://www.adorama.com/sg24702se.html' },
  { store: 'Walmart', label: 'PlayStation 5 Slim', url: 'https://www.walmart.com/ip/PlayStation-5-Console-Slim/3910972322' },
  { store: 'eBay', label: 'Bose QC Ultra', url: 'https://www.ebay.com/itm/325812908842' },
];

export function UnifiedSearchBar({ onKeywordResults, onUrlQuote, onUrlRequiresManual, onResultSelect }: Props) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Formulario cuando la tienda oculta el precio
  const [showManual, setShowManual] = useState(false);
  const [manualTitle, setManualTitle] = useState('');
  const [manualPrice, setManualPrice] = useState('');
  const [manualWeight, setManualWeight] = useState('2');
  const [manualUrl, setManualUrl] = useState('');
  const [manualImage, setManualImage] = useState('');
  const [detectedImage, setDetectedImage] = useState<string | null>(null);

  // Dropdown de resultados de búsqueda por nombre/referencia
  const [dropdownResults, setDropdownResults] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const urlMode = isProbablyUrl(input);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const clearDropdown = () => { setDropdownOpen(false); setDropdownResults([]); setSelectedIndex(-1); };

  const runSearchDropdown = async (q: string) => {
    if (!q || q.length < 2) { setDropdownResults([]); setDropdownOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      const withPhoto = (data.items || []).filter((x: any) => x.imageUrl);
      if (data.success && withPhoto.length > 0) {
        setDropdownResults(withPhoto);
        setDropdownOpen(true);
        setSelectedIndex(-1);
        if (data.message) setInfo(data.message);
      } else {
        setDropdownResults([]);
        setDropdownOpen(false);
      }
    } catch { setDropdownResults([]); setDropdownOpen(false); }
    finally { setLoading(false); }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    clearDropdown();
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2 && !isProbablyUrl(val)) {
      debounceRef.current = setTimeout(() => runSearchDropdown(val.trim()), 300);
    }
  };

  const selectResult = (item: any) => {
    const priceUsd = Number(item.priceUsd || 0);
    const weight = Number(item.weightLbs || 2);
    const selected = {
      ...item,
      priceUsd,
      weightLbs: weight,
      imageUrl: item.imageUrl,
      landed: { totalCop: item.landed?.totalCop || 0, deliveryEstimate: '12 a 15 días hábiles' },
      trm: item.trm || 4100,
      storeUrl: item.storeUrl || null,
      sku: item.sku || null,
      brand: item.brand || null,
      features: item.features || [],
    };
    clearDropdown();
    setInput(item.title || '');
    onResultSelect(selected);
  };

  const run = async (override?: string) => {
    const raw = (override ?? input).trim();
    if (!raw) return;
    setError(null); setInfo(null); setShowManual(false); clearDropdown();

    if (isProbablyUrl(raw)) {
      setLoading(true);
      try {
        const res = await fetch('/api/scrape-quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: raw }) });
        const data = await res.json();
        if (res.ok && data.success) {
          onUrlQuote(data);
          setInfo(data.imageIsReal === false && data.product ? 'Precio verificado. La tienda no dejó extraer la foto automáticamente.' : '✓ Imagen real y precio extraídos del enlace.');
        } else if (data.requiresManualPrice) {
          setManualTitle(data.detectedTitle || '');
          setDetectedImage(data.detectedImage || null);
          setManualImage(data.detectedImage || '');
          setManualUrl(data.url || raw);
          if (data.suggestedPriceUsd) setManualPrice(String(data.suggestedPriceUsd));
          if (data.weightLbs) setManualWeight(String(Math.ceil(data.weightLbs)));
          setShowManual(true);
          setError(data.error);
          onUrlRequiresManual(data);
        } else {
          setError(data.error || 'No pudimos cotizar ese enlace.');
        }
      } catch (e: any) { setError(e.message || 'Error de conexión.'); }
      finally { setLoading(false); }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(raw)}`);
      const data = await res.json();
      if (data.success) { onKeywordResults(data); setInfo(data.message || null); }
      else setError(data.error || 'Error en la búsqueda.');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  const submitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(manualPrice);
    if (!manualPrice || isNaN(price) || price <= 0) { setError('Escribe el precio en USD que ves en la tienda.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/manual-quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: manualUrl, title: manualTitle || 'Artículo importado', priceUsd: price, weightLbs: manualWeight, imageUrl: manualImage || null }) });
      const data = await res.json();
      if (res.ok && data.success) { setShowManual(false); onUrlQuote(data); setInfo('Cotización generada con el precio que confirmaste.'); }
      else setError(data.error || 'No pudimos generar la cotización.');
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="rounded-[26px] bg-zinc-900/95 p-3 sm:p-4 border border-amber-400/25 shadow-2xl shadow-black/60 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 flex items-center">
            <span className="absolute left-4 pointer-events-none">
              {loading ? <Loader2 className="w-5 h-5 text-amber-300 animate-spin" /> : urlMode ? <LinkIcon className="w-5 h-5 text-amber-300" /> : <Search className="w-5 h-5 text-zinc-400" />}
            </span>
            <input
              ref={searchInputRef}
              value={input}
              onChange={handleInputChange}
              onFocus={() => { if (dropdownResults.length > 0) setDropdownOpen(true); }}
              onBlur={e => { setTimeout(() => setDropdownOpen(false), 150); }}
              onKeyDown={e => {
                if (e.key === 'Enter') { e.preventDefault(); if (dropdownOpen && dropdownResults[selectedIndex]) { selectResult(dropdownResults[selectedIndex]); } else { run(); } }
                if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex((i) => (i + 1) % dropdownResults.length); }
                if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex((i) => (i - 1 + dropdownResults.length) % dropdownResults.length); }
              }}
              placeholder="Escribe el artículo (Sony a7 IV, MacBook, PS5…) o pega el enlace de Amazon, B&H, Adorama, Walmart, eBay"
              className="w-full pl-12 pr-20 py-4 rounded-2xl bg-black border border-white/10 text-white placeholder:text-zinc-500 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-sm sm:text-[15px]" />
            {input && <button onClick={() => { setInput(''); setError(null); setInfo(null); setShowManual(false); clearDropdown(); }} className="absolute right-3 text-[11px] bg-white/5 hover:bg-white/10 text-zinc-300 px-2.5 py-1.5 rounded-lg cursor-pointer">Limpiar</button>}
          </div>
          <button onClick={() => run()} disabled={loading || !input.trim()} className="px-6 py-4 rounded-2xl bg-amber-400 hover:bg-amber-300 disabled:opacity-40 text-black font-black text-sm flex items-center justify-center gap-2 cursor-pointer shrink-0">
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> {urlMode ? 'Extrayendo…' : 'Buscando…'}</> : urlMode ? <><Sparkles className="w-5 h-5" /> Cotizar este artículo <ArrowRight className="w-4 h-4" /></> : <><Search className="w-5 h-5" /> Buscar en todas las tiendas</>}
          </button>
        </div>

        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-zinc-400 px-1">
          <span className={`w-2 h-2 rounded-full ${urlMode ? 'bg-amber-300' : 'bg-zinc-600'}`} />
          {urlMode ? 'Enlace detectado: extraeremos la imagen real, el título y el precio de la tienda.' : 'Buscaremos ese artículo en Amazon, eBay, B&H Photo, Adorama y Walmart con precio total en Colombia.'}
        </div>

        {/* Dropdown de resultados */}
        {dropdownOpen && dropdownResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 rounded-2xl bg-zinc-950 border border-amber-400/30 shadow-2xl shadow-black/70 max-h-[420px] overflow-y-auto">
            <div className="px-3 py-2 border-b border-white/5 text-[11px] font-bold text-amber-200 flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5" />
              Opciones disponibles en tiendas USA
            </div>
            {dropdownResults.map((item, i) => (
              <button
                key={i}
                onClick={() => selectResult(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-amber-400/10 border-b border-white/5 last:border-0 cursor-pointer transition-colors ${selectedIndex === i ? 'bg-amber-400/20 border-amber-400/50' : ''}`}
              >
                <div className="shrink-0 relative w-16 h-12 rounded-xl overflow-hidden bg-zinc-900 border border-white/10">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" onError={() => setDropdownResults((prev) => prev.filter((x) => x.id !== item.id))} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 text-[10px]">Sin imagen</div>
                  )}
                  <span className="absolute top-1 right-1 inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-black/70 backdrop-blur border border-amber-400/40 text-amber-300">{item.store}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold text-white line-clamp-1 truncate">{item.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-zinc-400 font-bold">{item.store}</span>
                    <span className="text-xs text-zinc-500">· {item.weightLbs} lbs</span>
                  </div>
                  <div className="text-sm font-black text-amber-300">{formatCOP(item.landed?.totalCop || 0)}</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Entrega 12 a 15 días hábiles · Todo incluido</div>
                </div>
                {item.storeUrl && (
                  <a
                    href={item.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/25 border border-amber-400/30 text-[10px] font-bold text-amber-300 flex items-center gap-1 transition-colors"
                    title="Ver artículo en la tienda oficial"
                  >
                    <span>Amazon</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              </button>
            ))}
            <div className="px-3 py-2 text-[11px] text-zinc-500 border-t border-white/5">
              Ver todos los resultados o pega el enlace directo del artículo para cotizarlo exactamente.
            </div>
          </div>
        )}

        {info && !error && <div className="mt-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{info}</div>}
        {error && <div className="mt-3 px-4 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-200 text-xs flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" />{error}</div>}

        {showManual && (
          <form onSubmit={submitManual} className="mt-4 p-4 rounded-2xl bg-black border border-amber-400/30 space-y-3">
            <p className="text-xs text-amber-100 flex gap-2"><Info className="w-4 h-4 shrink-0 text-amber-300" /> La tienda ocultó el precio, pero {detectedImage ? 'sí extrajimos su imagen real 👇' : 'necesitamos que confirmes el precio'}. Escribe el precio USD que ves en la página — no inventamos valores.</p>
            {detectedImage && <div className="flex items-center gap-3 bg-zinc-900 rounded-xl p-2 border border-white/10"><img src={detectedImage} alt="Imagen real del artículo" className="w-16 h-16 object-contain bg-white rounded-lg" referrerPolicy="no-referrer" /><span className="text-[11px] text-emerald-400 font-bold">✓ Esta es la imagen real de tu enlace</span></div>}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2"><label className="text-[11px] text-zinc-400 block mb-1">Artículo</label><input value={manualTitle} onChange={e => setManualTitle(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs" placeholder="Nombre del artículo" /></div>
              <div><label className="text-[11px] text-zinc-400 block mb-1">Precio en tienda (USD) *</label><input type="number" step="0.01" min="1" value={manualPrice} onChange={e => setManualPrice(e.target.value)} placeholder="299.99" required className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-amber-400/40 text-sm font-mono focus:outline-none focus:border-amber-400" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><label className="text-[11px] text-zinc-400 block mb-1">Peso estimado</label><select value={manualWeight} onChange={e => setManualWeight(e.target.value)} className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs"><option value="1">Hasta 1 lb</option><option value="2">2 lbs</option><option value="3">3 lbs</option><option value="5">5 lbs</option><option value="8">8 lbs</option><option value="15">15 lbs</option></select></div>
              <div className="sm:col-span-2"><label className="text-[11px] text-zinc-400 flex items-center gap-1 mb-1"><ImageIcon className="w-3 h-3" /> URL de la imagen (ya extraída si la tienda lo permitió, puedes cambiarla)</label><input value={manualImage} onChange={e => setManualImage(e.target.value)} placeholder="https://m.media-amazon.com/images/I/…" className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs" /></div>
            </div>
            <button disabled={loading} className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black text-xs cursor-pointer">{loading ? 'Calculando…' : 'Ver mi precio total en Colombia'}</button>
            {manualUrl && <p className="text-[10px] text-zinc-500 flex gap-1 truncate"><ExternalLink className="w-3 h-3 shrink-0" /> {manualUrl}</p>}
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-bold text-zinc-300 mr-1">Prueba un enlace real:</span>
          {EXAMPLES.map((s, i) => (
            <button key={i} onClick={() => { setInput(s.url); setTimeout(() => run(s.url), 30); }} className="px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-amber-400/50 hover:bg-amber-400/10 text-zinc-300 text-[11px] cursor-pointer"><b className="text-amber-300">{s.store}:</b> {s.label}</button>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[11px] sm:text-xs">
        <div className="bg-zinc-900/70 border border-white/5 rounded-xl px-2 py-2 text-zinc-300">Precio <b className="text-amber-300">total</b> en pesos, sin sorpresas</div>
        <div className="bg-zinc-900/70 border border-white/5 rounded-xl px-2 py-2 text-zinc-300">Entrega <b className="text-amber-300">12 a 15 días hábiles</b></div>
        <div className="bg-zinc-900/70 border border-white/5 rounded-xl px-2 py-2 text-zinc-300">TRM <b className="text-amber-300">automática</b> de hoy</div>
      </div>
    </div>
  );
}
