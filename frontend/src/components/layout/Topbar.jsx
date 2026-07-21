/**
 * Topbar 顶栏
 * 极简设计：仅保留移动端菜单按钮与通知入口。
 * 搜索 / 项目切换 / 新建操作均归属具体页面，不在全局顶栏重复。
 */
import { Menu, Bell } from 'lucide-react'

export default function Topbar({ onMenuClick }) {
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

      <div className="ml-auto flex items-center gap-2.5">
        {/* 通知 */}
        <button
          type="button"
          aria-label="通知"
          className="relative rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <Bell size={18} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
        </button>
      </div>
    </header>
  )
}
