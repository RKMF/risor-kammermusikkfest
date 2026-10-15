import type { APIRoute } from 'astro';
import { cachedSanityFetch } from '../lib/sanity/cachedFetch';
import { getOrSetCachedValue } from '../lib/serverCache';
import { getSiteUrl } from '../lib/site';

const LLMS_CACHE_KEY = 'route:llms.txt';
const LLMS_CACHE_TTL_SECONDS = 300;

export const CURATED_PAGE_QUERY = `*[
  _type == "page" &&
  defined(slug_no.current) &&
  (
    slug_no.current in ["om-oss", "praktisk"] ||
    slug_en.current in ["about-us", "practical"]
  ) &&
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
]{
  title_no,
  title_en,
  "slug_no": slug_no.current,
  "slug_en": slug_en.current
}`;

interface CuratedPageResult {
  title_no?: string;
  title_en?: string;
  slug_no?: string;
  slug_en?: string;
}

function formatLink(siteUrl: string, path: string, label: string, description: string): string {
  return `- [${label}](${new URL(path, `${siteUrl}/`).href}): ${description}`;
}

export function buildLlmsText(siteUrl: string, curatedPages: CuratedPageResult[] = []): string {
  const curatedLinks: string[] = [];

  for (const page of curatedPages) {
    if (page.slug_en) {
      curatedLinks.push(
        formatLink(
          siteUrl,
          `/en/${page.slug_en}`,
          page.title_en || page.title_no || 'Page',
          'Additional festival information'
        )
      );
    }
    if (page.slug_no) {
      curatedLinks.push(
        formatLink(
          siteUrl,
          `/${page.slug_no}`,
          page.title_no || page.title_en || 'Side',
          'Tilleggsinformasjon om festivalen'
        )
      );
    }
  }

  return [
    '# Risør Kammermusikkfest',
    '',
    '> Norway\'s premier chamber music festival held annually in Risør since 1991. Features world-class musicians performing classical and contemporary chamber music in intimate coastal settings.',
    '',
    '## Main Pages',
    formatLink(siteUrl, '/en', 'Home', 'English homepage'),
    formatLink(siteUrl, '/', 'Forside', 'Norwegian homepage'),
    formatLink(siteUrl, '/en/program', 'Program', 'English concert schedule and event listings'),
    formatLink(siteUrl, '/program', 'Program', 'Norwegian concert schedule and event listings'),
    formatLink(siteUrl, '/en/artists', 'Artists', 'English artist biographies and ensembles'),
    formatLink(siteUrl, '/artister', 'Artister', 'Norwegian artist biographies and ensembles'),
    formatLink(siteUrl, '/en/articles', 'Articles', 'English festival news and updates'),
    formatLink(siteUrl, '/artikler', 'Artikler', 'Norwegian festival news and updates'),
    formatLink(siteUrl, '/en/sponsors', 'Sponsors', 'English sponsor and partner information'),
    formatLink(siteUrl, '/sponsorer', 'Sponsorer', 'Norwegian sponsor and partner information'),
    ...(curatedLinks.length > 0 ? ['', '## Additional Pages', ...curatedLinks] : []),
    '',
    '## Notes',
    `- Canonical site: ${siteUrl}`,
    '- Norwegian is the source language.',
    '- English pages mirror the same public festival structure where translations exist.',
    '',
  ].join('\n');
}

export const GET: APIRoute = async () => {
  const siteUrl = getSiteUrl();
  const body = await getOrSetCachedValue(
    `${LLMS_CACHE_KEY}:${siteUrl}`,
    LLMS_CACHE_TTL_SECONDS,
    async () => {
      try {
        const curatedPages = await cachedSanityFetch<CuratedPageResult[]>(
          'llms-pages',
          CURATED_PAGE_QUERY
        );
        return buildLlmsText(siteUrl, curatedPages);
      } catch (error) {
        console.error('Failed to build llms.txt page list', error);
        return buildLlmsText(siteUrl);
      }
    }
  );

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
};
