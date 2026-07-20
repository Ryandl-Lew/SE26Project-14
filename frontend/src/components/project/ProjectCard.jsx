/**
 * ProjectRow 项目列表行
 * 紧凑、可扫描的单行项目条目：状态、负责人、进度、记录数、更新时间。
 * 整行可点击进入项目详情；「设为当前项目」更新全局项目上下文。
 */
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'
import { StatusBadge, Icon } from '@/components/ui'
import { useAppStore } from '@/store/appStore'
import './project-card.css'

/**
 * @param {Object} props
 * @param {import('@/domain/models').Project} props.project
 * @param {(project: import('@/domain/models').Project) => void} [props.onSetCurrent] 设为当前项目
 */
export default function ProjectRow({ project, onSetCurrent }) {
  const navigate = useNavigate()
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const isCurrent = currentProjectId === project.id

  const open = () => navigate(`/projects/${project.id}`)

  return (
    <article
      className={`project-row ${isCurrent ? 'is-current' : ''}`.trim()}
      tabIndex={0}
      role="link"
      aria-label={`进入项目 ${project.name}`}
      onClick={open}
      onKeyDown={(e) => {
        if (e.key === 'Enter') open()
      }}
    >
      <div className="project-row-main">
        <div className="project-row-title">
          <strong>{project.name}</strong>
          <StatusBadge kind="project" status={project.status} />
          {isCurrent && <span className="badge green">当前项目</span>}
        </div>
        <p className="muted small">{project.description}</p>
        <div className="project-row-tags muted small">
          {project.code}
          {project.tags.map((tag) => (
            <span className="project-tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="project-row-meta">
        <span className="muted small">负责人</span>
        <strong>{project.ownerName}</strong>
      </div>

      <div className="project-row-progress">
        <span className="muted small">进度 {project.progress}%</span>
        <div className="progress" aria-hidden="true">
          <span style={{ width: `${project.progress}%` }} />
        </div>
      </div>

      <div className="project-row-meta">
        <span className="muted small">实验记录</span>
        <strong>{project.recordCount} 条</strong>
      </div>

      <div className="project-row-meta">
        <span className="muted small">最近更新</span>
        <strong>{project.updatedAt}</strong>
      </div>

      <div className="project-row-actions" onClick={(e) => e.stopPropagation()}>
        <button className="secondary-btn" onClick={open}>
          进入项目
          <Icon name={ArrowRight} size={14} />
        </button>
        {isCurrent ? (
          <button className="ghost-btn" disabled>
            <Icon name={Check} size={14} />
            当前项目
          </button>
        ) : (
          <button className="ghost-btn" onClick={() => onSetCurrent?.(project)}>
            设为当前项目
          </button>
        )}
      </div>
    </article>
  )
}
