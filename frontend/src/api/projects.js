import { request } from './client'

function formatInstant(instant) {
  if (!instant) return ''
  const d = new Date(instant)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatFileSize(bytes) {
  if (bytes == null) return '0 B'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function mimeToKind(mimeType) {
  if (!mimeType) return '文件'
  if (mimeType.includes('pdf')) return 'PDF'
  if (mimeType.includes('image')) return '图片'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('gzip')) return '压缩包'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '表格'
  if (mimeType.includes('word') || mimeType.includes('document')) return '文档'
  return '文件'
}

function mapProject(p) {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    description: p.description ?? '',
    status: (p.status ?? 'IN_PROGRESS').toLowerCase(),
    ownerId: p.ownerId ?? '',
    ownerName: p.ownerName ?? '',
    currentUserRole: (p.currentUserRole ?? 'member').toLowerCase(),
    memberCount: p.memberCount ?? 0,
    recordCount: p.recordCount ?? 0,
    tags: [],
    createdAt: formatInstant(p.createdAt),
    updatedAt: formatInstant(p.updatedAt),
  }
}

function mapAttachment(a) {
  return {
    id: a.id,
    name: a.originalName,
    kind: mimeToKind(a.mimeType),
    size: formatFileSize(a.size),
    uploader: a.uploadedBy ?? '',
    uploadedAt: formatInstant(a.createdAt),
  }
}

function mapActivity(a) {
  const text = a.actorName ? `${a.actorName} ${a.action ?? ''}` : (a.action ?? '')
  return {
    id: a.id,
    text: a.summary ? `${text}：${a.summary}` : text,
    target: a.summary ?? '',
    category: a.targetType ?? '',
    createdAt: formatInstant(a.createdAt),
  }
}

function mapTimelineItem(a) {
  const instant = a.createdAt ? new Date(a.createdAt) : null
  const pad = (n) => String(n).padStart(2, '0')
  return {
    id: a.id,
    date: instant ? `${instant.getFullYear()}-${pad(instant.getMonth() + 1)}-${pad(instant.getDate())}` : '',
    time: instant ? `${pad(instant.getHours())}:${pad(instant.getMinutes())}` : '',
    title: a.actorName ? `${a.actorName} ${a.action ?? ''}` : (a.action ?? ''),
    summary: a.summary ?? '',
    category: a.targetType ?? '',
  }
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

export async function fetchProjects(query) {
  const res = await request('/projects', { params: query })
  const items = res?.items ?? res ?? []
  const projects = items.map(mapProject)

  const [memberCounts, recordCounts] = await Promise.all([
    Promise.all(
      projects.map((p) =>
        request(`/projects/${p.id}/members`)
          .then((list) => (list?.length ?? 0))
          .catch(() => 0),
      ),
    ),
    Promise.all(
      projects.map((p) =>
        request('/records', { params: { projectId: p.id, size: 1 } })
          .then((r) => (r?.total ?? 0))
          .catch(() => 0),
      ),
    ),
  ])

  return projects.map((p, i) => ({
    ...p,
    memberCount: memberCounts[i],
    recordCount: recordCounts[i],
  }))
}

export function fetchProject(id) {
  return request(`/projects/${id}`).then((p) => (p ? mapProject(p) : undefined))
}

export function fetchProjectTimeline(projectId) {
  return request(`/projects/${projectId}/activities`).then((list) =>
    (list ?? []).map(mapTimelineItem),
  )
}

export function fetchProjectAttachments(projectId) {
  return request(`/projects/${projectId}/files`).then((list) =>
    (list ?? []).map(mapAttachment),
  )
}

export function fetchProjectActivities(projectId) {
  return request(`/projects/${projectId}/activities`).then((list) =>
    (list ?? []).map(mapActivity),
  )
}

export function fetchProjectMembers(projectId) {
  return request(`/projects/${projectId}/members`).then((list) =>
    (list ?? []).map(mapMember),
  )
}

export function createProject(input) {
  return request('/projects', {
    method: 'POST',
    body: JSON.stringify({ name: input.name, description: input.description }),
  }).then(mapProject)
}

export function archiveProject(id) {
  return request(`/projects/${id}/archive`, { method: 'POST' }).then(mapProject)
}
