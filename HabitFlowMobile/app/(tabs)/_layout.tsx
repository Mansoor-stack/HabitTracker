import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { View } from 'react-native';

import { useThemeStore } from '../../src/stores';

function TabBarIcon(props: {
  name: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  size?: number;
}) {
  return <Ionicons size={props.size || 24} {...props} />;
}

export default function TabLayout() {
  const { themeConfig } = useThemeStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: themeConfig.colors.primary,
        tabBarInactiveTintColor: themeConfig.colors.textSecondary,
        tabBarStyle: {
          backgroundColor: themeConfig.colors.bgSecondary,
          borderTopColor: themeConfig.colors.border,
          borderTopWidth: 1,
          paddingTop: 8,
          paddingBottom: 8,
          height: 65,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerStyle: {
          backgroundColor: themeConfig.colors.bgPrimary,
          shadowColor: 'transparent',
          elevation: 0,
        },
        headerTitleStyle: {
          color: themeConfig.colors.textPrimary,
          fontSize: 20,
          fontWeight: '700',
        },
        headerShadowVisible: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Today',
          tabBarIcon: ({ color }) => <TabBarIcon name="today-outline" color={color} />,
          headerTitle: 'HabitFlow',
          headerRight: () => (
            <View style={{ marginRight: 16 }}>
              <Ionicons 
                name="add-circle" 
                size={28} 
                color={themeConfig.colors.primary} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color }) => <TabBarIcon name="stats-chart-outline" color={color} />,
          headerTitle: 'Analytics',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabBarIcon name="settings-outline" color={color} />,
          headerTitle: 'Settings',
        }}
      />
    </Tabs>
  );
}
