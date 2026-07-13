/**
 * 项目管理 Projects
 * 项目卡片列表 + 筛选栏。
 */
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/ui'
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
        actions={<button className="primary-btn">＋ 新建项目</button>}
      />

      {/* TODO: 接入真实筛选逻辑 */}
      <div className="filters">
        <input type="search" placeholder="搜索项目" aria-label="项目搜索" />
        <select>
          <option>全部状态</option>
          <option>进行中</option>
          <option>已完成</option>
          <option>暂停</option>
        </select>
        <select>
          <option>全部负责人</option>
          <option>李同学</option>
          <option>张老师</option>
        </select>
      </div>

      <div className="project-grid">
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
