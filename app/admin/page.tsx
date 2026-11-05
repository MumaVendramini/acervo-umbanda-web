'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Lock, ArrowLeft, ExternalLink, RotateCw, CheckCircle2 } from 'lucide-react';

const SPREADSHEET_URL = 'https://docs.google.com/spreadsheets/d/1o6I7zuw347-kfA3TNuuY07IDRWqQBsIkrNuWV6APF/edit';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [isLogged, setIsLogged] = useState(false);
  const [erroLogin, setErroLogin] = useState('');
  const [loading, setLoading] = useState(false);
  const [msgRecarga, setMsgRecarga] = useState('');
  const [infoVersao, setInfoVersao] = useState({ versao: '', ultima_sincronizacao: '' });

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
      .catch(() => {});
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
      } else {
        setErroLogin('Senha de administrador incorreta.');
      }
    } catch {
      setErroLogin('Erro de conexão ao validar a senha.');
    } finally {
      setLoading(false);
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
