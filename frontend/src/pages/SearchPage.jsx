/**
 * 搜索中心 SearchPage
 *
 * 对接到后端 GET /api/v1/search，支持：
 * - 全局搜索（所有可访问项目）与项目内搜索
 * - 关键词 <em> 高亮渲染
 * - 分页加载（Load More + IntersectionObserver 自动触发）
 * - URL Query 双向同步（?q=keyword&projectId=...）
 *
 * 实体类型映射：
 *   PROJECT → 📁 项目（violet）  RECORD → 🧪 实验记录（green）
 *   FILE   → 📎 文件（blue）     TEMPLATE → 📋 模板（amber）
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader, Surface, Badge } from '@/components/ui'
import { SEARCH_ENTITY_LABELS, SEARCH_ENTITY_TONES, SEARCH_ENTITY_ICONS } from '@/domain'
import { globalSearch } from '@/api/search'
import './search.css'

// ──────────────────────────────────────────────
// 常量
// ──────────────────────────────────────────────

/** 每页条数 */
const PAGE_SIZE = 20

/** Mock 项目列表（TODO: 替换为真实项目列表 API） */
const MOCK_PROJECTS = [
  { id: '', label: '全部项目' },
  { id: 'p-001', label: 'GFP 融合蛋白表达项目' },
  { id: 'p-002', label: 'IFN-β 表达检测' },
  { id: 'p-003', label: '细胞转染条件优化' },
]

// ──────────────────────────────────────────────
// 组件
// ──────────────────────────────────────────────

export default function SearchPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  // ── 状态 ──
  const [keyword, setKeyword] = useState(searchParams.get('q') || '')
  const [projectId, setProjectId] = useState(searchParams.get('projectId') || '')
  const [hits, setHits] = useState([])
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  // 输入框 ref
  const inputRef = useRef(null)
  // Load More 哨兵 ref
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

  // ── IntersectionObserver：Load More 按钮进入视口时自动加载 ──
  useEffect(() => {
    if (page + 1 >= totalPages) return // 没有更多页

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

  /** 触发搜索（重置到第一页） */
  const handleSearch = (e) => {
    e?.preventDefault()
    if (!keyword.trim()) return

    // 同步 URL Query
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

  /** 回车触发搜索 */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  /** 项目过滤变更 */
  const handleProjectChange = (e) => {
    const newPid = e.target.value
    setProjectId(newPid)

    if (keyword.trim()) {
      // 切换项目过滤时立即重新搜索
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

  /** 点击列表项跳转 */
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

  /** Load More 手动点击 */
  const handleLoadMore = () => {
    if (page + 1 < totalPages && !loading) {
      doSearch(keyword, projectId || null, page + 1, true)
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
        title="全局搜索"
        description="跨项目、实验记录和文件附件进行关键词检索。"
      />

      {/* ── 搜索栏 ── */}
      <Surface className="search-bar-panel">
        <form className="search-bar-form" onSubmit={handleSearch}>
          <div className="search-input-wrap">
            <span className="search-icon" aria-hidden="true">
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
              placeholder="输入关键词搜索项目、实验记录或文件…"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            {keyword && (
              <button
                type="button"
                className="search-clear"
                onClick={() => {
                  setKeyword('')
                  inputRef.current?.focus()
                }}
                aria-label="清除搜索词"
              >
                ✕
              </button>
            )}
          </div>

          <div className="search-bar-filters">
            <select
              className="project-filter-select"
              value={projectId}
              onChange={handleProjectChange}
            >
              {MOCK_PROJECTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>

            <button type="submit" className="primary-btn search-btn" disabled={loading}>
              {loading ? '搜索中…' : '搜索'}
            </button>
          </div>
        </form>
      </Surface>

      {/* ── 状态信息 ── */}
      {searched && !loading && !error && (
        <div className="search-status">
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
            <span>未找到与「<strong>{keyword}</strong>」相关的结果</span>
          )}
        </div>
      )}

      {/* ── 错误提示 ── */}
      {error && (
        <div className="search-error">
          <span className="search-error-icon">⚠</span>
          <span>{error}</span>
          <button className="link-btn" onClick={() => doSearch(keyword, projectId || null, 0, false)}>
            重试
          </button>
        </div>
      )}

      {/* ── 首次加载提示 ── */}
      {!searched && !loading && !error && (
        <Surface className="search-placeholder">
          <div className="search-placeholder-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                 className="search-placeholder-svg">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <p className="search-placeholder-title">输入关键词开始搜索</p>
          <p className="muted small">
            支持搜索项目名称、实验记录标题与内容、文件附件名称
          </p>
        </Surface>
      )}

      {/* ── 加载骨架 ── */}
      {loading && hits.length === 0 && (
        <div className="search-loading-skeleton">
          {[1, 2, 3, 4, 5].map((n) => (
            <Surface key={n} className="skeleton-item">
              <div className="skeleton-line skeleton-title" />
              <div className="skeleton-line skeleton-text" />
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
              className="search-hit-item"
              onClick={() => handleItemClick(hit)}
              role="link"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleItemClick(hit)
              }}
            >
              <div className="search-hit-header">
                <span className="search-hit-icon" aria-hidden="true">
                  {SEARCH_ENTITY_ICONS[hit.entityType] || '🔍'}
                </span>
                <span className="search-hit-title">{hit.title}</span>
                <Badge tone={SEARCH_ENTITY_TONES[hit.entityType] || 'gray'}>
                  {SEARCH_ENTITY_LABELS[hit.entityType] || hit.entityType}
                </Badge>
              </div>

              {hit.snippet && (
                <div
                  className="search-hit-snippet"
                  dangerouslySetInnerHTML={{ __html: hit.snippet }}
                />
              )}

              <div className="search-hit-footer">
                <span className="muted small">{hit.targetUrl}</span>
                {hit.updatedAt && (
                  <span className="muted small">
                    {new Date(hit.updatedAt).toLocaleString('zh-CN')}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* ── Load More 哨兵 ── */}
          {showSentinel && (
            <div ref={sentinelRef} className="search-load-more-wrap">
              <button
                className="secondary-btn"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? '加载中…' : `加载更多 (${total - hits.length} 条剩余)`}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── 追加加载中的指示器 ── */}
      {loading && hits.length > 0 && (
        <div className="search-loading-more">
          <span className="search-spinner" />
          <span className="muted">正在加载更多结果…</span>
        </div>
      )}
    </section>
  )
}
