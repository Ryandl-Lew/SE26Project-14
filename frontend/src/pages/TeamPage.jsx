/**
 * 团队管理 Team
 * 按项目管理成员权限：项目概要 + 成员列表 + 角色权限矩阵。
 */
import { useEffect, useState } from 'react'
import { PageHeader, Surface, Badge } from '@/components/ui'
import {
  PROJECT_ROLE_LABELS,
  PROJECT_ROLE_TONES,
  PERMISSION_VALUE_LABELS,
  PERMISSION_VALUE_TONES,
} from '@/domain'
import { fetchPermissionMatrix, fetchTeamMembers } from '@/api'
import { useAppStore } from '@/store/appStore'

/** 权限矩阵列顺序 */
const ROLE_COLUMNS = ['owner', 'member', 'reviewer', 'observer']

export default function TeamPage() {
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const [members, setMembers] = useState([])
  const [matrix, setMatrix] = useState([])

  useEffect(() => {
    fetchTeamMembers(currentProjectId).then(setMembers)
    fetchPermissionMatrix(currentProjectId).then(setMatrix)
  }, [currentProjectId])

  return (
    <section>
      <PageHeader
        eyebrow="团队管理"
        title="按项目管理成员权限"
        description="团队权限围绕具体项目配置成员角色与操作范围。"
        actions={<button className="primary-btn">＋ 邀请成员</button>}
      />

      <Surface title="项目成员列表" extra={<button className="primary-btn">邀请成员</button>}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>邮箱</th>
                <th>项目角色</th>
                <th>权限</th>
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
                    {/* TODO: 接入修改权限（updateMemberRole） */}
                    <button className="link-btn">修改权限</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface
        title="角色权限矩阵"
        extra={<button className="secondary-btn">编辑权限</button>}
        style={{ marginTop: 18 }}
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
