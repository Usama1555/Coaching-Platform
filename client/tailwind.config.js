/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101827',
        mist: '#eef2ff',
        tide: '#d9e7ff',
        surge: '#0f766e',
        coral: '#ff6b57',
        gold: '#f2c14e',
      },
      boxShadow: {
        soft: '0 24px 60px -24px rgba(15, 23, 42, 0.35)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"IBM Plex Sans"', 'sans-serif'],
      },
      backgroundImage: {
        hero:
          'radial-gradient(circle at top left, rgba(255,107,87,0.28), transparent 28%), radial-gradient(circle at top right, rgba(15,118,110,0.25), transparent 30%), linear-gradient(135deg, #0f172a 0%, #111827 40%, #172554 100%)',
      },
    },
  },
  plugins: [],
};

