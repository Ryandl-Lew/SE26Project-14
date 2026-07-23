import { useEffect, useMemo, useState } from 'react'
import { FolderSearch, Plus, Search, Loader2 } from 'lucide-react'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import ProjectCard from '@/components/project/ProjectCard'
import { createProject, fetchProjects } from '@/api'

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const loadProjects = () => {
    fetchProjects().then(setProjects).catch(() => {})
  }

  useEffect(() => {
    loadProjects()
  }, [])

  const visible = useMemo(() => {
    const normalized = keyword.trim().toLowerCase()
    return projects.filter((project) => {
      const matchesKeyword =
        !normalized ||
        project.name.toLowerCase().includes(normalized) ||
        project.code.toLowerCase().includes(normalized)
      return matchesKeyword && (status === 'all' || project.status === status)
    })
  }, [keyword, projects, status])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createProject({ name: newName.trim(), description: newDescription.trim() })
      setShowCreate(false)
      setNewName('')
      setNewDescription('')
      loadProjects()
    } catch {
      // silently fail
    } finally {
      setCreating(false)
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="项目管理"
        title="参与的项目"
        description="查看你作为负责人、编辑成员或审核者参与的全部项目。"
        actions={<Button icon={Plus} onClick={() => setShowCreate(true)}>新建项目</Button>}
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-card">
        <div className="relative min-w-[240px] flex-1 sm:max-w-md">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="search" value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="搜索项目名称或编号…" aria-label="项目搜索" className="input h-10 pl-9" />
        </div>
        <select value={status} onChange={(event) => setStatus(event.target.value)} className="input h-10 w-40 cursor-pointer" aria-label="按状态筛选">
          <option value="all">全部状态</option>
          <option value="active">进行中</option>
          <option value="archived">已归档</option>
        </select>
        <span className="ml-auto text-xs text-slate-400">共 {visible.length} 个项目</span>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <EmptyState icon={FolderSearch} title="没有匹配的项目" description="尝试更换关键词或状态筛选。" />
      )}

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-pop animate-scale-in">
            <h2 className="text-lg font-semibold text-slate-900">新建项目</h2>
            <p className="mt-1 text-sm text-slate-500">创建后你将自动成为该项目负责人。</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="field-label">项目名称</label>
                <input
                  className="input"
                  placeholder="输入项目名称"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="field-label">项目简介</label>
                <textarea
                  className="input min-h-28"
                  placeholder="说明项目目标、范围与预期成果"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
              <Button onClick={handleCreate} disabled={creating || !newName.trim()}>
                {creating && <Loader2 size={16} className="mr-1.5 animate-spin" />}
                {creating ? '创建中…' : '创建项目'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
