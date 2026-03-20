/**
 * Dynamic Sitemap Generator
 *
 * Generates a sitemap.xml by fetching all published content from Sanity.
 * Required for SSR sites where @astrojs/sitemap only captures pre-rendered pages.
 */

import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';

const SITE_URL = import.meta.env.SITE_URL || 'https://kammermusikkfest.no';

// Fetch only URLs that should be indexed.
const SITEMAP_QUERY = `{
  "homepage": *[
    _type == "homepage"
    && (!defined(seo.indexingStatus) || seo.indexingStatus != "noindex")
  ][0]{
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
  "events": *[_type == "event" && defined(slug_no.current)] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt,
    "indexingStatus": seo.indexingStatus
  },
  "artists": *[_type == "artist" && defined(slug_no.current)] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt,
    "indexingStatus": seo.indexingStatus
  },
  "articles": *[_type == "article" && defined(slug_no.current)] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt,
    "indexingStatus": seo.indexingStatus
  },
  "pages": *[_type == "page" && defined(slug_no.current)] {
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
  indexingStatus?: 'index' | 'noindex';
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

function generateUrlEntry(loc: string, lastmod: string, priority: string, changefreq: string): string {
  return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

export const GET: APIRoute = async () => {
  try {
    const data = await sanityClient.fetch<SitemapData>(SITEMAP_QUERY);

    const urls: string[] = [];

    // Indexable singleton and listing pages
    if (data.homepage) {
      const lastmod = formatDate(data.homepage._updatedAt);
      urls.push(generateUrlEntry(`${SITE_URL}/`, lastmod, '1.0', 'daily'));
      urls.push(generateUrlEntry(`${SITE_URL}/en`, lastmod, '1.0', 'daily'));
    }
    if (data.programPage) {
      const lastmod = formatDate(data.programPage._updatedAt);
      urls.push(generateUrlEntry(`${SITE_URL}/program`, lastmod, '0.9', 'daily'));
      urls.push(generateUrlEntry(`${SITE_URL}/en/program`, lastmod, '0.9', 'daily'));
    }
    if (data.artistPage) {
      const lastmod = formatDate(data.artistPage._updatedAt);
      urls.push(generateUrlEntry(`${SITE_URL}/artister`, lastmod, '0.8', 'weekly'));
      urls.push(generateUrlEntry(`${SITE_URL}/en/artists`, lastmod, '0.8', 'weekly'));
    }
    if (data.articlePage) {
      const lastmod = formatDate(data.articlePage._updatedAt);
      urls.push(generateUrlEntry(`${SITE_URL}/artikler`, lastmod, '0.7', 'weekly'));
      urls.push(generateUrlEntry(`${SITE_URL}/en/articles`, lastmod, '0.7', 'weekly'));
    }
    if (data.sponsorPage) {
      const lastmod = formatDate(data.sponsorPage._updatedAt);
      urls.push(generateUrlEntry(`${SITE_URL}/sponsorer`, lastmod, '0.5', 'monthly'));
      urls.push(generateUrlEntry(`${SITE_URL}/en/sponsors`, lastmod, '0.5', 'monthly'));
    }

    // Events - high priority (main content)
    for (const event of data.events || []) {
      if (event.indexingStatus === 'noindex') continue;
      if (event.slug_no) {
        urls.push(generateUrlEntry(
          `${SITE_URL}/program/${event.slug_no}`,
          formatDate(event._updatedAt),
          '0.8',
          'weekly'
        ));
      }
      if (event.slug_en) {
        urls.push(generateUrlEntry(
          `${SITE_URL}/en/program/${event.slug_en}`,
          formatDate(event._updatedAt),
          '0.8',
          'weekly'
        ));
      }
    }

    // Artists
    for (const artist of data.artists || []) {
      if (artist.indexingStatus === 'noindex') continue;
      if (artist.slug_no) {
        urls.push(generateUrlEntry(
          `${SITE_URL}/artister/${artist.slug_no}`,
          formatDate(artist._updatedAt),
          '0.7',
          'monthly'
        ));
      }
      if (artist.slug_en) {
        urls.push(generateUrlEntry(
          `${SITE_URL}/en/artists/${artist.slug_en}`,
          formatDate(artist._updatedAt),
          '0.7',
          'monthly'
        ));
      }
    }

    // Articles
    for (const article of data.articles || []) {
      if (article.indexingStatus === 'noindex') continue;
      if (article.slug_no) {
        urls.push(generateUrlEntry(
          `${SITE_URL}/artikler/${article.slug_no}`,
          formatDate(article._updatedAt),
          '0.6',
          'monthly'
        ));
      }
      if (article.slug_en) {
        urls.push(generateUrlEntry(
          `${SITE_URL}/en/articles/${article.slug_en}`,
          formatDate(article._updatedAt),
          '0.6',
          'monthly'
        ));
      }
    }

    // Generic pages
    for (const page of data.pages || []) {
      if (page.indexingStatus === 'noindex') continue;
      if (page.slug_no) {
        urls.push(generateUrlEntry(
          `${SITE_URL}/${page.slug_no}`,
          formatDate(page._updatedAt),
          '0.5',
          'monthly'
        ));
      }
      if (page.slug_en) {
        urls.push(generateUrlEntry(
          `${SITE_URL}/en/${page.slug_en}`,
          formatDate(page._updatedAt),
          '0.5',
          'monthly'
        ));
      }
    }

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls.join('\n')}
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    // Return a minimal sitemap on error
    const fallbackSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${SITE_URL}/</loc>
    <priority>1.0</priority>
  </url>
</urlset>`;

    return new Response(fallbackSitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  }
};
