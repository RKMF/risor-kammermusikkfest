import { describe, it, expect } from 'vitest';
import {
  createURLValidation,
  basicURLValidation,
  externalURLValidation,
  emailURLValidation,
  phoneURLValidation,
  buttonURLValidation,
  isExternalURL,
  sanitizeURLForDisplay,
} from './urlValidation';

describe('urlValidation', () => {
  describe('createURLValidation', () => {
    it('validates basic HTTP/HTTPS URLs', () => {
      const validate = createURLValidation();

      expect(validate('https://example.com')).toBe(true);
      expect(validate('http://example.com')).toBe(true);
      expect(validate('ftp://example.com')).toContain('URL must start with');
    });

    it('blocks suspicious domains', () => {
      const validate = createURLValidation();

      expect(validate('https://localhost')).toContain('not allowed');
      expect(validate('https://127.0.0.1')).toContain('not allowed');
      expect(validate('https://0.0.0.0')).toContain('not allowed');
    });

    it('enforces domain whitelist when provided', () => {
      const validate = createURLValidation({
        allowedDomains: ['example.com', '*.trusted.com'],
      });

      expect(validate('https://example.com')).toBe(true);
      expect(validate('https://sub.trusted.com')).toBe(true);
      expect(validate('https://untrusted.com')).toContain('Only these domains are allowed');
    });

    it('supports wildcard domains', () => {
      const validate = createURLValidation({
        allowedDomains: ['*.example.com'],
      });

      expect(validate('https://sub.example.com')).toBe(true);
      expect(validate('https://deep.sub.example.com')).toBe(true);
      expect(validate('https://notexample.com')).toContain('Only these domains are allowed');
    });

    it('blocks URLs with credentials', () => {
      const validate = createURLValidation();

      expect(validate('https://user:pass@example.com')).toContain('credentials are not allowed');
    });

    it('blocks dangerous protocols', () => {
      const validate = createURLValidation({
        schemes: ['http', 'https', 'javascript', 'data'],
      });

      expect(validate('javascript:alert("xss")')).toContain(
        'JavaScript and data URLs are not allowed'
      );
      expect(validate('data:text/html,<script>alert("xss")</script>')).toContain(
        'JavaScript and data URLs are not allowed'
      );
    });

    it('allows relative URLs when enabled', () => {
      const validate = createURLValidation({ allowRelative: true });

      expect(validate('/relative/path')).toBe(true);
      expect(validate('../relative/path')).toBe(true);
      expect(validate('relative/path')).toBe(true);
    });

    it('returns true for undefined/empty URLs', () => {
      const validate = createURLValidation();

      expect(validate(undefined)).toBe(true);
      expect(validate('')).toBe(true);
    });

    it('uses custom error messages', () => {
      const validate = createURLValidation({
        errorMessage: 'Custom error message',
      });

      expect(validate('invalid-url')).toBe('Custom error message');
    });
  });

  describe('pre-configured validators', () => {
    describe('basicURLValidation', () => {
      it('allows HTTP and HTTPS', () => {
        expect(basicURLValidation('https://example.com')).toBe(true);
        expect(basicURLValidation('http://example.com')).toBe(true);
        expect(basicURLValidation('ftp://example.com')).toContain('URL must start with');
      });
    });

    describe('externalURLValidation', () => {
      it('only allows HTTPS', () => {
        expect(externalURLValidation('https://example.com')).toBe(true);
        expect(externalURLValidation('http://example.com')).toContain('URL must start with');
      });
    });

    describe('emailURLValidation', () => {
      it('validates mailto URLs', () => {
        expect(emailURLValidation('mailto:test@example.com')).toBe(true);
        expect(emailURLValidation('https://example.com')).toContain('URL must start with');
      });
    });

    describe('phoneURLValidation', () => {
      it('validates tel URLs', () => {
        expect(phoneURLValidation('tel:+1234567890')).toBe(true);
        expect(phoneURLValidation('https://example.com')).toContain('URL must start with');
      });
    });

    describe('buttonURLValidation', () => {
      it('allows multiple schemes', () => {
        expect(buttonURLValidation('https://example.com')).toBe(true);
        expect(buttonURLValidation('http://example.com')).toBe(true);
        expect(buttonURLValidation('mailto:test@example.com')).toBe(true);
        expect(buttonURLValidation('tel:+1234567890')).toBe(true);
        expect(buttonURLValidation('ftp://example.com')).toContain('URL must start with');
      });
    });
  });

  describe('utility functions', () => {
    describe('isExternalURL', () => {
      it('identifies external URLs correctly', () => {
        expect(isExternalURL('https://example.com')).toBe(true);
        expect(isExternalURL('http://example.com')).toBe(true);
        expect(isExternalURL('mailto:test@example.com')).toBe(false);
        expect(isExternalURL('tel:+1234567890')).toBe(false);
        expect(isExternalURL('/relative/path')).toBe(false);
        expect(isExternalURL('invalid-url')).toBe(false);
      });
    });

    describe('sanitizeURLForDisplay', () => {
      it('removes credentials from URLs', () => {
        expect(sanitizeURLForDisplay('https://user:pass@example.com/path')).toBe(
          'https://example.com/path'
        );
      });

      it('leaves clean URLs unchanged', () => {
        expect(sanitizeURLForDisplay('https://example.com/path')).toBe('https://example.com/path');
      });

      it('handles invalid URLs gracefully', () => {
        expect(sanitizeURLForDisplay('invalid-url')).toBe('invalid-url');
      });
    });
  });
});
