/**
 * 新建 / 编辑实验记录 RecordEditor
 * 流程：/records/new 先轻量选择「空白记录 / 从模板创建」，再进入编辑器；
 * /records/:recordId/edit 直接加载记录进入编辑器。
 * 编辑器为专注型 ELN 工作区：章节导航 + 编辑画布 + 状态 / 关联侧栏，
 * 底部固定「保存草稿 / 提交审核」操作栏。
 * 说明：本阶段表单为结构化占位，未接入富文本能力；保存 / 提交走现有 API mock。
 */
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  FilePlus2,
  LayoutTemplate,
  Paperclip,
  Save,
  Send,
  X,
} from 'lucide-react'
import { PageHeader, Surface, Badge, StatusBadge, EmptyState, Icon, useToast } from '@/components/ui'
import {
  fetchRecord,
  fetchTemplate,
  fetchTemplates,
  saveRecordDraft,
  submitRecordForReview,
} from '@/api'
import { RECORD_STATUS_LABELS } from '@/domain'
import { useAppStore } from '@/store/appStore'
import './editor.css'

/** 编辑器章节锚点 */
const OUTLINE = [
  { id: 'sec-base', label: '基础信息' },
  { id: 'sec-purpose', label: '实验目的' },
  { id: 'sec-sections', label: '实验内容' },
  { id: 'sec-attachments', label: '附件' },
]

const EXPERIMENT_TYPES = ['PCR', 'qPCR', 'Western blot', '质粒提取', '测序', '细胞培养']

const EMPTY_DRAFT = {
  title: '',
  experimentType: 'PCR',
  projectId: '',
  experimentDate: '2026-07-09',
  ownerName: '',
  location: '',
  purpose: '',
  sections: [],
}

