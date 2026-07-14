import { describe, expect, it } from 'vitest';
import {
  buildCanonicalProgramFilterPath,
  buildProgramFilterPath,
  hasValidProgramFilterParams,
  MAX_PROGRAM_FILTER_VALUES,
} from './programFilterState';

describe('program filter request normalization', () => {
  it('sorts and deduplicates filter values', () => {
    const year = new Date().getFullYear();
    const earlierDate = `${year}-07-09`;
    const laterDate = `${year}-07-10`;

    expect(buildProgramFilterPath(
      '/en/program',
      [laterDate, earlierDate, laterDate],
      ['venue-b', 'venue-a', 'venue-b']
    )).toBe(`/en/program?date=${earlierDate}&date=${laterDate}&venue=venue-a&venue=venue-b`);
  });

  it('builds one canonical URL from reordered input', () => {
    const date = `${new Date().getFullYear()}-07-10`;
    const params = new URLSearchParams(`venue=venue-b&date=${date}&venue=venue-a`);
    expect(buildCanonicalProgramFilterPath('/program', params))
      .toBe(`/program?date=${date}&venue=venue-a&venue=venue-b`);
  });

  it('rejects unknown, malformed, and excessive parameters', () => {
    expect(hasValidProgramFilterParams(new URLSearchParams('unknown=value'))).toBe(false);
    expect(hasValidProgramFilterParams(new URLSearchParams('venue=Not%20A%20Slug'))).toBe(false);

    const excessive = new URLSearchParams();
    for (let index = 0; index <= MAX_PROGRAM_FILTER_VALUES; index += 1) {
      excessive.append('venue', `venue-${index}`);
    }
    expect(hasValidProgramFilterParams(excessive)).toBe(false);
  });

  it('allows a single valid language only for the API endpoint', () => {
    const params = new URLSearchParams('lang=en');
    expect(hasValidProgramFilterParams(params)).toBe(false);
    expect(hasValidProgramFilterParams(params, true)).toBe(true);
  });
});
