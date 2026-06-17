import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";

type ThemeMode = "light" | "dark";

const lightColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  card: "#FFFFFF",
  text: "#111827",
  mutedText: "#6B7280",
  border: "#E5E7EB",
  divider: "#E5E7EB",
  primary: "#4F46E5",
  primaryText: "#FFFFFF",
  secondaryButton: "#EEF2FF",
  secondaryButtonText: "#3730A3",
  danger: "#DC2626",
  icon: "#374151",
  switchTrackOff: "#D1D5DB",
  switchTrackOn: "#818CF8",
  switchThumb: "#FFFFFF",
};

const darkColors = {
  background: "#0B1020",
  surface: "#111827",
  card: "#172033",
  text: "#F9FAFB",
  mutedText: "#CBD5E1",
  border: "#293548",
  divider: "#293548",
  primary: "#818CF8",
  primaryText: "#FFFFFF",
  secondaryButton: "#26314A",
  secondaryButtonText: "#E0E7FF",
  danger: "#F87171",
  icon: "#E5E7EB",
  switchTrackOff: "#4B5563",
  switchTrackOn: "#6366F1",
  switchThumb: "#FFFFFF",
};

type Theme = {
  mode: ThemeMode;
  colors: typeof lightColors;
  toggleTheme: () => void;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<Theme | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>(
    systemScheme === "dark" ? "dark" : "light",
  );
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("themeMode").then((saved) => {
      if (saved === "light" || saved === "dark") {
        setModeState(saved);
      }
      setReady(true);
    });
  }, []);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    AsyncStorage.setItem("themeMode", nextMode);
  };

  const toggleTheme = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  const value = useMemo(
    () => ({
      mode,
      colors: mode === "dark" ? darkColors : lightColors,
      toggleTheme,
      setMode,
    }),
    [mode],
  );

  if (!ready) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
