import { NextResponse } from 'next/server';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const linha = searchParams.get('linha');
  const busca = searchParams.get('busca')?.toLowerCase().trim();

  try {
    const res = await fetch(GOOGLE_SHEET_URL, { 
      next: { revalidate: 15 },
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) {
      return NextResponse.json({ error: 'Erro ao conectar à planilha Google' }, { status: 502 });
    }

    const data = await res.json();
    let pontos = Array.isArray(data.pontos) ? data.pontos : [];
    const versaoPlanilha = data.versao || null;

    // Filtro de Linha
    if (linha && linha !== 'Todas') {
      pontos = pontos.filter((p: any) => p.linha === linha);
    }

    // Filtro de Busca
    if (busca) {
      pontos = pontos.filter((p: any) =>
        (p.letra && p.letra.toLowerCase().includes(busca)) ||
        (p.toque && p.toque.toLowerCase().includes(busca))
      );
    }

    return NextResponse.json({
      total: pontos.length,
      versao: versaoPlanilha,
      pontos
    });
  } catch (error) {
    return NextResponse.json({ error: 'Falha ao buscar cantigas da planilha' }, { status: 500 });
  }
}
