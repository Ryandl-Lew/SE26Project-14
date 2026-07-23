import { create } from 'zustand'

export const useAppStore = create((set) => ({
  searchKeyword: '',
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
}))
