import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const envDir = dirname(fileURLToPath(import.meta.url));

// The "shared" mode is used by group members who do not have database
// credentials. It proxies /api to the deployed backend, which owns the
// shared Neon connection. Normal `npm run dev` keeps using the local API.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');
  const proxyTarget = env.VITE_API_PROXY;

  return {
    plugins: [react()],
    server: proxyTarget
      ? {
          proxy: {
            '/api': {
              target: proxyTarget,
              changeOrigin: true,
              secure: true
            }
          }
        }
      : undefined
  };
});
