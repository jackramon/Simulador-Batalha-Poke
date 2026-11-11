import path from 'path';
// Fix: Import fileURLToPath to define __dirname in ESM environment
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Fix: Manually define __filename and __dirname as they are not available in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          // Fix: Use the newly defined __dirname for path resolution
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});