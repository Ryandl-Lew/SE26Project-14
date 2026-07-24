/**
 * 注册页面（新设计）
 * 创建账号后自动登录，对接 authStore.register。
 */
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { CircleAlert, Loader2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import AuthLayout from '@/components/auth/AuthLayout'

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

  const fieldError = (field) =>
    fieldErrors[field] ? (
      <span className="mt-1 block text-xs text-red-600">{fieldErrors[field]}</span>
    ) : null

  const labelCls = 'mb-1.5 block text-sm font-medium text-slate-700'

  return (
    <AuthLayout
      title="创建账号"
      subtitle="加入 BioNote，开始规范记录你的实验"
      footer={
        <span>
          已有账号？{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-600 hover:text-brand-700"
          >
            返回登录
          </Link>
        </span>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="register-username" className={labelCls}>
              用户名
            </label>
            <input
              id="register-username"
              value={form.username}
              onChange={updateField('username')}
              autoComplete="username"
              minLength={3}
              maxLength={64}
              required
              autoFocus
              className="input h-11"
            />
            {fieldError('username')}
          </div>

          <div>
            <label htmlFor="register-name" className={labelCls}>
              姓名
            </label>
            <input
              id="register-name"
              value={form.name}
              onChange={updateField('name')}
              autoComplete="name"
              maxLength={100}
              required
              className="input h-11"
            />
            {fieldError('name')}
          </div>
        </div>

        <div>
          <label htmlFor="register-email" className={labelCls}>
            邮箱
          </label>
          <input
            id="register-email"
            type="email"
            value={form.email}
            onChange={updateField('email')}
            autoComplete="email"
            maxLength={255}
            required
            className="input h-11"
          />
          {fieldError('email')}
        </div>

        <div>
          <label htmlFor="register-avatar" className={labelCls}>
            头像文字 <span className="font-normal text-slate-400">（选填）</span>
          </label>
          <input
            id="register-avatar"
            value={form.avatarText}
            onChange={updateField('avatarText')}
            maxLength={8}
            placeholder="默认取姓名首字"
            className="input h-11"
          />
          {fieldError('avatarText')}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="register-password" className={labelCls}>
              密码
            </label>
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
              className="input h-11"
            />
            {fieldError('password')}
          </div>

          <div>
            <label htmlFor="confirm-password" className={labelCls}>
              确认密码
            </label>
            <input
              id="confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={updateField('confirmPassword')}
              autoComplete="new-password"
              minLength={8}
              maxLength={72}
              required
              className="input h-11"
            />
            {fieldError('confirmPassword')}
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
          {submitting ? '注册中…' : '注册并登录'}
        </button>
      </form>
    </AuthLayout>
  )
}
