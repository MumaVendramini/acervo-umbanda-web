'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, ExternalLink, RotateCw, CheckCircle2, MessageSquare, Check, Clock, Music, Trash2, Youtube } from 'lucide-react';

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1o6J7zuzw34Z-kfA3tNuuY07lDRWqQBsdkrNiaWV6APE/edit';

interface ComentarioItem {
  id?: string | number;
  data: string;
  nome: string;
  ponto: string;
  mensagem: string;
  status?: string;
  linha_idx?: number;
}

interface PontoSugeridoItem {
  linha_idx: number;
  data: string;
  linha: string;
  letra: string;
  autor: string;
  video_url: string;
  nome: string;
  status?: string;
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [erroLogin, setErroLogin] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgRecarga, setMsgRecarga] = useState('');
  const [infoVersao, setInfoVersao] = useState({ versao: '', ultima_sincronizacao: '' });

  // Gestão de Comentários
  const [comentarios, setComentarios] = useState<ComentarioItem[]>([]);
  const [carregandoComents, setCarregandoComents] = useState(false);
  const [atendendoId, setAtendendoId] = useState<string | number | null>(null);

  // Gestão de Pontos Sugeridos
  const [pontosSugeridos, setPontosSugeridos] = useState<PontoSugeridoItem[]>([]);
  const [carregandoPontosSug, setCarregandoPontosSug] = useState(false);
  const [aprovandoId, setAprovandoId] = useState<number | null>(null);

  // Métricas de Acesso
  const [metricas, setMetricas] = useState<{ visitas_unicas: number; pageviews: number }>({ visitas_unicas: 0, pageviews: 0 });

  const carregarMetricas = () => {
    fetch('/api/visitas')
      .then(r => r.json())
      .then(d => {
        if (d) {
          setMetricas({
            visitas_unicas: d.visitas_unicas || 0,
            pageviews: d.pageviews || 0
          });
        }
      })
      .catch(() => { });
  };

  const carregarComentarios = () => {
    setCarregandoComents(true);
    fetch('/api/comentarios')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.comentarios)) {
          setComentarios(d.comentarios);
        }
      })
      .catch(() => { })
      .finally(() => setCarregandoComents(false));
  };

  const carregarPontosSugeridos = () => {
    setCarregandoPontosSug(true);
    fetch('/api/enviar-ponto')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d.pontos_enviados)) {
          setPontosSugeridos(d.pontos_enviados);
        }
      })
      .catch(() => { })
      .finally(() => setCarregandoPontosSug(false));
  };
  setCarregandoComents(true);
  fetch('/api/comentarios')
    .then(r => r.json())
    .then(d => {
      if (Array.isArray(d.comentarios)) {
        setComentarios(d.comentarios);
      }
    })
    .catch(() => { })
    .finally(() => setCarregandoComents(false));
};

