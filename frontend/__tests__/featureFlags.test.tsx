import React from 'react';
import { render, screen } from '@testing-library/react';
import { FeatureGate, ComingSoonPlaceholder } from '../components/FeatureGate';
import { parseFlagValue, getFeatureFlags, isFeatureEnabled, DEFAULT_FEATURE_FLAGS } from '../utils/featureFlags';

describe('Feature Flags System', () => {
  describe('parseFlagValue', () => {
    it('correctly parses truthy values', () => {
      expect(parseFlagValue('true')).toBe(true);
      expect(parseFlagValue('TRUE')).toBe(true);
      expect(parseFlagValue('1')).toBe(true);
      expect(parseFlagValue('yes')).toBe(true);
      expect(parseFlagValue('on')).toBe(true);
    });

    it('correctly parses falsy or empty values', () => {
      expect(parseFlagValue('false')).toBe(false);
      expect(parseFlagValue('0')).toBe(false);
      expect(parseFlagValue('no')).toBe(false);
      expect(parseFlagValue('')).toBe(false);
      expect(parseFlagValue(undefined)).toBe(false);
    });

    it('falls back to provided defaultValue when undefined', () => {
      expect(parseFlagValue(undefined, true)).toBe(true);
      expect(parseFlagValue(undefined, false)).toBe(false);
    });
  });

  describe('getFeatureFlags', () => {
    it('defaults all flags to false when no environment variables set', () => {
      const flags = getFeatureFlags({});
      expect(flags).toEqual(DEFAULT_FEATURE_FLAGS);
      expect(flags.pastedTextAnalysis).toBe(false);
      expect(flags.repositorySelection).toBe(false);
      expect(flags.starredRepoInterests).toBe(false);
      expect(flags.usernameAutocomplete).toBe(false);
    });

    it('reads NEXT_PUBLIC_FEATURE_* flags when provided', () => {
      const flags = getFeatureFlags({
        NEXT_PUBLIC_FEATURE_PASTED_TEXT_ANALYSIS: 'true',
        NEXT_PUBLIC_FEATURE_USERNAME_AUTOCOMPLETE: '1',
      });
      expect(flags.pastedTextAnalysis).toBe(true);
      expect(flags.usernameAutocomplete).toBe(true);
      expect(flags.repositorySelection).toBe(false);
    });
  });

  describe('FeatureGate Component', () => {
    it('renders fallback when feature flag is disabled', () => {
      render(
        <FeatureGate
          flag="pastedTextAnalysis"
          fallback={<div>Fallback Content</div>}
        >
          <div>Protected Content</div>
        </FeatureGate>
      );

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
      expect(screen.getByText('Fallback Content')).toBeInTheDocument();
    });

    it('renders ComingSoonPlaceholder when used as fallback', () => {
      render(
        <FeatureGate
          flag="repositorySelection"
          fallback={
            <ComingSoonPlaceholder
              featureName="Custom Repo Selector"
              description="Choose which repos to analyze"
            />
          }
        >
          <div>Protected Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Custom Repo Selector')).toBeInTheDocument();
      expect(screen.getByText('Choose which repos to analyze')).toBeInTheDocument();
      expect(screen.getByText('Feature Coming Soon')).toBeInTheDocument();
    });
  });
});


  describe('FeatureGate with Active Flag', () => {
    it('renders children directly when feature flag is enabled', () => {
      // Mock getFeatureFlags
      const originalEnv = process.env.NEXT_PUBLIC_FEATURE_PASTED_TEXT_ANALYSIS;
      process.env.NEXT_PUBLIC_FEATURE_PASTED_TEXT_ANALYSIS = 'true';

      render(
        <FeatureGate
          flag="pastedTextAnalysis"
          fallback={<div>Fallback Content</div>}
        >
          <div>Visible Unreleased Feature Content</div>
        </FeatureGate>
      );

      expect(screen.getByText('Visible Unreleased Feature Content')).toBeInTheDocument();
      expect(screen.queryByText('Fallback Content')).not.toBeInTheDocument();

      process.env.NEXT_PUBLIC_FEATURE_PASTED_TEXT_ANALYSIS = originalEnv;
    });

    it('renders null fallback by default when flag is disabled and no fallback passed', () => {
      render(
        <FeatureGate flag="usernameAutocomplete">
          <div>Hidden Content</div>
        </FeatureGate>
      );

      expect(screen.queryByText('Hidden Content')).not.toBeInTheDocument();
    });
  });

  describe('ComingSoonPlaceholder Accessibility', () => {
    it('has role="status" and correct aria-label', () => {
      render(
        <ComingSoonPlaceholder
          featureName="AI Match Reasoning"
          description="Explains why this issue was matched."
        />
      );

      const placeholder = screen.getByRole('status');
      expect(placeholder).toBeInTheDocument();
      expect(placeholder).toHaveAttribute('aria-label', 'AI Match Reasoning feature coming soon');
    });
  });
