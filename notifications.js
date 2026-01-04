// ============================================
// Notifications & Reminders Module
// ============================================

// Notification state
let notificationPermission = 'default';
let scheduledReminders = [];
let notificationSettings = {
    enabled: false,
    reminderTime: '09:00',
    reminderDays: [0, 1, 2, 3, 4, 5, 6], // All days
    emailReports: false,
    emailFrequency: 'weekly' // 'weekly' or 'monthly'
};

// ============================================
// Push Notification System
// ============================================

async function initializeNotifications() {
    // Check if notifications are supported
    if (!('Notification' in window)) {
        console.log('This browser does not support notifications');
        return false;
    }
    
    // Load saved settings
    loadNotificationSettings();
    
    // Get current permission status
    notificationPermission = Notification.permission;
    
    // Update UI based on permission
    updateNotificationUI();
    
    // If already granted and enabled, schedule reminders
    if (notificationPermission === 'granted' && notificationSettings.enabled) {
        scheduleReminders();
    }
    
    // Register service worker if supported
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('sw.js');
            console.log('Service Worker registered:', registration.scope);
        } catch (error) {
            console.log('Service Worker registration failed:', error);
        }
    }
    
    return true;
}

async function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Notifications are not supported in this browser', 'warning');
        return false;
    }
    
    try {
        const permission = await Notification.requestPermission();
        notificationPermission = permission;
        
        if (permission === 'granted') {
            notificationSettings.enabled = true;
            saveNotificationSettings();
            showToast('Notifications enabled! 🔔', 'success');
            scheduleReminders();
            return true;
        } else if (permission === 'denied') {
            showToast('Notifications blocked. Enable in browser settings.', 'warning');
            return false;
        }
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        showToast('Could not enable notifications', 'error');
        return false;
    }
    
    return false;
}

function sendNotification(title, options = {}) {
    if (notificationPermission !== 'granted') {
        return null;
    }
    
    const defaultOptions = {
        icon: '🎯',
        badge: '🎯',
        vibrate: [100, 50, 100],
        requireInteraction: false,
        tag: 'habitflow-notification',
        ...options
    };
    
    try {
        const notification = new Notification(title, defaultOptions);
        
        notification.onclick = function(event) {
            event.preventDefault();
            window.focus();
            notification.close();
        };
        
        return notification;
    } catch (error) {
        console.error('Error sending notification:', error);
        return null;
    }
}

// ============================================
// Reminder Scheduling
// ============================================

function scheduleReminders() {
    // Clear existing scheduled reminders
    clearScheduledReminders();
    
    if (!notificationSettings.enabled || notificationPermission !== 'granted') {
        return;
    }
    
    // Schedule daily reminder check
    checkAndSendReminder();
    
    // Set up interval to check every minute
    const reminderInterval = setInterval(() => {
        checkAndSendReminder();
    }, 60000); // Check every minute
    
    scheduledReminders.push(reminderInterval);
}

function clearScheduledReminders() {
    scheduledReminders.forEach(id => clearInterval(id));
    scheduledReminders = [];
}

function checkAndSendReminder() {
    if (!notificationSettings.enabled) return;
    
    const now = new Date();
    const currentDay = now.getDay();
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    
    // Check if today is a reminder day
    if (!notificationSettings.reminderDays.includes(currentDay)) {
        return;
    }
    
    // Check if it's the right time (within the same minute)
    if (currentTime === notificationSettings.reminderTime) {
        // Check if we haven't already sent a reminder this minute
        const lastReminderKey = 'habitflow_last_reminder';
        const lastReminder = localStorage.getItem(lastReminderKey);
        const reminderKey = `${now.toDateString()}-${currentTime}`;
        
        if (lastReminder !== reminderKey) {
            sendHabitReminder();
            localStorage.setItem(lastReminderKey, reminderKey);
        }
    }
}

