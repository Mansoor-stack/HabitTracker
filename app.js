// ============================================
// HabitFlow - Habit Tracker Application
// ============================================

// Data Storage
let habits = [];
let completions = {};

// Current state
let currentView = 'dashboard';
let currentFilter = 'all';
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedIcon = '💪';
let currentTheme = 'midnight';

// Analytics filter state
let analyticsFilters = {
    period: 'month',      // week, month, quarter, year, all
    category: 'all',      // all, health, productivity, mindfulness, learning, other
    habitId: 'all'        // all or specific habit id
};

// Chart instances
let weeklyChart = null;
let categoryChart = null;
let monthlyChart = null;
let dayOfWeekChart = null;

// Confirm dialog resolver
let confirmResolver = null;

// ============================================
// Theme System
// ============================================

const THEMES = {
    // Dark themes
    midnight: { name: 'Midnight', mode: 'dark', primary: '#6366f1' },
    ocean: { name: 'Ocean', mode: 'dark', primary: '#06b6d4' },
    // Light themes
    light: { name: 'Light', mode: 'light', primary: '#6366f1' },
    snow: { name: 'Snow', mode: 'light', primary: '#0ea5e9' },
    sage: { name: 'Sage', mode: 'light', primary: '#059669' },
    cream: { name: 'Cream', mode: 'light', primary: '#d97706' }
};

function initializeTheme() {
    // Load saved theme from localStorage
    const savedTheme = localStorage.getItem('habitflow_theme') || 'midnight';
    setTheme(savedTheme, false); // false = don't show toast on initial load
}

function setTheme(themeName, showNotification = true) {
    if (!THEMES[themeName]) {
        themeName = 'midnight';
    }
    
    currentTheme = themeName;
    
    // Apply theme to document
    if (themeName === 'midnight') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', themeName);
    }
    
    // Save to localStorage
    localStorage.setItem('habitflow_theme', themeName);
    
    // Update active state in theme picker
    updateThemePickerUI();
    
    // Update chart colors if charts exist
    updateChartColors();
    
    // Show notification
    if (showNotification) {
        showToast(`Theme changed to ${THEMES[themeName].name}`, 'success', 2000);
    }
}

function updateThemePickerUI() {
    // Remove active class from all theme cards
    document.querySelectorAll('.theme-card').forEach(card => {
        card.classList.remove('active');
    });
    
    // Add active class to current theme
    const activeCard = document.querySelector(`.theme-card[data-theme="${currentTheme}"]`);
    if (activeCard) {
        activeCard.classList.add('active');
    }
}

function openThemeModal() {
    const modal = document.getElementById('theme-modal');
    if (modal) {
        modal.classList.add('active');
        updateThemePickerUI();
    }
}

function closeThemeModal() {
    const modal = document.getElementById('theme-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function updateChartColors() {
    // Get current theme colors from CSS
    const styles = getComputedStyle(document.documentElement);
    const primary = styles.getPropertyValue('--primary').trim();
    const primaryLight = styles.getPropertyValue('--primary-light').trim();
    const textPrimary = styles.getPropertyValue('--text-primary').trim();
    const textSecondary = styles.getPropertyValue('--text-secondary').trim();
    const success = styles.getPropertyValue('--success').trim();
    
    // Update Chart.js defaults
    if (typeof Chart !== 'undefined') {
        Chart.defaults.color = textSecondary;
        Chart.defaults.borderColor = styles.getPropertyValue('--border-color').trim();
    }
    
    // Recreate charts with new colors if they exist
    if (weeklyChart || categoryChart || monthlyChart || dayOfWeekChart) {
        // Re-render current view to update charts
        if (currentView === 'dashboard') {
            renderDashboard();
        } else if (currentView === 'analytics') {
            renderAnalytics();
        }
    }
}

// Initialize theme on script load
initializeTheme();

// ============================================
// PWA Install Prompt
// ============================================

let deferredInstallPrompt = null;
let isAppInstalled = false;

function initPWAInstallPrompt() {
    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone === true) {
        isAppInstalled = true;
        console.log('[PWA] App is running in standalone mode');
        return;
    }
    
    // Check if previously dismissed within 7 days
    const dismissedAt = localStorage.getItem('pwa_install_dismissed');
    if (dismissedAt) {
        const dismissedDate = new Date(parseInt(dismissedAt));
        const daysSinceDismissed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) {
            console.log('[PWA] Install prompt dismissed recently');
            return;
        }
    }
    
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        console.log('[PWA] Install prompt ready');
        
        // Show the install banner after a short delay
        setTimeout(() => {
            showPWAInstallBanner();
        }, 3000); // Wait 3 seconds before showing
    });
    
    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App installed successfully');
        isAppInstalled = true;
        hidePWAInstallBanner();
        deferredInstallPrompt = null;
        showToast('HabitFlow installed! 🎉', 'success');
        localStorage.removeItem('pwa_install_dismissed');
    });
    
    // Setup banner buttons
    setupPWABannerButtons();
    
    // Show iOS-specific install instructions
    if (isIOS() && !isAppInstalled) {
        setTimeout(() => {
            showIOSInstallInstructions();
        }, 5000);
    }
}

function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function showPWAInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner && deferredInstallPrompt) {
        banner.classList.remove('hidden');
    }
}

function hidePWAInstallBanner() {
    const banner = document.getElementById('pwa-install-banner');
    if (banner) {
        banner.classList.add('hidden');
    }
}

function setupPWABannerButtons() {
    const installBtn = document.getElementById('pwa-install-btn');
    const dismissBtn = document.getElementById('pwa-dismiss-btn');
    
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredInstallPrompt) return;
            
            // Show the native install prompt
            deferredInstallPrompt.prompt();
            
            // Wait for user response
            const { outcome } = await deferredInstallPrompt.userChoice;
            console.log('[PWA] User response:', outcome);
            
            if (outcome === 'accepted') {
                showToast('Installing HabitFlow...', 'info');
            }
            
            // Clear the prompt
            deferredInstallPrompt = null;
            hidePWAInstallBanner();
        });
    }
    
    if (dismissBtn) {
        dismissBtn.addEventListener('click', () => {
            hidePWAInstallBanner();
            localStorage.setItem('pwa_install_dismissed', Date.now().toString());
            showToast('You can install later from browser menu', 'info', 4000);
        });
    }
}

