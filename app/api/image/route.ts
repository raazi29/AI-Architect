import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  const src = req.nextUrl.searchParams.get('src')
  if (!src) {
    return new Response('Missing src', { status: 400 })
  }

  try {
    const upstream = await fetch(src, {
      // Forward basic headers to improve compatibility
      headers: {
        'User-Agent': req.headers.get('user-agent') || 'Mozilla/5.0',
        'Accept': req.headers.get('accept') || '*/*',
        'Referer': req.headers.get('referer') || ''
      },
      // No-cache at fetch layer; let CDN/browser handle
      cache: 'no-store',
    })

    if (!upstream.ok) {
      return new Response(`Upstream error: ${upstream.status}`, { status: 502 })
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg'
    const body = upstream.body
    if (!body) {
      return new Response('No body', { status: 502 })
    }

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        // Cache for 10 minutes in browser, 1 hour on CDN
        'Cache-Control': 'public, max-age=600, s-maxage=3600, stale-while-revalidate=300',
      },
    })
  } catch (e: any) {
    return new Response(`Proxy error: ${e?.message || 'unknown'}`, { status: 500 })
  }
}
