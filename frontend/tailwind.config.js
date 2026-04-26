export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: {
          DEFAULT: '#C9A84C',
          light: '#E8C86A',
          dark:  '#A8891F',
          faint: 'rgba(201,168,76,0.12)',
        },
        gov: {
          900: '#020602',
          800: '#040c04',
          700: '#060f06',
          600: '#091409',
          500: '#0c1c0c',
          400: '#102510',
          300: '#152e15',
          200: '#1a3a1a',
          100: '#224a22',
          border: '#1a3020',
          text:   '#b8d8b8',
          muted:  '#527052',
          dim:    '#2a3e2a',
        },
        classified: '#cc2200',
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', '"Courier New"', 'monospace'],
      },
      animation: {
        'pulse-ring': 'pulse-ring 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':  'spin 4s linear infinite',
        'fade-in':    'fadeIn 0.3s ease forwards',
      },
      keyframes: {
        'pulse-ring': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)'    },
          '50%':       { opacity: '0.4', transform: 'scale(1.05)' },
        },
        'fadeIn': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)'    },
        },
      },
    },
  },
  plugins: [],
};
