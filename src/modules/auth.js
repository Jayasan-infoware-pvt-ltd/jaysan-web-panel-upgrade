import { supabase } from '../supabase.js';

/**
 * Check if user is currently authenticated
 */
export function checkAuth() {
    const user = localStorage.getItem('app_user');
    return user ? JSON.parse(user) : null;
}

/**
 * Get current user's role
 */
export function getUserRole() {
    const user = checkAuth();
    return user?.role || null;
}

/**
 * Check if current user is main admin
 */
export function isMainAdmin() {
    return getUserRole() === 'main_admin';
}

/**
 * Get the store_id assigned to the current user (null for main_admin)
 */
export function getUserStoreId() {
    const user = checkAuth();
    return user?.store_id || null;
}

/**
 * Login against Supabase users table
 */
export async function login(username, password) {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .eq('is_active', true)
        .single();

    if (error || !data) {
        return { success: false, message: 'Invalid credentials or account disabled.' };
    }

    const user = {
        id: data.id,
        username: data.username,
        display_name: data.display_name,
        role: data.role,
        store_id: data.store_id
    };

    localStorage.setItem('app_user', JSON.stringify(user));
    return { success: true, user };
}

/**
 * Logout
 */
export function logout() {
    localStorage.removeItem('app_user');
    sessionStorage.removeItem('active_store');
    window.location.reload();
}

/**
 * Render Login Page — premium glassmorphism design
 */
export function renderLogin(container) {
    container.innerHTML = `
        <div class="login-page">
            <!-- Animated Background -->
            <div class="login-bg">
                <div class="login-orb login-orb-1"></div>
                <div class="login-orb login-orb-2"></div>
                <div class="login-orb login-orb-3"></div>
            </div>

            <div class="login-card">
                <!-- Logo -->
                <div class="login-logo">
                    <div class="login-logo-icon">
                        <i data-lucide="zap" class="w-7 h-7"></i>
                    </div>
                    <h1 class="login-title">JRPL Panel</h1>
                    <p class="login-subtitle">Multi-Store Management System</p>
                </div>

                <form id="login-form" class="login-form">
                    <div class="form-group">
                        <label class="form-label">
                            <i data-lucide="user" class="w-3.5 h-3.5"></i>
                            Username
                        </label>
                        <input type="text" id="username" class="form-input" placeholder="Enter username" required autocomplete="username">
                    </div>

                    <div class="form-group">
                        <label class="form-label">
                            <i data-lucide="lock" class="w-3.5 h-3.5"></i>
                            Password
                        </label>
                        <input type="password" id="password" class="form-input" placeholder="Enter password" required autocomplete="current-password">
                    </div>

                    <div id="login-error" class="login-error hidden">
                        <i data-lucide="alert-circle" class="w-4 h-4"></i>
                        <span>Invalid credentials</span>
                    </div>

                    <button type="submit" id="login-btn" class="login-btn">
                        <span>Sign In</span>
                        <i data-lucide="arrow-right" class="w-4 h-4"></i>
                    </button>
                </form>

                <div class="login-footer">
                    <div class="login-footer-dot"></div>
                    <span>Secured Access</span>
                    <div class="login-footer-dot"></div>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const form = container.querySelector('#login-form');
    const errorMsg = container.querySelector('#login-error');
    const loginBtn = container.querySelector('#login-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const user = form.querySelector('#username').value.trim();
        const pass = form.querySelector('#password').value;

        loginBtn.disabled = true;
        loginBtn.innerHTML = '<span class="animate-pulse">Signing in...</span>';
        errorMsg.classList.add('hidden');

        const result = await login(user, pass);

        if (result.success) {
            window.location.reload();
        } else {
            errorMsg.querySelector('span').textContent = result.message;
            errorMsg.classList.remove('hidden');
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<span>Sign In</span><i data-lucide="arrow-right" class="w-4 h-4"></i>';
            if (window.lucide) window.lucide.createIcons();
        }
    });
}
