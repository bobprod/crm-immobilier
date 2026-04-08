import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';

  // Domaines à ignorer (app principal SaaS)
  const mainDomains = [
    'localhost:3002',
    'localhost:3000',
    process.env.NEXT_PUBLIC_APP_DOMAIN || 'app.crm-immo.com',
  ];

  const isMainDomain = mainDomains.some(
    (d) => hostname === d || hostname.endsWith('.' + d.split(':')[0]),
  );

  if (isMainDomain) {
    // Routes SaaS normales - ne pas toucher
    return NextResponse.next();
  }

  // Extraire le slug depuis le sous-domaine ou chemin /sites/[slug]
  let slug: string | null = null;

  // Cas 1 : Sous-domaine dynamique -> firstimmo.crm-immo.com
  const subdomain = hostname.split('.')[0];
  if (hostname.includes('.') && !isMainDomain && subdomain !== 'www') {
    slug = subdomain;
  }

  // Cas 2 : Path-based -> /sites/firstimmo (déjà géré par Next.js routing)
  if (!slug && url.pathname.startsWith('/sites/')) {
    return NextResponse.next();
  }

  // Si on a un slug valide depuis sous-domaine, rewrite vers /sites/[slug]
  if (slug) {
    // Préserver le path complet
    const newPath = `/sites/${slug}${url.pathname === '/' ? '' : url.pathname}`;
    url.pathname = newPath;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Appliquer sur toutes les routes sauf les ressources statiques et API internes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
};

