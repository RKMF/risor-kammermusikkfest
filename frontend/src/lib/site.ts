const DEFAULT_PRODUCTION_SITE_URL = 'https://kammermusikkfest.no';

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, '');
}

export function getSiteUrl(request?: Request): string {
  const configuredUrl =
    import.meta.env.SITE_URL ||
    import.meta.env.PUBLIC_SITE_URL ||
    DEFAULT_PRODUCTION_SITE_URL;

  const normalizedConfiguredUrl = normalizeOrigin(configuredUrl);

  if (import.meta.env.PROD) {
    return normalizedConfiguredUrl;
  }

  if (request) {
    return normalizeOrigin(new URL(request.url).origin);
  }

  return normalizedConfiguredUrl;
}

export function getAbsoluteUrl(pathname: string, request?: Request): string {
  return new URL(pathname, `${getSiteUrl(request)}/`).href;
}
