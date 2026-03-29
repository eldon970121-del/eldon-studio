/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Fraunces", "serif"],
        body: ["DM Sans", "sans-serif"],
      },
      boxShadow: {
        soft: "0 28px 80px rgba(0, 0, 0, 0.32)",
      },
    },
  },
  plugins: [],
};
