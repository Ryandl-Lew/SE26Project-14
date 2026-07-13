/**
 * 应用根组件：挂载路由。
 */
import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'
import { useAuthStore } from '@/store/authStore'

export default function App() {
  const restoreSession = useAuthStore((s) => s.restoreSession)

  useEffect(() => {
    restoreSession()
  }, [restoreSession])

  return <RouterProvider router={router} />
}