function sendHabitReminder() {
    // Get incomplete habits for today
    const today = new Date().toISOString().split('T')[0];
    const todaysCompletions = completions[today] || {};
    
    const incompleteHabits = habits.filter(habit => {
        const isScheduledToday = isHabitScheduledForDay(habit, new Date().getDay());
        const isCompleted = todaysCompletions[habit.id];
        return isScheduledToday && !isCompleted;
    });
    
    if (incompleteHabits.length === 0) {
        sendNotification('🎉 Great job!', {
            body: 'You\'ve completed all your habits for today!',
            tag: 'habitflow-complete'
        });
    } else if (incompleteHabits.length === 1) {
        sendNotification('⏰ Habit Reminder', {
            body: `Don't forget: ${incompleteHabits[0].name}`,
            tag: 'habitflow-reminder'
        });
    } else {
        sendNotification('⏰ Habit Reminder', {
            body: `You have ${incompleteHabits.length} habits to complete today`,
            tag: 'habitflow-reminder'
        });
    }
}

function isHabitScheduledForDay(habit, dayOfWeek) {
    if (habit.frequency === 'daily') return true;
    if (habit.frequency === 'weekly') return dayOfWeek === 0; // Sundays
    if (habit.frequency === 'custom' && habit.days) {
        return habit.days.includes(dayOfWeek);
    }
    return true;
}

// ============================================
// Settings Persistence
// ============================================

function loadNotificationSettings() {
    try {
        const saved = localStorage.getItem('habitflow_notification_settings');
        if (saved) {
            notificationSettings = { ...notificationSettings, ...JSON.parse(saved) };
        }
    } catch (error) {
        console.error('Error loading notification settings:', error);
    }
}

function saveNotificationSettings() {
    try {
        localStorage.setItem('habitflow_notification_settings', JSON.stringify(notificationSettings));
    } catch (error) {
        console.error('Error saving notification settings:', error);
    }
}

async function updateNotificationSettings(newSettings) {
    notificationSettings = { ...notificationSettings, ...newSettings };
    saveNotificationSettings();
    
    // If enabling notifications, request permission
    if (newSettings.enabled && notificationPermission !== 'granted') {
        await requestNotificationPermission();
    }
    
    // Reschedule reminders
    if (notificationSettings.enabled) {
        scheduleReminders();
    } else {
        clearScheduledReminders();
    }
    
    // Save email preferences to database if user is logged in
    if (currentUser && (newSettings.emailReports !== undefined || newSettings.emailFrequency !== undefined)) {
        await saveEmailPreferencesToDb();
    }
    
    updateNotificationUI();
}

// ============================================
// Email Reports (Database preferences)
// ============================================

async function saveEmailPreferencesToDb() {
    if (!currentUser) return;
    
    try {
        const { error } = await supabaseClient
            .from('profiles')
            .upsert({
                id: currentUser.id,
                email_reports: notificationSettings.emailReports,
                email_frequency: notificationSettings.emailFrequency,
                reminder_time: notificationSettings.reminderTime
            }, {
                onConflict: 'id'
            });
        
        if (error) throw error;
    } catch (error) {
        console.error('Error saving email preferences:', error);
    }
}

async function loadEmailPreferencesFromDb() {
    if (!currentUser) return;
    
    try {
        const { data, error } = await supabaseClient
            .from('profiles')
            .select('email_reports, email_frequency, reminder_time')
            .eq('id', currentUser.id)
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        if (data) {
            if (data.email_reports !== null) {
                notificationSettings.emailReports = data.email_reports;
            }
            if (data.email_frequency) {
                notificationSettings.emailFrequency = data.email_frequency;
            }
            if (data.reminder_time) {
                notificationSettings.reminderTime = data.reminder_time;
            }
            saveNotificationSettings();
        }
    } catch (error) {
        console.error('Error loading email preferences:', error);
    }
}

// ============================================
// UI Updates
// ============================================

