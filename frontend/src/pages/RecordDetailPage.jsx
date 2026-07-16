/**
 * 实验详情 RecordDetail（只读）
 * 正文分节 + 元数据 / 附件 + 评论与版本 + 结果图预览。
 */
import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { StatusBadge, Surface, Badge, GelPreview } from '@/components/ui'
import FileManager from '@/components/file/FileManager'
import { fetchRecord, fetchRecordComments, exportRecord } from '@/api'
import { listRecordAttachments } from '@/api/files'
import { toast } from '@/utils/toast'
import './project-detail.css'

export default function RecordDetailPage() {
  const { recordId } = useParams()
  const navigate = useNavigate()
  const [record, setRecord] = useState(null)
  const [comments, setComments] = useState([])
  const [attachments, setAttachments] = useState([])
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportingMd, setExportingMd] = useState(false)

  const handleExportPdf = useCallback(async () => {
    if (exportingPdf) return
    setExportingPdf(true)
    try {
      await exportRecord(recordId, 'pdf')
      toast('实验记录 PDF 导出成功')
    } catch (err) {
      console.error('PDF 导出失败:', err)
      toast(err?.response?.data?.message
        || err?.message
        || 'PDF 导出失败，请稍后重试', { type: 'error' })
    } finally {
      setExportingPdf(false)
    }
  }, [recordId, exportingPdf])

  const handleExportMd = useCallback(async () => {
    if (exportingMd) return
    setExportingMd(true)
    try {
      await exportRecord(recordId, 'md')
      toast('实验记录 Markdown 导出成功')
    } catch (err) {
      console.error('Markdown 导出失败:', err)
      toast(err?.response?.data?.message
        || err?.message
        || 'Markdown 导出失败，请稍后重试', { type: 'error' })
    } finally {
      setExportingMd(false)
    }
  }, [recordId, exportingMd])

  useEffect(() => {
    if (!recordId) return
    fetchRecord(recordId).then(setRecord)
    fetchRecordComments(recordId).then(setComments)
    listRecordAttachments(recordId).then(setAttachments)
  }, [recordId])

  if (!record) return <p className="muted">加载实验记录中…</p>

  return (
    <section>
      <div className="detail-header">
        <div>
          <p className="eyebrow">实验详情</p>
          <h1>
            {record.title} <StatusBadge kind="record" status={record.status} />
          </h1>
          <p className="page-desc">只读查看实验正文、元数据、附件、评论和版本历史。</p>
          <div className="meta-grid">
            <div className="meta-item">
              <span>实验编号</span>
              <strong>{record.code}</strong>
            </div>
            <div className="meta-item">
              <span>所属项目</span>
              <strong>{record.projectName}</strong>
            </div>
            <div className="meta-item">
              <span>负责人</span>
              <strong>{record.ownerName}</strong>
            </div>
            <div className="meta-item">
              <span>实验日期</span>
              <strong>{record.experimentDate}</strong>
            </div>
          </div>
        </div>
        <div className="card-actions">
          <button className="secondary-btn" onClick={() => navigate(`/records/${record.id}/edit`)}>
            编辑
          </button>
          <button className="secondary-btn">复制为新实验</button>
          <button className="primary-btn">审核通过</button>
          <button className="danger-btn">退回修改</button>
          <button
            className="secondary-btn"
            onClick={handleExportPdf}
            disabled={exportingPdf}
          >
            {exportingPdf ? '⏳ 导出中…' : '📄 导出 PDF'}
          </button>
          <button
            className="secondary-btn"
            onClick={handleExportMd}
            disabled={exportingMd}
          >
            {exportingMd ? '⏳ 导出中…' : '📝 导出 Markdown'}
          </button>
        </div>
      </div>

      <div className="split-layout">
        <Surface>
          {record.sections.map((section) => (
            <div key={section.id} style={{ marginBottom: 16 }}>
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

          <h2>评论与版本</h2>
          <div className="stack">
            {comments.map((c) => (
              <div className="list-item" key={c.id}>
                <div className="list-item-title">
                  <span>
                    {c.authorName} · {c.createdAt}
                  </span>
                  <Badge tone="amber">{c.category}</Badge>
                </div>
                <div className="muted small">{c.content}</div>
              </div>
            ))}
          </div>
        </Surface>

        <aside className="surface">
          <h2>元数据与附件</h2>
          <div className="side-list">
            {record.relations.map((rel) => (
              <div className="side-chip" key={rel.id}>
                <span>{rel.label}</span>
                <Badge tone="green">{rel.kind}</Badge>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <GelPreview caption="结果图预览" />
          </div>
          <h2 style={{ marginTop: 18 }}>文件管理</h2>
          <FileManager
            entityId={recordId}
            entityType="record"
            projectId={record.projectId}
            compact
            initialFiles={attachments}
          />
        </aside>
      </div>
    </section>
  )
}
