import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#00C896', 50: '#E6FDF5', 100: '#CCFBF1', 500: '#00C896', 600: '#00A87E', 700: '#007A5E' },
        dark: { DEFAULT: '#07090F', 100: '#111622', 200: '#1A2235', 300: '#263148', 400: '#3D4E6B', 500: '#7B8DB0' },
        accent: { DEFAULT: '#3B82F6', 500: '#3B82F6' },
        danger: { DEFAULT: '#EF4444', 500: '#EF4444' },
        success: { DEFAULT: '#10B981', 500: '#10B981' },
        warning: { DEFAULT: '#F59E0B', 500: '#F59E0B' },
      },
      fontFamily: { sans: ['Cairo', 'Tajawal', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};

export default config;
