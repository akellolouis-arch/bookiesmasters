import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Clear the cache for the entire site
  revalidatePath('/', 'layout');
  return NextResponse.json({ 
    revalidated: true, 
    message: "Global Next.js cache has been successfully wiped.",
    now: Date.now() 
  });
}
