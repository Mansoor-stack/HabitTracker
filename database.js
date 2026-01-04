// ============================================
// Database Operations Module
// ============================================

// Timeout wrapper for async operations
function withTimeout(promise, timeoutMs = 15000, errorMessage = 'Operation timed out') {
    return Promise.race([
        promise,
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
}

// Loading state tracker to prevent stuck loading
let loadingTimeout = null;
let isLoadingData = false;

function startLoadingTimeout() {
    // Clear any existing timeout
    clearLoadingTimeout();
    
    // Set a maximum loading time of 30 seconds
    loadingTimeout = setTimeout(() => {
        console.warn('Loading timeout reached - forcing recovery');
        forceRecovery();
    }, 30000);
}

function clearLoadingTimeout() {
    if (loadingTimeout) {
        clearTimeout(loadingTimeout);
        loadingTimeout = null;
    }
}

function forceRecovery() {
    isLoadingData = false;
    hideLoading();
    showToast('Loading took too long. Please refresh or try again.', 'warning', 5000);
    
    // Show a retry button
    showRetryOption();
}

function showRetryOption() {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    // Remove existing retry toast if any
    const existingRetry = container.querySelector('.retry-toast');
    if (existingRetry) existingRetry.remove();
    
    const retryToast = document.createElement('div');
    retryToast.className = 'toast toast-info retry-toast show';
    retryToast.innerHTML = `
        <span class="toast-icon">🔄</span>
        <div class="toast-content">
            <div class="toast-message">Connection issue detected</div>
        </div>
        <button class="btn-primary" style="padding: 6px 12px; font-size: 12px;" onclick="retryLoadData()">Retry</button>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(retryToast);
}

async function retryLoadData() {
    // Remove retry toast
    const retryToast = document.querySelector('.retry-toast');
    if (retryToast) retryToast.remove();
    
    // Check session first
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) {
            showToast('Session expired. Please sign in again.', 'error');
            showAuthScreen();
            return;
        }
        currentUser = session.user;
    } catch (e) {
        showToast('Connection error. Please check your internet.', 'error');
        return;
    }
    
    // Retry loading
    await loadUserData();
    initializeApp();
}

// Load all user data from database
async function loadUserData() {
    if (!currentUser) return;
    
    // Prevent multiple simultaneous loads
    if (isLoadingData) {
        console.log('Already loading data, skipping...');
        return;
    }
    
    isLoadingData = true;
    startLoadingTimeout();
    
    try {
        showLoading('Loading your habits...');
        updateLoadingProgress(10);
        
        // Load habits with timeout
        const { data: habitsData, error: habitsError } = await withTimeout(
            supabaseClient
                .from('habits')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: true }),
            15000,
            'Loading habits timed out'
        );

        if (habitsError) throw habitsError;
        
        updateLoadingProgress(40);
        
        habits = habitsData.map(h => ({
            id: h.id,
            name: h.name,
            description: h.description,
            category: h.category,
            frequency: h.frequency,
            days: h.days,
            color: h.color,
            icon: h.icon,
            createdAt: h.created_at,
            streak: h.streak || 0,
            bestStreak: h.best_streak || 0
        }));

        updateLoadingProgress(60);

        // Load completions with timeout
        const { data: completionsData, error: completionsError } = await withTimeout(
            supabaseClient
                .from('completions')
                .select('*')
                .eq('user_id', currentUser.id),
            15000,
            'Loading completions timed out'
        );

        if (completionsError) throw completionsError;
        
        updateLoadingProgress(80);
        
        completions = {};
        completionsData.forEach(c => {
            if (!completions[c.date]) {
                completions[c.date] = {};
            }
            completions[c.date][c.habit_id] = c.completed;
        });

        updateLoadingProgress(100);
        clearLoadingTimeout();

        // Refresh UI
        refreshAll();
        
    } catch (error) {
        console.error('Error loading data:', error);
        clearLoadingTimeout();
        
        // Check if it's a timeout or network error
        if (error.message.includes('timed out')) {
            showToast('Loading timed out. Check your connection.', 'error', 5000);
            showRetryOption();
        } else if (error.message.includes('JWT') || error.message.includes('token')) {
            showToast('Session expired. Please sign in again.', 'error');
            showAuthScreen();
        } else {
            showToast('Error loading data. Please try again.', 'error', 5000);
            showRetryOption();
        }
    } finally {
        isLoadingData = false;
        hideLoading();
    }
}

// Save a new habit to database
async function saveHabitToDb(habit) {
    if (!currentUser) return null;
    
    try {
        const { data, error } = await supabaseClient
            .from('habits')
            .insert({
                user_id: currentUser.id,
                name: habit.name,
                description: habit.description,
                category: habit.category,
                frequency: habit.frequency,
                days: habit.days,
                color: habit.color,
                icon: habit.icon,
                streak: 0,
                best_streak: 0
            })
            .select()
            .single();

        if (error) throw error;
        
        return {
            id: data.id,
            name: data.name,
            description: data.description,
            category: data.category,
            frequency: data.frequency,
            days: data.days,
            color: data.color,
            icon: data.icon,
            createdAt: data.created_at,
            streak: data.streak || 0,
            bestStreak: data.best_streak || 0
        };
    } catch (error) {
        console.error('Error saving habit:', error);
        showMessage('Error saving habit. Please try again.', 'error');
        return null;
    }
}

// Update an existing habit
async function updateHabitInDb(habitId, updates) {
    if (!currentUser) return false;
    
    try {
        const { error } = await supabaseClient
            .from('habits')
            .update({
                name: updates.name,
                description: updates.description,
                category: updates.category,
                streak: updates.streak,
                best_streak: updates.bestStreak
            })
            .eq('id', habitId)
            .eq('user_id', currentUser.id);

        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Error updating habit:', error);
        showMessage('Error updating habit. Please try again.', 'error');
        return false;
    }
}

// Delete a habit
async function deleteHabitFromDb(habitId) {
    if (!currentUser) return false;
    
    try {
        // Delete completions first
        await supabaseClient
            .from('completions')
            .delete()
            .eq('habit_id', habitId)
            .eq('user_id', currentUser.id);

        // Then delete the habit
        const { error } = await supabaseClient
            .from('habits')
            .delete()
            .eq('id', habitId)
            .eq('user_id', currentUser.id);

        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Error deleting habit:', error);
        showMessage('Error deleting habit. Please try again.', 'error');
        return false;
    }
}

// Toggle habit completion
async function toggleCompletionInDb(habitId, date, completed) {
    if (!currentUser) return false;
    
    try {
        // Use upsert to insert or update
        const { error } = await supabaseClient
            .from('completions')
            .upsert({
                user_id: currentUser.id,
                habit_id: habitId,
                date: date,
                completed: completed
            }, {
                onConflict: 'user_id,habit_id,date'
            });

        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Error saving completion:', error);
        showMessage('Error saving progress. Please try again.', 'error');
        return false;
    }
}

// Update habit streak in database
async function updateStreakInDb(habitId, streak, bestStreak) {
    if (!currentUser) return false;
    
    try {
        const { error } = await supabaseClient
            .from('habits')
            .update({
                streak: streak,
                best_streak: bestStreak
            })
            .eq('id', habitId)
            .eq('user_id', currentUser.id);

        if (error) throw error;
        
        return true;
    } catch (error) {
        console.error('Error updating streak:', error);
        return false;
    }
}

// ============================================
// Session Management & Auto-Save
// ============================================

// Queue for pending operations (for offline/retry support)
let pendingOperations = [];
let isSyncing = false;

// Add operation to pending queue
function queueOperation(operation) {
    pendingOperations.push({
        ...operation,
        timestamp: Date.now()
    });
    savePendingToLocalStorage();
}

// Save pending operations to localStorage for persistence
function savePendingToLocalStorage() {
    try {
        localStorage.setItem('habitflow_pending', JSON.stringify(pendingOperations));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

// Load pending operations from localStorage
function loadPendingFromLocalStorage() {
    try {
        const saved = localStorage.getItem('habitflow_pending');
        if (saved) {
            pendingOperations = JSON.parse(saved);
        }
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        pendingOperations = [];
    }
}

// Sync all pending operations to database
async function syncPendingData() {
    if (!currentUser || isSyncing || pendingOperations.length === 0) return;
    
    isSyncing = true;
    
    try {
        const operations = [...pendingOperations];
        
        for (const op of operations) {
            try {
                if (op.type === 'completion') {
                    await toggleCompletionInDb(op.habitId, op.date, op.completed);
                } else if (op.type === 'streak') {
                    await updateStreakInDb(op.habitId, op.streak, op.bestStreak);
                }
                
                // Remove successful operation from queue
                pendingOperations = pendingOperations.filter(p => p.timestamp !== op.timestamp);
            } catch (error) {
                console.error('Error syncing operation:', error);
                // Keep failed operations in queue for retry
            }
        }
        
        savePendingToLocalStorage();
        console.log('Pending data synced successfully');
        
    } catch (error) {
        console.error('Sync error:', error);
    } finally {
        isSyncing = false;
    }
}

// Save session state to localStorage for recovery
function saveSessionState() {
    if (!currentUser) return;
    
    try {
        const sessionState = {
            lastActive: Date.now(),
            currentView: typeof currentView !== 'undefined' ? currentView : 'dashboard',
            habitsCache: habits,
            completionsCache: completions
        };
        localStorage.setItem('habitflow_session', JSON.stringify(sessionState));
    } catch (e) {
        console.error('Error saving session state:', e);
    }
}

// Restore session state from localStorage
function restoreSessionState() {
    try {
        const saved = localStorage.getItem('habitflow_session');
        if (saved) {
            const state = JSON.parse(saved);
            // Only restore if session is less than 24 hours old
            if (Date.now() - state.lastActive < 24 * 60 * 60 * 1000) {
                return state;
            }
        }
    } catch (e) {
        console.error('Error restoring session state:', e);
    }
    return null;
}

// Clear session state
function clearSessionState() {
    try {
        localStorage.removeItem('habitflow_session');
        localStorage.removeItem('habitflow_pending');
    } catch (e) {
        console.error('Error clearing session state:', e);
    }
}

// ============================================
// Browser Event Handlers for Data Persistence
// ============================================

// Handle page visibility change (tab switch, minimize)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        // Page is being hidden - save state
        saveSessionState();
        syncPendingData();
    } else if (document.visibilityState === 'visible') {
        // Page is visible again - refresh data if needed
        if (currentUser) {
            // Check if we need to refresh (if more than 5 minutes since last active)
            const session = restoreSessionState();
            if (session && Date.now() - session.lastActive > 5 * 60 * 1000) {
                loadUserData(); // Refresh data from server
            }
        }
    }
});

// Handle before page unload (browser close, refresh, navigate away)
window.addEventListener('beforeunload', (event) => {
    if (currentUser) {
        saveSessionState();
        
        // Sync pending operations synchronously if possible
        if (pendingOperations.length > 0) {
            // Use sendBeacon for reliable data sending on page close
            const data = JSON.stringify({
                userId: currentUser.id,
                pending: pendingOperations
            });
            
            // Note: For critical data, sendBeacon is more reliable than fetch on page close
            // However, it requires a server endpoint. For now, we rely on localStorage
            savePendingToLocalStorage();
        }
    }
});

// Handle online/offline status
window.addEventListener('online', () => {
    console.log('Connection restored - syncing pending data');
    syncPendingData();
});

window.addEventListener('offline', () => {
    console.log('Connection lost - data will be saved locally');
});

// Periodic sync (every 30 seconds if there are pending operations)
setInterval(() => {
    if (currentUser && pendingOperations.length > 0) {
        syncPendingData();
    }
}, 30000);

// Initialize pending operations from localStorage on load
loadPendingFromLocalStorage();
