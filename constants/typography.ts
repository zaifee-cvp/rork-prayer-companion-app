import { Platform } from 'react-native';

const SF_FONT_FAMILY = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
  default: 'System',
}) as string;

const SF_ROUNDED_FAMILY = Platform.select({
  ios: 'System',
  android: 'Roboto',
  web: '-apple-system, BlinkMacSystemFont, "Helvetica Neue", Helvetica, Arial, sans-serif',
  default: 'System',
}) as string;

const MONO_FAMILY = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  web: '"SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
  default: 'monospace',
}) as string;

export const fontFamily = {
  system: SF_FONT_FAMILY,
  rounded: SF_ROUNDED_FAMILY,
  mono: MONO_FAMILY,
};

export const fontSize = {
  caption2: 11,
  caption1: 12,
  footnote: 13,
  subheadline: 15,
  callout: 16,
  body: 17,
  headline: 17,
  title3: 20,
  title2: 22,
  title1: 28,
  largeTitle: 34,
  hero: 48,
} as const;

export const fontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
  black: '900' as const,
};

export default {
  fontFamily,
  fontSize,
  fontWeight,
};
