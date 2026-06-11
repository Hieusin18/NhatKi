import { useState } from 'react';

// Simple store tạm - khi nhóm thống nhất dùng Zustand/Redux thì refactor
let authState = {
  token: null as string | null,
  user: null as { email: string; name: string } | null,
  isLoggedIn: false,
};

export const authStore = {
  getState: () => authState,

  login: (token: string, user: { email: string; name: string }) => {
    authState = { token, user, isLoggedIn: true };
  },

  logout: () => {
    authState = { token: null, user: null, isLoggedIn: false };
  },
};