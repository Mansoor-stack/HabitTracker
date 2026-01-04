-- ============================================
-- Supabase Database Schema for HabitFlow
-- Run this in the Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- HABITS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS habits (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL DEFAULT 'other',
    frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
    days INTEGER[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
    color VARCHAR(20) NOT NULL DEFAULT '#6366f1',
    icon VARCHAR(10) NOT NULL DEFAULT '💪',
    streak INTEGER DEFAULT 0,
    best_streak INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- COMPLETIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS completions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    habit_id UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    completed BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    
    -- Ensure one completion per habit per day per user
    UNIQUE(user_id, habit_id, date)
);

-- ============================================
-- USER PROFILES TABLE (Optional - for extended user data)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name VARCHAR(255),
    avatar_url TEXT,
    timezone VARCHAR(50) DEFAULT 'UTC',
    notification_enabled BOOLEAN DEFAULT true,
    email_reports BOOLEAN DEFAULT false,
    email_frequency VARCHAR(20) DEFAULT 'weekly',
    reminder_time TIME DEFAULT '09:00:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_user_id ON completions(user_id);
CREATE INDEX IF NOT EXISTS idx_completions_habit_id ON completions(habit_id);
CREATE INDEX IF NOT EXISTS idx_completions_date ON completions(date);
CREATE INDEX IF NOT EXISTS idx_completions_user_date ON completions(user_id, date);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Habits policies
CREATE POLICY "Users can view own habits" ON habits
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own habits" ON habits
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own habits" ON habits
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own habits" ON habits
    FOR DELETE USING (auth.uid() = user_id);

-- Completions policies
CREATE POLICY "Users can view own completions" ON completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own completions" ON completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own completions" ON completions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions" ON completions
    FOR DELETE USING (auth.uid() = user_id);

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for habits table
CREATE TRIGGER update_habits_updated_at
    BEFORE UPDATE ON habits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for profiles table
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO profiles (id, name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'name');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================
-- HELPFUL VIEWS (Optional)
-- ============================================

-- View for habit statistics
CREATE OR REPLACE VIEW habit_stats AS
SELECT 
    h.id,
    h.user_id,
    h.name,
    h.streak,
    h.best_streak,
    COUNT(c.id) as total_completions,
    COUNT(CASE WHEN c.date >= CURRENT_DATE - INTERVAL '30 days' THEN 1 END) as last_30_days
FROM habits h
LEFT JOIN completions c ON h.id = c.habit_id AND c.completed = true
GROUP BY h.id, h.user_id, h.name, h.streak, h.best_streak;
