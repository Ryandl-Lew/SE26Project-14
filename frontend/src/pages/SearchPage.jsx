/**
 * 搜索中心 SearchPage — SaaS v2
 *
 * 对接到后端 GET /api/v1/search，支持：
 * - 全局搜索（所有可访问项目）与项目内搜索
 * - 关键词 <em> 高亮渲染
 * - 分页加载（Load More + IntersectionObserver 自动触发）
 * - URL Query 双向同步（?q=keyword&projectId=...）
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader, Surface, Badge } from '@/components/ui'
import { SEARCH_ENTITY_LABELS, SEARCH_ENTITY_TONES } from '@/domain'
import { globalSearch } from '@/api/search'
import './search.css'

// ──────────────────────────────────────────────
// 常量
// ──────────────────────────────────────────────

const PAGE_SIZE = 20

const MOCK_PROJECTS = [
  { id: '', label: '全部项目' },
  { id: 'p-001', label: 'GFP 融合蛋白表达项目' },
  { id: 'p-002', label: 'IFN-β 表达检测' },
  { id: 'p-003', label: '细胞转染条件优化' },
]

/** 实体类型 → SVG 图标 (用于列表项前缀) */
const ENTITY_ICON_SVG = {
  PROJECT: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
    </svg>
  ),
  RECORD: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  TEMPLATE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  FILE: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </svg>
  ),
}

