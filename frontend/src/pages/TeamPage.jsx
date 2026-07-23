/**
 * 团队管理 Team（重设计）
 * 按项目管理成员权限：成员列表 + 角色权限矩阵。
 */
import { useEffect, useState } from 'react'
import { UserPlus, Pencil } from 'lucide-react'
import { Button, PageHeader, Surface, Badge } from '@/components/ui'
import {
  PROJECT_ROLE_LABELS,
  PROJECT_ROLE_TONES,
  PERMISSION_VALUE_LABELS,
  PERMISSION_VALUE_TONES,
} from '@/domain'
import { fetchPermissionMatrix, fetchTeamMembers, fetchProjects } from '@/api'

/** 权限矩阵列顺序 */
const ROLE_COLUMNS = ['owner', 'member', 'reviewer', 'observer']

export default function TeamPage() {
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [members, setMembers] = useState([])
  const [matrix, setMatrix] = useState([])

  useEffect(() => {
    fetchProjects().then(setProjects)
  }, [])

  useEffect(() => {
    if (!projectId) {
      setMembers([])
      setMatrix([])
      return
    }
    fetchTeamMembers(projectId).then(setMembers)
    fetchPermissionMatrix(projectId).then(setMatrix)
  }, [projectId])

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="团队管理"
        title="按项目管理成员权限"
        description="团队权限围绕具体项目配置成员角色与操作范围。"
        actions={<Button icon={UserPlus}>邀请成员</Button>}
      />

      <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-3 shadow-card">
        <label className="text-sm font-medium text-slate-600">选择项目：</label>
        <select
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          className="input h-9 w-64 cursor-pointer"
        >
          <option value="">— 选择一个项目 —</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        {projectId && (
          <span className="ml-auto text-xs text-slate-400">{members.length} 名成员</span>
        )}
      </div>

      {!projectId ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <p className="text-sm">请先选择一个项目查看成员与权限</p>
        </div>
      ) : (
      <> 
      <Surface title={`项目成员列表 · ${members.length} 人`}>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>成员</th>
                <th>项目角色</th>
                <th>权限摘要</th>
                <th>加入时间</th>
                <th>最近活跃</th>
                <th className="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.user.id}>
                  <td>
                    <span className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-500 text-xs font-bold text-white">
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
                  <td className="text-right">
                    {/* TODO: 接入修改权限（updateMemberRole） */}
                    <Button variant="ghost" size="sm" icon={Pencil}>
                      修改权限
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>

      <Surface
        title="角色权限矩阵"
        extra={
          <Button variant="secondary" size="sm" icon={Pencil}>
            编辑权限
          </Button>
        }
      >
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>权限项</th>
                {ROLE_COLUMNS.map((role) => (
                  <th key={role} className="text-center">
                    {PROJECT_ROLE_LABELS[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.permission}>
                  <td className="font-medium text-slate-900">{row.permission}</td>
                  {ROLE_COLUMNS.map((role) => {
                    const v = row.values[role]
                    return (
                      <td key={role} className="text-center">
                        <Badge tone={PERMISSION_VALUE_TONES[v]}>
                          {PERMISSION_VALUE_LABELS[v]}
                        </Badge>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Surface>
      </>
      )}
    </section>
  )
}
