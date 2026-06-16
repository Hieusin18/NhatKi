import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

const WEEKLY_DATA = [2, 1, 5, 1, 3, 6, 8];
const DAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const MAX = 8;

const MOODS = [
  { emoji: '😊', label: 'Vui', percent: 45, color: '#FF69B4' },
  { emoji: '😌', label: 'Bình yên', percent: 30, color: '#C8A0E8' },
  { emoji: '😢', label: 'Buồn', percent: 15, color: '#85B7EB' },
  { emoji: '😐', label: 'Bình thường', percent: 10, color: '#ddd' },
];

export default function Stats() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thống kê của tôi</Text>
        <Text style={styles.calIcon}>📅</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.statCards}>
          <View style={[styles.statCard, { backgroundColor: '#FFF0F7' }]}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statLabel}>Tuần này</Text>
            <Text style={styles.statNum}>7</Text>
            <Text style={styles.statUnit}>ngày</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF8E8' }]}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statLabel}>Kỷ lục liên tiếp</Text>
            <Text style={styles.statNum}>23</Text>
            <Text style={styles.statUnit}>ngày</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#F0F8FF' }]}>
            <Text style={styles.statEmoji}>📅</Text>
            <Text style={styles.statLabel}>Tháng này</Text>
            <Text style={styles.statNum}>28</Text>
            <Text style={styles.statUnit}>ngày</Text>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>Hoạt động tuần này</Text>
            <Text style={styles.trendIcon}>📈</Text>
          </View>
          <View style={styles.chart}>
            <View style={styles.chartBars}>
              {WEEKLY_DATA.map((val, i) => (
                <View key={i} style={styles.barCol}>
                  <View style={styles.barWrap}>
                    <View style={[
                      styles.bar,
                      { height: (val / MAX) * 120, backgroundColor: i === 6 ? '#FF69B4' : '#E8C0D8' }
                    ]} />
                  </View>
                  <Text style={styles.barLabel}>{DAYS[i]}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Phân bố tâm trạng</Text>
          <View style={styles.moodList}>
            {MOODS.map((mood, i) => (
              <View key={i} style={styles.moodRow}>
                <Text style={styles.moodEmoji}>{mood.emoji}</Text>
                <Text style={styles.moodLabel}>{mood.label}</Text>
                <View style={styles.moodBarWrap}>
                  <View style={[styles.moodBar, { width: `${mood.percent}%`, backgroundColor: mood.color }]} />
                </View>
                <Text style={styles.moodPercent}>{mood.percent}%</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF0F7' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#FFE4EE',
  },
  backIcon: { fontSize: 22, color: '#9B59B6', width: 36 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#9B59B6' },
  calIcon: { fontSize: 22, width: 36, textAlign: 'right' },

  scroll: { padding: 16, gap: 16, paddingBottom: 40 },

  statCards: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1, borderRadius: 16, padding: 12,
    alignItems: 'center', gap: 2,
    borderWidth: 1, borderColor: '#FFE4EE',
  },
  statEmoji: { fontSize: 24, marginBottom: 4 },
  statLabel: { fontSize: 10, color: '#9B59B6', fontWeight: '600', textAlign: 'center' },
  statNum: { fontSize: 26, fontWeight: '800', color: '#333' },
  statUnit: { fontSize: 12, color: '#aaa' },

  card: {
    backgroundColor: '#fff', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#FFE4EE',
    shadowColor: '#FF69B4', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#FF69B4', marginBottom: 12 },
  trendIcon: { fontSize: 18 },

  chart: { paddingTop: 8 },
  chartBars: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 140 },
  barCol: { flex: 1, alignItems: 'center', gap: 6 },
  barWrap: { flex: 1, justifyContent: 'flex-end', width: '70%' },
  bar: { width: '100%', borderRadius: 6, minHeight: 4 },
  barLabel: { fontSize: 10, color: '#aaa' },

  moodList: { gap: 12 },
  moodRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  moodEmoji: { fontSize: 20, width: 28 },
  moodLabel: { fontSize: 13, color: '#555', width: 80 },
  moodBarWrap: { flex: 1, height: 8, backgroundColor: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  moodBar: { height: '100%', borderRadius: 4 },
  moodPercent: { fontSize: 12, color: '#888', width: 36, textAlign: 'right' },
});
