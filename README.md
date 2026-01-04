# 🎯 HabitFlow - Habit Tracker

A modern, production-ready habit tracking web application with real-time sync, beautiful visualizations, and multi-user support.

**Live Demo**: [https://mansoor-stack.github.io/HabitTracker/](https://mansoor-stack.github.io/HabitTracker/)

![HabitFlow](https://img.shields.io/badge/Version-2.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E)

---

## ✨ Features

### Core Functionality
- ✅ **Habit CRUD** - Create, edit, and delete habits with custom icons, colors, and categories
- 📊 **Smart Dashboard** - Real-time stats including streaks, completion rates, and daily progress
- 📈 **Rich Analytics** - Interactive charts with filters (period, category, habit)
- 📅 **Calendar View** - Monthly visualization of habit completions with navigation
- 🔥 **Streak Tracking** - Automatic streak calculation with best streak records
- 📧 **Email Reports** - Weekly/monthly progress reports delivered to your inbox

### User Experience
- 🎨 **6 Beautiful Themes** - Default, Ocean, Forest, Sunset, Midnight, Rose themes
- 🌙 **Dark Mode** - Modern, eye-friendly design with gradient accents
- 📱 **PWA Support** - Install as native app on iOS/Android with offline capability
- 🍔 **Mobile Navigation** - Hamburger menu with smooth sidebar transitions
- ⚡ **Optimistic Updates** - Instant UI feedback with background sync
- 🔔 **Push Notifications** - Daily habit reminders with customizable time
- 💬 **Toast Notifications** - Non-intrusive feedback for all actions
- 👁️ **Password Visibility** - Toggle to show/hide password in auth forms

### Resilience & Reliability
- 🔐 **Secure Authentication** - Email/password auth with password reset flow
- 💾 **Offline Support** - Local queue for changes made offline, auto-sync when back online
- ⏱️ **Timeout Handling** - Graceful recovery from slow/failed network requests
- 🔄 **Session Recovery** - Auto-refresh data after tab inactivity
- 🌐 **Connection Status** - Real-time online/offline indicator

### Analytics & Insights
- 📊 **Progress Bar** - Visual completion percentage with animated gradient
- 🗓️ **Period Filters** - View data by week, month, quarter, year, or all time
- 🏷️ **Category Filters** - Filter analytics by habit category
- 🎯 **Habit Filters** - Drill down to individual habit performance
- 📈 **Dynamic Charts** - Titles and data update based on filter selection

### Accessibility
- ⌨️ **Keyboard Navigation** - Full keyboard support with visible focus states
- 🔗 **Skip Links** - Quick navigation to main content
- 📢 **ARIA Labels** - Screen reader friendly components
- 📱 **iOS Safe Areas** - Proper handling of notch/Dynamic Island

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Vanilla JavaScript (ES6+), HTML5, CSS3 |
| **Charts** | Chart.js |
| **Backend** | Supabase (PostgreSQL + Auth + Realtime) |
| **Hosting** | GitHub Pages |

### File Structure

```
HabitTracker/
├── index.html          # Main HTML with all views and modals
├── styles.css          # Complete styling (~4000 lines)
│                       # - CSS variables for theming (6 themes)
│                       # - Responsive breakpoints
│                       # - PWA safe area handling
│                       # - Analytics filters & progress bar
│                       # - Component styles (toast, dialog, loading)
│
├── config.js           # Supabase configuration
│                       # - Project URL and anon key
│                       # - Client initialization
│
├── utils.js            # Shared utilities and services
│                       # - AppState (singleton state manager)
│                       # - LoadingManager (prevents flicker)
│                       # - Toast system
│                       # - Debounce/throttle helpers
│                       # - Network status manager
│                       # - Date utilities
│
├── auth.js             # Authentication module
│                       # - Sign up / Sign in / Sign out
│                       # - Password reset with dedicated page
│                       # - Password visibility toggle
│                       # - Session health checks
│                       # - Inactivity detection & recovery
│
├── database.js         # Data layer
│                       # - CRUD operations for habits
│                       # - Completion tracking
│                       # - Streak updates
│                       # - Offline queue & sync
│                       # - Timeout wrapper (30s per query)
│
├── notifications.js    # Notifications & Email Reports
│                       # - Push notification system
│                       # - Daily reminder scheduling
│                       # - Email report preferences
│                       # - Report preview generation
│                       # - Test email functionality
│
├── app.js              # Main application logic (~1500 lines)
│                       # - View management
│                       # - Analytics filters & progress bar
│                       # - Theme management (6 themes)
│                       # - Chart initialization with dynamic titles
│                       # - Modal handling
│
├── sw.js               # Service Worker for PWA
│                       # - Offline caching
│                       # - Background sync
│
├── manifest.json       # PWA manifest
│                       # - App icons and splash screens
│                       # - Display and orientation settings
│
├── reset-password.html # Dedicated password reset page
│                       # - Handles Supabase recovery flow
│
├── supabase-schema.sql # Database schema
│                       # - Tables: habits, completions, profiles
│                       # - Row Level Security policies
│                       # - Triggers for profile creation
│
├── supabase-email-reports.sql  # Email reports schema
│                               # - last_report_sent tracking
│                               # - Report stats functions
│
├── supabase/functions/         # Supabase Edge Functions
│   └── send-email-report/      # Email report sender
│       └── index.ts            # - HTML email generation
│                               # - Resend integration
│                               # - Scheduled batch sending
│
└── docs/
    └── EMAIL_REPORTS_SETUP.md  # Email setup guide
```

### Data Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   index.html│────▶│   app.js    │────▶│ database.js │
│   (Views)   │     │  (Logic)    │     │  (Data)     │
└─────────────┘     └─────────────┘     └──────┬──────┘
                           │                    │
                    ┌──────▼──────┐      ┌──────▼──────┐
                    │  auth.js    │      │  Supabase   │
                    │ (Sessions)  │◀────▶│ (Postgres)  │
                    └─────────────┘      └─────────────┘
```

### Key Design Patterns

| Pattern | Usage |
|---------|-------|
| **Singleton** | `AppState` for global state management |
| **Observer** | Event-based state subscriptions |
| **Module** | Each JS file is a self-contained module |
| **Optimistic UI** | Immediate feedback, background sync |
| **Graceful Degradation** | Offline queue, timeout recovery |

---

## 🗄️ Database Schema

### Tables

#### `habits`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `name` | TEXT | Habit name |
| `description` | TEXT | Optional description |
| `category` | TEXT | health, productivity, learning, etc. |
| `frequency` | TEXT | daily, weekly, custom |
| `days` | JSONB | Array of days for custom frequency |
| `color` | TEXT | Hex color for UI |
| `icon` | TEXT | Emoji icon |
| `streak` | INT | Current streak count |
| `best_streak` | INT | All-time best streak |
| `created_at` | TIMESTAMP | Creation timestamp |

#### `completions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | UUID | Foreign key to auth.users |
| `habit_id` | UUID | Foreign key to habits |
| `date` | DATE | Completion date |
| `completed` | BOOLEAN | Completion status |

#### `profiles`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (same as auth.users.id) |
| `name` | TEXT | Display name |
| `email_reports` | BOOLEAN | Email reports enabled |
| `email_frequency` | TEXT | weekly or monthly |
| `reminder_time` | TIME | Daily reminder time |
| `last_report_sent` | TIMESTAMP | Last email report sent |
| `created_at` | TIMESTAMP | Registration timestamp |

### Row Level Security (RLS)

All tables have RLS enabled with policies ensuring users can only:
- **SELECT** their own data
- **INSERT** data with their own `user_id`
- **UPDATE** their own records
- **DELETE** their own records

---

## 🚀 Setup Instructions

### Prerequisites
- A [Supabase](https://supabase.com) account (free tier works great)
- A [GitHub](https://github.com) account for hosting

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon/public key** from Settings → API

### 2. Set Up Database

1. Open **SQL Editor** in Supabase dashboard
2. Paste the contents of `supabase-schema.sql`
3. Click **Run** to create tables, policies, and triggers

### 3. Configure Authentication

1. Go to **Authentication** → **Providers**
2. Ensure **Email** provider is enabled
3. *(Optional)* Disable email confirmation for easier testing:
   - Authentication → Providers → Email → Turn off "Confirm email"

### 4. Update Configuration

Edit `config.js` with your Supabase credentials:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 5. Deploy to GitHub Pages

```bash
# Clone or initialize repository
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/HabitTracker.git
git push -u origin main
```

Then in GitHub:
1. Go to **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / `/ (root)`
4. Save and wait for deployment

### 6. Configure Supabase URLs

In Supabase **Authentication** → **URL Configuration**:
- **Site URL**: `https://YOUR_USERNAME.github.io/HabitTracker`
- **Redirect URLs**: `https://YOUR_USERNAME.github.io/HabitTracker/**`

---

## 📱 Usage Guide

### Getting Started
1. Visit the live site
2. Create an account with email and password
3. Add your first habit using the **+ Add New Habit** button
4. Check off habits daily by clicking the checkbox

### Dashboard
- View today's habits and completion status
- See your current streak and stats
- Quick access to edit habits

### Analytics
- **Period Filters**: Week, Month, Quarter, Year, All Time
- **Category/Habit Filters**: Drill down to specific data
- **Progress Bar**: Visual completion % with animated gradient
- **Weekly Overview**: Bar chart of daily completions
- **Category Distribution**: Pie chart of habit categories
- **Day of Week**: Performance heatmap by weekday
- **Streak Leaderboard**: Top habits by streak

### Settings
- **Theme Selection**: 6 beautiful themes to choose from
- **Push Notifications**: Enable daily reminders
- **Email Reports**: Weekly/monthly progress emails
- **Report Preview**: See what your email report looks like
- **Test Report**: Send a test email to verify setup

### Calendar
- Navigate months with arrow buttons
- Color-coded days based on completion percentage
- Visual habit completion history

---

## 🔧 Customization

### Adding New Categories

1. In `index.html`, add to the category select:
```html
<option value="new-category">🆕 New Category</option>
```

2. In `app.js`, update `getCategoryLabel()`:
```javascript
case 'new-category': return '🆕 New Category';
```

### Changing Theme Colors

The app includes 6 built-in themes. To add a custom theme, edit `styles.css`:

```css
[data-theme="custom"] {
    --primary: #your-color;
    --primary-dark: #darker-variant;
    --bg-primary: #background;
    --bg-secondary: #card-bg;
    /* ... see existing themes for all variables */
}
```

Then add to the theme selector in `index.html`:
```html
<button class="theme-option" data-theme="custom" title="Custom">
    <div class="theme-preview" style="background: linear-gradient(135deg, #color1, #color2)"></div>
</button>
```

### Adding New Icons

In `index.html`, add to the icon picker grid:
```html
<button type="button" class="icon-option" data-icon="🎵">🎵</button>
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "Invalid API Key" | Check `config.js` credentials |
| Email not received | Check spam; disable email confirmation in Supabase |
| Data not saving | Check browser console; verify RLS policies |
| Stuck on loading | Clear browser cache; check network connection |
| CORS errors | Add site URL to Supabase API settings |
| Password reset 404 | Ensure redirect URL includes `/HabitTracker/` path |
| iOS status bar overlap | App uses `env(safe-area-inset-*)` - should auto-fix |
| Email reports not sending | See `docs/EMAIL_REPORTS_SETUP.md` for configuration |

---

## 📊 Supabase Free Tier Limits

| Resource | Limit |
|----------|-------|
| Database | 500 MB |
| Bandwidth | 5 GB/month |
| Auth Users | 50,000 MAU |
| API Requests | Unlimited |

**More than enough for personal use or small teams!**

---

## 🛣️ Roadmap

- [x] Push notifications for habit reminders ✅
- [x] Custom themes and color schemes (6 themes) ✅
- [x] Weekly/monthly reports via email ✅
- [x] Analytics filters (period, category, habit) ✅
- [x] PWA with offline support ✅
- [x] iOS safe area handling ✅
- [x] Password visibility toggle ✅
- [x] Visual progress bar in analytics ✅
- [ ] Social features (share progress, challenges)
- [ ] Data export (CSV, JSON)
- [ ] Habit templates library
- [ ] Habit notes and journaling

---

## 📄 License

MIT License - Free to use, modify, and distribute.

---

## 🙏 Acknowledgments

- [Supabase](https://supabase.com) - Backend infrastructure
- [Chart.js](https://chartjs.org) - Beautiful charts
- [Google Fonts](https://fonts.google.com) - Inter font family

---

**Built with ❤️ for building better habits**
