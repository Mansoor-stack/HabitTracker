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
            showApp();
            await loadUserData();
            initializeApp();
        } else {
            showAuthScreen();
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        showAuthScreen();
    }
}

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
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

// Initialize auth check when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
});
