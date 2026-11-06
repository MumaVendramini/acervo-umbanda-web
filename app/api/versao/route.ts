import { NextResponse } from 'next/server';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';

export async function GET() {
  try {
    // Tenta ler a versão e carimbo direto da planilha
    const res = await fetch(`${GOOGLE_SHEET_URL}?aba=versao`, { 
      next: { revalidate: 10 },
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.versao) {
        return NextResponse.json({
          versao_sistemica: String(data.versao),
          data_formatada: data.data_formatada || '',
          timestamp: Date.now(),
          fonte: 'planilha'
        });
      }
    }
  } catch {}

  // Fallback seguro caso a planilha demore
  const agora = new Date();
  const partes = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: false
  }).formatToParts(agora);
  const getP = (type: string) => partes.find(p => p.type === type)?.value || '';
  const versaoDinamica = `${getP('year')}${getP('month')}${getP('day')}${getP('hour')}${getP('minute')}`;
  const dataFormatada = `${getP('day')}/${getP('month')}/${getP('year')} ${getP('hour')}:${getP('minute')}`;

  return NextResponse.json({
    versao_sistemica: versaoDinamica,
    data_formatada: dataFormatada,
    timestamp: Date.now(),
    fonte: 'servidor'
  });
}


