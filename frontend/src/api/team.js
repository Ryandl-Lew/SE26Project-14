import { request } from './client'

function formatInstant(instant) {
  if (!instant) return ''
  const d = new Date(instant)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function mapMember(m) {
  return {
    user: {
      id: m.userId,
      name: m.name,
      email: m.email,
      avatarText: m.name?.slice(0, 1) ?? '?',
    },
    role: (m.role ?? 'MEMBER').toLowerCase(),
    permissionSummary: '',
    joinedAt: formatInstant(m.joinedAt),
    lastActiveAt: formatInstant(m.lastActiveAt),
  }
}

export function fetchTeamMembers(projectId) {
  return request(`/projects/${projectId}/members`).then((list) =>
    (list ?? []).map(mapMember),
  )
}

export function fetchPermissionMatrix(_projectId) {
  return request('/permissions').then((list) => list ?? [])
}

export function inviteMember(projectId, userId) {
  return request(`/projects/${projectId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId, role: 'MEMBER' }),
  })
}

export function updateMemberRole(projectId, userId, role) {
  return request(`/projects/${projectId}/members/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify({ role: role.toUpperCase() }),
  })
}
