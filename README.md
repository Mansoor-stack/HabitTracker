# 🎯 HabitFlow - Habit Tracker

A modern, production-ready habit tracking web application with real-time sync, beautiful visualizations, and multi-user support.

**Live Demo**: [https://mansoor-stack.github.io/HabitTracker/](https://mansoor-stack.github.io/HabitTracker/)

![HabitFlow](https://img.shields.io/badge/Version-2.0-blue) ![License](https://img.shields.io/badge/License-MIT-green) ![Supabase](https://img.shields.io/badge/Backend-Supabase-3ECF8E)

---

## ✨ Features

### Core Functionality
- ✅ **Habit CRUD** - Create, edit, and delete habits with custom icons, colors, and categories
- 📊 **Smart Dashboard** - Real-time stats including streaks, completion rates, and daily progress
- 📈 **Rich Analytics** - Interactive charts (weekly trends, category distribution, monthly heatmaps)
- 📅 **Calendar View** - Monthly visualization of habit completions with navigation
- 🔥 **Streak Tracking** - Automatic streak calculation with best streak records

### User Experience
- 🌙 **Dark Theme** - Modern, eye-friendly design with gradient accents
- 📱 **Fully Responsive** - Optimized for desktop, tablet, and mobile devices
- 🍔 **Mobile Navigation** - Hamburger menu with smooth sidebar transitions
- ⚡ **Optimistic Updates** - Instant UI feedback with background sync
- 🔔 **Toast Notifications** - Non-intrusive feedback for all actions
- 💬 **Confirm Dialogs** - Safe deletion with custom confirmation modals

### Resilience & Reliability
- 🔐 **Secure Authentication** - Email/password auth with session management
- 💾 **Offline Support** - Local queue for changes made offline, auto-sync when back online
- ⏱️ **Timeout Handling** - Graceful recovery from slow/failed network requests
- 🔄 **Session Recovery** - Auto-refresh data after tab inactivity
- 🌐 **Connection Status** - Real-time online/offline indicator

### Accessibility
- ⌨️ **Keyboard Navigation** - Full keyboard support with visible focus states
- 🔗 **Skip Links** - Quick navigation to main content
- 📢 **ARIA Labels** - Screen reader friendly components
- 🎨 **High Contrast** - Clear visual hierarchy and readable text

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
├── styles.css          # Complete styling (~2000 lines)
│                       # - CSS variables for theming
│                       # - Responsive breakpoints
│                       # - Component styles (toast, dialog, loading)
│                       # - Animations and transitions
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
│                       # - Error handler
│                       # - Network status manager
│                       # - LocalStorage manager (quota handling)
│                       # - Date utilities
│                       # - Validation utilities
│
├── auth.js             # Authentication module
│                       # - Sign up / Sign in / Sign out
│                       # - Password reset
│                       # - Session health checks
│                       # - Visibility change handling
│                       # - Inactivity detection & recovery
│
├── database.js         # Data layer
│                       # - CRUD operations for habits
│                       # - Completion tracking
│                       # - Streak updates
│                       # - Offline queue & sync
│                       # - Timeout wrapper (30s per query)
│                       # - Max loading cap (60s with recovery)
│                       # - Session state persistence
│
├── app.js              # Main application logic (~1300 lines)
│                       # - View management (dashboard/habits/analytics/calendar)
│                       # - Habit rendering and interactions
│                       # - Chart initialization and updates
│                       # - Modal handling
│                       # - Connection status UI
│                       # - Loading overlay with progress
│
├── supabase-schema.sql # Database schema
│                       # - Tables: habits, completions, profiles
│                       # - Row Level Security policies
│                       # - Triggers for profile creation
│
└── README.md           # This file
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
| `email` | TEXT | Email address |
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
- **Weekly Overview**: Bar chart of last 7 days
- **Category Distribution**: Pie chart of habit categories
- **Monthly Trend**: Line chart of monthly completions
- **Day of Week**: Performance by weekday

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

Edit CSS variables in `styles.css`:
```css
:root {
    --primary: #6366f1;      /* Main accent color */
    --primary-dark: #4f46e5; /* Darker variant */
    --success: #10b981;      /* Completion color */
    --bg-primary: #0f0f1a;   /* Background */
    /* ... */
}
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
- [x] Custom themes and color schemes ✅
- [x] Weekly/monthly reports via email ✅
- [ ] Social features (share progress, challenges)
- [ ] Data export (CSV, JSON)
- [ ] Habit templates library

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
