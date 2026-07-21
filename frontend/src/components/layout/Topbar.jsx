/**
 * Topbar 顶栏（新设计）
 * 移动端菜单按钮 + 全局搜索 + 当前项目切换 + 新建菜单 + 通知。
 * 用户卡片与登出入口位于侧边栏底部。
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu,
  Search,
  Plus,
  ChevronDown,
  FolderPlus,
  NotebookPen,
  LayoutTemplate,
  Bell,
} from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import { mockProjects } from '@/mocks/data'

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate()
  const { currentProjectId, setCurrentProject, searchKeyword, setSearchKeyword } =
    useAppStore()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // 点击外部关闭新建菜单
  useEffect(() => {
    if (!menuOpen) return
    const onClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [menuOpen])

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') navigate('/search')
  }

  const jump = (path) => {
    setMenuOpen(false)
    navigate(path)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* 移动端菜单按钮 */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="打开导航菜单"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={20} />
      </button>

      {/* 全局搜索 */}
      <div className="relative w-full max-w-xl">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="search"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={onSearchKeyDown}
          aria-label="全局搜索"
          placeholder="搜索项目、实验记录、模板、成员…"
          className="h-10 w-full rounded-lg border border-transparent bg-slate-100 pl-10 pr-14 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:shadow-glow"
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[11px] font-medium text-slate-400 sm:block">
          Enter
        </kbd>
      </div>

      <div className="ml-auto flex items-center gap-2.5">
        {/* 当前项目切换 */}
        <select
          aria-label="当前项目"
          value={currentProjectId}
          onChange={(e) => setCurrentProject(e.target.value)}
          className="hidden h-10 max-w-[220px] cursor-pointer rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none transition hover:border-slate-300 focus:border-brand-500 md:block"
        >
          {mockProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        {/* 通知 */}
        <button
          type="button"
          aria-label="通知"
          className="relative rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>

        {/* 新建菜单 */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
            className="flex h-10 items-center gap-1.5 rounded-lg bg-brand-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span className="hidden sm:inline">新建</span>
            <ChevronDown
              size={14}
              className={`transition-transform ${menuOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {menuOpen && (
            <div
              aria-label="新建菜单"
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-52 animate-scale-in rounded-xl border border-slate-200 bg-white p-1.5 shadow-pop"
            >
              {[
                { icon: FolderPlus, label: '新建项目', desc: '开启一个新的研究项目', path: '/projects' },
                { icon: NotebookPen, label: '新建实验记录', desc: '记录一次实验过程', path: '/records/new' },
                { icon: LayoutTemplate, label: '新建模板', desc: '沉淀可复用的实验流程', path: '/templates' },
              ].map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => jump(item.path)}
                  className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
                >
                  <item.icon size={17} className="mt-0.5 shrink-0 text-brand-600" />
                  <span>
                    <span className="block text-sm font-medium text-slate-900">
                      {item.label}
                    </span>
                    <span className="block text-xs text-slate-400">{item.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
