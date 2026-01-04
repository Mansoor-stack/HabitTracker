// ============================================
// Utility Functions & Core Services
// ============================================

// ============================================
// Application State Manager (Singleton Pattern)
// ============================================
const AppState = {
    // Core state
    isInitialized: false,
    isLoading: false,
    isOnline: navigator.onLine,
    lastActivity: Date.now(),
    
    // Activity timeout (5 minutes)
    INACTIVITY_TIMEOUT: 5 * 60 * 1000,
    
    // Listeners for state changes
    listeners: new Map(),
    
    // Subscribe to state changes
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        return () => this.unsubscribe(event, callback);
    },
    
    // Unsubscribe from state changes
    unsubscribe(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) callbacks.splice(index, 1);
        }
    },
    
    // Emit state change event
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    console.error('State listener error:', e);
                }
            });
        }
    },
    
    // Update activity timestamp
    updateActivity() {
        this.lastActivity = Date.now();
        this.emit('activity', this.lastActivity);
    },
    
    // Check if app is inactive
    isInactive() {
        return Date.now() - this.lastActivity > this.INACTIVITY_TIMEOUT;
    }
};

// ============================================
// Loading State Manager
// ============================================
const LoadingManager = {
    activeLoaders: new Set(),
    minimumDisplayTime: 300, // Minimum loading display time to prevent flicker
    
    show(id = 'global', message = 'Loading...') {
        this.activeLoaders.add(id);
        this.updateUI(message);
        return Date.now();
    },
    
    async hide(id = 'global', startTime = 0) {
        // Ensure minimum display time to prevent flicker
        const elapsed = Date.now() - startTime;
        if (elapsed < this.minimumDisplayTime) {
            await new Promise(r => setTimeout(r, this.minimumDisplayTime - elapsed));
        }
        
        this.activeLoaders.delete(id);
        
        if (this.activeLoaders.size === 0) {
            this.hideUI();
        }
    },
    
    updateUI(message) {
        const overlay = document.getElementById('loading-overlay');
        const messageEl = document.getElementById('loading-message');
        
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.classList.add('active');
        }
        if (messageEl) {
            messageEl.textContent = message;
        }
    },
    
    hideUI() {
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.classList.remove('active');
            setTimeout(() => {
                if (this.activeLoaders.size === 0) {
                    overlay.style.display = 'none';
                }
            }, 300);
        }
    },
    
    isLoading() {
        return this.activeLoaders.size > 0;
    }
};

// ============================================
// Toast Notification System
// ============================================
const Toast = {
    container: null,
    queue: [],
    isProcessing: false,
    
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = 'toast-container';
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type] || icons.info}</span>
            <span class="toast-message">${this.escapeHtml(message)}</span>
            <button class="toast-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        this.container.appendChild(toast);
        
        // Trigger animation
        requestAnimationFrame(() => {
            toast.classList.add('show');
        });
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
        
        return toast;
    },
    
    success(message, duration) {
        return this.show(message, 'success', duration);
    },
    
    error(message, duration = 5000) {
        return this.show(message, 'error', duration);
    },
    
    warning(message, duration) {
        return this.show(message, 'warning', duration);
    },
    
    info(message, duration) {
        return this.show(message, 'info', duration);
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================
// Debounce & Throttle Utilities
// ============================================
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func.apply(this, args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function throttle(func, limit = 100) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// Error Handler (Centralized)
// ============================================
const ErrorHandler = {
    init() {
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handle(event.error, 'Application Error');
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled rejection:', event.reason);
            this.handle(event.reason, 'Network Error');
        });
    },
    
    handle(error, context = 'Error') {
        console.error(`[${context}]`, error);
        
        // Hide any loading states
        LoadingManager.hideUI();
        
        // User-friendly error messages
        let message = 'Something went wrong. Please try again.';
        
        if (error?.message) {
            if (error.message.includes('network') || error.message.includes('fetch')) {
                message = 'Network error. Please check your connection.';
            } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
                message = 'Session expired. Please sign in again.';
            } else if (error.message.includes('duplicate')) {
                message = 'This item already exists.';
            }
        }
        
        Toast.error(message);
        
        return { error: true, message };
    },
    
    // Wrap async functions with error handling
    async wrap(asyncFn, context = 'Operation') {
        try {
            return await asyncFn();
        } catch (error) {
            return this.handle(error, context);
        }
    }
};

// ============================================
// Network Status Manager
// ============================================
const NetworkManager = {
    isOnline: navigator.onLine,
    listeners: [],
    
    init() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            Toast.success('Connection restored');
            AppState.emit('online', true);
            this.notifyListeners(true);
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            Toast.warning('You are offline. Changes will be saved locally.');
            AppState.emit('offline', false);
            this.notifyListeners(false);
        });
    },
    
    onStatusChange(callback) {
        this.listeners.push(callback);
        return () => {
            const index = this.listeners.indexOf(callback);
            if (index > -1) this.listeners.splice(index, 1);
        };
    },
    
    notifyListeners(status) {
        this.listeners.forEach(cb => cb(status));
    }
};

