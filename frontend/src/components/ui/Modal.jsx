/**
 * Modal 对话框
 * 轻量受控弹层：遮罩 + 卡片，Esc / 点击遮罩关闭。
 */
import { useEffect } from 'react'
import Icon from './Icon'
import './modal.css'

/**
 * @param {Object} props
 * @param {boolean} props.open
 * @param {() => void} props.onClose
 * @param {import('react').ReactNode} props.title
 * @param {import('react').ReactNode} [props.footer] 底部操作区
 * @param {number} [props.width] 内容宽度，默认 480
 * @param {import('react').ReactNode} props.children
 */
export default function Modal({ open, onClose, title, footer, width = 480, children }) {
  // Esc 关闭 + 锁定背景滚动
  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="modal-mask" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-card" role="dialog" aria-modal="true" style={{ maxWidth: width }}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" type="button" aria-label="关闭" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
