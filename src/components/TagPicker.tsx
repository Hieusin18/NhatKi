import React from "react";
import { View, Text, StyleSheet, TextInput } from "react-native";
import { EmotionPicker } from "./EmotionPicker";

interface TagPickerProps {
  emotion: string | null;
  setEmotion: (emotion: string) => void;
  location: string;
  setLocation: (location: string) => void;
}

export const TagPicker: React.FC<TagPickerProps> = ({
  emotion,
  setEmotion,
  location,
  setLocation,
}) => {
  return (
    <View style={styles.container}>
      <EmotionPicker selectedEmotion={emotion} onSelectEmotion={setEmotion} />
      <View style={styles.locationContainer}>
        <Text style={styles.label}>📍 Gắn thẻ địa điểm:</Text>
        <TextInput
          style={styles.input}
          placeholder="Nhập địa điểm hiện tại..."
          value={location}
          onChangeText={setLocation}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: "#fff", borderRadius: 8, padding: 8 },
  locationContainer: { marginTop: 12, paddingHorizontal: 12 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: "#333" },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 8,
    fontSize: 13,
  },
});
