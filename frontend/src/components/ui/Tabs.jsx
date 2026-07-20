/**
 * Tabs 标签页
 * 统一的页内分区导航。键控切换，支持受控 / 非受控。
 */

/**
 * @param {Object} props
 * @param {{ key: string, label: import('react').ReactNode }[]} props.items
 * @param {string} [props.activeKey] 受控选中项
 * @param {string} [props.defaultKey] 非受控初始项
 * @param {(key: string) => void} [props.onChange]
 * @param {string} [props.ariaLabel]
 */
import { useState } from 'react'

export default function Tabs({ items, activeKey, defaultKey, onChange, ariaLabel = '分区导航' }) {
  const [innerKey, setInnerKey] = useState(defaultKey ?? items[0]?.key)
  const current = activeKey ?? innerKey

  const select = (key) => {
    setInnerKey(key)
    onChange?.(key)
  }

  return (
    <div className="tabs" role="tablist" aria-label={ariaLabel}>
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          aria-selected={item.key === current}
          className={`tab-btn ${item.key === current ? 'active' : ''}`.trim()}
          onClick={() => select(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  )
}
