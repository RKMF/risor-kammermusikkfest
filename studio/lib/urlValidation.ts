/**
 * Enhanced URL validation utilities for Sanity fields
 * Provides security-focused validation with domain whitelisting and URL safety checks
 */

export interface URLValidationOptions {
  /** Allowed URL schemes */
  schemes?: string[];
  /** Allowed domains for external URLs (empty array = allow all) */
  allowedDomains?: string[];
  /** Blocked domains for security */
  blockedDomains?: string[];
  /** Allow relative URLs */
  allowRelative?: boolean;
  /** Custom error message */
  errorMessage?: string;
}

/**
 * Creates an enhanced URL validation function with security features
 */
export function createURLValidation(options: URLValidationOptions = {}) {
  const {
    schemes = ['http', 'https'],
    allowedDomains = [],
    blockedDomains = ['localhost', '127.0.0.1', '0.0.0.0'],
    allowRelative = false,
    errorMessage = 'Please enter a valid URL',
  } = options;

  return (url: string | undefined) => {
    if (!url) return true;

    // Check if it's a relative URL
    if (allowRelative && !url.includes('://')) {
      return true;
    }

    try {
      const urlObj = new URL(url);

      // Check scheme
      if (!schemes.includes(urlObj.protocol.slice(0, -1))) {
        return `URL must start with: ${schemes.join(', ')}`;
      }

      // Check blocked domains
      if (blockedDomains.includes(urlObj.hostname.toLowerCase())) {
        return `Domain "${urlObj.hostname}" is not allowed`;
      }

      // Check allowed domains (if specified) - only for http/https URLs
      if (
        allowedDomains.length > 0 &&
        (urlObj.protocol === 'http:' || urlObj.protocol === 'https:')
      ) {
        const isAllowed = allowedDomains.some((domain) => {
          // Support wildcards like *.example.com
          if (domain.startsWith('*.')) {
            const baseDomain = domain.slice(2).toLowerCase();
            const hostname = urlObj.hostname.toLowerCase();
            // Must end with baseDomain and have a dot before it (or be exact match)
            return hostname === baseDomain || hostname.endsWith('.' + baseDomain);
          }
          return urlObj.hostname.toLowerCase() === domain.toLowerCase();
        });

        if (!isAllowed) {
          return `Only these domains are allowed: ${allowedDomains.join(', ')}`;
        }
      }

      // Additional security checks
      if (urlObj.username || urlObj.password) {
        return 'URLs with credentials are not allowed';
      }

      // Check for suspicious protocols
      if (urlObj.protocol === 'javascript:' || urlObj.protocol === 'data:') {
        return 'JavaScript and data URLs are not allowed';
      }

      return true;
    } catch (error) {
      return errorMessage;
    }
  };
}

/**
 * Pre-configured validation functions for common use cases
 */

/** Basic HTTP/HTTPS validation */
export const basicURLValidation = createURLValidation();

/** Strict validation for external links only */
export const externalURLValidation = createURLValidation({
  schemes: ['https'],
  blockedDomains: ['localhost', '127.0.0.1', '0.0.0.0', '*.local'],
  errorMessage: 'Please enter a valid HTTPS URL',
});

/** Email validation for mailto links */
export const emailURLValidation = createURLValidation({
  schemes: ['mailto'],
  allowedDomains: [],
  blockedDomains: [],
  errorMessage: 'Please enter a valid email address (mailto:example@domain.com)',
});

/** Phone validation for tel links */
export const phoneURLValidation = createURLValidation({
  schemes: ['tel'],
  allowedDomains: [],
  blockedDomains: [],
  errorMessage: 'Please enter a valid phone number (tel:+1234567890)',
});

/** Validation for button URLs (allows mailto and tel) */
export const buttonURLValidation = createURLValidation({
  schemes: ['http', 'https', 'mailto', 'tel'],
  blockedDomains: ['localhost', '127.0.0.1', '0.0.0.0'],
  errorMessage: 'Please enter a valid URL (http://, https://, mailto:, or tel:)',
});

/**
 * Utility function to check if URL is external
 */
export function isExternalURL(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Utility function to sanitize URL for display
 */
export function sanitizeURLForDisplay(url: string): string {
  try {
    const urlObj = new URL(url);
    // Remove credentials if they exist
    urlObj.username = '';
    urlObj.password = '';
    return urlObj.toString();
  } catch {
    return url;
  }
}
