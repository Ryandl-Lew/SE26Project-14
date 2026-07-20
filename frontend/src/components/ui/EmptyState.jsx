/**
 * EmptyState 空状态
 * 列表 / 面板无数据时的统一占位，可附带引导操作。
 */
import { Inbox } from 'lucide-react'
import Icon from './Icon'

/**
 * @param {Object} props
 * @param {import('lucide-react').LucideIcon} [props.icon]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {import('react').ReactNode} [props.action]
 */
export default function EmptyState({ icon = Inbox, title, description, action }) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={20} />
      </span>
      <strong>{title}</strong>
      {description && <span className="small">{description}</span>}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
