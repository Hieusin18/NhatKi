import React from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";

import useProfile from "../../hooks/useProfile";

export default function ProfileScreen() {
  const { profile, loading, error } = useProfile();

  if (loading) {
    return <ActivityIndicator size="large" />;
  }

  if (error) {
    return <Text>{error}</Text>;
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text>Không có dữ liệu người dùng</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: profile.avatar }} style={styles.avatar} />
      <Text style={styles.name}>{profile.name}</Text>
      <Text style={styles.email}>{profile.email}</Text>
      <Text>{profile.bio}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          console.log("Đã bấm");
          router.push("/edit-profile");
        }}
      >
        <Text style={styles.buttonText}>Chỉnh sửa hồ sơ</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },

  name: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
  },

  email: {
    color: "gray",
    marginBottom: 10,
  },

  button: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 10,
    marginTop: 20,
  },

  buttonText: {
    color: "white",
    fontWeight: "bold",
  },
});
