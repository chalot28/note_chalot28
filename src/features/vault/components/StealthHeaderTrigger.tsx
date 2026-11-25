import React from 'react';
import { Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface StealthHeaderTriggerProps {
  children: React.ReactNode;
  onTriggerStealth: () => void;
  style?: StyleProp<ViewStyle>;
}

export function StealthHeaderTrigger({
  children,
  onTriggerStealth,
  style,
}: StealthHeaderTriggerProps) {
  const haptics = useHaptics();

  return (
    <Pressable
      delayLongPress={650}
      onLongPress={() => {
        haptics.medium();
        onTriggerStealth();
      }}
      style={style}
    >
      {children}
    </Pressable>
  );
}
