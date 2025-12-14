/**
 * Security utilities for API endpoints
 */

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (request: Request) => string
}

/**
 * Simple rate limiter for API endpoints
 */
export function rateLimit(config: RateLimitConfig) {
  return (request: Request): { allowed: boolean; resetTime?: number } => {
    const key = config.keyGenerator?.(request) || getClientIP(request)
    const now = Date.now()
    const existing = rateLimitStore.get(key)

    // Clean up expired entries
    if (existing && now > existing.resetTime) {
      rateLimitStore.delete(key)
    }

    const current = rateLimitStore.get(key)
    
    if (!current) {
      // First request from this key
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + config.windowMs
      })
      return { allowed: true }
    }

    if (current.count >= config.maxRequests) {
      return { 
        allowed: false, 
        resetTime: current.resetTime 
      }
    }

    // Increment counter
    current.count++
    rateLimitStore.set(key, current)
    
    return { allowed: true }
  }
}

/**
 * Extract client IP from request (best effort)
 */
function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }
  
  // Fallback to a generic identifier
  return 'unknown'
}

/**
 * Validate Content-Type header
 */
export function validateContentType(request: Request, expectedType: string): boolean {
  const contentType = request.headers.get('content-type')
  if (!contentType) return false
  
  // Handle content-type with charset (e.g., "application/x-www-form-urlencoded; charset=UTF-8")
  const cleanContentType = contentType.split(';')[0].trim().toLowerCase()
  return cleanContentType === expectedType.toLowerCase()
}

/**
 * Enhanced input validation with sanitization
 */
export class InputValidator {
  private static readonly SLUG_PATTERN = /^[a-z0-9-]+$/
  private static readonly DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
  private static readonly MAX_STRING_LENGTH = 100

  static validateSlug(value: string | null): string | null {
    if (!value) return null
    
    const cleaned = value.trim().toLowerCase()
    if (cleaned.length === 0 || cleaned.length > this.MAX_STRING_LENGTH) {
      return null
    }
    
    return this.SLUG_PATTERN.test(cleaned) ? cleaned : null
  }

  static validateDate(value: string | null): string | null {
    if (!value) return null
    
    const cleaned = value.trim()
    if (!this.DATE_PATTERN.test(cleaned)) {
      return null
    }
    
    // Validate it's a real date
    const date = new Date(cleaned)
    if (isNaN(date.getTime())) {
      return null
    }
    
    // Ensure date is reasonable (not too far in past/future)
    const now = new Date()
    const minDate = new Date(now.getFullYear() - 1, 0, 1) // 1 year ago
    const maxDate = new Date(now.getFullYear() + 2, 11, 31) // 2 years from now
    
    if (date < minDate || date > maxDate) {
      return null
    }
    
    return cleaned
  }

  static sanitizeString(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }
}

/**
 * CORS configuration for API endpoints
 * Uses PUBLIC_SITE_URL to derive allowed origins automatically
 */
export function getCORSHeaders(origin?: string): HeadersInit {
  // Derive allowed origins from PUBLIC_SITE_URL (supports both with and without www)
  const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
  const allowedOrigins = [siteUrl];

  // Also allow www variant for production
  if (siteUrl.includes('kammermusikkfest.no')) {
    if (siteUrl.includes('www.')) {
      allowedOrigins.push(siteUrl.replace('www.', ''));
    } else {
      allowedOrigins.push(siteUrl.replace('https://', 'https://www.'));
    }
  }

  const headers: HeadersInit = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400', // 24 hours
  }

  if (origin && allowedOrigins.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin
  } else {
    headers['Access-Control-Allow-Origin'] = allowedOrigins[0]
  }

  return headers
}

/**
 * Security headers for responses
 */
export function getSecurityHeaders(): HeadersInit {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}