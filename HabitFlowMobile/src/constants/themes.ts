// Theme definitions for HabitFlow
import { Theme, ThemeName } from '../types';

export const THEMES: Record<ThemeName, Theme> = {
  midnight: {
    name: 'Midnight',
    isDark: true,
    colors: {
      primary: '#6366f1',
      primaryDark: '#4f46e5',
      bgPrimary: '#0f0f1a',
      bgSecondary: '#1a1a2e',
      bgTertiary: '#252542',
      textPrimary: '#ffffff',
      textSecondary: '#a0a0b8',
      textMuted: '#6b6b80',
      border: '#2d2d4a',
    },
  },
  ocean: {
    name: 'Ocean',
    isDark: true,
    colors: {
      primary: '#0ea5e9',
      primaryDark: '#0284c7',
      bgPrimary: '#0c1929',
      bgSecondary: '#132f4c',
      bgTertiary: '#1a3a5c',
      textPrimary: '#ffffff',
      textSecondary: '#94a3b8',
      textMuted: '#64748b',
      border: '#1e4976',
    },
  },
  forest: {
    name: 'Forest',
    isDark: true,
    colors: {
      primary: '#10b981',
      primaryDark: '#059669',
      bgPrimary: '#0f1a14',
      bgSecondary: '#1a2e23',
      bgTertiary: '#254235',
      textPrimary: '#ffffff',
      textSecondary: '#9ca3af',
      textMuted: '#6b7280',
      border: '#2d4a3a',
    },
  },
  sunset: {
    name: 'Sunset',
    isDark: true,
    colors: {
      primary: '#f97316',
      primaryDark: '#ea580c',
      bgPrimary: '#1a120f',
      bgSecondary: '#2e1f1a',
      bgTertiary: '#422c25',
      textPrimary: '#ffffff',
      textSecondary: '#d4a574',
      textMuted: '#8b6b4a',
      border: '#4a3228',
    },
  },
  rose: {
    name: 'Rose',
    isDark: true,
    colors: {
      primary: '#ec4899',
      primaryDark: '#db2777',
      bgPrimary: '#1a0f14',
      bgSecondary: '#2e1a23',
      bgTertiary: '#422535',
      textPrimary: '#ffffff',
      textSecondary: '#d4a0b8',
      textMuted: '#8b6b7a',
      border: '#4a2838',
    },
  },
  lavender: {
    name: 'Lavender',
    isDark: true,
    colors: {
      primary: '#a78bfa',
      primaryDark: '#8b5cf6',
      bgPrimary: '#1a1625',
      bgSecondary: '#2d2640',
      bgTertiary: '#3d355a',
      textPrimary: '#ffffff',
      textSecondary: '#c4b5fd',
      textMuted: '#8b7bb8',
      border: '#4c4270',
    },
  },
  light: {
    name: 'Light',
    isDark: false,
    colors: {
      primary: '#6366f1',
      primaryDark: '#4f46e5',
      bgPrimary: '#ffffff',
      bgSecondary: '#f8fafc',
      bgTertiary: '#f1f5f9',
      textPrimary: '#1e293b',
      textSecondary: '#475569',
      textMuted: '#94a3b8',
      border: '#e2e8f0',
    },
  },
};

export const HABIT_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#0ea5e9', // Sky
  '#3b82f6', // Blue
];

export const HABIT_ICONS = [
  '💪', '🏃', '📚', '💧', '🧘', '😴', '🥗', '💊',
  '✍️', '🎯', '💻', '🎨', '🎵', '🌱', '🧠', '❤️',
  '🏋️', '🚶', '🧹', '📱', '💰', '🙏', '☀️', '🌙',
];

export const HABIT_CATEGORIES = [
  { value: 'health', label: '🏥 Health', icon: '🏥' },
  { value: 'productivity', label: '⚡ Productivity', icon: '⚡' },
  { value: 'learning', label: '📚 Learning', icon: '📚' },
  { value: 'fitness', label: '🏋️ Fitness', icon: '🏋️' },
  { value: 'mindfulness', label: '🧘 Mindfulness', icon: '🧘' },
  { value: 'social', label: '👥 Social', icon: '👥' },
  { value: 'finance', label: '💰 Finance', icon: '💰' },
  { value: 'creativity', label: '🎨 Creativity', icon: '🎨' },
  { value: 'other', label: '📌 Other', icon: '📌' },
] as const;

export const WEEKDAYS = [
  { value: 0, label: 'Sun', short: 'S' },
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
];
