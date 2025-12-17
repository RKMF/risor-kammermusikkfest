import type { MiddlewareHandler } from 'astro';

/**
 * Security Middleware
 *
 * Applies Content Security Policy and security headers globally.
 * CSP is relaxed in development for Visual Editing compatibility.
 */

const isDevelopment = import.meta.env.DEV;

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

  return modifiedResponse;
};
