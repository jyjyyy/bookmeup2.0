/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#C86DD7',
        primaryDark: '#9C44AF',
        secondary: '#F5E9F8',
        background: '#FAF7FB',
        textDark: '#2A1F2D',
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

