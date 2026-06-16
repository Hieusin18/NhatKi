import { Tabs } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';

function TabBar({ state, navigation }: any) {
  const tabs = [
    { name: 'index', label: 'Trang chủ', icon: '🏠' },
    { name: 'create', label: 'Tạo mới', icon: '📷' },
    { name: 'capsule', label: 'Capsule', icon: '⏳' },
    { name: 'stats', label: 'Thống kê', icon: '🕐' },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const tab = tabs.find(t => t.name === route.name) || tabs[index];
          const isFocused = state.index === index;
          return (
            <TouchableOpacity
              key={route.key}
              onPress={() => navigation.navigate(route.name)}
              style={styles.tab}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabIcon, isFocused && styles.tabIconActive]}>{tab?.icon}</Text>
              <Text numberOfLines={1} style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tab?.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function MainLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="create" />
      <Tabs.Screen name="capsule" />
      <Tabs.Screen name="stats" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'relative', width: '100%' },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#FFE4EE',
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 10,
  },
  tab: {
    width: '25%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  tabIcon: { fontSize: 22, opacity: 0.4 },
  tabIconActive: { opacity: 1 },
  tabLabel: { fontSize: 11, color: '#aaa' },
  tabLabelActive: { color: '#FF69B4', fontWeight: '700' },
});
