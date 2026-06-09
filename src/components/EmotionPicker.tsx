import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

interface EmotionPickerProps {
  selectedEmotion: string | null;
  onSelectEmotion: (emotion: string) => void;
}

const EMOTIONS = [
  { label: "Vui vẻ", emoji: "🥰" },
  { label: "Hào hứng", emoji: "🤩" },
  { label: "Bình yên", emoji: "🍃" },
  { label: "Buồn", emoji: "🥺" },
  { label: "Mệt mỏi", emoji: "😴" },
];

export const EmotionPicker: React.FC<EmotionPickerProps> = ({
  selectedEmotion,
  onSelectEmotion,
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hôm nay bạn thấy thế nào?</Text>
      <View style={styles.list}>
        {EMOTIONS.map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.item,
              selectedEmotion === item.emoji && styles.selectedItem,
            ]}
            onPress={() => onSelectEmotion(item.emoji)}
          >
            <Text style={styles.emoji}>{item.emoji}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 12 },
  title: { fontSize: 14, fontWeight: "600", marginBottom: 10, color: "#333" },
  list: { flexDirection: "row", justifyContent: "space-between" },
  item: { alignItems: "center", padding: 8, borderRadius: 8 },
  selectedItem: { backgroundColor: "#FAEEDA" }, // Tone màu vàng nhạt ấm áp
  emoji: { fontSize: 26, marginBottom: 4 },
  label: { fontSize: 11, color: "#555" },
});
