/**
 * ProjectCard 项目卡片（新设计）
 * 用于项目管理列表；展示概要信息、进度与操作入口。
 */
import { useNavigate } from 'react-router-dom'
import {
  FolderKanban,
  ArrowRight,
  Pencil,
  Users,
  NotebookPen,
  Clock,
} from 'lucide-react'
import { Button, StatusBadge } from '@/components/ui'

/**
 * @param {Object} props
 * @param {import('@/domain/models').Project} props.project
 * @param {(project: import('@/domain/models').Project) => void} [props.onSetCurrent] 设为当前项目
 */
function LegacyProjectCard({ project, onSetCurrent }) {
  const navigate = useNavigate()

  return (
    <article className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
      {/* 标题区 */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FolderKanban size={19} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-[15px] font-semibold text-slate-900">
              {project.name}
            </h3>
            <p className="mt-0.5 font-mono text-xs text-slate-400">{project.code}</p>
          </div>
        </div>
        <StatusBadge kind="project" status={project.status} />
      </div>

      {/* 描述 */}
      <p className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm leading-relaxed text-slate-500">
        {project.description}
      </p>

      {/* 进度 */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-slate-500">完成进度</span>
          <span className="font-semibold text-slate-700">{project.progress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* 元信息 */}
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5">
          <Users size={13} className="text-slate-400" />
          {project.ownerName} · {project.memberCount} 人
        </span>
        <span className="inline-flex items-center gap-1.5">
          <NotebookPen size={13} className="text-slate-400" />
          {project.recordCount} 条实验
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock size={13} className="text-slate-400" />
          {project.updatedAt}
        </span>
      </div>

      {/* 操作区：主操作占满剩余空间，次操作图标化 */}
      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
        <Button
          className="flex-1"
          icon={ArrowRight}
          onClick={() => navigate(`/projects/${project.id}`)}
        >
          进入项目
        </Button>
        <Button variant="ghost" icon={Pencil} title="编辑项目" aria-label="编辑项目" />
      </div>
    </article>
  )
}

export default function ProjectCard({ project }) {
  const navigate = useNavigate()

  return (
    <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-colors hover:border-brand-200">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <FolderKanban size={18} />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-[15px] font-semibold text-slate-900">{project.name}</h2>
            <p className="mt-0.5 font-mono text-xs text-slate-400">{project.code}</p>
          </div>
        </div>
        <StatusBadge kind="project" status={project.status} />
      </div>

      <p className="mt-4 line-clamp-3 min-h-[3.9rem] text-sm leading-relaxed text-slate-500">
        {project.description}
      </p>

      <dl className="mt-4 grid grid-cols-4 divide-x divide-slate-200 rounded-xl border border-slate-100 bg-slate-50/80 px-2 py-3 text-center text-xs">
        <div className="min-w-0 px-2"><dt className="text-[11px] text-slate-400">负责人</dt><dd className="mt-1 truncate font-medium text-slate-700">{project.ownerName}</dd></div>
        <div className="min-w-0 px-2"><dt className="text-[11px] text-slate-400">成员</dt><dd className="mt-1 font-medium text-slate-700">{project.memberCount} 人</dd></div>
        <div className="min-w-0 px-2"><dt className="text-[11px] text-slate-400">实验记录</dt><dd className="mt-1 font-medium text-slate-700">{project.recordCount} 条</dd></div>
        <div className="min-w-0 px-2"><dt className="text-[11px] text-slate-400">创建时间</dt><dd className="mt-1 truncate font-medium text-slate-700">{project.createdAt}</dd></div>
      </dl>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <Button className="w-full" icon={ArrowRight} onClick={() => navigate(`/projects/${project.id}`)}>
          进入项目
        </Button>
      </div>
    </article>
  )
}
