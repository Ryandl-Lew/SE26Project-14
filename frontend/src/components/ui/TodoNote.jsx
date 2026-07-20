/**
 * TodoNote 待处理标注
 * 用于在界面上显式标注「接口 / 功能待接入」的占位区域。
 */

/**
 * @param {Object} props
 * @param {import('react').ReactNode} props.children 说明文本
 */
export default function TodoNote({ children }) {
  return (
    <div className="todo-note" role="note">
      <span aria-hidden="true">🚧</span>
      <span>
        <strong>待处理</strong>
        <span style={{ margin: '0 6px', color: 'var(--line-strong)' }}>|</span>
        {children}
      </span>
    </div>
  )
}
