import { NextResponse } from 'next/server';
import { fetchLiveTRM } from '@/lib/trm';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const force = searchParams.get('refresh') === '1';
  const trm = await fetchLiveTRM(force);
  return NextResponse.json({
    success: true,
    trm: trm.rate,
    rate: trm.rate,
    source: trm.source,
    updatedAt: trm.updatedAt,
    pair: 'USD/COP',
    note: 'TRM automática actualizada en vivo (referencia Google).',
    deliveryEstimate: '12 a 15 días hábiles',
  });
}
