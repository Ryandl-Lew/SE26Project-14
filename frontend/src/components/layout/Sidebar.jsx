/**
 * Sidebar 侧边栏导航
 * 品牌区 + 分组导航。使用 NavLink 高亮当前路由。
 */
import { NavLink } from 'react-router-dom'

/** 导航分组配置 */
const NAV_SECTIONS = [
  {
    title: '项目工作区',
    items: [
      { to: '/', label: '工作台', icon: '⌂', end: true },
      { to: '/projects', label: '项目管理', icon: '▣' },
      { to: '/records', label: '实验记录', icon: '✎' },
      { to: '/templates', label: '模板中心', icon: '▤' },
    ],
  },
  {
    title: '协作',
    items: [
      { to: '/search', label: '搜索中心', icon: '⌕' },
      { to: '/team', label: '团队管理', icon: '☷' },
      { to: '/ai', label: 'AI 助手', icon: 'AI' },
    ],
  },
]

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">B</div>
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
                className={({ isActive }) => `nav-button ${isActive ? 'active' : ''}`.trim()}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

    </aside>
  )
}
