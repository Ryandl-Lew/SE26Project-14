/**
 * Surface 卡片容器
 * 对应原型 .surface；可选带标题栏（title + 右侧操作）。
 */

/**
 * @param {Object} props
 * @param {import('react').ReactNode} [props.title] 卡片标题
 * @param {import('react').ReactNode} [props.extra] 标题右侧操作区
 * @param {string} [props.className]
 * @param {import('react').CSSProperties} [props.style]
 * @param {import('react').ReactNode} props.children
 */
export default function Surface({ title, extra, className = '', style, children }) {
  return (
    <section className={`surface ${className}`.trim()} style={style}>
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
