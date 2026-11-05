import { NextResponse } from 'next/server';
import { getPontos, Ponto } from '@/lib/db';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';

// Cache em memória para resposta instantânea
let cachePontos: Ponto[] | null = null;
let lastFetch = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minuto de cache

async function fetchFromSheets(): Promise<Ponto[]> {
  const now = Date.now();
  if (cachePontos && (now - lastFetch < CACHE_TTL_MS)) {
    return cachePontos;
  }

  try {
    const res = await fetch(GOOGLE_SHEET_URL, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.pontos) && data.pontos.length > 0) {
        cachePontos = data.pontos;
        lastFetch = now;
        return cachePontos;
      }
    }
  } catch (e) {
    console.error('Falha ao ler do Google Sheets, usando base local:', e);
  }

  // Fallback para os dados locais se o Google demorar
  return getPontos();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const linha = searchParams.get('linha');
  const busca = searchParams.get('busca')?.toLowerCase().trim();
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '3000');

  let pontos = await fetchFromSheets();

  if (linha && linha !== 'Todas') {
    pontos = pontos.filter(p => p.linha.toLowerCase() === linha.toLowerCase());
  }

  if (busca) {
    pontos = pontos.filter(p =>
      p.letra.toLowerCase().includes(busca) ||
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
