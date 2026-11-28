/**
 * Unit tests validating frontend dependency governance, scripts, and documentation alignment.
 * Ensures package.json maintains required production and development dependencies,
 * avoids unvetted packages, and aligns with documentation standards.
 */

import fs from 'fs';
import path from 'path';

describe('Frontend Dependency Audit & Governance', () => {
  const repoRoot = path.resolve(__dirname, '../..');
  const packageJsonPath = path.join(repoRoot, 'frontend/package.json');
  const docsPath = path.join(repoRoot, 'docs/DEPENDENCIES.md');

  let packageJson: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    scripts?: Record<string, string>;
    engines?: { node?: string };
  };

  beforeAll(() => {
    expect(fs.existsSync(packageJsonPath)).toBe(true);
    const content = fs.readFileSync(packageJsonPath, 'utf8');
    packageJson = JSON.parse(content);
  });

  describe('Core Production Dependencies', () => {
    it('declares Next.js and React 19 in dependencies', () => {
      const deps = packageJson.dependencies || {};
      expect(deps).toHaveProperty('next');
      expect(deps).toHaveProperty('react');
      expect(deps).toHaveProperty('react-dom');
    });

    it('keeps production dependencies minimal (strictly <= 5)', () => {
      const deps = packageJson.dependencies || {};
      const count = Object.keys(deps).length;
      expect(count).toBeLessThanOrEqual(5);
    });

    it('uses matching versions for react and react-dom', () => {
      const deps = packageJson.dependencies || {};
      expect(deps['react']).toBe(deps['react-dom']);
    });
  });

  describe('Development & Testing Tooling', () => {
    it('declares TypeScript and PostCSS Tailwind tools', () => {
      const devDeps = packageJson.devDependencies || {};
      expect(devDeps).toHaveProperty('typescript');
      expect(devDeps).toHaveProperty('tailwindcss');
      expect(devDeps).toHaveProperty('@tailwindcss/postcss');
    });

    it('declares testing framework and DOM environment libraries', () => {
      const devDeps = packageJson.devDependencies || {};
      expect(devDeps).toHaveProperty('jest');
      expect(devDeps).toHaveProperty('jest-environment-jsdom');
      expect(devDeps).toHaveProperty('@testing-library/react');
      expect(devDeps).toHaveProperty('@testing-library/jest-dom');
      expect(devDeps).toHaveProperty('@testing-library/user-event');
    });

    it('declares linters and code formatters', () => {
      const devDeps = packageJson.devDependencies || {};
      expect(devDeps).toHaveProperty('eslint');
      expect(devDeps).toHaveProperty('eslint-config-next');
      expect(devDeps).toHaveProperty('prettier');
    });
  });

  describe('Lifecycle Scripts', () => {
    it('defines standard next and build scripts', () => {
      const scripts = packageJson.scripts || {};
      expect(scripts['dev']).toBe('next dev');
      expect(scripts['build']).toBe('next build');
      expect(scripts['start']).toBe('next start');
    });

    it('defines testing and coverage commands', () => {
      const scripts = packageJson.scripts || {};
      expect(scripts['test']).toBe('jest');
      expect(scripts['test:coverage']).toContain('jest');
    });

    it('defines linting and formatting commands', () => {
      const scripts = packageJson.scripts || {};
      expect(scripts['lint']).toBe('eslint');
      expect(scripts['format']).toContain('prettier');
    });
  });

  describe('Engine & Node Compatibility', () => {
    it('requires Node >=22 in engines specification', () => {
      expect(packageJson.engines).toBeDefined();
      expect(packageJson.engines?.node).toContain('>=22');
    });
  });

  describe('Documentation Consistency', () => {
    it('verifies docs/DEPENDENCIES.md documents all frontend production dependencies', () => {
      expect(fs.existsSync(docsPath)).toBe(true);
      const docsContent = fs.readFileSync(docsPath, 'utf8').toLowerCase();
      const deps = Object.keys(packageJson.dependencies || {});
      deps.forEach((dep) => {
        expect(docsContent).toContain(dep.toLowerCase());
      });
    });

    it('verifies docs/DEPENDENCIES.md documents core dev tooling', () => {
      const docsContent = fs.readFileSync(docsPath, 'utf8').toLowerCase();
      const devDeps = ['tailwindcss', 'typescript', 'jest', 'eslint', 'prettier'];
      devDeps.forEach((dep) => {
        expect(docsContent).toContain(dep.toLowerCase());
      });
    });
  });
});
