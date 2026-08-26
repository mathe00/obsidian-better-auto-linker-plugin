import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    // The linker core is pure string processing - no DOM required.
    environment: 'node',
  },
});
