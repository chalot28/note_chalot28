export type ThemePresetId =
  | 'frosted-crystal'
  | 'obsidian-glass'
  | 'aurora-mist'
  | 'sakura-silk'
  | 'cyber-emerald';

export type FontFamilyOption = 'sans' | 'serif' | 'mono';

export type MeshColorTuple = readonly [string, string, string, string];

export interface ThemePreset {
  readonly id: ThemePresetId;
  readonly name: string;
  readonly subtitle: string;
  readonly isDark: boolean;
  readonly blurIntensity: number;
  readonly glassOpacity: number;
  readonly borderRadius: number;
  readonly specularStrength: number;
  readonly accentColor: string;
  readonly meshColors: MeshColorTuple;
  readonly textPrimary: string;
  readonly textSecondary: string;
  readonly textMuted: string;
}

export interface ThemeConfig {
  presetId: ThemePresetId;
  isDark: boolean;
  blurIntensity: number;
  glassOpacity: number;
  borderRadius: number;
  specularStrength: number;
  accentColor: string;
  meshColors: [string, string, string, string];
  fontFamily: FontFamilyOption;
}

export interface GlassComputedStyle {
  blurIntensity: number;
  blurTint: 'light' | 'dark';
  surfaceColor: string;
  surfaceElevatedColor: string;
  borderColor: string;
  highlightBorderColor: string;
  borderWidth: number;
  borderRadius: number;
  accentColor: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  fontRegular: string;
  fontMono: string;
}
