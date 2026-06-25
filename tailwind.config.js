/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['Fraunces', 'Newsreader', 'Georgia', 'serif'],
      },
      boxShadow: {
        glow: '0 24px 80px rgba(91, 143, 212, 0.22)',
        warm: '0 28px 90px rgba(200, 70, 44, 0.22)',
      },
      animation: {
        'fade-up': 'fadeUp 900ms ease both',
        'slow-pan': 'slowPan 16s ease-in-out infinite alternate',
        'signal-flow': 'signalFlow 8s linear infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0.72', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slowPan: {
          '0%': { transform: 'scale(1.02) translate3d(-1%, -1%, 0)' },
          '100%': { transform: 'scale(1.08) translate3d(1%, 1%, 0)' },
        },
        signalFlow: {
          '0%': { strokeDashoffset: '260' },
          '100%': { strokeDashoffset: '0' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.9', transform: 'scale(1.04)' },
        },
      },
    },
  },
  plugins: [],
}
