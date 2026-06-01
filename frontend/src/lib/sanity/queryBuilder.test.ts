import { describe, expect, it } from 'vitest';
import { QueryBuilder } from './queryBuilder';

function queryText(value: unknown) {
  return String(value);
}

describe('QueryBuilder slug index queries', () => {
  it('keeps slug index queries lightweight and route-specific', () => {
    expect(queryText(QueryBuilder.pageSlugs().query)).toContain('_type == "page"');
    expect(queryText(QueryBuilder.articleSlugs().query)).toContain('_type == "article"');
    expect(queryText(QueryBuilder.artistSlugs().query)).toContain('_type == "artist"');
    expect(queryText(QueryBuilder.eventSlugs().query)).toContain('_type == "event"');
  });
});

describe('QueryBuilder homepage query', () => {
  it('prefers active scheduled homepages and resolves overlaps deterministically', () => {
    const query = queryText(QueryBuilder.homepage().query);

    expect(query).toContain('select(homePageType == "scheduled" => 0, 1) asc');
    expect(query).toContain('scheduledPeriod.startDate desc');
    expect(query).toContain('_updatedAt desc');
    expect(query).toContain('defined(scheduledPeriod.endDate)');
  });

  it('includes the next upcoming scheduled start for cache boundary handling', () => {
    const query = queryText(QueryBuilder.homepage().query);

    expect(query).toContain('"nextScheduledStart"');
    expect(query).toContain('scheduledPeriod.startDate > now()');
    expect(query).toContain('order(scheduledPeriod.startDate asc)');
  });
});
