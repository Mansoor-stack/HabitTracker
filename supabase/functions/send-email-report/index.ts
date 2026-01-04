// Supabase Edge Function: send-email-report
// Sends beautiful HTML email reports to users who have enabled email reports
// Deploy: supabase functions deploy send-email-report --no-verify-jwt

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Email service configuration (using Resend)
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface HabitData {
  id: string;
  name: string;
  icon: string;
  color: string;
  category: string;
  streak: number;
  best_streak: number;
}

interface CompletionData {
  habit_id: string;
  date: string;
}

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  email_reports: boolean;
  email_frequency: string;
  last_report_sent: string | null;
}

interface ReportStats {
  totalHabits: number;
  totalCompleted: number;
  totalScheduled: number;
  completionRate: number;
  bestStreak: number;
  currentStreak: number;
  topHabits: { name: string; icon: string; completions: number; rate: number }[];
  improvementTips: string[];
  periodLabel: string;
  startDate: string;
  endDate: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { userId, isTest } = body;

    // Determine which users to send reports to
    let usersToNotify: UserProfile[] = [];

    if (userId) {
      // Single user request (test or manual trigger)
      const { data: user, error } = await supabase.auth.admin.getUserById(userId);
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (user && profile) {
        usersToNotify.push({
          id: userId,
          name: profile.name,
          email: user.user.email!,
          email_reports: profile.email_reports,
          email_frequency: profile.email_frequency,
          last_report_sent: profile.last_report_sent,
        });
      }
    } else {
      // Batch processing for scheduled job
      const today = new Date();
      const dayOfWeek = today.getDay();
      const dayOfMonth = today.getDate();

      // Get all users with email reports enabled
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email_reports, email_frequency, last_report_sent")
        .eq("email_reports", true);

      if (profilesError) throw profilesError;

      // Get user emails
      for (const profile of profiles || []) {
        const shouldSend = shouldSendReport(profile.email_frequency, dayOfWeek, dayOfMonth, profile.last_report_sent);
        
        if (shouldSend) {
          const { data: userData } = await supabase.auth.admin.getUserById(profile.id);
          if (userData?.user?.email) {
            usersToNotify.push({
              ...profile,
              email: userData.user.email,
            });
          }
        }
      }
    }

