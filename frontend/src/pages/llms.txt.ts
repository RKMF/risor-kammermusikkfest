import type { APIRoute } from 'astro';
import { sanityClient } from '../lib/sanity/client';
import { getOrSetCachedValue } from '../lib/serverCache';
import { getSiteUrl } from '../lib/site';

const LLMS_CACHE_KEY = 'route:llms.txt';
const LLMS_CACHE_TTL_SECONDS = 300;

const CURATED_PAGE_QUERY = `*[
  _type == "page" &&
  defined(slug_no.current) &&
  (
    slug_no.current in ["om-oss", "praktisk"] ||
    slug_en.current in ["about-us", "practical"]
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

function formatLink(path: string, label: string, description: string): string {
  return `- [${label}](${path}): ${description}`;
}

async function buildLlmsText(siteUrl: string): Promise<string> {
  let curatedPages: CuratedPageResult[] = [];

  try {
    curatedPages = await sanityClient.fetch<CuratedPageResult[]>(CURATED_PAGE_QUERY);
  } catch (error) {
    console.error('Failed to build llms.txt page list', error);
  }

  const curatedLinks: string[] = [];

  for (const page of curatedPages) {
    if (page.slug_en) {
      curatedLinks.push(
        formatLink(
          `/en/${page.slug_en}`,
          page.title_en || page.title_no || 'Page',
          'Additional festival information'
        )
      );
    }
    if (page.slug_no) {
      curatedLinks.push(
        formatLink(
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
    formatLink('/en', 'Home', 'English homepage'),
    formatLink('/', 'Forside', 'Norwegian homepage'),
    formatLink('/en/program', 'Program', 'English concert schedule and event listings'),
    formatLink('/program', 'Program', 'Norwegian concert schedule and event listings'),
    formatLink('/en/artists', 'Artists', 'English artist biographies and ensembles'),
    formatLink('/artister', 'Artister', 'Norwegian artist biographies and ensembles'),
    formatLink('/en/articles', 'Articles', 'English festival news and updates'),
    formatLink('/artikler', 'Artikler', 'Norwegian festival news and updates'),
    formatLink('/en/sponsors', 'Sponsors', 'English sponsor and partner information'),
    formatLink('/sponsorer', 'Sponsorer', 'Norwegian sponsor and partner information'),
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
    () => buildLlmsText(siteUrl)
  );

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
    },
  });
};
