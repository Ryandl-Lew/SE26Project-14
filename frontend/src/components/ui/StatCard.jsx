/**
 * StatCard 统计卡
 * 工作台 / 项目详情的关键指标卡片。
 */
import './stat-card.css'

/**
 * @param {Object} props
 * @param {import('@/domain/models').DashboardStat} props.stat
 */
export default function StatCard({ stat }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span>{stat.label}</span>
        {stat.icon && <span className="stat-icon">{stat.icon}</span>}
      </div>
      <div className="stat-number">{stat.value}</div>
      <p className="stat-note">{stat.note}</p>
    </article>
  )
}
