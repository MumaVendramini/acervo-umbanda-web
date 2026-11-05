import { NextResponse } from 'next/server';

export async function GET() {
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
    timestamp: Date.now()
  });
}

