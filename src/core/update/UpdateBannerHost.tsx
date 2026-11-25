import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking, Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useThemeStore } from '@/core/theme/themeStore';
import { checkForGitHubUpdate, type UpdateCheckResult, type UpdatePlatform } from './githubUpdate';

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;

function resolvePlatform(): UpdatePlatform {
  if (Platform.OS === 'android') return 'android';
  if (Platform.OS === 'ios') return 'ios';
  return 'web';
}

export function UpdateBannerHost() {
  const isDark = useThemeStore((s) => s.isDark);
  const accentColor = useThemeStore((s) => s.accentColor);
  const [updateInfo, setUpdateInfo] = useState<UpdateCheckResult | null>(null);
  const [dismissedTag, setDismissedTag] = useState<string | null>(null);
  const lastCheckAtRef = useRef<number>(0);

  const runCheck = useCallback(async (force = false) => {
    const now = Date.now();
    if (!force && now - lastCheckAtRef.current < CHECK_INTERVAL_MS) return;
    lastCheckAtRef.current = now;

    const currentVersion = Constants.expoConfig?.version ?? '1.0.0';
    const result = await checkForGitHubUpdate({
      currentVersion,
      platform: resolvePlatform(),
    });

    if (result.hasUpdate) {
      setUpdateInfo(result);
    }
  }, []);

  useEffect(() => {
    void runCheck(true);
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') {
        void runCheck(false);
      }
    });
    return () => sub.remove();
  }, [runCheck]);

  if (!updateInfo || !updateInfo.hasUpdate || dismissedTag === updateInfo.tagName) {
    return null;
  }

  const targetUrl = updateInfo.downloadUrl ?? updateInfo.releaseUrl;

  const handleInstall = () => {
    void Linking.openURL(targetUrl);
    setDismissedTag(updateInfo.tagName);
  };

  const handleDismiss = () => {
    setDismissedTag(updateInfo.tagName);
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#151B2E' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255,255,255,0.14)' : 'rgba(15,23,42,0.12)',
            },
          ]}
        >
          <Text style={[styles.badge, { color: accentColor }]}>BẢN CẬP NHẬT MỚI</Text>
          <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
            Liquid Notes {updateInfo.tagName}
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#475569' }]}>
            Phiên bản hiện tại: v{updateInfo.currentVersion} → Mới: v{updateInfo.latestVersion}
          </Text>
          {updateInfo.releaseNotes ? (
            <Text
              numberOfLines={4}
              style={[styles.notes, { color: isDark ? '#CBD5E1' : '#334155' }]}
            >
              {updateInfo.releaseNotes}
            </Text>
          ) : null}

          <View style={styles.actions}>
            <Pressable
              onPress={handleDismiss}
              style={[
                styles.button,
                styles.secondaryBtn,
                { borderColor: isDark ? 'rgba(255,255,255,0.16)' : 'rgba(15,23,42,0.16)' },
              ]}
            >
              <Text style={[styles.buttonText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                Để sau
              </Text>
            </Pressable>
            <Pressable
              onPress={handleInstall}
              style={[styles.button, { backgroundColor: accentColor }]}
            >
              <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                {updateInfo.downloadUrl ? 'Tải & Cập nhật' : 'Xem bản mới'}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 19,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 13,
  },
  notes: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  secondaryBtn: {
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
