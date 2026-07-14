/**
 * 搜索中心 Search
 * 左侧高级筛选 + 右侧结果分类标签 + 命中列表。
 */
import { useEffect, useMemo, useState } from 'react'
import { PageHeader, Surface, Badge } from '@/components/ui'
import { SEARCH_ENTITY_LABELS, SEARCH_ENTITY_TONES } from '@/domain'
import { search } from '@/api'
import { useAppStore } from '@/store/appStore'
import './search.css'

export default function SearchPage() {
  const keyword = useAppStore((s) => s.searchKeyword)
  const [hits, setHits] = useState([])
  const [activeType, setActiveType] = useState('all')

  useEffect(() => {
    // TODO: 将左侧筛选条件一并传入 search()
    search({ keyword }).then(setHits)
  }, [keyword])

  const visible = useMemo(
    () => (activeType === 'all' ? hits : hits.filter((h) => h.entityType === activeType)),
    [hits, activeType],
  )

  const tabs = [
    { key: 'all', label: `全部 ${hits.length}` },
    ...Object.entries(SEARCH_ENTITY_LABELS).map(([key, label]) => ({
      key,
      label: `${label} ${hits.filter((h) => h.entityType === key).length}`,
    })),
  ]

  return (
    <section>
      <PageHeader
        eyebrow="搜索中心"
        title="全局搜索结果"
        description="跨项目、实验记录、模板、成员和附件检索相关内容。"
      />

      <div className="search-layout">
        <aside className="surface">
          <h2>高级筛选</h2>
          {/* TODO: 表单值联动到 search() 参数 */}
          <div className="stack">
            <div className="field">
              <label>关键词</label>
              <input defaultValue={keyword} />
            </div>
            <div className="field">
              <label>对象类型</label>
              <select>
                <option>全部</option>
                {Object.values(SEARCH_ENTITY_LABELS).map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>负责人</label>
              <select>
                <option>全部</option>
                <option>李同学</option>
                <option>王同学</option>
              </select>
            </div>
            <div className="field">
              <label>状态</label>
              <select>
                <option>全部状态</option>
                <option>待审核</option>
                <option>已完成</option>
              </select>
            </div>
            <button className="primary-btn">搜索</button>
          </div>
        </aside>

        <Surface>
          <div className="result-tabs">
            {tabs.map((t) => (
              <button
                key={t.key}
                className={`tab-btn ${t.key === activeType ? 'active' : ''}`.trim()}
                onClick={() => setActiveType(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <div className="stack">
            {visible.map((hit) => (
              <div className="list-item" key={hit.id}>
                <div className="list-item-title">
                  <span>{hit.title}</span>
                  <Badge tone={SEARCH_ENTITY_TONES[hit.entityType]}>
                    {SEARCH_ENTITY_LABELS[hit.entityType]}
                  </Badge>
                </div>
                <div className="muted small">{hit.snippet}</div>
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </section>
  )
}
