import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Crown, FileText } from 'lucide-react';
import { TermsContent } from '@/components/TermsContent';
import { TERMS_TITLE } from '@/lib/terms';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Personal Shopper V.I.P',
  description: 'Condiciones del servicio de compra por encargo, logística, transporte, pagos, garantías y devoluciones de Personal Shopper VIP.',
};

export default function TermsPage() {
  return (
    <main id="terms-page" className="min-h-screen bg-black px-4 py-8 text-zinc-100 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="mb-6 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-amber-300 transition hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver a Personal Shopper V.I.P
        </Link>
        <div className="overflow-hidden rounded-[28px] border border-amber-400/25 bg-zinc-950">
          <header className="border-b border-white/10 px-5 py-7 sm:px-8">
            <div className="mb-5 flex items-center gap-2 text-sm font-bold text-amber-300"><Crown className="h-5 w-5" aria-hidden="true" /> Personal Shopper V.I.P</div>
            <h1 className="text-xl font-black leading-snug text-white sm:text-2xl">{TERMS_TITLE}</h1>
            <p className="mt-3 flex items-center gap-2 text-xs text-zinc-400"><FileText className="h-4 w-4 shrink-0" aria-hidden="true" /> Documento completo del servicio</p>
          </header>
          <div className="px-5 py-7 sm:px-8"><TermsContent /></div>
          <footer className="border-t border-white/10 px-5 py-5 sm:px-8">
            <Link href="/" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-black transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">
              <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Volver al inicio
            </Link>
          </footer>
        </div>
      </div>
    </main>
  );
}
