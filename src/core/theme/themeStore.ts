import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { zustandMmkvStorage } from '@/core/storage/mmkv.storage';
import type { FontFamilyOption, ThemeConfig, ThemePresetId } from '@/core/theme/theme.types';
import { STORAGE_KEYS } from '@/shared/constants/storage.keys';
import { createDefaultThemeConfig, THEME_PRESETS } from '@/shared/constants/theme.presets';

interface ThemeState extends ThemeConfig {
  applyPreset: (presetId: ThemePresetId) => void;
  setIsDark: (isDark: boolean) => void;
  setBlurIntensity: (value: number) => void;
  setGlassOpacity: (value: number) => void;
  setBorderRadius: (value: number) => void;
  setSpecularStrength: (value: number) => void;
  setAccentColor: (color: string) => void;
  setMeshColors: (colors: [string, string, string, string]) => void;
  setFontFamily: (fontFamily: FontFamilyOption) => void;
  resetTheme: () => void;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      ...createDefaultThemeConfig('obsidian-glass'),
      applyPreset: (presetId) => {
        const preset = THEME_PRESETS[presetId];
        set((state) => ({
          ...state,
          presetId: preset.id,
          isDark: preset.isDark,
          blurIntensity: preset.blurIntensity,
          glassOpacity: preset.glassOpacity,
          borderRadius: preset.borderRadius,
          specularStrength: preset.specularStrength,
          accentColor: preset.accentColor,
          meshColors: [...preset.meshColors],
        }));
      },
      setIsDark: (isDark) => {
        set((state) => {
          const fallbackPreset = THEME_PRESETS[isDark ? 'obsidian-glass' : 'frosted-crystal'];
          return {
            ...state,
            isDark,
            meshColors: [...fallbackPreset.meshColors],
            glassOpacity: isDark ? Math.min(state.glassOpacity, 0.16) : Math.max(state.glassOpacity, 0.28),
          };
        });
      },
      setBlurIntensity: (value) => set({ blurIntensity: clamp(Math.round(value), 10, 100) }),
      setGlassOpacity: (value) =>
        set({ glassOpacity: Math.round(clamp(value, 0.05, 0.45) * 100) / 100 }),
      setBorderRadius: (value) => set({ borderRadius: clamp(Math.round(value), 8, 32) }),
      setSpecularStrength: (value) =>
        set({ specularStrength: Math.round(clamp(value, 0.1, 1.0) * 100) / 100 }),
      setAccentColor: (accentColor) => set({ accentColor }),
      setMeshColors: (meshColors) => set({ meshColors }),
      setFontFamily: (fontFamily) => set({ fontFamily }),
      resetTheme: () => set(createDefaultThemeConfig('obsidian-glass')),
    }),
    {
      name: STORAGE_KEYS.THEME_CONFIG,
      storage: createJSONStorage(() => zustandMmkvStorage),
    },
  ),
);
