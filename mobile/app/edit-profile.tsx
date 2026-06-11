import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";

export default function EditProfile() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chỉnh sửa hồ sơ</Text>

      <Text style={styles.text}>Đây là màn hình chỉnh sửa hồ sơ</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace("/(main)")}
      >
        <Text style={styles.buttonText}>Về Trang Chủ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },

  text: {
    fontSize: 16,
    marginBottom: 20,
  },

  button: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
