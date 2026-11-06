import { NextResponse } from 'next/server';

const GOOGLE_SHEET_URL = 'https://script.google.com/macros/s/AKfycbzK_Pm54RSvwbgWT9s5v7uU-6lZ2EJUhW3OzSTZ_yKHtHKeVJv_s7YyJpOBInSy6wFAlw/exec';

export async function GET() {
  try {
    const res = await fetch(`${GOOGLE_SHEET_URL}?aba=visitas`, {
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      const pv = Number(data.pageviews) || 0;
      const vu = Math.max(pv > 0 ? 1 : 0, Number(data.visitas_unicas) || 0);
      return NextResponse.json({
        visitas_unicas: vu,
        pageviews: pv
      });
    }
  } catch { }

  return NextResponse.json({
    visitas_unicas: 1,
    pageviews: 1
  });
}

export async function POST(request: Request) {
  try {
    const { is_nova_visita } = await request.json();

    const resp = await fetch(GOOGLE_SHEET_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: 'registrar_visita',
        is_nova_visita: !!is_nova_visita
      })
    });

    if (resp.ok) {
      const data = await resp.json();
      return NextResponse.json({
        success: true,
        visitas_unicas: data.visitas_unicas,
        pageviews: data.pageviews
      });
    }
  } catch { }

  return NextResponse.json({ success: true });
}

