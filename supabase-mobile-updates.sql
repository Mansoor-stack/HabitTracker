-- ============================================
-- Mobile App Schema Updates for HabitFlow
-- Run this in the Supabase SQL Editor
-- ============================================

-- Add theme column to profiles for cross-device sync
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'midnight';

-- Add device token for push notifications
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Add platform info for device tracking
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_platform VARCHAR(20);

-- Create index for faster theme lookups
CREATE INDEX IF NOT EXISTS idx_profiles_theme ON profiles(theme);

-- ============================================
-- Update profiles RLS to allow theme updates
-- (Already covered by existing "Users can update own profile" policy)
-- ============================================

-- ============================================
-- Function to update user theme (with sync timestamp)
-- ============================================
CREATE OR REPLACE FUNCTION update_user_theme(p_theme VARCHAR(20))
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles 
    SET theme = p_theme, 
        updated_at = NOW()
    WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION update_user_theme TO authenticated;

-- ============================================
-- Function to register push notification token
-- ============================================
CREATE OR REPLACE FUNCTION register_push_token(
    p_token TEXT,
    p_platform VARCHAR(20) DEFAULT 'unknown'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE profiles 
    SET push_token = p_token,
        last_platform = p_platform,
        updated_at = NOW()
    WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION register_push_token TO authenticated;

-- ============================================
-- Verify the updates
-- ============================================
-- Run this to check columns were added:
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'profiles';
