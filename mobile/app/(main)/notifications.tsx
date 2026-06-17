import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import EmptyState from "../../src/components/EmptyState";
import { useTheme } from "../../src/Theme/ThemeContext";

export default function Notifications() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon="BELL"
        title="Chua co thong bao"
        description="Thong bao ve bai viet, binh luan va loi moi se xuat hien tai day."
        ctaLabel="Ve Feed"
        onCtaPress={() => router.push("/(main)")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
