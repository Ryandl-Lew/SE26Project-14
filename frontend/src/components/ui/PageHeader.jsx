/**
 * PageHeader 页面标题区
 * 统一渲染 eyebrow 小标题 + 主标题 + 描述 + 右侧操作区。
 */

/**
 * @param {Object} props
 * @param {string} [props.eyebrow] 小标题
 * @param {import('react').ReactNode} props.title 主标题
 * @param {string} [props.description] 描述文本
 * @param {import('react').ReactNode} [props.actions] 右侧操作区
 */
export default function PageHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="page-desc">{description}</p>}
      </div>
      {actions && <div className="card-actions">{actions}</div>}
    </div>
  )
}
