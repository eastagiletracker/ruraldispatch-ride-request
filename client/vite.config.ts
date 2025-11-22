import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Load env file from client directory
  const env = loadEnv(mode, __dirname, '');

  return {
    plugins: [react()],
    resolve: {
      alias: [
        // Zod v4 path resolution for shared schemas
        {
          find: /^zod\/v4$/,
          replacement: path.resolve(__dirname, 'node_modules', 'zod', 'v4'),
        },
        {
          find: /^zod\/v4\/(.+)$/,
          replacement: path.resolve(__dirname, 'node_modules', 'zod', 'v4', '$1'),
        },
        // react-phone-number-input resolution
        {
          find: 'react-phone-number-input',
          replacement: path.resolve(__dirname, 'node_modules', 'react-phone-number-input'),
        },
        // Project aliases
        {
          find: '@',
          replacement: path.resolve(__dirname, './src'),
        },
        {
          find: '@shared',
          replacement: path.resolve(__dirname, '../shared'),
        },
      ],
    },
    // Expose VITE_ prefixed env vars to the client
    define: {
      'import.meta.env.VITE_GOOGLE_MAPS_API_KEY': JSON.stringify(env.VITE_GOOGLE_MAPS_API_KEY),
    },
    // Optimize dependencies
    optimizeDeps: {
      include: ['react-phone-number-input'],
    },
    // Build configuration
    build: {
      sourcemap: mode === 'development', // Only generate sourcemaps in dev
      rollupOptions: {
        onwarn(warning, warn) {
          // Suppress sourcemap warnings from dependencies
          if (warning.code === 'SOURCEMAP_ERROR') return;
          warn(warning);
        },
      },
      commonjsOptions: {
        include: [/react-phone-number-input/, /node_modules/],
      },
    },
    server: {
      host: '127.0.0.1', // Restrict to localhost only
      port: 5173,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:5001',
          changeOrigin: true,
        },
      },
    },
  };
});