// ──────────────────────────────────────────────
// 组件
// ──────────────────────────────────────────────

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── 状态（9 个核心 State，完整保留）──
  const [keyword, setKeyword] = useState(searchParams.get('q') || '')
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '')
  const [hits, setHits] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const inputRef = useRef(null)
  const sentinelRef = useRef(null)

  // ── 执行搜索 ──
  const doSearch = useCallback(
    async (kw, pid, pg = 0, append = false) => {
      if (!kw || !kw.trim()) return

      setLoading(true)
      setError(null)

      try {
        const result = await globalSearch(kw.trim(), pid || null, pg, PAGE_SIZE)
        if (append) {
          setHits((prev) => [...prev, ...result.items])
        } else {
          setHits(result.items)
        }
        setPage(pg)
        setTotal(result.total)
        setTotalPages(result.totalPages)
        setSearched(true)
      } catch (err) {
        setError(err.message || '搜索失败，请稍后重试')
        if (!append) setHits([])
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // ── 初始加载：URL 带有 ?q= 则自动搜索 ──
  useEffect(() => {
    const q = searchParams.get('q')
    if (q && q.trim()) {
      setKeyword(q.trim())
      const pid = searchParams.get('projectId') || ''
      setProjectId(pid)
      doSearch(q.trim(), pid, 0, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── IntersectionObserver：Load More 哨兵自动触发 ──
  useEffect(() => {
    if (page + 1 >= totalPages) return

    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loading && page + 1 < totalPages) {
          doSearch(keyword, projectId || null, page + 1, true)
        }
      },
      { rootMargin: '0px 0px 200px 0px' },
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [page, totalPages, loading, keyword, projectId, doSearch])

  // ── 事件处理 ──

  const handleSearch = (e) => {
    e?.preventDefault()
    if (!keyword.trim()) return

    const params = new URLSearchParams()
    params.set('q', keyword.trim())
    if (projectId) params.set('projectId', projectId)
    setSearchParams(params, { replace: true })

    setHits([])
    setPage(0)
    setTotal(0)
    setTotalPages(0)
    doSearch(keyword.trim(), projectId || null, 0, false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleProjectChange = (e) => {
    const newPid = e.target.value
    setProjectId(newPid)

    if (keyword.trim()) {
      const params = new URLSearchParams()
      params.set('q', keyword.trim())
      if (newPid) params.set('projectId', newPid)
      setSearchParams(params, { replace: true })

      setHits([])
      setPage(0)
      setTotal(0)
      setTotalPages(0)
      doSearch(keyword.trim(), newPid || null, 0, false)
    }
  }

  const resolveUrl = (hit) => {
    switch (hit.entityType) {
      case 'PROJECT':
        return `/projects/${hit.entityId}`
      case 'RECORD':
        return `/records/${hit.entityId}`
      case 'TEMPLATE':
        return '/templates'
      case 'FILE': {
        const match = hit.targetUrl?.match(
          /\/projects\/([^/]+)(?:\/records\/([^/]+))?/,
        )
        if (match) {
          if (match[2]) return `/records/${match[2]}`
          return `/projects/${match[1]}`
        }
        return hit.targetUrl || null
      }
      default:
        return hit.targetUrl || null
    }
  }

  const handleItemClick = (hit) => {
    const url = resolveUrl(hit)
    if (url) {
      navigate(url)
    }
  }

  const handleLoadMore = () => {
    if (page + 1 < totalPages && !loading) {
      doSearch(keyword, projectId || null, page + 1, true)
    }
  }

  const formatMetaTime = (iso) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return ''
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    } catch {
      return ''
    }
  }

  // ── 派生数据 ──
  const hasMore = page + 1 < totalPages
  const showSentinel = searched && hits.length > 0 && hasMore

  // ── 渲染 ──
  return (
    <section className="search-page">
      <PageHeader
        eyebrow="搜索中心"
        title="全局检索"
        description="跨项目、实验记录、附件和模板进行全文搜索"
      />

      {/* ── 搜索栏面板 ── */}
      <div className="search-panel">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-group">
            <span className="search-input-icon" aria-hidden="true">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              ref={inputRef}
              className="search-input"
              type="text"
              placeholder="搜索项目名称、实验记录、文件附件…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {keyword && (
              <button
                type="button"
                className="search-input-clear"
                onClick={() => {
                  setKeyword('')
                  inputRef.current?.focus()
                }}
                aria-label="清除搜索词"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>

          <div className="search-form-actions">
            <select
              className="search-project-select"
              value={projectId}
              onChange={handleProjectChange}
            >
              {MOCK_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <button type="submit" className="primary-btn search-submit-btn" disabled={loading}>
              {loading ? '搜索中…' : '搜索'}
            </button>
          </div>
        </form>
      </div>

      {/* ── 状态信息栏 ── */}
      {searched && !loading && !error && (
        <div className="search-meta">
          {hits.length > 0 ? (
            <span>
              共找到 <strong>{total}</strong> 条结果
              {totalPages > 1 && (
                <span className="muted">
                  &nbsp;· 第 {page + 1}/{totalPages} 页
                </span>
              )}
            </span>
          ) : (
            <span>未找到与 <strong>「{keyword}」</strong>相关的结果</span>
          )}
        </div>
      )}

      {/* ── 错误提示 ── */}
      {error && (
        <div className="search-error">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="search-error-icon">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>{error}</span>
          <button className="link-btn" onClick={() => doSearch(keyword, projectId || null, 0, false)}>
            重试
          </button>
        </div>
      )}

      {/* ── 初始空白态 ── */}
      {!searched && !loading && !error && (
        <div className="search-empty">
          <div className="search-empty-icon">
            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="search-empty-title">输入关键词开始搜索</p>
          <p className="search-empty-desc">支持搜索项目名称、实验记录标题与内容、文件附件名称</p>
        </div>
      )}

      {/* ── 加载骨架屏 ── */}
      {loading && hits.length === 0 && (
        <div className="search-skeleton">
          {[1, 2, 3, 4, 5].map((n) => (
            <Surface key={n} className="search-skeleton-item">
              <div className="skeleton-line skeleton-line--title" />
              <div className="skeleton-line skeleton-line--text" />
            </Surface>
          ))}
        </div>
      )}

      {/* ── 搜索结果列表 ── */}
      {hits.length > 0 && (
        <div className="search-results">
          {hits.map((hit, idx) => (
            <div
              key={`${hit.entityType}-${hit.entityId}-${idx}`}
              className="search-hit-card"
              onClick={() => handleItemClick(hit)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleItemClick(hit)
              }}
            >
              {/* 头部：实体图标 + 标题 + 类型徽章 */}
              <div className="search-hit-head">
                <span className={`search-hit-icon search-hit-icon--${SEARCH_ENTITY_TONES[hit.entityType] || 'gray'}`}>
                  {ENTITY_ICON_SVG[hit.entityType] || ENTITY_ICON_SVG.FILE}
                </span>
                <span className="search-hit-title">{hit.title}</span>
                <Badge tone={SEARCH_ENTITY_TONES[hit.entityType] || 'gray'}>
                  {SEARCH_ENTITY_LABELS[hit.entityType] || hit.entityType}
                </Badge>
              </div>

              {/* 摘要片段 (关键词高亮由后端注入 <em>) */}
              {hit.snippet && (
                <div
                  className="search-hit-snippet"
                  dangerouslySetInnerHTML={{ __html: hit.snippet }}
                />
              )}

              {/* 底部：路径 · 更新时间 */}
              <div className="search-hit-foot">
                {hit.targetUrl && (
                  <span className="search-hit-path">{hit.targetUrl}</span>
                )}
                {hit.updatedAt && (
                  <>
                    <span className="search-hit-sep">·</span>
                    <span className="search-hit-time">{formatMetaTime(hit.updatedAt)}</span>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* ── Load More 哨兵 ── */}
          {showSentinel && (
            <div ref={sentinelRef} className="search-loadmore">
              <button
                className="secondary-btn search-loadmore-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? '加载中…' : `加载更多 (${total - hits.length} 条剩余)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 加载更多中的指示器 ── */}
      {loading && hits.length > 0 && (
        <div className="search-loading-more">
          <span className="search-spinner" />
          <span className="muted">正在加载更多结果…</span>
        </div>
      )}
    </section>
  )
}