function updateNotificationUI() {
    // Update toggle states
    const notifToggle = document.getElementById('notification-toggle');
    const emailToggle = document.getElementById('email-toggle');
    const reminderTime = document.getElementById('reminder-time');
    const emailFrequency = document.getElementById('email-frequency');
    
    if (notifToggle) {
        notifToggle.checked = notificationSettings.enabled && notificationPermission === 'granted';
    }
    if (emailToggle) {
        emailToggle.checked = notificationSettings.emailReports;
    }
    if (reminderTime) {
        reminderTime.value = notificationSettings.reminderTime;
    }
    if (emailFrequency) {
        emailFrequency.value = notificationSettings.emailFrequency;
    }
    
    // Update permission status indicator
    const permissionStatus = document.getElementById('notification-permission-status');
    if (permissionStatus) {
        if (notificationPermission === 'granted') {
            permissionStatus.textContent = '✓ Enabled';
            permissionStatus.className = 'permission-status granted';
        } else if (notificationPermission === 'denied') {
            permissionStatus.textContent = '✕ Blocked';
            permissionStatus.className = 'permission-status denied';
        } else {
            permissionStatus.textContent = 'Not set';
            permissionStatus.className = 'permission-status default';
        }
    }
}

// ============================================
// Settings Modal Functions
// ============================================

function openSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        updateNotificationUI();
        updateReportPreviewUI();
        modal.classList.add('active');
    }
}

