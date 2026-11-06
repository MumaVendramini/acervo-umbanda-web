import { NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'umbanda2026';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${ADMIN_TOKEN}`) {
    return NextResponse.json({ error: 'Senha incorreta.' }, { status: 401 });
  }

  return NextResponse.json({
    authed: true,
    mensagem: 'Autenticado com sucesso!'
  });
}

