/**
 * EmptyState 空状态
 * 居中的插画位 + 标题 + 描述 + 可选操作。
 */
import Icon from './Icon'
import './empty-state.css'

/**
 * @param {Object} props
 * @param {string} [props.icon] Icon 名称，默认 flask
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {import('react').ReactNode} [props.action]
 */
export default function EmptyState({ icon = 'flask', title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Icon name={icon} size={26} strokeWidth={1.5} />
      </div>
      <div className="empty-title">{title}</div>
      {description && <div className="empty-desc">{description}</div>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  )
}
