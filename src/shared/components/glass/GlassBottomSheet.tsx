import React, { forwardRef, useCallback, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetView,
  type BottomSheetBackdropProps,
  type BottomSheetBackgroundProps,
} from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { useGlassStyle } from '@/core/theme/useGlassStyle';

interface GlassBottomSheetProps {
  children: React.ReactNode;
  title?: string;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
}

function GlassSheetBackground({ style }: BottomSheetBackgroundProps) {
  const glass = useGlassStyle();
  return (
    <View
      style={[
        style,
        styles.bgContainer,
        {
          borderTopLeftRadius: glass.borderRadius + 6,
          borderTopRightRadius: glass.borderRadius + 6,
          borderColor: glass.highlightBorderColor,
          borderWidth: glass.borderWidth,
          backgroundColor: glass.surfaceElevatedColor,
        },
      ]}
    >
      <BlurView
        intensity={Math.min(100, glass.blurIntensity + 20)}
        tint={glass.blurTint}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export const GlassBottomSheet = forwardRef<BottomSheetModal, GlassBottomSheetProps>(
  function GlassBottomSheet({ children, title, snapPoints, onDismiss }, ref) {
    const glass = useGlassStyle();
    const resolvedSnapPoints = useMemo(() => snapPoints ?? ['45%', '80%'], [snapPoints]);

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          appearsOnIndex={0}
          disappearsOnIndex={-1}
          opacity={0.42}
        />
      ),
      [],
    );

    return (
      <BottomSheetModal
        ref={ref}
        snapPoints={resolvedSnapPoints}
        onDismiss={onDismiss}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundComponent={GlassSheetBackground}
        handleIndicatorStyle={[styles.handle, { backgroundColor: glass.textMuted }]}
      >
        <BottomSheetView style={styles.content}>
          {title ? (
            <Text style={[styles.title, { color: glass.textPrimary, fontFamily: glass.fontRegular }]}>
              {title}
            </Text>
          ) : null}
          {children}
        </BottomSheetView>
      </BottomSheetModal>
    );
  },
);

const styles = StyleSheet.create({
  bgContainer: {
    overflow: 'hidden',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 999,
    opacity: 0.6,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 14,
  },
});
