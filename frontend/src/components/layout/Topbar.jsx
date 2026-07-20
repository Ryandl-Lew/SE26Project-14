/**
 * Topbar 顶部上下文栏
 * 集中放置：移动端菜单、全局搜索、当前项目切换（全局唯一）、
 * 主要「新建」操作与用户菜单。页面内不再重复项目切换器。
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Search, ChevronDown, Plus, LogOut, FolderOpen } from 'lucide-react'
import { Icon } from '@/components/ui'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'

/**
 * @param {Object} props
 * @param {() => void} props.onOpenNav 打开移动端导航抽屉
 */
export default function Topbar({ onOpenNav }) {
  const navigate = useNavigate()
  const { currentProjectId, setCurrentProject, searchKeyword, setSearchKeyword, projects } =
    useAppStore()
  const currentUser = useAuthStore((s) => s.currentUser)
  const logout = useAuthStore((s) => s.logout)

  const [createOpen, setCreateOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const createRef = useRef(null)
  const userRef = useRef(null)

  // 点击外部 / Esc 关闭下拉菜单
  useEffect(() => {
    if (!createOpen && !userOpen) return
    const onClick = (e) => {
      if (createRef.current && !createRef.current.contains(e.target)) setCreateOpen(false)
      if (userRef.current && !userRef.current.contains(e.target)) setUserOpen(false)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setCreateOpen(false)
        setUserOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [createOpen, userOpen])

  const onSearchKeyDown = (e) => {
    if (e.key === 'Enter') navigate('/search')
  }

  const jump = (path) => {
    setCreateOpen(false)
    setUserOpen(false)
    navigate(path)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="topbar">
      <button
        type="button"
        className="nav-menu-btn"
        aria-label="打开导航菜单"
        onClick={onOpenNav}
      >
        <Icon name={Menu} size={20} />
      </button>

      <div className="global-search">
        <Icon name={Search} size={15} />
        <input
          type="search"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={onSearchKeyDown}
          aria-label="全局搜索"
          placeholder="搜索项目、实验记录、模板、成员、附件"
        />
      </div>

      <div className="top-actions">
        <label className="project-switcher" title="切换当前项目">
          <Icon name={FolderOpen} size={15} />
          <span className="switcher-label">当前项目</span>
          <select
            aria-label="当前项目"
            value={currentProjectId}
            onChange={(e) => setCurrentProject(e.target.value)}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <Icon name={ChevronDown} size={14} />
        </label>

        <div className="create-menu-wrap" ref={createRef}>
          <button
            className="primary-btn"
            type="button"
            aria-haspopup="menu"
            aria-expanded={createOpen}
            onClick={() => {
              setUserOpen(false)
              setCreateOpen((v) => !v)
            }}
          >
            <Icon name={Plus} size={15} />
            新建
          </button>
          {createOpen && (
            <div className="create-menu" role="menu" aria-label="新建菜单">
              <button type="button" role="menuitem" onClick={() => jump('/records/new')}>
                新建实验记录
              </button>
              <button type="button" role="menuitem" onClick={() => jump('/templates')}>
                从模板新建
              </button>
              <button type="button" role="menuitem" onClick={() => jump('/projects')}>
                新建项目
              </button>
            </div>
          )}
        </div>

        {currentUser ? (
          <div className="create-menu-wrap" ref={userRef}>
            <button
              type="button"
              className="avatar"
              title={currentUser.name}
              aria-haspopup="menu"
              aria-expanded={userOpen}
              aria-label="用户菜单"
              onClick={() => {
                setCreateOpen(false)
                setUserOpen((v) => !v)
              }}
            >
              {currentUser.avatarText}
            </button>
            {userOpen && (
              <div className="create-menu user-menu" role="menu" aria-label="用户菜单">
                <div className="user-menu-head">
                  <strong>{currentUser.name}</strong>
                  <span className="muted small">{currentUser.email}</span>
                </div>
                <button type="button" role="menuitem" onClick={handleLogout}>
                  <Icon name={LogOut} size={14} />
                  登出
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
