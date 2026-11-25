import React from 'react';
import { Tabs } from 'expo-router';
import { Calendar, FileText, Palette } from 'lucide-react-native';
import { GlassDock, type GlassDockItem } from '@/shared/components/glass/GlassDock';

const DOCK_ITEMS: readonly GlassDockItem[] = [
  { key: 'index', label: 'Ghi chú', renderIcon: (c) => <FileText size={20} color={c} strokeWidth={1.8} /> },
  { key: 'planner', label: 'Lịch', renderIcon: (c) => <Calendar size={20} color={c} strokeWidth={1.8} /> },
  { key: 'appearance', label: 'Studio', renderIcon: (c) => <Palette size={20} color={c} strokeWidth={1.8} /> },
];

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: 'transparent' },
      }}
      tabBar={({ state, navigateToTab }) => {
        const activeRoute = state.routes[state.index]?.name ?? 'index';
        return (
          <GlassDock
            items={DOCK_ITEMS}
            activeKey={activeRoute}
            onSelect={(key) => {
              const target = state.routes.find((r) => r.name === key);
              if (target) {
                navigateToTab(target.key);
              }
            }}
          />
        );
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="planner" />
      <Tabs.Screen name="appearance" />
    </Tabs>
  );
}
