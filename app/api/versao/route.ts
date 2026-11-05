import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    versao: 'v1.1-20261105',
    timestamp: Date.now()
  });
}

