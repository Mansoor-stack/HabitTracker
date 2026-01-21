// Theme Store - Manages app theme with cross-device sync
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { ThemeName, Theme } from '../types';
import { THEMES } from '../constants/themes';

interface ThemeState {
  currentTheme: ThemeName;
  themeConfig: Theme;
  
  // Actions
  setTheme: (theme: ThemeName, syncToServer?: boolean) => Promise<void>;
  loadThemeFromServer: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: 'midnight',
      themeConfig: THEMES.midnight,

      setTheme: async (themeName: ThemeName, syncToServer = true) => {
        const themeConfig = THEMES[themeName] || THEMES.midnight;
        
        set({ 
          currentTheme: themeName,
          themeConfig,
        });
        
        // Sync to server if authenticated
        if (syncToServer) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await supabase
                .from('profiles')
                .update({ 
                  theme: themeName,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);
            }
          } catch (error) {
            console.error('Failed to sync theme to server:', error);
          }
        }
      },

      loadThemeFromServer: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const { data, error } = await supabase
            .from('profiles')
            .select('theme')
            .eq('id', user.id)
            .single();
          
          if (error) throw error;
          
          if (data?.theme && THEMES[data.theme as ThemeName]) {
            await get().setTheme(data.theme as ThemeName, false);
          }
        } catch (error) {
          console.error('Failed to load theme from server:', error);
        }
      },
    }),
    {
      name: 'habitflow-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ currentTheme: state.currentTheme }),
    }
  )
);
