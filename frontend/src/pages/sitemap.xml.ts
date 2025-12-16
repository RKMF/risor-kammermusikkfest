/**
 * Dynamic Sitemap Generator
 *
 * Generates a sitemap.xml by fetching all published content from Sanity.
 * Required for SSR sites where @astrojs/sitemap only captures pre-rendered pages.
 */

import type { APIRoute } from 'astro';
import { sanityClient } from 'sanity:client';

const SITE_URL = import.meta.env.SITE_URL || 'https://kammermusikkfest.no';

// GROQ query to fetch all published content with slugs
const SITEMAP_QUERY = `{
  "events": *[_type == "event" && defined(slug_no.current)] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt
  },
  "artists": *[_type == "artist" && defined(slug_no.current)] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt
  },
  "articles": *[_type == "article" && defined(slug_no.current)] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt
  },
  "pages": *[_type == "page" && defined(slug_no.current)] {
    "slug_no": slug_no.current,
    "slug_en": slug_en.current,
    "_updatedAt": _updatedAt
  }
}`;

interface SitemapItem {
  slug_no?: string;
  slug_en?: string;
  _updatedAt?: string;
}

interface SitemapData {
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

    // Static pages - highest priority
    urls.push(generateUrlEntry(`${SITE_URL}/`, formatDate(), '1.0', 'daily'));
    urls.push(generateUrlEntry(`${SITE_URL}/en`, formatDate(), '1.0', 'daily'));
    urls.push(generateUrlEntry(`${SITE_URL}/program`, formatDate(), '0.9', 'daily'));
    urls.push(generateUrlEntry(`${SITE_URL}/en/program`, formatDate(), '0.9', 'daily'));
    urls.push(generateUrlEntry(`${SITE_URL}/artister`, formatDate(), '0.8', 'weekly'));
    urls.push(generateUrlEntry(`${SITE_URL}/en/artists`, formatDate(), '0.8', 'weekly'));
    urls.push(generateUrlEntry(`${SITE_URL}/artikler`, formatDate(), '0.7', 'weekly'));
    urls.push(generateUrlEntry(`${SITE_URL}/en/articles`, formatDate(), '0.7', 'weekly'));

    // Events - high priority (main content)
    for (const event of data.events || []) {
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
