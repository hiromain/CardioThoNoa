/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: '#1E3A5F',
        accent: '#C0392B',
        cardiac: {
          DEFAULT: '#C0392B',
          light: '#FDECEA',
          muted: 'rgba(192,57,43,0.12)',
        },
        thoracic: {
          DEFAULT: '#2171B5',
          light: '#EBF5FB',
          muted: 'rgba(33,113,181,0.12)',
        },
        success: '#27AE60',
        warning: '#E67E22',
        // Theme-aware tokens (driven by CSS variables — swap in dark mode)
        bg: 'var(--bg)',
        surface: {
          DEFAULT: 'var(--surface)',
          2: 'var(--surface-2)',
        },
        line: 'var(--border)',
        ink: {
          1: 'var(--text-1)',
          2: 'var(--text-2)',
          3: 'var(--text-3)',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        pill: '999px',
      },
      boxShadow: {
        sm: '0 1px 4px rgba(0,0,0,0.07)',
        md: '0 4px 14px rgba(0,0,0,0.09)',
        lg: '0 8px 28px rgba(0,0,0,0.12)',
      },
      maxWidth: {
        app: '480px',
      },
    },
  },
  plugins: [],
};
