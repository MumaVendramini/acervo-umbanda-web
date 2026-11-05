import { NextResponse } from 'next/server';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';
const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linha, letra, autor, video_url, nome_usuario } = body;

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
        letra: letra.trim(),
        autor: autor ? autor.trim() : '',
        video_url: video_url ? video_url.trim() : '',
        nome_usuario: nome_usuario.trim()
      })
    });

    if (!resp.ok) {
      return NextResponse.json({ error: 'Falha na gravação da planilha.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Ponto gravado na planilha para moderação!' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar envio.' }, { status: 500 });
  }
}
