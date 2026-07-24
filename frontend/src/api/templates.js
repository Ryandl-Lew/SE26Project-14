import { request } from './client'

function mapField(f) {
  let unit = '-'
  try {
    if (f.configJson) {
      const cfg = typeof f.configJson === 'string' ? JSON.parse(f.configJson) : f.configJson
      if (cfg.unit) unit = cfg.unit
    }
  } catch { /* ignore */ }
  return {
    id: f.id,
    name: f.label ?? f.fieldKey ?? f.name,
    type: f.fieldType ?? f.type,
    required: f.required,
    unit,
    searchable: f.searchable ?? false,
  }
}

function mapTemplate(t) {
  const fields = (t.fields ?? (t.fieldCount != null ? new Array(t.fieldCount).fill({}) : [])).map(mapField)
  return {
    id: t.id,
    name: t.name,
    description: t.description ?? '',
    category: t.category ?? 'molecular',
    experimentType: t.experimentType ?? t.category ?? t.name,
    scope: t.builtIn ? 'system' : 'personal',
    usageCount: 0,
    tag: '',
    fields,
  }
}

export function fetchTemplates() {
  return request('/templates').then((list) =>
    (list ?? []).map(mapTemplate),
  )
}

export function fetchTemplate(id) {
  return request(`/templates/${id}`).then((t) => (t ? mapTemplate(t) : undefined))
}

export function createRecordFromTemplate(templateId) {
  return { recordId: `r-new-${templateId}` }
}

export function createTemplate({ name, category, description, fields }) {
  const knownCategories = new Set(['molecular', 'cell', 'protein', 'immunology'])
  return request('/templates', {
    method: 'POST',
    body: JSON.stringify({
      name,
      category: knownCategories.has(category.toLowerCase())
        ? category.toUpperCase()
        : category,
      description,
      fields: (fields ?? []).map((f, i) => ({
        fieldKey: f.fieldKey,
        label: f.label,
        fieldType: f.fieldType,
        required: f.required,
        configJson: f.configJson ?? null,
      })),
    }),
  }).then((t) => mapTemplate(t))
}

export function favoriteTemplate(templateId) {
  return request(`/templates/${templateId}/favorite`, { method: 'POST' })
}

export function unfavoriteTemplate(templateId) {
  return request(`/templates/${templateId}/favorite`, { method: 'DELETE' })
}

export function fetchFavoriteTemplateIds() {
  return request('/templates/favorites').then((list) => list ?? [])
}
