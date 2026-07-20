/**
 * 项目列表 Projects
 * 紧凑、可扫描的项目列表：状态、负责人、进度、记录数、更新时间一目了然。
 * 支持本地搜索 / 状态筛选与新建项目（调用 createProject，mock 原型）。
 */
import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { PageHeader, Surface, EmptyState, Icon, useToast } from '@/components/ui'
import ProjectRow from '@/components/project/ProjectCard'
import { createProject, fetchProjects } from '@/api'
import { PROJECT_STATUS_LABELS } from '@/domain'
import { useAppStore } from '@/store/appStore'

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS)

export default function ProjectsPage() {
  const toast = useToast()
  const setCurrentProject = useAppStore((s) => s.setCurrentProject)
  const [projects, setProjects] = useState([])
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('all')
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchProjects().then(setProjects)
  }, [])

  const visible = useMemo(
    () =>
      projects.filter(
        (p) =>
          (status === 'all' || p.status === status) &&
          (!keyword.trim() ||
            p.name.includes(keyword.trim()) ||
            p.code.includes(keyword.trim()) ||
            p.description.includes(keyword.trim())),
      ),
    [projects, keyword, status],
  )

  const submitCreate = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const created = await createProject({
        name: form.name.trim(),
        description: form.description.trim(),
      })
      setProjects((list) => [created, ...list])
      setCreating(false)
      setForm({ name: '', description: '' })
      toast(`项目「${created.name}」已创建（原型数据，刷新后还原）`)
    } catch {
      toast('创建失败，请重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <PageHeader
        eyebrow="项目"
        title="项目列表"
        description="项目是所有实验记录的容器。选择一个项目进入工作区，或创建新项目。"
        actions={
          <button className="primary-btn" onClick={() => setCreating((v) => !v)}>
            <Icon name={Plus} size={15} />
            新建项目
          </button>
        }
      />

      {creating && (
        <Surface title="新建项目" style={{ marginBottom: 16 }}>
          <form className="project-create-form" onSubmit={submitCreate}>
            <div className="field">
              <label htmlFor="project-name">项目名称</label>
              <input
                id="project-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="如：GFP 融合蛋白表达项目"
                required
                autoFocus
              />
            </div>
            <div className="field">
              <label htmlFor="project-desc">项目描述</label>
              <input
                id="project-desc"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="一句话说明项目目标"
              />
            </div>
            <div className="card-actions">
              <button className="primary-btn" type="submit" disabled={submitting}>
                {submitting ? '创建中…' : '创建项目'}
              </button>
              <button
                className="secondary-btn"
                type="button"
                onClick={() => setCreating(false)}
              >
                取消
              </button>
            </div>
          </form>
        </Surface>
      )}

      <div className="filters" role="search">
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
          <span style={{ position: 'absolute', left: 10, display: 'inline-flex', color: 'var(--muted)' }}>
            <Icon name={Search} size={14} />
          </span>
          <input
            type="search"
            style={{ paddingLeft: 32 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索项目名称、编号或描述"
            aria-label="搜索项目"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="按状态筛选"
        >
          <option value="all">全部状态</option>
          {STATUS_OPTIONS.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {visible.length ? (
        <div className="project-list">
          {visible.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              onSetCurrent={(p) => setCurrentProject(p.id)}
            />
          ))}
        </div>
      ) : (
        <Surface>
          <EmptyState
            title="没有匹配的项目"
            description="调整搜索或筛选条件，或创建一个新项目。"
          />
        </Surface>
      )}
    </section>
  )
}
