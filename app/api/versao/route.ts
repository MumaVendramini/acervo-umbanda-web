import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    versao_sistemica: '202611051610',
    data_formatada: '05/11/2026 16:10',
    timestamp: Date.now()
  });
}
