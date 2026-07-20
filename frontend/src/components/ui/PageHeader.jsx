/**
 * PageHeader 页面标题区
 * 面包屑 / eyebrow + 主标题 + 描述 + 右侧主操作区。
 */

/**
 * @param {Object} props
 * @param {string} [props.eyebrow] 小标题（无面包屑时使用）
 * @param {{ label: string, to?: string }[]} [props.breadcrumb] 面包屑，末项无 to
 * @param {import('react').ReactNode} props.title 主标题
 * @param {string} [props.description] 描述文本
 * @param {import('react').ReactNode} [props.actions] 右侧操作区
 */
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import Icon from './Icon'

export default function PageHeader({ eyebrow, breadcrumb, title, description, actions }) {
  return (
    <div className="page-head">
      <div>
        {breadcrumb ? (
          <nav className="breadcrumb" aria-label="面包屑">
            {breadcrumb.map((item, i) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                {i > 0 && <Icon name={ChevronRight} size={12} />}
                {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
              </span>
            ))}
          </nav>
        ) : (
          eyebrow && <p className="eyebrow">{eyebrow}</p>
        )}
        <h1>{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  )
}
