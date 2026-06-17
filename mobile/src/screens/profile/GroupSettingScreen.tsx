import React, { useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useTheme } from "../../Theme/ThemeContext";
import EmptyState from "../../components/EmptyState";
const groupData = {
  name: "Nhom Dev 4",
  avatar: "https://i.pravatar.cc/200",
  members: [
    { id: "1", name: "Nguyen Van A" },
    { id: "2", name: "Tran Thi B" },
    { id: "3", name: "Le Van C" },
  ],
};

export default function GroupSettingScreen() {
  const { colors, mode, toggleTheme } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [privateGroup, setPrivateGroup] = useState(false);

  const renderMember = ({ item }: { item: { id: string; name: string } }) => (
    <View style={[styles.listItem, { borderBottomColor: colors.divider }]}>
      <Text style={[styles.memberName, { color: colors.text }]}>
        {item.name}
      </Text>
      <Text style={[styles.memberRole, { color: colors.mutedText }]}>
        Member
      </Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.headerCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Image source={{ uri: groupData.avatar }} style={styles.avatar} />
        <Text style={[styles.groupName, { color: colors.text }]}>
          {groupData.name}
        </Text>
        <Text style={[styles.groupMeta, { color: colors.mutedText }]}>
          {groupData.members.length} thanh vien
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
        Giao dien
      </Text>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View
          style={[styles.settingRow, { borderBottomColor: colors.divider }]}
        >
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Dark Mode
            </Text>
            <Text
              style={[styles.settingDescription, { color: colors.mutedText }]}
            >
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

        <View
          style={[styles.settingRow, { borderBottomColor: colors.divider }]}
        >
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Thong bao
            </Text>
            <Text
              style={[styles.settingDescription, { color: colors.mutedText }]}
            >
              Nhan thong bao bai viet moi
            </Text>
          </View>

          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{
              false: colors.switchTrackOff,
              true: colors.switchTrackOn,
            }}
            thumbColor={colors.switchThumb}
          />
        </View>

        <View style={styles.settingRow}>
          <View>
            <Text style={[styles.settingLabel, { color: colors.text }]}>
              Nhom rieng tu
            </Text>
            <Text
              style={[styles.settingDescription, { color: colors.mutedText }]}
            >
              Chi thanh vien moi xem duoc noi dung
            </Text>
          </View>

          <Switch
            value={privateGroup}
            onValueChange={setPrivateGroup}
            trackColor={{
              false: colors.switchTrackOff,
              true: colors.switchTrackOn,
            }}
            thumbColor={colors.switchThumb}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.mutedText }]}>
        Thanh vien
      </Text>

      <View
        style={[
          styles.section,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <FlatList
          data={groupData.members}
          keyExtractor={(item) => item.id}
          renderItem={renderMember}
          scrollEnabled={false}
          ListEmptyComponent={
            <EmptyState
              icon="TEAM"
              title="Nhom chua co thanh vien"
              description="Moi thanh vien dau tien de bat dau chia se ky niem cung nhau."
              ctaLabel="Moi thanh vien"
              onCtaPress={() => {}}
            />
          }
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Text style={[styles.buttonText, { color: colors.primaryText }]}>
            Moi thanh vien
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.danger }]}
        >
          <Text style={[styles.buttonText, { color: "#FFFFFF" }]}>
            Roi nhom
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
  headerCard: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 12,
  },
  groupName: {
    fontSize: 22,
    fontWeight: "700",
  },
  groupMeta: {
    fontSize: 14,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 24,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingRow: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingDescription: {
    fontSize: 13,
    marginTop: 3,
  },
  listItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: "600",
  },
  memberRole: {
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    marginTop: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "700",
  },
});
