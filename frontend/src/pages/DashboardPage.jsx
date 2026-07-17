/**
 * 工作台 Dashboard（重构版）
 * 作为用户登录后的首页，提供清晰的导航入口、关键指标、最近工作内容与待办提醒。
 * 不修改后端接口，仅使用现有 API 与 mock 数据。
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatCard, StatusBadge, Surface } from '@/components/ui'
import {
  fetchDashboardStats,
  fetchNotifications,
  fetchProjects,
  fetchRecords,
  fetchTodos,
} from '@/api'
import { useAuthStore } from '@/store/authStore'
import './dashboard.css'

/** 获取当前问候语 */
function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

/** 格式化今日日期 */
function formatToday() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()]
  return `${y}-${m}-${d} 星期${week}`
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)

  const [stats, setStats] = useState([])
  const [projects, setProjects] = useState([])
  const [records, setRecords] = useState([])
  const [todos, setTodos] = useState([])
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    fetchDashboardStats().then(setStats)
    fetchProjects().then(setProjects)
    fetchRecords().then(setRecords)
    fetchTodos().then(setTodos)
    fetchNotifications().then(setNotifications)
  }, [])

  // 取最近 3 个活跃项目、4 条最近记录
  const recentProjects = useMemo(() => {
    const activeFirst = [...projects].sort((a, b) => {
      const activeWeight = { active: 3, reviewing: 2, paused: 1, completed: 0, archived: -1 }
      return (activeWeight[b.status] ?? 0) - (activeWeight[a.status] ?? 0)
    })
    return activeFirst.slice(0, 3)
  }, [projects])

  const recentRecords = useMemo(() => records.slice(0, 4), [records])

  // 计算“最近处理的项目”：按更新时间排序
  const latestProject = useMemo(() => {
    if (!projects.length) return null
    return [...projects].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]
  }, [projects])

  const quickActions = [
    { label: '新建实验记录', icon: '✎', route: '/records/new', tone: 'primary' },
    { label: '新建项目', icon: '▣', route: '/projects', tone: 'secondary' },
    { label: 'AI 助手', icon: '✦', route: '/ai', tone: 'secondary' },
  ]

  return (
    <section className="dashboard">
      {/* 顶部欢迎区 */}
      <div className="dashboard-hero">
        <div className="hero-main">
          <p className="eyebrow">今日工作台</p>
          <h1>
            {getGreeting()}，{currentUser?.name || '访客'}
          </h1>
          <p className="page-desc">今天是 {formatToday()}。</p>
          {latestProject ? (
            <p className="page-desc focus-project">
              你最近正在处理：
              <button
                className="link-btn focus-link"
                onClick={() => navigate(`/projects/${latestProject.id}`)}
              >
                {latestProject.name}
              </button>
            </p>
          ) : (
            <p className="page-desc">还没有项目，先新建一个项目开始吧。</p>
          )}

          <div className="quick-actions">
            {quickActions.map((action) => (
              <button
                key={action.label}
                className={`quick-action ${action.tone}`}
                onClick={() => navigate(action.route)}
              >
                <span className="quick-icon">{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="hero-summary">
          <div className="summary-card">
            <div className="summary-value">{projects.filter((p) => p.status === 'active').length}</div>
            <div className="summary-label">进行中项目</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">
              {records.filter((r) => r.status === 'pending_review' || r.status === 'rejected').length}
            </div>
            <div className="summary-label">待处理记录</div>
          </div>
          <div className="summary-card">
            <div className="summary-value">{todos.length}</div>
            <div className="summary-label">我的待办</div>
          </div>
        </div>
      </div>

      {/* 可点击的核心指标卡 */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      {/* 主要内容两栏 */}
      <div className="dashboard-body">
        <div className="dashboard-main">
          {/* 最近项目 */}
          <Surface
            title="最近访问项目"
            extra={
              <button className="ghost-btn" onClick={() => navigate('/projects')}>
                全部项目 →
              </button>
            }
          >
            <div className="table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>项目名称</th>
                    <th>状态</th>
                    <th>负责人</th>
                    <th>进度</th>
                    <th>最近更新</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recentProjects.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div className="cell-title">{p.name}</div>
                        <div className="cell-sub">{p.code}</div>
                      </td>
                      <td>
                        <StatusBadge kind="project" status={p.status} />
                      </td>
                      <td>{p.ownerName}</td>
                      <td>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="progress-text">{p.progress}%</span>
                      </td>
                      <td>{p.updatedAt}</td>
                      <td>
                        <button
                          className="link-btn"
                          onClick={() => navigate(`/projects/${p.id}`)}
                        >
                          进入
                        </button>
                      </td>
                    </tr>
                  ))}
                  {!recentProjects.length && (
                    <tr>
                      <td colSpan={6} className="empty-cell">
                        暂无项目数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Surface>

          {/* 最近记录 */}
          <Surface
            title="最近实验记录"
            extra={
              <button className="ghost-btn" onClick={() => navigate('/records')}>
                查看全部 →
              </button>
            }
          >
            <div className="table-wrap">
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>实验名称</th>
                    <th>所属项目</th>
                    <th>类型</th>
                    <th>状态</th>
                    <th>最近修改</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <div className="cell-title">{r.title}</div>
                        <div className="cell-sub">{r.code}</div>
                      </td>
                      <td>{r.projectName}</td>
                      <td>{r.experimentType}</td>
                      <td>
                        <StatusBadge kind="record" status={r.status} />
                      </td>
                      <td>{r.updatedAt}</td>
                      <td>
                        <div className="row-actions">
                          <button
                            className="link-btn"
                            onClick={() => navigate(`/records/${r.id}`)}
                          >
                            查看
                          </button>
                          {r.status !== 'completed' && (
                            <button
                              className="link-btn"
                              onClick={() => navigate(`/records/${r.id}/edit`)}
                            >
                              编辑
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!recentRecords.length && (
                    <tr>
                      <td colSpan={6} className="empty-cell">
                        暂无实验记录
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Surface>
        </div>

        {/* 右侧边栏 */}
        <aside className="dashboard-side">
          <Surface
            title="我的待办"
            extra={todos.length > 0 && <span className="badge red">{todos.length}</span>}
          >
            <div className="side-stack">
              {todos.map((t) => (
                <div className="todo-item" key={t.id}>
                  <div className="todo-title">
                    <span className="todo-dot" />
                    <span>{t.title}</span>
                  </div>
                  <div className="todo-meta">
                    <span className="badge amber">{t.badgeText}</span>
                  </div>
                  <div className="muted small">{t.description}</div>
                </div>
              ))}
              {!todos.length && <div className="empty-tip">暂无待办事项</div>}
            </div>
          </Surface>

          <Surface title="提醒与通知">
            <div className="side-stack">
              {notifications.map((n) => (
                <div className="notice-item" key={n.id}>
                  <div className="notice-title">
                    <span>{n.title}</span>
                    <span className="badge blue">{n.badgeText}</span>
                  </div>
                  <div className="muted small">{n.description}</div>
                </div>
              ))}
              {!notifications.length && <div className="empty-tip">暂无提醒</div>}
            </div>
          </Surface>

        </aside>
      </div>
    </section>
  )
}
