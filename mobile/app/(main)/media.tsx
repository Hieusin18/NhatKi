import { router } from "expo-router";
import { StyleSheet, View } from "react-native";

import EmptyState from "../../src/components/EmptyState";
import { useTheme } from "../../src/Theme/ThemeContext";

export default function Media() {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <EmptyState
        icon="MEDIA"
        title="Chua co anh hoac video"
        description="Anh va video ban chup se xuat hien o day."
        ctaLabel="Mo camera"
        onCtaPress={() => router.push("/(main)/camera")}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
