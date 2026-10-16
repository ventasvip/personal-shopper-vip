import { CreditCard, Truck } from 'lucide-react';

interface Brand {
  name: string;
  logo: string;
}

// Logos guardados en /public/logos (íconos oficiales de cada marca), sin depender de servicios externos.
const CARRIERS: Brand[] = [
  { name: 'Inter Rapidísimo', logo: '/logos/inter-rapidisimo.svg' },
  { name: 'Envía', logo: '/logos/envia.png' },
  { name: 'Servientrega', logo: '/logos/servientrega.png' },
  { name: 'TCC', logo: '/logos/tcc.png' },
  { name: 'Coordinadora', logo: '/logos/coordinadora.png' },
];

const PAYMENT_METHODS: Brand[] = [
  { name: 'Nequi', logo: '/logos/nequi.png' },
  { name: 'DaviPlata', logo: '/logos/daviplata.png' },
  { name: 'Bancolombia', logo: '/logos/bancolombia.png' },
  { name: 'Bre-B', logo: '/logos/bre-b.png' },
  { name: 'PSE', logo: '/logos/pse.png' },
  { name: 'Falabella', logo: '/logos/falabella.png' },
  { name: 'ARQ', logo: '/logos/arq.png' },
  { name: 'Binance', logo: '/logos/binance.png' },
  { name: 'Wallib', logo: '/logos/wallib.png' },
  { name: 'Mercado Pago', logo: '/logos/mercado-pago.png' },
];

function BrandGrid({ brands, label }: { brands: Brand[]; label: string }) {
  return (
    <ul aria-label={label} className="flex flex-wrap justify-center gap-3">
      {brands.map((brand) => (
        <li
          key={brand.name}
          className="flex w-[calc(50%-0.375rem)] flex-col items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900 p-3 sm:w-36"
        >
          <div className="flex h-14 w-full items-center justify-center rounded-xl bg-white px-2 shadow">
            {/* El nombre visible debajo identifica la marca; la imagen es decorativa para lectores de pantalla. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={brand.logo} alt="" className="max-h-10 max-w-full object-contain" loading="lazy" decoding="async" />
          </div>
          <span className="text-center text-xs font-black text-white">{brand.name}</span>
        </li>
      ))}
    </ul>
  );
}

export function ShippingAndPayments() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 pb-14 sm:px-6">
      <section aria-labelledby="envios-titulo" className="rounded-[28px] border border-white/10 bg-zinc-900/70 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-black">
            <Truck className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 id="envios-titulo" className="text-xl font-black text-white sm:text-2xl">Envíos a toda Colombia</h2>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">
            Despachamos hasta la puerta de tu casa en cualquier ciudad de Colombia con nuestras transportadoras aliadas.
          </p>
        </div>
        <BrandGrid brands={CARRIERS} label="Transportadoras aliadas" />
      </section>

      <section aria-labelledby="pagos-titulo" className="rounded-[28px] border border-white/10 bg-zinc-900/70 p-6 sm:p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-400 text-black">
            <CreditCard className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 id="pagos-titulo" className="text-xl font-black text-white sm:text-2xl">Aceptamos todas las tarjetas y medios de pago</h2>
          <p className="mt-1 text-xs text-zinc-400 sm:text-sm">Paga con el medio que prefieras.</p>
        </div>
        <BrandGrid brands={PAYMENT_METHODS} label="Medios de pago aceptados" />
      </section>
    </div>
  );
}
