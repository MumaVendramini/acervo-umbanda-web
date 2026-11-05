import { NextResponse } from 'next/server';
import { getPendentes, savePendentes, PontoPendente } from '@/lib/db';

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { linha, titulo, letra, autor, video_url, nome_usuario } = body;

    if (!linha || !letra || !nome_usuario) {
      return NextResponse.json({ error: 'Linha, Letra e Nome do Usuário são obrigatórios.' }, { status: 400 });
    }

    if (video_url && !YOUTUBE_REGEX.test(video_url.trim())) {
      return NextResponse.json({ error: 'O link de vídeo informado deve ser exclusivamente do YouTube.' }, { status: 400 });
    }

    const pendentes = getPendentes();
    const novoPendente: PontoPendente = {
      id: `pend-${Date.now()}`,
      linha: linha.trim(),
      titulo: titulo ? titulo.trim() : '',
      letra: letra.trim(),
      autor: autor ? autor.trim() : '',
      video_url: video_url ? video_url.trim() : '',
      nome_usuario: nome_usuario.trim(),
      data_envio: new Date().toISOString(),
      status: 'pendente'
    };

    pendentes.push(novoPendente);
    savePendentes(pendentes);

    return NextResponse.json({ success: true, message: 'Ponto enviado para moderação com sucesso!' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar envio.' }, { status: 500 });
  }
}

