-- ============================================
-- Email Reports Schema Update for HabitFlow
-- Run this in the Supabase SQL Editor
-- ============================================

-- Add last_report_sent column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS last_report_sent TIMESTAMP WITH TIME ZONE;

-- Create index for efficient email report queries
CREATE INDEX IF NOT EXISTS idx_profiles_email_reports 
ON profiles(email_reports) 
WHERE email_reports = true;

-- ============================================
-- Function to get users due for email reports
-- Used by the scheduled job
-- ============================================
CREATE OR REPLACE FUNCTION get_users_due_for_reports()
RETURNS TABLE (
    user_id UUID,
    email TEXT,
    name TEXT,
    email_frequency TEXT,
    last_report_sent TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today_dow INTEGER := EXTRACT(DOW FROM CURRENT_DATE);
    today_dom INTEGER := EXTRACT(DAY FROM CURRENT_DATE);
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        u.email,
        p.name,
        p.email_frequency,
        p.last_report_sent
    FROM profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE p.email_reports = true
    AND (
        -- Weekly: Send on Sundays (DOW = 0)
        (p.email_frequency = 'weekly' AND today_dow = 0 AND (
            p.last_report_sent IS NULL 
            OR p.last_report_sent < CURRENT_DATE - INTERVAL '6 days'
        ))
        OR
        -- Monthly: Send on 1st of month
        (p.email_frequency = 'monthly' AND today_dom = 1 AND (
            p.last_report_sent IS NULL 
            OR p.last_report_sent < CURRENT_DATE - INTERVAL '27 days'
        ))
    );
END;
$$;

-- ============================================
-- Function to generate report statistics for a user
-- Can be called from frontend for preview
-- ============================================
CREATE OR REPLACE FUNCTION get_user_report_stats(
    p_user_id UUID,
    p_frequency TEXT DEFAULT 'weekly'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_start_date DATE;
    v_end_date DATE := CURRENT_DATE;
    v_total_habits INTEGER;
    v_total_completed INTEGER := 0;
    v_total_scheduled INTEGER := 0;
    v_best_streak INTEGER := 0;
    v_current_streak INTEGER := 0;
    v_completion_rate INTEGER;
    v_result JSON;
BEGIN
    -- Calculate date range
    IF p_frequency = 'monthly' THEN
        v_start_date := v_end_date - INTERVAL '30 days';
    ELSE
        v_start_date := v_end_date - INTERVAL '7 days';
    END IF;
    
    -- Get habit count
    SELECT COUNT(*) INTO v_total_habits
    FROM habits
    WHERE user_id = p_user_id;
    
    -- Get best and current streaks
    SELECT 
        COALESCE(MAX(best_streak), 0),
        COALESCE(MAX(streak), 0)
    INTO v_best_streak, v_current_streak
    FROM habits
    WHERE user_id = p_user_id;
    
    -- Count completions in date range
    SELECT COUNT(*) INTO v_total_completed
    FROM completions
    WHERE user_id = p_user_id
    AND date BETWEEN v_start_date AND v_end_date;
    
    -- Estimate scheduled (simplified - assumes daily habits)
    v_total_scheduled := v_total_habits * (v_end_date - v_start_date + 1);
    
    -- Calculate completion rate
    IF v_total_scheduled > 0 THEN
        v_completion_rate := ROUND((v_total_completed::NUMERIC / v_total_scheduled) * 100);
    ELSE
        v_completion_rate := 0;
    END IF;
    
    -- Build result JSON
    v_result := json_build_object(
        'totalHabits', v_total_habits,
        'totalCompleted', v_total_completed,
        'totalScheduled', v_total_scheduled,
        'completionRate', v_completion_rate,
        'bestStreak', v_best_streak,
        'currentStreak', v_current_streak,
        'startDate', v_start_date,
        'endDate', v_end_date,
        'periodLabel', CASE WHEN p_frequency = 'monthly' THEN 'Last 30 Days' ELSE 'Last 7 Days' END
    );
    
    RETURN v_result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_report_stats TO authenticated;

-- ============================================
-- Enable pg_cron extension for scheduled jobs
-- Note: This requires Supabase Pro plan or self-hosted
-- ============================================

-- Uncomment below if you have pg_cron available:
/*
-- Enable the pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create scheduled job to trigger email reports
-- Runs daily at 8:00 AM UTC
SELECT cron.schedule(
    'send-email-reports',
    '0 8 * * *',  -- Every day at 8:00 AM UTC
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email-report',
        headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);
*/

-- ============================================
-- Alternative: Use Supabase Database Webhooks
-- Configure in Supabase Dashboard > Database > Webhooks
-- ============================================
