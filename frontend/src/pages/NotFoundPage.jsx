/**
 * 404 页面
 */
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <section style={{ textAlign: 'center', padding: '80px 0' }}>
      <p className="eyebrow">404</p>
      <h1>页面不存在</h1>
      <p className="page-desc">你访问的页面可能已被移动或删除。</p>
      <div style={{ marginTop: 18 }}>
        <Link className="primary-btn" to="/">
          返回工作台
        </Link>
      </div>
    </section>
  )
}
