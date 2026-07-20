import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FlaskConical } from 'lucide-react'
import { Icon } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'
import './login.css'

const INITIAL_FORM = {
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  name: '',
  avatarText: '',
}

export default function RegisterPage() {
  const [form, setForm] = useState(INITIAL_FORM)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const register = useAuthStore((state) => state.register)
  const currentUser = useAuthStore((state) => state.currentUser)
  const loading = useAuthStore((state) => state.loading)
  const navigate = useNavigate()

  if (!loading && currentUser) {
    return <Navigate to="/" replace />
  }

  const updateField = (field) => (event) => {
    setForm((current) => ({ ...current, [field]: event.target.value }))
    setFieldErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setFieldErrors({})
    if (form.password !== form.confirmPassword) {
      setFieldErrors({ confirmPassword: '两次输入的密码不一致' })
      return
    }

    setSubmitting(true)
    try {
      await register({
        username: form.username.trim(),
        email: form.email.trim(),
        password: form.password,
        name: form.name.trim(),
        avatarText: form.avatarText.trim() || null,
      })
      navigate('/', { replace: true })
    } catch (requestError) {
      setError(requestError.message || '注册失败，请重试')
      setFieldErrors(requestError.fieldErrors || {})
    } finally {
      setSubmitting(false)
    }
  }

  const fieldError = (field) => fieldErrors[field]
    ? <span className="field-error">{fieldErrors[field]}</span>
    : null

  return (
    <div className="login-page">
      <div className="login-card register-card">
        <div className="login-header">
          <div className="login-brand-mark"><Icon name={FlaskConical} size={22} /></div>
          <h1>创建账号</h1>
          <p className="login-sub">BioNote 生物实验记录助手</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="register-grid">
            <div className="field">
              <label htmlFor="register-username">用户名</label>
              <input
                id="register-username"
                value={form.username}
                onChange={updateField('username')}
                autoComplete="username"
                minLength={3}
                maxLength={64}
                required
                autoFocus
              />
              {fieldError('username')}
            </div>

            <div className="field">
              <label htmlFor="register-name">姓名</label>
              <input
                id="register-name"
                value={form.name}
                onChange={updateField('name')}
                autoComplete="name"
                maxLength={100}
                required
              />
              {fieldError('name')}
            </div>

            <div className="field full-width">
              <label htmlFor="register-email">邮箱</label>
              <input
                id="register-email"
                type="email"
                value={form.email}
                onChange={updateField('email')}
                autoComplete="email"
                maxLength={255}
                required
              />
              {fieldError('email')}
            </div>

            <div className="field full-width">
              <label htmlFor="register-avatar">头像文字（选填）</label>
              <input
                id="register-avatar"
                value={form.avatarText}
                onChange={updateField('avatarText')}
                maxLength={8}
              />
              {fieldError('avatarText')}
            </div>
          </div>

          <div className="field">
            <label htmlFor="register-password">密码</label>
            <input
              id="register-password"
              type="password"
              placeholder="至少 8 个字符"
              value={form.password}
              onChange={updateField('password')}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
            {fieldError('password')}
          </div>

          <div className="field">
            <label htmlFor="confirm-password">确认密码</label>
            <input
              id="confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
            />
            {fieldError('confirmPassword')}
          </div>

          {error && <div className="login-error" role="alert">{error}</div>}

          <button type="submit" className="primary-btn login-btn" disabled={submitting}>
            {submitting ? '注册中...' : '注册并登录'}
          </button>
        </form>

        <div className="auth-switch">
          <span>已有账号？</span>
          <Link to="/login">返回登录</Link>
        </div>
      </div>
    </div>
  )
}
