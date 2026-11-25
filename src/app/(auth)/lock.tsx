import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Lock, Shield } from 'lucide-react-native';
import { secureStorage } from '@/core/storage/secure.storage';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { PinKeypadGlass } from '@/features/vault/components/PinKeypadGlass';
import { useStealthEntrance } from '@/features/vault/hooks/useStealthEntrance';
import type { PinAuthMode } from '@/features/vault/types/vault.types';
import { GlassButton } from '@/shared/components/glass/GlassButton';
import { MinimalScreen } from '@/shared/components/layout/MinimalScreen';
import { SECURE_KEYS } from '@/shared/constants/storage.keys';
import { useHaptics } from '@/shared/hooks/useHaptics';

type SetupPhase = 'loading' | 'verify_old_main' | 'verify_old_vault' | 'enter_new';

export default function LockScreen() {
  const { mode: rawMode } = useLocalSearchParams<{ mode?: string }>();
  const router = useRouter();
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const {
    hasMainPin,
    hasVaultPin,
    getLockoutRemainingSeconds,
    setupMainPin,
    setupVaultPin,
    verifyExistingPin,
    verifyPin,
    unlockWithBiometrics,
  } = useStealthEntrance();

  const isSetupMain = rawMode === 'setup_main';
  const isSetupVaultParam = rawMode === 'setup_vault';

  const [vaultPinMissing, setVaultPinMissing] = useState(false);
  const isSetupVault = isSetupVaultParam || (rawMode === 'stealth_vault' && vaultPinMissing);
  const isSetup = isSetupMain || isSetupVault;
  const authMode: PinAuthMode =
    isSetup ? 'setup_pin' : rawMode === 'stealth_vault' ? 'stealth_vault' : 'main_app';

  const [setupPhase, setSetupPhase] = useState<SetupPhase>('loading');
  const [biometricAllowed, setBiometricAllowed] = useState(false);
  const [pin, setPin] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshLockout = useCallback(async () => {
    const remaining = await getLockoutRemainingSeconds();
    setLockoutSeconds(remaining);
  }, [getLockoutRemainingSeconds]);

  useEffect(() => {
    let active = true;
    const init = async () => {
      await refreshLockout();
      if (Platform.OS !== 'web') {
        const pref = await secureStorage.getItem(SECURE_KEYS.BIOMETRIC_ENABLED);
        if (active) setBiometricAllowed(pref !== 'false');
      }

      const [mainExists, vaultExists] = await Promise.all([hasMainPin(), hasVaultPin()]);
      if (!active) return;

      if (rawMode === 'stealth_vault' && !vaultExists) {
        setVaultPinMissing(true);
        setSetupPhase(mainExists ? 'verify_old_main' : 'enter_new');
        return;
      }

      if (isSetupMain) {
        setSetupPhase(mainExists ? 'verify_old_main' : 'enter_new');
        return;
      }

      if (isSetupVaultParam) {
        if (vaultExists) setSetupPhase('verify_old_vault');
        else if (mainExists) setSetupPhase('verify_old_main');
        else setSetupPhase('enter_new');
        return;
      }

      setSetupPhase('enter_new');
    };

    void init();
    return () => {
      active = false;
    };
  }, [hasMainPin, hasVaultPin, isSetupMain, isSetupVaultParam, rawMode, refreshLockout]);

  useEffect(() => {
    if (lockoutSeconds <= 0) return;
    const timer = setInterval(() => {
      setLockoutSeconds((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [lockoutSeconds]);

  const handleBiometric = useCallback(async () => {
    if (isSetup || setupPhase !== 'enter_new' || !biometricAllowed || lockoutSeconds > 0) return;
    const outcome = await unlockWithBiometrics(authMode);
    if (outcome === 'vault_unlocked') router.replace('/(vault)');
    else if (outcome === 'main_unlocked') router.replace('/(tabs)');
  }, [authMode, biometricAllowed, isSetup, lockoutSeconds, router, setupPhase, unlockWithBiometrics]);

  useEffect(() => {
    if (isSetup || setupPhase !== 'enter_new' || !biometricAllowed) return;
    void handleBiometric();
  }, [biometricAllowed, handleBiometric, isSetup, setupPhase]);

  const goBackSafe = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }, [router]);

  const handleDigit = async (digit: string) => {
    if (isSubmitting || lockoutSeconds > 0 || setupPhase === 'loading' || pin.length >= 6) return;
    const next = `${pin}${digit}`;
    setPin(next);
    if (next.length < 6) return;

    setIsSubmitting(true);
    try {
      if (isSetup && (setupPhase === 'verify_old_main' || setupPhase === 'verify_old_vault')) {
        const target = setupPhase === 'verify_old_vault' ? 'vault' : 'main';
        const res = await verifyExistingPin(next, target);
        if (res === 'valid') {
          haptics.success();
          setPin('');
          setSetupPhase('enter_new');
        } else {
          if (res === 'locked_out') await refreshLockout();
          else await refreshLockout();
          setErrorCount((c) => c + 1);
          setPin('');
        }
        return;
      }

      if (isSetupMain) {
        await setupMainPin(next);
        haptics.success();
        goBackSafe();
        return;
      }

      if (isSetupVault) {
        await setupVaultPin(next);
        haptics.success();
        if (rawMode === 'stealth_vault') {
          const outcome = await verifyPin(next, 'stealth_vault');
          if (outcome === 'vault_unlocked') {
            router.replace('/(vault)');
            return;
          }
        }
        goBackSafe();
        return;
      }

      const outcome = await verifyPin(next, authMode);
      if (outcome === 'vault_unlocked') {
        haptics.success();
        router.replace('/(vault)');
      } else if (outcome === 'main_unlocked') {
        haptics.success();
        router.replace('/(tabs)');
      } else {
        await refreshLockout();
        setErrorCount((c) => c + 1);
        setPin('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const titleText =
    setupPhase === 'verify_old_vault'
      ? 'Xác nhận PIN Không gian riêng cũ'
      : setupPhase === 'verify_old_main'
        ? 'Xác nhận PIN ứng dụng cũ'
        : isSetupVault
          ? 'Tạo mã PIN Không gian riêng'
          : isSetupMain
            ? 'Tạo mã PIN ứng dụng'
            : authMode === 'stealth_vault'
              ? 'Mở khóa Không gian riêng'
              : 'Liquid Notes';

  const subText =
    lockoutSeconds > 0
      ? `Thử sai quá nhiều lần. Vui lòng đợi ${lockoutSeconds} giây`
      : setupPhase === 'verify_old_vault' || setupPhase === 'verify_old_main'
        ? 'Nhập mã PIN hiện tại để tiếp tục'
        : 'Nhập mã PIN gồm 6 chữ số';

  return (
    <MinimalScreen style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { borderColor: glass.borderColor, backgroundColor: glass.surfaceColor }]}>
          {authMode === 'stealth_vault' || isSetupVault ? (
            <Shield size={28} color={glass.accentColor} />
          ) : (
            <Lock size={28} color={glass.accentColor} />
          )}
        </View>
        <Text style={[styles.title, { color: glass.textPrimary }]}>{titleText}</Text>
        <Text style={[styles.sub, { color: lockoutSeconds > 0 ? glass.accentColor : glass.textMuted }]}>
          {subText}
        </Text>
      </View>

      <PinKeypadGlass
        pinLength={pin.length}
        errorCount={errorCount}
        showBiometric={!isSetup && setupPhase === 'enter_new' && biometricAllowed}
        disabled={isSubmitting || lockoutSeconds > 0 || setupPhase === 'loading'}
        onDigit={(d) => void handleDigit(d)}
        onDelete={() => setPin((prev) => prev.slice(0, -1))}
        onBiometric={() => void handleBiometric()}
      />

      {isSetup || authMode === 'stealth_vault' ? (
        <GlassButton label="Quay lại" variant="ghost" onPress={goBackSafe} style={styles.backBtn} />
      ) : null}
    </MinimalScreen>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', gap: 32 },
  header: { alignItems: 'center', gap: 10 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, borderWidth: 0.75, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 13, textAlign: 'center' },
  backBtn: { marginTop: 8 },
});
