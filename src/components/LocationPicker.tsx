import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';

// Khai báo kiểu dữ liệu cho Props
interface LocationPickerProps {
  selectedLocation: string;
  onSelectLocation: (location: string) => void;
}

// Danh sách địa điểm gợi ý mẫu để test giao diện
const SUGGESTED_LOCATIONS = [
  'Trường Đại học CMC',
  'Lotte Mall West Lake, Hà Nội',
  'Aeon Mall Hà Đông',
  'Hồ Hoàn Kiếm, Hà Nội',
  'Hoài Đức, Hà Nội',
];

export default function LocationPicker({
  selectedLocation,
  onSelectLocation,
}: LocationPickerProps) {
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchText, setSearchText] = useState<string>('');

  // Lọc danh sách gợi ý khi người dùng gõ chữ
  const filteredLocations = SUGGESTED_LOCATIONS.filter(loc =>
    loc.toLowerCase().includes(searchText.toLowerCase()),
  );

  const handleSelect = (locName: string) => {
    onSelectLocation(locName);
    setSearchText(locName);
    setIsSearching(false); // Đóng bảng gợi ý sau khi chọn
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Vị trí kỷ niệm</Text>

      {/* Ô nhập/bấm chọn địa điểm */}
      <View style={styles.inputWrapper}>
        <Text style={styles.geoIcon}>📍</Text>
        <TextInput
          placeholder="Thêm địa điểm (Ví dụ: Đại học CMC...)"
          placeholderTextColor="#666"
          style={styles.input}
          value={selectedLocation || searchText}
          onChangeText={text => {
            setSearchText(text);
            onSelectLocation(text); // Cập nhật trực tiếp khi gõ
          }}
          onFocus={() => setIsSearching(true)}
        />
        {selectedLocation || searchText ? (
          <TouchableOpacity
            onPress={() => {
              onSelectLocation('');
              setSearchText('');
            }}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Bảng danh sách địa điểm gợi ý (Sẽ ẩn/hiện khi người dùng focus vào ô nhập) */}
      {isSearching && (
        <View style={styles.suggestionBox}>
          <Text style={styles.suggestionTitle}>Gợi ý gần đây:</Text>
          {filteredLocations.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionItem}
              onPress={() => handleSelect(item)}
            >
              <Text style={styles.pinIcon}>📌</Text>
              <Text style={styles.suggestionText}>{item}</Text>
            </TouchableOpacity>
          ))}
          {filteredLocations.length === 0 && (
            <Text style={styles.noResultText}>
              Bấm "Lưu" để tự định nghĩa vị trí mới
            </Text>
          )}
        </View>
      )}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2c2c2c',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#2c2c2c',
  },
  geoIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, color: '#fff', paddingVertical: 10, fontSize: 14 },
  clearIcon: { color: '#aaa', fontSize: 16, padding: 4 },
  suggestionBox: {
    backgroundColor: '#252525',
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  suggestionTitle: {
    color: '#666',
    fontSize: 12,
    marginBottom: 6,
    paddingLeft: 6,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  pinIcon: { fontSize: 14, marginRight: 8 },
  suggestionText: { color: '#ddd', fontSize: 14 },
  noResultText: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 8,
  },
});
