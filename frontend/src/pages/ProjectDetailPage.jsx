/**
 * 项目详情 ProjectDetail（重设计）
 * 头部概要 + Tab 结构：概览 / 实验记录 / 成员 / 附件与动态。
 * 避免信息无层级堆砌，每个 Tab 专注一类内容。
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Plus,
  NotebookPen,
  CheckCircle2,
  TrendingUp,
  Paperclip,
  Upload,
  UserPlus,
  Users,
  Clock,
  ChevronRight,
} from 'lucide-react'
import {
  Button,
  StatCard,
  StatusBadge,
  Surface,
  Badge,
  Tabs,
  EmptyState,
} from '@/components/ui'
import { PROJECT_ROLE_LABELS, PROJECT_ROLE_TONES } from '@/domain'
import {
  fetchProject,
  fetchProjectActivities,
  fetchProjectAttachments,
  fetchProjectMembers,
  fetchProjectTimeline,
  fetchRecords,
} from '@/api'

/** 统计卡图标配置 */
const STAT_CONFIG = [
  { icon: NotebookPen, tone: 'blue' },
  { icon: CheckCircle2, tone: 'green' },
  { icon: TrendingUp, tone: 'amber' },
  { icon: Paperclip, tone: 'violet' },
]

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [records, setRecords] = useState([])
  const [attachments, setAttachments] = useState([])
  const [activities, setActivities] = useState([])
  const [timeline, setTimeline] = useState([])
  const [members, setMembers] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!projectId) return
    fetchProject(projectId).then((p) => setProject(p ?? null))
    fetchRecords(projectId).then(setRecords)
    fetchProjectAttachments(projectId).then(setAttachments)
    fetchProjectActivities(projectId).then(setActivities)
    fetchProjectTimeline(projectId).then(setTimeline)
    fetchProjectMembers(projectId).then(setMembers)
  }, [projectId])

  if (!project) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        加载项目中…
      </div>
    )
  }

  const stats = [
    { label: '实验记录总数', value: project.recordCount, note: '本周新增 2 条' },
    { label: '已完成实验', value: 8, note: '完成率 67%' },
    { label: '进行中实验', value: 3, note: '含 1 条编辑中' },
    { label: '项目附件', value: attachments.length, note: '方案、文献、汇总表' },
  ].map((s, i) => ({ ...s, ...STAT_CONFIG[i] }))

  const tabs = [
    { key: 'overview', label: '概览' },
    { key: 'records', label: `实验记录 ${records.length}` },
    { key: 'members', label: `成员 ${members.length}` },
    { key: 'files', label: '附件与动态' },
  ]

  return (
    <section className="space-y-6">
      {/* 头部 */}
      <div>
        <button
          type="button"
          onClick={() => navigate('/projects')}
          className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-600"
        >
          <ArrowLeft size={15} />
          返回项目列表
        </button>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{project.name}</h1>
              <StatusBadge kind="project" status={project.status} />
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="font-mono text-xs">{project.code}</span>
              <span className="inline-flex items-center gap-1.5">
                <Users size={14} className="text-slate-400" />
                {project.ownerName} · {project.memberCount} 人
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} className="text-slate-400" />
                {project.updatedAt} 更新
              </span>
            </div>
          </div>
          <Button icon={Plus} onClick={() => navigate('/records/new')}>
            新建实验
          </Button>
        </div>

        {/* 进度条 */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 max-w-md flex-1 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-slate-700">{project.progress}%</span>
        </div>
      </div>

      {/* Tab 切换 */}
      <Tabs items={tabs} activeKey={activeTab} onChange={setActiveTab} />

      {/* 概览 */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s) => (
              <StatCard key={s.label} stat={s} />
            ))}
          </div>

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
            <Surface title="项目目标">
              <p className="text-sm leading-relaxed text-slate-600">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Badge key={tag} tone="blue">
                    {tag}
                  </Badge>
                ))}
              </div>
            </Surface>

            <Surface title="项目时间线">
              <ol className="relative ml-1.5 space-y-5 border-l-2 border-slate-100 pl-5">
                {timeline.map((item) => (
                  <li key={item.id} className="relative">
                    <span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-brand-500 bg-white" />
                    <div className="text-sm font-medium text-slate-900">
                      <span className="mr-2 font-mono text-xs text-brand-600">{item.date}</span>
                      {item.title}
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-slate-500">{item.summary}</p>
                  </li>
                ))}
              </ol>
            </Surface>
          </div>
        </div>
      )}

      {/* 实验记录 */}
      {activeTab === 'records' && (
        <Surface className="animate-fade-in">
          {records.length > 0 ? (
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
                      {r.code} · {r.experimentType} · {r.ownerName} · {r.updatedAt}
                    </div>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={NotebookPen}
              title="该项目暂无实验记录"
              action={
                <Button icon={Plus} onClick={() => navigate('/records/new')}>
                  新建实验
                </Button>
              }
            />
          )}
        </Surface>
      )}

      {/* 成员 */}
      {activeTab === 'members' && (
        <Surface
          className="animate-fade-in"
          title="项目成员"
          extra={
            <Button size="sm" icon={UserPlus}>
              邀请成员
            </Button>
          }
        >
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>成员</th>
                  <th>项目角色</th>
                  <th>权限摘要</th>
                  <th>加入时间</th>
                  <th>最近活跃</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user.id}>
                    <td>
                      <span className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 text-xs font-bold text-white">
                          {m.user.avatarText}
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-slate-900">
                            {m.user.name}
                          </span>
                          <span className="block text-xs text-slate-400">{m.user.email}</span>
                        </span>
                      </span>
                    </td>
                    <td>
                      <Badge tone={PROJECT_ROLE_TONES[m.role]}>{PROJECT_ROLE_LABELS[m.role]}</Badge>
                    </td>
                    <td className="text-slate-500">{m.permissionSummary}</td>
                    <td className="text-slate-500">{m.joinedAt}</td>
                    <td className="text-slate-500">{m.lastActiveAt}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Surface>
      )}

      {/* 附件与动态 */}
      {activeTab === 'files' && (
        <div className="grid items-start gap-6 animate-fade-in xl:grid-cols-2">
          <Surface
            title="项目附件"
            extra={
              <Button variant="secondary" size="sm" icon={Upload}>
                上传
              </Button>
            }
          >
            <div className="space-y-2.5">
              {attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                >
                  <span className="flex min-w-0 items-center gap-2.5 text-sm text-slate-700">
                    <Paperclip size={14} className="shrink-0 text-slate-400" />
                    <span className="truncate">{a.name}</span>
                  </span>
                  <Badge tone="blue">{a.kind}</Badge>
                </div>
              ))}
            </div>
          </Surface>

          <Surface title="最近动态">
            <div className="space-y-3">
              {activities.map((ac) => (
                <div key={ac.id} className="rounded-lg border border-slate-200 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-900">{ac.text}</span>
                    <Badge tone="blue">{ac.category}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">{ac.target}</p>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      )}
    </section>
  )
}
