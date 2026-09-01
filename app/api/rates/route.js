import { NextResponse } from 'next/server';
import { getRatesForDistrict, upsertRate, RATE_MATERIALS } from '../../../lib/rates';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const district = searchParams.get('district');
  if (!district) return NextResponse.json({ error: 'district required' }, { status: 400 });
  const rates = getRatesForDistrict(district);
  return NextResponse.json({ rates, materials: RATE_MATERIALS });
}

export async function POST(req) {
  const body = await req.json();
  const { district, material, rate_inr } = body;
  if (!district || !material || rate_inr == null) {
    return NextResponse.json({ error: 'district, material and rate_inr are required' }, { status: 400 });
  }
  upsertRate(district, material, Number(rate_inr));
  const rates = getRatesForDistrict(district);
  return NextResponse.json({ rates });
}
