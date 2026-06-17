import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";

import OnboardingScreen from "../../src/screens/auth/OnboardingScreen";
import { useTheme } from "../../src/Theme/ThemeContext";

export default function Onboarding() {
  const { colors } = useTheme();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("hasSeenOnboarding").then((value) => {
      if (value === "true") {
        router.replace("/(auth)/login");
      } else {
        setChecking(false);
      }
    });
  }, []);

  if (checking) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return <OnboardingScreen />;
}
