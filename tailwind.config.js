module.exports = {
  purge: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},
  },
  variants: {
    extend: {},
  },
  plugins: [
    function ({ addUtilities }) {
      const newUtilities = {
        ".text-shadow": {
          textShadow: "0 2px 4px rgba(0, 0, 0, 0.5)",
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
