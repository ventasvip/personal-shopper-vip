'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { ExternalLink, FileText, X } from 'lucide-react';
import { TERMS_TITLE } from '@/lib/terms';
import { TermsContent } from './TermsContent';

export function TermsButton({ onClick, label = 'Términos y Condiciones' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-controls="terms-of-service-dialog"
      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-amber-400/30 bg-amber-400/5 px-3.5 py-2 text-xs font-bold text-amber-300 transition hover:border-amber-400/60 hover:bg-amber-400/15 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 cursor-pointer sm:text-sm"
    >
      <FileText className="h-4 w-4 shrink-0" aria-hidden="true" />
      {label}
    </button>
  );
}

export function TermsAndConditions({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted || !isOpen || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;

    // A native modal dialog provides focus containment, Escape support and an inert background.
    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = 'hidden';
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
    headingRef.current?.focus({ preventScroll: true });

    return () => {
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused?.isConnected) previouslyFocused.focus({ preventScroll: true });
    };
  }, [isOpen, mounted]);

  if (!mounted) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      id="terms-of-service-dialog"
      aria-modal="true"
      aria-labelledby="terms-dialog-title"
      aria-describedby="terms-dialog-description"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}
      className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-3xl overflow-hidden rounded-[28px] border border-amber-400/30 bg-zinc-950 p-0 text-zinc-100 shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[90dvh] flex-col">
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-white/10 px-5 py-5 sm:px-7">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-300">
              <FileText className="h-4 w-4" aria-hidden="true" /> Condiciones del servicio
            </div>
            <h2 ref={headingRef} tabIndex={-1} id="terms-dialog-title" className="text-base font-black leading-6 outline-none sm:text-lg">
              {TERMS_TITLE}
            </h2>
            <p id="terms-dialog-description" className="mt-2 text-xs leading-5 text-zinc-400">Lee el documento completo antes de solicitar tu compra por encargo.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar términos y condiciones" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-amber-400 cursor-pointer">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>
        <div ref={scrollRef} className="min-h-0 overflow-y-auto overscroll-contain px-5 py-6 sm:px-7">
          <TermsContent headingLevel={3} idPrefix="dialog-" />
        </div>
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-white/10 bg-zinc-950 px-5 py-4 sm:px-7">
          <Link href="/terminos-y-condiciones" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-amber-300 hover:text-amber-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400">
            Abrir página completa <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <button type="button" onClick={onClose} className="min-h-10 rounded-xl bg-amber-400 px-5 py-2.5 text-xs font-black text-black transition hover:bg-amber-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-amber-400 cursor-pointer">
            Cerrar y volver
          </button>
        </footer>
      </div>
    </dialog>,
    document.body,
  );
}
