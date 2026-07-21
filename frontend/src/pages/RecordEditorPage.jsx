/**
 * 新建 / 编辑实验记录 RecordEditor（重设计）
 * 纸面画布式编辑器：左侧大纲 + 中央文档 + 右侧属性。
 * 注意：本阶段仅搭建结构与占位表单，不实现富文本编辑器能力。
 */
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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
} from 'lucide-react'
import { Button, Surface, Badge } from '@/components/ui'
import { fetchRecord } from '@/api'

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

export default function RecordEditorPage() {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const isNew = !recordId
  const [record, setRecord] = useState(null)
  const [activeOutline, setActiveOutline] = useState('基础信息')

  useEffect(() => {
    if (recordId) fetchRecord(recordId).then(setRecord)
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
              {isNew ? '填写实验信息并保存为草稿' : `实验编号 ${record?.code ?? ''}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          {/* 保存状态提示 */}
          <span className="hidden items-center gap-1.5 text-xs text-slate-400 sm:inline-flex">
            <CheckCircle2 size={13} className="text-emerald-500" />
            草稿已自动保存 · 14:32
          </span>
          {/* TODO: 接入保存草稿 / 提交审核（saveRecordDraft / submitRecordForReview） */}
          <Button variant="secondary" icon={Save}>
            保存草稿
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
                <input
                  className="input h-10"
                  defaultValue={record?.projectName ?? ''}
                  placeholder="选择所属项目"
                />
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
                <label className="field-label">负责人</label>
                <input className="input h-10" defaultValue={record?.ownerName ?? ''} />
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
          </div>
        </div>

        {/* 右侧属性栏 */}
        <aside className="space-y-5 xl:sticky xl:top-24">
          <Surface title="属性">
            <label className="field-label">状态</label>
            <select
              className="input h-10 cursor-pointer"
              defaultValue={record?.status ?? 'in_progress'}
            >
              <option value="in_progress">进行中</option>
              <option value="pending_review">待审核</option>
              <option value="completed">已完成</option>
            </select>

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

          <Surface title="操作">
            <div className="space-y-2.5">
              <Button icon={Send} className="w-full">
                提交审核
              </Button>
              <Button variant="secondary" icon={FileDown} className="w-full">
                导出 PDF
              </Button>
              <Button variant="secondary" icon={Copy} className="w-full">
                复制为新实验
              </Button>
            </div>
          </Surface>
        </aside>
      </div>
    </section>
  )
}
