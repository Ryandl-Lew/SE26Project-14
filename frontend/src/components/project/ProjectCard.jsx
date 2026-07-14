/**
 * ProjectCard 项目卡片
 * 用于项目管理列表；展示概要信息、进度与操作入口。
 */
import { useNavigate } from 'react-router-dom'
import { StatusBadge } from '@/components/ui'
import './project-card.css'

/**
 * @param {Object} props
 * @param {import('@/domain/models').Project} props.project
 * @param {(project: import('@/domain/models').Project) => void} [props.onSetCurrent] 设为当前项目
 */
export default function ProjectCard({ project, onSetCurrent }) {
  const navigate = useNavigate()

  return (
    <article className="project-card">
      <div className="card-title-row">
        <div>
          <h3>{project.name}</h3>
          <p className="muted small">{project.description}</p>
        </div>
        <StatusBadge kind="project" status={project.status} />
      </div>

      <div className="progress">
        <span style={{ width: `${project.progress}%` }} />
      </div>

      <div className="muted small">
        项目编号：{project.code} · 负责人：{project.ownerName} · 成员 {project.memberCount} · 实验{' '}
        {project.recordCount} · 最近更新 {project.updatedAt}
      </div>

      <div className="card-actions">
        <button className="primary-btn" onClick={() => navigate(`/projects/${project.id}`)}>
          进入项目
        </button>
        <button className="secondary-btn" onClick={() => onSetCurrent?.(project)}>
          设为当前项目
        </button>
        {/* TODO: 接入编辑 / 归档 / 导出报告能力 */}
        <button className="secondary-btn">编辑</button>
      </div>
    </article>
  )
}
