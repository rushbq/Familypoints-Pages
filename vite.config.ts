import path from 'path';
import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const buildVersion = new Date().toISOString();
const serviceWorkerTemplate = readFileSync(path.resolve(__dirname, 'service-worker.js'), 'utf8');

export default defineConfig({
  // GitHub Pages 部署設定（倉庫名：Familypoints-Pages）
  base: '/Familypoints-Pages/',
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    {
      name: 'emit-app-version',
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'version.json',
          source: JSON.stringify({ version: buildVersion }),
        });
        this.emitFile({
          type: 'asset',
          fileName: 'sw.js',
          source: serviceWorkerTemplate.replaceAll('__APP_BUILD_VERSION__', buildVersion),
        });
      },
    },
  ],
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
