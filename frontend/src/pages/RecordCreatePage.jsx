import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, ArrowRight, FilePlus2, FolderKanban, LayoutTemplate } from 'lucide-react'
import { Badge, Button, PageHeader } from '@/components/ui'
import { fetchProjects, fetchTemplates, fetchFavoriteTemplateIds } from '@/api'

export default function RecordCreatePage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [templates, setTemplates] = useState([])
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [projectId, setProjectId] = useState('')
  const [source, setSource] = useState('blank')
  const [templateId, setTemplateId] = useState('')

  useEffect(() => {
    fetchProjects().then((items) => {
      const available = items.filter(
        (project) =>
          (project.status === 'active' || project.status === 'in_progress') &&
          project.currentUserRole !== 'reviewer',
      )
      setProjects(available)
      setProjectId(available[0]?.id ?? '')
    })
    fetchTemplates()
      .then((tmpls) => setTemplates(tmpls ?? []))
      .catch(() => setTemplates([]))
    fetchFavoriteTemplateIds()
      .then((favIds) => setFavoriteIds(new Set(favIds ?? [])))
      .catch(() => setFavoriteIds(new Set()))
  }, [])

  const selectedProject = projects.find((project) => project.id === projectId)
  const selectedTemplate = templates.find((template) => template.id === templateId)
  const canContinue = projectId && (source === 'blank' || templateId)

  const continueToEditor = () => {
    if (!canContinue) return
    const query = new URLSearchParams({ project: projectId, source })
    if (source === 'template') query.set('template', templateId)
    navigate(`/records/new/edit?${query.toString()}`)
  }

  const templateGroups = useMemo(
    () => {
      const myTemplates = templates.filter(
        (t) => t.scope === 'personal' || favoriteIds.has(t.id),
      )
      return [{ label: '我的模板', items: myTemplates }]
    },
    [templates, favoriteIds],
  )

  return (
    <section>
      <button
        type="button"
        onClick={() => navigate('/records')}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-brand-600"
      >
        <ArrowLeft size={15} />返回记录工作区
      </button>

      <PageHeader
        eyebrow="新建实验记录"
        title="选择项目与记录结构"
        description="先确定记录所属项目及结构来源，进入编辑器后所属项目和模板结构将不再更改。"
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.8fr),minmax(0,1.2fr)]">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <FolderKanban size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">1. 选择所属项目</h2>
              <p className="mt-0.5 text-xs text-slate-500">仅展示你有权创建记录的进行中项目</p>
            </div>
          </div>

          <div className="mt-5 space-y-2.5">
            {projects.map((project) => {
              const active = project.id === projectId
              return (
                <button
                  key={project.id}
                  type="button"
                  onClick={() => setProjectId(project.id)}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    active
                      ? 'border-brand-300 bg-brand-50 ring-1 ring-brand-100'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-900">{project.name}</span>
                    {active && <Badge tone="blue">已选择</Badge>}
                  </div>
                  <p className="mt-1 font-mono text-xs text-slate-400">{project.code}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                    {project.description}
                  </p>
                </button>
              )
            })}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <LayoutTemplate size={18} />
            </span>
            <div>
              <h2 className="text-base font-semibold text-slate-900">2. 选择记录结构</h2>
              <p className="mt-0.5 text-xs text-slate-500">使用空白记录，或复制模板字段快照</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setSource('blank')
              setTemplateId('')
            }}
            className={`mt-5 flex w-full items-start gap-4 rounded-xl border p-4 text-left transition-colors ${
              source === 'blank'
                ? 'border-brand-300 bg-brand-50 ring-1 ring-brand-100'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-brand-600 shadow-card">
              <FilePlus2 size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="font-medium text-slate-900">空白记录</span>
                {source === 'blank' && <Badge tone="blue">已选择</Badge>}
              </span>
              <span className="mt-1 block text-xs leading-5 text-slate-500">
                仅包含系统固定必填字段和自由正文编辑区。
              </span>
            </span>
          </button>

          <div className="mt-5 space-y-5">
            {templateGroups.map((group) => (
              <div key={group.label}>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {group.label}
                </h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {group.items.map((template) => {
                    const active = source === 'template' && template.id === templateId
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => {
                          setSource('template')
                          setTemplateId(template.id)
                        }}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          active
                            ? 'border-violet-300 bg-violet-50 ring-1 ring-violet-100'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-medium text-slate-900">
                            {template.name}
                          </span>
                          {active && <Badge tone="violet">已选择</Badge>}
                        </div>
                        <p className="mt-1 text-xs text-slate-400">
                          {template.experimentType} · {template.fields.length} 个字段
                        </p>
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">
                          {template.description}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="sticky bottom-4 mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white/95 px-5 py-4 shadow-pop backdrop-blur">
        <div className="text-sm text-slate-500">
          <span className="font-medium text-slate-900">{selectedProject?.name ?? '未选择项目'}</span>
          <span className="mx-2 text-slate-300">/</span>
          {source === 'blank' ? '空白记录' : selectedTemplate?.name ?? '未选择模板'}
        </div>
        <Button icon={ArrowRight} disabled={!canContinue} onClick={continueToEditor}>
          进入记录编辑器
        </Button>
      </div>
    </section>
  )
}
