import { useMemo } from 'react';
import { useThemeStore } from '@/core/theme/themeStore';
import type { GlassComputedStyle } from '@/core/theme/theme.types';
import { FONT_FAMILY_MAP, THEME_PRESETS } from '@/shared/constants/theme.presets';

export function useGlassStyle(): GlassComputedStyle {
  const presetId = useThemeStore((s) => s.presetId);
  const isDark = useThemeStore((s) => s.isDark);
  const blurIntensity = useThemeStore((s) => s.blurIntensity);
  const glassOpacity = useThemeStore((s) => s.glassOpacity);
  const borderRadius = useThemeStore((s) => s.borderRadius);
  const specularStrength = useThemeStore((s) => s.specularStrength);
  const accentColor = useThemeStore((s) => s.accentColor);
  const fontFamily = useThemeStore((s) => s.fontFamily);

  return useMemo(() => {
    const preset = THEME_PRESETS[presetId];
    const textPalette =
      preset.isDark === isDark
        ? preset
        : THEME_PRESETS[isDark ? 'obsidian-glass' : 'frosted-crystal'];
    const baseChannel = isDark ? '255, 255, 255' : '255, 255, 255';
    const surfaceOpacity = isDark ? Math.min(0.12, glassOpacity * 0.6) : glassOpacity;
    const elevatedOpacity = Math.min(0.45, surfaceOpacity + (isDark ? 0.04 : 0.12));
    const highlightOpacity = isDark
      ? Math.min(0.08, specularStrength * 0.08)
      : Math.min(0.35, 0.12 + specularStrength * 0.2);

    return {
      blurIntensity,
      blurTint: isDark ? 'dark' : 'light',
      surfaceColor: `rgba(${baseChannel}, ${surfaceOpacity.toFixed(2)})`,
      surfaceElevatedColor: `rgba(${baseChannel}, ${elevatedOpacity.toFixed(2)})`,
      borderColor: 'transparent',
      highlightBorderColor: `rgba(255, 255, 255, ${highlightOpacity.toFixed(2)})`,
      borderWidth: 0,
      borderRadius,
      accentColor,
      textPrimary: textPalette.textPrimary,
      textSecondary: textPalette.textSecondary,
      textMuted: textPalette.textMuted,
      fontRegular: FONT_FAMILY_MAP[fontFamily],
      fontMono: FONT_FAMILY_MAP.mono,
    };
  }, [
    presetId,
    isDark,
    blurIntensity,
    glassOpacity,
    borderRadius,
    specularStrength,
    accentColor,
    fontFamily,
  ]);
}
