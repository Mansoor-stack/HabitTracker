// ============================================
// Authentication Module
// ============================================

let currentUser = null;

// Check authentication state on page load
async function checkAuth() {
    try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        
        if (session) {
            currentUser = session.user;
            isInitialAuthCheck = false; // Mark that we handled the initial auth
            showApp();
            await loadUserData();
            initializeApp();
        } else {
            isInitialAuthCheck = false;
            showAuthScreen();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        isInitialAuthCheck = false;
        showAuthScreen();
    }
}

// Track if this is the initial page load (to avoid duplicate welcome toasts)
let isInitialAuthCheck = true;

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        // Skip if this is just the initial session restore on page load
        // (checkAuth already handles that case)
        if (isInitialAuthCheck) {
            isInitialAuthCheck = false;
            return;
        }
        
        currentUser = session.user;
        showApp();
        await loadUserData();
        initializeApp();
        showToast('Welcome back! 👋', 'success');
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        showAuthScreen();
    } else if (event === 'TOKEN_REFRESHED') {
        console.log('Session refreshed');
    }
});

// Sign up with email and password
async function signUp(email, password, name) {
    try {
        const { data, error } = await supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name: name
                }
            }
        });

        if (error) throw error;

        if (data.user && !data.session) {
            showToast('Please check your email to confirm your account.', 'info', 5000);
        } else if (data.session) {
            showToast('Account created successfully! 🎉', 'success');
        }
        
        return { success: true, data };
    } catch (error) {
        showToast(error.message, 'error');
        return { success: false, error };
    }
}

// Sign in with email and password
async function signIn(email, password) {
    try {
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        showToast(error.message, 'error');
        return { success: false, error };
    }
}

// Sign out
async function signOut() {
    try {
        showLoading('Saving your progress...');
        
        // Sync any pending data before signing out
        await syncPendingData();
        
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        // Clear local data
        habits = [];
        completions = {};
        currentUser = null;
        
        showToast('Signed out successfully. See you soon! 👋', 'success');
        
    } catch (error) {
        showToast(error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Reset password
async function resetPassword(email) {
    try {
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) throw error;
        
        showToast('Password reset email sent. Check your inbox.', 'success', 5000);
        return { success: true };
    } catch (error) {
        showToast(error.message, 'error');
        return { success: false, error };
    }
}

// UI Helper functions
function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    hideLoading();
}

function showApp() {
    document.getElementById('auth-screen').style.display = 'none';
    document.getElementById('app-container').style.display = 'flex';
    
    // Update user info in UI
    if (currentUser) {
        const userName = currentUser.user_metadata?.name || currentUser.email.split('@')[0];
        document.getElementById('user-name').textContent = userName;
        document.getElementById('user-email').textContent = currentUser.email;
    }
    
    // Initialize connection status
    if (typeof updateConnectionStatus === 'function') {
        updateConnectionStatus();
    }
}

function showMessage(message, type = 'info') {
    // Legacy function - redirect to toast for backward compatibility
    if (typeof showToast === 'function') {
        showToast(message, type);
    } else {
        const messageEl = document.getElementById('auth-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `auth-message ${type}`;
            messageEl.style.display = 'block';
            
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }
}

// Toggle between login and signup forms
function toggleAuthForm(form) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const forgotForm = document.getElementById('forgot-form');
    
    loginForm.style.display = 'none';
    signupForm.style.display = 'none';
    forgotForm.style.display = 'none';
    
    if (form === 'login') {
        loginForm.style.display = 'block';
    } else if (form === 'signup') {
        signupForm.style.display = 'block';
    } else if (form === 'forgot') {
        forgotForm.style.display = 'block';
    }
}

// ============================================
// Visibility & Session Recovery
// ============================================

let lastActiveTime = Date.now();
let sessionCheckInterval = null;

// Track when user was last active
function updateLastActiveTime() {
    lastActiveTime = Date.now();
}

// Check session health periodically
function startSessionHealthCheck() {
    // Clear existing interval
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
    }
    
    // Check session every 5 minutes
    sessionCheckInterval = setInterval(async () => {
        if (!currentUser) return;
        
        try {
            const { data: { session }, error } = await supabaseClient.auth.getSession();
            if (error || !session) {
                console.warn('Session expired or invalid');
                showToast('Session expired. Please sign in again.', 'warning');
                showAuthScreen();
            }
        } catch (e) {
            console.warn('Session check failed:', e);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Handle visibility change (tab becomes active/inactive)
document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        const inactiveTime = Date.now() - lastActiveTime;
        const inactiveMinutes = inactiveTime / 1000 / 60;
        
        console.log(`Tab became visible after ${inactiveMinutes.toFixed(1)} minutes`);
        
        // If inactive for more than 5 minutes, verify session and refresh data
        if (inactiveMinutes > 5 && currentUser) {
            try {
                // Quick session check with timeout
                const sessionCheck = Promise.race([
                    supabaseClient.auth.getSession(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Session check timeout')), 5000)
                    )
                ]);
                
                const { data: { session }, error } = await sessionCheck;
                
                if (error || !session) {
                    showToast('Session expired. Please sign in again.', 'warning');
                    showAuthScreen();
                    return;
                }
                
                // Session is valid, refresh data silently
                currentUser = session.user;
                
                // Only reload if inactive for more than 10 minutes
                if (inactiveMinutes > 10) {
                    showToast('Refreshing your data...', 'info', 2000);
                    await loadUserData();
                    refreshAll();
                }
                
            } catch (e) {
                console.warn('Visibility change session check failed:', e);
                // Don't show error for minor issues, just log it
                if (e.message === 'Session check timeout') {
                    showToast('Connection slow. Some features may be delayed.', 'warning', 3000);
                }
            }
        }
        
        updateLastActiveTime();
    } else {
        // Tab became hidden - save the time
        updateLastActiveTime();
    }
});

// Handle page focus
window.addEventListener('focus', () => {
    updateLastActiveTime();
});

// Handle user interactions
['click', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, updateLastActiveTime, { passive: true });
});

// Initialize auth check when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    startSessionHealthCheck();
    updateLastActiveTime();
});

