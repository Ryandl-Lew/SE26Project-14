/**
 * StatCard 统计卡
 * 工作台 / 项目详情的关键指标卡片。
 * mock 数据中的 icon 字段为占位字符，这里映射到 lucide 图标体系。
 */
import { FolderKanban, TrendingUp, FlaskConical, CircleAlert, BarChart3 } from 'lucide-react'
import Icon from './Icon'
import './stat-card.css'

/** mock icon 占位符 -> lucide 图标 */
const ICON_MAP = {
  '▣': FolderKanban,
  '↗': TrendingUp,
  '✎': FlaskConical,
  '!': CircleAlert,
}

/**
 * @param {Object} props
 * @param {import('@/domain/models').DashboardStat} props.stat
 */
export default function StatCard({ stat }) {
  const icon = ICON_MAP[stat.icon] ?? BarChart3
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{stat.label}</span>
        <span className="stat-icon">
          <Icon name={icon} size={16} />
        </span>
      </div>
      <div className="stat-number">{stat.value}</div>
      <p className="stat-note">{stat.note}</p>
    </article>
  )
}
