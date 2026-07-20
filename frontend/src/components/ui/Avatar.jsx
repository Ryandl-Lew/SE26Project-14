/**
 * Avatar 头像
 * 以姓名首字 + 确定性配色渲染圆形头像；支持尺寸与堆叠展示。
 */
import './avatar.css'

/** 基于名字哈希选取的柔和配色（背景 / 文字） */
const PALETTES = [
  ['#e3f2ec', '#0e7a5f'],
  ['#e7effc', '#2470d8'],
  ['#efedfc', '#6b5bd2'],
  ['#fdf1de', '#b06a10'],
  ['#fceaea', '#c74343'],
  ['#e2f4ea', '#15805c'],
  ['#e8f4f9', '#0e7d9e'],
  ['#f6e9f3', '#a0458d'],
]

function hashText(text = '') {
  let h = 0
  for (let i = 0; i < text.length; i += 1) {
    h = (h * 31 + text.charCodeAt(i)) >>> 0
  }
  return h
}

/**
 * @param {Object} props
 * @param {string} props.name 姓名（取首字展示）
 * @param {number} [props.size] 直径 px，默认 34
 * @param {import('react').CSSProperties} [props.style]
 */
export default function Avatar({ name = '?', size = 34, style }) {
  const [bg, fg] = PALETTES[hashText(name) % PALETTES.length]
  return (
    <span
      className="avatar-x"
      title={name}
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.42)),
        background: bg,
        color: fg,
        ...style,
      }}
    >
      {(name || '?').slice(0, 1)}
    </span>
  )
}
