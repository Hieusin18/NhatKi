import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../Theme/ThemeContext";

type Props = {
  icon: string;
  title: string;
  description: string;
  ctaLabel: string;
  onCtaPress: () => void;
};

export default function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onCtaPress,
}: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[styles.iconBox, { backgroundColor: colors.secondaryButton }]}
      >
        <Text style={[styles.icon, { color: colors.primary }]}>{icon}</Text>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedText }]}>
        {description}
      </Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={onCtaPress}
      >
        <Text style={[styles.buttonText, { color: colors.primaryText }]}>
          {ctaLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  icon: {
    fontSize: 22,
    fontWeight: "800",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
    maxWidth: 300,
  },
  button: {
    marginTop: 22,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 12,
  },
  buttonText: {
    fontWeight: "700",
  },
});
