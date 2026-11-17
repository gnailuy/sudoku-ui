import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const publicBasePath = (mountPath: string | undefined) => {
  const normalized = (mountPath ?? '').trim();
  if (normalized === '' || normalized === '/') return '/';
  if (!normalized.startsWith('/') || normalized.endsWith('/')) {
    throw new Error(
      'SUDOKU_MOUNT_PATH must be empty, /, or an absolute path without a trailing slash',
    );
  }
  return `${normalized}/`;
};

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: publicBasePath(env.SUDOKU_MOUNT_PATH),
    build: { manifest: true },
    plugins: [react()],
    test: {
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        include: [
          'src/components/**/*.{ts,tsx}',
          'src/hooks/**/*.{ts,tsx}',
          'src/presentation.ts',
        ],
        reporter: ['text', 'json-summary'],
        thresholds: {
          perFile: true,
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80,
        },
      },
    },
    server: {
      proxy: {
        '/api': env.SUDOKU_API_PROXY || 'http://127.0.0.1:8080',
        '/healthz': env.SUDOKU_API_PROXY || 'http://127.0.0.1:8080',
      },
    },
  };
});
