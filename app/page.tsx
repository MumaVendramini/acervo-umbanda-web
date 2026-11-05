'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  PlusCircle,
  Printer,
  Youtube,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  Lock,
  X
} from 'lucide-react';

interface Ponto {
  id: string;
  linha: string;
  titulo?: string;
  toque?: string;
  letra: string;
  origem?: string;
  video_url?: string;
  autor?: string;
}

const LINHAS = [
  'Todas',
  'Caboclos',
  'Ogum',
  'Iemanjá',
  'Oxóssi',
  'Xangô',
  'Exus e Pombagiras',
  'Oxalá',
  'Boiadeiros',
  'Abertura e Defumação',
  'Pretos Velhos',
  'Iansã',
  'Oxum',
  'Ibeji (Erês)',
  'Baianos',
  'Marinheiros',
  'Nanã',
  'Obaluaê / Omolu',
  'Malandros',
  'Ciganos'
];

const CACHE_KEY = 'acervo_umbanda_cache_v1';

export default function HomePage() {
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [loading, setLoading] = useState(true);
  const [linhaAtiva, setLinhaAtiva] = useState('Todas');
  const [busca, setBusca] = useState('');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [copiadoId, setCopiadoId] = useState<string | null>(null);

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalComentarioAberto, setModalComentarioAberto] = useState(false);
  const [pontoComentario, setPontoComentario] = useState<Ponto | null>(null);

  // Formulário Novo Ponto
  const [novoLinha, setNovoLinha] = useState('Caboclos');
  const [novoTitulo, setNovoTitulo] = useState('');
  const [novoLetra, setNovoLetra] = useState('');
  const [novoAutor, setNovoAutor] = useState('');
  const [novoVideo, setNovoVideo] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [statusEnvio, setStatusEnvio] = useState<{ tipo: 'ok' | 'erro' | null, msg: string }>({ tipo: null, msg: '' });

  // Formulário Comentário
  const [comentNome, setComentNome] = useState('');
  const [comentMsg, setComentMsg] = useState('');
  const [statusComent, setStatusComent] = useState<{ tipo: 'ok' | 'erro' | null, msg: string }>({ tipo: null, msg: '' });

  // 1. CARREGAMENTO OFFLINE-FIRST (Lê do cache instantâneo e sincroniza em background)
  useEffect(() => {
    // Tenta carregar do cache local imediatamente (0 ms)
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.pontos) && parsed.pontos.length > 0) {
          setPontos(parsed.pontos);
          setLoading(false);
        }
      }
    } catch (e) {
      console.error('Erro ao ler cache local:', e);
    }

    // Busca assíncrona para atualizar em segundo plano
    fetch('/api/pontos?limit=3000')
      .then(res => res.json())
      .then(data => {
        if (data.pontos && Array.isArray(data.pontos) && data.pontos.length > 0) {
          setPontos(data.pontos);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              timestamp: Date.now(),
              pontos: data.pontos
            }));
          } catch (e) {
            console.warn('Storage quota excedido, mantendo em memória');
          }
        }
        setLoading(false);
      })
      .catch (() => {
      // Se estiver offline, mantém o que já carregou do cache
      setLoading(false);
    });
}, []);

// 2. FILTRAGEM LOCAL 100% INSTANTÂNEA NA MEMÓRIA DO CELULAR
const pontosFiltrados = useMemo(() => {
  return pontos.filter(p => {
    // Filtro de Linha
    const matchLinha = linhaAtiva === 'Todas' || (p.linha && p.linha.toLowerCase() === linhaAtiva.toLowerCase());
    if (!matchLinha) return false;

    // Filtro de Busca
    if (!busca.trim()) return true;
    const b = busca.toLowerCase();
    const matchLetra = p.letra && p.letra.toLowerCase().includes(b);
    const matchToque = p.toque && p.toque.toLowerCase().includes(b);
    const matchAutor = p.autor && p.autor.toLowerCase().includes(b);
    return matchLetra || matchToque || matchAutor;
  });
}, [pontos, linhaAtiva, busca]);

// Ao trocar de linha, limpa a busca de texto para não prender a tela
const handleTrocarLinha = (novaLinha: string) => {
  setLinhaAtiva(novaLinha);
  // Não força scroll agressivo, mantém a rolagem suave
};

const toggleCard = (id: string) => {
  setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
};

const copiarLetra = (id: string, letra: string) => {
  navigator.clipboard.writeText(letra);
  setCopiadoId(id);
  setTimeout(() => setCopiadoId(null), 2000);
};

const handleEnviarNovo = async (e: React.FormEvent) => {
  e.preventDefault();
  setStatusEnvio({ tipo: null, msg: 'Enviando...' });
  try {
    const res = await fetch('/api/enviar-ponto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        linha: novoLinha,
        titulo: novoTitulo,
        letra: novoLetra,
        autor: novoAutor,
        video_url: novoVideo,
        nome_usuario: novoNome
      })
    });
    const data = await res.json();
    if (res.ok) {
      setStatusEnvio({ tipo: 'ok', msg: 'Ponto enviado para moderação com sucesso!' });
      setTimeout(() => {
        setModalNovoAberto(false);
        setNovoLetra('');
        setNovoTitulo('');
        setNovoVideo('');
        setNovoAutor('');
        setStatusEnvio({ tipo: null, msg: '' });
      }, 2000);
    } else {
      setStatusEnvio({ tipo: 'erro', msg: data.error || 'Erro ao enviar ponto.' });
    }
  } catch {
    setStatusEnvio({ tipo: 'erro', msg: 'Erro de conexão.' });
  }
};

