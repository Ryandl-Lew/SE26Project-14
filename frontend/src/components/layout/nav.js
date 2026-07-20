/**
 * 主导航配置
 * 一级入口：工作台、项目、实验记录、实验模板；
 * 次级入口：全局搜索、成员权限、AI 助手。
 */
import {
  LayoutDashboard,
  FolderKanban,
  NotebookPen,
  LayoutTemplate,
  Search,
  Users,
  Sparkles,
} from 'lucide-react'

export const NAV_SECTIONS = [
  {
    title: '工作区',
    items: [
      { to: '/', label: '工作台', icon: LayoutDashboard, end: true },
      { to: '/projects', label: '项目', icon: FolderKanban },
      { to: '/records', label: '实验记录', icon: NotebookPen },
      { to: '/templates', label: '实验模板', icon: LayoutTemplate },
    ],
  },
  {
    title: '工具',
    items: [
      { to: '/search', label: '全局搜索', icon: Search },
      { to: '/team', label: '成员权限', icon: Users },
      { to: '/ai', label: 'AI 助手', icon: Sparkles },
    ],
  },
]
