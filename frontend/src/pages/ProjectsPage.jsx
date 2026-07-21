/**
 * 项目管理 Projects（新设计）
 * 项目卡片列表 + 筛选栏。
 */
import { useEffect, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { Button, PageHeader } from '@/components/ui'
import ProjectCard from '@/components/project/ProjectCard'
import { fetchProjects } from '@/api'
import { useAppStore } from '@/store/appStore'

export default function ProjectsPage() {
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
