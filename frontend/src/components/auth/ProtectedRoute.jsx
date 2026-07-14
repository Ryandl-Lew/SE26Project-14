/**
 * ProtectedRoute 路由守卫
 * 未登录时重定向到 /login，正在恢复会话时显示 loading。
 */
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'

export default function ProtectedRoute({ children }) {
  const currentUser = useAuthStore((s) => s.currentUser)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--muted)',
          fontSize: 15,
        }}
      >
        加载中...
      </div>
    )
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return children
}
