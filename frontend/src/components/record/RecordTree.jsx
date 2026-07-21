/**
 * RecordTree 实验记录目录树（新设计）
 * 按分组（月份）展示当前项目的记录，点击切换预览。
 */
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
export default function RecordTree({ records, activeId, onSelect }) {
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
