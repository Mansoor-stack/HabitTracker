// Environment configuration
// In production, these should be set via EAS secrets or environment variables

export const ENV = {
  // Supabase Configuration
  // Replace these with your actual Supabase project credentials
  SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co',
  SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key',
  
  // App Configuration
  APP_NAME: 'HabitFlow',
  APP_VERSION: '1.0.0',
  
  // Feature Flags
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_EMAIL_REPORTS: true,
  
  // Debug
  IS_DEV: __DEV__,
};

export default ENV;
