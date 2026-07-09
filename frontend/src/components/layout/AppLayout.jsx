/**
 * AppLayout 应用外壳
 * 侧边栏 + 顶栏 + 主内容区（<Outlet /> 渲染当前路由页面）。
 */
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import './layout.css'

export default function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="workspace">
        <Topbar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
