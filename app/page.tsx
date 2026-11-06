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
  X,
  CheckCircle2,
  BadgeCheck,
  RotateCw
} from 'lucide-react';

interface Ponto {
  id: string | number;
  linha: string;
  titulo?: string;
  toque?: string;
  letra: string;
  origem?: string;
  video_url?: string;
  autor?: string;
  validado?: boolean | string;
  curador?: string;
}

const LINHAS = [
  'Todas',
  'Abertura e Defumação',
  'Baianos',
  'Boiadeiros',
  'Caboclos',
  'Ciganos',
  'Diversos / Sete Linhas',
  'Exus e Pombagiras',
  'Fundamentos e Curimba',
  'Iansã',
  'Ibeji (Erês)',
  'Iemanjá',
  'Malandros',
  'Marinheiros',
  'Nanã',
  'Obaluaê / Omolu',
  'Ogum',
  'Oxalá',
  'Oxóssi',
  'Oxum',
  'Pretos Velhos',
  'Xangô'
];

const CACHE_KEY = 'acervo_umbanda_sheets_v1';

export default function HomePage() {
  const [pontos, setPontos] = useState<Ponto[]>([]);
  const [loading, setLoading] = useState(true);
  const [linhaAtiva, setLinhaAtiva] = useState('Todas');
  const [busca, setBusca] = useState('');
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xlarge'>('normal');
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({});
  const [copiadoId, setCopiadoId] = useState<string | number | null>(null);

  // Modais
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalComentarioAberto, setModalComentarioAberto] = useState(false);
  const [pontoComentario, setPontoComentario] = useState<Ponto | null>(null);

  // Modal Validação Comunitária (Curador)
  const [modalValidarAberto, setModalValidarAberto] = useState(false);
  const [pontoValidar, setPontoValidar] = useState<Ponto | null>(null);
  const [curadorNome, setCuradorNome] = useState('');
  const [curadorSenha, setCuradorSenha] = useState('');
  const [curadorLinha, setCuradorLinha] = useState('');
  const [curadorLetra, setCuradorLetra] = useState('');
  const [curadorToque, setCuradorToque] = useState('');
  const [curadorVideo, setCuradorVideo] = useState('');
  const [curadorAutor, setCuradorAutor] = useState('');
  const [curadorOrigem, setCuradorOrigem] = useState('');
  const [statusValidar, setStatusValidar] = useState<{ tipo: 'ok' | 'erro' | null, msg: string }>({ tipo: null, msg: '' });
  const [validando, setValidando] = useState(false);

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

  // Recarga Pública
  const [recarregandoPublico, setRecarregandoPublico] = useState(false);
  const [msgAtualizacao, setMsgAtualizacao] = useState('');

  // Contador de Acessos
  const [visitas, setVisitas] = useState<{ visitas_unicas: number; pageviews: number }>({ visitas_unicas: 0, pageviews: 0 });

  useEffect(() => {
    // Checa se é uma nova visita ou refresh
    const jaVisitou = sessionStorage.getItem('sessao_visita_ativa');
    const isNovaVisita = !jaVisitou;
    if (isNovaVisita) {
      sessionStorage.setItem('sessao_visita_ativa', 'true');
    }

    // Registra visita
    fetch('/api/visitas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_nova_visita: isNovaVisita })
    })
      .then(r => r.json())
      .then(d => {
          if (d && (d.visitas_unicas !== undefined || d.pageviews !== undefined)) {
            const pv = Number(d.pageviews) || 0;
            const vu = Math.max(pv > 0 ? 1 : 0, Number(d.visitas_unicas) || 0);
            setVisitas({
            visitas_unicas: vu,
              pageviews: pv
            });
          }
        })
      .catch(() => { });
  }, []);

  const handleForcarAtualizacaoPublica = async () => {
    setRecarregandoPublico(true);
    setMsgAtualizacao('Buscando atualizações da planilha...');

    try {
      // 1. Limpa Storage Local
      localStorage.removeItem(CACHE_KEY);

      // 2. Limpa Cache do Service Worker
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }

      // 3. Busca direto da API com bypass de cache HTTP
      const res = await fetch('/api/pontos?t=' + Date.now(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.pontos && Array.isArray(data.pontos)) {
          setPontos(data.pontos);
          try {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              versao: data.versao || Date.now(),
              timestamp: Date.now(),
              pontos: data.pontos
            }));
          } catch { }
          setMsgAtualizacao('Acervo atualizado com sucesso!');
        } else {
          setMsgAtualizacao('Erro ao processar dados da planilha.');
        }
      } else {
        setMsgAtualizacao('Falha ao conectar à planilha.');
      }
    } catch {
      setMsgAtualizacao('Erro de conexão ao recarregar.');
    } finally {
      setRecarregandoPublico(false);
      setTimeout(() => setMsgAtualizacao(''), 3000);
    }
  };

  // 1. CARREGAMENTO 100% DA PLANILHA DO GOOGLE (com cache offline no celular e checagem leve de versão)
  useEffect(() => {
    let cacheVersao = '';
    // Tenta carregar do cache offline imediatamente
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed.pontos) && parsed.pontos.length > 0) {
          setPontos(parsed.pontos);
          setLoading(false);
          cacheVersao = parsed.versao || '';
        }
      }
    } catch (e) { }

    // Checagem ultraleve (< 1 KB) de versão antes de baixar o acervo completo
    fetch('/api/versao')
      .then(res => res.json())
      .then(info => {
        const versaoRemota = info?.versao_sistemica || '';
        // Se a versão for a mesma do cache, economiza franquia e não baixa 2MB de novo
        if (cacheVersao && versaoRemota && cacheVersao === versaoRemota) {
          setLoading(false);
          return;
        }

        // Se a versão mudou ou não há cache, baixa as cantigas em segundo plano
        fetch('/api/pontos')
          .then(res => res.json())
          .then(data => {
            if (data.pontos && Array.isArray(data.pontos)) {
              setPontos(data.pontos);
              try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                  versao: versaoRemota,
                  timestamp: Date.now(),
                  pontos: data.pontos
                }));
              } catch (e) { }
            }
            setLoading(false);
          })
          .catch(() => setLoading(false));
      })
      .catch(() => setLoading(false));
  }, []);

  // 2. FILTRAGEM ESTRITA E DIRETA
  const pontosFiltrados = useMemo(() => {
    return pontos.filter(p => {
      // 1. Linha exata conforme a sua planilha
      if (linhaAtiva !== 'Todas') {
        if (p.linha !== linhaAtiva) return false;
      }

      // 2. Busca por palavra
      if (busca.trim()) {
        const b = busca.toLowerCase();
        const matchLetra = p.letra && p.letra.toLowerCase().includes(b);
        const matchToque = p.toque && p.toque.toLowerCase().includes(b);
        const matchAutor = p.autor && p.autor.toLowerCase().includes(b);
        if (!matchLetra && !matchToque && !matchAutor) return false;
      }

      return true;
    });
  }, [pontos, linhaAtiva, busca]);

  // Ao trocar de linha, limpa a busca de texto para não misturar filtros
  const handleTrocarLinha = (novaLinha: string) => {
    setLinhaAtiva(novaLinha);
    setBusca('');
    setExpandidos({});
  };

  const toggleCard = (id: string | number) => {
    setExpandidos(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const copiarLetra = (id: string | number, letra: string) => {
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
        setStatusEnvio({ tipo: 'ok', msg: 'Ponto enviado com sucesso!' });
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
      const primeiroVerso = pontoComentario.letra ? pontoComentario.letra.split('\n')[0] : '';
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
        setStatusComent({ tipo: 'ok', msg: 'Comentário enviado com sucesso!' });
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

  const abrirModalValidacao = (ponto: Ponto) => {
    setPontoValidar(ponto);
    setCuradorLinha(ponto.linha || 'Caboclos');
    setCuradorLetra(ponto.letra || '');
    setCuradorToque(ponto.toque || '');
    setCuradorVideo(ponto.video_url || '');
    setCuradorAutor(ponto.autor || '');
    setCuradorOrigem(ponto.origem || '');
    setStatusValidar({ tipo: null, msg: '' });
    // Tenta carregar credenciais salvas do curador
    try {
      const salvo = localStorage.getItem('curador_umbanda_auth');
      if (salvo) {
        const { nome, senha } = JSON.parse(salvo);
        if (nome) setCuradorNome(nome);
        if (senha) setCuradorSenha(senha);
      }
    } catch { }
    setModalValidarAberto(true);
  };

  const handleConfirmarValidacao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pontoValidar) return;
    setValidando(true);
    setStatusValidar({ tipo: null, msg: 'Validando cantiga...' });

    try {
      const res = await fetch('/api/validar-ponto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ponto_id: pontoValidar.id,
          token: curadorSenha.trim(),
          nome_curador: curadorNome.trim(),
          linha: curadorLinha.trim(),
          letra: curadorLetra.trim(),
          toque: curadorToque.trim(),
          video_url: curadorVideo.trim(),
          autor: curadorAutor.trim(),
          origem: curadorOrigem.trim()
        })
      });
      const data = await res.json();
      if (res.ok) {
        // Atualiza otimista no estado e cache local
        setPontos(prev => {
          const novos = prev.map(p => {
            if (p.id === pontoValidar.id) {
              return {
                ...p,
                linha: curadorLinha.trim() || p.linha,
                letra: curadorLetra.trim() || p.letra,
                toque: curadorToque.trim() || p.toque,
                video_url: curadorVideo.trim() || p.video_url,
                autor: curadorAutor.trim() || p.autor,
                origem: curadorOrigem.trim() || p.origem,
                validado: 'SIM',
                curador: curadorNome.trim()
              };
            }
            return p;
          });

          // Grava imediatamente no cache local para persistir no F5
          try {
            const cached = localStorage.getItem(CACHE_KEY);
            const parsed = cached ? JSON.parse(cached) : {};
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              ...parsed,
              pontos: novos
            }));
          } catch { }

          return novos;
        });

        // Memoriza curador no navegador
        try {
          localStorage.setItem('curador_umbanda_auth', JSON.stringify({
            nome: curadorNome.trim(),
            senha: curadorSenha.trim()
          }));
        } catch { }

        setStatusValidar({ tipo: 'ok', msg: 'Cantiga validada com sucesso!' });
        setTimeout(() => {
          setModalValidarAberto(false);
          setStatusValidar({ tipo: null, msg: '' });
        }, 1500);
      } else {
        setStatusValidar({ tipo: 'erro', msg: data.error || 'Falha ao validar cantiga.' });
      }
    } catch {
      setStatusValidar({ tipo: 'erro', msg: 'Erro de conexão.' });
    } finally {
      setValidando(false);
    }
  };

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

            {/* Forçar Recarga Pública */}
            <button
              onClick={handleForcarAtualizacaoPublica}
              disabled={recarregandoPublico}
              className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
              title="Atualizar acervo com a planilha"
            >
              <RotateCw className={`w-4 h-4 ${recarregandoPublico ? 'animate-spin text-emerald-600' : ''}`} />
            </button>

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
          {msgAtualizacao && (
            <div className="mb-2 p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between font-medium">
              <span>{msgAtualizacao}</span>
            </div>
          )}
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

        {/* Carrossel de Linhas (Fiel à sua lista) */}
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
        {loading && pontos.length === 0 ? (
          <div className="py-20 text-center text-slate-400">
            <div className="animate-spin inline-block w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full mb-2" />
            <p className="text-sm">Carregando cantigas da planilha...</p>
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
              const cardKey = `card-${ponto.linha}-${ponto.id || index}-${index}`;
              const isExpandido = !!expandidos[cardKey];
              const linhasTexto = ponto.letra ? ponto.letra.split('\n').filter(l => l.trim().length > 0) : [];
              const duasPrimeiras = linhasTexto.slice(0, 2).join('\n');
              const resto = linhasTexto.slice(2).join('\n');
              const temMais = linhasTexto.length > 2;

              return (
                <div
                  key={cardKey}
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
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400 font-mono text-[11px]">#{ponto.id || (index + 1)}</span>
                        {ponto.validado === 'SIM' || ponto.validado === true ? (
                          <span
                            title={`Cantiga validada${ponto.curador ? ` por ${ponto.curador}` : ''}`}
                            className="text-blue-600 inline-flex items-center"
                          >
                            <BadgeCheck className="w-4 h-4 text-blue-600 fill-blue-100" />
                          </span>
                        ) : (
                          <button
                            onClick={() => abrirModalValidacao(ponto)}
                            title="Cantiga pendente de validação. Clique para validar como curador."
                            className="text-slate-300 hover:text-blue-500 transition inline-flex items-center"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Versos: Estilo uniforme em todas as linhas */}
                    <div
                      onClick={() => temMais && toggleCard(cardKey)}
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

                    {/* Vídeo do YouTube (apenas se preenchido na planilha) */}
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
                          onClick={() => toggleCard(cardKey)}
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
                        onClick={() => copiarLetra(cardKey, ponto.letra)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"
                        title="Copiar letra"
                      >
                        {copiadoId === cardKey ? (
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
                  Enviar
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
                  Enviar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Validação Litúrgica / Curador */}
      {modalValidarAberto && pontoValidar && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BadgeCheck className="w-4 h-4 text-blue-600" /> Validar Cantiga #{pontoValidar.id}
              </h2>
              <button
                onClick={() => setModalValidarAberto(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 text-xs text-slate-700 italic">
              &quot;{pontoValidar.letra ? pontoValidar.letra.split('\n')[0] : ''}&quot;
            </div>

            <form onSubmit={handleConfirmarValidacao} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Linha / Orixá *</label>
                  <select
                    value={curadorLinha}
                    onChange={e => setCuradorLinha(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:border-blue-500"
                    required
                  >
                    {LINHAS.filter(l => l !== 'Todas').map(l => (
                      <option key={l} value={l}>{l}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Toque / Ritmo</label>
                  <input
                    type="text"
                    value={curadorToque}
                    onChange={e => setCuradorToque(e.target.value)}
                    placeholder="Ex: Ijexá, Nagô, Barravento..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Letra da Cantiga (Revise ou corrija)</label>
                <textarea
                  rows={5}
                  value={curadorLetra}
                  onChange={e => setCuradorLetra(e.target.value)}
                  placeholder="Letra completa da cantiga..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-slate-800 text-xs font-mono leading-relaxed focus:bg-white focus:border-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">YouTube (Opcional)</label>
                  <input
                    type="url"
                    value={curadorVideo}
                    onChange={e => setCuradorVideo(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Autor (Opcional)</label>
                  <input
                    type="text"
                    value={curadorAutor}
                    onChange={e => setCuradorAutor(e.target.value)}
                    placeholder="Compositor"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Origem (Opcional)</label>
                  <input
                    type="text"
                    value={curadorOrigem}
                    onChange={e => setCuradorOrigem(e.target.value)}
                    placeholder="Terreiro / Livro"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Seu Nome (Curador) *</label>
                  <input
                    type="text"
                    value={curadorNome}
                    onChange={e => setCuradorNome(e.target.value)}
                    placeholder="Nome de quem valida"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Senha de Autorização *</label>
                  <input
                    type="password"
                    value={curadorSenha}
                    onChange={e => setCuradorSenha(e.target.value)}
                    placeholder="Senha"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:bg-white focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {statusValidar.msg && (
                <div className={`p-2.5 rounded-xl text-xs font-medium ${statusValidar.tipo === 'ok' ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-red-50 text-red-800 border border-red-200'
                  }`}>
                  {statusValidar.msg}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalValidarAberto(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={validando}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm transition"
                >
                  {validando ? 'Validando...' : 'Confirmar Validação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rodapé com Contador de Acessos */}
      <footer className="max-w-6xl mx-auto px-4 pt-10 pb-6 text-center text-xs text-slate-400 space-y-1.5 border-t border-slate-200/60 mt-10">
        <p className="font-medium text-slate-500">🌿 Acervo de Cantigas e Pontos de Umbanda • Curadoria Litúrgica</p>
        {(visitas.visitas_unicas > 0 || visitas.pageviews > 0) && (
          <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
            <span>👥 {visitas.visitas_unicas} visitantes</span>
            <span>•</span>
            <span>🔄 {visitas.pageviews} visualizações</span>
          </div>
        )}
      </footer>
    </div>
  );
}
