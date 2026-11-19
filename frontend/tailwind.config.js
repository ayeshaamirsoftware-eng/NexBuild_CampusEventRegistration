/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        border: 'var(--border)',
        'text-primary': 'var(--text-primary)',
        'text-muted': 'var(--text-muted)',
        brand: 'var(--brand)',
        'brand-foreground': 'var(--brand-foreground)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      boxShadow: {
        soft: '0 10px 30px -18px rgba(15, 23, 42, 0.24)',
        raised: '0 18px 48px -24px rgba(15, 23, 42, 0.38)',
      },
    },
  },
  plugins: [],
}
