/**
 * 实验详情 RecordDetail（只读，新设计）
 * 正文分节 + 元数据 / 附件 + 评论与版本 + 结果图预览。
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Pencil,
  Copy,
  Check,
  Undo2,
  TestTube,
  FlaskConical,
  Paperclip,
  FileText,
  MapPin,
} from 'lucide-react'
import { Button, StatusBadge, Surface, Badge, GelPreview } from '@/components/ui'
import { fetchRecord, fetchRecordComments } from '@/api'

/** 关联对象类型 → 图标 */
const RELATION_ICONS = {
  sample: TestTube,
  reagent: FlaskConical,
  attachment: Paperclip,
  instrument: FileText,
}

export default function RecordDetailPage() {
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
