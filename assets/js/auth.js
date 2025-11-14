// assets/js/auth.js - FIXED VERSION
const SatelliteAuth = (function() {
    'use strict';
    
    const VALID_CREDENTIALS = {
        'demo': 'demo123',
        'admin': 'admin123',
        'mauro': 'satellite2025'
    };
    
    const SESSION_KEY = 'satelliteSession';
    const SESSION_EXPIRY_HOURS = 24;
    
    function login(username, password, rememberMe = false) {
        if (!username || !password) {
            return { success: false, message: 'Username and password are required' };
        }
        
        if (VALID_CREDENTIALS[username] && VALID_CREDENTIALS[username] === password) {
            const sessionData = {
                username: username,
                loginTime: new Date().toISOString(),
                rememberMe: rememberMe
            };
            
            const storage = rememberMe ? localStorage : sessionStorage;
            storage.setItem(SESSION_KEY, JSON.stringify(sessionData));
            
            console.log('Login successful:', username);
            
            return { success: true, message: 'Login successful', user: username };
        }
        
        return { success: false, message: 'Invalid username or password' };
    }
    
    function checkAuth() {
        const sessionData = localStorage.getItem(SESSION_KEY) || 
                           sessionStorage.getItem(SESSION_KEY);
        
        if (!sessionData) {
            console.log('No session found');
            return null;
        }
        
        try {
            const session = JSON.parse(sessionData);
            
            if (!session.username || !session.loginTime) {
                console.log('Invalid session structure');
                clearSession();
                return null;
            }
            
            const loginTime = new Date(session.loginTime);
            const now = new Date();
            const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
            
            if (hoursSinceLogin > SESSION_EXPIRY_HOURS) {
                console.log('Session expired');
                clearSession();
                return null;
            }
            
            console.log('Valid session found:', session.username);
            return session;
            
        } catch (e) {
            console.error('Error parsing session:', e);
            clearSession();
            return null;
        }
    }
    
    function logout() {
        console.log('Logging out');
        clearSession();
        window.location.replace('index.html');
    }
    
    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem(SESSION_KEY);
        sessionStorage.removeItem('redirecting');
        console.log('Session cleared');
    }
    
    function requireAuth() {
        console.log('Checking authentication for protected page');
        
        // Prevent redirect loop
        if (sessionStorage.getItem('redirecting')) {
            sessionStorage.removeItem('redirecting');
        }
        
        const session = checkAuth();
        if (!session) {
            console.log('Not authenticated, redirecting to login');
            window.location.replace('index.html');
            return null;
        }
        
        console.log('Authentication verified');
        return session;
    }
    
    function redirectIfAuthenticated() {
        // Don't check if we're currently redirecting
        if (sessionStorage.getItem('redirecting')) {
            console.log('Redirect in progress, skipping check');
            return false;
        }
        
        const session = checkAuth();
        if (session) {
            console.log('Already authenticated, redirecting to dashboard');
            sessionStorage.setItem('redirecting', 'true');
            
            // Use setTimeout to ensure storage is set before redirect
            setTimeout(function() {
                window.location.replace('dashboard.html');
            }, 100);
            
            return true;
        }
        
        console.log('Not authenticated, staying on login page');
        return false;
    }
    
    function getCurrentUser() {
        const session = checkAuth();
        return session ? {
            username: session.username,
            loginTime: session.loginTime
        } : null;
    }
    
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

window.SatelliteAuth = SatelliteAuth;
