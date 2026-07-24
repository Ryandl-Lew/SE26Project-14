/**
 * 实验记录 Records（新设计）
 * 左侧记录目录树 + 右侧选中记录预览；以当前项目为上下文。
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, NotebookPen } from 'lucide-react'
import { Button, PageHeader, StatusBadge, EmptyState } from '@/components/ui'
import RecordTree from '@/components/record/RecordTree'
import { fetchProjects, fetchRecord, fetchRecords } from '@/api'
import { RECORD_STATUS_LABELS } from '@/domain'

export default function RecordsPage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [records, setRecords] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [activeDetail, setActiveDetail] = useState(null)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')

  useEffect(() => {
    Promise.all([fetchProjects().then(setProjects), fetchRecords().then((list) => {
      setRecords(list)
      const firstId = list[0]?.id ?? null
      setActiveId(firstId)
    })])
  }, [])

  useEffect(() => {
    if (activeId) {
      fetchRecord(activeId).then(setActiveDetail)
    } else {
      setActiveDetail(null)
    }
  }, [activeId])

  const filteredRecords = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    return records.filter((record) => {
      const matchesKeyword = !normalized || record.title.toLowerCase().includes(normalized) || record.code.toLowerCase().includes(normalized)
      if (status === 'all') return matchesKeyword
      if (status === 'in_progress') return matchesKeyword && (record.status === 'draft' || record.status === 'in_progress')
      return matchesKeyword && record.status === status
    })
  }, [keyword, records, status])

  const visibleProjects = projects.filter((project) =>
    filteredRecords.some((record) => record.projectId === project.id) || (!keyword && status === 'all'),
  )

  useEffect(() => {
    if (filteredRecords.length === 0) {
      setActiveId(null)
      return
    }
    const stillVisible = filteredRecords.some((r) => r.id === activeId)
    if (!stillVisible) {
      setActiveId(filteredRecords[0].id)
    }
  }, [filteredRecords, activeId])

  const active = filteredRecords.find((record) => record.id === activeId)
  const canEdit = active && ['draft', 'in_progress', 'rejected'].includes(active.status)

  return (
    <section>
      <PageHeader
        eyebrow="实验记录"
        title="记录工作区"
        description="按项目目录浏览全部实验记录，在右侧快速查看记录状态与内容概览。"
        actions={<Button icon={Plus} onClick={() => navigate('/records/new')}>新建实验记录</Button>}
      />

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-card xl:grid xl:min-h-[650px] xl:grid-cols-[340px,minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-slate-50/70 xl:border-b-0 xl:border-r">
          <div className="border-b border-slate-200 p-3">
            <div className="relative">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="按名称或编号搜索" className="input h-9 bg-white pl-9 text-[13px]" />
            </div>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="input mt-2 h-9 cursor-pointer bg-white text-[13px]">
              <option value="all">全部状态</option>
              <option value="in_progress">{RECORD_STATUS_LABELS.in_progress}</option>
              <option value="pending_review">{RECORD_STATUS_LABELS.pending_review}</option>
              <option value="completed">{RECORD_STATUS_LABELS.completed}</option>
              <option value="rejected">{RECORD_STATUS_LABELS.rejected}</option>
            </select>
          </div>
          <div className="max-h-[560px] overflow-y-auto p-2 xl:max-h-[650px]">
            {visibleProjects.length > 0 ? (
              <RecordTree projects={visibleProjects} records={filteredRecords} activeId={activeId} onSelect={(record) => setActiveId(record.id)} />
            ) : (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <NotebookPen size={28} className="mb-3 text-slate-300" />
                <p className="text-sm font-medium text-slate-500">暂无实验记录</p>
                <p className="mt-1 text-xs text-slate-400">
                  {records.length === 0 ? '点击右上角「新建实验记录」开始工作' : '当前筛选条件下没有匹配的记录'}
                </p>
              </div>
            )}
          </div>
        </aside>

        <div className="min-w-0 p-5 sm:p-7">
          {active ? (
            <div className="animate-fade-in">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2.5"><h2 className="text-xl font-semibold text-slate-900">{active.title}</h2><StatusBadge kind="record" status={active.status} /></div>
                  <p className="mt-1.5 text-xs text-slate-500">{active.projectName} / {active.code}</p>
                </div>
                <div className="flex gap-2.5"><Button variant="secondary" onClick={() => navigate(`/records/${active.id}`)}>查看详情</Button>{canEdit && <Button onClick={() => navigate(`/records/${active.id}/edit`)}>编辑记录</Button>}</div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[['实验类型', active.experimentType], ['创建者', active.ownerName], ['创建时间', active.createdAt], ['最近修改', active.updatedAt]].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-slate-50 px-4 py-3"><div className="text-xs text-slate-400">{label}</div><div className="mt-1 truncate text-sm font-medium text-slate-900">{value}</div></div>
                ))}
              </div>

              <div className="mt-6">
                <div className="max-w-4xl space-y-5">
                  {activeDetail?.purpose ? (
                    <div><h3 className="text-sm font-semibold text-slate-900">实验目的</h3><p className="mt-2 text-sm leading-7 text-slate-600">{activeDetail.purpose}</p></div>
                  ) : null}
                  {activeDetail?.sections?.filter((s) => s.body).map((s) => (
                    <div key={s.id}><h3 className="text-sm font-semibold text-slate-900">{s.title || '正文'}</h3><p className="mt-2 text-sm leading-7 text-slate-600">{s.body}</p></div>
                  ))}
                  {!activeDetail?.purpose && !activeDetail?.sections?.some((s) => s.body) && (
                    <p className="text-sm text-slate-400">暂未填写实验内容和目的，请编辑记录补充。</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState icon={NotebookPen} title="选择一条实验记录" description="从左侧项目目录中选择记录，在这里查看概览。" />
          )}
        </div>
      </div>
    </section>
  )
}
