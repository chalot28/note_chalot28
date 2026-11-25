import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface MinimalScreenProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  withTopInset?: boolean;
  withBottomInset?: boolean;
  horizontalPadding?: number;
}

export function MinimalScreen({
  children,
  style,
  withTopInset = true,
  withBottomInset = false,
  horizontalPadding = 16,
}: MinimalScreenProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: withTopInset ? insets.top + 8 : 0,
          paddingBottom: withBottomInset ? insets.bottom : 0,
          paddingHorizontal: horizontalPadding,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
