import { request } from './client'

function formatInstant(instant) {
  if (!instant) return ''
  const d = new Date(instant)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function mapRecordSummary(r) {
  const reviewerList = r.reviewerIds ? r.reviewerIds.split(',').map((id) => id.trim()) : []
  return {
    id: r.id,
    code: r.code,
    title: r.title,
    experimentType: r.experimentType,
    status: (r.status ?? 'DRAFT').toLowerCase(),
    ownerName: r.ownerName ?? '',
    creatorId: r.ownerId,
    assignedReviewerIds: reviewerList,
    assignedReviewerId: reviewerList.length > 0 ? reviewerList[0] : null,
    assignedReviewerName: null,
    revision: r.version != null ? `R${r.version}` : null,
    projectId: r.projectId,
    projectName: '',
    createdAt: formatInstant(r.createdAt),
    updatedAt: formatInstant(r.updatedAt),
    version: r.version,
  }
}

function parseContentJson(contentJson) {
  if (!contentJson) return { sections: [], relations: [], purpose: '', location: '' }
  try {
    return typeof contentJson === 'string' ? JSON.parse(contentJson) : contentJson
  } catch {
    return { sections: [], relations: [], purpose: '', location: '' }
  }
}

export function fetchRecords(projectId, query) {
  const params = { ...query }
  if (projectId) params.projectId = projectId
  return request('/records', { params }).then((res) =>
    (res?.items ?? res ?? []).map(mapRecordSummary),
  )
}

export function fetchRecord(id) {
  return request(`/records/${id}`).then((r) => {
    if (!r) return undefined
    const content = parseContentJson(r.contentJson)
    return {
      ...mapRecordSummary(r),
      experimentDate: r.experimentDate ?? '',
      location: r.location ?? content.location ?? '',
      purpose: content.purpose ?? '',
      sections: content.sections ?? [],
      relations: content.relations ?? [],
      templateFields: content.templateFields ?? {},
    }
  })
}

export function fetchRecordComments(recordId) {
  return request(`/records/${recordId}/comments`).then((list) =>
    (list ?? []).map((c) => ({
      id: c.id,
      authorName: c.authorName ?? '',
      content: c.content ?? '',
      category: c.category ?? '评论',
      createdAt: formatInstant(c.createdAt),
    })),
  )
}

export function saveRecordDraft(input) {
  if (input.id) {
    return request(`/records/${input.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: input.title,
        experimentType: input.experimentType,
        experimentDate: input.experimentDate,
        location: input.location ?? '',
        content: JSON.stringify({
          purpose: input.purpose ?? '',
          sections: input.sections ?? [],
          relations: input.relations ?? [],
          templateFields: input.templateFields ?? {},
        }),
        changeReason: '保存草稿',
      }),
    }).then(mapRecordSummary)
  }
  return request('/records', {
    method: 'POST',
    body: JSON.stringify({
      projectId: input.projectId,
      templateId: input.templateId,
      title: input.title,
      experimentType: input.experimentType,
      experimentDate: input.experimentDate,
      location: input.location ?? '',
    }),
  }).then(mapRecordSummary)
}

export function submitRecordForReview(id, reviewerIds) {
  return request(`/records/${id}/submit`, {
    method: 'POST',
    body: JSON.stringify({
      changeReason: '提交审核',
      reviewerIds: reviewerIds ?? [],
    }),
  })
}

export function approveRecord(id) {
  return request(`/records/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({ decision: 'APPROVE' }),
  })
}

export function rejectRecord(id, reason) {
  return request(`/records/${id}/review`, {
    method: 'POST',
    body: JSON.stringify({
      decision: 'REJECT',
      reason: reason ?? '需要修改',
    }),
  })
}

export function fetchRecordAttachments(recordId) {
  return request(`/records/${recordId}/attachments`).then((list) =>
    (list ?? []).map((a) => ({
      id: a.id,
      name: a.originalName,
      kind: a.mimeType ?? '',
      size: a.size ?? 0,
      uploader: a.uploadedBy ?? '',
      uploadedAt: a.createdAt,
    })),
  )
}
