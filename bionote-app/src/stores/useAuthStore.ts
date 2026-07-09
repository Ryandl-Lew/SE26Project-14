import { create } from 'zustand';
import type { User } from '@/types';
import { currentUser } from '@/utils/mockData';

interface AuthStore {
  isLoggedIn: boolean;
  user: User | null;
  login: () => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  isLoggedIn: true, // MVP: auto-logged in with mock user
  user: currentUser,
  login: () => set({ isLoggedIn: true, user: currentUser }),
  logout: () => set({ isLoggedIn: false, user: null }),
}));
