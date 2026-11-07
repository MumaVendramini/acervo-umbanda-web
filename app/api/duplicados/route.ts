import { NextResponse } from 'next/server';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';

function normalizar(txt: string) {
  return (txt || '').toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);
}

// Retorna os pares semelhantes detectados no acervo
export async function GET() {
  try {
    const res = await fetch(`${GOOGLE_SHEET_URL}?aba=acervo`, { cache: 'no-store' });
    if (!res.ok) {
      return NextResponse.json({ duplicados: [] });
    }
    const data = await res.json();
    const pontos = data.pontos || [];

    const index = pontos.map((p: any, idx: number) => ({
      idx: idx + 2, // linha física na planilha
      id: p.id,
      linha: p.linha,
      toque: p.toque,
      letra: p.letra,
      words: new Set(normalizar(p.letra)),
      arrWords: normalizar(p.letra)
    }));

    const pares: any[] = [];

    for (let i = 0; i < index.length; i++) {
      const a = index[i];
      if (a.arrWords.length < 3) continue;

      for (let j = i + 1; j < index.length; j++) {
        const b = index[j];
        if (b.arrWords.length < 3) continue;

        let matchA = 0;
        for (const w of a.arrWords) {
          if (b.words.has(w)) matchA++;
        }
        let matchB = 0;
        for (const w of b.arrWords) {
          if (a.words.has(w)) matchB++;
        }

        const simA = matchA / a.arrWords.length;
        const simB = matchB / b.arrWords.length;
        const mediaSim = (simA + simB) / 2;

        if (mediaSim >= 0.75) {
          pares.push({
            id_par: `${a.id}_${b.id}`,
            sim: Math.round(mediaSim * 100),
            pontoA: {
              id: a.id,
              linha: a.linha,
              toque: a.toque,
              linha_sheet: a.idx,
              letra: a.letra
            },
            pontoB: {
              id: b.id,
              linha: b.linha,
              toque: b.toque,
              linha_sheet: b.idx,
              letra: b.letra
            }
          });
        }
      }
    }

    // Ordena pelos mais idênticos (100% primeiro)
    pares.sort((x, y) => y.sim - x.sim);

    return NextResponse.json({
      total_pontos: pontos.length,
      total_pares: pares.length,
      pares: pares.slice(0, 100) // Traz os 100 primeiros mais urgentes
    });
  } catch (error) {
    return NextResponse.json({ duplicados: [], error: 'Falha ao buscar duplicados.' }, { status: 500 });
  }
}

// Exclui a cantiga indesejada diretamente da planilha
export async function POST(request: Request) {
  try {
    const { ponto_id, linha_sheet } = await request.json();

    const resp = await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'excluir_ponto',
        ponto_id: ponto_id,
        linha_sheet: linha_sheet
      })
    });

    if (resp.ok) {
      return NextResponse.json({ success: true, message: 'Ponto excluído com sucesso da planilha.' });
    }
    return NextResponse.json({ error: 'Erro ao excluir da planilha.' }, { status: 500 });
  } catch {
    return NextResponse.json({ error: 'Erro de conexão.' }, { status: 500 });
  }
}

