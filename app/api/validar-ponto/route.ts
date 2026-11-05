import { NextResponse } from 'next/server';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'umbanda2026';
const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';

export async function POST(request: Request) {
  try {
    const { ponto_id, token, nome_curador, video_url } = await request.json();

    if (token !== ADMIN_TOKEN) {
      return NextResponse.json({ error: 'Senha de curador incorreta.' }, { status: 401 });
    }

    if (!ponto_id) {
      return NextResponse.json({ error: 'ID do ponto não informado.' }, { status: 400 });
    }

    // Grava na planilha Google Sheets via Apps Script
    const resp = await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'validar_ponto',
        ponto_id,
        curador: nome_curador?.trim() || 'Curador',
        video_url: video_url?.trim() || ''
      })
    });

    if (!resp.ok) {
      return NextResponse.json({ error: 'Falha ao registrar validação na planilha.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Cantiga validada com sucesso!' });
  } catch {
    return NextResponse.json({ error: 'Erro de conexão ao validar cantiga.' }, { status: 500 });
  }
}

