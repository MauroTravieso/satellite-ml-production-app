// ============================================
// auth.js - Authentication Module
// Save this as: assets/js/auth.js
// ============================================

const SatelliteAuth = (function() {
    'use strict';
    
    // Valid credentials (in production, this would be server-side)
    const VALID_CREDENTIALS = {
        'demo': 'demo123',
        'admin': 'admin123',
        'mauro': 'satellite2025'
    };
    
    const SESSION_KEY = 'satelliteSession';
    const SESSION_EXPIRY_HOURS = 24;
    
    // ============================================
    // Public Methods
    // ============================================
    
    /**
     * Authenticate user with username and password
     * @param {string} username 
     * @param {string} password 
     * @param {boolean} rememberMe 
     * @returns {Object} {success: boolean, message: string}
     */
    function login(username, password, rememberMe = false) {
        if (!username || !password) {
            return {
                success: false,
                message: 'Username and password are required'
            };
        }
        
        // Check credentials
        if (VALID_CREDENTIALS[username] && VALID_CREDENTIALS[username] === password) {
            const sessionData = {
                username: username,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };
            
            // Store session
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem(SESSION_KEY, JSON.stringify(sessionData));
            
            return {
                success: true,
                message: 'Login successful',
                user: username
            };
        }
        
        return {
            success: false,
            message: 'Invalid username or password'
        };
    }
    
    /**
     * Check if user is authenticated
     * @returns {Object|null} Session data or null
     */
    function checkAuth() {
        const sessionData = localStorage.getItem(SESSION_KEY) || 
                           sessionStorage.getItem(SESSION_KEY);
        
        if (!sessionData) {
            return null;
        }
        
        try {
            const session = JSON.parse(sessionData);
            
            // Validate session structure
            if (!session.username || !session.loginTime) {
                clearSession();
                return null;
            }
            
            // Check session expiry
            const loginTime = new Date(session.loginTime);
            const now = new Date();
            const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursSinceLogin > SESSION_EXPIRY_HOURS) {
                clearSession();
                return null;
            }
            
            return session;
            
        } catch (e) {
            clearSession();
            return null;
        }
    }
    
    /**
     * Logout user and clear session
     */
    function logout() {
        clearSession();
        window.location.href = 'index.html';
    }
    
    /**
     * Clear all session data
     */
    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
    }
    
    /**
     * Require authentication for protected pages
     * Redirects to login if not authenticated
     */
    function requireAuth() {
        const session = checkAuth();
        if (!session) {
            window.location.href = 'index.html';
            return null;
        }
        return session;
    }
    
    /**
     * Redirect to dashboard if already authenticated
     * Use this on login page
     */
    function redirectIfAuthenticated() {
        const session = checkAuth();
        if (session) {
            window.location.href = 'dashboard.html';
            return true;
        }
        return false;
    }
    
    /**
     * Get current user info
     * @returns {Object|null}
     */
    function getCurrentUser() {
        const session = checkAuth();
        return session ? {
            username: session.username,
            loginTime: session.loginTime
        } : null;
    }
    
    // ============================================
    // Export Public API
    // ============================================
    
    return {
        login: login,
        logout: logout,
        checkAuth: checkAuth,
        requireAuth: requireAuth,
        redirectIfAuthenticated: redirectIfAuthenticated,
        getCurrentUser: getCurrentUser,
        clearSession: clearSession
    };
    
})();

// Make it available globally
window.SatelliteAuth = SatelliteAuth;
