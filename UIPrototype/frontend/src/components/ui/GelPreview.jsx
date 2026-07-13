/**
 * GelPreview 凝胶电泳结果预览
 * 纯装饰性占位组件，复刻原型中的凝胶泳道视觉。
 * TODO: 后续替换为真实结果图片渲染。
 */
import './gel-preview.css'

/**
 * @param {Object} props
 * @param {string} [props.caption] 图注文本
 */
export default function GelPreview({ caption = '结果图预览' }) {
  return (
    <div className="gel-preview" aria-label="凝胶电泳预览">
      <div className="gel-caption">{caption}</div>
      <span className="gel-lane lane-1" />
      <span className="gel-lane lane-2" />
      <span className="gel-lane lane-3" />
      <span className="gel-lane lane-4" />
    </div>
  )
}
