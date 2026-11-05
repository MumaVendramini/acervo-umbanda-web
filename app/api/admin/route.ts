import { NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'umbanda2026';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }

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
    authed: true,
    versao: versaoDinamica,
    ultima_sincronizacao: dataFormatada,
    mensagem: 'Autenticado com sucesso!'
  });
}

