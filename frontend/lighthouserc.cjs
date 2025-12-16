/**
 * Lighthouse CI Configuration
 *
 * Runs performance audits against Vercel preview deployments.
 * Assertions are warnings only - failures won't block merges.
 *
 * @see https://github.com/GoogleChrome/lighthouse-ci
 */
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3, // Average 3 runs for stable results
      url: [
        '/', // Norwegian homepage
        '/en', // English homepage
        '/program', // Program (NO)
        '/en/program', // Program (EN)
        '/artister', // Artists (NO)
        '/en/artists', // Artists (EN)
        '/artikler', // Articles (NO)
        '/en/articles', // Articles (EN)
      ],
    },
    assert: {
      assertions: {
        // Category scores (0-1 scale, 0.9 = 90%)
        'categories:performance': ['warn', { minScore: 0.9 }],
        'categories:accessibility': ['warn', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],

        // Core Web Vitals (in milliseconds where applicable)
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: 'temporary-public-storage', // Free hosting, reports expire after 7 days
    },
  },
};
