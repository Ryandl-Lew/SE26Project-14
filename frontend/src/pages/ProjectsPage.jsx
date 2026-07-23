/**
 * 项目管理 Projects（新设计）
 * 项目卡片列表 + 筛选栏。
 */
import { useEffect, useMemo, useState } from 'react'
import { FolderSearch, Plus, Search } from 'lucide-react'
import { Button, EmptyState, PageHeader } from '@/components/ui'
import ProjectCard from '@/components/project/ProjectCard'
import { fetchProjects } from '@/api'
import { useAppStore } from '@/store/appStore'

function LegacyProjectsPage() {
  const [projects, setProjects] = useState([])
  const setCurrentProject = useAppStore((s) => s.setCurrentProject)

  useEffect(() => {
    fetchProjects().then(setProjects)
  }, [])

  return (
    <section>
      <PageHeader
        eyebrow="项目管理"
        title="项目列表与进度"
        description="查看、新建、搜索、编辑和归档项目；进入项目后查看概览、时间线和成员。"
        actions={
          <Button icon={Plus}>新建项目</Button>
        }
      />

      {/* 筛选栏 TODO: 接入真实筛选逻辑 */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[240px] flex-1 sm:max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            placeholder="搜索项目名称或编号…"
            aria-label="项目搜索"
            className="input h-10 pl-9"
          />
        </div>
        <select className="input h-10 w-40 cursor-pointer" aria-label="按状态筛选">
          <option>全部状态</option>
          <option>进行中</option>
          <option>已完成</option>
          <option>暂停</option>
        </select>
        <select className="input h-10 w-40 cursor-pointer" aria-label="按负责人筛选">
          <option>全部负责人</option>
          <option>李同学</option>
          <option>张老师</option>
        </select>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {projects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onSetCurrent={(p) => setCurrentProject(p.id)}
          />
        ))}
      </div>
    </section>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchProjects().then(setProjects)
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
          {visible.map((project) => <ProjectCard key={project.id} project={project} />)}
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
              <div><label className="field-label">项目名称</label><input className="input" placeholder="输入项目名称" /></div>
              <div><label className="field-label">项目简介</label><textarea className="input min-h-28" placeholder="说明项目目标、范围与预期成果" /></div>
            </div>
            <div className="mt-6 flex justify-end gap-2.5">
              <Button variant="secondary" onClick={() => setShowCreate(false)}>取消</Button>
              <Button onClick={() => setShowCreate(false)}>创建项目</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
