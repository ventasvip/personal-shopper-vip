import React, { useState } from 'react';
import { Star, ShieldCheck, Clock3 } from 'lucide-react';
import { formatCOP } from '@/lib/pricing';

export interface ProductItem {
  id: number;
  title: string;
  description: string;
  priceUsd: number;
  originalPriceUsd: number | null;
  store: string;
  storeUrl: string;
  imageUrl: string;
  category: string;
  rating: number;
  reviewsCount: number;
  weightLbs: number;
  sku: string | null;
  brand: string | null;
  features: string[] | null;
  landed: { totalCop: number; deliveryEstimate?: string };
}

export function ProductCard({ product, onSelect, onInstantOrder, onImageError }: { product: ProductItem; onSelect: (p: ProductItem) => void; onInstantOrder: (p: ProductItem) => void; onImageError?: (id: number) => void }) {
  const [imgError, setImgError] = useState(false);
  // Sin fotografía del artículo no se muestra la tarjeta.
  if (!product.imageUrl || imgError) return null;
  return (
    <div className="group flex flex-col bg-zinc-900 border border-white/10 rounded-3xl overflow-hidden hover:border-amber-400/60 transition-all duration-300 hover:shadow-2xl hover:shadow-amber-500/10">
      <div className="relative aspect-[4/3] w-full bg-zinc-950 overflow-hidden cursor-pointer" onClick={() => onSelect(product)}>
        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" onError={() => { setImgError(true); onImageError?.(product.id); }} referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        <span className="absolute top-3 left-3 inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold bg-black/70 backdrop-blur border border-amber-400/40 text-amber-300">{product.store}</span>
        <span className="absolute bottom-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold bg-black/70 backdrop-blur px-2 py-1 rounded-full text-zinc-200"><Clock3 className="w-3 h-3 text-amber-300" /> 12 a 15 días hábiles</span>
      </div>

      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between text-xs text-zinc-400 mb-1.5">
          <span className="font-semibold text-amber-400">{product.category}</span>
          <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /><b className="text-zinc-100">{product.rating}</b> ({product.reviewsCount})</span>
        </div>
        <h3 className="font-bold text-zinc-50 text-[15px] leading-snug line-clamp-2 hover:text-amber-300 cursor-pointer" onClick={() => onSelect(product)}>{product.title}</h3>
        <p className="text-xs text-zinc-400 line-clamp-2 mt-1.5 leading-relaxed">{product.description}</p>

        <div className="mt-auto pt-4">
          <div className="text-[10px] uppercase tracking-[0.14em] text-zinc-500 font-bold">Precio total puesto en Colombia</div>
          <div className="text-2xl font-black text-amber-300 tracking-tight mt-0.5">{formatCOP(product.landed.totalCop)}</div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Todo incluido · Sin pagos adicionales al recibir</div>
          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={() => onSelect(product)} className="px-3 py-2.5 text-xs font-bold rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-100 cursor-pointer">Cotizar</button>
            <button onClick={() => onInstantOrder(product)} className="px-3 py-2.5 text-xs font-black rounded-xl bg-amber-400 hover:bg-amber-300 text-black cursor-pointer">Pedir ahora</button>
          </div>
          {product.storeUrl && (
            <a
              href={product.storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-black/40 hover:bg-black/80 border border-white/10 text-[11px] font-bold text-amber-300 hover:text-amber-200 transition-colors"
            >
              <span>Ver artículo en Amazon</span>
              <span className="text-xs">↗</span>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
