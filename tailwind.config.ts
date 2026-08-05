import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        midnight: '#070F1C',
        surface: '#0D1B2E',
        teal: '#00C5D4',
        mint: '#00E5A0',
        urgent: '#FF4F4F',
        warn: '#F9A826',
      },
    },
  },
  plugins: [],
};

export default config;
