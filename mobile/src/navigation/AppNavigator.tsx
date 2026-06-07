import { useEffect, useState } from 'react';
import { authStore } from '../store/authStore';

// AppNavigator quản lý luồng Auth vs Main
// Expo Router tự xử lý routing, file này định nghĩa logic điều hướng

export const useAppNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(authStore.getState().isLoggedIn);

  const login = (token: string, user: { email: string; name: string }) => {
    authStore.login(token, user);
    setIsLoggedIn(true);
  };

  const logout = () => {
    authStore.logout();
    setIsLoggedIn(false);
  };

  return {
    isLoggedIn,
    login,
    logout,
  };
};