function showIOSInstallInstructions() {
    // Only show if not already installed and not dismissed
    if (isAppInstalled) return;
    
    const dismissedAt = localStorage.getItem('ios_install_dismissed');
    if (dismissedAt) {
        const dismissedDate = new Date(parseInt(dismissedAt));
        const daysSinceDismissed = (Date.now() - dismissedDate) / (1000 * 60 * 60 * 24);
        if (daysSinceDismissed < 7) return;
    }
    
    // Show toast with iOS-specific instructions
    showToast(
        'Install HabitFlow: Tap the share button and select "Add to Home Screen"',
        'info',
        8000
    );
    
    localStorage.setItem('ios_install_dismissed', Date.now().toString());
}

// Initialize PWA install prompt on load
initPWAInstallPrompt();

// ============================================
// Toast & Confirm Dialog Helpers
// ============================================

function showToast(message, type = 'info', duration = 3000) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <span class="toast-icon">${icons[type]}</span>
        <div class="toast-content">
            <div class="toast-message">${message}</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });
    
    // Auto remove
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

function showConfirmDialog(title, message, type = 'warning') {
    return new Promise(resolve => {
        const overlay = document.getElementById('confirm-overlay');
        if (!overlay) {
            resolve(false);
            return;
        }
        
        overlay.querySelector('.confirm-title').textContent = title;
        overlay.querySelector('.confirm-message').textContent = message;
        overlay.querySelector('.confirm-icon').className = `confirm-icon ${type}`;
        overlay.querySelector('.confirm-icon').textContent = type === 'danger' ? '🗑️' : '⚠️';
        
        confirmResolver = resolve;
        overlay.classList.add('show');
    });
}

function hideConfirmDialog(result) {
    const overlay = document.getElementById('confirm-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
    if (confirmResolver) {
        confirmResolver(result);
        confirmResolver = null;
    }
}

// ============================================
// Connection Status
// ============================================

function updateConnectionStatus() {
    const status = document.getElementById('connection-status');
    if (!status) return;
    
    const isOnline = navigator.onLine;
    status.classList.toggle('online', isOnline);
    status.classList.toggle('offline', !isOnline);
    status.querySelector('.connection-text').textContent = isOnline ? 'Online' : 'Offline - Changes will sync when connected';
    
    if (!isOnline) {
        status.classList.add('show');
    } else {
        setTimeout(() => status.classList.remove('show'), 3000);
    }
}

// Listen for connection changes
window.addEventListener('online', () => {
    updateConnectionStatus();
    showToast('Back online! Syncing data...', 'success');
    if (typeof syncPendingData === 'function') {
        syncPendingData();
    }
});

window.addEventListener('offline', () => {
    updateConnectionStatus();
    showToast('You are offline. Changes will be saved locally.', 'warning', 5000);
});

// ============================================
// Loading Helpers
// ============================================

function showLoading(message = 'Loading...') {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.querySelector('.loading-text').textContent = message;
        overlay.style.display = 'flex';
        updateLoadingProgress(0);
    }
}

function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

function updateLoadingProgress(percent) {
    const bar = document.getElementById('loading-progress-bar');
    const overlay = document.getElementById('loading-overlay');
    if (bar) {
        bar.style.width = `${percent}%`;
        // Also show percentage text
        bar.setAttribute('aria-valuenow', percent);
    }
    // Update loading text with percentage if loading
    if (overlay && percent > 0 && percent < 100) {
        const loadingText = overlay.querySelector('.loading-text');
        if (loadingText && !loadingText.dataset.originalText) {
            loadingText.dataset.originalText = loadingText.textContent;
        }
        if (loadingText) {
            loadingText.textContent = `${loadingText.dataset.originalText || 'Loading...'} (${percent}%)`;
        }
    }
}

// ============================================
// Authentication Handlers
// ============================================

async function handleLogin(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    btn.classList.add('btn-loading');
    try {
        await signIn(email, password);
    } finally {
        btn.classList.remove('btn-loading');
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    
    if (password !== confirm) {
        showToast('Passwords do not match', 'error');
        return;
    }
    
    if (password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        return;
    }
    
    btn.classList.add('btn-loading');
    try {
        await signUp(email, password, name);
    } finally {
        btn.classList.remove('btn-loading');
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const email = document.getElementById('forgot-email').value;
    
    btn.classList.add('btn-loading');
    try {
        await resetPassword(email);
    } finally {
        btn.classList.remove('btn-loading');
    }
}


// ============================================
// Initialization
// ============================================

function initializeApp() {
    updateCurrentDate();
    setupEventListeners();
    renderDashboard();
    renderHabitsView();
    renderAnalytics();
    renderCalendar();
    updateStats();
}

// ============================================
// Mobile Menu
// ============================================

function toggleMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuToggle = document.getElementById('menu-toggle');
    
    if (sidebar && overlay && menuToggle) {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
        menuToggle.classList.toggle('open');
        document.body.classList.toggle('menu-open');
    }
}

function closeMobileMenu() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const menuToggle = document.getElementById('menu-toggle');
    
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
    if (menuToggle) menuToggle.classList.remove('open');
    document.body.classList.remove('menu-open');
}

function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Navigation - add event listeners to all nav items
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        // Remove any existing listeners by cloning
        const newItem = item.cloneNode(true);
        item.parentNode.replaceChild(newItem, item);
        
        newItem.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const view = newItem.dataset.view;
            if (view) {
                switchView(view);
                closeMobileMenu();
            }
        });
    });

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderHabitsView();
        });
    });

    // Add habit form
    const addHabitForm = document.getElementById('add-habit-form');
    if (addHabitForm) {
        addHabitForm.addEventListener('submit', handleAddHabit);
    }
    
    // Edit habit form
    const editHabitForm = document.getElementById('edit-habit-form');
    if (editHabitForm) {
        editHabitForm.addEventListener('submit', handleEditHabit);
    }

    // Frequency selector
    const frequencySelect = document.getElementById('habit-frequency');
    if (frequencySelect) {
        frequencySelect.addEventListener('change', (e) => {
            const customDaysGroup = document.getElementById('custom-days-group');
            if (customDaysGroup) {
                customDaysGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
            }
        });
    }

    // Icon picker
    document.querySelectorAll('.icon-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedIcon = btn.dataset.icon;
        });
    });

    // Calendar navigation
    const prevMonthBtn = document.getElementById('prev-month');
    const nextMonthBtn = document.getElementById('next-month');
    
    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', () => {
            currentMonth--;
            if (currentMonth < 0) {
                currentMonth = 11;
                currentYear--;
            }
            renderCalendar();
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', () => {
            currentMonth++;
            if (currentMonth > 11) {
                currentMonth = 0;
                currentYear++;
            }
            renderCalendar();
        });
    }
}

