import { request } from './client'

export function search(filters) {
  return request('/search', {
    params: {
      keyword: filters.keyword,
      projectId: filters.projectId,
      page: filters.page ?? 0,
      size: filters.size ?? 20,
    },
  }).then((res) =>
    (res?.items ?? res ?? []).map((hit) => ({
      id: hit.entityId,
      entityType: hit.entityType?.toLowerCase(),
      title: hit.title,
      snippet: hit.snippet ?? '',
    })),
  )
}

export function fetchDashboardStats() {
  return request('/dashboard').then((data) => {
    if (!data) return []
    return [
      { label: '我参与的项目', value: data.totalProjects ?? 0, note: '', icon: '\u25A3' },
      { label: '进行中的记录', value: data.inProgressRecords ?? 0, note: '', icon: '\u2197' },
      { label: '待审核记录', value: data.pendingReviewRecords ?? 0, note: '', icon: '!' },
      { label: '实验记录总数', value: data.totalRecords ?? 0, note: '', icon: '\u270E' },
    ]
  })
}

export function fetchTodos() {
  return request('/dashboard').then((data) => {
    if (!data?.pendingTasks) return []
    return data.pendingTasks.map((t, i) => ({
      id: t.id ?? `td-${i}`,
      title: t.recordTitle ?? t.title ?? '',
      badgeText: t.type === 'REVIEW' ? '待审核' : t.type === 'SUPPLEMENT' ? '需补充' : (t.type ?? '待办'),
      description: t.projectName ? `所属项目：${t.projectName}` : (t.description ?? ''),
    }))
  })
}

export function fetchNotifications() {
  return request('/notifications').then((list) =>
    (list ?? []).map((n) => ({
      id: n.id,
      title: n.title,
      badgeText: n.type ?? '通知',
      description: n.description ?? '',
      createdAt: n.createdAt,
    })),
  )
}

export function runAiAssist(feature, text, _projectId) {
  return Promise.resolve({
    feature,
    structuredFields: [
      { label: '输入内容', value: text.slice(0, 100) },
    ],
    completenessScore: 50,
    suggestion: 'AI 功能尚未接入后端，请等待后续开发。',
  })
}
