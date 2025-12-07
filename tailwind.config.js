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
        primary: '#f37db9',
        secondary: '#6b7280',
        background: '#faf7fb',
      },
      borderRadius: {
        '32': '32px',
        'custom': '32px',
      },
      boxShadow: {
        'bookmeup': '0_15px_50px_rgba(20,0,50,0.06)',
        'bookmeup-lg': '0_20px_60px_rgba(20,0,50,0.08)',
        'bookmeup-sm': '0_10px_30px_rgba(20,0,50,0.04)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

