/**
 * 模板中心 Templates（重设计）
 * 分类选项卡 + 模板卡片 + 模板详情预览弹窗。
 */
import { useEffect, useState, useCallback } from 'react'
import { Plus, X, Hash, Calendar, Type, Image, AlignLeft, Table2, GripVertical, Trash2 } from 'lucide-react'
import { Badge, Button, PageHeader, Tabs } from '@/components/ui'
import TemplateCard from '@/components/template/TemplateCard'
import { TEMPLATE_CATEGORY_LABELS, TEMPLATE_FIELD_TYPE_LABELS } from '@/domain'
import {
  fetchTemplates,
  fetchTemplate,
  fetchFavoriteTemplateIds,
  favoriteTemplate,
  unfavoriteTemplate,
  createTemplate,
} from '@/api'

const CATEGORY_TABS = Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => ({ key, label }))

const FIELD_TYPE_ICONS = {
  text: Type,
  number: Hash,
  date: Calendar,
  textarea: AlignLeft,
  table: Table2,
  image: Image,
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [activeTab, setActiveTab] = useState('all')
  const [selected, setSelected] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ name: '', category: 'molecular', description: '', customCategory: '' })
  const [createFields, setCreateFields] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    fetchTemplates()
      .then((tmpls) => setTemplates(tmpls ?? []))
      .catch(() => setTemplates([]))
    fetchFavoriteTemplateIds()
      .then((favIds) => setFavoriteIds(new Set(favIds ?? [])))
      .catch(() => setFavoriteIds(new Set()))
  }, [])

  const handleToggleFavorite = useCallback(async (templateId) => {
    const isFav = favoriteIds.has(templateId)
    try {
      if (isFav) {
        await unfavoriteTemplate(templateId)
        setFavoriteIds((prev) => { const next = new Set(prev); next.delete(templateId); return next })
      } else {
        await favoriteTemplate(templateId)
        setFavoriteIds((prev) => { const next = new Set(prev); next.add(templateId); return next })
      }
    } catch { /* ignore */ }
  }, [favoriteIds])

  const handleOpenCreate = () => {
    setCreateForm({ name: '', category: 'molecular', description: '', customCategory: '' })
    setCreateFields([])
    setSaveError('')
    setShowCreate(true)
  }

  const addField = () => {
    setCreateFields((prev) => [
      ...prev,
      { fieldKey: '', label: '', fieldType: 'text', required: false, configJson: null },
    ])
  }

  const removeField = (index) => {
    setCreateFields((prev) => prev.filter((_, i) => i !== index))
  }

  const updateField = (index, patch) => {
    setCreateFields((prev) => prev.map((f, i) => (i === index ? { ...f, ...patch } : f)))
  }

  const handleSaveTemplate = async () => {
    if (!createForm.name.trim()) { setSaveError('请输入模板名称'); return }
    const categoryValue = createForm.category === 'other' ? createForm.customCategory : createForm.category
    if (!categoryValue || !categoryValue.trim()) { setSaveError('请选择或输入分类'); return }
    const invalidField = createFields.find((f) => !f.fieldKey.trim() || !f.label.trim())
    if (invalidField) { setSaveError('请填写所有字段的键和标签'); return }
    setSaving(true)
    setSaveError('')
    try {
      const created = await createTemplate({
        name: createForm.name.trim(),
        category: categoryValue.trim(),
        description: createForm.description.trim(),
        fields: createFields,
      })
      setTemplates((prev) => [...prev, created])
      setShowCreate(false)
    } catch (err) {
      setSaveError(err?.message ?? '创建失败，请稍后重试')
    } finally {
      setSaving(false)
    }
  }

  const handleView = async (template) => {
    setSelected(template)
    setSelectedDetail(null)
    const detail = await fetchTemplate(template.id)
    setSelectedDetail(detail)
  }

  const visible = activeTab === 'all'
    ? templates
    : activeTab === 'mine'
      ? templates.filter((t) => t.scope === 'personal' || favoriteIds.has(t.id))
      : templates.filter((t) => t.category === activeTab)

  const fields = selectedDetail?.fields ?? selected?.fields ?? []

  return (
    <section>
      <PageHeader
        eyebrow="模板中心"
        title="实验模板"
        description="按实验类型浏览系统模板，并在「我的模板」中维护个人记录结构。"
        actions={<Button icon={Plus} onClick={handleOpenCreate}>新建模板</Button>}
      />

      <Tabs items={CATEGORY_TABS} activeKey={activeTab} onChange={setActiveTab} />

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {visible.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            onView={handleView}
            isFavorited={favoriteIds.has(t.id)}
            onToggleFavorite={handleToggleFavorite}
          />
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-pop animate-scale-in">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-900">{selected.name}</h2>
                  <Badge tone={selected.scope === 'personal' ? 'violet' : 'blue'}>
                    {selected.scope === 'personal' ? '个人模板' : '系统模板'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{selected.description}</p>
              </div>
              <button type="button" onClick={() => { setSelected(null); setSelectedDetail(null) }} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>

            <div className="px-6 py-5">
              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['实验类型', selected.experimentType],
                  ['字段数量', `${fields.length} 个`],
                  ['使用次数', `${selected.usageCount} 次`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 px-4 py-3">
                    <div className="text-xs text-slate-400">{label}</div>
                    <div className="mt-1 text-sm font-medium text-slate-900">{value}</div>
                  </div>
                ))}
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold text-slate-900">字段预览</h3>
                {fields.length > 0 ? (
                  <div className="space-y-3">
                    {fields.map((field, i) => {
                      const Icon = FIELD_TYPE_ICONS[field.type] ?? Type
                      return (
                        <div key={field.id ?? i} className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-brand-200">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${field.required ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Icon size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm font-semibold text-slate-900">
                                {field.name}
                                {field.required && <span className="ml-1 text-brand-600">*</span>}
                              </span>
                              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${field.required ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                                {field.required ? '必填' : '选填'}
                              </span>
                            </div>
                            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                              <span className="inline-flex items-center gap-1">
                                  类型：<span className="font-medium text-slate-600">{TEMPLATE_FIELD_TYPE_LABELS[field.type] ?? field.type}</span>
                              </span>
                              {field.unit && field.unit !== '-' && (
                                <span className="inline-flex items-center gap-1">
                                  单位：<span className="font-medium text-slate-600">{field.unit}</span>
                                </span>
                              )}
                            </div>
                            <div className="mt-2.5">
                              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs">
                                {field.type === 'textarea' && (
                                  <div className="h-16 rounded border border-dashed border-slate-300 bg-white" />
                                )}
                                {field.type === 'text' && (
                                  <input className="w-full bg-transparent text-xs text-slate-400 outline-none" disabled placeholder={`输入${field.name}…`} />
                                )}
                                {field.type === 'number' && (
                                  <input className="w-24 bg-transparent text-xs text-slate-400 outline-none" disabled placeholder={field.unit !== '-' ? `单位：${field.unit}` : '0'} />
                                )}
                                {field.type === 'date' && (
                                  <input type="date" className="bg-transparent text-xs text-slate-400 outline-none" disabled />
                                )}
                                {field.type === 'table' && (
                                  <div className="rounded border border-dashed border-slate-300 bg-white px-2 py-1.5 text-[11px] text-slate-400">表格字段 — 可在编辑器中添加行</div>
                                )}
                                {!['textarea', 'text', 'number', 'date', 'table'].includes(field.type) && (
                                  <span className="text-slate-400">{field.type} 类型字段</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-400">
                    {selectedDetail ? '该模板暂无字段定义' : '加载中…'}
                  </div>
                )}
              </div>
            </div>

            <div className="sticky bottom-0 flex justify-end border-t border-slate-100 bg-white px-6 py-4">
              <Button variant="secondary" onClick={() => { setSelected(null); setSelectedDetail(null) }}>关闭</Button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[88vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-pop animate-scale-in">
            <div className="sticky top-0 z-10 border-b border-slate-100 bg-white px-6 py-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">新建个人模板</h2>
                  <p className="mt-1 text-sm text-slate-500">模板只定义记录结构，不会直接创建实验记录。</p>
                </div>
                <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
              </div>
            </div>

            <div className="px-6 py-5 space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="field-label">模板名称 <span className="text-red-400">*</span></label>
                  <input className="input" placeholder="例如：我的 Western blot 记录" value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div>
                  <label className="field-label">分类 <span className="text-red-400">*</span></label>
                  <select className="input cursor-pointer" value={createForm.category} onChange={(e) => setCreateForm((f) => ({ ...f, category: e.target.value }))}>
                    <option value="molecular">{TEMPLATE_CATEGORY_LABELS.molecular}</option>
                    <option value="cell">{TEMPLATE_CATEGORY_LABELS.cell}</option>
                    <option value="protein">{TEMPLATE_CATEGORY_LABELS.protein}</option>
                    <option value="immunology">{TEMPLATE_CATEGORY_LABELS.immunology}</option>
                    <option value="other">其他</option>
                  </select>
                  {createForm.category === 'other' && (
                    <input
                      className="input mt-2"
                      placeholder="输入自定义分类…"
                      value={createForm.customCategory ?? ''}
                      onChange={(e) => setCreateForm((f) => ({ ...f, customCategory: e.target.value }))}
                    />
                  )}
                </div>
                <div className="sm:col-span-2">
                  <label className="field-label">模板说明</label>
                  <textarea className="input min-h-20" placeholder="说明适用场景与记录重点" value={createForm.description} onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="field-label">模板字段</label>
                  <button type="button" onClick={addField} className="text-xs font-medium text-brand-600 hover:text-brand-700">+ 添加字段</button>
                </div>

                {createFields.length === 0 ? (
                  <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-400">
                    暂无字段 — 点击「添加字段」来定义模板中的输入项
                  </div>
                ) : (
                  <div className="mt-3 space-y-3">
                    {createFields.map((field, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <GripVertical size={14} className="text-slate-300 shrink-0" />
                          <span className="text-xs font-medium text-slate-400">字段 {i + 1}</span>
                          <div className="flex-1" />
                          <button type="button" onClick={() => removeField(i)} className="rounded p-1 text-slate-400 hover:text-red-500 hover:bg-red-50">
                            <Trash2 size={14} />
                          </button>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-3">
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">键 (key)</label>
                            <input className="input h-9 text-sm" placeholder="如 purpose" value={field.fieldKey} onChange={(e) => updateField(i, { fieldKey: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">标签</label>
                            <input className="input h-9 text-sm" placeholder="如 实验目的" value={field.label} onChange={(e) => updateField(i, { label: e.target.value })} />
                          </div>
                          <div>
                            <label className="text-[11px] font-medium text-slate-500 mb-1 block">类型</label>
                            <select className="input h-9 cursor-pointer text-sm" value={field.fieldType} onChange={(e) => updateField(i, { fieldType: e.target.value })}>
                              {Object.entries(TEMPLATE_FIELD_TYPE_LABELS).filter(([k]) => k !== 'sample_picker' && k !== 'reagent_picker').map(([key, label]) => (
                                <option key={key} value={key}>{label}</option>
                              ))}
                              <option value="image">图片上传</option>
                              <option value="table">表格</option>
                            </select>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center gap-4">
                          <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                            <input type="checkbox" className="rounded" checked={field.required} onChange={(e) => updateField(i, { required: e.target.checked })} />
                            <span className="text-slate-600">必填</span>
                          </label>
                          {field.fieldType === 'number' && (
                            <div className="flex items-center gap-1.5">
                              <label className="text-[11px] text-slate-400">单位</label>
                              <input className="input h-8 w-20 text-sm" placeholder="如 ℃" value={field.configJson ? (() => { try { return JSON.parse(field.configJson).unit ?? '' } catch { return '' } })() : ''} onChange={(e) => updateField(i, { configJson: JSON.stringify({ unit: e.target.value }) })} />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {saveError && <p className="text-sm text-red-500">{saveError}</p>}
            </div>

            <div className="sticky bottom-0 flex justify-end gap-2.5 border-t border-slate-100 bg-white px-6 py-4">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
              <Button loading={saving} onClick={handleSaveTemplate}>保存模板</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
