import {describe, it, expect, beforeEach, vi} from 'vitest'
import {
  rateLimit,
  validateContentType,
  InputValidator,
  getCORSHeaders,
  getSecurityHeaders
} from './security'

describe('Security Utilities', () => {
  describe('rateLimit', () => {
    let mockRequest: Request

    beforeEach(() => {
      mockRequest = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'x-forwarded-for': '192.168.1.100'
        }
      })
    })

    it('allows requests within limit', () => {
      const limiter = rateLimit({
        maxRequests: 5,
        windowMs: 60000
      })

      // First request should be allowed
      const result1 = limiter(mockRequest)
      expect(result1.allowed).toBe(true)

      // Multiple requests within limit should be allowed
      for (let i = 0; i < 4; i++) {
        const result = limiter(mockRequest)
        expect(result.allowed).toBe(true)
      }
    })

    it('blocks requests over limit', () => {
      const limiter = rateLimit({
        maxRequests: 2,
        windowMs: 60000,
        keyGenerator: () => 'test-key' // Use consistent key
      })

      // First two requests allowed
      expect(limiter(mockRequest).allowed).toBe(true)
      expect(limiter(mockRequest).allowed).toBe(true)

      // Third request blocked
      const result = limiter(mockRequest)
      expect(result.allowed).toBe(false)
      expect(result.resetTime).toBeDefined()
    })

    it('uses custom key generator', () => {
      const limiter = rateLimit({
        maxRequests: 1,
        windowMs: 60000,
        keyGenerator: () => 'custom-key'
      })

      expect(limiter(mockRequest).allowed).toBe(true)
      expect(limiter(mockRequest).allowed).toBe(false)
    })
  })

  describe('validateContentType', () => {
    it('validates exact content type match', () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        }
      })

      expect(validateContentType(request, 'application/json')).toBe(true)
      expect(validateContentType(request, 'text/plain')).toBe(false)
    })

    it('handles content type with charset', () => {
      const request = new Request('https://example.com', {
        method: 'POST',
        headers: {
          'content-type': 'application/json; charset=utf-8'
        }
      })

      expect(validateContentType(request, 'application/json')).toBe(true)
    })

    it('returns false for missing content type', () => {
      const request = new Request('https://example.com', {
        method: 'POST'
      })

      expect(validateContentType(request, 'application/json')).toBe(false)
    })
  })

  describe('InputValidator', () => {
    describe('validateSlug', () => {
      it('accepts valid slugs', () => {
        expect(InputValidator.validateSlug('valid-slug')).toBe('valid-slug')
        expect(InputValidator.validateSlug('test123')).toBe('test123')
        expect(InputValidator.validateSlug('a-b-c-123')).toBe('a-b-c-123')
      })

      it('rejects invalid slugs', () => {
        expect(InputValidator.validateSlug('Invalid Slug')).toBe(null)
        expect(InputValidator.validateSlug('slug_with_underscore')).toBe(null)
        expect(InputValidator.validateSlug('slug.with.dots')).toBe(null)
        // UPPERCASE gets converted to lowercase, so it should be valid
        expect(InputValidator.validateSlug('UPPERCASE')).toBe('uppercase')
      })

      it('handles null and empty values', () => {
        expect(InputValidator.validateSlug(null)).toBe(null)
        expect(InputValidator.validateSlug('')).toBe(null)
        expect(InputValidator.validateSlug('   ')).toBe(null)
      })

      it('rejects overly long slugs', () => {
        const longSlug = 'a'.repeat(101)
        expect(InputValidator.validateSlug(longSlug)).toBe(null)
      })
    })

    describe('validateDate', () => {
      beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(new Date('2026-03-19T12:00:00Z'))
      })

      it('accepts valid dates', () => {
        expect(InputValidator.validateDate('2025-01-01')).toBe('2025-01-01')
        expect(InputValidator.validateDate('2028-12-30')).toBe('2028-12-30')
      })

      it('rejects invalid date formats', () => {
        expect(InputValidator.validateDate('2025-1-1')).toBe(null)
        expect(InputValidator.validateDate('01/01/2025')).toBe(null)
        expect(InputValidator.validateDate('2025-13-01')).toBe(null)
        expect(InputValidator.validateDate('not-a-date')).toBe(null)
      })

      it('rejects dates outside reasonable range', () => {
        // Too far in the past
        expect(InputValidator.validateDate('2024-12-31')).toBe(null)
        // Too far in the future  
        expect(InputValidator.validateDate('2029-01-01')).toBe(null)
      })

      it('handles null and empty values', () => {
        expect(InputValidator.validateDate(null)).toBe(null)
        expect(InputValidator.validateDate('')).toBe(null)
      })

      afterEach(() => {
        vi.useRealTimers()
      })
    })

    describe('sanitizeString', () => {
      it('escapes HTML characters', () => {
        expect(InputValidator.sanitizeString('<script>alert("xss")</script>'))
          .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;')
      })

      it('escapes quotes and ampersands', () => {
        expect(InputValidator.sanitizeString('Test & "quotes" \' apostrophes'))
          .toBe('Test &amp; &quot;quotes&quot; &#x27; apostrophes')
      })

      it('handles empty strings', () => {
        expect(InputValidator.sanitizeString('')).toBe('')
      })
    })
  })

  describe('getCORSHeaders', () => {
    beforeEach(() => {
      vi.stubEnv('PUBLIC_SITE_URL', 'https://kammermusikkfest.no')
    })

    it('sets allowed origin for valid origins', () => {
      const headers = getCORSHeaders('https://kammermusikkfest.no') as Record<string, string>
      expect(headers['Access-Control-Allow-Origin']).toBe('https://kammermusikkfest.no')
    })

    it('allows the www variant for production domains', () => {
      const headers = getCORSHeaders('https://www.kammermusikkfest.no') as Record<string, string>
      expect(headers['Access-Control-Allow-Origin']).toBe('https://www.kammermusikkfest.no')
    })

    it('uses default origin for invalid origins', () => {
      const headers = getCORSHeaders('https://malicious.com') as Record<string, string>
      expect(headers['Access-Control-Allow-Origin']).toBe('https://kammermusikkfest.no')
    })

    it('includes standard CORS headers', () => {
      const headers = getCORSHeaders() as Record<string, string>
      expect(headers['Access-Control-Allow-Methods']).toBe('POST, OPTIONS')
      expect(headers['Access-Control-Allow-Headers']).toBe('Content-Type')
      expect(headers['Access-Control-Max-Age']).toBe('86400')
    })
  })

  describe('getSecurityHeaders', () => {
    it('includes all security headers', () => {
      const headers = getSecurityHeaders() as Record<string, string>

      expect(headers['X-Content-Type-Options']).toBe('nosniff')
      expect(headers['X-Frame-Options']).toBe('DENY')
      expect(headers['X-XSS-Protection']).toBe('1; mode=block')
      expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
      expect(headers['Permissions-Policy']).toBe('camera=(), microphone=(), geolocation=()')
    })
  })
})
