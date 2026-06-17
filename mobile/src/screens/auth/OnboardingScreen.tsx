import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../Theme/ThemeContext";

const { width } = Dimensions.get("window");

const slides = [
  {
    key: "camera",
    icon: "CAM",
    title: "Camera",
    description: "Chup va luu lai khoanh khac hang ngay cua ban.",
  },
  {
    key: "feed",
    icon: "FEED",
    title: "Feed nhom",
    description: "Chia se bai viet voi nhom va theo doi cap nhat moi.",
  },
  {
    key: "realtime",
    icon: "LIVE",
    title: "Realtime",
    description: "Nhan tuong tac va thong bao moi ngay khi co cap nhat.",
  },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const finish = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.replace("/(auth)/login");
  };

  const next = () => {
    if (index === slides.length - 1) {
      finish();
      return;
    }

    listRef.current?.scrollToIndex({ index: index + 1, animated: true });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <TouchableOpacity style={styles.skipButton} onPress={finish}>
        <Text style={[styles.skipText, { color: colors.mutedText }]}>Skip</Text>
      </TouchableOpacity>

      <Animated.FlatList
        ref={listRef}
        data={slides}
        horizontal
        pagingEnabled
        keyExtractor={(item) => item.key}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const nextIndex = Math.round(
            event.nativeEvent.contentOffset.x / width,
          );
          setIndex(nextIndex);
        }}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false },
        )}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <View
              style={[
                styles.iconBox,
                { backgroundColor: colors.secondaryButton },
              ]}
            >
              <Text style={[styles.iconText, { color: colors.primary }]}>
                {item.icon}
              </Text>
            </View>

            <Text style={[styles.title, { color: colors.text }]}>
              {item.title}
            </Text>
            <Text style={[styles.description, { color: colors.mutedText }]}>
              {item.description}
            </Text>
          </View>
        )}
      />

      <View style={styles.dots}>
        {slides.map((slide, dotIndex) => (
          <View
            key={slide.key}
            style={[
              styles.dot,
              {
                width: dotIndex === index ? 24 : 8,
                backgroundColor:
                  dotIndex === index ? colors.primary : colors.border,
              },
            ]}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.nextButton, { backgroundColor: colors.primary }]}
        onPress={next}
      >
        <Text style={[styles.nextText, { color: colors.primaryText }]}>
          {index === slides.length - 1 ? "Get Started" : "Next"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingBottom: 32 },
  skipButton: {
    alignSelf: "flex-end",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  skipText: { fontSize: 15, fontWeight: "600" },
  slide: {
    width,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 132,
    height: 132,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 32,
  },
  iconText: { fontSize: 26, fontWeight: "800" },
  title: { fontSize: 32, fontWeight: "800", textAlign: "center" },
  description: {
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    marginTop: 14,
    maxWidth: 320,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  dot: { height: 8, borderRadius: 4 },
  nextButton: {
    marginHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  nextText: { fontSize: 16, fontWeight: "700" },
});
