# HabitFlow - Habit Tracker

A beautiful, multi-user habit tracking application with dashboards and analytics.

![HabitFlow Preview](https://via.placeholder.com/800x400?text=HabitFlow+Habit+Tracker)

## Features

- 🔐 **User Authentication** - Secure login/signup with email
- ✅ **Habit Tracking** - Add, edit, and track daily habits
- 📊 **Dashboard** - Overview of your progress with stats
- 📈 **Analytics** - Charts, heatmaps, and streak tracking
- 📅 **Calendar View** - Monthly view of completions
- 🌙 **Dark Theme** - Modern, eye-friendly design
- 📱 **Responsive** - Works on desktop and mobile

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript
- **Backend/Database**: Supabase (PostgreSQL)
- **Charts**: Chart.js
- **Hosting**: GitHub Pages

---

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and sign up/login
2. Click **"New Project"**
3. Enter a project name (e.g., "habitflow")
4. Set a secure database password
5. Select a region close to your users
6. Click **"Create new project"**

### 2. Set Up the Database

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **"New Query"**
3. Copy the entire contents of `supabase-schema.sql`
4. Paste it into the SQL editor
5. Click **"Run"** to create all tables and policies

### 3. Configure Authentication

1. In Supabase, go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. (Optional) Configure email templates under **Authentication** → **Email Templates**
4. (Optional) Add your custom domain under **Authentication** → **URL Configuration**

### 4. Get Your API Keys

1. Go to **Settings** → **API**
2. Copy your:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)

### 5. Configure the Application

1. Open `config.js`
2. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key-here';
```

### 6. Deploy to GitHub Pages

1. Create a new GitHub repository
2. Push your code:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/habitflow.git
git push -u origin main
```

3. Go to your repository **Settings** → **Pages**
4. Under "Source", select **"Deploy from a branch"**
5. Choose `main` branch and `/ (root)` folder
6. Click **Save**
7. Your site will be live at `https://YOUR_USERNAME.github.io/habitflow/`

### 7. Update Supabase URL Configuration

1. In Supabase, go to **Authentication** → **URL Configuration**
2. Add your GitHub Pages URL to:
   - **Site URL**: `https://YOUR_USERNAME.github.io/habitflow`
   - **Redirect URLs**: `https://YOUR_USERNAME.github.io/habitflow/**`

---

## File Structure

```
habitflow/
├── index.html          # Main HTML file
├── styles.css          # All styles
├── config.js           # Supabase configuration (update this!)
├── auth.js             # Authentication logic
├── database.js         # Database operations
├── app.js              # Main application logic
├── supabase-schema.sql # Database schema (run in Supabase)
└── README.md           # This file
```

---

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `habits` | Stores user habits with settings |
| `completions` | Tracks daily habit completions |
| `profiles` | User profile information |

### Row Level Security

All tables have RLS enabled, ensuring users can only access their own data.

---

## Usage

### For Users

1. Visit your hosted site
2. Create an account with email/password
3. Add your first habit
4. Check off habits daily
5. Track your progress in Analytics

### For Administrators

- Monitor usage in Supabase Dashboard → **Database**
- View authentication stats in **Authentication** → **Users**
- Check API usage in **Settings** → **API**

---

## Customization

### Adding More Icons

Edit the icon picker in `index.html`:

```html
<button type="button" class="icon-option" data-icon="🎵">🎵</button>
```

### Changing Colors

Edit CSS variables in `styles.css`:

```css
:root {
    --primary: #6366f1;
    --success: #10b981;
    /* ... */
}
```

### Adding Categories

1. Update the select options in `index.html`
2. Update `getCategoryLabel()` in `app.js`
3. Add filter tab in habits view

---

## Troubleshooting

### "Invalid API Key" Error
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `config.js`
- Make sure there are no extra spaces or quotes

### Email Confirmation Not Received
- Check spam folder
- In Supabase: **Authentication** → **Providers** → **Email** → Disable "Confirm email"

### Data Not Saving
- Check browser console for errors
- Verify RLS policies are set up correctly
- Ensure user is authenticated

### CORS Errors
- Add your site URL to Supabase: **Settings** → **API** → **CORS allowed origins**

---

## Free Tier Limits (Supabase)

- ✅ 500MB Database
- ✅ 5GB Bandwidth
- ✅ 50,000 Monthly Active Users
- ✅ Unlimited API Requests

**Perfect for 5 users!**

---

## License

MIT License - Feel free to use and modify!

---

## Support

For issues or questions:
1. Check the [Supabase Documentation](https://supabase.com/docs)
2. Open an issue on GitHub
