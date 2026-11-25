import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Switch, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { KeyRound, Lock, Shield } from 'lucide-react-native';
import { secureStorage } from '@/core/storage/secure.storage';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { useStealthEntrance } from '@/features/vault/hooks/useStealthEntrance';
import { useVaultSessionStore } from '@/features/vault/store/vaultSessionStore';
import { GlassButton } from '@/shared/components/glass/GlassButton';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { SECURE_KEYS } from '@/shared/constants/storage.keys';
import { useHaptics } from '@/shared/hooks/useHaptics';

export function SecuritySettingsCard() {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const router = useRouter();
  const isVaultUnlocked = useVaultSessionStore((s) => s.isVaultUnlocked);
  const { setBiometricPreference } = useStealthEntrance();
  const [biometricEnabled, setBiometricEnabled] = useState(Platform.OS !== 'web');

  useEffect(() => {
    if (Platform.OS === 'web') {
      setBiometricEnabled(false);
      return;
    }
    void secureStorage.getItem(SECURE_KEYS.BIOMETRIC_ENABLED).then((val) => {
      setBiometricEnabled(val !== 'false');
    });
  }, []);

  const toggleBiometric = async (next: boolean) => {
    if (Platform.OS === 'web') return;
    haptics.selection();
    const updated = await setBiometricPreference(next);
    if (updated) {
      setBiometricEnabled(next);
    }
  };

  return (
    <GlassCard style={styles.card}>
      <Text style={[styles.heading, { color: glass.textPrimary }]}>Bảo mật & Không gian riêng</Text>

      <View style={styles.switchRow}>
        <Text style={[styles.label, { color: glass.textSecondary }]}>FaceID / Vân tay</Text>
        <Switch
          value={biometricEnabled}
          onValueChange={(v) => void toggleBiometric(v)}
          trackColor={{ true: glass.accentColor }}
        />
      </View>

      <View style={styles.buttons}>
        <GlassButton
          label="Mở Không gian riêng & 2FA"
          variant="accent"
          icon={<KeyRound size={15} color={glass.accentColor} />}
          onPress={() => {
            if (isVaultUnlocked) {
              router.push('/(vault)');
            } else {
              router.push({ pathname: '/(auth)/lock', params: { mode: 'stealth_vault' } });
            }
          }}
        />
        <GlassButton
          label="Đặt mã PIN ứng dụng"
          icon={<Lock size={15} color={glass.textPrimary} />}
          onPress={() => router.push({ pathname: '/(auth)/lock', params: { mode: 'setup_main' } })}
        />
        <GlassButton
          label="Đặt mã PIN Không gian riêng"
          icon={<Shield size={15} color={glass.textPrimary} />}
          onPress={() => router.push({ pathname: '/(auth)/lock', params: { mode: 'setup_vault' } })}
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  heading: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  label: { fontSize: 13, flex: 1 },
  buttons: { gap: 10 },
});
