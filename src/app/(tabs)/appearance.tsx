import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { GlassSlidersPanel } from '@/features/appearance/components/GlassSlidersPanel';
import { ThemePresetList } from '@/features/appearance/components/ThemePresetList';
import { SecuritySettingsCard } from '@/features/vault/components/SecuritySettingsCard';
import { MinimalScreen } from '@/shared/components/layout/MinimalScreen';
import { ZenHeader } from '@/shared/components/layout/ZenHeader';

export default function AppearanceScreen() {
  return (
    <MinimalScreen>
      <ZenHeader title="Appearance Studio" subtitle="Tùy biến giao diện & Hệ thống" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ThemePresetList />
        <GlassSlidersPanel />
        <SecuritySettingsCard />
      </ScrollView>
    </MinimalScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 110 },
});