    // Send reports to each user
    const results = [];
    for (const user of usersToNotify) {
      try {
        const stats = await generateReportStats(supabase, user.id, user.email_frequency);
        const emailHtml = generateEmailTemplate(user.name || "there", stats);
        
        await sendEmail(user.email, getSubjectLine(stats), emailHtml);

        // Update last_report_sent
        if (!isTest) {
          await supabase
            .from("profiles")
            .update({ last_report_sent: new Date().toISOString() })
            .eq("id", user.id);
        }

        results.push({ userId: user.id, email: user.email, status: "sent" });
      } catch (err) {
        console.error(`Failed to send report to ${user.email}:`, err);
        results.push({ userId: user.id, email: user.email, status: "failed", error: err.message });
      }
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in send-email-report:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function shouldSendReport(frequency: string, dayOfWeek: number, dayOfMonth: number, lastSent: string | null): boolean {
  if (lastSent) {
    const lastSentDate = new Date(lastSent);
    const hoursSinceLastSent = (Date.now() - lastSentDate.getTime()) / (1000 * 60 * 60);
    
    if (frequency === "weekly" && hoursSinceLastSent < 144) return false; // 6 days minimum
    if (frequency === "monthly" && hoursSinceLastSent < 648) return false; // 27 days minimum
  }

  if (frequency === "weekly") {
    return dayOfWeek === 0; // Sunday
  } else if (frequency === "monthly") {
    return dayOfMonth === 1; // First of month
  }
  return false;
}

async function generateReportStats(supabase: any, userId: string, frequency: string): Promise<ReportStats> {
  const endDate = new Date();
  const startDate = new Date();
  
  if (frequency === "monthly") {
    startDate.setDate(startDate.getDate() - 30);
  } else {
    startDate.setDate(startDate.getDate() - 7);
  }

  // Get user's habits
  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", userId);

  // Get completions in date range
  const { data: completions } = await supabase
    .from("completions")
    .select("habit_id, date")
    .eq("user_id", userId)
    .gte("date", startDate.toISOString().split("T")[0])
    .lte("date", endDate.toISOString().split("T")[0]);

  const habitList: HabitData[] = habits || [];
  const completionList: CompletionData[] = completions || [];

  // Calculate stats
  let totalScheduled = 0;
  let totalCompleted = 0;
  const habitCompletions: Map<string, number> = new Map();

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay();

    for (const habit of habitList) {
      if (habit.days?.includes(dayOfWeek) ?? true) {
        totalScheduled++;
        const completed = completionList.some(c => c.habit_id === habit.id && c.date === dateStr);
        if (completed) {
          totalCompleted++;
          habitCompletions.set(habit.id, (habitCompletions.get(habit.id) || 0) + 1);
        }
      }
    }
  }

  const completionRate = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;

  // Top habits by completion
  const topHabits = habitList
    .map(h => ({
      name: h.name,
      icon: h.icon,
      completions: habitCompletions.get(h.id) || 0,
      rate: Math.round(((habitCompletions.get(h.id) || 0) / (frequency === "monthly" ? 30 : 7)) * 100),
    }))
    .sort((a, b) => b.completions - a.completions)
    .slice(0, 5);

  // Best and current streaks
  const bestStreak = habitList.reduce((max, h) => Math.max(max, h.best_streak || 0), 0);
  const currentStreak = habitList.reduce((max, h) => Math.max(max, h.streak || 0), 0);

  // Generate improvement tips
  const improvementTips = generateImprovementTips(completionRate, topHabits, habitList.length);

  return {
    totalHabits: habitList.length,
    totalCompleted,
    totalScheduled,
    completionRate,
    bestStreak,
    currentStreak,
    topHabits,
    improvementTips,
    periodLabel: frequency === "monthly" ? "Last 30 Days" : "Last 7 Days",
    startDate: startDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    endDate: endDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
  };
}

function generateImprovementTips(rate: number, topHabits: any[], habitCount: number): string[] {
  const tips: string[] = [];

  if (rate >= 90) {
    tips.push("🏆 Outstanding! You're crushing it! Keep up the amazing consistency.");
  } else if (rate >= 70) {
    tips.push("💪 Great progress! Try focusing on your morning routine for even better results.");
  } else if (rate >= 50) {
    tips.push("📈 Good start! Consider reducing the number of habits to focus on quality over quantity.");
  } else {
    tips.push("🌱 Every step counts! Start with just 1-2 key habits and build from there.");
  }

  if (topHabits.length > 0 && topHabits[0].rate >= 80) {
    tips.push(`⭐ "${topHabits[0].name}" is your strongest habit - use this momentum!`);
  }

  if (habitCount > 7) {
    tips.push("💡 Consider focusing on fewer habits for better consistency.");
  }

  return tips;
}

function getSubjectLine(stats: ReportStats): string {
  if (stats.completionRate >= 90) {
    return `🏆 HabitFlow Report: ${stats.completionRate}% - You're on Fire!`;
  } else if (stats.completionRate >= 70) {
    return `💪 HabitFlow Report: ${stats.completionRate}% - Great Progress!`;
  } else if (stats.completionRate >= 50) {
    return `📈 HabitFlow Report: ${stats.completionRate}% - Keep Going!`;
  } else {
    return `🌱 HabitFlow Report: Your ${stats.periodLabel} Summary`;
  }
}

function generateEmailTemplate(userName: string, stats: ReportStats): string {
  const progressBarColor = stats.completionRate >= 70 ? "#10b981" : stats.completionRate >= 50 ? "#f59e0b" : "#ef4444";
  
  const topHabitsHtml = stats.topHabits.map(h => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb;">
        <span style="font-size: 20px; margin-right: 8px;">${h.icon}</span>
        <span style="color: #374151; font-weight: 500;">${h.name}</span>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        <span style="background: ${h.rate >= 70 ? '#dcfce7' : h.rate >= 50 ? '#fef3c7' : '#fee2e2'}; 
                     color: ${h.rate >= 70 ? '#166534' : h.rate >= 50 ? '#92400e' : '#991b1b'};
                     padding: 4px 12px; border-radius: 20px; font-size: 13px; font-weight: 600;">
          ${h.rate}%
        </span>
      </td>
      <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; text-align: right; color: #6b7280;">
        ${h.completions} done
      </td>
    </tr>
  `).join("");

  const tipsHtml = stats.improvementTips.map(tip => `
    <li style="margin-bottom: 8px; color: #4b5563; line-height: 1.5;">${tip}</li>
  `).join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HabitFlow Report</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 40px 30px; border-radius: 16px 16px 0 0; text-align: center;">
              <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                📊 HabitFlow Report
              </h1>
              <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                ${stats.startDate} - ${stats.endDate}
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background: #ffffff; padding: 0;">
              
              <!-- Greeting -->
              <div style="padding: 30px 30px 20px;">
                <p style="margin: 0; color: #374151; font-size: 16px; line-height: 1.6;">
                  Hey ${userName}! 👋
                </p>
                <p style="margin: 12px 0 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                  Here's your ${stats.periodLabel.toLowerCase()} habit progress summary. Let's see how you did!
                </p>
              </div>

              <!-- Big Progress Circle -->
              <div style="padding: 20px 30px 30px; text-align: center;">
                <div style="display: inline-block; position: relative; width: 160px; height: 160px;">
                  <svg width="160" height="160" viewBox="0 0 160 160">
                    <!-- Background circle -->
                    <circle cx="80" cy="80" r="70" fill="none" stroke="#e5e7eb" stroke-width="12"/>
                    <!-- Progress circle -->
                    <circle cx="80" cy="80" r="70" fill="none" stroke="${progressBarColor}" stroke-width="12"
                            stroke-linecap="round" stroke-dasharray="${stats.completionRate * 4.4} 440"
                            transform="rotate(-90 80 80)"/>
                  </svg>
                  <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
                    <span style="font-size: 42px; font-weight: 700; color: ${progressBarColor};">${stats.completionRate}%</span>
                    <br>
                    <span style="font-size: 13px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px;">Complete</span>
                  </div>
                </div>
              </div>

              <!-- Stats Grid -->
              <div style="padding: 0 30px 30px;">
                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="width: 33.33%; padding: 16px; text-align: center; background: #f9fafb; border-radius: 12px 0 0 12px;">
                      <div style="font-size: 28px; font-weight: 700; color: #6366f1;">${stats.totalCompleted}</div>
                      <div style="font-size: 12px; color: #6b7280; margin-top: 4px; text-transform: uppercase;">Completed</div>
                    </td>
                    <td style="width: 33.33%; padding: 16px; text-align: center; background: #f9fafb; border-left: 2px solid #fff; border-right: 2px solid #fff;">
                      <div style="font-size: 28px; font-weight: 700; color: #f59e0b;">${stats.currentStreak}</div>
                      <div style="font-size: 12px; color: #6b7280; margin-top: 4px; text-transform: uppercase;">Current Streak</div>
                    </td>
                    <td style="width: 33.33%; padding: 16px; text-align: center; background: #f9fafb; border-radius: 0 12px 12px 0;">
                      <div style="font-size: 28px; font-weight: 700; color: #10b981;">${stats.bestStreak}</div>
                      <div style="font-size: 12px; color: #6b7280; margin-top: 4px; text-transform: uppercase;">Best Streak</div>
                    </td>
                  </tr>
                </table>
              </div>

              <!-- Top Habits -->
              ${stats.topHabits.length > 0 ? `
              <div style="padding: 0 30px 30px;">
                <h3 style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">
                  🏅 Top Performing Habits
                </h3>
                <table role="presentation" style="width: 100%; border-collapse: collapse; background: #f9fafb; border-radius: 12px; overflow: hidden;">
                  ${topHabitsHtml}
                </table>
              </div>
              ` : ''}

              <!-- Improvement Tips -->
              <div style="padding: 0 30px 30px;">
                <h3 style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 600;">
                  💡 Insights & Tips
                </h3>
                <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px;">
                  <ul style="margin: 0; padding-left: 20px;">
                    ${tipsHtml}
                  </ul>
                </div>
              </div>

              <!-- CTA Button -->
              <div style="padding: 0 30px 40px; text-align: center;">
                <a href="https://mansoor-stack.github.io/HabitTracker/" 
                   style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
                          color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; 
                          font-weight: 600; font-size: 15px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
                  Open HabitFlow →
                </a>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background: #f9fafb; padding: 24px 30px; border-radius: 0 0 16px 16px; text-align: center;">
              <p style="margin: 0 0 8px; color: #6b7280; font-size: 13px;">
                You're receiving this because you enabled email reports in HabitFlow.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                <a href="https://mansoor-stack.github.io/HabitTracker/" style="color: #6366f1; text-decoration: none;">
                  Manage preferences
                </a>
                &nbsp;•&nbsp;
                © ${new Date().getFullYear()} HabitFlow
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  if (!RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "HabitFlow <noreply@habitflow.app>",
      to: [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send email: ${error}`);
  }
}
