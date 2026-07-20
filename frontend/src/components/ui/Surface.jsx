/**
 * Surface 卡片容器
 * 对应设计规范中的卡片；可选带标题栏（title + 右侧操作）。
 * 其余属性（如 id、aria-*）透传到 <section>。
 */

/**
 * @param {Object} props
 * @param {import('react').ReactNode} [props.title] 卡片标题
 * @param {import('react').ReactNode} [props.extra] 标题右侧操作区
 * @param {string} [props.className]
 * @param {import('react').CSSProperties} [props.style]
 * @param {import('react').ReactNode} props.children
 */
export default function Surface({ title, extra, className = '', style, children, ...rest }) {
  return (
    <section className={`surface ${className}`.trim()} style={style} {...rest}>
      {(title || extra) && (
        <div className="surface-head">
          {title ? <h2>{title}</h2> : <span />}
          {extra}
        </div>
      )}
      {children}
    </section>
  )
}
