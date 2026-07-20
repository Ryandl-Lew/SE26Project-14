/**
 * Topbar 顶栏
 * 全局搜索 + 当前项目切换（仅在需要项目上下文的页面显示） + 新建菜单 + 用户菜单。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Avatar, Icon } from '@/components/ui'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'
import { mockProjects } from '@/mocks/data'

/** 需要展示“当前项目”选择器的页面路径前缀 */
const PROJECT_CONTEXT_PATHS = ['/records', '/templates', '/team']

/** 点击元素外部时触发回调 */
function useClickOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return undefined
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onOutside()
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [ref, onOutside, active])
}

export default function Topbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentProjectId, setCurrentProject, searchKeyword, setSearchKeyword } =
    useAppStore()
  const currentUser = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)

  const [menuOpen, setMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const userMenuRef = useRef(null)

  // 仅在工作台之外的特定页面显示项目切换器
  const showProjectSwitcher = useMemo(() => {
    return PROJECT_CONTEXT_PATHS.some((prefix) => location.pathname.startsWith(prefix))
  }, [location.pathname])

  useClickOutside(menuRef, () => setMenuOpen(false), menuOpen)
  useClickOutside(userMenuRef, () => setUserMenuOpen(false), userMenuOpen)

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') navigate('/search')
  }

  const jump = (path) => {
    setMenuOpen(false)
    setUserMenuOpen(false)
    navigate(path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="topbar">
      <div className="global-search">
        <Icon name="search" size={16} />
        <input
          type="search"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={onSearchKeyDown}
          aria-label="全局搜索"
          placeholder="搜索项目、实验记录、模板、成员、附件"
        />
        <kbd className="search-kbd">↵</kbd>
      </div>

      <div className="top-actions">
        {showProjectSwitcher && (
          <div className="lab-switcher-wrap">
            <Icon name="folder" size={15} />
            <select
              className="lab-switcher"
              aria-label="当前项目"
              value={currentProjectId}
              onChange={(e) => setCurrentProject(e.target.value)}
            >
              {mockProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Icon name="chevron-down" size={14} className="switcher-caret" />
          </div>
        )}

        <div className="create-menu-wrap" ref={menuRef}>
          <button
            className="primary-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
          >
            <Icon name="plus" size={16} strokeWidth={2.2} />
            新建
          </button>
          {menuOpen && (
            <div className="create-menu" aria-label="新建菜单">
              <button type="button" onClick={() => jump('/projects')}>
                <Icon name="folder" size={15} />
                新建项目
              </button>
              <button type="button" onClick={() => jump('/records/new')}>
                <Icon name="flask" size={15} />
                新建实验记录
              </button>
              <button type="button" onClick={() => jump('/templates')}>
                <Icon name="template" size={15} />
                新建模板
              </button>
            </div>
          )}
        </div>

        {currentUser ? (
          <div className="user-menu-wrap" ref={userMenuRef}>
            <button
              type="button"
              className="user-trigger"
              onClick={(e) => {
                e.stopPropagation()
                setUserMenuOpen((v) => !v)
              }}
            >
              <Avatar name={currentUser.name} size={34} />
              <span className="user-name">{currentUser.name}</span>
              <Icon name="chevron-down" size={14} />
            </button>
            {userMenuOpen && (
              <div className="user-menu" aria-label="用户菜单">
                <div className="user-menu-head">
                  <Avatar name={currentUser.name} size={40} />
                  <div>
                    <div className="user-menu-name">{currentUser.name}</div>
                    <div className="user-menu-email">{currentUser.email}</div>
                  </div>
                </div>
                <button type="button" onClick={handleLogout}>
                  <Icon name="log-out" size={15} />
                  退出登录
                </button>
              </div>
            )}
          </div>
        ) : (
          <button className="primary-btn" type="button" onClick={() => navigate('/login')}>
            登录
          </button>
        )}
      </div>
    </header>
  )
}
