import { NextResponse } from 'next/server';
import { getPontos, savePontos, getPendentes, savePendentes, getComentarios, saveComentarios, Ponto } from '@/lib/db';

const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'umbanda2026';

function isAuthed(req: Request) {
  const authHeader = req.headers.get('authorization');
  return authHeader === `Bearer ${ADMIN_TOKEN}`;
}

export async function GET(request: Request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  return NextResponse.json({
    totalPontos: getPontos().length,
    pendentes: getPendentes(),
    comentarios: getComentarios()
  });
}

export async function POST(request: Request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  }

  const { action, payload } = await request.json();

  if (action === 'aprovar_pendente') {
    const pendentes = getPendentes();
    const pontos = getPontos();
    const pendente = pendentes.find(p => p.id === payload.id);
    if (!pendente) return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });

    const novoPonto: Ponto = {
      id: `pt-${Date.now()}`,
      linha: pendente.linha,
      titulo: pendente.titulo || '',
      letra: pendente.letra,
      origem: `Colaboração de ${pendente.nome_usuario}`,
      video_url: pendente.video_url || '',
      autor: pendente.autor || ''
    };

    pontos.unshift(novoPonto);
    savePontos(pontos);

    const pendentesAtualizados = pendentes.filter(p => p.id !== payload.id);
    savePendentes(pendentesAtualizados);

    return NextResponse.json({ success: true, message: 'Ponto aprovado e incorporado ao acervo!' });
  }

  if (action === 'rejeitar_pendente') {
    const pendentes = getPendentes().filter(p => p.id !== payload.id);
    savePendentes(pendentes);
    return NextResponse.json({ success: true, message: 'Item rejeitado.' });
  }

  if (action === 'editar_ponto') {
    const pontos = getPontos();
    const idx = pontos.findIndex(p => p.id === payload.id);
    if (idx === -1) return NextResponse.json({ error: 'Ponto não encontrado.' }, { status: 404 });

    pontos[idx] = {
      ...pontos[idx],
      linha: payload.linha,
      toque: payload.toque,
      letra: payload.letra,
      video_url: payload.video_url
    };
    savePontos(pontos);
    return NextResponse.json({ success: true, message: 'Ponto atualizado com sucesso!' });
  }

  if (action === 'resolver_comentario') {
    const comentarios = getComentarios().filter(c => c.id !== payload.id);
    saveComentarios(comentarios);
    return NextResponse.json({ success: true, message: 'Comentário arquivado.' });
  }

  return NextResponse.json({ error: 'Ação desconhecida.' }, { status: 400 });
}

