/**
 * 模板中心 Templates（重设计）
 * 分类选项卡 + 模板卡片 + 选中模板的字段结构表。
 */
import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { Badge, Button, PageHeader, Tabs } from '@/components/ui'
import TemplateCard from '@/components/template/TemplateCard'
import { TEMPLATE_CATEGORY_LABELS, TEMPLATE_FIELD_TYPE_LABELS } from '@/domain'
import { fetchTemplates } from '@/api'

const CATEGORY_TABS = Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => ({
  key,
  label,
}))

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [selected, setSelected] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchTemplates().then(setTemplates)
  }, [])

  const visible = activeTab === 'all'
    ? templates
    : activeTab === 'mine'
      ? templates.filter((template) => template.scope === 'personal')
      : templates.filter((template) => template.category === activeTab)

  return (
    <section>
      <PageHeader
        eyebrow="模板中心"
        title="实验模板"
        description="按实验类型浏览系统模板，并在“我的模板”中维护个人记录结构。"
        actions={<Button icon={Plus} onClick={() => setShowCreate(true)}>新建模板</Button>}
      />

      <Tabs items={CATEGORY_TABS} activeKey={activeTab} onChange={setActiveTab} />

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {visible.map((t) => (
          <TemplateCard key={t.id} template={t} onView={setSelected} />
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="max-h-[88vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-pop animate-scale-in">
            <div className="flex items-start justify-between gap-4">
              <div><div className="flex flex-wrap items-center gap-2"><h2 className="text-xl font-semibold text-slate-900">{selected.name}</h2><Badge tone={selected.scope === 'personal' ? 'violet' : 'blue'}>{selected.scope === 'personal' ? '个人模板' : '系统模板'}</Badge></div><p className="mt-1.5 text-sm text-slate-500">{selected.description}</p></div>
              <button type="button" onClick={() => setSelected(null)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">{[['实验类型', selected.experimentType], ['字段数量', `${selected.fields.length} 个`], ['使用次数', `${selected.usageCount} 次`]].map(([label, value]) => <div key={label} className="rounded-lg bg-slate-50 px-4 py-3"><div className="text-xs text-slate-400">{label}</div><div className="mt-1 text-sm font-medium text-slate-900">{value}</div></div>)}</div>
            <div className="mt-6"><h3 className="mb-3 text-sm font-semibold text-slate-900">模板字段</h3>{selected.fields.length > 0 ? <div className="table-wrap"><table className="data-table"><thead><tr><th>字段名称</th><th>类型</th><th>要求</th><th>提示</th></tr></thead><tbody>{selected.fields.map((field) => <tr key={field.id}><td className="font-medium text-slate-900">{field.name}</td><td>{TEMPLATE_FIELD_TYPE_LABELS[field.type]}</td><td>{field.required ? <span className="text-brand-600">必填</span> : '选填'}</td><td className="text-slate-500">{field.unit && field.unit !== '-' ? `单位：${field.unit}` : '无特殊单位'}</td></tr>)}</tbody></table></div> : <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-5 py-10 text-center text-sm text-slate-400">该模板仅包含系统固定字段。</div>}</div>
            <div className="mt-6 flex justify-end"><Button variant="secondary" onClick={() => setSelected(null)}>关闭</Button></div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-pop animate-scale-in"><div className="flex items-start justify-between"><div><h2 className="text-lg font-semibold text-slate-900">新建个人模板</h2><p className="mt-1 text-sm text-slate-500">模板只定义记录结构，不会直接创建实验记录。</p></div><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="sm:col-span-2"><label className="field-label">模板名称</label><input className="input" placeholder="例如：我的 Western blot 记录" /></div><div><label className="field-label">实验类型</label><input className="input" placeholder="例如：PCR" /></div><div><label className="field-label">分类</label><select className="input cursor-pointer"><option>分子生物学</option><option>细胞生物学</option><option>蛋白实验</option><option>免疫实验</option></select></div><div className="sm:col-span-2"><label className="field-label">模板说明</label><textarea className="input min-h-24" placeholder="说明适用场景与记录重点" /></div></div><div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">字段编辑器占位：支持文本、数字、日期、单选、图片或文件字段</div><div className="mt-6 flex justify-end gap-2.5"><Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button><Button onClick={() => setShowCreate(false)}>保存模板</Button></div></div>
        </div>
      )}
    </section>
  )
}
