import React from "react";
import { router } from "expo-router";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import useProfile from "../../hooks/useProfile";
import { useTheme } from "../../Theme/ThemeContext";
export default function ProfileScreen() {
  const { profile, loading, error } = useProfile();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.error, { color: colors.danger }]}>{error}</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Khong co du lieu nguoi dung
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Image source={{ uri: profile.avatar }} style={styles.avatar} />

        <Text style={[styles.name, { color: colors.text }]}>
          {profile.name}
        </Text>
        <Text style={[styles.email, { color: colors.mutedText }]}>
          {profile.email}
        </Text>
        <Text style={[styles.bio, { color: colors.text }]}>
          {profile.bio || "Chua co bio"}
        </Text>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>24</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>
              Posts
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>8</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>
              Groups
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.text }]}>128</Text>
            <Text style={[styles.statLabel, { color: colors.mutedText }]}>
              Friends
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          >
            <Text
              style={[styles.primaryButtonText, { color: colors.primaryText }]}
            >
              Follow
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.secondaryButton,
              { backgroundColor: colors.secondaryButton },
            ]}
            onPress={() => router.push("/edit-profile")}
          >
            <Text
              style={[
                styles.secondaryButtonText,
                { color: colors.secondaryButtonText },
              ]}
            >
              Message
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: "center",
  },
  card: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
    textAlign: "center",
  },
  divider: {
    width: "100%",
    height: 1,
    marginVertical: 20,
  },
  stats: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 13,
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
    width: "100%",
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    fontWeight: "700",
  },
  secondaryButtonText: {
    fontWeight: "700",
  },
  error: {
    fontSize: 16,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 16,
  },
});
