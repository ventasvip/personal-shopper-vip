'use client';
import React, { useState } from 'react';
import { Calculator, DollarSign, Scale, ExternalLink, Sparkles, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { formatCOP } from '@/lib/pricing';

export function ManualQuotePrompt({ query, onQuoteGenerated }: { query: string; onQuoteGenerated: (data: any) => void }) {
  const [priceUsd, setPriceUsd] = useState('');
  const [weight, setWeight] = useState('2');
  const [storeUrl, setStoreUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any | null>(null);

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(priceUsd);
    if (!priceUsd || isNaN(priceNum) || priceNum <= 0) { setError('Indica el precio en USD que ves en la tienda.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch('/api/manual-quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: storeUrl || null, title: query, priceUsd: priceNum, weightLbs: weight }) });
      const data = await res.json();
      if (!res.ok || !data.success) { setError(data.error || 'Error al cotizar.'); return; }
      setPreview(data); onQuoteGenerated(data);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  return (
    <div className="mt-6 rounded-3xl border border-amber-400/30 bg-zinc-900 p-5 sm:p-6 text-left">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl bg-amber-400 text-black flex items-center justify-center shrink-0"><Calculator className="w-5 h-5" /></div>
        <div>
          <h3 className="text-sm font-black text-white">Cotiza “{query}” ahora mismo</h3>
          <p className="text-xs text-zinc-400 mt-1">Buscamos en Amazon, B&H Photo, Adorama, Walmart y eBay. Si tienes el artículo abierto en la tienda, escribe su precio en USD y te damos el <b className="text-amber-300">precio total puesto en Colombia</b>. Nunca inventamos precios.</p>
        </div>
      </div>
      <form onSubmit={generate} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3 items-end">
        <div>
          <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3 text-amber-300" /> Precio en la tienda (USD)</label>
          <input type="number" step="0.01" min="1" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} placeholder="Ej: 299.99" required className="w-full px-3 py-2.5 rounded-xl bg-black border border-amber-400/30 text-white font-mono focus:outline-none focus:border-amber-400" />
        </div>
        <div>
          <label className="block text-[11px] font-bold text-zinc-300 mb-1 flex items-center gap-1"><Scale className="w-3 h-3" /> Peso</label>
          <select value={weight} onChange={e => setWeight(e.target.value)} className="w-full px-3 py-2.5 rounded-xl bg-black border border-white/10 text-sm"><option value="1">Hasta 1 lb</option><option value="2">2 lbs</option><option value="3">3 lbs</option><option value="5">5 lbs</option><option value="8">8 lbs</option><option value="15">15 lbs</option></select>
        </div>
        <button disabled={loading} className="px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-black font-black text-xs flex items-center gap-2 cursor-pointer">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Cotizar total en COP</button>
      </form>
      <div className="mt-3">
        <label className="block text-[11px] font-bold text-zinc-400 mb-1 flex items-center gap-1"><ExternalLink className="w-3 h-3" /> Enlace del artículo (opcional — extraemos su imagen real)</label>
        <input type="url" value={storeUrl} onChange={e => setStoreUrl(e.target.value)} placeholder="https://www.amazon.com/dp/… · https://www.bhphotovideo.com/… · https://www.walmart.com/…" className="w-full px-3 py-2 rounded-xl bg-black border border-white/10 text-xs placeholder:text-zinc-600 focus:outline-none focus:border-amber-400" />
      </div>
      {error && <div className="mt-3 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      {preview && (
        <div className="mt-4 p-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold text-amber-200 flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Precio total puesto en Colombia</span>
          <span className="text-xl font-black text-amber-300">{formatCOP(preview.landed.totalCop)}</span>
          <span className="text-[11px] text-zinc-400">Entrega: 12 a 15 días hábiles · Todo incluido</span>
        </div>
      )}
    </div>
  );
}
