/**
 * Comprehensive frontend security headers unit test suite.
 * Validates CSP directives, Permissions-Policy specifications, X-Frame-Options,
 * and environment-specific behaviors across production, development, and preview deployments.
 */

import {
  buildContentSecurityPolicy,
  buildSecurityHeaders,
  type SecurityHeaderOptions,
} from '@/utils/securityHeaders';

function parseDirectiveMap(policy: string): Map<string, string[]> {
  const map = new Map<string, string[]>();
  const parts = policy.split(';').map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const [directive, ...sources] = part.split(/\s+/);
    map.set(directive, sources);
  }
  return map;
}

describe('Frontend Security Headers Specification', () => {
  describe('OWASP & Standard Recommended Security Headers', () => {
    it('generates all recommended security headers for production environment', () => {
      const headersList = buildSecurityHeaders({
        apiUrl: 'https://api.opensourcemate.com',
        isDev: false,
        isVercelPreview: false,
      });
      const headersMap = new Map(headersList.map((h) => [h.key, h.value]));

      // 1. MIME-type sniffing protection
      expect(headersMap.get('X-Content-Type-Options')).toBe('nosniff');

      // 2. Clickjacking protection
      expect(headersMap.get('X-Frame-Options')).toBe('DENY');

      // 3. Referrer leakage prevention
      expect(headersMap.get('Referrer-Policy')).toBe('strict-origin-when-cross-origin');

      // 4. Tabnabbing and origin isolation
      expect(headersMap.get('Cross-Origin-Opener-Policy')).toBe('same-origin');

      // 5. Strict Transport Security (HSTS)
      expect(headersMap.get('Strict-Transport-Security')).toBe(
        'max-age=63072000; includeSubDomains'
      );

      // 6. Permissions Policy
      const permissionsPolicy = headersMap.get('Permissions-Policy') || '';
      expect(permissionsPolicy).toContain('camera=()');
      expect(permissionsPolicy).toContain('microphone=()');
      expect(permissionsPolicy).toContain('geolocation=()');
      expect(permissionsPolicy).toContain('payment=()');
      expect(permissionsPolicy).toContain('usb=()');
      expect(permissionsPolicy).toContain('browsing-topics=()');
    });

    it('omits Strict-Transport-Security in local development to preserve localhost access', () => {
      const devHeaders = buildSecurityHeaders({ isDev: true });
      const hasHsts = devHeaders.some((h) => h.key === 'Strict-Transport-Security');
      expect(hasHsts).toBe(false);
    });
  });

  describe('Content-Security-Policy (CSP) Directives', () => {
    it('strictly confines default-src, object-src, and frame-ancestors', () => {
      const policy = buildContentSecurityPolicy();
      const directives = parseDirectiveMap(policy);

      expect(directives.get('default-src')).toEqual(["'self'"]);
      expect(directives.get('object-src')).toEqual(["'none'"]);
      expect(directives.get('frame-ancestors')).toEqual(["'none'"]);
      expect(directives.get('base-uri')).toEqual(["'self'"]);
      expect(directives.get('form-action')).toEqual(["'self'"]);
    });

    it('whitelists GitHub avatar and raw asset origins in img-src', () => {
      const policy = buildContentSecurityPolicy();
      const directives = parseDirectiveMap(policy);
      const imgSrc = directives.get('img-src') || [];

      expect(imgSrc).toContain("'self'");
      expect(imgSrc).toContain('data:');
      expect(imgSrc).toContain('blob:');
      expect(imgSrc).toContain('https://avatars.githubusercontent.com');
      expect(imgSrc).toContain('https://raw.githubusercontent.com');
    });

    it('whitelists backend API endpoint and GitHub API in connect-src', () => {
      const customApi = 'https://custom-backend.internal:8443/v1/api';
      const policy = buildContentSecurityPolicy({ apiUrl: customApi });
      const directives = parseDirectiveMap(policy);
      const connectSrc = directives.get('connect-src') || [];

      expect(connectSrc).toContain("'self'");
      expect(connectSrc).toContain('https://custom-backend.internal:8443');
      expect(connectSrc).toContain('https://api.github.com');
    });

    it('enforces upgrade-insecure-requests in production but drops in dev', () => {
      const prodPolicy = buildContentSecurityPolicy({ isDev: false });
      expect(prodPolicy).toContain('upgrade-insecure-requests');

      const devPolicy = buildContentSecurityPolicy({ isDev: true });
      expect(devPolicy).not.toContain('upgrade-insecure-requests');
    });

    it('enables hot-reloading websockets and eval only in development', () => {
      const devPolicy = buildContentSecurityPolicy({ isDev: true });
      const devDirectives = parseDirectiveMap(devPolicy);

      expect(devDirectives.get('script-src')).toContain("'unsafe-eval'");
      expect(devDirectives.get('connect-src')).toContain('ws:');
      expect(devDirectives.get('connect-src')).toContain('wss:');

      const prodPolicy = buildContentSecurityPolicy({ isDev: false });
      const prodDirectives = parseDirectiveMap(prodPolicy);

      expect(prodDirectives.get('script-src')).not.toContain("'unsafe-eval'");
      expect(prodDirectives.get('connect-src')).not.toContain('ws:');
    });

    it('supports Vercel toolbar integration seamlessly on preview deployments', () => {
      const previewPolicy = buildContentSecurityPolicy({ isVercelPreview: true });
      const directives = parseDirectiveMap(previewPolicy);

      expect(directives.get('frame-src')).toContain('https://vercel.live');
      expect(directives.get('script-src')).toContain('https://vercel.live');
      expect(directives.get('connect-src')).toContain('https://vercel.live');
    });
  });
});