useEffect(() => {
  fetch('/api/versao')
    .then(r => r.json())
    .then(d => {
      if (d?.versao_sistemica) {
        setInfoVersao({
          versao: d.versao_sistemica,
          ultima_sincronizacao: d.data_formatada || ''
        });
      }
    })
    .catch(() => { });
}, []);

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setErroLogin('');
  setLoading(true);

  try {
    const res = await fetch('/api/admin', {
      headers: { Authorization: `Bearer ${token.trim()}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.versao) {
        setInfoVersao({
          versao: data.versao,
          ultima_sincronizacao: data.ultima_sincronizacao || ''
        });
      }
      setIsLogged(true);
      carregarComentarios();
      carregarPontosSugeridos();
      carregarMetricas();
    } else {
      setErroLogin('Senha de administrador incorreta.');
    }
  } catch {
    setErroLogin('Erro de conexão ao validar a senha.');
  } finally {
    setLoading(false);
  }
};

const handleMarcarAtendido = async (item: ComentarioItem, idx: number) => {
  const idParaAtender = item.linha_idx || item.id || (idx + 2);
  setAtendendoId(idParaAtender);
  try {
    await fetch('/api/comentarios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'atender_comentario',
        linha_id: idParaAtender,
        status: 'Atendido'
      })
    });

    // Remove instantaneamente da lista visual do curador
    setComentarios(prev => prev.filter((_, i) => i !== idx));
  } catch {
    alert('Erro ao marcar comentário como atendido.');
  } finally {
    setAtendendoId(null);
  }
};

const handleAprovarPontoSugerido = async (item: PontoSugeridoItem, idx: number) => {
  setAprovandoId(item.linha_idx);
  try {
    const res = await fetch('/api/enviar-ponto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'aprovar_ponto_sugerido',
        linha_id: item.linha_idx,
        linha: item.linha,
        letra: item.letra,
        autor: item.autor,
        video_url: item.video_url
      })
    });
    if (res.ok) {
      setPontosSugeridos(prev => prev.filter((_, i) => i !== idx));
      setMsgRecarga('Ponto aprovado e integrado ao Acervo com sucesso!');
      setTimeout(() => setMsgRecarga(''), 4000);
    } else {
      alert('Erro ao aprovar ponto sugerido.');
    }
  } catch {
    alert('Erro de conexão ao aprovar ponto.');
  } finally {
    setAprovandoId(null);
  }
};

const handleDescartarPontoSugerido = async (item: PontoSugeridoItem, idx: number) => {
  if (!confirm('Deseja realmente descartar este ponto sugerido?')) return;
  setAprovandoId(item.linha_idx);
  try {
    await fetch('/api/enviar-ponto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'descartar_ponto_sugerido',
        linha_id: item.linha_idx
      })
    });
    setPontosSugeridos(prev => prev.filter((_, i) => i !== idx));
  } catch {
    alert('Erro ao descartar ponto.');
  } finally {
    setAprovandoId(null);
  }
};

const handleLimparCache = () => {
  try {
    localStorage.removeItem('acervo_umbanda_sheets_v1');
    localStorage.removeItem('acervo_umbanda_cache_v1');
    setMsgRecarga('Cache limpo com sucesso! Ao voltar ao acervo, as cantigas serão recarregadas da planilha.');
    setTimeout(() => setMsgRecarga(''), 4000);
  } catch {
    setMsgRecarga('Erro ao acessar o armazenamento local.');
  }
};

if (!isLogged) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full border border-slate-200 shadow-xl text-center">
        <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-700">
          <Lock className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-1">Painel do Zelador</h1>
        <p className="text-xs text-slate-500 mb-1">Digite a senha para gerenciar o acervo.</p>
        {infoVersao.versao && (
          <p className="text-[11px] text-slate-400 font-mono mb-6">Versão: {infoVersao.versao}</p>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="password"
            placeholder="Senha de administrador"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 focus:bg-white focus:border-emerald-500 text-center tracking-widest"
            required
          />
          {erroLogin && <p className="text-xs text-red-600 font-medium">{erroLogin}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 hover:bg-black text-white font-semibold py-2.5 rounded-xl text-xs shadow-sm transition"
          >
            {loading ? 'Validando...' : 'Entrar no Painel'}
          </button>
        </form>

        <Link href="/" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 mt-6">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar ao Acervo
        </Link>
      </div>
    </div>
  );
}

return (
  <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
    <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 hover:bg-slate-100 rounded-lg text-slate-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span>🌿</span> Painel de Curadoria & Zeladoria
            </h1>
            <p className="text-xs text-slate-500 font-medium">Controle litúrgico e de dados</p>
          </div>
        </div>
        <button
          onClick={() => setIsLogged(false)}
          className="text-xs text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 font-medium"
        >
          Sair
        </button>
      </div>
    </header>

    <main className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      {/* Card de Status do Sistema */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Sistema Operacional & Ativo
          </h2>
          {infoVersao.versao && (
            <span className="font-mono text-xs bg-emerald-50 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-md font-bold">
              Versão: {infoVersao.versao}
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <p className="font-semibold text-slate-700">Base Central de Dados:</p>
            <p className="text-slate-500">Google Sheets (Aba Acervo)</p>
            <p className="text-[11px] text-slate-400">Qualquer edição nas células atualiza o site automaticamente.</p>
            {infoVersao.ultima_sincronizacao && (
              <p className="text-[11px] text-emerald-700 font-medium pt-1">
                Última sincronização: {infoVersao.ultima_sincronizacao}
              </p>
            )}
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
            <p className="font-semibold text-slate-700">Modo de Operação:</p>
            <p className="text-slate-500">Offline-First / Cache Local no Navegador</p>
            <p className="text-[11px] text-slate-400">Permite aos médiuns usar o app sem internet na gira.</p>
          </div>
        </div>

        {/* Estatísticas de Acesso */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <p className="font-semibold text-slate-800 text-xs mb-2">📊 Estatísticas de Audiência:</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-medium">Visitantes Únicos</span>
              <p className="text-lg font-bold text-slate-900">👥 {metricas.visitas_unicas}</p>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80">
              <span className="text-[11px] text-slate-400 font-medium">Total de Visualizações</span>
              <p className="text-lg font-bold text-slate-900">🔄 {metricas.pageviews}</p>
            </div>
          </div>
        </div>

        {/* Botões de Ação do Zelador */}
        <div className="pt-2 flex flex-col sm:flex-row gap-3">
          <a
            href={SPREADSHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <ExternalLink className="w-4 h-4" /> Abrir Planilha de Cantigas no Google Drive
          </a>

          <button
            onClick={handleLimparCache}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition"
          >
            <RotateCw className="w-4 h-4" /> Forçar Recarga de Dados do Navegador
          </button>
        </div>

        {msgRecarga && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
            {msgRecarga}
          </div>
        )}
      </div>

      {/* Central de Moderação de Comentários e Sugestões */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-600" /> Sugestões & Comentários dos Médiuns
          </h2>
          <button
            onClick={carregarComentarios}
            disabled={carregandoComents}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RotateCw className={`w-3.5 h-3.5 ${carregandoComents ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>

        {carregandoComents ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Carregando sugestões da planilha...
          </div>
        ) : comentarios.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 space-y-1">
            <Check className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-600">Nenhum comentário pendente!</p>
            <p>Todas as sugestões foram atendidas.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {comentarios.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">{item.nome}</span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.data}
                    </span>
                  </div>
                  {item.ponto && (
                    <p className="text-[11px] text-emerald-800 font-medium italic">
                      &quot;{item.ponto}&quot;
                    </p>
                  )}
                  <p className="text-slate-700 bg-white p-2.5 rounded-xl border border-slate-200/80">
                    {item.mensagem}
                  </p>
                </div>

                <div className="flex-shrink-0">
                  <button
                    onClick={() => handleMarcarAtendido(item, idx)}
                    disabled={atendendoId === (item.id || idx)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm text-xs transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {atendendoId === (item.id || idx) ? 'Atendendo...' : 'Atendido'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Central de Novos Pontos Sugeridos */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Music className="w-4 h-4 text-emerald-600" /> Pontos Sugeridos para Moderação
          </h2>
          <button
            onClick={carregarPontosSugeridos}
            disabled={carregandoPontosSug}
            className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
          >
            <RotateCw className={`w-3.5 h-3.5 ${carregandoPontosSug ? 'animate-spin' : ''}`} /> Atualizar
          </button>
        </div>

        {carregandoPontosSug ? (
          <div className="text-center py-6 text-xs text-slate-400">
            Carregando pontos sugeridos da planilha...
          </div>
        ) : pontosSugeridos.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 space-y-1">
            <Check className="w-6 h-6 text-emerald-500 mx-auto" />
            <p className="font-semibold text-slate-600">Nenhum ponto aguardando moderação!</p>
            <p>Todos os pontos sugeridos foram avaliados.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pontosSugeridos.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 text-xs">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.linha}
                    </span>
                    <span className="text-slate-600 font-medium">Sugerido por: <strong>{item.nome}</strong></span>
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {item.data}
                    </span>
                  </div>

                  {item.video_url && (
                    <a
                      href={item.video_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] text-red-600 hover:underline"
                    >
                      <Youtube className="w-3.5 h-3.5" /> Ouvir Vídeo
                    </a>
                  )}
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200/80 whitespace-pre-line text-slate-800 font-normal leading-relaxed font-mono text-[11px]">
                  {item.letra}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-slate-400">
                    {item.autor ? `Autor: ${item.autor}` : 'Sem autor informado'}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDescartarPontoSugerido(item, idx)}
                      disabled={aprovandoId === item.linha_idx}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-xl font-medium border border-red-200 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Descartar
                    </button>

                    <button
                      onClick={() => handleAprovarPontoSugerido(item, idx)}
                      disabled={aprovandoId === item.linha_idx}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {aprovandoId === item.linha_idx ? 'Aprovando...' : 'Aprovar e Integrar ao Acervo'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Guia Rápido de Gestão */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-3 text-xs text-slate-600">
        <h3 className="font-bold text-slate-900 text-sm">📖 Como Gerenciar seu Terreiro na Planilha:</h3>
        <ul className="space-y-2 list-disc list-inside">
          <li><strong>Para aprovar um ponto sugerido:</strong> Abra a aba <em>&quot;Pontos Enviados&quot;</em>, revise o texto e mova a linha para a aba <em>&quot;Acervo&quot;</em>.</li>
          <li><strong>Para ler sugestões e correções:</strong> Abra a aba <em>&quot;Comentários&quot;</em> para ver o que os médiuns relataram.</li>
          <li><strong>Para adicionar ou corrigir letras:</strong> Edite diretamente as células da aba <em>&quot;Acervo&quot;</em>. Em até 1 minuto, o site sincroniza sozinho.</li>
        </ul>
      </div>
    </main>
  </div>
);
}
