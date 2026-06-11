import React from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";

const groupData = {
  name: "Nhóm Dev 4",
  avatar: "https://i.pravatar.cc/200",
  members: [
    { id: "1", name: "Nguyễn Văn A" },
    { id: "2", name: "Trần Thị B" },
    { id: "3", name: "Lê Văn C" },
  ],
};

export default function GroupSettingScreen() {
  return (
    <View style={styles.container}>
      <Image source={{ uri: groupData.avatar }} style={styles.avatar} />

      <Text style={styles.groupName}>{groupData.name}</Text>

      <Text style={styles.title}>Danh sách thành viên</Text>

      <FlatList
        data={groupData.members}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Text style={styles.member}>• {item.name}</Text>
        )}
      />

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Đổi tên nhóm</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Thay đổi ảnh nhóm</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Mời thành viên</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.leaveBtn]}>
        <Text style={styles.buttonText}>Rời nhóm</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginTop: 20,
  },

  groupName: {
    textAlign: "center",
    fontSize: 22,
    fontWeight: "bold",
    marginVertical: 15,
  },

  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },

  member: {
    fontSize: 16,
    marginBottom: 8,
  },

  button: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
  },

  leaveBtn: {
    backgroundColor: "red",
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});
