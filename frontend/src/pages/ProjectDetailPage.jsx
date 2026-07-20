/**
 * 项目详情 ProjectDetail
 * 项目页头（身份 + 状态 + 主操作）+ 标签页分区：
 * 概览 / 实验记录 / 项目文件 / 成员权限 / 动态与修改历史。
 * 进入本页会将该项目同步为全局「当前项目」。
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Plus,
  Upload,
  UserPlus,
  FileText,
  Image,
  Archive,
  FileSpreadsheet,
  Paperclip,
} from 'lucide-react'
import {
  PageHeader,
  StatusBadge,
  Surface,
  Badge,
  Tabs,
  EmptyState,
  Icon,
  useToast,
} from '@/components/ui'
import { PROJECT_ROLE_LABELS, PROJECT_ROLE_TONES } from '@/domain'
import {
  archiveProject,
  fetchProject,
  fetchProjectActivities,
  fetchProjectAttachments,
  fetchProjectMembers,
  fetchProjectTimeline,
  fetchRecords,
  inviteMember,
  updateMemberRole,
} from '@/api'
import { useAppStore } from '@/store/appStore'
import './project-detail.css'

const KIND_ICONS = {
  pdf: FileText,
  image: Image,
  zip: Archive,
  excel: FileSpreadsheet,
}

const TABS = [
  { key: 'overview', label: '概览' },
  { key: 'records', label: '实验记录' },
  { key: 'files', label: '项目文件' },
  { key: 'members', label: '成员权限' },
  { key: 'activity', label: '动态与历史' },
]

export default function ProjectDetailPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const setCurrentProject = useAppStore((s) => s.setCurrentProject)

  const [project, setProject] = useState(null)
  const [records, setRecords] = useState([])
  const [attachments, setAttachments] = useState([])
  const [activities, setActivities] = useState([])
  const [timeline, setTimeline] = useState([])
  const [members, setMembers] = useState([])
  const [tab, setTab] = useState('overview')
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    if (!projectId) return
    // 进入项目即同步全局当前项目上下文
    setCurrentProject(projectId)
    setProject(null)
    fetchProject(projectId).then((p) => setProject(p ?? null))
    fetchRecords(projectId).then(setRecords)
    fetchProjectAttachments(projectId).then(setAttachments)
    fetchProjectActivities(projectId).then(setActivities)
    fetchProjectTimeline(projectId).then(setTimeline)
    fetchProjectMembers(projectId).then(setMembers)
  }, [projectId, setCurrentProject])

  if (!project) {
    return (
      <div className="loading-line">
        <span className="spinner" />
        加载项目中…
      </div>
    )
  }

  const handleArchive = async () => {
    await archiveProject(project.id)
    toast('归档操作已提交（原型阶段不会真正归档）')
  }

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    await inviteMember(project.id, inviteEmail.trim())
    setInviteEmail('')
    setInviting(false)
    toast(`已向 ${inviteEmail.trim()} 发出邀请（原型）`)
  }

  const handleRoleChange = async (member, role) => {
    await updateMemberRole(project.id, member.user.id, role)
    setMembers((list) =>
      list.map((m) => (m.user.id === member.user.id ? { ...m, role } : m)),
    )
    toast(`已将 ${member.user.name} 的角色调整为「${PROJECT_ROLE_LABELS[role]}」（原型）`)
  }

  return (
    <section>
      <PageHeader
        breadcrumb={[
          { label: '项目', to: '/projects' },
          { label: project.name },
        ]}
        title={
          <>
            {project.name}
            <StatusBadge kind="project" status={project.status} />
          </>
        }
        description={project.description}
        actions={
          <>
            <button className="secondary-btn" onClick={handleArchive}>
              归档项目
            </button>
            <button className="primary-btn" onClick={() => navigate('/records/new')}>
              <Icon name={Plus} size={15} />
              新建实验
            </button>
          </>
        }
      />

      <div className="project-meta-bar">
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
          <span>实验记录</span>
          <strong>{project.recordCount} 条</strong>
        </div>
        <div className="meta-item">
          <span>最近更新</span>
          <strong>{project.updatedAt}</strong>
        </div>
        <div className="meta-item">
          <span>整体进度</span>
          <div className="progress" style={{ marginTop: 6 }} aria-label={`进度 ${project.progress}%`}>
            <span style={{ width: `${project.progress}%` }} />
          </div>
        </div>
      </div>

      <Tabs items={TABS} activeKey={tab} onChange={setTab} ariaLabel="项目分区" />

      {tab === 'overview' && (
        <div className="stack">
          <Surface title="项目目标">
            <p className="muted" style={{ marginBottom: 10 }}>
              {project.description}
            </p>
            <div className="card-actions">
              {project.tags.map((tag) => (
                <Badge key={tag} tone="gray">
                  {tag}
                </Badge>
              ))}
            </div>
          </Surface>
          <Surface
            title="最近实验记录"
            extra={
              <button className="ghost-btn" onClick={() => setTab('records')}>
                全部记录
              </button>
            }
          >
            {records.slice(0, 3).map((r) => (
              <div className="list-item" key={r.id} style={{ marginBottom: 8 }}>
                <div className="list-item-title">
                  <Link className="table-link" to={`/records/${r.id}`}>
                    {r.title}
                  </Link>
                  <StatusBadge kind="record" status={r.status} />
                </div>
                <div className="muted small">
                  {r.experimentType} · {r.ownerName} · {r.updatedAt}
                </div>
              </div>
            ))}
            {!records.length && (
              <EmptyState
                title="还没有实验记录"
                description="点击右上角「新建实验」创建本项目的第一条记录。"
              />
            )}
          </Surface>
        </div>
      )}

      {tab === 'records' && (
        <Surface
          title={`实验记录（${records.length}）`}
          extra={
            <button className="primary-btn" onClick={() => navigate('/records/new')}>
              <Icon name={Plus} size={14} />
              新建实验
            </button>
          }
        >
          {records.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>实验名称</th>
                    <th>编号</th>
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
                      <td>
                        <Link className="table-link" to={`/records/${r.id}`}>
                          {r.title}
                        </Link>
                      </td>
                      <td className="muted">{r.code}</td>
                      <td>{r.experimentType}</td>
                      <td>{r.ownerName}</td>
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
            <EmptyState
              title="本项目暂无实验记录"
              description="通过「新建实验」开始记录，或从模板快速创建。"
              action={
                <button className="primary-btn" onClick={() => navigate('/records/new')}>
                  新建实验
                </button>
              }
            />
          )}
        </Surface>
      )}

      {tab === 'files' && (
        <Surface
          title={`项目文件（${attachments.length}）`}
          extra={
            <button
              className="secondary-btn"
              onClick={() => toast('原型阶段暂未接入文件上传')}
            >
              <Icon name={Upload} size={14} />
              上传附件
            </button>
          }
        >
          {attachments.length ? (
            <div className="stack">
              {attachments.map((a) => (
                <div className="side-chip" key={a.id}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Icon name={KIND_ICONS[a.kind] ?? Paperclip} size={15} />
                    {a.name}
                  </span>
                  <Badge tone="blue">{a.kind}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无项目文件" description="上传的方案、文献和数据表会集中在这里。" />
          )}
        </Surface>
      )}

      {tab === 'members' && (
        <Surface
          title={`项目成员（${members.length}）`}
          extra={
            <button className="primary-btn" onClick={() => setInviting((v) => !v)}>
              <Icon name={UserPlus} size={14} />
              邀请成员
            </button>
          }
        >
          {inviting && (
            <form className="invite-form" onSubmit={handleInvite}>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="输入成员邮箱，如 zhang@example.com"
                aria-label="邀请邮箱"
                required
              />
              <button className="primary-btn" type="submit">
                发送邀请
              </button>
            </form>
          )}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>姓名</th>
                  <th>邮箱</th>
                  <th>项目角色</th>
                  <th>权限摘要</th>
                  <th>最近活跃</th>
                  <th>调整角色</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.user.id}>
                    <td>{m.user.name}</td>
                    <td className="muted">{m.user.email}</td>
                    <td>
                      <Badge tone={PROJECT_ROLE_TONES[m.role]}>
                        {PROJECT_ROLE_LABELS[m.role]}
                      </Badge>
                    </td>
                    <td className="muted">{m.permissionSummary}</td>
                    <td className="muted">{m.lastActiveAt}</td>
                    <td>
                      <select
                        className="role-select"
                        value={m.role}
                        aria-label={`调整 ${m.user.name} 的角色`}
                        disabled={m.role === 'owner'}
                        onChange={(e) => handleRoleChange(m, e.target.value)}
                      >
                        {Object.entries(PROJECT_ROLE_LABELS).map(([key, label]) => (
                          <option key={key} value={key}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small" style={{ margin: '10px 0 0' }}>
            角色决定成员在项目内的操作范围，完整说明见
            <Link to="/team" style={{ color: 'var(--brand)', fontWeight: 600 }}>
              成员权限
            </Link>
            页的权限矩阵。
          </p>
        </Surface>
      )}

      {tab === 'activity' && (
        <div className="stack">
          <Surface title="最近动态">
            <div className="stack">
              {activities.map((ac) => (
                <div className="list-item" key={ac.id}>
                  <div className="list-item-title">
                    <span>{ac.text}</span>
                    <Badge tone="blue">{ac.category}</Badge>
                  </div>
                  <div className="muted small">
                    {ac.target} · {ac.createdAt}
                  </div>
                </div>
              ))}
            </div>
          </Surface>
          <Surface title="项目时间线">
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
        </div>
      )}
    </section>
  )
}
