/**
 * 搜索中心 Search
 * 明确区分「全局搜索 / 当前项目内搜索」；结果展示对象类型、所属上下文、
 * 命中摘要与可执行操作。筛选条件目前为原型占位（search API 仍返回 mock）。
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FolderOpen, Globe2, Search as SearchIcon } from 'lucide-react'
import { PageHeader, Surface, Badge, EmptyState, Icon } from '@/components/ui'
import { SEARCH_ENTITY_LABELS, SEARCH_ENTITY_TONES } from '@/domain'
import { search } from '@/api'
import { useAppStore } from '@/store/appStore'
import './search.css'

/** 各对象类型的去向（搜索 API 为 mock，命中项先映射到原型目标） */
const HIT_ACTIONS = {
  record: { label: '查看记录', to: () => '/records/r-001' },
  project: { label: '进入项目', to: () => '/projects/p-001' },
  template: { label: '查看模板', to: () => '/templates' },
  member: { label: '查看成员', to: () => '/team' },
  attachment: { label: '定位附件', to: () => '/projects/p-001' },
}

export default function SearchPage() {
  const navigate = useNavigate()
  const { searchKeyword, setSearchKeyword } = useAppStore()
  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const projects = useAppStore((s) => s.projects)
  const currentProject = projects.find((p) => p.id === currentProjectId)

  const [hits, setHits] = useState([])
  const [loading, setLoading] = useState(true)
  const [scope, setScope] = useState('all') // all | project
  const [activeType, setActiveType] = useState('all')

  useEffect(() => {
    setLoading(true)
    search({
      keyword: searchKeyword,
      projectId: scope === 'project' ? currentProjectId : undefined,
    }).then((list) => {
      setHits(list)
      setLoading(false)
    })
  }, [searchKeyword, scope, currentProjectId])

  const visible = useMemo(
    () => (activeType === 'all' ? hits : hits.filter((h) => h.entityType === activeType)),
    [hits, activeType],
  )

  const typeCounts = useMemo(() => {
    const counts = {}
    for (const h of hits) counts[h.entityType] = (counts[h.entityType] ?? 0) + 1
    return counts
  }, [hits])

  return (
    <section>
      <PageHeader
        eyebrow="全局搜索"
        title="搜索"
        description="跨项目、实验记录、模板、成员和附件检索内容。"
      />

      <div className="search-bar" role="search">
        <div className="records-search" style={{ flex: '1 1 auto' }}>
          <Icon name={SearchIcon} size={15} />
          <input
            type="search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="输入关键词搜索…"
            aria-label="搜索关键词"
            style={{ height: 40 }}
          />
        </div>
        <div className="scope-toggle" role="group" aria-label="搜索范围">
          <button
            type="button"
            className={scope === 'all' ? 'active' : ''}
            onClick={() => setScope('all')}
          >
            <Icon name={Globe2} size={14} />
            全部项目
          </button>
          <button
            type="button"
            className={scope === 'project' ? 'active' : ''}
            onClick={() => setScope('project')}
            disabled={!currentProject}
            title={currentProject ? `仅在「${currentProject.name}」内搜索` : '暂无当前项目'}
          >
            <Icon name={FolderOpen} size={14} />
            当前项目
          </button>
        </div>
      </div>

      {scope === 'project' && currentProject && (
        <p className="muted small" style={{ margin: '0 0 12px' }}>
          搜索范围：{currentProject.name}（{currentProject.code}）
        </p>
      )}

      <div className="result-tabs" role="tablist" aria-label="结果类型">
        <button
          role="tab"
          aria-selected={activeType === 'all'}
          className={`tab-chip ${activeType === 'all' ? 'active' : ''}`.trim()}
          onClick={() => setActiveType('all')}
        >
          全部 {hits.length}
        </button>
        {Object.entries(SEARCH_ENTITY_LABELS).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={activeType === key}
            className={`tab-chip ${activeType === key ? 'active' : ''}`.trim()}
            onClick={() => setActiveType(key)}
          >
            {label} {typeCounts[key] ?? 0}
          </button>
        ))}
      </div>

      <Surface>
        {loading ? (
          <div className="loading-line">
            <span className="spinner" />
            搜索中…
          </div>
        ) : visible.length ? (
          <div className="stack">
            {visible.map((hit) => {
              const action = HIT_ACTIONS[hit.entityType]
              return (
                <div className="list-item" key={hit.id}>
                  <div className="list-item-title">
                    <span>{hit.title}</span>
                    <Badge tone={SEARCH_ENTITY_TONES[hit.entityType]}>
                      {SEARCH_ENTITY_LABELS[hit.entityType]}
                    </Badge>
                  </div>
                  <div className="muted small">{hit.snippet}</div>
                  {action && (
                    <div className="card-actions" style={{ marginTop: 4 }}>
                      <button
                        className="link-btn"
                        onClick={() => navigate(action.to(hit))}
                      >
                        {action.label} →
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <EmptyState
            icon={SearchIcon}
            title="没有找到相关内容"
            description="换个关键词，或切换到「全部项目」范围再试。"
          />
        )}
      </Surface>
    </section>
  )
}
