import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useThemeStore, useAuthStore } from '../../src/stores';
import { THEMES } from '../../src/constants/themes';
import { ThemeName } from '../../src/types';

const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth >= 600;

export default function SettingsScreen() {
  const { themeConfig, currentTheme, setTheme } = useThemeStore();
  const { user, profile, signOut, updateProfile } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(profile?.notifications_enabled ?? true);
  const [emailReportsEnabled, setEmailReportsEnabled] = useState(profile?.email_reports ?? false);

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/(auth)/login');
            } catch (error: any) {
              Alert.alert('Error', error.message);
            }
          },
        },
      ]
    );
  };

  const handleThemeChange = (themeName: ThemeName) => {
    setTheme(themeName);
  };

  const handleToggleNotifications = async (value: boolean) => {
    setNotificationsEnabled(value);
    try {
      await updateProfile({ notifications_enabled: value });
    } catch (error) {
      setNotificationsEnabled(!value);
    }
  };

  const handleToggleEmailReports = async (value: boolean) => {
    setEmailReportsEnabled(value);
    try {
      await updateProfile({ email_reports: value });
    } catch (error) {
      setEmailReportsEnabled(!value);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: themeConfig.colors.bgPrimary }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: 100,
          maxWidth: isTablet ? 700 : undefined,
          alignSelf: isTablet ? 'center' : undefined,
          width: isTablet ? '100%' : undefined,
        }}
      >
        {/* Profile Section */}
        <View
          style={{
            backgroundColor: themeConfig.colors.bgSecondary,
            borderRadius: 16,
            padding: 20,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: themeConfig.colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: themeConfig.colors.primary,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>
                {profile?.name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '700',
                  color: themeConfig.colors.textPrimary,
                  marginBottom: 4,
                }}
              >
                {profile?.name || 'User'}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: themeConfig.colors.textSecondary,
                }}
              >
                {user?.email}
              </Text>
            </View>
          </View>
        </View>

        {/* Theme Section */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: themeConfig.colors.textSecondary,
            marginBottom: 12,
            marginLeft: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Appearance
        </Text>

        <View
          style={{
            backgroundColor: themeConfig.colors.bgSecondary,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: themeConfig.colors.border,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: themeConfig.colors.textPrimary,
              marginBottom: 16,
            }}
          >
            Theme
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {Object.entries(THEMES).map(([name, theme]) => (
              <TouchableOpacity
                key={name}
                onPress={() => handleThemeChange(name as ThemeName)}
                style={{
                  width: '30%',
                  aspectRatio: 1.2,
                  borderRadius: 12,
                  backgroundColor: theme.colors.bgPrimary,
                  borderWidth: 3,
                  borderColor:
                    currentTheme === name ? theme.colors.primary : theme.colors.border,
                  overflow: 'hidden',
                  justifyContent: 'flex-end',
                  padding: 8,
                }}
              >
                <View
                  style={{
                    height: 6,
                    backgroundColor: theme.colors.primary,
                    borderRadius: 3,
                    marginBottom: 4,
                  }}
                />
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '600',
                    color: theme.colors.textPrimary,
                    textTransform: 'capitalize',
                  }}
                >
                  {name}
                </Text>
                {currentTheme === name && (
                  <View
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: theme.colors.primary,
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Ionicons name="checkmark" size={14} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Notifications Section */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: themeConfig.colors.textSecondary,
            marginBottom: 12,
            marginLeft: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          Notifications
        </Text>

        <View
          style={{
            backgroundColor: themeConfig.colors.bgSecondary,
            borderRadius: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: themeConfig.colors.border,
            overflow: 'hidden',
          }}
        >
          <SettingsRow
            themeConfig={themeConfig}
            icon="notifications-outline"
            iconColor="#3B82F6"
            label="Push Notifications"
            description="Get reminded about your habits"
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: themeConfig.colors.border, true: themeConfig.colors.primary }}
                thumbColor="#fff"
              />
            }
          />
          <View style={{ height: 1, backgroundColor: themeConfig.colors.border, marginLeft: 56 }} />
          <SettingsRow
            themeConfig={themeConfig}
            icon="mail-outline"
            iconColor="#10B981"
            label="Weekly Email Reports"
            description="Receive progress summary every week"
            rightElement={
              <Switch
                value={emailReportsEnabled}
                onValueChange={handleToggleEmailReports}
                trackColor={{ false: themeConfig.colors.border, true: themeConfig.colors.primary }}
                thumbColor="#fff"
              />
            }
          />
        </View>

        {/* About Section */}
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: themeConfig.colors.textSecondary,
            marginBottom: 12,
            marginLeft: 4,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          About
        </Text>

        <View
          style={{
            backgroundColor: themeConfig.colors.bgSecondary,
            borderRadius: 16,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: themeConfig.colors.border,
            overflow: 'hidden',
          }}
        >
          <SettingsRow
            themeConfig={themeConfig}
            icon="information-circle-outline"
            iconColor="#8B5CF6"
            label="Version"
            rightElement={
              <Text style={{ color: themeConfig.colors.textSecondary, fontSize: 15 }}>
                1.0.0
              </Text>
            }
          />
          <View style={{ height: 1, backgroundColor: themeConfig.colors.border, marginLeft: 56 }} />
          <SettingsRow
            themeConfig={themeConfig}
            icon="heart-outline"
            iconColor="#EF4444"
            label="Rate HabitFlow"
            showChevron
            onPress={() => Alert.alert('Coming Soon', 'App store rating will be available after release.')}
          />
          <View style={{ height: 1, backgroundColor: themeConfig.colors.border, marginLeft: 56 }} />
          <SettingsRow
            themeConfig={themeConfig}
            icon="help-circle-outline"
            iconColor="#F59E0B"
            label="Help & Support"
            showChevron
            onPress={() => Alert.alert('Help', 'Contact us at support@habitflow.app')}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          onPress={handleSignOut}
          style={{
            backgroundColor: '#EF444420',
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            marginTop: 8,
          }}
        >
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={{ color: '#EF4444', fontSize: 16, fontWeight: '600' }}>
            Sign Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

interface SettingsRowProps {
  themeConfig: any;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  iconColor: string;
  label: string;
  description?: string;
  rightElement?: React.ReactNode;
  showChevron?: boolean;
  onPress?: () => void;
}

function SettingsRow({
  themeConfig,
  icon,
  iconColor,
  label,
  description,
  rightElement,
  showChevron,
  onPress,
}: SettingsRowProps) {
  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        gap: 12,
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          backgroundColor: iconColor + '20',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: '500',
            color: themeConfig.colors.textPrimary,
          }}
        >
          {label}
        </Text>
        {description && (
          <Text
            style={{
              fontSize: 13,
              color: themeConfig.colors.textSecondary,
              marginTop: 2,
            }}
          >
            {description}
          </Text>
        )}
      </View>
      {rightElement}
      {showChevron && (
        <Ionicons name="chevron-forward" size={20} color={themeConfig.colors.textSecondary} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}
