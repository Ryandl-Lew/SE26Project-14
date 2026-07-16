/**
 * 轻量级 Toast 通知
 *
 * 纯 DOM 实现，零依赖，不侵入 React 组件树。
 * 使用项目设计令牌（--brand / --red）保持视觉一致。
 *
 * 用法：
 *   import { toast } from '@/utils/toast'
 *   toast('导出成功')
 *   toast('导出失败', { type: 'error' })
 */

const CONTAINER_ID = 'bionote-toast-container'
const TOKEN_BRAND = '#176b5b'   // var(--brand)
const TOKEN_RED = '#c83b3b'     // var(--red)

/** @returns {HTMLElement} */
function getContainer() {
  let container = document.getElementById(CONTAINER_ID)
  if (!container) {
    container = document.createElement('div')
    container.id = CONTAINER_ID
    Object.assign(container.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: '99999',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      pointerEvents: 'none',
    })
    document.body.appendChild(container)
  }
  return container
}

/**
 * 显示一条 Toast 消息
 * @param {string}  message  消息文本
 * @param {object}  [opts]
 * @param {'success'|'error'} [opts.type='success']  消息类型
 * @param {number}  [opts.duration=3000]  自动消失毫秒数
 */
export function toast(message, { type = 'success', duration = 3000 } = {}) {
  const container = getContainer()
  const el = document.createElement('div')

  const bg = type === 'error' ? TOKEN_RED : TOKEN_BRAND

  Object.assign(el.style, {
    padding: '12px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.5',
    color: '#ffffff',
    background: bg,
    boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
    opacity: '0',
    transform: 'translateX(48px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    pointerEvents: 'auto',
    maxWidth: '380px',
    wordBreak: 'break-word',
  })

  el.textContent = message
  container.appendChild(el)

  // 入场动画
  requestAnimationFrame(() => {
    el.style.opacity = '1'
    el.style.transform = 'translateX(0)'
  })

  // 退场动画
  setTimeout(() => {
    el.style.opacity = '0'
    el.style.transform = 'translateX(48px)'
    setTimeout(() => {
      if (el.parentNode) el.parentNode.removeChild(el)
    }, 350)
  }, duration)
}
