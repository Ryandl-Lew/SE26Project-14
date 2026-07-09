/**
 * 应用根组件：挂载路由。
 */
import { RouterProvider } from 'react-router-dom'
import { router } from '@/router'

export default function App() {
  return <RouterProvider router={router} />
}
