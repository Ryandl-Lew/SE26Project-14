import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Send,
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
  Loader2,
  Trash2,
} from 'lucide-react'
import { Button, Surface, Badge } from '@/components/ui'
import { StatusBadge } from '@/components/ui'
import { fetchRecord, fetchProjects, fetchTemplates, fetchTemplate, saveRecordDraft, submitRecordForReview, fetchRecordAttachments, fetchProjectMembers } from '@/api'
import { API_BASE_URL } from '@/api/client'
import { useAuthStore } from '@/store/authStore'

const TOOLBAR = [Heading2, Bold, Italic, List, Table, Sigma, Code, Image, Link2]

const EDITOR_OUTLINE = ['基础信息', '模板字段', '实验记录正文', '附件']

function TemplateFieldInput({ field, value, onChange }) {
  if (field.type === 'textarea')
    return <textarea className="input min-h-24 leading-7" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={`填写${field.name}`} />
  if (field.type === 'date')
    return <input type="date" className="input h-10" value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
  if (field.type === 'number')
    return <input type="number" className="input h-10" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={field.unit && field.unit !== '-' ? `单位：${field.unit}` : '输入数值'} />
  if (field.type === 'image')
    return <button type="button" className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-6 text-sm text-slate-400 hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600">选择图片或文件</button>
  if (field.type === 'table')
    return <textarea className="input min-h-24 leading-7" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={`填写${field.name}（每行列出一个条目）`} />
  return <input className="input h-10" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder={`填写${field.name}`} />
}

async function uploadFile(recordId, projectId, file) {
  const token = localStorage.getItem('auth_token')
  const formData = new FormData()
  formData.append('file', file)

  const url = `${API_BASE_URL}/records/${recordId}/attachments?projectId=${encodeURIComponent(projectId)}`
  const headers = new Headers()
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const response = await fetch(url, { method: 'POST', headers, body: formData })
  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(err.message || '上传失败')
  }
  const payload = await response.json()
  return payload?.data ?? null
}

