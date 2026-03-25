import type { MiddlewareHandler } from 'astro';

/**
 * Security Middleware
 *
 * Applies Content Security Policy and security headers globally.
 * CSP is relaxed in development for Visual Editing compatibility.
 */

const isDevelopment = import.meta.env.DEV;
const isStagingSite = import.meta.env.PUBLIC_SITE_ENV === 'staging';
const PROBE_PATH_PREFIXES = ['/wp-admin', '/vendor', '/cgi-bin'] as const;
const PROBE_PATH_EXACT = new Set(['/wp-login.php', '/xmlrpc.php', '/.env']);
const GONE_PATHS = new Set([
  '/support',
  '/hjelp',
  '/bedrift',
  '/firma',
  '/stoette',
  '/kundesenter',
  '/kundeservice',
  '/kunde-service',
  '/kontakt-oss',
  '/finn-oss',
]);
const MISS_CACHE_CONTROL = 'public, s-maxage=60, stale-while-revalidate=300';
const DYNAMIC_DETAIL_ROUTE_PATTERNS = [
  /^\/[a-z0-9-]+$/,
  /^\/en\/[a-z0-9-]+$/,
  /^\/artikler\/[a-z0-9-]+$/,
  /^\/artister\/[a-z0-9-]+$/,
  /^\/program\/[a-z0-9-]+$/,
  /^\/en\/articles\/[a-z0-9-]+$/,
  /^\/en\/artists\/[a-z0-9-]+$/,
  /^\/en\/program\/[a-z0-9-]+$/,
];

export function isDynamicDetailRoutePath(pathname: string): boolean {
  return DYNAMIC_DETAIL_ROUTE_PATTERNS.some((pattern) => pattern.test(pathname));
}

export function buildMissHeaders(): HeadersInit {
  return {
    'Cache-Control': MISS_CACHE_CONTROL,
    'X-Robots-Tag': 'noindex, nofollow',
  };
}

export function getEarlyResponseStatus(pathname: string): 404 | 410 | null {
  if (GONE_PATHS.has(pathname)) {
    return 410;
  }

  if (
    PROBE_PATH_EXACT.has(pathname) ||
    pathname.startsWith('/.env.') ||
    pathname.endsWith('.php') ||
    PROBE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
  ) {
    return 404;
  }

  return null;
}

// Content Security Policy configuration
function getCSPDirectives(): string {
  if (isDevelopment) {
    // Relaxed CSP for development - allows Visual Editing
    return [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.sanity.io", // unsafe-eval needed for Visual Editing
      "style-src 'self' 'unsafe-inline'", // unsafe-inline needed for Astro scoped styles
      "img-src 'self' cdn.sanity.io data: blob:",
      "font-src 'self' data:",
      "connect-src 'self' *.sanity.io wss://*.sanity.io", // WebSocket for Visual Editing
      "frame-src 'self' http://localhost:3333 https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://open.spotify.com", // Allow embedding Studio in dev + video platforms + Spotify
      "frame-ancestors 'self' http://localhost:3333",
      "worker-src 'self' blob:",
    ].join('; ');
  }

  // Production CSP - secure defaults with necessary allowances for Astro
  // 'unsafe-inline' for scripts: Required because Astro inlines bundled scripts.
  // This is acceptable for content sites without user-generated content or auth.
  // If user input/auth is added later, consider nonces or script hashes.
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // unsafe-inline needed for Astro's bundled inline scripts
    "style-src 'self' 'unsafe-inline'", // unsafe-inline still needed for Astro scoped styles
    "img-src 'self' cdn.sanity.io data:",
    "font-src 'self' data:",
    "connect-src 'self' *.sanity.io",
    "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://player.vimeo.com https://open.spotify.com", // Allow video embeds + Spotify in production
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
  ].join('; ');
}

export const onRequest: MiddlewareHandler = async (context, next) => {
  const pathname = new URL(context.request.url).pathname.toLowerCase();
  const earlyResponseStatus = getEarlyResponseStatus(pathname);

  if (earlyResponseStatus) {
    return new Response(null, {
      status: earlyResponseStatus,
      headers: buildMissHeaders(),
    });
  }

  const response = await next();

  // Clone response to modify headers
  const modifiedResponse = new Response(response.body, response);

  // Add CSP header
  const csp = getCSPDirectives();
  modifiedResponse.headers.set('Content-Security-Policy', csp);

  // Add additional security headers (complementing API route headers)
  if (!modifiedResponse.headers.has('X-Content-Type-Options')) {
    modifiedResponse.headers.set('X-Content-Type-Options', 'nosniff');
  }
  if (!modifiedResponse.headers.has('X-Frame-Options')) {
    modifiedResponse.headers.set('X-Frame-Options', isDevelopment ? 'SAMEORIGIN' : 'DENY');
  }
  if (!modifiedResponse.headers.has('X-XSS-Protection')) {
    modifiedResponse.headers.set('X-XSS-Protection', '1; mode=block');
  }
  if (!modifiedResponse.headers.has('Referrer-Policy')) {
    modifiedResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  }
  if (!modifiedResponse.headers.has('Permissions-Policy')) {
    modifiedResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  }
  if (isStagingSite) {
    modifiedResponse.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');
  }
  if ((modifiedResponse.status === 404 || modifiedResponse.status === 410) && isDynamicDetailRoutePath(pathname)) {
    modifiedResponse.headers.set('Cache-Control', MISS_CACHE_CONTROL);
    if (!modifiedResponse.headers.has('X-Robots-Tag')) {
      modifiedResponse.headers.set('X-Robots-Tag', 'noindex, nofollow');
    }
  }

  return modifiedResponse;
};
