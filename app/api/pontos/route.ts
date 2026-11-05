import { NextResponse } from 'next/server';
import { getPontos } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const linha = searchParams.get('linha');
  const busca = searchParams.get('busca')?.toLowerCase().trim();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');

  let pontos = getPontos();

  if (linha && linha !== 'Todas') {
    pontos = pontos.filter(p => p.linha.toLowerCase() === linha.toLowerCase());
  }

  if (busca) {
    pontos = pontos.filter(p => 
      p.letra.toLowerCase().includes(busca) ||
      (p.titulo && p.titulo.toLowerCase().includes(busca)) ||
      (p.toque && p.toque.toLowerCase().includes(busca))
    );
  }

  const total = pontos.length;
  const start = (page - 1) * limit;
  const paginados = pontos.slice(start, start + limit);

  return NextResponse.json({
    total,
    page,
    totalPages: Math.ceil(total / limit),
    pontos: paginados
  });
}

