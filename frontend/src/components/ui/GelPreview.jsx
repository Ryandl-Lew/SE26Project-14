/**
 * GelPreview 凝胶电泳结果预览（新设计）
 * 纯装饰性占位组件，模拟凝胶泳道视觉。
 * TODO: 后续替换为真实结果图片渲染。
 */

/** 每条泳道的条带位置（top 百分比）与宽度 */
const LANES = [
  [
    { top: '18%', width: '70%' },
    { top: '42%', width: '70%' },
    { top: '66%', width: '70%' },
  ],
  [{ top: '34%', width: '70%' }],
  [
    { top: '30%', width: '70%' },
    { top: '55%', width: '70%' },
  ],
  [
    { top: '22%', width: '70%' },
    { top: '70%', width: '70%' },
  ],
]

/**
 * @param {Object} props
 * @param {string} [props.caption] 图注文本
 */
export default function GelPreview({ caption = '结果图预览' }) {
  return (
    <div
      aria-label="凝胶电泳预览"
      className="relative h-48 overflow-hidden rounded-xl bg-slate-900 shadow-inner"
    >
      {/* 图注 */}
      <div className="absolute left-3 top-3 z-10 rounded-md bg-white/10 px-2 py-1 font-mono text-[11px] text-slate-300 backdrop-blur">
        {caption}
      </div>
      {/* 泳道 */}
      <div className="absolute inset-x-6 bottom-4 top-10 flex justify-between">
        {LANES.map((bands, i) => (
          <div
            key={i}
            className="relative h-full w-12 rounded-sm bg-slate-800/80 ring-1 ring-white/5"
          >
            {bands.map((band, j) => (
              <span
                key={j}
                className="absolute left-1/2 h-1.5 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-200 to-blue-100 opacity-90"
                style={{ top: band.top, width: band.width }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
