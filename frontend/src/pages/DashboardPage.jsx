/**
 * 工作台 Dashboard（今日指挥台 · 质感纪律版）
 *
 * 设计纪律（对标 Linear / Notion 的成熟感）：
 *   1. 全平设计：无渐变、无悬浮阴影，1px 细边框分区
 *   2. 颜色克制：中性灰为主，语义色只给真实状态
 *   3. 几何统一：图标盒统一 36px，行高统一，数字用等宽数字
 *   4. 排版层级：标题 semibold / 正文 normal / 元信息 xs muted，只有三档
 *   5. 加载用骨架屏，不用文字提示
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Undo2,
  Hourglass,
  ListChecks,
  ChevronRight,
  ArrowUpRight,
  FlaskConical,
} from 'lucide-react'
import { Button, StatusBadge, EmptyState } from '@/components/ui'
import {
  fetchProjectActivities,
  fetchProjects,
  fetchRecords,
  fetchTodos,
} from '@/api'
import { useAuthStore } from '@/store/authStore'

/** 分诊队列色系（扁平） */
const QUEUE_TONES = {
  red: 'bg-red-50 text-red-600',
  amber: 'bg-amber-50 text-amber-600',
  blue: 'bg-brand-50 text-brand-600',
}

/** 骨架行 */
function SkeletonRows({ count = 3 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3.5"
        >
          <div className="h-9 w-9 rounded-md bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-1/3 rounded bg-slate-100" />
            <div className="h-3 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  )
}

/** 区块标题 */
function SectionTitle({ children, count, action }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-semibold text-slate-900">
        {children}
        {count != null && (
          <span className="ml-2 font-normal tabular-nums text-slate-400">{count}</span>
        )}
      </h2>
      {action}
    </div>
  )
}

function LegacyDashboardPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((s) => s.currentUser)
  const [loading, setLoading] = useState(true)
  const [projects, setProjects] = useState([])
  const [records, setRecords] = useState([])
  const [todos, setTodos] = useState([])
  const [activities, setActivities] = useState([])

  useEffect(() => {
    Promise.all([
      fetchProjects().then(setProjects),
      fetchRecords().then(setRecords),
      fetchTodos().then(setTodos),
      fetchProjectActivities('p-001').then(setActivities),
    ]).finally(() => setLoading(false))
  }, [])

  /** 最近可继续编辑的记录（进行中/退回/草稿，待审核的归队列管） */
  const lastRecord = records.find((r) =>
    ['in_progress', 'rejected', 'draft'].includes(r.status),
  )

  /** 分诊队列：退回修改 > 待审核 > 今日待办 */
  const queue = useMemo(() => {
    const rejected = records
      .filter((r) => r.status === 'rejected')
      .map((r) => ({
        id: `rej-${r.id}`,
        tone: 'red',
        icon: Undo2,
        tag: '退回修改',
        title: r.title,
        meta: `${r.projectName} · ${r.updatedAt}`,
        action: '去修改',
        path: `/records/${r.id}/edit`,
      }))
    const pending = records
      .filter((r) => r.status === 'pending_review')
      .map((r) => ({
        id: `rev-${r.id}`,
        tone: 'amber',
        icon: Hourglass,
        tag: '待审核',
        title: r.title,
        meta: `${r.ownerName} 提交 · ${r.updatedAt}`,
        action: '去审核',
        path: `/records/${r.id}`,
      }))
    const todoItems = todos.map((t) => ({
      id: `todo-${t.id}`,
      tone: 'blue',
      icon: ListChecks,
      tag: t.badgeText,
      title: t.title,
      meta: t.description,
      action: null,
      path: null,
    }))
    return [...rejected, ...pending, ...todoItems]
  }, [records, todos])

  const actionableCount = queue.length

  return (
    <section className="space-y-8">
      {/* 头部 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-slate-900">
            早上好，{currentUser?.name || '访客'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            7月9日 星期四
            {actionableCount > 0 && (
              <span className="text-slate-400"> · 今天有 {actionableCount} 项待处理</span>
            )}
          </p>
        </div>
        <Button icon={Plus} onClick={() => navigate('/records/new')}>
          快速记录
        </Button>
      </div>

      {/* 继续上次的工作 */}
      {!loading && lastRecord && (
        <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <FlaskConical size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-400">继续工作</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <h2 className="truncate text-sm font-semibold text-slate-900">
                {lastRecord.title}
              </h2>
              <StatusBadge kind="record" status={lastRecord.status} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className="mr-2 hidden text-xs tabular-nums text-slate-400 sm:block">
              最后编辑 {lastRecord.updatedAt}
            </span>
            <Button variant="ghost" size="sm" onClick={() => navigate(`/records/${lastRecord.id}`)}>
              查看
            </Button>
            <Button size="sm" onClick={() => navigate(`/records/${lastRecord.id}/edit`)}>
              继续编辑
            </Button>
          </div>
        </div>
      )}

      {/* 主区：分诊队列 + 侧栏 */}
      <div className="grid items-start gap-8 xl:grid-cols-[minmax(0,1.6fr),minmax(300px,1fr)]">
        {/* 需要你处理 */}
        <div>
          <SectionTitle count={queue.length}>需要你处理</SectionTitle>
          {loading ? (
            <SkeletonRows />
          ) : queue.length > 0 ? (
            <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {queue.map((item) => {
                const Wrapper = item.path ? 'button' : 'div'
                return (
                  <Wrapper
                    key={item.id}
                    {...(item.path
                      ? { type: 'button', onClick: () => navigate(item.path) }
                      : {})}
                    className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition-colors hover:bg-slate-50"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${QUEUE_TONES[item.tone]}`}
                    >
                      <item.icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-slate-900">
                          {item.title}
                        </span>
                        <span className="shrink-0 text-xs text-slate-400">{item.tag}</span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-slate-400">{item.meta}</p>
                    </div>
                    {item.action && (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600">
                        {item.action}
                        <ArrowUpRight size={13} />
                      </span>
                    )}
                  </Wrapper>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={ListChecks}
              title="全部处理完毕"
              description="没有退回、待审核的记录，也没有待办事项。"
            />
          )}
        </div>

        {/* 侧栏 */}
        <aside className="space-y-6">
          {/* 本周动态 */}
          <div>
            <SectionTitle>本周动态</SectionTitle>
            <div className="rounded-xl border border-slate-200 bg-white px-5 py-4">
              {loading ? (
                <SkeletonRows count={2} />
              ) : (
                <ol className="divide-y divide-slate-100">
                  {activities.map((ac) => (
                    <li key={ac.id} className="py-3 first:pt-1 last:pb-1">
                      <p className="text-sm text-slate-700">{ac.text}</p>
                      <p className="mt-0.5 truncate text-xs tabular-nums text-slate-400">
                        {ac.target} · {ac.createdAt}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* 我的项目 */}
      <div>
        <SectionTitle
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate('/projects')}>
              全部项目
              <ChevronRight size={14} />
            </Button>
          }
        >
          我的项目
        </SectionTitle>
        {loading ? (
          <SkeletonRows count={2} />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => navigate(`/projects/${p.id}`)}
                className="rounded-xl border border-slate-200 bg-white p-4 text-left transition-colors hover:border-slate-300 hover:bg-slate-50"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-slate-900">{p.name}</span>
                  <StatusBadge kind="project" status={p.status} />
                </div>
                <div className="mt-3 flex items-center gap-2.5">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-brand-500"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium tabular-nums text-slate-600">
                    {p.progress}%
                  </span>
                </div>
                <p className="mt-2 text-xs tabular-nums text-slate-400">
                  {p.recordCount} 条实验 · {p.updatedAt} 更新
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

const TASK_STYLES = {
  rejected: { icon: Undo2, box: 'bg-red-50 text-red-600', label: '需修改' },
  review: { icon: Hourglass, box: 'bg-amber-50 text-amber-600', label: '待审核' },
  todo: { icon: ListChecks, box: 'bg-brand-50 text-brand-600', label: '待办' },
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const [records, setRecords] = useState([])
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([fetchRecords().then(setRecords), fetchTodos().then(setTodos)]).finally(() =>
      setLoading(false),
    )
  }, [])

  const tasks = useMemo(() => {
    const changes = records
      .filter((record) => record.creatorId === currentUser?.id && record.status === 'rejected')
      .map((record) => ({
        id: `change-${record.id}`,
        type: 'rejected',
        title: record.title,
        description: `${record.projectName} · 查看审核意见并补充记录`,
        time: record.updatedAt,
        status: record.status,
        action: '继续修改',
        path: `/records/${record.id}/edit`,
      }))

    const reviews = records
      .filter(
        (record) =>
          record.assignedReviewerId === currentUser?.id && record.status === 'pending_review',
      )
      .map((record) => ({
        id: `review-${record.id}`,
        type: 'review',
        title: record.title,
        description: `${record.ownerName} 提交 ${record.revision} · ${record.projectName}`,
        time: record.updatedAt,
        status: record.status,
        action: '开始审核',
        path: `/records/${record.id}`,
      }))

    const general = todos.map((todo) => ({
      id: todo.id,
      type: 'todo',
      title: todo.title,
      description: todo.description,
      time: todo.badgeText,
    }))
    return [...changes, ...reviews, ...general]
  }, [currentUser?.id, records, todos])

  return (
    <section>
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">工作台</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">待办事项</h1>
        <p className="mt-1.5 text-sm text-slate-500">
          集中处理被退回的记录、指派给你的审核任务和课程项目提醒。
        </p>
      </div>

      <div className="mx-auto max-w-5xl">
        {loading ? (
          <SkeletonRows />
        ) : tasks.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
              <span className="text-sm font-semibold text-slate-900">需要你处理</span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium tabular-nums text-slate-500">
                {tasks.length} 项
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {tasks.map((task) => {
                const config = TASK_STYLES[task.type]
                const Icon = config.icon
                const Wrapper = task.path ? 'button' : 'div'
                return (
                  <Wrapper
                    key={task.id}
                    {...(task.path
                      ? { type: 'button', onClick: () => navigate(task.path) }
                      : {})}
                    className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50"
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${config.box}`}>
                      <Icon size={17} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="truncate text-sm font-semibold text-slate-900">{task.title}</span>
                        {task.status ? (
                          <StatusBadge kind="record" status={task.status} />
                        ) : (
                          <span className="text-xs text-slate-400">{config.label}</span>
                        )}
                      </span>
                      <span className="mt-1 block truncate text-xs text-slate-500">{task.description}</span>
                    </span>
                    <span className="hidden shrink-0 text-xs text-slate-400 sm:block">{task.time}</span>
                    {task.action && (
                      <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-brand-600">
                        {task.action}<ArrowUpRight size={13} />
                      </span>
                    )}
                  </Wrapper>
                )
              })}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={ListChecks}
            title="待办已清空"
            description="当前没有需要处理的审核、修改或项目提醒。"
          />
        )}
      </div>
    </section>
  )
}
