import React from 'react';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export function GlassSheetProvider({ children }: { children: React.ReactNode }) {
  return <BottomSheetModalProvider>{children}</BottomSheetModalProvider>;
}
