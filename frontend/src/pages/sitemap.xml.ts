/**
 * Dynamic Sitemap Generator
 *
 * Generates a sitemap.xml by fetching all published content from Sanity.
 * Required for SSR sites where @astrojs/sitemap only captures pre-rendered pages.
 */

import type { APIRoute } from 'astro';
import { cachedSanityFetch } from '../lib/sanity/cachedFetch';
import { getSiteUrl } from '../lib/site';

// Keep this predicate aligned with the public Sanity perspective. The sitemap
// must never advertise draft, staging-only, expired, or noindex content.
const PUBLIC_INDEXABLE_FILTER = `(
  (
    publishingStatus == "published" ||
    !defined(publishingStatus) ||
    (
      publishingStatus == "scheduled" &&
      defined(scheduledPeriod.startDate) &&
      defined(scheduledPeriod.endDate) &&
      scheduledPeriod.startDate <= now() &&
      scheduledPeriod.endDate >= now()
    )
  ) &&
  (!defined(seo.indexingStatus) || seo.indexingStatus != "noindex")
)`;

export const SITEMAP_QUERY = `{
  "homepage": *[
    _type == "homepage" &&
    (!defined(seo.indexingStatus) || seo.indexingStatus != "noindex") &&
    (
      homePageType == "default" ||
      (
        homePageType == "scheduled" &&
        defined(scheduledPeriod.startDate) &&
        defined(scheduledPeriod.endDate) &&
        scheduledPeriod.startDate <= now() &&
        scheduledPeriod.endDate >= now()
      )
    )
  ] | order(
    select(homePageType == "scheduled" => 0, 1) asc,
    scheduledPeriod.startDate desc,
    _updatedAt desc
  )[0]{
    "_updatedAt": _updatedAt
  },
  "programPage": *[
    _type == "programPage"
    && (!defined(seo.indexingStatus) || seo.indexingStatus != "noindex")
  ][0]{
    "_updatedAt": _updatedAt
  },
  "artistPage": *[
    _type == "artistPage"
    && (!defined(seo.indexingStatus) || seo.indexingStatus != "noindex")
  ][0]{
    "_updatedAt": _updatedAt
  },
  "articlePage": *[
    _type == "articlePage"
    && (!defined(seo.indexingStatus) || seo.indexingStatus != "noindex")
  ][0]{
    "_updatedAt": _updatedAt
  },
  "sponsorPage": *[
    _type == "sponsorPage"
    && (!defined(seo.indexingStatus) || seo.indexingStatus != "noindex")
  ][0]{
    "_updatedAt": _updatedAt
  },
  "events": *[_type == "event" && ${PUBLIC_INDEXABLE_FILTER} && (defined(slug_no.current) || defined(slug_en.current))] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt,
    "indexingStatus": seo.indexingStatus
  },
  "artists": *[_type == "artist" && ${PUBLIC_INDEXABLE_FILTER} && (defined(slug_no.current) || defined(slug_en.current))] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt,
    "indexingStatus": seo.indexingStatus
  },
  "articles": *[_type == "article" && ${PUBLIC_INDEXABLE_FILTER} && (defined(slug_no.current) || defined(slug_en.current))] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt,
    "indexingStatus": seo.indexingStatus
  },
  "pages": *[_type == "page" && ${PUBLIC_INDEXABLE_FILTER} && (defined(slug_no.current) || defined(slug_en.current))] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt,
    "indexingStatus": seo.indexingStatus
  }
}`;

interface SitemapItem {
  slug_no?: string;
  slug_en?: string;
  _updatedAt?: string;
}

interface SitemapData {
  homepage?: { _updatedAt?: string };
  programPage?: { _updatedAt?: string };
  artistPage?: { _updatedAt?: string };
  articlePage?: { _updatedAt?: string };
  sponsorPage?: { _updatedAt?: string };
  events: SitemapItem[];
  artists: SitemapItem[];
  articles: SitemapItem[];
  pages: SitemapItem[];
}

