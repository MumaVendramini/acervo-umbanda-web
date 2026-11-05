import { NextResponse } from 'next/server';

export async function GET() {
  const agora = new Date();
  const versaoDinamica = agora.toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const dataFormatada = agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  return NextResponse.json({
    versao_sistemica: versaoDinamica,
    data_formatada: dataFormatada,
    timestamp: Date.now()
  });
}

