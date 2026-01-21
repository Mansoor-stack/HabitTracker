# HabitFlow Mobile - Quick Start Script
# This script starts the dev server and opens the app on Android emulator instantly

Write-Host "Starting HabitFlow Mobile..." -ForegroundColor Cyan

# Set environment variables
$env:JAVA_HOME = "$env:ProgramFiles\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

# Start Metro bundler (this will use the already-built APK - no rebuild needed!)
npx expo start --dev-client
