/**
 * 新建 / 编辑实验记录 RecordEditor（重设计）
 * 纸面画布式编辑器：左侧大纲 + 中央文档 + 右侧属性。
 * 注意：本阶段仅搭建结构与占位表单，不实现富文本编辑器能力。
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Send,
  FileDown,
  Copy,
  Heading2,
  Bold,
  Italic,
  List,
  Table,
  Sigma,
  Code,
  Image,
  Link2,
  CheckCircle2,
  Paperclip,
  X,
} from 'lucide-react'
import { Button, Surface, Badge } from '@/components/ui'
import { fetchRecord } from '@/api'
import { fetchProjects, fetchTemplates } from '@/api'
import { StatusBadge } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

/** 编辑器左侧目录锚点 */
const OUTLINE = [
  '基础信息',
  '实验目的',
  '材料与试剂',
  '实验步骤',
  '实验参数',
  '实验结果',
  '结论与讨论',
  '附件',
  '修改历史',
]

/** 编辑工具栏占位按钮 */
const TOOLBAR = [Heading2, Bold, Italic, List, Table, Sigma, Code, Image, Link2]

function LegacyRecordEditorPage() {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const isNew = !recordId
  const [record, setRecord] = useState(null)
  const [activeOutline, setActiveOutline] = useState('基础信息')
  const [projects, setProjects] = useState([])
  const [templates, setTemplates] = useState([])
  const [createMode, setCreateMode] = useState('blank')
  const [templateId, setTemplateId] = useState('')

  useEffect(() => {
    if (recordId) fetchRecord(recordId).then(setRecord)
    fetchProjects().then(setProjects)
    fetchTemplates().then(setTemplates)
  }, [recordId])

  return (
    <section className="space-y-5">
      {/* 顶部操作条 */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            aria-label="返回"
            className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              {isNew ? '新建实验记录' : '编辑实验记录'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {isNew ? '选择空白结构或模板，填写完整基本字段后创建记录' : `实验编号 ${record?.code ?? ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* 保存状态提示 */}
          <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:inline-flex">
            <CheckCircle2 size={13} className="text-emerald-500" />
            {isNew ? '尚未保存' : '内容已自动保存 · 14:32'}
          </span>
          {/* TODO: 接入保存草稿 / 提交审核（saveRecordDraft / submitRecordForReview） */}
          <Button variant="secondary" icon={Save}>
            保存
          </Button>
          <Button icon={Send}>提交审核</Button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[200px,minmax(0,1fr),300px]">
        {/* 目录大纲 */}
        <div className="max-xl:hidden xl:sticky xl:top-24">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            目录
          </p>
          <div className="space-y-0.5">
            {OUTLINE.map((item) => {
              const active = item === activeOutline
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setActiveOutline(item)}
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'bg-brand-50 font-medium text-brand-700'
                      : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item}
                </button>
              )
            })}
          </div>
        </div>

        {/* 中央文档画布 */}
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-card">
          {/* TODO: 编辑工具栏为占位按钮，后续接入富文本能力 */}
          <div
            aria-label="编辑工具栏"
            className="sticky top-16 z-10 flex flex-wrap gap-0.5 rounded-t-xl border-b border-slate-100 bg-white/95 px-4 py-2.5 backdrop-blur"
          >
            {TOOLBAR.map((Icon, i) => (
              <button
                key={i}
                type="button"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
              >
                <Icon size={15} />
              </button>
            ))}
          </div>

          <div className="px-7 py-6 lg:px-10">
            {/* 大标题输入 */}
            <input
              className="w-full border-0 bg-transparent text-2xl font-bold tracking-tight text-slate-900 outline-none placeholder:text-slate-300"
              defaultValue={record?.title ?? ''}
              placeholder="未命名实验记录"
              aria-label="实验标题"
            />

            {/* 基础信息 */}
            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">实验类型</label>
                <select
                  className="input h-10 cursor-pointer"
                  defaultValue={record?.experimentType ?? 'PCR'}
                >
                  <option>PCR</option>
                  <option>qPCR</option>
                  <option>Western blot</option>
                </select>
              </div>
              <div>
                <label className="field-label">所属项目</label>
                {isNew ? (
                  <select className="input h-10 cursor-pointer" defaultValue="p-001">
                    {projects.filter((project) => project.status === 'active' && project.currentUserRole !== 'reviewer').map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                  </select>
                ) : <input className="input h-10" defaultValue={record?.projectName ?? ''} disabled />}
              </div>
              <div>
                <label className="field-label">实验日期</label>
                <input
                  type="date"
                  className="input h-10"
                  defaultValue={record?.experimentDate ?? '2026-07-09'}
                />
              </div>
              <div>
                <label className="field-label">记录创建者</label>
                <input className="input h-10" defaultValue={record?.ownerName ?? '李同学'} disabled />
              </div>
              <div className="sm:col-span-2">
                <label className="field-label">实验地点</label>
                <input
                  className="input h-10"
                  defaultValue={record?.location ?? ''}
                  placeholder="如：实验室 A203"
                />
              </div>
            </div>

            {/* 实验目的 */}
            <h2 className="mb-2.5 mt-8 flex items-center gap-2.5 text-base font-semibold text-slate-900">
              <span className="h-4 w-1 rounded-full bg-brand-500" />
              实验目的
            </h2>
            <textarea
              className="input min-h-[110px] leading-relaxed"
              defaultValue={record?.purpose ?? ''}
              placeholder="在此填写实验目的…"
            />

            {/* 材料与试剂 */}
            <h2 className="mb-2.5 mt-8 flex items-center gap-2.5 text-base font-semibold text-slate-900">
              <span className="h-4 w-1 rounded-full bg-brand-500" />
              材料与试剂
            </h2>
            {/* TODO: 材料与试剂 / 反应体系表格改为可编辑表格组件 */}
            <button
              type="button"
              className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-8 text-sm text-slate-400 transition-colors hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600"
            >
              ＋ 添加材料与试剂表格（后续接入可编辑表格组件）
            </button>

            <h2 className="mb-2.5 mt-8 flex items-center gap-2.5 text-base font-semibold text-slate-900"><span className="h-4 w-1 rounded-full bg-brand-500" />实验步骤</h2>
            <textarea className="input min-h-[180px] leading-7" defaultValue={record?.sections?.[0]?.body ?? ''} placeholder="按顺序记录操作步骤、关键参数和观察结果…" />

            <h2 className="mb-2.5 mt-8 flex items-center gap-2.5 text-base font-semibold text-slate-900"><span className="h-4 w-1 rounded-full bg-brand-500" />实验结果</h2>
            <textarea className="input min-h-[150px] leading-7" placeholder="记录结果数据、图像说明与异常情况…" />

            <h2 className="mb-2.5 mt-8 flex items-center gap-2.5 text-base font-semibold text-slate-900"><span className="h-4 w-1 rounded-full bg-brand-500" />结论与讨论</h2>
            <textarea className="input min-h-[130px] leading-7" placeholder="总结结论并说明后续计划…" />
          </div>
        </div>

        {/* 右侧属性栏 */}
        <aside className="space-y-5 xl:sticky xl:top-24">
          <Surface title="属性">
            <label className="field-label">状态</label>
            <div className="flex h-10 items-center rounded-lg border border-slate-200 bg-slate-50 px-3"><StatusBadge kind="record" status={record?.status ?? 'in_progress'} /></div>

            {isNew && (
              <>
                <p className="field-label mt-4">创建方式</p>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setCreateMode('blank')} className={`rounded-lg border px-3 py-2.5 text-sm ${createMode === 'blank' ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>空白结构</button>
                  <button type="button" onClick={() => setCreateMode('template')} className={`rounded-lg border px-3 py-2.5 text-sm ${createMode === 'template' ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>使用模板</button>
                </div>
                {createMode === 'template' && <select value={templateId} onChange={(event) => setTemplateId(event.target.value)} className="input mt-2 h-10 cursor-pointer"><option value="">选择模板</option>{templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}</select>}
              </>
            )}

            <label className="field-label mt-4">指定审核人</label>
            <select className="input h-10 cursor-pointer"><option>张老师（审核者）</option><option>项目负责人</option></select>

            {(record?.relations ?? []).length > 0 && (
              <>
                <p className="field-label mt-4">关联样品与试剂</p>
                <div className="space-y-2">
                  {record.relations.map((rel) => (
                    <div
                      key={rel.id}
                      className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
                    >
                      <span className="truncate text-[13px] text-slate-700">{rel.label}</span>
                      <Badge tone="green">{rel.kind}</Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Surface>

          <Surface title="附件">
            <button type="button" className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-7 text-sm text-slate-400 hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600">上传实验图片或文件<br /><span className="mt-1 block text-xs">单文件最大 20 MB</span></button>
          </Surface>
        </aside>
      </div>
    </section>
  )
}

const EDITOR_OUTLINE = ['基础信息', '模板字段', '实验记录正文', '附件']

function TemplateFieldInput({ field }) {
  if (field.type === 'date') return <input type="date" className="input h-10" />
  if (field.type === 'number') return <input type="number" className="input h-10" placeholder={field.unit && field.unit !== '-' ? `单位：${field.unit}` : '输入数值'} />
  if (field.type === 'image') return <button type="button" className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-400 hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600">选择图片或文件</button>
  if (field.type === 'table') return <button type="button" className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-400 hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600">添加结构化表格内容</button>
  return <input className="input h-10" placeholder={`填写${field.name}`} />
}

export default function RecordEditorPage() {
  const { recordId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const isNew = !recordId
  const projectId = searchParams.get('project')
  const source = searchParams.get('source') ?? 'blank'
  const templateId = searchParams.get('template')

  const [record, setRecord] = useState(null)
  const [projects, setProjects] = useState([])
  const [templates, setTemplates] = useState([])
  const [activeOutline, setActiveOutline] = useState('基础信息')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  useEffect(() => {
    if (recordId) fetchRecord(recordId).then(setRecord)
    fetchProjects().then(setProjects)
    fetchTemplates().then(setTemplates)
  }, [recordId])

  const selectedProject = isNew
    ? projects.find((project) => project.id === projectId)
    : projects.find((project) => project.id === record?.projectId)
  const selectedTemplate = source === 'template'
    ? templates.find((template) => template.id === templateId)
    : null
  const outline = selectedTemplate
    ? EDITOR_OUTLINE
    : EDITOR_OUTLINE.filter((item) => item !== '模板字段')

  if (isNew && projects.length > 0 && !selectedProject) {
    return (
      <section className="mx-auto max-w-xl py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">请先选择所属项目与记录结构</h1>
        <p className="mt-2 text-sm text-slate-500">新建记录必须从创建引导页进入。</p>
        <Button className="mt-5" onClick={() => navigate('/records/new')}>返回创建引导</Button>
      </section>
    )
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => navigate(-1)} aria-label="返回" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
              {isNew ? '新建实验记录' : '编辑实验记录'}
            </p>
            <p className="mt-0.5 text-xs text-slate-400">
              {isNew
                ? `${selectedProject?.name ?? ''} · ${selectedTemplate?.name ?? '空白记录'}`
                : `实验编号 ${record?.code ?? ''}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:inline-flex">
            <CheckCircle2 size={13} className="text-emerald-500" />
            {isNew ? '尚未保存' : '内容已自动保存 · 14:32'}
          </span>
          <Button variant="secondary" icon={Save}>保存</Button>
          <Button icon={Send} onClick={() => setShowSubmitDialog(true)}>提交审核</Button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[190px,minmax(0,1fr),280px]">
        <aside className="max-xl:hidden xl:sticky xl:top-24">
          <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">记录目录</p>
          <div className="space-y-0.5">
            {outline.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setActiveOutline(item)}
                className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  activeOutline === item
                    ? 'bg-brand-50 font-medium text-brand-700'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-slate-200 bg-white p-3 text-xs leading-5 text-slate-500">
            带 <span className="font-semibold text-red-500">*</span> 的固定字段是创建记录所必需的。模板字段仅按模板配置校验。
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div><h2 className="text-base font-semibold text-slate-900">基础信息</h2><p className="mt-1 text-xs text-slate-500">系统固定字段，材料与试剂不属于固定必填项。</p></div>
              <StatusBadge kind="record" status={record?.status ?? 'in_progress'} />
            </div>

            <div className="mt-5">
              <label className="field-label">实验名称 <span className="text-red-500">*</span></label>
              <input className="w-full border-0 bg-transparent px-0 text-2xl font-bold tracking-tight text-slate-900 outline-none placeholder:text-slate-300" defaultValue={record?.title ?? ''} placeholder="输入实验名称" />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div><label className="field-label">所属项目 <span className="text-red-500">*</span></label><input className="input h-10" value={selectedProject?.name ?? record?.projectName ?? ''} disabled readOnly /></div>
              <div><label className="field-label">实验类型 <span className="text-red-500">*</span></label><select className="input h-10 cursor-pointer" defaultValue={record?.experimentType ?? selectedTemplate?.experimentType ?? 'PCR'}><option>PCR</option><option>qPCR</option><option>Western blot</option><option>细胞培养</option><option>其他</option></select></div>
              <div><label className="field-label">实验日期 <span className="text-red-500">*</span></label><input type="date" className="input h-10" defaultValue={record?.experimentDate ?? '2026-07-22'} /></div>
              <div><label className="field-label">记录创建者</label><input className="input h-10" value={record?.ownerName ?? currentUser?.name ?? ''} disabled readOnly /></div>
            </div>

            <div className="mt-5"><label className="field-label">实验目的 <span className="text-red-500">*</span></label><textarea className="input min-h-28 leading-7" defaultValue={record?.purpose ?? ''} placeholder="说明本次实验希望验证的问题或达到的目标" /></div>
          </div>

          {selectedTemplate && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:p-8">
              <div className="border-b border-slate-100 pb-4"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-slate-900">模板字段</h2><Badge tone="violet">{selectedTemplate.name}</Badge></div><p className="mt-1 text-xs text-slate-500">以下字段来自创建时复制的模板结构。</p></div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.id} className={['table', 'image'].includes(field.type) ? 'sm:col-span-2' : ''}>
                    <label className="field-label">{field.name} {field.required && <span className="text-red-500">*</span>}</label>
                    <TemplateFieldInput field={field} />
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card">
            <div className="border-b border-slate-100 px-6 py-4 lg:px-8"><h2 className="text-base font-semibold text-slate-900">实验记录正文</h2><p className="mt-1 text-xs text-slate-500">自由记录实验过程、数据、结果、讨论或其他补充内容。</p></div>
            <div aria-label="富文本编辑工具栏" className="sticky top-16 z-10 flex flex-wrap gap-0.5 border-b border-slate-100 bg-white/95 px-5 py-2.5 backdrop-blur lg:px-8">
              {TOOLBAR.map((Icon, index) => <button key={index} type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900"><Icon size={15} /></button>)}
            </div>
            <div className="px-6 py-5 lg:px-8">
              <div
                contentEditable
                suppressContentEditableWarning
                data-placeholder="从这里开始自由记录实验过程。可以使用标题、列表、表格、代码、图片和链接等格式。"
                className="rich-editor min-h-[420px] rounded-lg border border-transparent px-1 py-2 text-sm leading-8 text-slate-700 outline-none focus:border-brand-200 focus:bg-brand-50/20"
              >
                {record?.sections?.[0]?.body ?? ''}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <Surface title="记录结构">
            <div className="space-y-3 text-sm">
              <div><p className="text-xs text-slate-400">所属项目</p><p className="mt-1 font-medium text-slate-900">{selectedProject?.name ?? record?.projectName}</p></div>
              <div className="border-t border-slate-100 pt-3"><p className="text-xs text-slate-400">结构来源</p><p className="mt-1 font-medium text-slate-900">{selectedTemplate?.name ?? (isNew ? '空白记录' : '记录创建时的结构快照')}</p></div>
            </div>
          </Surface>

          <Surface title="附件">
            <button type="button" className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-7 text-sm text-slate-400 hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600">
              <Paperclip size={18} className="mx-auto mb-2" />上传实验图片或文件<span className="mt-1 block text-xs">单文件最大 20 MB</span>
            </button>
          </Surface>
        </aside>
      </div>

      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-pop animate-scale-in">
            <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-slate-900">提交审核</h2><p className="mt-1 text-sm text-slate-500">提交时生成不可变快照，并锁定当前记录内容。</p></div><button type="button" onClick={() => setShowSubmitDialog(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button></div>
            <label className="field-label mt-5">指定审核人 <span className="text-red-500">*</span></label>
            <select className="input h-10 cursor-pointer"><option>张老师（审核者）</option><option>项目负责人</option></select>
            <label className="field-label mt-4">提交说明</label>
            <textarea className="input min-h-24" placeholder="可选：说明本轮修改内容或需要审核人关注的问题" />
            <div className="mt-6 flex justify-end gap-2.5"><Button variant="secondary" onClick={() => setShowSubmitDialog(false)}>取消</Button><Button icon={Send} onClick={() => setShowSubmitDialog(false)}>确认提交</Button></div>
          </div>
        </div>
      )}
    </section>
  )
}
