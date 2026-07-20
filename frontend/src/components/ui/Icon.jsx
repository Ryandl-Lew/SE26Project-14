/**
 * Icon 图标
 * 统一封装 lucide-react，保证尺寸、描边与 aria 处理一致。
 * 用法：<Icon name={Search} /> 或 <Icon name={Search} size={18} />
 */

/**
 * @param {Object} props
 * @param {import('lucide-react').LucideIcon} props.name lucide 图标组件
 * @param {number} [props.size]
 * @param {string} [props.className]
 */
export default function Icon({ name: LucideIcon, size = 16, className = '' }) {
  return (
    <LucideIcon
      size={size}
      strokeWidth={1.8}
      className={className || undefined}
      aria-hidden="true"
      focusable="false"
    />
  )
}
