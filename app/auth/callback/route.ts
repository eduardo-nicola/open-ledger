import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const DEFAULT_POST_AUTH_PATH = '/profile'

/** Paths relativos ao origin apenas (evita open redirect via `//host` ou URLs absolutas). */
const safeRelativeNextPath = (raw: string | null): string => {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
    return DEFAULT_POST_AUTH_PATH
  }
  return raw
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = safeRelativeNextPath(searchParams.get('next'))

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