function formatDate(dateString?: string): string {
  if (!dateString) return new Date().toISOString().split('T')[0];
  return new Date(dateString).toISOString().split('T')[0];
}

function escapeXml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export function generateUrlEntry(loc: string, lastmod: string): string {
  return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${escapeXml(lastmod)}</lastmod>
  </url>`;
}

export function buildSitemapXml(urls: string[]): string {
  const uniqueUrls = [...new Set(urls)];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueUrls.join('\n')}
</urlset>`;
}

export const GET: APIRoute = async () => {
  try {
    const SITE_URL = getSiteUrl();
    const data = await cachedSanityFetch<SitemapData>('sitemap', SITEMAP_QUERY);

    const urls: string[] = [];
    const addUrl = (url: string) => urls.push(url);

    // Indexable singleton and listing pages
    if (data.homepage) {
      const lastmod = formatDate(data.homepage._updatedAt);
      addUrl(generateUrlEntry(`${SITE_URL}/`, lastmod));
      addUrl(generateUrlEntry(`${SITE_URL}/en`, lastmod));
    }
    if (data.programPage) {
      const lastmod = formatDate(data.programPage._updatedAt);
      addUrl(generateUrlEntry(`${SITE_URL}/program`, lastmod));
      addUrl(generateUrlEntry(`${SITE_URL}/en/program`, lastmod));
    }
    if (data.artistPage) {
      const lastmod = formatDate(data.artistPage._updatedAt);
      addUrl(generateUrlEntry(`${SITE_URL}/artister`, lastmod));
      addUrl(generateUrlEntry(`${SITE_URL}/en/artists`, lastmod));
    }
    if (data.articlePage) {
      const lastmod = formatDate(data.articlePage._updatedAt);
      addUrl(generateUrlEntry(`${SITE_URL}/artikler`, lastmod));
      addUrl(generateUrlEntry(`${SITE_URL}/en/articles`, lastmod));
    }
    if (data.sponsorPage) {
      const lastmod = formatDate(data.sponsorPage._updatedAt);
      addUrl(generateUrlEntry(`${SITE_URL}/sponsorer`, lastmod));
      addUrl(generateUrlEntry(`${SITE_URL}/en/sponsors`, lastmod));
    }

    // Events - main content
    for (const event of data.events || []) {
      if (event.slug_no) {
        addUrl(generateUrlEntry(`${SITE_URL}/program/${event.slug_no}`, formatDate(event._updatedAt)));
      }
      if (event.slug_en) {
        addUrl(generateUrlEntry(`${SITE_URL}/en/program/${event.slug_en}`, formatDate(event._updatedAt)));
      }
    }

    // Artists
    for (const artist of data.artists || []) {
      if (artist.slug_no) {
        addUrl(generateUrlEntry(`${SITE_URL}/artister/${artist.slug_no}`, formatDate(artist._updatedAt)));
      }
      if (artist.slug_en) {
        addUrl(generateUrlEntry(`${SITE_URL}/en/artists/${artist.slug_en}`, formatDate(artist._updatedAt)));
      }
    }

    // Articles
    for (const article of data.articles || []) {
      if (article.slug_no) {
        addUrl(generateUrlEntry(`${SITE_URL}/artikler/${article.slug_no}`, formatDate(article._updatedAt)));
      }
      if (article.slug_en) {
        addUrl(generateUrlEntry(`${SITE_URL}/en/articles/${article.slug_en}`, formatDate(article._updatedAt)));
      }
    }

    // Generic pages
    for (const page of data.pages || []) {
      if (page.slug_no) {
        addUrl(generateUrlEntry(`${SITE_URL}/${page.slug_no}`, formatDate(page._updatedAt)));
      }
      if (page.slug_en) {
        addUrl(generateUrlEntry(`${SITE_URL}/en/${page.slug_en}`, formatDate(page._updatedAt)));
      }
    }

    const sitemap = buildSitemapXml(urls);

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return new Response(null, {
      status: 503,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'no-store',
        'Retry-After': '300',
      },
    });
  }
};
