/**
 * 模板中心 Templates（重设计）
 * 分类选项卡 + 模板卡片 + 模板详情预览弹窗。
 */
import { useEffect, useState } from 'react'
import { Plus, X, Hash, Calendar, Type, Image, AlignLeft, Table2 } from 'lucide-react'
import { Badge, Button, PageHeader, Tabs } from '@/components/ui'
import TemplateCard from '@/components/template/TemplateCard'
import { TEMPLATE_CATEGORY_LABELS, TEMPLATE_FIELD_TYPE_LABELS } from '@/domain'
import { fetchTemplates, fetchTemplate } from '@/api'

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
  const [activeTab, setActiveTab] = useState('all')
  const [selected, setSelected] = useState(null)
  const [selectedDetail, setSelectedDetail] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchTemplates().then(setTemplates)
  }, [])

  const handleView = async (template) => {
    setSelected(template)
    setSelectedDetail(null)
    const detail = await fetchTemplate(template.id)
    setSelectedDetail(detail)
  }

  const visible = activeTab === 'all'
    ? templates
    : activeTab === 'mine'
      ? templates.filter((t) => t.scope === 'personal')
      : templates.filter((t) => t.category === activeTab)

  const fields = selectedDetail?.fields ?? selected?.fields ?? []

  return (
    <section>
      <PageHeader
        eyebrow="模板中心"
        title="实验模板"
        description="按实验类型浏览系统模板，并在「我的模板」中维护个人记录结构。"
        actions={<Button icon={Plus} onClick={() => setShowCreate(true)}>新建模板</Button>}
      />

      <Tabs items={CATEGORY_TABS} activeKey={activeTab} onChange={setActiveTab} />

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {visible.map((t) => (
          <TemplateCard key={t.id} template={t} onView={handleView} />
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
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-pop animate-scale-in">
            <div className="flex items-start justify-between">
              <div><h2 className="text-lg font-semibold text-slate-900">新建个人模板</h2><p className="mt-1 text-sm text-slate-500">模板只定义记录结构，不会直接创建实验记录。</p></div>
              <button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="field-label">模板名称</label><input className="input" placeholder="例如：我的 Western blot 记录" /></div>
              <div><label className="field-label">实验类型</label><input className="input" placeholder="例如：PCR" /></div>
              <div><label className="field-label">分类</label><select className="input cursor-pointer"><option>分子生物学</option><option>细胞生物学</option><option>蛋白实验</option><option>免疫实验</option></select></div>
              <div className="sm:col-span-2"><label className="field-label">模板说明</label><textarea className="input min-h-24" placeholder="说明适用场景与记录重点" /></div>
            </div>
            <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">字段编辑器占位：支持文本、数字、日期、单选、图片或文件字段</div>
            <div className="mt-6 flex justify-end gap-2.5"><Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button><Button onClick={() => setShowCreate(false)}>保存模板</Button></div>
          </div>
        </div>
      )}
    </section>
  )
}