// ============================================
// View Management
// ============================================

function switchView(view) {
    if (!view) return;
    
    currentView = view;
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    // Update views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const viewElement = document.getElementById(`${view}-view`);
    if (viewElement) {
        viewElement.classList.add('active');
    }

    // Update title
    const titles = {
        dashboard: 'Dashboard',
        habits: 'My Habits',
        analytics: 'Analytics',
        calendar: 'Calendar'
    };
    document.getElementById('page-title').textContent = titles[view];

    // Refresh charts when switching to analytics
    if (view === 'analytics') {
        setTimeout(renderAnalytics, 100);
    }
}

// ============================================
// Habit Management
// ============================================

function openAddHabitModal() {
    document.getElementById('add-habit-modal').classList.add('active');
    document.getElementById('add-habit-form').reset();
    selectedIcon = '💪';
    document.querySelectorAll('.icon-option').forEach(b => {
        b.classList.toggle('selected', b.dataset.icon === '💪');
    });
}

function closeAddHabitModal() {
    document.getElementById('add-habit-modal').classList.remove('active');
}

function handleAddHabit(e) {
    e.preventDefault();
    
    const name = document.getElementById('habit-name').value.trim();
    const description = document.getElementById('habit-description').value.trim();
    const category = document.getElementById('habit-category').value;
    const frequency = document.getElementById('habit-frequency').value;
    const color = document.querySelector('input[name="habit-color"]:checked').value;
    
    if (!name) {
        showToast('Please enter a habit name', 'error');
        return;
    }
    
    let days = [];
    if (frequency === 'daily') {
        days = [0, 1, 2, 3, 4, 5, 6];
    } else if (frequency === 'weekdays') {
        days = [1, 2, 3, 4, 5];
    } else if (frequency === 'weekends') {
        days = [0, 6];
    } else {
        document.querySelectorAll('#custom-days-group input:checked').forEach(input => {
            days.push(parseInt(input.value));
        });
        if (days.length === 0) {
            showToast('Please select at least one day', 'error');
            return;
        }
    }

    const habitData = {
        name,
        description,
        category,
        frequency,
        days,
        color,
        icon: selectedIcon
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.classList.add('btn-loading');

    // Save to database
    saveHabitToDb(habitData).then(savedHabit => {
        btn.classList.remove('btn-loading');
        if (savedHabit) {
            habits.push(savedHabit);
            closeAddHabitModal();
            refreshAll();
            showToast(`"${name}" has been added!`, 'success');
        } else {
            showToast('Failed to create habit', 'error');
        }
    }).catch(() => {
        btn.classList.remove('btn-loading');
        showToast('Failed to create habit', 'error');
    });
}

function openEditHabitModal(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    document.getElementById('edit-habit-id').value = habit.id;
    document.getElementById('edit-habit-name').value = habit.name;
    document.getElementById('edit-habit-description').value = habit.description || '';
    document.getElementById('edit-habit-category').value = habit.category;
    
    document.getElementById('edit-habit-modal').classList.add('active');
}

function closeEditHabitModal() {
    document.getElementById('edit-habit-modal').classList.remove('active');
}

function handleEditHabit(e) {
    e.preventDefault();
    
    const id = document.getElementById('edit-habit-id').value;
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const name = document.getElementById('edit-habit-name').value.trim();
    if (!name) {
        showToast('Please enter a habit name', 'error');
        return;
    }

    habit.name = name;
    habit.description = document.getElementById('edit-habit-description').value.trim();
    habit.category = document.getElementById('edit-habit-category').value;

    const btn = e.target.querySelector('button[type="submit"]');
    btn.classList.add('btn-loading');

    // Update in database
    updateHabitInDb(id, habit).then(success => {
        btn.classList.remove('btn-loading');
        if (success) {
            closeEditHabitModal();
            refreshAll();
            showToast('Habit updated successfully', 'success');
        } else {
            showToast('Failed to update habit', 'error');
        }
    }).catch(() => {
        btn.classList.remove('btn-loading');
        showToast('Failed to update habit', 'error');
    });
}

async function deleteHabit() {
    const id = document.getElementById('edit-habit-id').value;
    const habit = habits.find(h => h.id === id);
    
    const confirmed = await showConfirmDialog(
        'Delete Habit',
        `Are you sure you want to delete "${habit?.name || 'this habit'}"? This action cannot be undone.`,
        'danger'
    );
    
    if (!confirmed) return;
    
    const success = await deleteHabitFromDb(id);
    if (success) {
        habits = habits.filter(h => h.id !== id);
        
        // Remove completions for this habit from local state
        Object.keys(completions).forEach(date => {
            if (completions[date][id]) {
                delete completions[date][id];
            }
        });

        closeEditHabitModal();
        refreshAll();
        showToast('Habit deleted successfully', 'success');
    } else {
        showToast('Failed to delete habit', 'error');
    }
}

async function toggleHabitCompletion(habitId, date = getTodayString()) {
    if (!completions[date]) {
        completions[date] = {};
    }
    
    const newState = !completions[date][habitId];
    completions[date][habitId] = newState;
    
    // Optimistically update UI first
    refreshAll();
    
    // Save to database
    const success = await toggleCompletionInDb(habitId, date, newState);
    
    if (success) {
        // Update streak
        await updateStreak(habitId);
        
        // Show encouraging message for completions
        if (newState) {
            const habit = habits.find(h => h.id === habitId);
            const messages = ['Great job! 🎉', 'Keep it up! 💪', 'You\'re on fire! 🔥', 'Awesome! ⭐'];
            const randomMsg = messages[Math.floor(Math.random() * messages.length)];
            showToast(`${habit?.name || 'Habit'} completed! ${randomMsg}`, 'success', 2000);
        }
        
        refreshAll();
    } else {
        // Revert on failure
        completions[date][habitId] = !newState;
        refreshAll();
        showToast('Failed to save. Will retry when online.', 'warning');
    }
}

async function updateStreak(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    let streak = 0;
    let date = new Date();
    
    // Check today first
    const todayStr = getTodayString();
    if (!completions[todayStr] || !completions[todayStr][habitId]) {
        // If not completed today, check from yesterday
        date.setDate(date.getDate() - 1);
    }

    // Count consecutive days
    while (true) {
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        
        // Check if habit is scheduled for this day
        if (habit.days.includes(dayOfWeek)) {
            if (completions[dateStr] && completions[dateStr][habitId]) {
                streak++;
            } else {
                break;
            }
        }
        
        date.setDate(date.getDate() - 1);
        
        // Limit check to prevent infinite loop
        if (streak > 365) break;
    }

    habit.streak = streak;
    if (streak > habit.bestStreak) {
        habit.bestStreak = streak;
    }
    
    // Update streak in database
    await updateStreakInDb(habitId, habit.streak, habit.bestStreak);
}

// ============================================
// Rendering Functions
// ============================================

function refreshAll() {
    renderDashboard();
    renderHabitsView();
    renderAnalytics();
    renderCalendar();
    updateStats();
}

function renderDashboard() {
    renderTodayHabits();
    renderWeeklyChart();
    renderCategoryChart();
}

function renderTodayHabits() {
    const container = document.getElementById('today-habits-list');
    const today = new Date();
    const dayOfWeek = today.getDay();
    const todayStr = getTodayString();
    
    const todayHabits = habits.filter(h => h.days.includes(dayOfWeek));
    
    if (todayHabits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">🌱</span>
                <p>No habits scheduled for today. Add a new habit to get started!</p>
            </div>
        `;
        document.getElementById('today-progress').textContent = '0/0 completed';
        document.getElementById('progress-fill').style.width = '0%';
        return;
    }

    const completedCount = todayHabits.filter(h => 
        completions[todayStr] && completions[todayStr][h.id]
    ).length;

    document.getElementById('today-progress').textContent = 
        `${completedCount}/${todayHabits.length} completed`;
    document.getElementById('progress-fill').style.width = 
        `${(completedCount / todayHabits.length) * 100}%`;

    container.innerHTML = todayHabits.map(habit => {
        const isCompleted = completions[todayStr] && completions[todayStr][habit.id];
        return `
            <div class="habit-item ${isCompleted ? 'completed' : ''}" data-id="${habit.id}">
                <div class="habit-checkbox ${isCompleted ? 'checked' : ''}" 
                     onclick="toggleHabitCompletion('${habit.id}')"></div>
                <div class="habit-icon" style="background: ${habit.color}20;">
                    ${habit.icon}
                </div>
                <div class="habit-info">
                    <div class="habit-name">${escapeHtml(habit.name)}</div>
                    <div class="habit-meta">
                        <span>${getCategoryLabel(habit.category)}</span>
                    </div>
                </div>
                ${habit.streak > 0 ? `
                    <div class="habit-streak">
                        🔥 ${habit.streak} day${habit.streak !== 1 ? 's' : ''}
                    </div>
                ` : ''}
                <div class="habit-actions">
                    <button class="habit-action-btn" onclick="openEditHabitModal('${habit.id}')" title="Edit">
                        ✏️
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderHabitsView() {
    const container = document.getElementById('all-habits-list');
    
    let filteredHabits = habits;
    if (currentFilter !== 'all') {
        filteredHabits = habits.filter(h => h.category === currentFilter);
    }

    if (filteredHabits.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
                <span class="empty-icon">📋</span>
                <p>No habits found. ${currentFilter !== 'all' ? 'Try a different category or ' : ''}Add a new habit to get started!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredHabits.map(habit => {
        const stats = getHabitStats(habit.id);
        const last7Days = getLast7Days();
        
        return `
            <div class="habit-card">
                <div class="habit-card-header">
                    <div class="habit-card-icon" style="background: ${habit.color}20;">
                        ${habit.icon}
                    </div>
                    <div class="habit-card-title">
                        <h4>${escapeHtml(habit.name)}</h4>
                        <p>${getCategoryLabel(habit.category)}</p>
                    </div>
                </div>
                <div class="habit-card-stats">
                    <div class="habit-stat">
                        <span class="habit-stat-value">🔥 ${habit.streak}</span>
                        <span class="habit-stat-label">Current Streak</span>
                    </div>
                    <div class="habit-stat">
                        <span class="habit-stat-value">🏆 ${habit.bestStreak}</span>
                        <span class="habit-stat-label">Best Streak</span>
                    </div>
                    <div class="habit-stat">
                        <span class="habit-stat-value">${stats.completionRate}%</span>
                        <span class="habit-stat-label">Completion</span>
                    </div>
                </div>
                <div class="habit-card-progress">
                    <div class="habit-card-progress-header">
                        <span>Last 7 days</span>
                        <span>${stats.last7Completed}/7</span>
                    </div>
                    <div class="mini-calendar">
                        ${last7Days.map(date => {
                            const dateStr = formatDate(date);
                            const isCompleted = completions[dateStr] && completions[dateStr][habit.id];
                            const isToday = dateStr === getTodayString();
                            return `<div class="mini-calendar-day ${isCompleted ? 'completed' : ''} ${isToday ? 'today' : ''}" 
                                        title="${date.toLocaleDateString()}"></div>`;
                        }).join('')}
                    </div>
                </div>
                <div class="habit-card-actions">
                    <button class="habit-card-btn secondary" onclick="openEditHabitModal('${habit.id}')">
                        Edit
                    </button>
                    <button class="habit-card-btn primary" onclick="toggleHabitCompletion('${habit.id}')">
                        ${isHabitCompletedToday(habit.id) ? 'Completed ✓' : 'Mark Complete'}
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function renderAnalytics() {
    populateHabitFilter();
    updateFilteredSummaryStats();
    renderMonthlyChart();
    renderDayOfWeekChart();
    renderStreaksList();
    renderHeatmap();
}

// ============================================
// Analytics Filters
// ============================================

function updateAnalyticsFilters() {
    analyticsFilters.period = document.getElementById('analytics-period')?.value || 'month';
    analyticsFilters.habitId = document.getElementById('analytics-habit')?.value || 'all';
    
    // Re-render analytics with new filters
    updateFilteredSummaryStats();
    renderMonthlyChart();
    renderDayOfWeekChart();
    renderStreaksList();
    renderHeatmap();
}

function updateAnalyticsCategoryFilter() {
    analyticsFilters.category = document.getElementById('analytics-category')?.value || 'all';
    analyticsFilters.habitId = 'all'; // Reset habit filter when category changes
    
    // Update habit dropdown based on category
    populateHabitFilter();
    
    // Re-render analytics
    updateAnalyticsFilters();
}

function populateHabitFilter() {
    const habitSelect = document.getElementById('analytics-habit');
    if (!habitSelect) return;
    
    // Get habits for selected category
    const filteredHabits = analyticsFilters.category === 'all' 
        ? habits 
        : habits.filter(h => h.category === analyticsFilters.category);
    
    habitSelect.innerHTML = '<option value="all">All Habits</option>';
    
    filteredHabits.forEach(habit => {
        const option = document.createElement('option');
        option.value = habit.id;
        option.textContent = `${habit.icon} ${habit.name}`;
        habitSelect.appendChild(option);
    });
    
    // Restore selection if still valid
    if (analyticsFilters.habitId !== 'all') {
        const stillExists = filteredHabits.some(h => h.id === analyticsFilters.habitId);
        if (stillExists) {
            habitSelect.value = analyticsFilters.habitId;
        } else {
            analyticsFilters.habitId = 'all';
        }
    }
}

function resetAnalyticsFilters() {
    analyticsFilters = {
        period: 'month',
        category: 'all',
        habitId: 'all'
    };
    
    // Reset dropdowns
    const periodSelect = document.getElementById('analytics-period');
    const categorySelect = document.getElementById('analytics-category');
    const habitSelect = document.getElementById('analytics-habit');
    
    if (periodSelect) periodSelect.value = 'month';
    if (categorySelect) categorySelect.value = 'all';
    if (habitSelect) habitSelect.value = 'all';
    
    populateHabitFilter();
    updateAnalyticsFilters();
    
    showToast('Filters reset', 'info', 2000);
}

function getFilteredHabits() {
    let filtered = habits;
    
    // Filter by category
    if (analyticsFilters.category !== 'all') {
        filtered = filtered.filter(h => h.category === analyticsFilters.category);
    }
    
    // Filter by specific habit
    if (analyticsFilters.habitId !== 'all') {
        filtered = filtered.filter(h => h.id === analyticsFilters.habitId);
    }
    
    return filtered;
}

function getAnalyticsPeriodDays() {
    switch (analyticsFilters.period) {
        case 'week': return 7;
        case 'month': return 30;
        case 'quarter': return 90;
        case 'year': return 365;
        case 'all': return 730; // Max 2 years for performance
        default: return 30;
    }
}

function getDateRangeForPeriod() {
    const days = getAnalyticsPeriodDays();
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days + 1);
    
    return { startDate, endDate, days };
}

function updateFilteredSummaryStats() {
    const filteredHabits = getFilteredHabits();
    const { startDate, endDate } = getDateRangeForPeriod();
    
    let totalScheduled = 0;
    let totalCompleted = 0;
    let bestStreak = 0;
    
    // Calculate stats for the filtered period and habits
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
        const dateStr = formatDate(currentDate);
        const dayOfWeek = currentDate.getDay();
        
        filteredHabits.forEach(habit => {
            if (habit.days.includes(dayOfWeek)) {
                totalScheduled++;
                if (completions[dateStr] && completions[dateStr][habit.id]) {
                    totalCompleted++;
                }
            }
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Get best streak from filtered habits
    filteredHabits.forEach(habit => {
        if (habit.bestStreak > bestStreak) {
            bestStreak = habit.bestStreak;
        }
    });
    
    // Update UI
    const completionRate = totalScheduled > 0 
        ? Math.round((totalCompleted / totalScheduled) * 100) 
        : 0;
    
    document.getElementById('filtered-completion-rate').textContent = `${completionRate}%`;
    document.getElementById('filtered-completed').textContent = totalCompleted;
    document.getElementById('filtered-scheduled').textContent = totalScheduled;
    document.getElementById('filtered-best-streak').textContent = bestStreak;
    
    // Update progress bar
    updateAnalyticsProgressBar(totalCompleted, totalScheduled, completionRate);
    
    // Update chart titles
    updateChartTitles();
}

function updateAnalyticsProgressBar(completed, scheduled, rate) {
    const progressFill = document.getElementById('analytics-progress-fill');
    const progressPercentage = document.getElementById('progress-percentage');
    const progressTitle = document.getElementById('progress-title');
    const completedLabel = document.getElementById('progress-completed-label');
    const remainingLabel = document.getElementById('progress-remaining-label');
    
    if (!progressFill) return;
    
    // Update progress bar fill
    progressFill.style.width = `${rate}%`;
    
    // Update percentage display
    if (progressPercentage) {
        progressPercentage.textContent = `${rate}%`;
    }
    
    // Update labels
    if (completedLabel) {
        completedLabel.textContent = `${completed} completed`;
    }
    if (remainingLabel) {
        const remaining = scheduled - completed;
        remainingLabel.textContent = `${remaining} remaining`;
    }
    
    // Update title based on filters
    if (progressTitle) {
        const periodLabel = getPeriodLabel();
        const categoryLabel = getCategoryLabel();
        const habitLabel = getHabitLabel();
        
        let title = periodLabel + ' Progress';
        if (habitLabel !== 'All Habits') {
            title = habitLabel + ' - ' + periodLabel;
        } else if (categoryLabel !== 'All Categories') {
            title = categoryLabel + ' - ' + periodLabel;
        }
        
        progressTitle.textContent = title;
    }
}

function getPeriodLabel() {
    const labels = {
        week: 'Weekly',
        month: 'Monthly',
        quarter: 'Quarterly',
        year: 'Yearly',
        all: 'All Time'
    };
    return labels[analyticsFilters.period] || 'Monthly';
}

function getCategoryLabel() {
    const labels = {
        all: 'All Categories',
        health: 'Health & Fitness',
        productivity: 'Productivity',
        mindfulness: 'Mindfulness',
        learning: 'Learning',
        other: 'Other'
    };
    return labels[analyticsFilters.category] || 'All Categories';
}

function getHabitLabel() {
    if (analyticsFilters.habitId === 'all') {
        return 'All Habits';
    }
    const habit = habits.find(h => h.id === analyticsFilters.habitId);
    return habit ? habit.name : 'All Habits';
}

function updateChartTitles() {
    const periodLabel = getPeriodLabel();
    const categoryLabel = getCategoryLabel();
    const habitLabel = getHabitLabel();
    
    // Build suffix based on filters
    let filterSuffix = '';
    if (habitLabel !== 'All Habits') {
        filterSuffix = ` • ${habitLabel}`;
    } else if (categoryLabel !== 'All Categories') {
        filterSuffix = ` • ${categoryLabel}`;
    }
    
    // Monthly chart title
    const monthlyTitle = document.getElementById('monthly-chart-title');
    if (monthlyTitle) {
        monthlyTitle.textContent = `${periodLabel} Progress${filterSuffix}`;
    }
    
    // Day of week chart title
    const dayOfWeekTitle = document.getElementById('dayofweek-chart-title');
    if (dayOfWeekTitle) {
        dayOfWeekTitle.textContent = `Completion by Day${filterSuffix}`;
    }
    
    // Streaks title
    const streaksTitle = document.getElementById('streaks-chart-title');
    if (streaksTitle) {
        if (habitLabel !== 'All Habits') {
            streaksTitle.textContent = `${habitLabel} Streak`;
        } else if (categoryLabel !== 'All Categories') {
            streaksTitle.textContent = `${categoryLabel} Streaks`;
        } else {
            streaksTitle.textContent = 'Habit Streaks';
        }
    }
    
    // Heatmap title
    const heatmapTitle = document.getElementById('heatmap-chart-title');
    if (heatmapTitle) {
        heatmapTitle.textContent = `${periodLabel} Activity${filterSuffix}`;
    }
}

function renderWeeklyChart() {
    const ctx = document.getElementById('weeklyChart');
    if (!ctx) return;

    const last7Days = getLast7Days();
    const labels = last7Days.map(d => d.toLocaleDateString('en-US', { weekday: 'short' }));
    
    const data = last7Days.map(date => {
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        const scheduledHabits = habits.filter(h => h.days.includes(dayOfWeek));
        const completedCount = scheduledHabits.filter(h => 
            completions[dateStr] && completions[dateStr][h.id]
        ).length;
        return scheduledHabits.length > 0 ? 
            Math.round((completedCount / scheduledHabits.length) * 100) : 0;
    });

    if (weeklyChart) {
        weeklyChart.destroy();
    }

    weeklyChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Completion Rate',
                data,
                backgroundColor: 'rgba(99, 102, 241, 0.5)',
                borderColor: '#6366f1',
                borderWidth: 2,
                borderRadius: 8,
                borderSkipped: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: value => value + '%',
                        color: '#94a3b8'
                    },
                    grid: { color: '#334155' }
                },
                x: {
                    ticks: { color: '#94a3b8' },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderCategoryChart() {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;

    const categories = ['health', 'productivity', 'mindfulness', 'learning', 'other'];
    const categoryLabels = ['Health', 'Productivity', 'Mindfulness', 'Learning', 'Other'];
    const colors = ['#10b981', '#6366f1', '#8b5cf6', '#f59e0b', '#64748b'];

    const data = categories.map(cat => habits.filter(h => h.category === cat).length);

    if (categoryChart) {
        categoryChart.destroy();
    }

    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data,
                backgroundColor: colors,
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', padding: 16 }
                }
            },
            cutout: '65%'
        }
    });
}

function renderMonthlyChart() {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;

    const filteredHabits = getFilteredHabits();
    const { days: periodDays } = getDateRangeForPeriod();
    
    const labels = [];
    const data = [];
    const now = new Date();
    
    // Determine label format based on period
    const labelFormat = periodDays <= 7 
        ? { weekday: 'short' } 
        : periodDays <= 90 
            ? { day: 'numeric' }
            : { month: 'short', day: 'numeric' };
    
    // Sample data points (max 60 for readability)
    const step = periodDays > 60 ? Math.ceil(periodDays / 60) : 1;
    
    for (let i = periodDays - 1; i >= 0; i -= step) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // For larger periods, show month/day
        if (periodDays <= 31) {
            labels.push(date.getDate());
        } else {
            labels.push(date.toLocaleDateString('en-US', labelFormat));
        }
        
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        const scheduledHabits = filteredHabits.filter(h => h.days.includes(dayOfWeek));
        const completedCount = scheduledHabits.filter(h => 
            completions[dateStr] && completions[dateStr][h.id]
        ).length;
        data.push(scheduledHabits.length > 0 ? 
            Math.round((completedCount / scheduledHabits.length) * 100) : 0);
    }

    if (monthlyChart) {
        monthlyChart.destroy();
    }
    
    // Get theme colors
    const styles = getComputedStyle(document.documentElement);
    const successColor = styles.getPropertyValue('--success').trim() || '#10b981';
    const textSecondary = styles.getPropertyValue('--text-secondary').trim() || '#94a3b8';
    const borderColor = styles.getPropertyValue('--border-color').trim() || '#334155';
    
    // Chart title based on filters
    const periodLabel = {
        week: 'Last 7 Days',
        month: 'Last 30 Days',
        quarter: 'Last 90 Days',
        year: 'Last Year',
        all: 'All Time'
    }[analyticsFilters.period] || 'Progress';

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Daily Completion %',
                data,
                borderColor: successColor,
                backgroundColor: `${successColor}1a`,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: successColor,
                pointBorderColor: successColor,
                pointRadius: periodDays > 60 ? 2 : 3,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                    text: periodLabel,
                    color: textSecondary,
                    font: { size: 12, weight: 'normal' },
                    padding: { bottom: 10 }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: value => value + '%',
                        color: textSecondary
                    },
                    grid: { color: borderColor }
                },
                x: {
                    ticks: { 
                        color: textSecondary,
                        maxRotation: periodDays > 30 ? 45 : 0,
                        autoSkip: true,
                        maxTicksLimit: 15
                    },
                    grid: { display: false }
                }
            }
        }
    });
}

function renderDayOfWeekChart() {
    const ctx = document.getElementById('dayOfWeekChart');
    if (!ctx) return;

    const filteredHabits = getFilteredHabits();
    const { startDate, endDate } = getDateRangeForPeriod();
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = [0, 0, 0, 0, 0, 0, 0];
    const dayCount = [0, 0, 0, 0, 0, 0, 0];

    // Only count completions within the selected period
    Object.keys(completions).forEach(dateStr => {
        const date = new Date(dateStr);
        
        // Check if date is within selected period
        if (date < startDate || date > endDate) return;
        
        const dayOfWeek = date.getDay();
        const dayCompletions = completions[dateStr];
        
        filteredHabits.forEach(habit => {
            if (habit.days.includes(dayOfWeek)) {
                dayCount[dayOfWeek]++;
                if (dayCompletions[habit.id]) {
                    dayData[dayOfWeek]++;
                }
            }
        });
    });

    const data = dayData.map((completed, i) => 
        dayCount[i] > 0 ? Math.round((completed / dayCount[i]) * 100) : 0
    );

    if (dayOfWeekChart) {
        dayOfWeekChart.destroy();
    }
    
    // Get theme colors
    const styles = getComputedStyle(document.documentElement);
    const primaryLight = styles.getPropertyValue('--primary-light').trim() || '#8b5cf6';
    const textSecondary = styles.getPropertyValue('--text-secondary').trim() || '#94a3b8';
    const borderColor = styles.getPropertyValue('--border-color').trim() || '#334155';

    dayOfWeekChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: dayNames,
            datasets: [{
                label: 'Completion Rate',
                data,
                backgroundColor: `${primaryLight}33`,
                borderColor: primaryLight,
                borderWidth: 2,
                pointBackgroundColor: primaryLight
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 25,
                        color: textSecondary,
                        backdropColor: 'transparent'
                    },
                    grid: { color: borderColor },
                    pointLabels: { color: textSecondary }
                }
            }
        }
    });
}

function renderStreaksList() {
    const container = document.getElementById('streaks-list');
    if (!container) return;

    const filteredHabits = getFilteredHabits();
    const sortedHabits = [...filteredHabits].sort((a, b) => b.streak - a.streak);

    if (sortedHabits.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>No habits yet</p>
            </div>
        `;
        return;
    }

    container.innerHTML = sortedHabits.map(habit => `
        <div class="streak-item">
            <span class="streak-item-icon">${habit.icon}</span>
            <div class="streak-item-info">
                <div class="streak-item-name">${escapeHtml(habit.name)}</div>
                <div class="streak-item-days">Best: ${habit.bestStreak} days</div>
            </div>
            <div class="streak-item-badge">🔥 ${habit.streak}</div>
        </div>
    `).join('');
}

function renderHeatmap() {
    const container = document.getElementById('heatmap');
    if (!container) return;

    const filteredHabits = getFilteredHabits();
    const periodDays = getAnalyticsPeriodDays();
    
    const weeks = [];
    const now = new Date();
    
    // Calculate heatmap period based on filter (max 52 weeks for performance)
    const heatmapDays = Math.min(periodDays, 364);
    
    // Get the start date based on period
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - heatmapDays);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

    let currentDate = new Date(startDate);
    
    while (currentDate <= now) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            if (currentDate <= now) {
                const dateStr = formatDate(currentDate);
                const dayOfWeek = currentDate.getDay();
                const scheduledHabits = filteredHabits.filter(h => h.days.includes(dayOfWeek));
                const completedCount = scheduledHabits.filter(h => 
                    completions[dateStr] && completions[dateStr][h.id]
                ).length;
                
                let level = 0;
                if (scheduledHabits.length > 0) {
                    const rate = completedCount / scheduledHabits.length;
                    if (rate > 0 && rate <= 0.25) level = 1;
                    else if (rate > 0.25 && rate <= 0.5) level = 2;
                    else if (rate > 0.5 && rate <= 0.75) level = 3;
                    else if (rate > 0.75) level = 4;
                }
                
                const habitLabel = filteredHabits.length === 1 
                    ? filteredHabits[0].name 
                    : 'habits';
                
                week.push({
                    date: dateStr,
                    level,
                    tooltip: `${currentDate.toLocaleDateString()}: ${completedCount}/${scheduledHabits.length} ${habitLabel}`
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        if (week.length > 0) {
            weeks.push(week);
        }
    }
    
    // Show empty state if no filtered habits
    if (filteredHabits.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px; text-align: center;">
                <p style="color: var(--text-secondary);">No habits match the selected filters</p>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="heatmap">
            ${weeks.map(week => `
                <div class="heatmap-week">
                    ${week.map(day => `
                        <div class="heatmap-day level-${day.level}" 
                             title="${day.tooltip}"></div>
                    `).join('')}
                </div>
            `).join('')}
        </div>
    `;
}

function renderCalendar() {
    const container = document.getElementById('calendar-grid');
    const monthYear = document.getElementById('calendar-month-year');
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'];
    
    monthYear.textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const today = new Date();
    const todayStr = getTodayString();

    let html = `
        <div class="calendar-weekdays">
            <div class="calendar-weekday">Sun</div>
            <div class="calendar-weekday">Mon</div>
            <div class="calendar-weekday">Tue</div>
            <div class="calendar-weekday">Wed</div>
            <div class="calendar-weekday">Thu</div>
            <div class="calendar-weekday">Fri</div>
            <div class="calendar-weekday">Sat</div>
        </div>
        <div class="calendar-days">
    `;

    // Empty cells before first day
    for (let i = 0; i < startingDay; i++) {
        html += '<div class="calendar-day empty"></div>';
    }

    // Calendar days
    for (let day = 1; day <= totalDays; day++) {
        const date = new Date(currentYear, currentMonth, day);
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        
        const isToday = dateStr === todayStr;
        
        const scheduledHabits = habits.filter(h => h.days.includes(dayOfWeek));
        const completedCount = scheduledHabits.filter(h => 
            completions[dateStr] && completions[dateStr][h.id]
        ).length;
        
        let levelClass = 'none';
        if (scheduledHabits.length > 0) {
            const rate = completedCount / scheduledHabits.length;
            if (rate > 0 && rate <= 0.25) levelClass = 'low';
            else if (rate > 0.25 && rate <= 0.5) levelClass = 'medium';
            else if (rate > 0.5 && rate <= 0.75) levelClass = 'high';
            else if (rate > 0.75) levelClass = 'complete';
        }

        html += `
            <div class="calendar-day ${levelClass} ${isToday ? 'today' : ''}" 
                 title="${completedCount}/${scheduledHabits.length} habits completed">
                <span class="calendar-day-number">${day}</span>
                <span class="calendar-day-indicator"></span>
            </div>
        `;
    }

    html += '</div>';
    container.innerHTML = html;
}

function updateStats() {
    const today = new Date();
    const todayStr = getTodayString();
    const dayOfWeek = today.getDay();
    
    // Total habits
    document.getElementById('total-habits').textContent = habits.length;
    
    // Completed today
    const todayHabits = habits.filter(h => h.days.includes(dayOfWeek));
    const completedToday = todayHabits.filter(h => 
        completions[todayStr] && completions[todayStr][h.id]
    ).length;
    document.getElementById('completed-today').textContent = completedToday;
    
    // Completion rate (last 30 days)
    let totalScheduled = 0;
    let totalCompleted = 0;
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        const dow = date.getDay();
        
        habits.forEach(habit => {
            if (habit.days.includes(dow)) {
                totalScheduled++;
                if (completions[dateStr] && completions[dateStr][habit.id]) {
                    totalCompleted++;
                }
            }
        });
    }
    
    const completionRate = totalScheduled > 0 ? 
        Math.round((totalCompleted / totalScheduled) * 100) : 0;
    document.getElementById('completion-rate').textContent = completionRate + '%';
    
    // Update completion rate tooltip with dynamic motivation
    updateCompletionRateTooltip(completionRate, totalCompleted, totalScheduled);
    
    // Best streak
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);
    document.getElementById('best-streak').textContent = bestStreak;
    
    // Total streak (current active streak across all habits)
    const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
    document.getElementById('total-streak').textContent = 
        habits.length > 0 ? Math.round(totalStreak / habits.length) : 0;
}

// ============================================
// Completion Rate Tooltip - Dynamic Motivation
// ============================================

function updateCompletionRateTooltip(rate, completed, scheduled) {
    const tooltip = document.getElementById('completion-tooltip');
    if (!tooltip) return;
    
    const remaining = scheduled - completed;
    const message = getMotivationMessage(rate, completed, remaining);
    
    tooltip.innerHTML = `
        <div class="tooltip-content">
            <div class="tooltip-emoji">${message.emoji}</div>
            <div class="tooltip-message">${message.text}</div>
            <div class="tooltip-stats">
                <span>✅ ${completed} completed</span>
                <span>📋 ${remaining} remaining</span>
            </div>
            <div class="tooltip-period">Last 30 days</div>
        </div>
    `;
}

function getMotivationMessage(rate, completed, remaining) {
    // No habits yet
    if (completed === 0 && remaining === 0) {
        return {
            emoji: '🌱',
            text: 'Add your first habit to start tracking!'
        };
    }
    
    // Perfect score
    if (rate === 100) {
        const perfectMessages = [
            'Unstoppable! You\'re a habit master! 🏆',
            'Perfect score! You\'re on fire! 🔥',
            '100%! Incredible discipline! 💪',
            'Flawless! Keep this legendary streak! ⭐'
        ];
        return {
            emoji: '🎉',
            text: perfectMessages[Math.floor(Math.random() * perfectMessages.length)]
        };
    }
    
    // Excellent (90-99%)
    if (rate >= 90) {
        return {
            emoji: '🌟',
            text: `Almost perfect! Just ${remaining} more to hit 100%!`
        };
    }
    
    // Great (75-89%)
    if (rate >= 75) {
        return {
            emoji: '💪',
            text: `Great progress! You're building strong habits!`
        };
    }
    
    // Good (50-74%)
    if (rate >= 50) {
        return {
            emoji: '📈',
            text: `Solid effort! Every completion counts. Keep pushing!`
        };
    }
    
    // Needs work (25-49%)
    if (rate >= 25) {
        return {
            emoji: '🚀',
            text: `Room to grow! Small steps lead to big changes.`
        };
    }
    
    // Just starting (1-24%)
    if (rate > 0) {
        return {
            emoji: '🌅',
            text: `The journey begins! You've got this!`
        };
    }
    
    // Zero completion but has scheduled
    return {
        emoji: '💡',
        text: `Today is a fresh start! Complete one habit now!`
    };
}

// ============================================
// Utility Functions
// ============================================

function getTodayString() {
    return formatDate(new Date());
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
    }
    return days;
}

function getHabitStats(habitId) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { completionRate: 0, last7Completed: 0 };

    const last7Days = getLast7Days();
    let completed = 0;
    let scheduled = 0;

    last7Days.forEach(date => {
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        
        if (habit.days.includes(dayOfWeek)) {
            scheduled++;
            if (completions[dateStr] && completions[dateStr][habitId]) {
                completed++;
            }
        }
    });

    // Overall completion rate (last 30 days)
    let totalScheduled = 0;
    let totalCompleted = 0;
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        
        if (habit.days.includes(dayOfWeek)) {
            totalScheduled++;
            if (completions[dateStr] && completions[dateStr][habitId]) {
                totalCompleted++;
            }
        }
    }

    return {
        completionRate: totalScheduled > 0 ? 
            Math.round((totalCompleted / totalScheduled) * 100) : 0,
        last7Completed: completed
    };
}

function isHabitCompletedToday(habitId) {
    const todayStr = getTodayString();
    return completions[todayStr] && completions[todayStr][habitId];
}

function getCategoryLabel(category) {
    const labels = {
        health: '🏃 Health & Fitness',
        productivity: '💼 Productivity',
        mindfulness: '🧘 Mindfulness',
        learning: '📚 Learning',
        other: '📌 Other'
    };
    return labels[category] || category;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function saveData() {
    // Data is now saved to Supabase database
    // This function is kept for compatibility but no longer uses localStorage
    console.log('Data saved to database');
}

// ============================================
// Demo Data (Optional - for testing)
// ============================================

// Demo data function removed - users will create their own habits
