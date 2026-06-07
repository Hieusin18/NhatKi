// TabNavigator định nghĩa các tab chính của app
// Expo Router tự xử lý routing, file này định nghĩa cấu hình tab

export const TABS = [
  {
    name: 'home',
    label: 'Trang chủ',
    icon: '🏠',
    route: '/(main)/index',
  },
  {
    name: 'camera',
    label: 'Camera',
    icon: '📷',
    route: '/(main)/camera',
  },
  {
    name: 'capsule',
    label: 'Capsule',
    icon: '⏳',
    route: '/(main)/capsule',
  },
];

export const getTabByRoute = (route: string) => {
  return TABS.find(tab => tab.route === route);
};