/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  corePlugins: {
    // Disable preflight if it interferes with styles.css base resets, or keep it enabled
    preflight: false,
  },
  theme: {
    extend: {},
  },
  plugins: [],
};
