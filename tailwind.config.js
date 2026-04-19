/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/app/**/*.{js,jsx,ts,tsx}',
    './src/components/**/*.{js,jsx,ts,tsx}',
    './src/features/**/*.{js,jsx,ts,tsx}',
    './src/hooks/**/*.{js,jsx,ts,tsx}',
    './src/lib/**/*.{js,jsx,ts,tsx}',
    './src/services/**/*.{js,jsx,ts,tsx}',
    './src/utils/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        diplomatic: {
          ink: '#131B2E',
          surface: '#FAF8FF',
          surfaceLow: '#F2F3FF',
          surfaceLowest: '#FFFFFF',
          surfaceHigh: '#E2E7FF',
          primary: '#0058BC',
          primaryContainer: '#0070EB',
          secondaryText: '#5F6678',
          tertiary: '#C15300',
        },
      },
      borderRadius: {
        flag: '4px',
        interactive: '8px',
        atelier: '24px',
      },
      boxShadow: {
        ambient: '0 12px 32px rgba(19, 27, 46, 0.06)',
      },
    },
  },
  plugins: [],
};

