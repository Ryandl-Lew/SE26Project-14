/**
 * 实验详情 RecordDetail（只读，新设计）
 * 正文分节 + 元数据 / 附件 + 评论与版本 + 结果图预览。
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Pencil,
  Copy,
  Check,
  Undo2,
  TestTube,
  FlaskConical,
  Paperclip,
  FileText,
  MapPin,
  Download,
  Eye,
  FileDown,
} from 'lucide-react'
import { Button, StatusBadge, Surface, Badge, GelPreview } from '@/components/ui'
import { fetchRecord, fetchRecordComments } from '@/api'
import { useAuthStore } from '@/store/authStore'

/** 关联对象类型 → 图标 */
const RELATION_ICONS = {
  sample: TestTube,
  reagent: FlaskConical,
  attachment: Paperclip,
  instrument: FileText,
}

function LegacyRecordDetailPage() {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [comments, setComments] = useState([])

  useEffect(() => {
    if (!recordId) return
    fetchRecord(recordId).then(setRecord)
    fetchRecordComments(recordId).then(setComments)
  }, [recordId])

  if (!record) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-400">
        加载实验记录中…
      </div>
    )
  }

  const metaItems = [
    { label: '实验编号', value: record.code },
    { label: '所属项目', value: record.projectName },
    { label: '负责人', value: record.ownerName },
    { label: '实验日期', value: record.experimentDate },
  ]

  return (
    <section className="space-y-6">
      {/* 头部 */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">
              实验详情
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">{record.title}</h1>
              <StatusBadge kind="record" status={record.status} />
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500">
              <MapPin size={14} className="text-slate-400" />
              {record.location}
            </p>
          </div>
          {/* 操作组：主审核操作 + 次要操作 + 危险操作分组排列 */}
          <div className="flex shrink-0 flex-wrap items-center gap-2.5">
            <Button variant="secondary" icon={Pencil} onClick={() => navigate(`/records/${record.id}/edit`)}>
              编辑
            </Button>
            <Button variant="secondary" icon={Copy}>
              复制为新实验
            </Button>
            <Button icon={Check}>审核通过</Button>
            <Button variant="danger" icon={Undo2}>
              退回修改
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metaItems.map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 px-4 py-3">
              <div className="text-xs text-slate-500">{item.label}</div>
              <div className="mt-1 truncate text-sm font-semibold text-slate-900">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 正文 + 侧栏 */}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr),340px]">
        <Surface>
          {/* 实验目的 */}
          <div className="rounded-lg border border-brand-100 bg-brand-50/50 p-4">
            <h2 className="text-sm font-semibold text-brand-900">实验目的</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{record.purpose}</p>
          </div>

          {/* 正文分节 */}
          <div className="mt-6 space-y-7">
            {record.sections.map((section) => (
              <div key={section.id}>
                <h2 className="mb-2.5 flex items-center gap-2.5 text-base font-semibold text-slate-900">
                  <span className="h-4 w-1 rounded-full bg-brand-500" />
                  {section.title}
                </h2>
                {section.body && (
                  <p className="text-sm leading-relaxed text-slate-600">{section.body}</p>
                )}
                {section.table && (
                  <div className="table-wrap mt-3">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>组分</th>
                          <th className="text-right">体积 / 用量</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.map((row, i) => (
                          <tr key={i}>
                            <td className={i === section.table.length - 1 ? 'font-semibold' : ''}>
                              {row.component}
                            </td>
                            <td
                              className={`text-right font-mono ${i === section.table.length - 1 ? 'font-semibold' : ''}`}
                            >
                              {row.amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 评论与版本 */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <h2 className="mb-4 text-base font-semibold text-slate-900">评论与版本</h2>
            <div className="space-y-3">
              {comments.map((c) => (
                <div key={c.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-700">
                        {c.authorName.slice(0, 1)}
                      </span>
                      <span className="font-medium text-slate-900">{c.authorName}</span>
                      <span className="text-xs text-slate-400">{c.createdAt}</span>
                    </span>
                    <Badge tone="amber">{c.category}</Badge>
                  </div>
                  <p className="mt-2 pl-8 text-sm leading-relaxed text-slate-600">{c.content}</p>
                </div>
              ))}
            </div>
          </div>
        </Surface>

        {/* 元数据与附件 */}
        <aside className="space-y-6 xl:sticky xl:top-24">
          <Surface title="元数据与附件">
            <div className="space-y-2.5">
              {record.relations.map((rel) => {
                const Icon = RELATION_ICONS[rel.kind] ?? Paperclip
                return (
                  <div
                    key={rel.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 px-3.5 py-2.5 transition-colors hover:border-brand-200 hover:bg-brand-50/40"
                  >
                    <span className="flex min-w-0 items-center gap-2.5 text-sm text-slate-700">
                      <Icon size={15} className="shrink-0 text-brand-500" />
                      <span className="truncate">{rel.label}</span>
                    </span>
                    <Badge tone="green">{rel.kind}</Badge>
                  </div>
                )
              })}
            </div>
          </Surface>

          <GelPreview caption="GFP_gel_0707.png" />
        </aside>
      </div>
    </section>
  )
}

export default function RecordDetailPage() {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const currentUser = useAuthStore((state) => state.currentUser)
  const [record, setRecord] = useState(null)
  const [comments, setComments] = useState([])
  const [reviewComment, setReviewComment] = useState('')
  const [previewFile, setPreviewFile] = useState(null)

  useEffect(() => {
    if (!recordId) return
    fetchRecord(recordId).then(setRecord)
    fetchRecordComments(recordId).then(setComments)
  }, [recordId])

  if (!record) return <div className="flex h-64 items-center justify-center text-sm text-slate-400">加载实验记录中…</div>

  const canEdit = record.creatorId === currentUser?.id && ['in_progress', 'rejected'].includes(record.status)
  const canReview = record.assignedReviewerId === currentUser?.id && record.status === 'pending_review'
  const canExport = record.status === 'completed'
  const attachments = record.relations.filter((relation) => relation.kind === 'attachment' || relation.kind === 'instrument')

  return (
    <section className="space-y-6">
      <button type="button" onClick={() => navigate('/records')} className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-brand-600">
        <ArrowLeft size={15} />返回记录工作区
      </button>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand-600">实验记录详情</p>
          <div className="flex flex-wrap items-center gap-3"><h1 className="text-2xl font-bold tracking-tight text-slate-900">{record.title}</h1><StatusBadge kind="record" status={record.status} /></div>
          <p className="mt-2 text-sm text-slate-500">{record.projectName} / <span className="font-mono text-xs">{record.code}</span>{record.revision && ` / ${record.revision}`}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {canEdit && <Button icon={Pencil} onClick={() => navigate(`/records/${record.id}/edit`)}>编辑记录</Button>}
          {canExport && <Button variant="secondary" icon={FileDown}>导出 PDF</Button>}
          {canExport && <Button variant="secondary" icon={Download}>导出 Markdown</Button>}
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr),360px]">
        <Surface>
          <div className="grid gap-3 border-b border-slate-100 pb-6 sm:grid-cols-2 lg:grid-cols-4">
            {[['实验类型', record.experimentType], ['实验日期', record.experimentDate], ['记录创建者', record.ownerName], ['实验地点', record.location]].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 px-4 py-3"><div className="text-xs text-slate-400">{label}</div><div className="mt-1 text-sm font-medium text-slate-900">{value}</div></div>
            ))}
          </div>

          <div className="mt-6"><h2 className="text-base font-semibold text-slate-900">实验目的</h2><p className="mt-2 text-sm leading-7 text-slate-600">{record.purpose}</p></div>
          <div className="mt-7 space-y-7">
            {record.sections.map((section) => (
              <div key={section.id}>
                <h2 className="mb-2.5 flex items-center gap-2.5 text-base font-semibold text-slate-900"><span className="h-4 w-1 rounded-full bg-brand-500" />{section.title}</h2>
                {section.body && <p className="text-sm leading-7 text-slate-600">{section.body}</p>}
                {section.table && <div className="table-wrap mt-3"><table className="data-table"><thead><tr><th>组分</th><th className="text-right">体积 / 用量</th></tr></thead><tbody>{section.table.map((row) => <tr key={row.component}><td>{row.component}</td><td className="text-right font-mono">{row.amount}</td></tr>)}</tbody></table></div>}
              </div>
            ))}
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6"><h2 className="text-base font-semibold text-slate-900">审核记录</h2><div className="mt-4 space-y-3">{comments.map((comment) => <div key={comment.id} className="rounded-lg border border-slate-200 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-medium text-slate-900">{comment.authorName}</span><span className="text-xs text-slate-400">{comment.createdAt}</span></div><p className="mt-2 text-sm leading-6 text-slate-600">{comment.content}</p></div>)}</div></div>
        </Surface>

        <aside className="space-y-5 xl:sticky xl:top-24">
          <Surface title="附件">
            <div className="space-y-2.5">
              {attachments.map((file) => (
                <div key={file.id} className="rounded-lg border border-slate-200 p-3">
                  <div className="flex min-w-0 items-center gap-2.5"><Paperclip size={15} className="shrink-0 text-brand-500" /><span className="truncate text-sm font-medium text-slate-700">{file.label}</span></div>
                  <div className="mt-3 flex gap-1.5 border-t border-slate-100 pt-2.5"><Button variant="ghost" size="sm" icon={Eye} onClick={() => setPreviewFile(file)}>预览</Button><Button variant="ghost" size="sm" icon={Download}>下载</Button></div>
                </div>
              ))}
            </div>
          </Surface>

          {canReview && (
            <Surface title="审核当前提交">
              <label className="field-label">审核意见</label>
              <textarea value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} className="input min-h-28" placeholder="退回修改时必须填写具体意见；通过时可选填。" />
              <div className="mt-4 grid grid-cols-2 gap-2.5"><Button variant="danger" icon={Undo2} disabled={!reviewComment.trim()}>退回修改</Button><Button icon={Check}>审核通过</Button></div>
            </Surface>
          )}

          {!canReview && record.status === 'pending_review' && <Surface title="审核状态"><p className="text-sm leading-6 text-slate-500">正在由 <span className="font-semibold text-slate-900">{record.assignedReviewerName ?? '指定审核人'}</span> 审核</p></Surface>}
        </aside>
      </div>

      {previewFile && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"><div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-pop"><div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-semibold text-slate-900">{previewFile.label}</h2><p className="mt-1 text-sm text-slate-500">记录附件预览</p></div><Button variant="ghost" onClick={() => setPreviewFile(null)}>关闭</Button></div><div className="mt-5 flex min-h-96 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">静态原型附件预览区域</div></div></div>}
    </section>
  )
}
