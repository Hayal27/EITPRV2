import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(),tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  esbuild: {
    loader: 'jsx',
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  server: {
    host: '0.0.0.0', // Allows access from other devices on the same network
    port: 5173, // Default Vite port
    strictPort: false, // Allow Vite to use alternative ports
  },
  build: {
    sourcemap: false, // Disable source maps in build to avoid issues
  },
  css: {
    devSourcemap: true, // Enable CSS source maps for development
  },
  // Ignore source map warnings for vendor files
  logLevel: 'warn',
});
