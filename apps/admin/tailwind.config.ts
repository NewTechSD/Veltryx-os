import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.ts"],
  theme: {
    extend: {
      colors: {
        surface: "#f6f7f9",
        ink: "#17202a",
        muted: "#687385",
        line: "#d9dee7",
        ok: "#16794c",
        warn: "#a05a00"
      }
    }
  },
  plugins: []
};

export default config;