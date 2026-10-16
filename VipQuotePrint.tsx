'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { formatCOP } from '@/lib/pricing';
import { VIP_CONTACT, quoteDateCO, type QuoteDocData } from '@/lib/quote-doc';
import { TERMS_INTRODUCTION, TERMS_SECTIONS, TERMS_TITLE } from '@/lib/terms';

/**
 * Hoja de cotización imprimible SIN LOGO: página 1 con la cotización y los datos de
 * contacto; página 2 con los términos y condiciones del servicio.
 * Se monta directamente en <body> para que la ventana emergente no recorte la
 * impresión. Solo visible al imprimir (no-print en pantalla).
 */
export function VipQuotePrint({ quote }: { quote: QuoteDocData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const date = quoteDateCO();
  const trmText = quote.trm ? `1 USD = ${formatCOP(quote.trm)}` : 'T.R.M. automática del día';
  return createPortal(
    <div id="vip-quote-print" className="print-only" aria-hidden={false}>
      <div className="vip-sheet">
        <div className="vip-header">
          <h1>
            Personal Shopper <span>V.I.P</span>
          </h1>
          <p>{VIP_CONTACT.tagline}</p>
        </div>
        <div className="vip-body">
          <div className="vip-meta">
            <span>
              <strong>Cotización Oficial</strong>
            </span>
            <span>
              Fecha: <strong>{date}</strong>
            </span>
          </div>
          <p className="vip-title">{quote.title}</p>
          <span className="vip-store">{quote.store}</span>
          <div className="vip-row">
            {quote.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={quote.imageUrl} alt="Artículo" className="vip-product-img" referrerPolicy="no-referrer" />
            ) : null}
            <table className="vip-table">
              <tbody>
                <tr>
                  <td>Precio en tienda (USD)</td>
                  <td>
                    <strong>${quote.priceUsd} USD</strong>
                  </td>
                </tr>
                <tr>
                  <td>T.R.M. del día</td>
                  <td>
                    <strong>{trmText}</strong>
                  </td>
                </tr>
                {quote.weightLbs ? (
                  <tr>
                    <td>Peso considerado</td>
                    <td>
                      <strong>{quote.weightLbs} lb</strong>
                    </td>
                  </tr>
                ) : null}
                {quote.city ? (
                  <tr>
                    <td>Ciudad de entrega</td>
                    <td>
                      <strong>{quote.city}</strong>
                    </td>
                  </tr>
                ) : null}
                <tr>
                  <td>Tiempo de entrega</td>
                  <td>
                    <strong>{VIP_CONTACT.delivery}</strong>
                  </td>
                </tr>
                {quote.url ? (
                  <tr>
                    <td>Enlace del artículo</td>
                    <td className="vip-url"><span className="vip-url-text">{quote.url}</span></td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
          <div className="vip-total">
            <div className="vip-total-lbl">PRECIO TOTAL PUESTO EN COLOMBIA</div>
            <div className="vip-total-val">{formatCOP(quote.totalCop)}</div>
            <div className="vip-total-sub">
              Todo incluido · Sin pagos adicionales al recibir · Entrega en {VIP_CONTACT.delivery}
            </div>
          </div>
          <p className="vip-note">
            Cotización válida con la T.R.M. del día ({date}). El valor mostrado es el precio final cerrado puesto en Colombia.
          </p>
          <div className="vip-sign-box">
            <div className="vip-sign-name">{VIP_CONTACT.advisor}</div>
            <div className="vip-sign-brand">{VIP_CONTACT.brand}</div>
            <div className="vip-sign-contact">
              ✉️ Correo: <strong>{VIP_CONTACT.email}</strong>
              <br />
              📱 Celular / WhatsApp: <strong>{VIP_CONTACT.phoneDisplay}</strong>
            </div>
          </div>
        </div>
        <div className="vip-footer">
          {VIP_CONTACT.brand} · {VIP_CONTACT.tagline} · {VIP_CONTACT.email} · Cel {VIP_CONTACT.phoneDisplay}
        </div>
      </div>
      <section className="vip-terms-page" aria-labelledby="vip-terms-title">
        <h2 id="vip-terms-title" className="vip-terms-title">{TERMS_TITLE}</h2>
        <p className="vip-terms-intro">{TERMS_INTRODUCTION}</p>
        <div className="vip-terms-columns">
          {TERMS_SECTIONS.map((section) => (
            <section key={section.id} className={section.highlighted ? 'vip-terms-section vip-terms-highlight' : 'vip-terms-section'}>
              <h3>{section.title}</h3>
              {section.blocks.map((block, index) => {
                if (block.type === 'list') {
                  return (
                    <ul key={index}>
                      {block.items.map((item, itemIndex) => (
                        <li key={itemIndex}>
                          {item.label && <><strong>{item.label}</strong>{' '}</>}
                          {item.text}
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === 'notice') {
                  return (
                    <div key={index} className="vip-terms-notice">
                      <p>{block.title}</p>
                      <p>{block.text}</p>
                    </div>
                  );
                }
                return <p key={index} className={block.emphasis ? 'vip-terms-emphasis' : undefined}>{block.text}</p>;
              })}
            </section>
          ))}
        </div>
      </section>
    </div>,
    document.body,
  );
}
