import { NextResponse } from 'next/server';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';

export async function GET() {
  const agoraSync = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  }).format(new Date());

  const versaoSistemica = process.env.NEXT_PUBLIC_APP_VERSION || '202611061400';

  try {
    const res = await fetch(`${GOOGLE_SHEET_URL}?aba=versao`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        versao_sistemica: versaoSistemica,
        data_ultima_alteracao: data.data_formatada || data.versao || 'Não informada',
        data_ultima_sincronizacao: agoraSync,
        total_pontos: data.total || 0,
        status: 'conectado'
      });
    }
  } catch {}

  return NextResponse.json({
    versao_sistemica: versaoSistemica,
    data_ultima_alteracao: 'Indisponível',
    data_ultima_sincronizacao: `${agoraSync} (Falha de comunicação)`,
    total_pontos: 0,
    status: 'erro'
  });
}


