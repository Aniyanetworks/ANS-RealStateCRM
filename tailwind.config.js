/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // rubik: ["Rubik", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
      },
      colors: {
        primaryPurple: "#0f766e",
        lightPurple: "#99f6e4",
        darkBlue: "#1E3A8A",
      },
      keyframes: {
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        blink: "blink 1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
