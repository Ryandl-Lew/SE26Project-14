/**
 * Badge 状态徽章
 * 统一渲染各类状态 / 分类标签，色系由 tone 决定。
 */

/**
 * @param {Object} props
 * @param {import('@/domain/common').BadgeTone} [props.tone] 色系，默认 gray
 * @param {import('react').ReactNode} props.children
 */
export default function Badge({ tone = 'gray', children }) {
  return <span className={`badge ${tone}`}>{children}</span>
}
