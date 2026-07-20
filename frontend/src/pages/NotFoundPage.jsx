/**
 * 404 页面
 */
import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { EmptyState } from '@/components/ui'

export default function NotFoundPage() {
  return (
    <section style={{ padding: '48px 0' }}>
      <EmptyState
        icon={Compass}
        title="页面不存在"
        description="你访问的页面可能已被移动或删除。"
        action={
          <Link className="primary-btn" to="/">
            返回工作台
          </Link>
        }
      />
    </section>
  )
}
