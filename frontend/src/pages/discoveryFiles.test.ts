import { describe, expect, it } from 'vitest';
import { buildLlmsText, CURATED_PAGE_QUERY } from './llms.txt';
import { buildRobotsText } from './robots.txt';
import { buildSitemapXml, generateUrlEntry, SITEMAP_QUERY } from './sitemap.xml';

describe('discovery files', () => {
  it('builds a deduplicated, XML-safe sitemap', () => {
    const entry = generateUrlEntry('https://kammermusikkfest.no/program/a&b', '2026-10-15');
    const xml = buildSitemapXml([entry, entry]);

    expect(xml).toContain('<loc>https://kammermusikkfest.no/program/a&amp;b</loc>');
    expect(xml.match(/<url>/g)).toHaveLength(1);
    expect(xml).not.toContain('<changefreq>');
    expect(xml).not.toContain('<priority>');
  });

  it('filters non-public and non-indexable content in the sitemap query', () => {
    expect(SITEMAP_QUERY).toContain('publishingStatus == "published"');
    expect(SITEMAP_QUERY).toContain('publishingStatus == "scheduled"');
    expect(SITEMAP_QUERY).toContain('seo.indexingStatus != "noindex"');
    expect(SITEMAP_QUERY).toContain('defined(slug_en.current)');
  });

  it('keeps production robots rules path-based and staging fully blocked', () => {
    const production = buildRobotsText('https://kammermusikkfest.no', false);
    const staging = buildRobotsText('https://staging.kammermusikkfest.no', true);

    expect(production).toContain('Allow: /');
    expect(production).toContain('Disallow: /api/');
    expect(production).toContain('Sitemap: https://kammermusikkfest.no/sitemap.xml');
    expect(production).not.toContain('?date=');
    expect(staging).toContain('Disallow: /');
    expect(staging).not.toContain('Sitemap:');
  });

  it('publishes an absolute, curated llms.txt document', () => {
    const text = buildLlmsText('https://kammermusikkfest.no', [
      { title_no: 'Om oss', slug_no: 'om-oss' },
    ]);

    expect(text).toContain('# Risør Kammermusikkfest');
    expect(text).toContain('> Norway\'s premier chamber music festival');
    expect(text).toContain('https://kammermusikkfest.no/om-oss');
    expect(text).not.toContain('](/');
    expect(CURATED_PAGE_QUERY).toContain('publishingStatus == "published"');
    expect(CURATED_PAGE_QUERY).toContain('seo.indexingStatus != "noindex"');
  });
});
