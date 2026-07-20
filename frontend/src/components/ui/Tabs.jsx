/**
 * Tabs 页签
 * 受控组件：items + activeKey + onChange。
 * 样式见 global.css 的 .tabs / .tab-btn。
 */

/**
 * @param {Object} props
 * @param {{ key: string, label: import('react').ReactNode }[]} props.items
 * @param {string} props.activeKey
 * @param {(key: string) => void} props.onChange
 * @param {import('react').CSSProperties} [props.style]
 */
export default function Tabs({ items, activeKey, onChange, style }) {
  return (
    <div className="tabs" role="tablist" style={style}>
      {items.map((item) => (
        <button
          key={item.key}
          role="tab"
          aria-selected={item.key === activeKey}
          className={`tab-btn ${item.key === activeKey ? 'active' : ''}`.trim()}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
