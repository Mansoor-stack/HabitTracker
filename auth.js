// ============================================
// Authentication Module
// ============================================

let currentUser = null;

// Check authentication state on page load
async function checkAuth() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    
    if (session) {
        currentUser = session.user;
        showApp();
        await loadUserData();
    } else {
        showAuthScreen();
    }
}

// Listen for auth state changes
supabaseClient.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
        currentUser = session.user;
        showApp();
        await loadUserData();
    } else if (event === 'SIGNED_OUT') {
        currentUser = null;
        showAuthScreen();
    }
});

// Sign up with email and password
async function signUp(email, password, name) {
    try {
        showLoading(true);
        
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
            // Email confirmation required
            showMessage('Please check your email to confirm your account.', 'success');
        }
        
        return { success: true, data };
    } catch (error) {
        showMessage(error.message, 'error');
        return { success: false, error };
    } finally {
        showLoading(false);
    }
}

// Sign in with email and password
async function signIn(email, password) {
    try {
        showLoading(true);
        
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        showMessage(error.message, 'error');
        return { success: false, error };
    } finally {
        showLoading(false);
    }
}

// Sign out
async function signOut() {
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;
        
        // Clear local data
        habits = [];
        completions = {};
        currentUser = null;
        
    } catch (error) {
        showMessage(error.message, 'error');
    }
}

// Reset password
async function resetPassword(email) {
    try {
        showLoading(true);
        
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });

        if (error) throw error;
        
        showMessage('Password reset email sent. Check your inbox.', 'success');
        return { success: true };
    } catch (error) {
        showMessage(error.message, 'error');
        return { success: false, error };
    } finally {
        showLoading(false);
    }
}

// UI Helper functions
function showAuthScreen() {
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
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
}

function showLoading(show) {
    const loader = document.getElementById('loading-overlay');
    if (loader) {
        loader.style.display = show ? 'flex' : 'none';
    }
}

function showMessage(message, type = 'info') {
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
