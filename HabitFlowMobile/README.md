# HabitFlow Mobile

A cross-platform mobile app for tracking habits and building better routines. Built with React Native (Expo) and Supabase.

## 🚀 Features

- **Daily Habit Tracking**: Mark habits complete with a single tap
- **Flexible Scheduling**: Daily, weekly, or custom frequency options
- **Streak Tracking**: Stay motivated with streak counters
- **Analytics Dashboard**: View completion rates and progress over time
- **6 Beautiful Themes**: Midnight, Ocean, Forest, Sunset, Lavender, Rose, and Light
- **Cross-Device Sync**: Your data syncs across all devices
- **Offline Support**: Works without internet, syncs when connected
- **Push Notifications**: Optional reminders to complete your habits

## 📱 Platforms

- iOS (iPhone & iPad)
- Android (Phones & Tablets)

## 🛠️ Tech Stack

- **Framework**: React Native with Expo SDK 52
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand with persistence
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Icons**: Ionicons via @expo/vector-icons

## 🏃 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

1. **Install dependencies**:
   ```bash
   cd HabitFlowMobile
   npm install
   ```

2. **Configure Supabase** (Optional - defaults to existing backend):
   
   Create a `.env` file in the project root:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **Start the development server**:
   ```bash
   npx expo start
   ```

4. **Run on device/simulator**:
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app for physical device

## 📁 Project Structure

```
HabitFlowMobile/
├── app/                      # Expo Router screens
│   ├── (auth)/               # Authentication screens
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/               # Main app tabs
│   │   ├── index.tsx         # Today view
│   │   ├── analytics.tsx     # Analytics dashboard
│   │   └── settings.tsx      # Settings
│   └── _layout.tsx           # Root layout
├── src/
│   ├── components/           # Reusable components
│   │   ├── HabitCard.tsx
│   │   └── AddHabitModal.tsx
│   ├── stores/               # Zustand state stores
│   │   ├── authStore.ts
│   │   ├── habitsStore.ts
│   │   └── themeStore.ts
│   ├── constants/            # Theme definitions
│   │   └── themes.ts
│   ├── lib/                  # Utilities
│   │   └── supabase.ts
│   └── types/                # TypeScript types
│       └── index.ts
└── assets/                   # Images and fonts
```

## 🎨 Themes

The app includes 7 beautiful themes:

| Theme | Primary Color | Dark Mode |
|-------|--------------|-----------|
| Midnight | Indigo (#6366f1) | ✅ |
| Ocean | Sky Blue (#0ea5e9) | ✅ |
| Forest | Emerald (#10b981) | ✅ |
| Sunset | Orange (#f97316) | ✅ |
| Lavender | Purple (#a78bfa) | ✅ |
| Rose | Pink (#ec4899) | ✅ |
| Light | Indigo (#6366f1) | ❌ |

## 🔐 Authentication

The app uses Supabase Auth with:
- Email/Password authentication
- Password reset via email
- Secure token storage with expo-secure-store
- Automatic session persistence

## 📊 Database Schema

Uses the same Supabase backend as the PWA:

```sql
-- profiles: User settings and preferences
-- habits: User habits with frequency settings
-- completions: Daily completion records
```

## 🚀 Building for Production

### Using EAS Build

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS**:
   ```bash
   eas build:configure
   ```

3. **Build for iOS**:
   ```bash
   eas build --platform ios
   ```

4. **Build for Android**:
   ```bash
   eas build --platform android
   ```

### Environment Variables for Production

Set these as EAS secrets:
```bash
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL --value "https://..."
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "..."
```

## 📄 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

Contributions welcome! Please read the contributing guidelines first.

---

Built with ❤️ using React Native and Expo
