import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Acervo de Pontos de Umbanda',
  description: 'Acervo sagrado com mais de 1.900 cantigas e pontos de Umbanda organizados por falange.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}