const handleEnviarComentario = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!pontoComentario) return;
  setStatusComent({ tipo: null, msg: 'Enviando...' });
  try {
    const primeiroVerso = pontoComentario.letra.split('\n')[0] || '';
    const res = await fetch('/api/comentarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ponto_id: pontoComentario.id,
        primeiro_verso: primeiroVerso,
        nome_usuario: comentNome,
        mensagem: comentMsg
      })
    });
    const data = await res.json();
    if (res.ok) {
      setStatusComent({ tipo: 'ok', msg: 'Sugestão gravada com sucesso!' });
      setTimeout(() => {
        setModalComentarioAberto(false);
        setComentMsg('');
        setStatusComent({ tipo: null, msg: '' });
      }, 2000);
    } else {
      setStatusComent({ tipo: 'erro', msg: data.error || 'Erro ao enviar.' });
    }
  } catch {
    setStatusComent({ tipo: 'erro', msg: 'Erro de conexão.' });
  }
};

// Tipografia uniforme (mesmo tamanho e peso suave em todas as linhas)
const fontClass =
  fontSize === 'xlarge' ? 'text-base leading-relaxed' :
    fontSize === 'large' ? 'text-sm leading-relaxed' :
      'text-xs leading-normal';

return (
  <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
    {/* Topo Fixo */}
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
            <span>🌿</span> Acervo de Umbanda
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            {pontosFiltrados.length} cantigas disponíveis
          </p>
        </div>

        <div className="flex items-center gap-1.5 md:gap-2">
          {/* Controle de Fonte */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200">
            <button
              onClick={() => setFontSize(f => f === 'xlarge' ? 'large' : 'normal')}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-bold"
              title="Diminuir fonte"
            >
              A-
            </button>
            <span className="w-px h-3 bg-slate-300" />
            <button
              onClick={() => setFontSize(f => f === 'normal' ? 'large' : 'xlarge')}
              className="px-2 py-1 text-slate-600 hover:text-slate-900 text-xs font-bold"
              title="Aumentar fonte"
            >
              A+
            </button>
          </div>

          {/* Imprimir */}
          <Link
            href={`/imprimir?linha=${encodeURIComponent(linhaAtiva)}`}
            target="_blank"
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
            title="Imprimir Apostila A4"
          >
            <Printer className="w-5 h-5" />
          </Link>

          {/* Novo Ponto */}
          <button
            onClick={() => setModalNovoAberto(true)}
            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar Ponto</span>
          </button>

          {/* Admin */}
          <Link
            href="/admin"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            title="Painel Admin"
          >
            <Lock className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Barra de Busca Instantânea */}
      <div className="max-w-6xl mx-auto px-4 pb-2.5">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por verso cantado, toque, palavra..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full bg-slate-100 border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl pl-9 pr-8 py-2 text-sm text-slate-800 placeholder-slate-400 transition"
          />
          {busca && (
            <button
              onClick={() => setBusca('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Carrossel de Linhas (Fácil de rolar no mobile, sem scrollbar cinza) */}
      <div className="border-t border-slate-100 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar scroll-smooth">
          {LINHAS.map(linha => {
            const ativo = linhaAtiva === linha;
            return (
              <button
                key={linha}
                onClick={() => handleTrocarLinha(linha)}
                className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium transition ${ativo
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
              >
                {linha}
              </button>
            );
          })}
        </div>
      </div>
    </header>

    {/* Grid de Pontos: 2 colunas no desktop, 1 coluna no mobile */}
    <main className="max-w-6xl mx-auto px-4 py-5">
        { loading && pontos.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-2" />
            <p className="text-sm">Carregando acervo sagrado...</p>
          </div>
        ) : pontosFiltrados.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 p-8 shadow-sm max-w-md mx-auto">
            <p className="text-slate-500 text-sm font-medium">Nenhum ponto encontrado para essa seleção.</p>
            <button
              onClick={() => { setBusca(''); setLinhaAtiva('Todas'); }}
              className="mt-3 text-xs text-emerald-600 font-semibold hover:underline"
            >
              Ver todas as cantigas
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start">
            {pontosFiltrados.map((ponto, index) => {
              const isExpandido = !!expandidos[ponto.id];
              const linhasTexto = ponto.letra ? ponto.letra.split('\n').filter(l => l.trim().length > 0) : [];
              const duasPrimeiras = linhasTexto.slice(0, 2).join('\n');
              const resto = linhasTexto.slice(2).join('\n');
              const temMais = linhasTexto.length > 2;

              return (
                <div
                  key={ponto.id || `pt-${index}`}
                  className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm hover:shadow transition duration-150 flex flex-col justify-between"
                >
                  <div>
                    {/* Header do Card */}
                    <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-100 text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60">
                          {ponto.linha}
                        </span>
                        {ponto.toque && (
                          <span className="text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 font-normal">
                            Toque: {ponto.toque}
                          </span>
                        )}
                      </div>
                      <span className="text-slate-400 font-mono text-[11px]">#{index + 1}</span>
                    </div>

                    {/* Versos: Estilo uniforme em todas as linhas (sem negrito artificial) */}
                    <div
                      onClick={() => temMais && toggleCard(ponto.id)}
                      className={`cursor-pointer whitespace-pre-line text-slate-800 font-normal tracking-wide ${fontClass}`}
                    >
                      {duasPrimeiras}
                    </div>

                    {/* Resto dos versos (expandido) */}
                    {isExpandido && temMais && (
                      <div className={`mt-2 pt-2 border-t border-slate-100 whitespace-pre-line text-slate-800 font-normal tracking-wide ${fontClass}`}>
                        {resto}
                      </div>
                    )}

                    {/* Vídeo do YouTube (apenas se preenchido) */}
                    {isExpandido && ponto.video_url && (
                      <div className="mt-3 pt-2.5 border-t border-slate-100">
                        <a
                          href={ponto.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg border border-red-200 transition"
                        >
                          <Youtube className="w-3.5 h-3.5" /> Ouvir toque no YouTube
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card */}
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div>
                      {temMais ? (
                        <button
                          onClick={() => toggleCard(ponto.id)}
                          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 font-medium py-0.5"
                        >
                          {isExpandido ? (
                            <>Recolher <ChevronUp className="w-3.5 h-3.5" /></>
                          ) : (
                            <>Ver completo ({linhasTexto.length} versos) <ChevronDown className="w-3.5 h-3.5" /></>
                          )}
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-400">Ponto curto</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copiarLetra(ponto.id, ponto.letra)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                        title="Copiar letra"
                      >
                        {copiadoId === ponto.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setPontoComentario(ponto);
                          setModalComentarioAberto(true);
                        }}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                        title="Sugerir correção ou comentar"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
    </main>

    {/* MODAL: Enviar Ponto Novo */}
    {modalNovoAberto && (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>➕</span> Cadastrar Novo Ponto
            </h2>
            <button
              onClick={() => setModalNovoAberto(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleEnviarNovo} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Linha Espiritual *</label>
              <select
                value={novoLinha}
                onChange={e => setNovoLinha(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500"
                required
              >
                {LINHAS.filter(l => l !== 'Todas').map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Letra Completa do Ponto *</label>
              <textarea
                rows={5}
                value={novoLetra}
                onChange={e => setNovoLetra(e.target.value)}
                placeholder="Digite os versos com quebra de linha..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-sm focus:bg-white focus:border-emerald-500 leading-relaxed font-normal"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título / Identificação (Opcional)</label>
                <input
                  type="text"
                  value={novoTitulo}
                  onChange={e => setNovoTitulo(e.target.value)}
                  placeholder="Ex: Hino, Ponto de Subida..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Autor / Terreiro (Opcional)</label>
                <input
                  type="text"
                  value={novoAutor}
                  onChange={e => setNovoAutor(e.target.value)}
                  placeholder="Ex: Tenda São Jorge..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Link do Vídeo (Apenas YouTube)</label>
              <input
                type="url"
                value={novoVideo}
                onChange={e => setNovoVideo(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Seu Nome *</label>
              <input
                type="text"
                value={novoNome}
                onChange={e => setNovoNome(e.target.value)}
                placeholder="Nome do médium colaborador"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500"
                required
              />
            </div>

            {statusEnvio.msg && (
              <div className={`p-3 rounded-xl text-xs font-medium ${statusEnvio.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                {statusEnvio.msg}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalNovoAberto(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition"
              >
                Enviar para Moderação
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* MODAL: Enviar Comentário / Correção */}
    {modalComentarioAberto && pontoComentario && (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" /> Sugerir Correção
            </h2>
            <button
              onClick={() => setModalComentarioAberto(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 mb-3 text-xs text-slate-600 italic">
            &quot;{pontoComentario.letra ? pontoComentario.letra.split('\n')[0] : ''}&quot;
          </div>

          <form onSubmit={handleEnviarComentario} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Seu Nome *</label>
              <input
                type="text"
                value={comentNome}
                onChange={e => setComentNome(e.target.value)}
                placeholder="Nome do médium"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-sm focus:bg-white focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">O que precisa ser corrigido? *</label>
              <textarea
                rows={4}
                value={comentMsg}
                onChange={e => setComentMsg(e.target.value)}
                placeholder="Ex: O verso correto é X, ou o toque é Barravento..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 text-sm focus:bg-white focus:border-emerald-500"
                required
              />
            </div>

            {statusComent.msg && (
              <div className={`p-2.5 rounded-xl text-xs font-medium ${statusComent.tipo === 'ok' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                {statusComent.msg}
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModalComentarioAberto(false)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl font-semibold shadow-sm transition"
              >
                Enviar Sugestão
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);
}
