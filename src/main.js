// main.js
// This file initializes the application and sets up auth state monitoring

import { checkAuthState } from './authentication.js';

// Initialize authentication state monitoring
document.addEventListener('DOMContentLoaded', () => {
    console.log('Main.js loaded - Initializing auth state check');
    checkAuthState();
});
