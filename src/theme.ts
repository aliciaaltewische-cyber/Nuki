import { useColorScheme } from "react-native";

export const light = {
  bg: "#f6f5f1", card: "#ffffff", soft: "#eeece6", ink: "#121210", mut: "#86837b", line: "#e4e1d9",
  ok: "#6f8f5e", mid: "#c49a4a", no: "#b4614c", paw: "rgba(18,18,16,0.06)", blue: "#2448ee",
};
export const dark: typeof light = {
  bg: "#11110e", card: "#1b1b17", soft: "#23231e", ink: "#f1efe8", mut: "#9a978d", line: "#2d2d27",
  ok: "#7fa06c", mid: "#d0a656", no: "#c27159", paw: "rgba(241,239,232,0.06)", blue: "#4d8bff",
};
export type Theme = typeof light;
export const useTheme = (): Theme => (useColorScheme() === "dark" ? dark : light);
export const F = { light: "Inter_300Light", reg: "Inter_400Regular", med: "Inter_500Medium" };
