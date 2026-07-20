/**
 * 实验详情 RecordDetail（只读）
 * 只读正文 + 元数据 / 附件侧栏 + 评论与修改历史 + 审核操作。
 * 审核操作区分层级：通过为常规主操作，退回为危险操作且必须填写理由。
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  Copy,
  PencilLine,
  ShieldCheck,
  Undo2,
  FolderOpen,
} from 'lucide-react'
import { StatusBadge, Surface, Badge, GelPreview, Icon, EmptyState, useToast } from '@/components/ui'
import { approveRecord, fetchRecord, fetchRecordComments, rejectRecord } from '@/api'
import { useAppStore } from '@/store/appStore'
import './project-detail.css'

/** 可进入编辑的状态 */
const EDITABLE_STATUS = ['draft', 'in_progress', 'rejected', 'supplement']

export default function RecordDetailPage() {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const toast = useToast()
  const projects = useAppStore((s) => s.projects)

  const [record, setRecord] = useState(null)
  const [comments, setComments] = useState([])
  const [status, setStatus] = useState(null)
  const [confirmApprove, setConfirmApprove] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [acting, setActing] = useState(false)

  useEffect(() => {
    if (!recordId) return
    fetchRecord(recordId).then((r) => {
      setRecord(r)
      setStatus(r.status)
    })
    fetchRecordComments(recordId).then(setComments)
  }, [recordId])

  if (!record) {
    return (
      <div className="loading-line">
        <span className="spinner" />
        加载实验记录中…
      </div>
    )
  }

  const project = projects.find((p) => p.id === record.projectId)
  const reviewComments = comments.filter((c) => c.category === '审核意见')
  const historyComments = comments.filter((c) => c.category === '版本历史')
  const normalComments = comments.filter((c) => c.category !== '审核意见' && c.category !== '版本历史')

  const handleApprove = async () => {
    setActing(true)
    try {
      await approveRecord(record.id)
      setStatus('completed')
      setConfirmApprove(false)
      toast('已通过审核，记录标记为已完成（原型）')
    } finally {
      setActing(false)
    }
  }

  const handleReject = async () => {
    if (!rejectReason.trim()) return
    setActing(true)
    try {
      await rejectRecord(record.id, rejectReason.trim())
      setStatus('rejected')
      setRejecting(false)
      setRejectReason('')
      toast('已退回修改，理由已记录（原型）')
    } finally {
      setActing(false)
    }
  }

  return (
    <section>
      <div className="detail-header">
        <div style={{ minWidth: 0 }}>
          <nav className="breadcrumb" aria-label="面包屑">
            <Link to="/records">实验记录</Link>
            <span>·</span>
            <span>{record.code}</span>
          </nav>
          <h1>
            {record.title} <StatusBadge kind="record" status={status} />
          </h1>
          <p className="page-desc">
            {record.experimentType} · {record.ownerName} · 实验日期 {record.experimentDate}
          </p>
          {project && (
            <Link className="context-chip" style={{ marginTop: 10 }} to={`/projects/${project.id}`}>
              <Icon name={FolderOpen} size={13} />
              {project.name}
            </Link>
          )}
        </div>
        <div className="card-actions">
          <button
            className="ghost-btn"
            onClick={() => toast('「复制为新实验」为原型占位，暂未接入')}
          >
            <Icon name={Copy} size={14} />
            复制为新实验
          </button>
          {EDITABLE_STATUS.includes(status) && (
            <button
              className="secondary-btn"
              onClick={() => navigate(`/records/${record.id}/edit`)}
            >
              <Icon name={PencilLine} size={14} />
              编辑
            </button>
          )}
        </div>
      </div>

      <div className="split-layout">
        <div className="stack" style={{ alignContent: 'start' }}>
          <Surface title="实验正文">
            {record.purpose && (
              <>
                <h2>实验目的</h2>
                <p className="muted">{record.purpose}</p>
              </>
            )}
            {record.sections.map((section) => (
              <div key={section.id} style={{ marginTop: 16 }}>
                <h2>{section.title}</h2>
                {section.body && <p className="muted">{section.body}</p>}
                {section.table && (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>组分</th>
                          <th>体积 / 用量</th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.table.map((row, i) => (
                          <tr key={i}>
                            <td>{row.component}</td>
                            <td>{row.amount}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </Surface>

          <Surface title={`评论与修改历史（${comments.length}）`}>
            {comments.length ? (
              <div className="stack">
                {[...reviewComments, ...normalComments, ...historyComments].map((c) => (
                  <div className="list-item" key={c.id}>
                    <div className="list-item-title">
                      <span>
                        {c.authorName} · {c.createdAt}
                      </span>
                      <Badge tone={c.category === '审核意见' ? 'amber' : 'gray'}>
                        {c.category}
                      </Badge>
                    </div>
                    <div className="muted small">{c.content}</div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="暂无评论" description="审核意见和版本历史会显示在这里。" />
            )}
          </Surface>
        </div>

        <aside className="stack" style={{ alignContent: 'start' }}>
          {status === 'pending_review' && (
            <Surface
              title={
                <>
                  <Icon name={ShieldCheck} size={15} style={{ verticalAlign: '-2px' }} /> 审核操作
                </>
              }
            >
              <p className="muted small">
                本记录已提交审核。请核对正文与附件后选择通过或退回；退回必须填写理由。
              </p>
              {!confirmApprove && !rejecting && (
                <div className="stack">
                  <button className="primary-btn" onClick={() => setConfirmApprove(true)}>
                    审核通过
                  </button>
                  <button className="danger-btn" onClick={() => setRejecting(true)}>
                    <Icon name={Undo2} size={14} />
                    退回修改
                  </button>
                </div>
              )}
              {confirmApprove && (
                <div className="stack">
                  <p className="small" style={{ margin: 0 }}>
                    确认通过后记录将标记为「已完成」，是否继续？
                  </p>
                  <div className="card-actions">
                    <button className="primary-btn" onClick={handleApprove} disabled={acting}>
                      {acting ? '处理中…' : '确认通过'}
                    </button>
                    <button className="secondary-btn" onClick={() => setConfirmApprove(false)}>
                      再想想
                    </button>
                  </div>
                </div>
              )}
              {rejecting && (
                <div className="stack">
                  <div className="field">
                    <label htmlFor="reject-reason">退回理由（必填）</label>
                    <textarea
                      id="reject-reason"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="说明需要补充或修改的内容"
                      style={{ minHeight: 84 }}
                    />
                  </div>
                  <div className="card-actions">
                    <button
                      className="danger-btn"
                      onClick={handleReject}
                      disabled={acting || !rejectReason.trim()}
                    >
                      {acting ? '处理中…' : '确认退回'}
                    </button>
                    <button className="secondary-btn" onClick={() => setRejecting(false)}>
                      取消
                    </button>
                  </div>
                </div>
              )}
            </Surface>
          )}

          <Surface title="元数据">
            <div className="side-list" style={{ marginTop: 0 }}>
              <div className="side-chip">
                <span className="muted">实验编号</span>
                <strong>{record.code}</strong>
              </div>
              <div className="side-chip">
                <span className="muted">所属项目</span>
                <strong>{record.projectName}</strong>
              </div>
              <div className="side-chip">
                <span className="muted">负责人</span>
                <strong>{record.ownerName}</strong>
              </div>
              <div className="side-chip">
                <span className="muted">实验日期</span>
                <strong>{record.experimentDate}</strong>
              </div>
              {record.location && (
                <div className="side-chip">
                  <span className="muted">实验地点</span>
                  <strong>{record.location}</strong>
                </div>
              )}
            </div>
          </Surface>

          <Surface title="关联与附件">
            <div className="side-list" style={{ marginTop: 0 }}>
              {record.relations.map((rel) => (
                <div className="side-chip" key={rel.id}>
                  <span>{rel.label}</span>
                  <Badge tone="green">{rel.kind}</Badge>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 14 }}>
              <GelPreview caption="结果图预览（占位）" />
            </div>
          </Surface>
        </aside>
      </div>
    </section>
  )
}
