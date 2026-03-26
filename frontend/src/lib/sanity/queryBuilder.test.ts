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