function closeSettingsModal() {
    const modal = document.getElementById('settings-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function handleNotificationToggle(enabled) {
    if (enabled && notificationPermission !== 'granted') {
        const granted = await requestNotificationPermission();
        if (!granted) {
            // Reset toggle if permission denied
            const toggle = document.getElementById('notification-toggle');
            if (toggle) toggle.checked = false;
            return;
        }
    }
    
    await updateNotificationSettings({ enabled });
    
    if (enabled) {
        showToast('Daily reminders enabled', 'success');
    } else {
        showToast('Daily reminders disabled', 'info');
    }
}

async function handleEmailToggle(enabled) {
    await updateNotificationSettings({ emailReports: enabled });
    
    if (enabled) {
        showToast('Weekly email reports enabled', 'success');
    } else {
        showToast('Email reports disabled', 'info');
    }
}

async function handleReminderTimeChange(time) {
    await updateNotificationSettings({ reminderTime: time });
    showToast(`Reminder time set to ${formatTime(time)}`, 'success');
}

async function handleEmailFrequencyChange(frequency) {
    await updateNotificationSettings({ emailFrequency: frequency });
    showToast(`Email reports set to ${frequency}`, 'success');
    // Update preview to reflect new frequency
    updateReportPreviewUI();
}

function formatTime(time24) {
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
}

// ============================================
// Test Notification
// ============================================

function sendTestNotification() {
    if (notificationPermission !== 'granted') {
        showToast('Please enable notifications first', 'warning');
        return;
    }
    
    sendNotification('🧪 Test Notification', {
        body: 'Great! Your notifications are working perfectly.',
        tag: 'habitflow-test'
    });
    
    showToast('Test notification sent!', 'success');
}

// ============================================
// Generate Report Preview (Enhanced)
// ============================================

function generateReportPreview() {
    const frequency = notificationSettings.emailFrequency || 'weekly';
    const today = new Date();
    const startDate = new Date(today);
    
    if (frequency === 'monthly') {
        startDate.setDate(startDate.getDate() - 30);
    } else {
        startDate.setDate(startDate.getDate() - 7);
    }
    
    // Calculate stats
    let totalCompleted = 0;
    let totalScheduled = 0;
    const habitCompletions = {};
    
    // Initialize habit completion counts
    habits.forEach(h => {
        habitCompletions[h.id] = { habit: h, count: 0, scheduled: 0 };
    });
    
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        const dayCompletions = completions[dateStr] || {};
        
        habits.forEach(habit => {
            if (isHabitScheduledForDay(habit, d.getDay())) {
                totalScheduled++;
                habitCompletions[habit.id].scheduled++;
                if (dayCompletions[habit.id]) {
                    totalCompleted++;
                    habitCompletions[habit.id].count++;
                }
            }
        });
    }
    
    const completionRate = totalScheduled > 0 
        ? Math.round((totalCompleted / totalScheduled) * 100) 
        : 0;
    
    // Find best and current streaks
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);
    const currentStreak = habits.reduce((max, h) => Math.max(max, h.streak || 0), 0);
    
    // Get top habits by completion
    const topHabits = Object.values(habitCompletions)
        .map(hc => ({
            id: hc.habit.id,
            name: hc.habit.name,
            icon: hc.habit.icon,
            color: hc.habit.color,
            completions: hc.count,
            rate: hc.scheduled > 0 ? Math.round((hc.count / hc.scheduled) * 100) : 0
        }))
        .sort((a, b) => b.completions - a.completions)
        .slice(0, 5);
    
    return {
        period: `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        periodLabel: frequency === 'monthly' ? 'Last 30 Days' : 'Last 7 Days',
        totalCompleted,
        totalScheduled,
        completionRate,
        bestStreak,
        currentStreak,
        habitCount: habits.length,
        topHabits
    };
}

// Update report preview UI
function updateReportPreviewUI() {
    const preview = generateReportPreview();
    
    // Update period label
    const periodEl = document.getElementById('preview-period');
    if (periodEl) periodEl.textContent = preview.period;
    
    // Update progress ring
    const ringEl = document.getElementById('preview-ring');
    if (ringEl) {
        const circumference = 2 * Math.PI * 42; // r=42
        const dashArray = (preview.completionRate / 100) * circumference;
        ringEl.style.strokeDasharray = `${dashArray} ${circumference}`;
        
        // Color based on rate
        if (preview.completionRate >= 70) {
            ringEl.style.stroke = '#10b981'; // Green
        } else if (preview.completionRate >= 50) {
            ringEl.style.stroke = '#f59e0b'; // Yellow
        } else {
            ringEl.style.stroke = '#ef4444'; // Red
        }
    }
    
    // Update rate circle text
    const rateCircleEl = document.getElementById('preview-rate-circle');
    if (rateCircleEl) rateCircleEl.textContent = `${preview.completionRate}%`;
    
    // Update stats
    const completedEl = document.getElementById('preview-completed');
    const rateEl = document.getElementById('preview-rate');
    const streakEl = document.getElementById('preview-streak');
    
    if (completedEl) completedEl.textContent = preview.totalCompleted;
    if (rateEl) rateEl.textContent = `${preview.completionRate}%`;
    if (streakEl) streakEl.textContent = preview.bestStreak;
    
    // Update top habits list
    const topHabitsListEl = document.getElementById('top-habits-list');
    if (topHabitsListEl && preview.topHabits.length > 0) {
        topHabitsListEl.innerHTML = preview.topHabits.map(h => `
            <div class="top-habit-item">
                <span class="top-habit-icon">${h.icon}</span>
                <div class="top-habit-info">
                    <span class="top-habit-name">${h.name}</span>
                    <div class="top-habit-bar">
                        <div class="top-habit-bar-fill" style="width: ${h.rate}%; background: ${h.color}"></div>
                    </div>
                </div>
                <span class="top-habit-rate">${h.rate}%</span>
            </div>
        `).join('');
        
        document.getElementById('preview-top-habits').style.display = 'block';
    } else if (document.getElementById('preview-top-habits')) {
        document.getElementById('preview-top-habits').style.display = 'none';
    }
}

// ============================================
// Send Test Email Report
// ============================================

async function sendTestEmailReport() {
    if (!currentUser) {
        showToast('Please sign in to send a test report', 'warning');
        return;
    }
    
    const btn = document.getElementById('btn-send-test-report');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Sending...</span>';
    }
    
    try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/send-email-report`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${(await supabaseClient.auth.getSession()).data.session?.access_token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                userId: currentUser.id,
                isTest: true
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Test report sent! Check your email inbox.', 'success');
        } else {
            throw new Error(result.error || 'Failed to send report');
        }
    } catch (error) {
        console.error('Error sending test report:', error);
        showToast('Failed to send test report. Please try again.', 'error');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<span class="btn-icon">📨</span><span class="btn-text">Send Test Report to My Email</span>';
        }
    }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Delay initialization to ensure other modules are loaded
    setTimeout(() => {
        initializeNotifications();
    }, 1000);
});
