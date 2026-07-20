/**
 * 工作台 Dashboard
 * 任务导向工作区：继续最近项目、新建实验、待审核 / 待办、最近记录、提醒。
 */
import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ArrowRight,
  FlaskConical,
  ClipboardCheck,
  Bell,
  History,
  Plus,
} from 'lucide-react'
import { StatCard, StatusBadge, Surface, Icon, EmptyState } from '@/components/ui'
import {
  fetchDashboardStats,
  fetchNotifications,
  fetchProjects,
  fetchRecords,
  fetchTodos,
} from '@/api'
import { useAuthStore } from '@/store/authStore'
import { useAppStore } from '@/store/appStore'
import './dashboard.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const setCurrentProject = useAppStore((s) => s.setCurrentProject)
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

  // 最近项目（按更新时间排序取第一）与待审核记录
  const recentProject = [...projects].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
  const pendingRecords = records.filter((r) => r.status === 'pending_review')
  const recentRecords = records.slice(0, 5)

  const enterProject = (id) => {
    setCurrentProject(id)
    navigate(`/projects/${id}`)
  }

  return (
    <section>
      <div className="dash-head">
        <div>
          <p className="eyebrow">工作台</p>
          <h1>你好，{currentUser?.name || '访客'}</h1>
          <p className="page-desc">从这里继续你的实验工作，或处理等待你的审核与评论。</p>
        </div>
        <div className="card-actions">
          <button className="secondary-btn" onClick={() => navigate('/templates')}>
            从模板新建
          </button>
          <button className="primary-btn" onClick={() => navigate('/records/new')}>
            <Icon name={Plus} size={15} />
            新建实验记录
          </button>
        </div>
      </div>

      <div className="dash-grid">
        {/* 左列：继续工作 + 最近记录 */}
        <div className="stack" style={{ alignContent: 'start' }}>
          {recentProject && (
            <Surface title="继续最近项目">
              <div className="continue-project">
                <div className="continue-project-main">
                  <div className="continue-project-title">
                    <Link to={`/projects/${recentProject.id}`}>{recentProject.name}</Link>
                    <StatusBadge kind="project" status={recentProject.status} />
                  </div>
                  <p className="muted small">{recentProject.description}</p>
                  <div className="continue-progress">
                    <div className="progress" aria-label={`项目进度 ${recentProject.progress}%`}>
                      <span style={{ width: `${recentProject.progress}%` }} />
                    </div>
                    <span className="muted small nowrap">{recentProject.progress}%</span>
                  </div>
                  <div className="muted small">
                    负责人 {recentProject.ownerName} · 实验记录 {recentProject.recordCount} 条 ·
                    最近更新 {recentProject.updatedAt}
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="primary-btn"
                    onClick={() => enterProject(recentProject.id)}
                  >
                    进入项目
                    <Icon name={ArrowRight} size={14} />
                  </button>
                  <button className="secondary-btn" onClick={() => navigate('/records/new')}>
                    <Icon name={FlaskConical} size={14} />
                    新建实验
                  </button>
                </div>
              </div>
            </Surface>
          )}

          <div className="stats-grid" style={{ marginBottom: 0 }}>
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </div>

          <Surface
            title="最近实验记录"
            extra={
              <button className="ghost-btn" onClick={() => navigate('/records')}>
                <Icon name={History} size={14} />
                全部记录
              </button>
            }
          >
            {recentRecords.length ? (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>实验名称</th>
                      <th>所属项目</th>
                      <th>状态</th>
                      <th>最近修改</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRecords.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <Link className="table-link" to={`/records/${r.id}`}>
                            {r.title}
                          </Link>
                        </td>
                        <td className="muted">{r.projectName}</td>
                        <td>
                          <StatusBadge kind="record" status={r.status} />
                        </td>
                        <td className="muted">{r.updatedAt}</td>
                        <td>
                          <button
                            className="link-btn"
                            onClick={() => navigate(`/records/${r.id}`)}
                          >
                            查看
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState title="暂无实验记录" description="从「新建实验记录」开始第一条记录。" />
            )}
          </Surface>
        </div>

        {/* 右列：待审核 + 待办 + 提醒 */}
        <aside className="stack" style={{ alignContent: 'start' }}>
          <Surface
            title="待审核记录"
            extra={<span className="badge amber">{pendingRecords.length}</span>}
          >
            {pendingRecords.length ? (
              <div className="stack">
                {pendingRecords.map((r) => (
                  <div className="list-item" key={r.id}>
                    <div className="list-item-title">
                      <span>{r.title}</span>
                      <StatusBadge kind="record" status={r.status} />
                    </div>
                    <div className="muted small">
                      {r.projectName} · {r.ownerName} · {r.updatedAt}
                    </div>
                    <div className="card-actions" style={{ marginTop: 4 }}>
                      <button
                        className="secondary-btn"
                        onClick={() => navigate(`/records/${r.id}`)}
                      >
                        <Icon name={ClipboardCheck} size={14} />
                        去审核
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={ClipboardCheck}
                title="没有待审核的记录"
                description="提交审核的实验记录会出现在这里。"
              />
            )}
          </Surface>

          <Surface title="我的待办" extra={<span className="badge gray">{todos.length}</span>}>
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

          <Surface
            title={
              <>
                <Icon name={Bell} size={15} style={{ verticalAlign: '-2px' }} /> 提醒
              </>
            }
          >
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
