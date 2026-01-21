import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, Platform } from 'react-native';
import 'react-native-reanimated';
import '../global.css';

import { useAuthStore, useThemeStore } from '../src/stores';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(auth)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [appReady, setAppReady] = useState(false);
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  const { initialize, isLoading: authLoading } = useAuthStore();
  const { themeConfig, loadThemeFromServer } = useThemeStore();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Initialize auth on mount
  useEffect(() => {
    const init = async () => {
      try {
        await initialize();
      } catch (e) {
        console.error('Init error:', e);
      } finally {
        setAppReady(true);
      }
    };
    
    // For web, set ready faster
    if (Platform.OS === 'web') {
      setTimeout(() => setAppReady(true), 1000);
    }
    
    init();
  }, []);

  // Load theme from server when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadThemeFromServer();
    }
  }, [isAuthenticated]);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && appReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, appReady]);

  if (!loaded || !appReady) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: themeConfig.colors.bgPrimary,
      }}>
        <ActivityIndicator size="large" color={themeConfig.colors.primary} />
      </View>
    );
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const { isAuthenticated } = useAuthStore();
  const { themeConfig } = useThemeStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthGroup = segments[0] === '(auth)';
    
    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to home if authenticated
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  // Create custom theme based on themeConfig
  const customTheme = themeConfig.isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: themeConfig.colors.primary,
          background: themeConfig.colors.bgPrimary,
          card: themeConfig.colors.bgSecondary,
          text: themeConfig.colors.textPrimary,
          border: themeConfig.colors.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: themeConfig.colors.primary,
          background: themeConfig.colors.bgPrimary,
          card: themeConfig.colors.bgSecondary,
          text: themeConfig.colors.textPrimary,
          border: themeConfig.colors.border,
        },
      };

  return (
    <ThemeProvider value={customTheme}>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      </Stack>
    </ThemeProvider>
  );
}
