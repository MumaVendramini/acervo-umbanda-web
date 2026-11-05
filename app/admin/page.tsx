'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, Check, Trash2, Edit3, MessageSquare, PlusCircle } from 'lucide-react';

interface PontoPendente {
  id: string;
  linha: string;
  titulo?: string;
  letra: string;
  autor?: string;
  video_url?: string;
  nome_usuario: string;
  data_envio: string;
}

interface Comentario {
  id: string;
  ponto_id: string;
  primeiro_verso: string;
  nome_usuario: string;
  mensagem: string;
  data_envio: string;
}

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [erroLogin, setErroLogin] = useState('');
  const [loading, setLoading] = useState(false);

  const [totalPontos, setTotalPontos] = useState(0);
  const [pendentes, setPendentes] = useState<PontoPendente[]>([]);
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'pendentes' | 'comentarios'>('pendentes');

  const carregarDados = async (authToken: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTotalPontos(data.totalPontos || 0);
        setPendentes(data.pendentes || []);
        setComentarios(data.comentarios || []);
        setIsLogged(true);
      } else {
        setErroLogin('Senha de administrador incorreta.');
      }
    } catch {
      setErroLogin('Erro de conexão ao acessar o painel.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErroLogin('');
    carregarDados(token);
  };

  const handleAprovarPendente = async (id: string) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'aprovar_pendente', payload: { id } })
    });
    if (res.ok) {
      setPendentes(prev => prev.filter(p => p.id !== id));
      setTotalPontos(t => t + 1);
    }
  };

  const handleRejeitarPendente = async (id: string) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'rejeitar_pendente', payload: { id } })
    });
    if (res.ok) {
      setPendentes(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleResolverComentario = async (id: string) => {
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ action: 'resolver_comentario', payload: { id } })
    });
    if (res.ok) {
      setComentarios(prev => prev.filter(c => c.id !== id));
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
          <p className="text-xs text-slate-500 mb-6">Digite a senha de administrador para gerenciar o acervo.</p>

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
              <h1 className="text-base font-bold text-slate-900">Curadoria & Moderação</h1>
              <p className="text-xs text-slate-500 font-medium">{totalPontos} pontos no acervo oficial</p>
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

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Abas */}
        <div className="flex gap-2 border-b border-slate-200 pb-3">
          <button
            onClick={() => setAbaAtiva('pendentes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              abaAtiva === 'pendentes' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>📥 Pontos Enviados</span>
            <span className="bg-black/20 px-2 py-0.5 rounded-full text-[10px]">{pendentes.length}</span>
          </button>

          <button
            onClick={() => setAbaAtiva('comentarios')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              abaAtiva === 'comentarios' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <span>💬 Sugestões & Comentários</span>
            <span className="bg-black/20 px-2 py-0.5 rounded-full text-[10px]">{comentarios.length}</span>
          </button>
        </div>

        {/* ABA: PONTOS PENDENTES */}
        {abaAtiva === 'pendentes' && (
          <div className="space-y-4">
            {pendentes.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
                Nenhum ponto aguardando moderação no momento.
              </div>
            ) : (
              pendentes.map(p => (
                <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                        {p.linha}
                      </span>
                      <span className="text-slate-500">Enviado por: <strong>{p.nome_usuario}</strong></span>
                    </div>
                    <span className="text-slate-400 text-[11px]">{new Date(p.data_envio).toLocaleDateString()}</span>
                  </div>

                  <div className="whitespace-pre-line text-sm text-slate-800 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                    {p.letra}
                  </div>

                  {p.video_url && (
                    <div className="text-xs text-slate-600">
                      <strong>Vídeo YouTube:</strong>{' '}
                      <a href={p.video_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {p.video_url}
                      </a>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleRejeitarPendente(p.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl border border-red-200 font-semibold"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Descartar
                    </button>
                    <button
                      onClick={() => handleAprovarPendente(p.id)}
                      className="inline-flex items-center gap-1 px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold shadow-sm transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Aprovar e Incorporar
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* ABA: COMENTÁRIOS E SUGESTÕES */}
        {abaAtiva === 'comentarios' && (
          <div className="space-y-4">
            {comentarios.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-sm">
                Nenhuma sugestão ou comentário pendente.
              </div>
            ) : (
              comentarios.map(c => (
                <div key={c.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-100">
                    <span className="text-slate-500">De: <strong>{c.nome_usuario}</strong></span>
                    <span className="text-slate-400 text-[11px]">{new Date(c.data_envio).toLocaleDateString()}</span>
                  </div>

                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <strong>Ponto referente:</strong> &quot;{c.primeiro_verso}&quot;
                  </div>

                  <div className="text-sm text-slate-900 bg-amber-50/50 p-3 rounded-xl border border-amber-200/60 leading-relaxed">
                    {c.mensagem}
                  </div>

                  <div className="flex justify-end pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleResolverComentario(c.id)}
                      className="inline-flex items-center gap-1 px-4 py-1.5 text-xs bg-slate-900 hover:bg-black text-white rounded-xl font-semibold shadow-sm transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Marcar como Resolvido
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}

