import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Personal Shopper V.I.P — Compras por encargo de Estados Unidos a Colombia",
  description: "No somos una tienda ni un casillero convencional, somos un servicio personalizado de compra por encargo y transporte desde tiendas en los Estados Unidos a Colombia. Entrega a tu puerta en 12 a 15 días hábiles. Asesoría Personalizada.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-black text-zinc-100 antialiased min-h-screen">{children}</body>
    </html>
  );
}
