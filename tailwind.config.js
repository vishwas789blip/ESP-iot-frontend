/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        // Neutral surface scale — cool graphite, not pure black.
        // 900 = page background ... 500 = lightest / hover surfaces.
        ink: {
          900: 'rgb(9 9 11 / <alpha-value>)',
          850: 'rgb(13 13 16 / <alpha-value>)',
          800: 'rgb(19 19 23 / <alpha-value>)',
          700: 'rgb(26 26 31 / <alpha-value>)',
          600: 'rgb(38 38 45 / <alpha-value>)',
          500: 'rgb(75 75 86 / <alpha-value>)',
        },
        // A single, restrained brand accent used for every primary
        // action / active state. accent-violet and accent-blue are
        // kept as aliases of the SAME color so nothing looks like two
        // competing brand colors — they exist only so existing class
        // names throughout the app keep working unchanged.
        accent: {
          cyan: 'rgb(59 130 246 / <alpha-value>)',   // primary — blue-500
          blue: 'rgb(59 130 246 / <alpha-value>)',    // alias of primary
          violet: 'rgb(59 130 246 / <alpha-value>)',  // alias of primary
          green: 'rgb(16 185 129 / <alpha-value>)',   // success / online
          red: 'rgb(239 68 68 / <alpha-value>)',      // danger / offline
          amber: 'rgb(245 158 11 / <alpha-value>)',   // warning
        },
      },
      boxShadow: {
        // Soft, tasteful focus glow instead of a neon blur.
        glow: '0 0 0 1px rgb(59 130 246 / 0.25), 0 6px 20px -6px rgb(59 130 246 / 0.35)',
        'glow-amber': '0 0 0 1px rgb(245 158 11 / 0.25), 0 6px 20px -6px rgb(245 158 11 / 0.35)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.96)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        pulseRing: {
          '0%': { transform: 'scale(0.9)', opacity: 0.6 },
          '80%, 100%': { transform: 'scale(1.6)', opacity: 0 },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'scale-in': 'scaleIn 0.15s ease-out',
        'pulse-ring': 'pulseRing 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
      },
    },
  },
  plugins: [],
}
