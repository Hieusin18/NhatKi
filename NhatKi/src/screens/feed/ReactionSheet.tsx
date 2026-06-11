import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Modal } from "react-native";

interface ReactionSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectReaction: (emoji: string) => void;
}

const REACTION_EMOJIS = ["❤️", "👍", "😮", "😂", "🔥"];

export const ReactionSheet: React.FC<ReactionSheetProps> = ({
  isVisible,
  onClose,
  onSelectReaction,
}) => {
  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.blurArea} onPress={onClose} />
        <View style={styles.content}>
          <Text style={styles.title}>Bày tỏ cảm xúc với khoảnh khắc này</Text>
          <View style={styles.emojiRow}>
            {REACTION_EMOJIS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiButton}
                onPress={() => {
                  onSelectReaction(emoji);
                  onClose();
                }}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  blurArea: { flex: 1 },
  content: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  title: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  emojiRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  emojiButton: { padding: 8, backgroundColor: "#f5f5f5", borderRadius: 24 },
  emojiText: { fontSize: 26 },
});
