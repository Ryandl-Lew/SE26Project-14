/**
 * RecordTree 实验记录目录树
 * 按分组（月份 / 资料）展示当前项目的记录，点击进入详情。
 */
import { RECORD_STATUS_LABELS } from '@/domain'
import './record-tree.css'

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
    <div className="record-tree" aria-label="当前项目实验记录目录">
      {groups.map(([month, items]) => (
        <div className="tree-group" key={month}>
          <div className="tree-title">
            <span>{month}</span>
            <span>{items.length}</span>
          </div>
          {items.map((record) => (
            <button
              key={record.id}
              className={`tree-record ${record.id === activeId ? 'active' : ''}`.trim()}
              onClick={() => onSelect?.(record)}
            >
              <strong>{record.title}</strong>
              <span className="muted small">
                {record.experimentType} · {RECORD_STATUS_LABELS[record.status]} · {record.updatedAt}
              </span>
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
