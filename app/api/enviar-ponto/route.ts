import { NextResponse } from 'next/server';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

// Listar pontos sugeridos pendentes (para o painel do zelador)
export async function GET() {
  try {
    const res = await fetch(`${GOOGLE_SHEET_URL}?aba=pontos_enviados`, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ pontos_enviados: [] });
    }
    const data = await res.json();
    return NextResponse.json({ pontos_enviados: data.pontos_enviados || [] });
  } catch {
    return NextResponse.json({ pontos_enviados: [] });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, linha_id, linha, letra, autor, video_url, toque, nome_usuario } = body;

    // Ação do Zelador: Aprovar e mover para o Acervo
    if (tipo === 'aprovar_ponto_sugerido') {
      const resp = await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'aprovar_ponto_sugerido',
          linha_id,
          linha,
          toque: toque || '',
          letra,
          autor,
          video_url
        })
      });
      return NextResponse.json({ success: true, message: 'Ponto aprovado e integrado ao acervo!' });
    }

    // Ação do Zelador: Descartar ponto sugerido
    if (tipo === 'descartar_ponto_sugerido') {
      const resp = await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'descartar_ponto_sugerido',
          linha_id
        })
      });
      return NextResponse.json({ success: true, message: 'Ponto sugerido descartado.' });
    }

    if (!linha || !letra || !nome_usuario) {
      return NextResponse.json({ error: 'Linha, Letra e Nome são obrigatórios.' }, { status: 400 });
    }

    if (video_url && !YOUTUBE_REGEX.test(video_url.trim())) {
      return NextResponse.json({ error: 'O link deve ser exclusivamente do YouTube.' }, { status: 400 });
    }

    const resp = await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'novo_ponto',
        linha: linha.trim(),
        toque: toque ? toque.trim() : '',
        letra: letra.trim(),
        autor: autor ? autor.trim() : '',
        video_url: video_url ? video_url.trim() : '',
        nome_usuario: nome_usuario.trim()
      })
    });

    if (!resp.ok) {
      return NextResponse.json({ error: 'Falha na gravação.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Ponto enviado com sucesso!' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar envio.' }, { status: 500 });
  }
}
