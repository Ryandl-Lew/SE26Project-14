/**
 * AppLayout 应用外壳
 * 持久侧边导航 + 顶部上下文栏 + 主工作区。
 * 移动端侧边导航以抽屉形式提供（不隐藏导航）；路由切换自动关闭抽屉。
 * 项目列表经 API 层加载一次并缓存到 appStore，供外壳与页面共享。
 */
import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { ToastProvider } from '@/components/ui'
import { fetchProjects } from '@/api'
import { useAppStore } from '@/store/appStore'
import './layout.css'

export default function AppLayout() {
  const [navOpen, setNavOpen] = useState(false)
  const location = useLocation()
  const projectsLoaded = useAppStore((s) => s.projectsLoaded)
  const setProjects = useAppStore((s) => s.setProjects)

  useEffect(() => {
    if (!projectsLoaded) {
      fetchProjects()
        .then(setProjects)
        .catch(() => setProjects([]))
    }
  }, [projectsLoaded, setProjects])

  // 路由切换时关闭移动抽屉
  useEffect(() => {
    setNavOpen(false)
  }, [location.pathname])

  // 抽屉打开时 Esc 关闭
  useEffect(() => {
    if (!navOpen) return
    const onKey = (e) => {
      if (e.key === 'Escape') setNavOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [navOpen])

  return (
    <ToastProvider>
      <div className="app-shell">
        <Sidebar />
        {navOpen && (
          <>
            <div
              className="nav-overlay"
              aria-hidden="true"
              onClick={() => setNavOpen(false)}
            />
            <div className="nav-drawer" role="dialog" aria-label="导航菜单">
              <Sidebar drawer onNavigate={() => setNavOpen(false)} />
            </div>
          </>
        )}
        <div className="workspace">
          <Topbar onOpenNav={() => setNavOpen(true)} />
          <main className="main-content">
            <Outlet />
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
