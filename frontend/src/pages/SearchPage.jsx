/**
 * 搜索中心 Search（重设计）
 * Spotlight 式居中搜索：大搜索框 + 类型筛选 + 可折叠高级筛选 + 结果列表。
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  FolderKanban,
  NotebookPen,
  LayoutTemplate,
  User,
  Paperclip,
  ChevronRight,
} from 'lucide-react'
import { Button, Badge, Tabs, EmptyState } from '@/components/ui'
import { SEARCH_ENTITY_LABELS, SEARCH_ENTITY_TONES } from '@/domain'
import { search } from '@/api'
import { useAppStore } from '@/store/appStore'

/** 结果类型 → 图标与跳转路径 */
const ENTITY_CONFIG = {
  project: { icon: FolderKanban, path: '/projects' },
  record: { icon: NotebookPen, path: '/records' },
  template: { icon: LayoutTemplate, path: '/templates' },
  member: { icon: User, path: '/team' },
  attachment: { icon: Paperclip, path: null },
}

const ENTITY_ICON_TONES = {
  project: 'bg-violet-50 text-violet-600',
  record: 'bg-amber-50 text-amber-600',
  template: 'bg-emerald-50 text-emerald-600',
  member: 'bg-brand-50 text-brand-600',
  attachment: 'bg-slate-100 text-slate-500',
}

export default function SearchPage() {
  const navigate = useNavigate()
  const { searchKeyword, setSearchKeyword } = useAppStore()
  const [hits, setHits] = useState([])
  const [activeType, setActiveType] = useState('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    // TODO: 将高级筛选条件一并传入 search()
    search({ keyword: searchKeyword }).then(setHits)
  }, [searchKeyword])

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
      <div className="mx-auto max-w-3xl">
        {/* 大搜索框 */}
        <div className="relative">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="搜索项目、实验记录、模板、成员、附件…"
            aria-label="全局搜索"
            autoFocus
            className="w-full rounded-xl border border-slate-300 bg-white py-3.5 pl-11 pr-28 text-[15px] text-slate-900 shadow-card outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:shadow-glow"
          />
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className={`absolute right-2.5 top-1/2 flex h-9 -translate-y-1/2 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors ${
              showFilters ? 'bg-brand-50 text-brand-700' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <SlidersHorizontal size={15} />
            高级筛选
          </button>
        </div>

        {/* 高级筛选（可折叠）TODO: 表单值联动到 search() 参数 */}
        {showFilters && (
          <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-card animate-fade-in sm:grid-cols-3">
            <div>
              <label className="field-label">对象类型</label>
              <select className="input h-10 cursor-pointer">
                <option>全部</option>
                {Object.values(SEARCH_ENTITY_LABELS).map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label">负责人</label>
              <select className="input h-10 cursor-pointer">
                <option>全部</option>
                <option>李同学</option>
                <option>王同学</option>
              </select>
            </div>
            <div>
              <label className="field-label">状态</label>
              <select className="input h-10 cursor-pointer">
                <option>全部状态</option>
                <option>待审核</option>
                <option>已完成</option>
              </select>
            </div>
          </div>
        )}

        {/* 类型筛选 */}
        <div className="mt-5">
          <Tabs items={tabs} activeKey={activeType} onChange={setActiveType} />
        </div>

        {/* 结果列表 */}
        <div className="mt-4 space-y-2.5">
          {visible.length > 0 ? (
            visible.map((hit) => {
              const config = ENTITY_CONFIG[hit.entityType] ?? {}
              const Icon = config.icon ?? Paperclip
              return (
                <button
                  key={hit.id}
                  type="button"
                  onClick={() => config.path && navigate(config.path)}
                  className="flex w-full items-center gap-4 rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-left shadow-card transition-all hover:border-brand-200 hover:shadow-pop"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${ENTITY_ICON_TONES[hit.entityType] ?? ENTITY_ICON_TONES.attachment}`}
                  >
                    <Icon size={17} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5">
                      <span className="truncate text-sm font-semibold text-slate-900">
                        {hit.title}
                      </span>
                      <Badge tone={SEARCH_ENTITY_TONES[hit.entityType]}>
                        {SEARCH_ENTITY_LABELS[hit.entityType]}
                      </Badge>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{hit.snippet}</p>
                  </div>
                  <ChevronRight size={16} className="shrink-0 text-slate-300" />
                </button>
              )
            })
          ) : (
            <EmptyState
              icon={Search}
              title="没有找到相关内容"
              description={`没有匹配「${searchKeyword}」的结果，试试更换关键词或调整筛选条件。`}
            />
          )}
        </div>
      </div>
    </section>
  )
}