export default function RecordEditorPage() {
  const { recordId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const fileInputRef = useRef(null)

  const isNew = !recordId
  const projectId = searchParams.get('project')
  const source = searchParams.get('source') ?? 'blank'
  const templateId = searchParams.get('template')

  const [record, setRecord] = useState(null)
  const [projects, setProjects] = useState([])
  const [templates, setTemplates] = useState([])
  const [templateDetail, setTemplateDetail] = useState(null)
  const [templateValues, setTemplateValues] = useState({})
  const [activeOutline, setActiveOutline] = useState('基础信息')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)

  const [title, setTitle] = useState('')
  const [experimentType, setExperimentType] = useState('PCR')
  const [experimentDate, setExperimentDate] = useState(new Date().toISOString().slice(0, 10))
  const [location, setLocation] = useState('')
  const [purpose, setPurpose] = useState('')
  const [bodyText, setBodyText] = useState('')
  const [attachments, setAttachments] = useState([])
  const [pendingFiles, setPendingFiles] = useState([])
  const [members, setMembers] = useState([])
  const [selectedReviewers, setSelectedReviewers] = useState([])
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [savedMessage, setSavedMessage] = useState('')

  useEffect(() => {
    if (recordId) {
      fetchRecord(recordId).then((r) => {
        if (r) {
          setRecord(r)
          setTitle(r.title ?? '')
          setExperimentType(r.experimentType ?? 'PCR')
          setExperimentDate(r.experimentDate ?? new Date().toISOString().slice(0, 10))
          setLocation(r.location ?? '')
          setPurpose(r.purpose ?? '')
          setBodyText(r.sections?.[0]?.body ?? '')
          if (r.templateFields) {
            setTemplateValues(r.templateFields)
          }
        }
      })
      fetchRecordAttachments(recordId).then((list) => {
        setAttachments(list)
      })
    }
    fetchProjects().then(setProjects)
    fetchTemplates().then(setTemplates)
  }, [recordId])

  useEffect(() => {
    const pid = isNew ? projectId : record?.projectId
    if (pid) {
      fetchProjectMembers(pid).then((list) => setMembers(list))
    }
  }, [projectId, record?.projectId, isNew])

  useEffect(() => {
    if (templateId) {
      fetchTemplate(templateId).then((t) => {
        if (t) {
          setTemplateDetail(t)
          const vals = {}
          t.fields.forEach((f) => { vals[f.id] = '' })
          setTemplateValues(vals)
        }
      })
    }
  }, [templateId])

  const selectedProject = isNew
    ? projects.find((project) => project.id === projectId)
    : projects.find((project) => project.id === record?.projectId)
  const selectedTemplate = source === 'template'
    ? (templateDetail ?? templates.find((template) => template.id === templateId))
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

  const toggleReviewer = (userId) => {
    setSelectedReviewers((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId],
    )
  }

  const saveRecord = async (skipNavigate = false) => {
    if (!title.trim()) return null
    const input = {
      id: recordId,
      projectId: isNew ? projectId : record?.projectId,
      templateId: isNew ? templateId : record?.templateId,
      title: title.trim(),
      experimentType,
      experimentDate,
      location,
      purpose,
      sections: [{ id: 's-1', title: '正文', body: bodyText }],
      templateFields: selectedTemplate ? templateValues : undefined,
      relations: record?.relations ?? [],
    }
    const result = await saveRecordDraft(input)
    if (result) {
      if (result.id && pendingFiles.length > 0) {
        const newId = result.id
        setAttachments([])
        for (const file of pendingFiles) {
          try {
            const uploadResult = await uploadFile(newId, projectId || record?.projectId, file)
            if (uploadResult) {
              setAttachments((prev) => [...prev, {
                id: uploadResult.id,
                name: uploadResult.originalName ?? file.name,
                kind: uploadResult.mimeType ?? file.type,
                size: uploadResult.size ?? file.size,
                uploader: uploadResult.uploadedBy ?? currentUser?.name ?? '',
                uploadedAt: uploadResult.createdAt ?? new Date().toISOString(),
              }])
            }
          } catch {
            // continue uploading remaining files
          }
        }
        setPendingFiles([])
      }
      if (result.id && !skipNavigate && isNew) {
        navigate(`/records/${result.id}/edit`, { replace: true })
      }
    }
    return result
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const result = await saveRecord()
      if (result) {
        setSavedMessage('已保存 · ' + new Date().toISOString().slice(11, 16))
        setTimeout(() => setSavedMessage(''), 3000)
      }
    } catch (err) {
      setSavedMessage('保存失败: ' + (err.message || '未知错误'))
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const saved = await saveRecord(true)
      if (!saved) return
      const currentId = saved.id ?? recordId
      if (currentId) {
        await submitRecordForReview(currentId, selectedReviewers)
        navigate('/records')
      }
    } catch (err) {
      setSavedMessage('提交失败: ' + (err.message || '未知错误'))
      setTimeout(() => setSavedMessage(''), 3000)
    } finally {
      setSubmitting(false)
      setShowSubmitDialog(false)
    }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    if (!recordId) {
      setPendingFiles((prev) => [...prev, file])
      return
    }
    setUploading(true)
    try {
      const result = await uploadFile(recordId, projectId || record?.projectId, file)
      if (result) {
        setAttachments((prev) => [...prev, {
          id: result.id,
          name: result.originalName ?? file.name,
          kind: result.mimeType ?? file.type,
          size: result.size ?? file.size,
          uploader: result.uploadedBy ?? currentUser?.name ?? '',
          uploadedAt: result.createdAt ?? new Date().toISOString(),
        }])
      }
    } catch (err) {
      setSavedMessage('上传失败: ' + (err.message || '未知错误'))
      setTimeout(() => setSavedMessage(''), 3000)
    } finally {
      setUploading(false)
    }
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
          <span className="hidden items-center gap-1.5 text-xs sm:inline-flex">
            {savedMessage ? (
              <>
                <CheckCircle2 size={13} className={savedMessage.includes('失败') ? 'text-red-500' : 'text-emerald-500'} />
                <span className={savedMessage.includes('失败') ? 'text-red-500' : 'text-slate-400'}>{savedMessage}</span>
              </>
            ) : (
              isNew ? <span className="text-slate-400">尚未保存</span> : ''
            )}
          </span>
          <Button variant="secondary" icon={Save} onClick={handleSave} disabled={saving}>
            {saving && <Loader2 size={14} className="mr-1 animate-spin" />}
            {saving ? '保存中…' : '保存'}
          </Button>
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
            带 <span className="font-semibold text-red-500">*</span> 的固定字段是创建记录所必需的。
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:p-8">
            <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div><h2 className="text-base font-semibold text-slate-900">基础信息</h2><p className="mt-1 text-xs text-slate-500">创建记录必需的字段。</p></div>
              <StatusBadge kind="record" status={record?.status ?? 'in_progress'} />
            </div>

            <div className="mt-5">
              <label className="field-label">实验名称 <span className="text-red-500">*</span></label>
              <input
                className="w-full border-0 bg-transparent px-0 text-2xl font-bold tracking-tight text-slate-900 outline-none placeholder:text-slate-300"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入实验名称"
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div><label className="field-label">所属项目 <span className="text-red-500">*</span></label><input className="input h-10" value={selectedProject?.name ?? record?.projectName ?? ''} disabled readOnly /></div>
              <div>
                <label className="field-label">实验类型 <span className="text-red-500">*</span></label>
                <select className="input h-10 cursor-pointer" value={experimentType} onChange={(e) => setExperimentType(e.target.value)}>
                  <option>PCR</option><option>qPCR</option><option>Western blot</option><option>质粒提取</option><option>细胞培养</option><option>测序</option><option>其他</option>
                </select>
              </div>
              <div>
                <label className="field-label">实验日期 <span className="text-red-500">*</span></label>
                <input type="date" className="input h-10" value={experimentDate} onChange={(e) => setExperimentDate(e.target.value)} />
              </div>
              <div><label className="field-label">记录创建者</label><input className="input h-10" value={record?.ownerName ?? currentUser?.name ?? ''} disabled readOnly /></div>
            </div>

            <div className="mt-5">
              <label className="field-label">实验地点</label>
              <input className="input h-10" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="如：分子生物学实验室 A203" />
            </div>

            <div className="mt-5">
              <label className="field-label">实验目的 <span className="text-red-500">*</span></label>
              <textarea className="input min-h-28 leading-7" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder="说明本次实验希望验证的问题或达到的目标" />
            </div>
          </div>

          {selectedTemplate && (
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card lg:p-8">
              <div className="border-b border-slate-100 pb-4"><div className="flex flex-wrap items-center gap-2"><h2 className="text-base font-semibold text-slate-900">模板字段</h2><Badge tone="violet">{selectedTemplate.name}</Badge></div><p className="mt-1 text-xs text-slate-500">以下字段来自创建时复制的模板结构。</p></div>
              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {selectedTemplate.fields.map((field) => (
                  <div key={field.id} className={['table', 'textarea', 'image'].includes(field.type) ? 'sm:col-span-2' : ''}>
                    <label className="field-label">{field.name} {field.required && <span className="text-red-500">*</span>}</label>
                    <TemplateFieldInput
                      field={field}
                      value={templateValues[field.id]}
                      onChange={(v) => setTemplateValues((prev) => ({ ...prev, [field.id]: v }))}
                    />
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
              <textarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                className="input min-h-[420px] w-full leading-7"
                placeholder="从这里开始自由记录实验过程…"
              />
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
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.csv,.xls,.xlsx,.doc,.docx,.txt"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full rounded-lg border border-dashed border-slate-300 px-4 py-7 text-sm text-slate-400 hover:border-brand-300 hover:bg-brand-50/40 hover:text-brand-600 disabled:opacity-50"
            >
              {uploading ? (
                <><Loader2 size={18} className="mx-auto mb-2 animate-spin" />上传中…</>
              ) : (
                <><Paperclip size={18} className="mx-auto mb-2" />上传实验图片或文件<span className="mt-1 block text-xs">单文件最大 20 MB</span></>
              )}
            </button>
            {attachments.length > 0 && (
              <div className="mt-3 space-y-2">
                {attachments.map((att) => (
                  <div key={att.id} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-xs">
                    <span className="truncate text-slate-700">{att.name}</span>
                    <span className="shrink-0 text-slate-400">{typeof att.size === 'number' ? (att.size > 1024 * 1024 ? `${(att.size / (1024 * 1024)).toFixed(1)} MB` : `${(att.size / 1024).toFixed(1)} KB`) : att.size}</span>
                  </div>
                ))}
              </div>
            )}
            {pendingFiles.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[11px] text-amber-600 font-medium">待上传（保存后自动上传）</p>
                {pendingFiles.map((file, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs">
                    <span className="truncate text-slate-700">{file.name}</span>
                    <button type="button" onClick={() => setPendingFiles((prev) => prev.filter((_, j) => j !== i))} className="ml-2 shrink-0 text-slate-400 hover:text-red-500"><X size={12} /></button>
                  </div>
                ))}
              </div>
            )}
          </Surface>
        </aside>
      </div>

      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-pop animate-scale-in max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div><h2 className="text-lg font-semibold text-slate-900">提交审核</h2><p className="mt-1 text-sm text-slate-500">提交后将锁定当前记录内容，等待审核人审批。</p></div>
              <button type="button" onClick={() => setShowSubmitDialog(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              {isNew ? '新记录将先保存再提交审核。' : '提交后等待审核人审批。'}
            </p>

            <div className="mt-4 overflow-y-auto flex-1">
              <p className="text-sm font-medium text-slate-700 mb-2">指定审核人 {selectedReviewers.length > 0 && <span className="text-xs text-slate-400">({selectedReviewers.length} 人已选)</span>}</p>
              {members.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">暂无项目成员可选</p>
              ) : (
                <div className="space-y-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-2">
                  {members.map((m) => (
                    <label key={m.user.id} className={`flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors ${selectedReviewers.includes(m.user.id) ? 'bg-brand-50' : 'hover:bg-slate-50'}`}>
                      <input
                        type="checkbox"
                        checked={selectedReviewers.includes(m.user.id)}
                        onChange={() => toggleReviewer(m.user.id)}
                        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                      />
                      <span className="flex-1 text-sm text-slate-700">{m.user.name}</span>
                      <span className="text-xs text-slate-400">{m.user.email}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end gap-2.5 border-t border-slate-100 pt-4">
              <Button variant="secondary" onClick={() => setShowSubmitDialog(false)}>取消</Button>
              <Button icon={Send} onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 size={14} className="mr-1 animate-spin" />}
                {submitting ? '提交中…' : '确认提交'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
