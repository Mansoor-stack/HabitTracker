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

// Chart instances
let weeklyChart = null;
let categoryChart = null;
let monthlyChart = null;
let dayOfWeekChart = null;

// ============================================
// Authentication Handlers
// ============================================

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    await signIn(email, password);
}

async function handleSignup(e) {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    
    if (password !== confirm) {
        showMessage('Passwords do not match', 'error');
        return;
    }
    
    await signUp(email, password, name);
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('forgot-email').value;
    await resetPassword(email);
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

function updateCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').textContent = now.toLocaleDateString('en-US', options);
}

// ============================================
// Event Listeners
// ============================================

function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const view = item.dataset.view;
            switchView(view);
        });
    });

    // Filter tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter = tab.dataset.filter;
            renderHabitsView();
        });
    });

    // Add habit form
    document.getElementById('add-habit-form').addEventListener('submit', handleAddHabit);
    
    // Edit habit form
    document.getElementById('edit-habit-form').addEventListener('submit', handleEditHabit);

    // Frequency selector
    document.getElementById('habit-frequency').addEventListener('change', (e) => {
        const customDaysGroup = document.getElementById('custom-days-group');
        customDaysGroup.style.display = e.target.value === 'custom' ? 'block' : 'none';
    });

    // Icon picker
    document.querySelectorAll('.icon-option').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedIcon = btn.dataset.icon;
        });
    });

    // Calendar navigation
    document.getElementById('prev-month').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('next-month').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });
}

// ============================================
// View Management
// ============================================

function switchView(view) {
    currentView = view;
    
    // Update navigation
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.toggle('active', item.dataset.view === view);
    });

    // Update views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`${view}-view`).classList.add('active');

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

    // Save to database
    saveHabitToDb(habitData).then(savedHabit => {
        if (savedHabit) {
            habits.push(savedHabit);
            closeAddHabitModal();
            refreshAll();
        }
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

    habit.name = document.getElementById('edit-habit-name').value.trim();
    habit.description = document.getElementById('edit-habit-description').value.trim();
    habit.category = document.getElementById('edit-habit-category').value;

    // Update in database
    updateHabitInDb(id, habit).then(success => {
        if (success) {
            closeEditHabitModal();
            refreshAll();
        }
    });
}

async function deleteHabit() {
    const id = document.getElementById('edit-habit-id').value;
    if (!confirm('Are you sure you want to delete this habit? This action cannot be undone.')) return;
    
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
    }
}

async function toggleHabitCompletion(habitId, date = getTodayString()) {
    if (!completions[date]) {
        completions[date] = {};
    }
    
    const newState = !completions[date][habitId];
    completions[date][habitId] = newState;
    
    // Save to database
    const success = await toggleCompletionInDb(habitId, date, newState);
    
    if (success) {
        // Update streak
        await updateStreak(habitId);
        refreshAll();
    } else {
        // Revert on failure
        completions[date][habitId] = !newState;
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
    renderMonthlyChart();
    renderDayOfWeekChart();
    renderStreaksList();
    renderHeatmap();
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

    const days = [];
    const data = [];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        days.push(date.getDate());
        
        const dateStr = formatDate(date);
        const dayOfWeek = date.getDay();
        const scheduledHabits = habits.filter(h => h.days.includes(dayOfWeek));
        const completedCount = scheduledHabits.filter(h => 
            completions[dateStr] && completions[dateStr][h.id]
        ).length;
        data.push(scheduledHabits.length > 0 ? 
            Math.round((completedCount / scheduledHabits.length) * 100) : 0);
    }

    if (monthlyChart) {
        monthlyChart.destroy();
    }

    monthlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: days,
            datasets: [{
                label: 'Daily Completion %',
                data,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#10b981',
                pointBorderColor: '#10b981',
                pointRadius: 3,
                pointHoverRadius: 6
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

function renderDayOfWeekChart() {
    const ctx = document.getElementById('dayOfWeekChart');
    if (!ctx) return;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayData = [0, 0, 0, 0, 0, 0, 0];
    const dayCount = [0, 0, 0, 0, 0, 0, 0];

    Object.keys(completions).forEach(dateStr => {
        const date = new Date(dateStr);
        const dayOfWeek = date.getDay();
        const dayCompletions = completions[dateStr];
        
        habits.forEach(habit => {
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

    dayOfWeekChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: dayNames,
            datasets: [{
                label: 'Completion Rate',
                data,
                backgroundColor: 'rgba(139, 92, 246, 0.2)',
                borderColor: '#8b5cf6',
                borderWidth: 2,
                pointBackgroundColor: '#8b5cf6'
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
                        color: '#94a3b8',
                        backdropColor: 'transparent'
                    },
                    grid: { color: '#334155' },
                    pointLabels: { color: '#94a3b8' }
                }
            }
        }
    });
}

function renderStreaksList() {
    const container = document.getElementById('streaks-list');
    if (!container) return;

    const sortedHabits = [...habits].sort((a, b) => b.streak - a.streak);

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

    const weeks = [];
    const now = new Date();
    
    // Get the start date (52 weeks ago, starting from Sunday)
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 364);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    let currentDate = new Date(startDate);
    
    while (currentDate <= now) {
        const week = [];
        for (let i = 0; i < 7; i++) {
            if (currentDate <= now) {
                const dateStr = formatDate(currentDate);
                const dayOfWeek = currentDate.getDay();
                const scheduledHabits = habits.filter(h => h.days.includes(dayOfWeek));
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
                
                week.push({
                    date: dateStr,
                    level,
                    tooltip: `${currentDate.toLocaleDateString()}: ${completedCount}/${scheduledHabits.length} habits`
                });
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        if (week.length > 0) {
            weeks.push(week);
        }
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
    
    // Best streak
    const bestStreak = habits.reduce((max, h) => Math.max(max, h.bestStreak), 0);
    document.getElementById('best-streak').textContent = bestStreak;
    
    // Total streak (current active streak across all habits)
    const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
    document.getElementById('total-streak').textContent = 
        habits.length > 0 ? Math.round(totalStreak / habits.length) : 0;
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
