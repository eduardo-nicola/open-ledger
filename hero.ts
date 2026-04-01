import { heroui } from "@heroui/react";

/**
 * Primary alinhado à paleta `--ol-blue-*` em `app/theme/openledger-tokens.css`.
 * Ao ajustar tons de marca, atualize os dois arquivos.
 */
const primaryLight = {
  50: "#eef2fb",
  100: "#dce6f7",
  200: "#c0d0ef",
  300: "#96b0e3",
  400: "#6488d4",
  500: "#456db8",
  600: "#365897",
  700: "#2d477a",
  800: "#273c65",
  900: "#233554",
  DEFAULT: "#456db8",
  foreground: "#ffffff",
} as const;

const primaryDark = {
  50: "#233554",
  100: "#273c65",
  200: "#2d477a",
  300: "#365897",
  400: "#456db8",
  500: "#6488d4",
  600: "#96b0e3",
  700: "#c0d0ef",
  800: "#dce6f7",
  900: "#eef2fb",
  DEFAULT: "#6488d4",
  foreground: "#0c1420",
} as const;

export default heroui({
  themes: {
    light: {
      colors: {
        primary: { ...primaryLight },
      },
    },
    dark: {
      colors: {
        primary: { ...primaryDark },
      },
    },
  },
});
