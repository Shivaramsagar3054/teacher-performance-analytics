import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface BrandTitleProps {
  /** 'full' = all 4 lines, 'compact' = Teacher+Performance only (for nav bars) */
  size?: 'full' | 'compact' | 'mini';
  showTagline?: boolean;
}

/**
 * Recreates the "Teacher Performance Analytics" branding typography
 * matching the logo image style:
 *   • "Teacher"     — dark navy, heavy bold
 *   • "Performance" — bright blue, heavy bold
 *   • "ANALYTICS"   — spaced caps with cyan/green decorative lines
 *   • tagline       — "Analyze." (cyan) "Evaluate." (green) "Improve." (amber)
 */
export function BrandTitle({ size = 'full', showTagline = true }: BrandTitleProps) {
  const scale = size === 'mini' ? 0.45 : size === 'compact' ? 0.62 : 1;

  return (
    <View style={styles.wrapper}>
      {/* "Teacher" */}
      <Text
        style={[
          styles.teacher,
          { fontSize: Math.round(36 * scale), lineHeight: Math.round(40 * scale) },
        ]}
        numberOfLines={1}
      >
        Teacher
      </Text>

      {/* "Performance" */}
      <Text
        style={[
          styles.performance,
          { fontSize: Math.round(36 * scale), lineHeight: Math.round(40 * scale) },
        ]}
        numberOfLines={1}
      >
        Performance
      </Text>

      {/* "— ANALYTICS —" with decorative lines */}
      <View style={[styles.analyticsRow, { marginVertical: Math.round(4 * scale) }]}>
        <View
          style={[
            styles.decoLine,
            styles.decoLineCyan,
            { width: Math.round(22 * scale), height: Math.round(2 * scale) },
          ]}
        />
        <Text
          style={[
            styles.analytics,
            {
              fontSize: Math.round(13 * scale),
              letterSpacing: Math.round(4 * scale),
              marginHorizontal: Math.round(6 * scale),
            },
          ]}
        >
          ANALYTICS
        </Text>
        <View
          style={[
            styles.decoLine,
            styles.decoLineGreen,
            { width: Math.round(22 * scale), height: Math.round(2 * scale) },
          ]}
        />
      </View>

      {/* Tagline */}
      {showTagline && size !== 'mini' && (
        <View style={styles.taglineRow}>
          <Text style={[styles.tagCyan, { fontSize: Math.round(12 * scale) }]}>
            Analyze.{'  '}
          </Text>
          <Text style={[styles.tagGreen, { fontSize: Math.round(12 * scale) }]}>
            Evaluate.{'  '}
          </Text>
          <Text style={[styles.tagAmber, { fontSize: Math.round(12 * scale) }]}>
            Improve.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'flex-start',
  },
  teacher: {
    fontWeight: '900',
    color: '#0a1930',
    includeFontPadding: false,
  },
  performance: {
    fontWeight: '900',
    color: '#1d6fd4',
    includeFontPadding: false,
  },
  analyticsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  decoLine: {
    borderRadius: 2,
  },
  decoLineCyan: {
    backgroundColor: '#06b6d4',
  },
  decoLineGreen: {
    backgroundColor: '#22c55e',
  },
  analytics: {
    fontWeight: '700',
    color: '#0a1930',
    includeFontPadding: false,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  tagCyan: {
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#06b6d4',
  },
  tagGreen: {
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#22c55e',
  },
  tagAmber: {
    fontStyle: 'italic',
    fontWeight: '600',
    color: '#f59e0b',
  },
});
