/**
 * 应用级 UI 状态（Zustand）
 * 仅存放跨页面共享的轻量状态。业务数据仍通过 API 层按需获取。
 * 认证相关状态已拆分到 authStore。
 */
import { create } from 'zustand'
import { currentLab } from '@/mocks/data'

export const useAppStore = create((set) => ({
  /** 当前实验室名称 */
  currentLab,
  /** 顶栏「当前项目」——记录页等以此为上下文 */
  currentProjectId: 'p-001',
  /** 全局搜索关键词 */
  searchKeyword: 'GFP',
  /** @param {string} id */
  setCurrentProject: (id) => set({ currentProjectId: id }),
  /** @param {string} keyword */
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
}))
