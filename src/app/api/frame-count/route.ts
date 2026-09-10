import { NextResponse } from 'next/server';
import { readdirSync } from 'fs';
import { join } from 'path';
import type { FrameCountResponse } from '@/types';

export function GET(): NextResponse<FrameCountResponse> {
  try {
    const framesDir = join(process.cwd(), 'public', 'frames');
    const files = readdirSync(framesDir).filter((f) => f.endsWith('.webp'));
    return NextResponse.json({ count: files.length });
  } catch {
    // Fallback if directory is unreadable
    return NextResponse.json({ count: 0 });
  }
}
