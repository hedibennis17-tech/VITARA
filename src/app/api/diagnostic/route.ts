import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    env: {
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY ? `set (${process.env.ANTHROPIC_API_KEY.slice(0,8)}...)` : 'MISSING ❌',
      DATABASE_URL: !!process.env.DATABASE_URL ? 'set ✅' : 'missing (mode démo)',
      JWT_SECRET: !!process.env.JWT_SECRET ? 'set ✅' : 'using default',
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}
