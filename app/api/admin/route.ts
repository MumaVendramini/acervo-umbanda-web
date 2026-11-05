import { NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'umbanda2026';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }

  const agora = new Date();
  const versaoDinamica = agora.toISOString().replace(/[-:T]/g, '').slice(0, 12);
  const dataFormatada = agora.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });

  return NextResponse.json({
    authed: true,
    versao: versaoDinamica,
    ultima_sincronizacao: dataFormatada,
    mensagem: 'Autenticado com sucesso!'
  });
}

