/**
 * 应用级 UI 状态（Zustand）
 * 仅存放跨页面共享的轻量状态。业务数据仍通过 API 层按需获取。
 * 认证相关状态已拆分到 authStore。
 */
import { create } from 'zustand'

export const useAppStore = create((set) => ({
  /** 顶栏「当前项目」——记录页、团队页等以此为上下文 */
  currentProjectId: 'p-001',
  /** 全局搜索关键词 */
  searchKeyword: 'GFP',
  /** 项目列表缓存（由 AppLayout 经 API 层加载一次，供外壳切换器 / 上下文展示） */
  projects: [],
  projectsLoaded: false,
  /** @param {string} id */
  setCurrentProject: (id) => set({ currentProjectId: id }),
  /** @param {string} keyword */
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
  /** @param {import('@/domain/models').Project[]} list */
  setProjects: (list) => set({ projects: list, projectsLoaded: true }),
}))
