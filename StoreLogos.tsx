'use client';
import React, { useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { AMAZON_ASSOCIATE_TAG } from '@/lib/amazon-affiliate';

const STORES = [
  { name: 'Amazon', sub: 'U.S.A', domain: 'amazon.com', url: `https://www.amazon.com/?tag=${AMAZON_ASSOCIATE_TAG}` },
  { name: 'B&H Photo Video', sub: 'New York', domain: 'bhphotovideo.com', url: 'https://www.bhphotovideo.com/' },
  { name: 'Adorama', sub: 'Miami', domain: 'adorama.com', url: 'https://www.adorama.com/' },
  { name: 'Walmart', sub: 'USA', domain: 'walmart.com', url: 'https://www.walmart.com/' },
  { name: 'eBay', sub: 'USA', domain: 'ebay.com', url: 'https://www.ebay.com/' },
  { name: 'Best Buy', sub: 'USA', domain: 'bestbuy.com', url: 'https://www.bestbuy.com/' },
  { name: 'Bambu Lab', sub: 'USA', domain: 'bambulab.com', url: 'https://us.store.bambulab.com/' },
];

function Logo({ domain, name }: { domain: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err) return <span className="text-lg font-black text-black">{name[0]}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://www.google.com/s2/favicons?domain=${domain}&sz=128`}
      alt={`Logo ${name}`}
      className="w-9 h-9 object-contain"
      onError={() => setErr(true)}
      loading="lazy"
    />
  );
}

export function StoreLogos() {
  return (
    <section className="max-w-7xl mx-auto w-full px-4 sm:px-6 pb-8">
      <div className="text-center mb-4">
        <h2 className="text-sm sm:text-base font-black text-white">Compramos por ti en las tiendas oficiales de USA</h2>
        <p className="text-[11px] text-zinc-500">Haz clic en una tienda para visitarla</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {STORES.map((s) => (
          <a
            key={s.name}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col items-center gap-2 rounded-2xl bg-zinc-900 border border-white/10 hover:border-amber-400/60 hover:bg-zinc-800 p-4 transition"
            title={`Ir a ${s.name}`}
          >
            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center shadow">
              <Logo domain={s.domain} name={s.name} />
            </div>
            <div className="text-center leading-tight">
              <div className="text-xs font-black text-white group-hover:text-amber-300">{s.name}</div>
              <div className="text-[10px] text-zinc-400 flex items-center justify-center gap-1">{s.sub} <ExternalLink className="w-2.5 h-2.5" /></div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
