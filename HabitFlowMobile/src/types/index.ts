// TypeScript type definitions for HabitFlow

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  timezone: string;
  notification_enabled: boolean;
  notifications_enabled: boolean;
  email_reports: boolean;
  email_frequency: 'weekly' | 'monthly';
  reminder_time: string;
  theme: ThemeName;
  push_token: string | null;
  last_platform: string | null;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category?: HabitCategory;
  frequency: 'daily' | 'weekly' | 'custom';
  target_days?: number[] | null; // 0-6 for Sunday-Saturday (weekly frequency)
  target_count?: number | null; // Times per week (custom frequency)
  reminder_time?: string | null;
  color?: string;
  icon?: string;
  created_at: string;
  updated_at: string;
}

export interface Completion {
  id: string;
  user_id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  created_at: string;
}

export type HabitCategory = 
  | 'health'
  | 'productivity'
  | 'learning'
  | 'fitness'
  | 'mindfulness'
  | 'social'
  | 'finance'
  | 'creativity'
  | 'other';

export type ThemeName = 
  | 'midnight'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'lavender'
  | 'rose'
  | 'light';

export interface Theme {
  name: string;
  isDark: boolean;
  colors: {
    primary: string;
    primaryDark: string;
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
  };
}

// Analytics types
export interface HabitStats {
  totalCompleted: number;
  totalScheduled: number;
  completionRate: number;
  currentStreak: number;
  bestStreak: number;
}

export interface DailyStats {
  date: string;
  completed: number;
  scheduled: number;
  rate: number;
}

// Form types
export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
}

// Device types
export type DeviceType = 'phone' | 'tablet';

// Filter types for analytics
export type PeriodFilter = 'week' | 'month' | 'quarter' | 'year' | 'all';
