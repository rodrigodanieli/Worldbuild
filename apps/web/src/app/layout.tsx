import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WorldBuild Hub - Plataforma de Worldbuilding & RPG",
  description: "Criação de mundos, wiki colaborativa, mapas infinitos e fichas de D&D sincronizadas.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#0d0f14] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {children}
      </body>
    </html>
  );
}
