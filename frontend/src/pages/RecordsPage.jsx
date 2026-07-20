/**
 * 实验记录 Records
 * 主从工作区：左侧搜索 / 筛选 / 记录目录，右侧选中记录摘要与主要操作。
 * 以全局「当前项目」为上下文（顶部栏统一切换，本页不再重复切换器）。
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FolderOpen, Plus, Search, NotebookPen, PencilLine, Eye } from 'lucide-react'
import { PageHeader, StatusBadge, Surface, EmptyState, Icon } from '@/components/ui'
import RecordTree from '@/components/record/RecordTree'
import { fetchRecords } from '@/api'
import { RECORD_STATUS_LABELS } from '@/domain'
import { useAppStore } from '@/store/appStore'
import './records.css'

export default function RecordsPage() {
  const navigate = useNavigate()
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const projects = useAppStore((s) => s.projects)
  const currentProject = projects.find((p) => p.id === currentProjectId)

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeId, setActiveId] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    setLoading(true)
    fetchRecords(currentProjectId).then((list) => {
      setRecords(list)
      setActiveId(list[0]?.id ?? null)
      setLoading(false)
    })
  }, [currentProjectId])

  const visible = useMemo(
    () =>
      records.filter(
        (r) =>
          (status === 'all' || r.status === status) &&
          (!keyword.trim() ||
            r.title.includes(keyword.trim()) ||
            r.code.includes(keyword.trim()) ||
            r.experimentType.includes(keyword.trim())),
      ),
    [records, keyword, status],
  )

  const active = visible.find((r) => r.id === activeId) ?? visible[0]

  return (
    <section>
      <PageHeader
        breadcrumb={[{ label: '实验记录' }]}
        title="实验记录"
        description="浏览当前项目的实验记录目录，选择一条记录查看摘要或进入编辑。"
        actions={
          <>
            {currentProject && (
              <Link
                className="context-chip"
                to={`/projects/${currentProject.id}`}
                title="当前项目，点击进入项目详情"
              >
                <Icon name={FolderOpen} size={13} />
                {currentProject.name}
              </Link>
            )}
            <button className="primary-btn" onClick={() => navigate('/records/new')}>
              <Icon name={Plus} size={15} />
              新建实验记录
            </button>
          </>
        }
      />

      <div className="records-workspace">
        <aside className="surface records-master">
          <div className="surface-head">
            <h2>记录目录</h2>
            <span className="badge gray">{visible.length}</span>
          </div>
          <div className="records-filters">
            <div className="records-search">
              <Icon name={Search} size={14} />
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索标题 / 编号 / 类型"
                aria-label="搜索实验记录"
              />
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              aria-label="按状态筛选"
            >
              <option value="all">全部状态</option>
              {Object.entries(RECORD_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {loading ? (
            <div className="loading-line">
              <span className="spinner" />
              加载记录…
            </div>
          ) : visible.length ? (
            <RecordTree
              records={visible}
              activeId={active?.id}
              onSelect={(r) => setActiveId(r.id)}
            />
          ) : (
            <EmptyState
              icon={NotebookPen}
              title={records.length ? '没有匹配的记录' : '当前项目暂无记录'}
              description={
                records.length ? '调整搜索或筛选条件。' : '点击「新建实验记录」开始。'
              }
            />
          )}
        </aside>

        <Surface className="records-detail">
          {active ? (
            <>
              <div className="surface-head">
                <div>
                  <h2>{active.title}</h2>
                  <div className="muted small">
                    {active.code} · {active.projectName} · 最近修改 {active.updatedAt}
                  </div>
                </div>
                <StatusBadge kind="record" status={active.status} />
              </div>

              <div className="record-summary-grid">
                <div className="record-summary-item">
                  <div className="muted small">实验类型</div>
                  <strong>{active.experimentType}</strong>
                </div>
                <div className="record-summary-item">
                  <div className="muted small">负责人</div>
                  <strong>{active.ownerName}</strong>
                </div>
                <div className="record-summary-item">
                  <div className="muted small">所属项目</div>
                  <strong>{active.projectName}</strong>
                </div>
              </div>

              <p className="muted small">
                正文内容（实验目的、反应体系、结果与结论）请在详情页查看；
                草稿与进行中的记录可直接进入编辑器继续填写。
              </p>

              <div className="card-actions" style={{ marginTop: 12 }}>
                <button
                  className="secondary-btn"
                  onClick={() => navigate(`/records/${active.id}`)}
                >
                  <Icon name={Eye} size={14} />
                  查看详情
                </button>
                <button
                  className="primary-btn"
                  onClick={() => navigate(`/records/${active.id}/edit`)}
                >
                  <Icon name={PencilLine} size={14} />
                  编辑记录
                </button>
              </div>
            </>
          ) : (
            <EmptyState
              icon={NotebookPen}
              title="选择一条记录"
              description="从左侧目录选择记录查看摘要与操作。"
            />
          )}
        </Surface>
      </div>
    </section>
  )
}
