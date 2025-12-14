import type { APIRoute } from 'astro';

/**
 * Validates that a URL is safe to redirect to (same-origin or relative path)
 */
function isValidRedirectUrl(targetUrl: string, requestUrl: URL): boolean {
  // Allow relative paths
  if (targetUrl.startsWith('/') && !targetUrl.startsWith('//')) {
    return true;
  }

  // Check if absolute URL is same origin
  try {
    const target = new URL(targetUrl, requestUrl.origin);
    return target.origin === requestUrl.origin;
  } catch {
    return false;
  }
}

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  // Enable draft mode by setting a cookie
  cookies.set('sanity-preview-mode', 'true', {
    httpOnly: true,
    secure: import.meta.env.PROD,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  // Validate and redirect to the preview URL or homepage
  const requestedUrl = url.searchParams.get('url') || '/';
  const previewUrl = isValidRedirectUrl(requestedUrl, url) ? requestedUrl : '/';

  return redirect(previewUrl);
};

export const POST = GET;