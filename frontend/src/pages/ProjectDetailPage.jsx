/**
 * 项目详情 ProjectDetail（原型 current-project）
 * 概览 + 统计 + 附件 / 动态 + 时间线 + 成员。
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PageHeader, StatCard, StatusBadge, Surface, Badge } from '@/components/ui'
import { PROJECT_ROLE_LABELS, PROJECT_ROLE_TONES } from '@/domain'
import {
  fetchProject,
  fetchProjectActivities,
  fetchProjectAttachments,
  fetchProjectMembers,
  fetchProjectTimeline,
  fetchRecords,
} from '@/api'
import './project-detail.css'

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [records, setRecords] = useState([])
  const [attachments, setAttachments] = useState([])
  const [activities, setActivities] = useState([])
  const [timeline, setTimeline] = useState([])
  const [members, setMembers] = useState([])

  useEffect(() => {
    if (!projectId) return
    fetchProject(projectId).then((p) => setProject(p ?? null))
    fetchRecords(projectId).then((list) => setRecords(list.slice(0, 3)))
    fetchProjectAttachments(projectId).then(setAttachments)
    fetchProjectActivities(projectId).then(setActivities)
    fetchProjectTimeline(projectId).then(setTimeline)
    fetchProjectMembers(projectId).then(setMembers)
  }, [projectId])

  if (!project) return <p className="muted">加载项目中…</p>

  const stats = [
    { label: '实验记录总数', value: project.recordCount, note: '本周新增 2 条', icon: '✎' },
    { label: '已完成实验', value: 8, note: '完成率 67%', icon: '✓' },
    { label: '进行中实验', value: 3, note: '含 1 条编辑中', icon: '↗' },
    { label: '项目附件', value: attachments.length, note: '项目方案、参考文献、汇总表', icon: '▧' },
  ]

  return (
    <section>
      <div className="detail-header">
        <div>
          <p className="eyebrow">项目管理 / 项目详情</p>
          <h1>
            {project.name} <StatusBadge kind="project" status={project.status} />
          </h1>
          <p className="page-desc">集中展示项目概览、时间线、成员和附件。</p>
          <div className="meta-grid">
            <div className="meta-item">
              <span>项目编号</span>
              <strong>{project.code}</strong>
            </div>
            <div className="meta-item">
              <span>负责人</span>
              <strong>{project.ownerName}</strong>
            </div>
            <div className="meta-item">
              <span>成员</span>
              <strong>{project.memberCount} 人</strong>
            </div>
            <div className="meta-item">
              <span>最近更新</span>
              <strong>{project.updatedAt}</strong>
            </div>
          </div>
        </div>
        <div className="card-actions">
          <button className="secondary-btn" onClick={() => navigate('/projects')}>
            切换项目
          </button>
          <button className="secondary-btn" onClick={() => navigate('/records')}>
            查看实验记录
          </button>
          <button className="primary-btn" onClick={() => navigate('/records/new')}>
            新建实验
          </button>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((s) => (
          <StatCard key={s.label} stat={s} />
        ))}
      </div>

      <div className="split-layout">
        <Surface
          title="概览与最近实验"
          extra={
            <button className="ghost-btn" onClick={() => navigate('/records')}>
              查看实验记录
            </button>
          }
        >
          <p className="muted">
            项目目标：{project.description} 项目标签：{project.tags.join('、')}。
          </p>
          <div className="table-wrap" style={{ marginTop: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>实验名称</th>
                  <th>类型</th>
                  <th>负责人</th>
                  <th>状态</th>
                  <th>更新时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id}>
                    <td>{r.title}</td>
                    <td>{r.experimentType}</td>
                    <td>{r.ownerName}</td>
                    <td>
                      <StatusBadge kind="record" status={r.status} />
                    </td>
                    <td>{r.updatedAt}</td>
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

        <aside className="surface">
          <div className="surface-head">
            <h2>项目附件</h2>
            <button className="secondary-btn">上传附件</button>
          </div>
          <div className="side-list">
            {attachments.map((a) => (
              <div className="side-chip" key={a.id}>
                <span>{a.name}</span>
                <Badge tone="blue">{a.kind}</Badge>
              </div>
            ))}
          </div>
          <h2 style={{ marginTop: 18 }}>最近动态</h2>
          <div className="stack">
            {activities.map((ac) => (
              <div className="list-item" key={ac.id}>
                <div className="list-item-title">
                  <span>{ac.text}</span>
                  <Badge tone="blue">{ac.category}</Badge>
                </div>
                <div className="muted small">{ac.target}</div>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <Surface title="项目时间线" style={{ marginTop: 18 }}>
        <div className="stack">
          {timeline.map((item) => (
            <div className="list-item" key={item.id}>
              <strong>
                {item.date} · {item.title}
              </strong>
              <span className="muted small">{item.summary}</span>
            </div>
          ))}
        </div>
      </Surface>

      <Surface
        title="项目成员"
        extra={<button className="primary-btn">邀请成员</button>}
        style={{ marginTop: 18 }}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>邮箱</th>
                <th>项目角色</th>
                <th>权限摘要</th>
                <th>加入时间</th>
                <th>最近活跃</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user.id}>
                  <td>{m.user.name}</td>
                  <td>{m.user.email}</td>
                  <td>
                    <Badge tone={PROJECT_ROLE_TONES[m.role]}>{PROJECT_ROLE_LABELS[m.role]}</Badge>
                  </td>
                  <td>{m.permissionSummary}</td>
                  <td>{m.joinedAt}</td>
                  <td>{m.lastActiveAt}</td>
                  <td>
                    <button className="link-btn" onClick={() => navigate('/team')}>
                      查看权限
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </section>
  )
}
