/**
 * 成员权限 Team
 * 始终显示当前项目上下文；说明负责人 / 编辑者 / 审核者 / 只读成员的差异，
 * 并提供成员列表与角色权限矩阵。角色调整与邀请走现有 API（mock 原型）。
 */
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FolderOpen, UserPlus, ShieldCheck } from 'lucide-react'
import { PageHeader, Surface, Badge, Icon, useToast } from '@/components/ui'
import {
  PROJECT_ROLE_LABELS,
  PROJECT_ROLE_TONES,
  PERMISSION_VALUE_LABELS,
  PERMISSION_VALUE_TONES,
} from '@/domain'
import { fetchPermissionMatrix, fetchTeamMembers, inviteMember, updateMemberRole } from '@/api'
import { useAppStore } from '@/store/appStore'
import './team.css'

/** 权限矩阵列顺序 */
const ROLE_COLUMNS = ['owner', 'member', 'reviewer', 'observer']

/** 角色一句话说明 */
const ROLE_DESCRIPTIONS = {
  owner: '管理项目信息、成员与全部记录',
  member: '创建并编辑自己的实验记录',
  reviewer: '评论并审核实验记录',
  observer: '只读查看项目与记录',
}

export default function TeamPage() {
  const toast = useToast()
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const projects = useAppStore((s) => s.projects)
  const currentProject = projects.find((p) => p.id === currentProjectId)

  const [members, setMembers] = useState([])
  const [matrix, setMatrix] = useState([])
  const [inviting, setInviting] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')

  useEffect(() => {
    fetchTeamMembers(currentProjectId).then(setMembers)
    fetchPermissionMatrix(currentProjectId).then(setMatrix)
  }, [currentProjectId])

  const handleInvite = async (e) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    await inviteMember(currentProjectId, inviteEmail.trim())
    toast(`已向 ${inviteEmail.trim()} 发出邀请（原型）`)
    setInviteEmail('')
    setInviting(false)
  }

  const handleRoleChange = async (member, role) => {
    await updateMemberRole(currentProjectId, member.user.id, role)
    setMembers((list) =>
      list.map((m) => (m.user.id === member.user.id ? { ...m, role } : m)),
    )
    toast(`已将 ${member.user.name} 的角色调整为「${PROJECT_ROLE_LABELS[role]}」（原型）`)
  }

  return (
    <section>
      <PageHeader
        eyebrow="成员权限"
        title="成员与权限"
        description="成员权限始终围绕具体项目配置。切换项目请使用顶部栏的项目切换器。"
        actions={
          <>
            {currentProject && (
              <Link className="context-chip" to={`/projects/${currentProject.id}`}>
                <Icon name={FolderOpen} size={13} />
                {currentProject.name}
              </Link>
            )}
            <button className="primary-btn" onClick={() => setInviting((v) => !v)}>
              <Icon name={UserPlus} size={15} />
              邀请成员
            </button>
          </>
        }
      />

      {inviting && (
        <Surface title="邀请成员" style={{ marginBottom: 16 }}>
          <form className="invite-form" onSubmit={handleInvite}>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="输入成员邮箱，如 zhang@example.com"
              aria-label="邀请邮箱"
              required
              autoFocus
            />
            <button className="primary-btn" type="submit">
              发送邀请
            </button>
          </form>
        </Surface>
      )}

      <div className="role-legend">
        {ROLE_COLUMNS.map((role) => (
          <div className="role-legend-item" key={role}>
            <Badge tone={PROJECT_ROLE_TONES[role]}>{PROJECT_ROLE_LABELS[role]}</Badge>
            <span className="muted small">{ROLE_DESCRIPTIONS[role]}</span>
          </div>
        ))}
      </div>

      <Surface title={`项目成员（${members.length}）`}>
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
                <th>调整角色</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user.id}>
                  <td>{m.user.name}</td>
                  <td className="muted">{m.user.email}</td>
                  <td>
                    <Badge tone={PROJECT_ROLE_TONES[m.role]}>{PROJECT_ROLE_LABELS[m.role]}</Badge>
                  </td>
                  <td className="muted">{m.permissionSummary}</td>
                  <td className="muted">{m.joinedAt}</td>
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
      </Surface>

      <Surface
        title={
          <>
            <Icon name={ShieldCheck} size={15} style={{ verticalAlign: '-2px' }} /> 角色权限矩阵
          </>
        }
        style={{ marginTop: 16 }}
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>权限项</th>
                {ROLE_COLUMNS.map((role) => (
                  <th key={role}>{PROJECT_ROLE_LABELS[role]}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.permission}>
                  <td>{row.permission}</td>
                  {ROLE_COLUMNS.map((role) => {
                    const v = row.values[role]
                    return (
                      <td key={role}>
                        <Badge tone={PERMISSION_VALUE_TONES[v]}>{PERMISSION_VALUE_LABELS[v]}</Badge>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
    </section>
  )
}
