/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss'

export default <Partial<Config>> {
  /*
   * Tailwind only emits a utility class if it finds the literal string inside
   * one of these files. An empty array falls back to @nuxtjs/tailwindcss
   * defaults, which do NOT include helper/ or utils/ — that is why the design
   * tokens in helper/portalTheme.ts produced no CSS at all.
   */
  content: [
    './components/**/*.{vue,mjs,ts}',
    './layouts/**/*.{vue,mjs,ts}',
    './pages/**/*.{vue,mjs,ts}',
    './composables/**/*.{vue,mjs,ts}',
    './plugins/**/*.{vue,mjs,ts}',
    './middleware/**/*.{js,ts}',
    './stores/**/*.{js,ts}',
    './helper/**/*.{js,ts}',
    './utils/**/*.{js,ts}',
    './App.{vue,mjs,ts}',
    './app.{vue,mjs,ts}',
    './Error.{vue,mjs,ts}',
    './error.{vue,mjs,ts}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Example font family
        serif: ['Georgia', 'serif'],
        mono: ['Menlo', 'monospace'],
      },
      aspectRatio: {
        auto: 'auto',
        square: '1 / 1',
        video: '16 / 9'
      }
    },
  },
  plugins: [],
}