export default function RecordEditorPage() {
  const { recordId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const toast = useToast()
  const projects = useAppStore((s) => s.projects)
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const isNew = !recordId

  /** choose: 新建时的方式选择；edit: 编辑器 */
  const [step, setStep] = useState(isNew ? 'choose' : 'edit')
  const [templates, setTemplates] = useState([])
  const [templateUsed, setTemplateUsed] = useState(null)
  const [record, setRecord] = useState(null)
  const [draft, setDraft] = useState({ ...EMPTY_DRAFT, projectId: currentProjectId })
  const [status, setStatus] = useState('in_progress')
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const canvasRef = useRef(null)

  // 模板列表（新建方式选择）与既有记录加载
  useEffect(() => {
    if (isNew) fetchTemplates().then(setTemplates)
  }, [isNew])

  useEffect(() => {
    if (!recordId) return
    fetchRecord(recordId).then((r) => {
      setRecord(r)
      setStatus(r.status)
      setDraft({
        title: r.title,
        experimentType: r.experimentType,
        projectId: r.projectId,
        experimentDate: r.experimentDate,
        ownerName: r.ownerName,
        location: r.location ?? '',
        purpose: r.purpose ?? '',
        sections: r.sections.map((s) => ({ id: s.id, title: s.title, body: s.body ?? '' })),
      })
    })
  }, [recordId])

  // 从模板页「使用模板」跳入
  useEffect(() => {
    const templateId = location.state?.templateId
    if (!isNew || !templateId) return
    fetchTemplate(templateId).then((tpl) => {
      if (tpl) startFromTemplate(tpl)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNew, location.state])

  const startBlank = () => {
    setTemplateUsed(null)
    setDraft({ ...EMPTY_DRAFT, projectId: currentProjectId })
    setStep('edit')
  }

  const startFromTemplate = (tpl) => {
    setTemplateUsed(tpl)
    setDraft({
      ...EMPTY_DRAFT,
      projectId: currentProjectId,
      title: `${tpl.name.replace('模板', '').trim()}实验`,
      sections: tpl.fields.map((f) => ({
        id: `s-${f.id}`,
        title: f.name + (f.unit && f.unit !== '-' ? `（${f.unit}）` : ''),
        body: '',
      })),
    })
    setStep('edit')
  }

  const setField = (key) => (e) =>
    setDraft((d) => ({ ...d, [key]: e.target.value }))

  const setSectionBody = (id) => (e) =>
    setDraft((d) => ({
      ...d,
      sections: d.sections.map((s) => (s.id === id ? { ...s, body: e.target.value } : s)),
    }))

  const scrollTo = (id) => {
    canvasRef.current?.querySelector(`#${id}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveRecordDraft({ ...draft, sections: draft.sections })
      toast('草稿已保存（原型：数据不会真正写入）')
    } catch {
      toast('保存失败，请重试', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await saveRecordDraft({ ...draft, sections: draft.sections })
      await submitRecordForReview(recordId ?? 'r-new')
      setStatus('pending_review')
      toast('已提交审核，等待审核者处理（原型）')
    } catch {
      toast('提交失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  /* ------------------------- 第一步：选择创建方式 ------------------------- */
  if (step === 'choose') {
    return (
      <section>
        <PageHeader
          breadcrumb={[
            { label: '实验记录', to: '/records' },
            { label: '新建实验记录' },
          ]}
          title="新建实验记录"
          description="选择创建方式：从空白开始，或基于模板快速搭建记录结构。"
        />
        <div className="create-choice-grid">
          <button type="button" className="create-choice" onClick={startBlank}>
            <span className="create-choice-icon">
              <Icon name={FilePlus2} size={22} />
            </span>
            <strong>空白记录</strong>
            <span className="muted small">从零开始填写实验目的、内容与结论。</span>
          </button>
          <div className="create-choice as-group" aria-label="从模板创建">
            <span className="create-choice-icon">
              <Icon name={LayoutTemplate} size={22} />
            </span>
            <strong>从模板创建</strong>
            <span className="muted small">使用预置字段结构，适合 PCR、qPCR 等常规实验。</span>
            <div className="create-choice-templates">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className="template-pick"
                  onClick={() => startFromTemplate(t)}
                >
                  <span>{t.name}</span>
                  <span className="muted small">使用 {t.usageCount} 次</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    )
  }

  /* ------------------------------ 第二步：编辑器 ------------------------------ */
  const pageTitle = isNew ? draft.title || '新建实验记录' : record?.title ?? '加载中…'

  return (
    <section className="editor-page">
      <PageHeader
        breadcrumb={
          isNew
            ? [
                { label: '实验记录', to: '/records' },
                { label: '新建实验记录' },
              ]
            : [
                { label: '实验记录', to: '/records' },
                { label: record?.code ?? recordId, to: `/records/${recordId}` },
                { label: '编辑' },
              ]
        }
        title={
          <>
            {pageTitle}
            {!isNew && <StatusBadge kind="record" status={status} />}
            {templateUsed && <Badge tone="green">基于模板：{templateUsed.name}</Badge>}
          </>
        }
        actions={
          <button className="ghost-btn" onClick={() => navigate(-1)}>
            <Icon name={X} size={15} />
            退出编辑
          </button>
        }
      />

      <div className="editor-shell">
        {/* 章节导航 */}
        <aside className="editor-outline">
          <div className="editor-outline-title muted small">章节导航</div>
          <div className="outline-list">
            {OUTLINE.map((item) => (
              <button key={item.id} type="button" onClick={() => scrollTo(item.id)}>
                {item.label}
              </button>
            ))}
          </div>
        </aside>

        {/* 编辑画布 */}
        <div className="editor-canvas" ref={canvasRef}>
          <Surface id="sec-base" title="基础信息">
            <div className="form-grid">
              <div className="field">
                <label htmlFor="ed-title">实验标题</label>
                <input
                  id="ed-title"
                  value={draft.title}
                  onChange={setField('title')}
                  placeholder="如：PCR 扩增 GFP 片段"
                />
              </div>
              <div className="field">
                <label htmlFor="ed-type">实验类型</label>
                <select id="ed-type" value={draft.experimentType} onChange={setField('experimentType')}>
                  {EXPERIMENT_TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ed-project">所属项目</label>
                <select id="ed-project" value={draft.projectId} onChange={setField('projectId')}>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="ed-date">实验日期</label>
                <input
                  id="ed-date"
                  type="date"
                  value={draft.experimentDate}
                  onChange={setField('experimentDate')}
                />
              </div>
              <div className="field">
                <label htmlFor="ed-owner">负责人</label>
                <input
                  id="ed-owner"
                  value={draft.ownerName}
                  onChange={setField('ownerName')}
                  placeholder="如：李同学"
                />
              </div>
              <div className="field">
                <label htmlFor="ed-location">实验地点</label>
                <input
                  id="ed-location"
                  value={draft.location}
                  onChange={setField('location')}
                  placeholder="如：实验室 A203"
                />
              </div>
            </div>
          </Surface>

          <Surface id="sec-purpose" title="实验目的">
            <div className="field">
              <textarea
                value={draft.purpose}
                onChange={setField('purpose')}
                placeholder="说明本次实验要验证什么、为后续哪一步做准备。"
                aria-label="实验目的"
              />
            </div>
          </Surface>

          <Surface
            id="sec-sections"
            title="实验内容"
            extra={templateUsed && <Badge tone="gray">{templateUsed.name}</Badge>}
          >
            {draft.sections.length ? (
              <div className="stack">
                {draft.sections.map((s) => (
                  <div className="field" key={s.id}>
                    <label>{s.title}</label>
                    <textarea
                      value={s.body}
                      onChange={setSectionBody(s.id)}
                      placeholder={`填写「${s.title}」…`}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="暂无内容分节"
                description="空白记录可直接在下方补充；从模板创建会自动生成分节。"
              />
            )}
          </Surface>

          <Surface id="sec-attachments" title="附件">
            <button
              className="secondary-btn"
              type="button"
              onClick={() => toast('原型阶段暂未接入附件上传')}
            >
              <Icon name={Paperclip} size={14} />
              添加附件
            </button>
            <p className="muted small" style={{ margin: '10px 0 0' }}>
              凝胶图、仪器导出文件等会作为附件关联到本记录。
            </p>
          </Surface>
        </div>

        {/* 状态 / 关联侧栏 */}
        <aside className="editor-aside">
          <Surface title="记录信息">
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="ed-status">记录状态</label>
              <select id="ed-status" value={status} onChange={(e) => setStatus(e.target.value)}>
                {Object.entries(RECORD_STATUS_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="side-list" style={{ marginTop: 0 }}>
              <div className="side-chip">
                <span className="muted">所属项目</span>
                <strong>
                  {projects.find((p) => p.id === draft.projectId)?.name ?? '未选择'}
                </strong>
              </div>
              <div className="side-chip">
                <span className="muted">实验类型</span>
                <strong>{draft.experimentType}</strong>
              </div>
              {templateUsed && (
                <div className="side-chip">
                  <span className="muted">使用模板</span>
                  <strong>{templateUsed.name}</strong>
                </div>
              )}
            </div>
          </Surface>

          {(record?.relations ?? []).length > 0 && (
            <Surface title="关联信息">
              <div className="side-list" style={{ marginTop: 0 }}>
                {record.relations.map((rel) => (
                  <div className="side-chip" key={rel.id}>
                    <span>{rel.label}</span>
                    <Badge tone="green">{rel.kind}</Badge>
                  </div>
                ))}
              </div>
            </Surface>
          )}
        </aside>
      </div>

      {/* 固定操作栏 */}
      <div className="editor-actionbar" role="toolbar" aria-label="记录操作">
        <span className="muted small">
          {isNew ? '新记录尚未保存' : `正在编辑 ${record?.code ?? ''}`}
        </span>
        <div className="card-actions">
          <button className="secondary-btn" type="button" onClick={() => navigate(-1)}>
            取消
          </button>
          <button
            className="secondary-btn"
            type="button"
            onClick={handleSave}
            disabled={saving || submitting}
          >
            {saving ? <span className="spinner" /> : <Icon name={Save} size={14} />}
            保存草稿
          </button>
          <button
            className="primary-btn"
            type="button"
            onClick={handleSubmit}
            disabled={saving || submitting || status === 'pending_review'}
          >
            {submitting ? <span className="spinner on-light" /> : <Icon name={Send} size={14} />}
            提交审核
          </button>
        </div>
      </div>
    </section>
  )
}
