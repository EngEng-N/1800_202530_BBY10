import { defineConfig } from 'vite';

export default defineConfig({
    // Base public path when served
    base: './',
    
    // Configure the dev server
    server: {
        port: 5173,
        open: true // Automatically open browser on server start
    },

    // Build configuration
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        rollupOptions: {
            input: {
                main: './index.html',
                login: './login.html',
                register: './register.html',
                dashboard: './main.html'
            }
        }
    }
});