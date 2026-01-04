# Email Reports Setup Guide for HabitFlow

This guide explains how to set up and deploy the email reporting system for HabitFlow.

## Overview

The email reporting system consists of:
1. **Supabase Edge Function** - Generates and sends HTML email reports
2. **Database Schema Updates** - Tracks when reports were last sent
3. **Email Service (Resend)** - Delivers the actual emails
4. **Scheduled Trigger** - Automatically sends reports weekly/monthly

---

## Step 1: Update Database Schema

Run the SQL script in your Supabase SQL Editor:

```sql
-- Run the contents of supabase-email-reports.sql
```

This adds:
- `last_report_sent` column to `profiles` table
- Helper functions for report generation

---

## Step 2: Set Up Email Service (Resend)

### 2.1 Create Resend Account
1. Go to [resend.com](https://resend.com) and create a free account
2. Verify your email domain (or use their test domain for development)
3. Get your API key from the dashboard

### 2.2 Add Domain (Production)
For production, add and verify your domain:
1. Go to Resend Dashboard → Domains
2. Add your domain (e.g., `habitflow.app`)
3. Add the DNS records shown (SPF, DKIM, etc.)
4. Wait for verification (usually 24-48 hours)

### 2.3 Alternative: Use Resend's Test Domain
For testing, you can send from `onboarding@resend.dev` but only to your own verified email.

---

## Step 3: Deploy Supabase Edge Function

### 3.1 Install Supabase CLI
```bash
npm install -g supabase
```

### 3.2 Login to Supabase
```bash
supabase login
```

### 3.3 Link Your Project
```bash
cd "Habit Tracker Website"
supabase link --project-ref YOUR_PROJECT_REF
```

### 3.4 Set Secrets
```bash
# Set the Resend API key
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxx
```

### 3.5 Deploy the Function
```bash
supabase functions deploy send-email-report --no-verify-jwt
```

---

## Step 4: Set Up Scheduled Trigger

### Option A: Using Supabase pg_cron (Pro Plan)

Add this to your database:
```sql
-- Enable pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily check at 8 AM UTC
SELECT cron.schedule(
    'send-email-reports',
    '0 8 * * *',
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email-report',
        headers := '{"Authorization": "Bearer YOUR_ANON_KEY", "Content-Type": "application/json"}'::jsonb,
        body := '{}'::jsonb
    );
    $$
);
```

### Option B: Using External Cron Service (Free)

Use services like:
- **cron-job.org** (free)
- **GitHub Actions** (free)
- **Vercel Cron** (free with Vercel)

Example GitHub Actions workflow (`.github/workflows/send-reports.yml`):
```yaml
name: Send Email Reports

on:
  schedule:
    # Run every day at 8:00 AM UTC
    - cron: '0 8 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  send-reports:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Email Reports
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email-report
```

---

## Step 5: Test the Integration

### 5.1 Test via UI
1. Open HabitFlow settings
2. Enable "Email Reports"
3. Click "Send Test Report to My Email"
4. Check your inbox (and spam folder)

### 5.2 Test via cURL
```bash
curl -X POST \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "YOUR_USER_ID", "isTest": true}' \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email-report
```

---

## Configuration

### Update Email Sender Address

In `supabase/functions/send-email-report/index.ts`, update:
```typescript
from: "HabitFlow <noreply@your-domain.com>",
```

### Customize Email Template

The email template is in the `generateEmailTemplate()` function. Customize:
- Colors and branding
- Content sections
- Footer text and links

---

## Troubleshooting

### Emails Not Sending
1. Check Resend dashboard for failed deliveries
2. Verify the `RESEND_API_KEY` secret is set correctly
3. Check Supabase function logs: `supabase functions logs send-email-report`

### Emails Going to Spam
1. Verify your domain with Resend
2. Add SPF and DKIM records
3. Use a recognizable "from" address

### Function Errors
```bash
# View function logs
supabase functions logs send-email-report --tail
```

---

## Email Report Features

The email report includes:
- **Progress Circle** - Visual completion percentage
- **Stats Grid** - Completed count, current streak, best streak
- **Top Habits** - Best performing habits with completion rates
- **Insights & Tips** - Personalized improvement suggestions
- **CTA Button** - Link back to HabitFlow app

### Report Frequency
- **Weekly**: Sent every Sunday, covering the last 7 days
- **Monthly**: Sent on the 1st of each month, covering the last 30 days

---

## Cost Considerations

| Service | Free Tier | Paid |
|---------|-----------|------|
| Resend | 100 emails/day, 3,000/month | $20/mo for 50k |
| Supabase Functions | 500k invocations/month | Included in Pro |
| pg_cron | Pro plan only | Included in Pro |

For most apps, the free tier is sufficient.

---

## Security Notes

1. The edge function uses service role key (server-side only)
2. Test reports require authenticated user
3. Scheduled jobs use anon key (safe for trigger-only)
4. User preferences are stored securely in Supabase
