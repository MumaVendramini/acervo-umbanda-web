'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Printer, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Ponto {
  id: string;
  linha: string;
  toque?: string;
  letra: string;
}

function ImprimirConteudo() {
  const searchParams = useSearchParams();
  const linhaParam = searchParams.get('linha') || 'Todas';
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/pontos?limit=3000')
      .then(res => res.json())
      .then(data => {
        let lista: Ponto[] = data.pontos || [];
        if (linhaParam && linhaParam !== 'Todas') {
          lista = lista.filter(p => p.linha.toLowerCase() === linhaParam.toLowerCase());
        }
        setPontos(lista);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [linhaParam]);

  return (
    <div className="min-h-screen bg-white text-black p-4 md:p-8">
      {/* Barra superior de controle (oculta na impressão) */}
      <div className="no-print max-w-4xl mx-auto mb-6 p-4 bg-slate-100 rounded-2xl flex items-center justify-between border border-slate-200">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 hover:text-slate-900">
          <ArrowLeft className="w-4 h-4" /> Voltar ao Acervo
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-600 font-medium">
            {pontos.length} cantigas diagramadas
          </span>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition"
          >
            <Printer className="w-4 h-4" /> Imprimir / Salvar PDF
          </button>
        </div>
      </div>

      {/* Conteúdo Imprimível */}
      <div className="max-w-4xl mx-auto">
        <header className="border-b-2 border-black pb-3 mb-6 text-center">
          <h1 className="text-xl md:text-2xl font-bold uppercase tracking-wider">
            Apostila de Cantigas de Umbanda
          </h1>
          <p className="text-sm font-semibold text-neutral-700 mt-1">
            Linha: {linhaParam === 'Todas' ? 'Acervo Completo (Todas as Linhas)' : linhaParam} • {pontos.length} Pontos
          </p>
        </header>

        {loading ? (
          <div className="py-20 text-center text-slate-500 text-sm">
            Diagramando pontos para impressão A4...
          </div>
        ) : (
          <div className="print-columns text-[11px] leading-tight">
            {pontos.map((ponto, idx) => (
              <div 
                key={ponto.id} 
                className="print-avoid-break mb-4 p-2.5 border border-neutral-300 rounded-md bg-neutral-50/30"
              >
                <div className="flex items-center justify-between font-bold text-[10px] text-neutral-800 border-b border-neutral-200 pb-1 mb-1.5 uppercase">
                  <span>{ponto.linha}</span>
                  {ponto.toque && <span>[{ponto.toque}]</span>}
                </div>
                <div className="whitespace-pre-line text-neutral-900 font-normal">
                  {ponto.letra}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ImprimirPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-sm">Carregando visualizador de impressão...</div>}>
      <ImprimirConteudo />
    </Suspense>
  );
}

