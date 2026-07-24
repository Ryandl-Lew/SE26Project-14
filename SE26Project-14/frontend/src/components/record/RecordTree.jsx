/**
 * RecordTree 实验记录目录树（新设计）
 * 按分组（月份）展示当前项目的记录，点击切换预览。
 */
import { useState } from 'react'
import { ChevronDown, ChevronRight, FileText, Folder, FolderOpen } from 'lucide-react'
import { RECORD_STATUS_LABELS } from '@/domain'

/**
 * 将记录按 updatedAt 的「年-月」分组。
 * @param {import('@/domain/models').ExperimentRecordSummary[]} records
 */
function groupByMonth(records) {
  /** @type {Record<string, import('@/domain/models').ExperimentRecordSummary[]>} */
  const groups = {}
  for (const r of records) {
    const month = (r.updatedAt || '').slice(0, 7) || '未分组'
    ;(groups[month] ??= []).push(r)
  }
  return Object.entries(groups)
}

/**
 * @param {Object} props
 * @param {import('@/domain/models').ExperimentRecordSummary[]} props.records
 * @param {string} [props.activeId] 当前选中记录
 * @param {(record: import('@/domain/models').ExperimentRecordSummary) => void} [props.onSelect]
 */
function LegacyRecordTree({ records, activeId, onSelect }) {
  const groups = groupByMonth(records)

  return (
    <div className="space-y-5" aria-label="当前项目实验记录目录">
      {groups.map(([month, items]) => (
        <div key={month}>
          <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold text-slate-400">
            <span className="font-mono">{month}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{items.length}</span>
          </div>
          <div className="space-y-1.5">
            {items.map((record) => {
              const isActive = record.id === activeId
              return (
                <button
                  key={record.id}
                  type="button"
                  onClick={() => onSelect?.(record)}
                  className={`block w-full rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'border-brand-200 bg-brand-50'
                      : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span
                    className={`block truncate text-sm font-medium ${
                      isActive ? 'text-brand-900' : 'text-slate-800'
                    }`}
                  >
                    {record.title}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-slate-400">
                    {record.experimentType} · {RECORD_STATUS_LABELS[record.status]} ·{' '}
                    {record.updatedAt}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function RecordTree({ projects, records, activeId, onSelect }) {
  const [expanded, setExpanded] = useState(() =>
    Object.fromEntries(projects.map((project) => [project.id, true])),
  )

  return (
    <div className="select-none text-[13px]" aria-label="项目与实验记录目录">
      {projects.map((project) => {
        const items = records
          .filter((record) => record.projectId === project.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        const isExpanded = expanded[project.id] ?? true
        const FolderIcon = isExpanded ? FolderOpen : Folder
        return (
          <div key={project.id} className="mb-1">
            <button
              type="button"
              onClick={() => setExpanded((value) => ({ ...value, [project.id]: !isExpanded }))}
              className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left font-medium text-slate-700 hover:bg-slate-100"
            >
              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              <FolderIcon size={15} className="text-brand-500" />
              <span className="min-w-0 flex-1 truncate">{project.name}</span>
              <span className="text-[11px] font-normal text-slate-400">{items.length}</span>
            </button>
            {isExpanded && (
              <div className="ml-4 border-l border-slate-200 pl-2">
                {items.length > 0 ? items.map((record) => {
                  const active = record.id === activeId
                  return (
                    <button
                      key={record.id}
                      type="button"
                      onClick={() => onSelect?.(record)}
                      className={`group flex w-full items-start gap-2 rounded-md px-2 py-2 text-left transition-colors ${
                        active ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <FileText size={14} className={`mt-0.5 shrink-0 ${active ? 'text-brand-600' : 'text-slate-400'}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium">{record.title}</span>
                        <span className="mt-0.5 block truncate text-[11px] text-slate-400">
                          {RECORD_STATUS_LABELS[record.status]} · {record.createdAt.slice(0, 10)}
                        </span>
                      </span>
                    </button>
                  )
                }) : (
                  <div className="px-3 py-2 text-xs text-slate-400">暂无实验记录</div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
