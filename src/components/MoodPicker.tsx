import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import EmojiPicker, { EmojiType } from 'rn-emoji-keyboard';

// Khai báo kiểu dữ liệu cho các Props nhận vào
interface MoodPickerProps {
  selectedMood: string;
  onSelectMood: (emoji: string) => void;
}

export default function MoodPicker({
  selectedMood,
  onSelectMood,
}: MoodPickerProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  // Xử lý khi chọn emoji từ thư viện
  const handlePick = (emojiObject: EmojiType) => {
    onSelectMood(emojiObject.emoji); // Lấy ký tự emoji truyền ngược về màn hình cha
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hôm nay tâm trạng bạn thế nào?</Text>

      <TouchableOpacity
        style={styles.pickerButton}
        onPress={() => setIsOpen(true)}
      >
        <Text style={styles.pickerButtonText}>
          {selectedMood
            ? `Cảm xúc hiện tại: ${selectedMood}`
            : '✨ Bấm để chọn cảm xúc...'}
        </Text>
      </TouchableOpacity>

      {/* Bàn phím Emoji của thư viện */}
      <EmojiPicker
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onEmojiSelected={handlePick}
        theme={{
          backdrop: 'rgba(0,0,0,0.5)',
          container: '#1e1e1e',
          header: '#fff',
          skinTonesContainer: '#2c2c2c',
          category: {
            icon: '#bb86fc',
            iconActive: '#fff',
            container: '#2c2c2c',
            containerActive: '#bb86fc',
          },
          search: {
            background: '#2c2c2c',
            text: '#fff',
            placeholder: '#666',
            icon: '#bb86fc',
          },
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#1e1e1e',
    borderRadius: 12,
    marginVertical: 8,
  },
  title: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 12 },
  pickerButton: {
    backgroundColor: '#2c2c2c',
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bb86fc',
    alignItems: 'center',
  },
  pickerButtonText: { color: '#fff', fontSize: 14, fontWeight: '500' },
});
