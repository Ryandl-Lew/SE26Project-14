/**
 * RevisionTimeline 修改追溯时间线
 * 展示实验记录 / 项目的修改历史：修改人、修改时间、修改内容与修改原因。
 */
import { AUDIT_ACTION_LABELS, AUDIT_ACTION_TONES } from '@/domain'
import { Avatar, Badge, EmptyState } from '@/components/ui'
import './revision-timeline.css'

/**
 * @param {Object} props
 * @param {import('@/domain/models').AuditEntry[]} props.entries 按时间倒序
 */
export default function RevisionTimeline({ entries }) {
  if (!entries?.length) {
    return <EmptyState icon="history" title="暂无修改记录" description="内容发生修改后，这里会记录修改人、时间、内容与原因。" />
  }

  return (
    <ol className="rev-timeline">
      {entries.map((entry) => (
        <li className="rev-item" key={entry.id}>
          <span className="rev-rail">
            <span className={`rev-node tone-${AUDIT_ACTION_TONES[entry.action] ?? 'gray'}`} />
          </span>
          <div className="rev-card">
            <div className="rev-head">
              <Avatar name={entry.actorName} size={26} />
              <span className="rev-actor">{entry.actorName}</span>
              <Badge tone={AUDIT_ACTION_TONES[entry.action] ?? 'gray'}>
                {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
              </Badge>
              <span className="rev-target">{entry.targetName}</span>
              <time className="rev-time">{entry.createdAt}</time>
            </div>
            <p className="rev-summary">{entry.changeSummary}</p>
            {entry.reason && (
              <p className="rev-reason">
                <span className="rev-reason-label">修改原因</span>
                {entry.reason}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
