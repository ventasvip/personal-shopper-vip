'use client';
import React, { useEffect, useState } from 'react';
import { RefreshCw, TrendingUp } from 'lucide-react';
import { formatCOP } from '@/lib/pricing';

export function TrmBadge() {
  const [data, setData] = useState<{ trm: number; source: string; updatedAt: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (force = false) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/trm${force ? '?refresh=1' : ''}`);
      const j = await res.json();
      if (j.success) setData({ trm: j.trm, source: j.source, updatedAt: j.updatedAt });
    } catch {} finally { setLoading(false); }
  };
  useEffect(() => { load(); const i = setInterval(() => load(), 20 * 60 * 1000); return () => clearInterval(i); }, []);

  if (!data) return <div className="text-xs text-zinc-400 px-3 py-2 rounded-full border border-white/10 bg-white/5">TRM automática…</div>;
  return (
    <button onClick={() => load(true)} title={`${data.source} · Actualizada ${new Date(data.updatedAt).toLocaleString('es-CO')}. Clic para actualizar`}
      className="flex items-center gap-2 px-3 py-2 rounded-full border border-amber-400/30 bg-amber-400/10 hover:bg-amber-400/20 transition text-left cursor-pointer">
      <TrendingUp className="w-4 h-4 text-amber-300 shrink-0" />
      <span className="leading-none">
        <span className="block text-[10px] uppercase tracking-wider text-amber-200/70 font-bold">TRM hoy · automática</span>
        <span className="block text-sm font-black text-amber-200">1 USD = {formatCOP(data.trm)}</span>
      </span>
      <RefreshCw className={`w-3.5 h-3.5 text-amber-300/70 ${loading ? 'animate-spin' : ''}`} />
    </button>
  );
}
