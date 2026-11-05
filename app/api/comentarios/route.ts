import { NextResponse } from 'next/server';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ponto_id, primeiro_verso, nome_usuario, mensagem } = body;

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
        return NextResponse.json({ error: 'Falha na gravação da planilha.' }, { status: 502 });
      }

      return NextResponse.json({ success: true, message: 'Sugestão gravada na planilha com sucesso!' });
    } catch (error) {
      return NextResponse.json({ error: 'Erro ao enviar comentário.' }, { status: 500 });
    }
  }
