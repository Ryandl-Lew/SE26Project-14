/**
 * Topbar 顶栏
 * 全局搜索 + 当前项目切换 + 新建菜单 + 用户头像。
 */
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '@/store/appStore'
import { mockProjects } from '@/mocks/data'

export default function Topbar() {
  const navigate = useNavigate()
  const { currentUser, currentProjectId, setCurrentProject, searchKeyword, setSearchKeyword } =
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
    <header className="topbar">
      <div className="global-search">
        <span>⌕</span>
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
        <select
          className="lab-switcher"
          aria-label="当前项目"
          value={currentProjectId}
          onChange={(e) => setCurrentProject(e.target.value)}
        >
          {mockProjects.map((p) => (
            <option key={p.id} value={p.id}>
              当前项目：{p.name}
            </option>
          ))}
        </select>

        <div className="create-menu-wrap" ref={menuRef}>
          <button
            className="primary-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
          >
            ＋ 新建
          </button>
          {menuOpen && (
            <div className="create-menu" aria-label="新建菜单">
              <button type="button" onClick={() => jump('/projects')}>
                新建项目
              </button>
              <button type="button" onClick={() => jump('/records/new')}>
                新建实验记录
              </button>
              <button type="button" onClick={() => jump('/templates')}>
                新建模板
              </button>
            </div>
          )}
        </div>

        <div className="avatar" title={currentUser.name}>
          {currentUser.avatarText}
        </div>
      </div>
    </header>
  )
}