// ============================================
// Activity Tracker (Inactivity Detection)
// ============================================
const ActivityTracker = {
    timeout: null,
    warningTimeout: null,
    INACTIVE_WARNING: 4 * 60 * 1000, // 4 minutes
    INACTIVE_LOGOUT: 30 * 60 * 1000, // 30 minutes
    
    init() {
        // Track user activity
        const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        const trackActivity = throttle(() => this.resetTimer(), 1000);
        
        events.forEach(event => {
            document.addEventListener(event, trackActivity, { passive: true });
        });
        
        this.resetTimer();
    },
    
    resetTimer() {
        AppState.updateActivity();
        
        clearTimeout(this.warningTimeout);
        clearTimeout(this.timeout);
        
        // Warning before logout
        this.warningTimeout = setTimeout(() => {
            if (typeof currentUser !== 'undefined' && currentUser) {
                Toast.warning('You will be logged out due to inactivity in 1 minute.', 10000);
            }
        }, this.INACTIVE_WARNING);
        
        // Auto data sync on inactivity (not logout, just sync)
        this.timeout = setTimeout(() => {
            if (typeof syncPendingData === 'function') {
                syncPendingData();
            }
        }, this.INACTIVE_LOGOUT);
    },
    
    destroy() {
        clearTimeout(this.warningTimeout);
        clearTimeout(this.timeout);
    }
};

// ============================================
// Local Storage Manager (with quota handling)
// ============================================
const StorageManager = {
    PREFIX: 'habitflow_',
    
    set(key, value) {
        try {
            const data = JSON.stringify({
                value,
                timestamp: Date.now()
            });
            localStorage.setItem(this.PREFIX + key, data);
            return true;
        } catch (e) {
            if (e.name === 'QuotaExceededError') {
                this.cleanup();
                try {
                    localStorage.setItem(this.PREFIX + key, JSON.stringify({ value, timestamp: Date.now() }));
                    return true;
                } catch (e2) {
                    console.error('Storage quota exceeded:', e2);
                }
            }
            return false;
        }
    },
    
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.PREFIX + key);
            if (item) {
                const data = JSON.parse(item);
                return data.value;
            }
        } catch (e) {
            console.error('Storage read error:', e);
        }
        return defaultValue;
    },
    
    remove(key) {
        try {
            localStorage.removeItem(this.PREFIX + key);
        } catch (e) {
            console.error('Storage remove error:', e);
        }
    },
    
    // Clean up old data
    cleanup() {
        const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        
        Object.keys(localStorage)
            .filter(key => key.startsWith(this.PREFIX))
            .forEach(key => {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && data.timestamp < oneWeekAgo) {
                        localStorage.removeItem(key);
                    }
                } catch (e) {
                    // Invalid data, remove it
                    localStorage.removeItem(key);
                }
            });
    }
};

// ============================================
// Confirmation Dialog
// ============================================
const ConfirmDialog = {
    show(options) {
        return new Promise((resolve) => {
            const {
                title = 'Confirm',
                message = 'Are you sure?',
                confirmText = 'Confirm',
                cancelText = 'Cancel',
                type = 'warning' // warning, danger, info
            } = options;
            
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.innerHTML = `
                <div class="confirm-dialog">
                    <h3 class="confirm-title">${this.escapeHtml(title)}</h3>
                    <p class="confirm-message">${this.escapeHtml(message)}</p>
                    <div class="confirm-actions">
                        <button class="btn-secondary confirm-cancel">${this.escapeHtml(cancelText)}</button>
                        <button class="btn-${type === 'danger' ? 'danger' : 'primary'} confirm-ok">${this.escapeHtml(confirmText)}</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Animate in
            requestAnimationFrame(() => overlay.classList.add('active'));
            
            const cleanup = (result) => {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
                resolve(result);
            };
            
            overlay.querySelector('.confirm-cancel').onclick = () => cleanup(false);
            overlay.querySelector('.confirm-ok').onclick = () => cleanup(true);
            overlay.onclick = (e) => {
                if (e.target === overlay) cleanup(false);
            };
            
            // Focus the confirm button
            overlay.querySelector('.confirm-ok').focus();
        });
    },
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

// ============================================
// Date Utilities
// ============================================
const DateUtils = {
    formatDate(date) {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },
    
    getTodayString() {
        return this.formatDate(new Date());
    },
    
    getLast7Days() {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            days.push(date);
        }
        return days;
    },
    
    getRelativeTime(date) {
        const now = new Date();
        const diff = now - new Date(date);
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        
        return new Date(date).toLocaleDateString();
    }
};

// ============================================
// Validation Utilities
// ============================================
const Validator = {
    email(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    password(password) {
        return password && password.length >= 6;
    },
    
    habitName(name) {
        return name && name.trim().length >= 1 && name.trim().length <= 100;
    },
    
    required(value) {
        return value !== null && value !== undefined && value.toString().trim() !== '';
    }
};

// ============================================
// Initialize All Utilities
// ============================================
function initializeUtilities() {
    ErrorHandler.init();
    NetworkManager.init();
    ActivityTracker.init();
    Toast.init();
    
    console.log('✓ Utilities initialized');
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUtilities);
} else {
    initializeUtilities();
}
