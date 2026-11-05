import { NextResponse } from 'next/server';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';

// Buscar comentários (para o painel do administrador)
export async function GET(request: Request) {
  try {
    const res = await fetch(`${GOOGLE_SHEET_URL}?aba=comentarios`, { next: { revalidate: 0 } });
    if (!res.ok) {
      return NextResponse.json({ comentarios: [] });
    }
    const data = await res.json();
    return NextResponse.json({ comentarios: data.comentarios || [] });
  } catch {
    return NextResponse.json({ comentarios: [] });
  }
}

// Gravar ou Atualizar status de comentário
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, linha_id, ponto_id, primeiro_verso, nome_usuario, mensagem, status } = body;

    if (tipo === 'atender_comentario') {
      const resp = await fetch(GOOGLE_SHEET_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'atender_comentario',
          linha_id,
          status: status || 'Atendido'
        })
      });
      return NextResponse.json({ success: true, message: 'Comentário marcado como atendido!' });
    }

    if (!nome_usuario || !mensagem) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const resp = await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'comentario',
        ponto_id: ponto_id || '',
        primeiro_verso: primeiro_verso || '',
        nome_usuario: nome_usuario.trim(),
        mensagem: mensagem.trim()
      })
    });

    if (!resp.ok) {
      return NextResponse.json({ error: 'Falha na gravação.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, message: 'Comentário enviado com sucesso!' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao processar comentário.' }, { status: 500 });
  }
}
