/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: "#1F5C4F",
        marigold: "#F2A93B",
        coral: "#E85D42",
      },
    },
  },
  plugins: [],
};
