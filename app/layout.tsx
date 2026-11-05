import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Acervo de Pontos de Umbanda',
  description: 'Acervo sagrado com mais de 1.900 cantigas e pontos de Umbanda organizados por falange.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Pontos Umbanda'
  }
};

export const viewport: Viewport = {
  themeColor: '#059669',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(
                    function(registration) {
                      console.log('PWA ServiceWorker registrado com sucesso:', registration.scope);
                    },
                    function(err) {
                      console.log('Falha ao registrar PWA ServiceWorker:', err);
                    }
                  );
                });
              }
            `
          }}
        />
      </body>
    </html>
  );
}


