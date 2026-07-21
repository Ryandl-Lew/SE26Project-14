/**
 * 实验记录 Records（新设计）
 * 左侧记录目录树 + 右侧选中记录预览；以当前项目为上下文。
 */
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, LayoutGrid, Download, NotebookPen } from 'lucide-react'
import { Button, PageHeader, StatusBadge, Surface, Badge, EmptyState } from '@/components/ui'
import RecordTree from '@/components/record/RecordTree'
import { fetchRecords } from '@/api'
import { mockProjects } from '@/mocks/data'
import { useAppStore } from '@/store/appStore'

export default function RecordsPage() {
  const navigate = useNavigate()
  const { currentProjectId, setCurrentProject } = useAppStore()
  const [records, setRecords] = useState([])
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    fetchRecords(currentProjectId).then((list) => {
      setRecords(list)
      setActiveId(list[0]?.id ?? null)
    })
  }, [currentProjectId])

  const active = records.find((r) => r.id === activeId)

  return (
    <section>
      <PageHeader
        eyebrow="实验记录"
        title="当前项目实验记录"
        description="以当前项目为上下文管理实验记录；可切换项目，并按目录结构查看、编辑具体记录。"
        actions={
          <Button icon={Plus} onClick={() => navigate('/records/new')}>
            新建实验记录
          </Button>
        }
      />

      {/* 项目切换栏 */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-card">
        <div className="min-w-[260px] flex-1 sm:max-w-md">
          <label className="field-label" htmlFor="record-project-switch">
            切换项目
          </label>
          <select
            id="record-project-switch"
            value={currentProjectId}
            onChange={(e) => setCurrentProject(e.target.value)}
            className="input h-10 cursor-pointer"
          >
            {mockProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2.5">
          <Button
            variant="secondary"
            icon={LayoutGrid}
            onClick={() => navigate(`/projects/${currentProjectId}`)}
          >
            项目概览
          </Button>
          <Button variant="secondary" icon={Download}>
            导出目录
          </Button>
        </div>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[320px,minmax(0,1fr)]">
        {/* 记录目录 */}
        <Surface
          title="记录目录"
          extra={<Badge tone="blue">{records.length}</Badge>}
          className="xl:sticky xl:top-24"
        >
          {/* TODO: 接入目录搜索 / 状态筛选 */}
          <div className="mb-4 space-y-2.5">
            <div className="relative">
              <Search
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                placeholder="搜索记录"
                aria-label="实验记录目录搜索"
                className="input h-9 pl-9 text-[13px]"
              />
            </div>
            <select className="input h-9 cursor-pointer text-[13px]" aria-label="按状态筛选记录">
              <option>全部状态</option>
              <option>草稿</option>
              <option>进行中</option>
              <option>待审核</option>
              <option>已完成</option>
            </select>
          </div>
          <RecordTree records={records} activeId={activeId} onSelect={(r) => setActiveId(r.id)} />
        </Surface>

        {/* 记录预览 */}
        <Surface>
          {active ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-slate-900">{active.title}</h2>
                  <p className="mt-1 text-xs text-slate-500">
                    所属项目：{active.projectName} · {active.code} · 最近修改 {active.updatedAt}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2.5">
                  <Button variant="secondary" onClick={() => navigate(`/records/${active.id}`)}>
                    查看
                  </Button>
                  <Button onClick={() => navigate(`/records/${active.id}/edit`)}>编辑</Button>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 px-4 py-3">
                  <div className="text-xs text-slate-500">实验类型</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">
                    {active.experimentType}
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-3">
                  <div className="text-xs text-slate-500">状态</div>
                  <div className="mt-1.5">
                    <StatusBadge kind="record" status={active.status} />
                  </div>
                </div>
                <div className="rounded-lg bg-slate-50 px-4 py-3">
                  <div className="text-xs text-slate-500">负责人</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{active.ownerName}</div>
                </div>
              </div>

              {/* 预览区占位，真实内容来自记录详情接口 */}
              <div className="mt-5 space-y-4">
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">实验目的</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    以 Sample-001 为模板扩增 GFP 目标片段，为后续酶切连接和融合蛋白表达验证提供片段。
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 p-4">
                  <h3 className="text-sm font-semibold text-slate-900">关键结果</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                    退火温度 58℃，循环 35 次，电泳检测观察到约 750 bp 条带；附件包含凝胶图和原始仪器截图。
                  </p>
                </div>
              </div>
            </>
          ) : (
            <EmptyState
              icon={NotebookPen}
              title="当前项目暂无实验记录"
              description="创建第一条实验记录，开始规范记录你的实验过程。"
              action={
                <Button icon={Plus} onClick={() => navigate('/records/new')}>
                  新建实验记录
                </Button>
              }
            />
          )}
        </Surface>
      </div>
    </section>
  )
}
