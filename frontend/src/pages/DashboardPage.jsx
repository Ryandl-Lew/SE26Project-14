/**
 * 工作台 Dashboard（重设计）
 * 极简问候头 + 统计卡 + 进行中的项目 / 最近记录 + 待办 / 提醒。
 * 设计原则：信息一屏可览，列表行可点击直达，减少表格压迫感。
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  TrendingUp,
  NotebookPen,
  CircleAlert,
  Plus,
  Sparkles,
  ChevronRight,
  Bell,
  ListChecks,
  Users,
} from 'lucide-react'
import { Button, StatCard, StatusBadge, Surface, Badge, EmptyState } from '@/components/ui'
import {
  fetchDashboardStats,
  fetchNotifications,
  fetchProjects,
  fetchRecords,
  fetchTodos,
} from '@/api'
import { useAuthStore } from '@/store/authStore'

/** mock 文本图标 → lucide 组件与色系映射 */
const STAT_ICONS = {
  '▣': { icon: FolderKanban, tone: 'blue' },
  '↗': { icon: TrendingUp, tone: 'green' },
  '✎': { icon: NotebookPen, tone: 'violet' },
  '!': { icon: CircleAlert, tone: 'amber' },
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
    fetchProjects().then((list) => setProjects(list.slice(0, 3)))
    fetchRecords().then((list) => setRecords(list.slice(0, 4)))
    fetchTodos().then(setTodos)
    fetchNotifications().then(setNotifications)
  }, [])

  return (
    <section className="space-y-6">
      {/* 问候头 */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            早上好，{currentUser?.name || '访客'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            2026年7月9日 星期四 · 你最近正在处理
            <button
              type="button"
              onClick={() => navigate('/projects/p-001')}
              className="ml-1 font-medium text-brand-600 hover:text-brand-700"
            >
              GFP 融合蛋白表达项目
            </button>
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="secondary" icon={Sparkles} onClick={() => navigate('/ai')}>
            AI 助手
          </Button>
          <Button icon={Plus} onClick={() => navigate('/records/new')}>
            新建实验记录
          </Button>
        </div>
      </div>

      {/* 统计卡 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const mapped = STAT_ICONS[stat.icon] ?? {}
          return (
            <StatCard key={stat.label} stat={{ ...stat, icon: mapped.icon, tone: mapped.tone }} />
          )
        })}
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr),340px]">
        {/* 左列：项目 + 记录 */}
        <div className="space-y-6">
          {/* 进行中的项目 */}
          <Surface
            title="进行中的项目"
            extra={
              <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
                全部项目
                <ChevronRight size={14} />
              </Button>
            }
          >
            {projects.length > 0 ? (
              <div className="-mx-5 divide-y divide-slate-100">
                {projects.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => navigate(`/projects/${p.id}`)}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                      <FolderKanban size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2.5">
                        <span className="truncate text-sm font-semibold text-slate-900">
                          {p.name}
                        </span>
                        <StatusBadge kind="project" status={p.status} />
                      </div>
                      <div className="mt-1.5 flex items-center gap-3">
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
                            style={{ width: `${p.progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">
                          {p.progress}% · {p.recordCount} 条实验 · {p.updatedAt} 更新
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-slate-300" />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={FolderKanban}
                title="暂无进行中的项目"
                description="创建一个项目，开始组织你的实验记录。"
              />
            )}
          </Surface>

          {/* 最近实验记录 */}
          <Surface
            title="最近实验记录"
            extra={
              <Button variant="ghost" size="sm" onClick={() => navigate('/records')}>
                查看全部
                <ChevronRight size={14} />
              </Button>
            }
          >
            <div className="-mx-5 divide-y divide-slate-100">
              {records.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => navigate(`/records/${r.id}`)}
                  className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition-colors hover:bg-slate-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <NotebookPen size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="truncate text-sm font-medium text-slate-900">{r.title}</span>
                      <StatusBadge kind="record" status={r.status} />
                    </div>
                    <div className="mt-0.5 text-xs text-slate-400">
                      {r.experimentType} · {r.ownerName} · {r.updatedAt}
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          </Surface>
        </div>

        {/* 右列：待办 + 提醒 */}
        <aside className="space-y-6">
          <Surface
            title={
              <span className="flex items-center gap-2">
                <ListChecks size={17} className="text-brand-600" />
                我的待办
              </span>
            }
            extra={<Badge tone="red">{todos.length}</Badge>}
          >
            <div className="space-y-3">
              {todos.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-slate-200 p-3.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-900">{t.title}</span>
                    <Badge tone="amber">{t.badgeText}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{t.description}</p>
                </div>
              ))}
            </div>
          </Surface>

          <Surface
            title={
              <span className="flex items-center gap-2">
                <Bell size={17} className="text-brand-600" />
                提醒
              </span>
            }
          >
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className="rounded-lg border border-slate-200 p-3.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-900">{n.title}</span>
                    <Badge tone="blue">{n.badgeText}</Badge>
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{n.description}</p>
                </div>
              ))}
            </div>
          </Surface>

          {/* 快捷入口 */}
          <Surface title="快捷入口">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: Plus, label: '新建项目', path: '/projects' },
                { icon: NotebookPen, label: '写实验记录', path: '/records/new' },
                { icon: Users, label: '邀请成员', path: '/team' },
                { icon: Sparkles, label: 'AI 生成', path: '/ai' },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 py-4 text-xs font-medium text-slate-600 transition-colors hover:border-brand-200 hover:bg-brand-50/50 hover:text-brand-700"
                >
                  <item.icon size={18} className="text-brand-600" />
                  {item.label}
                </button>
              ))}
            </div>
          </Surface>
        </aside>
      </div>
    </section>
  )
}
