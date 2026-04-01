/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--primary)',
        primaryDark: 'var(--primary-dark)',
        secondary: 'var(--secondary)',
        background: 'var(--background)',
        textDark: 'var(--text-dark)',
        'card-bg': 'var(--card-bg)',
      },
      borderRadius: {
        '32': '32px',
        'custom': '32px',
      },
      boxShadow: {
        'bookmeup': '0 15px 40px rgba(0,0,0,0.06)',
        'bookmeup-lg': '0_20px_60px_rgba(20,0,50,0.08)',
        'bookmeup-sm': '0_10px_30px_rgba(20,0,50,0.04)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
