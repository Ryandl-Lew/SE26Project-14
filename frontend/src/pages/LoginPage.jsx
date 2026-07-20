/**
 * 登录页面
 * 用户名密码登录，对接 authStore.login。
 * 已登录用户自动跳转到首页。
 */
import { useState } from 'react'
import { Link, useNavigate, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import './login.css'

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const login = useAuthStore((s) => s.login)
  const currentUser = useAuthStore((s) => s.currentUser)
  const loading = useAuthStore((s) => s.loading)
  const navigate = useNavigate()

  // 已登录 -> 跳转首页
  if (!loading && currentUser) {
    return <Navigate to="/" replace />
  }

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
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand-mark">B</div>
          <h1>BioNote</h1>
          <p className="login-sub">生物实验记录助手</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="identifier">用户名或邮箱</label>
            <input
              id="identifier"
              type="text"
              placeholder="请输入用户名或邮箱"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoComplete="username"
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="password">密码</label>
            <input
              id="password"
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button
            type="submit"
            className="primary-btn login-btn"
            disabled={submitting}
          >
            {submitting ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="auth-switch">
          <span>还没有账号？</span>
          <Link to="/register">注册</Link>
        </div>

        <div className="login-hint">
          <p className="muted small">本地测试账号</p>
          <div className="login-accounts">
            <span className="badge gray">li / 123456</span>
            <span className="badge gray">wang / 123456</span>
            <span className="badge gray">zhang / 123456</span>
          </div>
        </div>
      </div>
    </div>
  )
}
