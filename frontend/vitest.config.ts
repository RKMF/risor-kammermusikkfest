import {defineConfig} from 'vitest/config'
import {getViteConfig} from 'astro/config'

export default defineConfig(
  getViteConfig(
    defineConfig({
      test: {
        globals: true,
        environment: 'node',
        include: ['**/*.test.ts', '**/*.test.tsx', '**/*.test.js', '**/*.test.jsx'],
        exclude: ['node_modules', 'dist', '.astro']
      }
    })
  )
)
