/** @type {import('tailwindcss').Config} */
import tailwindcss from 'tailwindcss-primeui';

export default {
  content: [
    './presets/**/*.{js,vue,ts}',
  ],
  purge: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [
    tailwindcss,
  ],
};
