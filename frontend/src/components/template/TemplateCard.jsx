/**
 * TemplateCard 模板卡片
 * 模板中心的模板概要卡片，可「使用模板」跳转编辑器。
 */
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui'
import './template-card.css'

/**
 * @param {Object} props
 * @param {import('@/domain/models').Template} props.template
 */
export default function TemplateCard({ template }) {
  const navigate = useNavigate()

  return (
    <article className="template-card">
      <div className="card-title-row">
        <h3>{template.name}</h3>
        {template.tag && <Badge tone="blue">{template.tag}</Badge>}
      </div>
      <p className="muted small">{template.description}</p>
      <div className="card-actions">
        {/* TODO: 使用模板时预填字段并携带模板 id */}
        <button className="primary-btn" onClick={() => navigate('/records/new')}>
          使用模板
        </button>
        <button className="secondary-btn">预览</button>
        <button className="secondary-btn">复制</button>
      </div>
    </article>
  )
}
