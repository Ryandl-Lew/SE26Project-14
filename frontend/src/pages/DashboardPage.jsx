/**
 * 工作台 Dashboard
 * 欢迎区 + 统计卡 + 最近项目 / 最近记录 + 待办 / 提醒。
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { StatCard, StatusBadge, Surface, GelPreview } from '@/components/ui'
import {
  fetchDashboardStats,
  fetchNotifications,
  fetchProjects,
  fetchRecords,
  fetchTodos,
} from '@/api'
import { useAuthStore } from '@/store/authStore'
import './dashboard.css'

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
    fetchProjects().then((list) => setProjects(list.slice(0, 3)))
    fetchRecords().then((list) => setRecords(list.slice(0, 4)))
    fetchTodos().then(setTodos)
    fetchNotifications().then(setNotifications)
  }, [])

  return (
    <section>
      <div className="hero-strip">
        <div className="hero-copy">
          <p className="eyebrow">今日工作台</p>
          <h1>早上好，{currentUser?.name || '访客'}</h1>
          <p className="page-desc">今天是 2026-07-09。你最近正在处理：GFP 融合蛋白表达项目。</p>
          <div className="card-actions" style={{ marginTop: 18 }}>
            <button className="primary-btn" onClick={() => navigate('/projects/p-001')}>
              进入项目管理
            </button>
            <button className="secondary-btn" onClick={() => navigate('/projects')}>
              查看全部项目
            </button>
            <button className="secondary-btn" onClick={() => navigate('/ai')}>
              打开 AI 助手
            </button>
          </div>
        </div>
        <div className="lab-visual">
          <GelPreview caption="GFP_gel_0707.png" />
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <StatCard key={stat.label} stat={stat} />
        ))}
      </div>

      <Surface
        title="最近访问项目"
        extra={
          <button className="ghost-btn" onClick={() => navigate('/projects')}>
            全部项目
          </button>
        }
        style={{ marginBottom: 18 }}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>项目名称</th>
                <th>状态</th>
                <th>负责人</th>
                <th>成员数</th>
                <th>最近更新</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>
                    <StatusBadge kind="project" status={p.status} />
                  </td>
                  <td>{p.ownerName}</td>
                  <td>{p.memberCount}</td>
                  <td>{p.updatedAt}</td>
                  <td>
                    <button className="link-btn" onClick={() => navigate(`/projects/${p.id}`)}>
                      进入项目
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <div className="work-grid">
        <Surface
          title="最近实验记录"
          extra={
            <button className="ghost-btn" onClick={() => navigate('/records')}>
              查看全部
            </button>
          }
        >
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>实验名称</th>
                  <th>类型</th>
                  <th>状态</th>
                  <th>最近修改</th>
                  <th>负责人</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{r.experimentType}</td>
                    <td>
                      <StatusBadge kind="record" status={r.status} />
                    </td>
                    <td>{r.updatedAt}</td>
                    <td>{r.ownerName}</td>
                    <td>
                      <button className="link-btn" onClick={() => navigate(`/records/${r.id}`)}>
                        查看
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>

        <aside className="stack">
          <Surface title="我的待办" extra={<span className="badge red">{todos.length}</span>}>
            <div className="stack">
              {todos.map((t) => (
                <div className="list-item" key={t.id}>
                  <div className="list-item-title">
                    <span>{t.title}</span>
                    <span className="badge amber">{t.badgeText}</span>
                  </div>
                  <div className="muted small">{t.description}</div>
                </div>
              ))}
            </div>
          </Surface>

          <Surface title="提醒">
            <div className="stack">
              {notifications.map((n) => (
                <div className="list-item" key={n.id}>
                  <div className="list-item-title">
                    <span>{n.title}</span>
                    <span className="badge blue">{n.badgeText}</span>
                  </div>
                  <div className="muted small">{n.description}</div>
                </div>
              ))}
            </div>
          </Surface>
        </aside>
      </div>
    </section>
  )
}
