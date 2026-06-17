import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "../../Theme/ThemeContext";

type PrivacyMode = "public" | "friends" | "private";

export default function SettingsScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const [notification, setNotification] = useState(true);
  const [autoSave, setAutoSave] = useState(false);
  const [privacyMode, setPrivacyMode] = useState<PrivacyMode>("friends");

  const renderRadio = (value: PrivacyMode, label: string) => {
    const selected = privacyMode === value;

    return (
      <Pressable
        style={[styles.radioRow, { borderBottomColor: colors.divider }]}
        onPress={() => setPrivacyMode(value)}
      >
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>

        <View
          style={[
            styles.radioOuter,
            { borderColor: selected ? colors.primary : colors.border },
          ]}
        >
          {selected ? (
            <View
              style={[styles.radioInner, { backgroundColor: colors.primary }]}
            />
          ) : null}
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.header, { color: colors.text }]}>Cai dat</Text>

      <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
        Giao dien
      </Text>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={[styles.item, { borderBottomColor: colors.divider }]}>
          <View style={styles.itemText}>
            <Text style={[styles.label, { color: colors.text }]}>
              Dark Mode
            </Text>
            <Text style={[styles.description, { color: colors.mutedText }]}>
              Dang dung {mode === "dark" ? "Dark" : "Light"}
            </Text>
          </View>

          <Switch
            value={mode === "dark"}
            onValueChange={toggleTheme}
            trackColor={{
              false: colors.switchTrackOff,
              true: colors.switchTrackOn,
            }}
            thumbColor={colors.switchThumb}
          />
        </View>

        <View style={styles.item}>
          <View style={styles.itemText}>
            <Text style={[styles.label, { color: colors.text }]}>
              Tu dong luu anh
            </Text>
            <Text style={[styles.description, { color: colors.mutedText }]}>
              Luu anh moi vao thu vien media
            </Text>
          </View>

          <Switch
            value={autoSave}
            onValueChange={setAutoSave}
            trackColor={{
              false: colors.switchTrackOff,
              true: colors.switchTrackOn,
            }}
            thumbColor={colors.switchThumb}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
        Thong bao
      </Text>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.item}>
          <View style={styles.itemText}>
            <Text style={[styles.label, { color: colors.text }]}>
              Thong bao moi
            </Text>
            <Text style={[styles.description, { color: colors.mutedText }]}>
              Nhan thong bao khi co bai viet va tuong tac moi
            </Text>
          </View>

          <Switch
            value={notification}
            onValueChange={setNotification}
            trackColor={{
              false: colors.switchTrackOff,
              true: colors.switchTrackOn,
            }}
            thumbColor={colors.switchThumb}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
        Quyen rieng tu
      </Text>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {renderRadio("public", "Cong khai")}
        {renderRadio("friends", "Chi ban be")}
        {renderRadio("private", "Rieng tu")}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.primaryText }]}>
            Quan ly tai khoan
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.danger }]}
        >
          <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
            Dang xuat
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 56,
  },
  header: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 18,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  section: {
    borderWidth: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  item: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  itemText: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  radioRow: {
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  actions: {
    marginTop: 22,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "700",
    fontSize: 16,
  },
});
