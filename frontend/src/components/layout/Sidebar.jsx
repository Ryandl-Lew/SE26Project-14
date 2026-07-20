/**
 * Sidebar 侧边导航
 * 品牌区 + 分组导航 + 当前项目上下文。
 * 桌面持久显示；窄屏折叠为图标栏；移动端作为抽屉内容由 AppLayout 控制。
 */
import { NavLink, Link } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { NAV_SECTIONS } from './nav'
import { Icon } from '@/components/ui'
import { useAppStore } from '@/store/appStore'

/**
 * @param {Object} props
 * @param {boolean} [props.drawer] 是否以抽屉模式渲染（移动端）
 * @param {() => void} [props.onNavigate] 点击导航后回调（抽屉模式关闭抽屉）
 */
export default function Sidebar({ drawer = false, onNavigate }) {
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const projects = useAppStore((s) => s.projects)
  const currentProject = projects.find((p) => p.id === currentProjectId)

  return (
    <aside className={`sidebar ${drawer ? 'as-drawer' : ''}`.trim()}>
      <div className="brand">
        <div className="brand-mark">
          <Icon name={FlaskConical} size={18} />
        </div>
        <div className="brand-text">
          <div className="brand-name">BioNote</div>
          <div className="brand-sub">生物实验记录助手</div>
        </div>
      </div>

      <nav className="nav" aria-label="主导航">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <div className="nav-section">{section.title}</div>
            {section.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                title={item.label}
                className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`.trim()}
              >
                <span className="nav-icon">
                  <Icon name={item.icon} size={17} />
                </span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {currentProject && (
        <div className="sidebar-foot">
          <div className="nav-section" style={{ margin: '0 0 6px' }}>
            当前项目
          </div>
          <Link
            to={`/projects/${currentProject.id}`}
            className="sidebar-project"
            onClick={onNavigate}
          >
            <strong>{currentProject.name}</strong>
            <span className="small">{currentProject.code}</span>
          </Link>
        </div>
      )}
    </aside>
  )
}
