/**
 * 登录页面（新设计）
 * 用户名密码登录，对接 authStore.login。
 * 静态原型模式下允许已登录用户直接访问，便于查看登录界面。
 */
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, CircleAlert, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import AuthLayout from '@/components/auth/AuthLayout'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!identifier.trim() || !password.trim()) {
      setError('请输入用户名或邮箱和密码')
      return
    }
    setSubmitting(true)
    try {
      await login({ identifier: identifier.trim(), password })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || '登录失败，请重试')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="欢迎回来"
      subtitle="登录你的 BioNote 账号，继续科研工作"
      footer={
        <span>
          还没有账号？{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            立即注册
          </Link>
        </span>
      }
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="identifier"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            用户名或邮箱
          </label>
          <div className="relative">
            <User
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="identifier"
              type="text"
              placeholder="请输入用户名或邮箱"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
              className="input h-11 pl-10"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            密码
          </label>
          <div className="relative">
            <Lock
              size={16}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="input h-11 pl-10 pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? '隐藏密码' : '显示密码'}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-center gap-2.5 rounded-lg border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-700 animate-fade-in"
          >
            <CircleAlert size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Loader2 size={16} className="animate-spin" />}
          {submitting ? '登录中…' : '登 录'}
        </button>


      </form>
    </AuthLayout>
  )
}
