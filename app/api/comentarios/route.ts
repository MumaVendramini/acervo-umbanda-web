import { NextResponse } from 'next/server';
import { getComentarios, saveComentarios, Comentario } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ponto_id, primeiro_verso, nome_usuario, mensagem } = body;

    if (!ponto_id || !nome_usuario || !mensagem) {
      return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
    }

    const comentarios = getComentarios();
    const novo: Comentario = {
      id: `com-${Date.now()}`,
      ponto_id,
      primeiro_verso: primeiro_verso || '',
      nome_usuario: nome_usuario.trim(),
      mensagem: mensagem.trim(),
      data_envio: new Date().toISOString(),
      status: 'pendente'
    };

    comentarios.push(novo);
    saveComentarios(comentarios);

    return NextResponse.json({ success: true, message: 'Comentário/sugestão enviada com sucesso!' });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao enviar comentário.' }, { status: 500 });
  }
}

