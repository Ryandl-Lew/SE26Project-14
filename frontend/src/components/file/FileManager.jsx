/**
 * FileManager — 通用文件管理组件 (SaaS v2)
 *
 * 适用场景：项目详情页附件区 / 实验记录详情页附件区
 *
 * Props:
 *  - entityId      {string}  项目 ID 或记录 ID
 *  - entityType    {"project"|"record"}  实体类型
 *  - projectId     {string}  [entityType="record" 时必填] 所属项目 ID
 *  - compact       {boolean} [false] 紧凑模式 — 隐藏上传时间列，缩小间距
 *  - initialFiles  {Array}   已有的文件列表
 *      { id: string, name: string, size?: number, createdAt?: string, deleted?: boolean }
 *  - onFilesChange {(files: Array) => void} [可选]  列表变更回调
 *
 * 交互能力：
 *  1. 上传附件 — 选择文件 → 校验 → API 上传 → 进度条
 *  2. 点击预览 — 图片/PDF 弹窗内联预览
 *  3. 下载 — 调 downloadFile 触发浏览器下载
 *  4. 删除 — confirm → 软删除 → 列表移除
 *  5. 回收站 — 切换开关 → 灰色展示已删除文件 + 恢复按钮
 */
import { useRef, useState, useCallback } from 'react'
import {
  uploadProjectFile,
  uploadRecordAttachment,
  downloadFile,
  deleteFile,
  restoreFile,
  listProjectFiles,
  listRecordAttachments,
  previewFileUrl,
  formatFileSize,
} from '@/api/files'
import { toast } from '@/utils/toast'
import './file-manager.css'

/* ============================ 常量 ============================ */

const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.pdf', '.csv', '.xls', '.xlsx']
const MAX_SIZE = 20 * 1024 * 1024
const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'])
const PDF_EXT = '.pdf'

/* ============================ 辅助函数 ============================ */

function getIconType(name) {
  if (!name) return 'generic'
  const dotIdx = name.lastIndexOf('.')
  if (dotIdx < 0) return 'generic'
  const ext = name.slice(dotIdx).toLowerCase()
  if (ext === '.pdf') return 'pdf'
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) return 'image'
  if (['.xls', '.xlsx'].includes(ext)) return 'excel'
  if (ext === '.csv') return 'csv'
  if (['.zip', '.rar', '.7z', '.gz'].includes(ext)) return 'zip'
  return 'generic'
}

function getIconLabel(name) {
  if (!name) return '?'
  const dotIdx = name.lastIndexOf('.')
  if (dotIdx < 0) return name.slice(0, 4).toUpperCase()
  const ext = name.slice(dotIdx).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'JPG'
  return ext.replace('.', '').toUpperCase().slice(0, 4)
}

function formatTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return iso
  }
}

function isPreviewable(name) {
  if (!name) return false
  const dotIdx = name.lastIndexOf('.')
  if (dotIdx < 0) return false
  const ext = name.slice(dotIdx).toLowerCase()
  return IMAGE_EXTS.has(ext) || ext === PDF_EXT
}

function isImage(name) {
  if (!name) return false
  const dotIdx = name.lastIndexOf('.')
  if (dotIdx < 0) return false
  return IMAGE_EXTS.has(name.slice(dotIdx).toLowerCase())
}

/* ============================ 预览弹窗 ============================ */

function PreviewModal({ file, onClose }) {
  if (!file) return null

  const previewUrl = previewFileUrl(file.id)
  const img = isImage(file.name)

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') onClose()
  }

  return (
    <div
      className="fm-modal-overlay"
      onClick={handleOverlayClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="fm-modal-container">
        <div className="fm-modal-header">
          <span className="fm-modal-title" title={file.name}>
            {file.name}
          </span>
          <div className="fm-modal-actions">
            <button
              className="fm-modal-btn"
              title="下载"
              onClick={() => {
                downloadFile(file.id).catch((err) => {
                  const msg = err?.response?.data?.message ?? err.message ?? '下载失败'
                  toast(`下载失败：${msg}`, { type: 'error' })
                })
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载
            </button>
            <button
              className="fm-modal-btn"
              title="新窗口打开"
              onClick={() => window.open(previewUrl, '_blank')}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              新窗口
            </button>
            <button className="fm-modal-close" title="关闭 (Esc)" onClick={onClose}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
        <div className="fm-modal-body">
          {img ? (
            <img className="fm-modal-img" src={previewUrl} alt={file.name} />
          ) : (
            <iframe className="fm-modal-iframe" src={previewUrl} title={file.name} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ============================ 文件行子组件 ============================ */

function FileRow({ file, compact = false, isDeleted = false, onPreview, onDownload, onDelete, onRestore }) {
  const previewable = isPreviewable(file.name)

  const handleRowClick = () => {
    if (isDeleted) return
    if (previewable) onPreview(file)
    else onDownload(file)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleRowClick()
    }
  }

  /* tooltip 内容 */
  const tooltipLines = [file.name]
  if (file.size != null) tooltipLines.push(`大小：${formatFileSize(file.size)}`)
  if (file.createdAt) tooltipLines.push(`上传时间：${formatTime(file.createdAt)}`)

  const rowClass = [
    'fm-row',
    isDeleted ? 'fm-row--deleted' : '',
    !isDeleted && previewable ? 'fm-row--clickable' : '',
    compact ? 'fm-row--compact' : '',
  ].filter(Boolean).join(' ')

  return (
    <div
      className={rowClass}
      role={!isDeleted && previewable ? 'button' : undefined}
      tabIndex={!isDeleted && previewable ? 0 : undefined}
      onClick={!isDeleted && previewable ? handleRowClick : undefined}
      onKeyDown={!isDeleted && previewable ? handleKeyDown : undefined}
    >
      {/* 图标 */}
      <div className={`fm-cell fm-cell--icon fm-icon fm-icon--${getIconType(file.name)}${isDeleted ? ' fm-icon--deleted' : ''}`}>
        {getIconLabel(file.name)}
      </div>

      {/* 文件名（弹性列 + CSS tooltip） */}
      <span
        className={`fm-cell fm-cell--name${isDeleted ? ' fm-text--deleted' : ''}`}
        data-tooltip={tooltipLines.join('\n')}
      >
        <span className="fm-name-text">{file.name}</span>
        {isDeleted && <span className="fm-badge--deleted">已删除</span>}
      </span>

      {/* 文件大小 */}
      <span className={`fm-cell fm-cell--size${isDeleted ? ' fm-text--deleted' : ''}`}>
        {formatFileSize(file.size)}
      </span>

      {/* 上传时间（compact 模式隐藏） */}
      {!compact && (
        <span className={`fm-cell fm-cell--time${isDeleted ? ' fm-text--deleted' : ''}`}>
          {formatTime(file.createdAt)}
        </span>
      )}

      {/* 操作按钮 */}
      <div className="fm-cell fm-cell--actions">
        {isDeleted ? (
          <button
            className="fm-action-btn fm-action-btn--restore"
            title="恢复文件"
            onClick={(e) => { e.stopPropagation(); onRestore?.(file) }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
            </svg>
          </button>
        ) : (
          <>
            {previewable && (
              <button
                className="fm-action-btn fm-action-btn--preview"
                title="预览"
                onClick={(e) => { e.stopPropagation(); onPreview(file) }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            )}
            <button
              className="fm-action-btn fm-action-btn--download"
              title="下载"
              onClick={(e) => { e.stopPropagation(); onDownload(file) }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            </button>
            <button
              className="fm-action-btn fm-action-btn--delete"
              title="删除"
              onClick={(e) => { e.stopPropagation(); onDelete?.(file) }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                   strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/* ============================ 主组件 ============================ */

export default function FileManager({
  entityId,
  entityType,
  projectId,
  compact = false,
  initialFiles = [],
  onFilesChange,
}) {
  const fileInputRef = useRef(null)
  const [files, setFiles] = useState(initialFiles)
  const [uploading, setUploading] = useState(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [deletedFiles, setDeletedFiles] = useState([])
  const [loadingDeleted, setLoadingDeleted] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)

  /* ---------- helpers ---------- */
  const updateFiles = (next) => {
    setFiles(next)
    onFilesChange?.(next)
  }

  const validateFile = (file) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTS.includes(ext)) {
      toast(`不支持的文件类型 ".${ext}"。支持的格式：JPG, PNG, PDF, CSV, XLS`, { type: 'error' })
      return false
    }
    if (file.size > MAX_SIZE) {
      toast(`文件 "${file.name}" 大小为 ${formatFileSize(file.size)}，超出 20 MB 上限，请压缩后上传。`, { type: 'error' })
      return false
    }
    return true
  }

  /* ---------- 上传 ---------- */
  const handleSelect = (e) => {
    const file = e.target.files?.[0]
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (!file || !validateFile(file)) return

    setUploading({ name: file.name, progress: 0 })

    const uploadFn =
      entityType === 'project'
        ? uploadProjectFile(entityId, file, (pct) => setUploading({ name: file.name, progress: pct }))
        : uploadRecordAttachment(entityId, projectId, file, (pct) => setUploading({ name: file.name, progress: pct }))

    uploadFn
      .then((res) => {
        const created = res.data?.data ?? {}
        const newFile = {
          id: created.id ?? `f-${Date.now()}`,
          name: created.originalName ?? file.name,
          size: created.size ?? file.size,
          createdAt: created.createdAt ?? new Date().toISOString(),
          deleted: created.deleted ?? false,
        }
        updateFiles([newFile, ...files])
        setUploading(null)
      })
      .catch((err) => {
        console.error('文件上传失败:', err?.response?.status, err?.message)
        const msg = err?.response?.data?.message ?? err.message ?? '上传失败'
        toast(`上传失败：${msg}`, { type: 'error' })
        setUploading(null)
      })
  }

  /* ---------- 预览 / 下载 ---------- */
  const handlePreview = (file) => setPreviewFile(file)
  const handleClosePreview = useCallback(() => setPreviewFile(null), [])

  const handleDownload = async (file) => {
    try {
      await downloadFile(file.id)
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message ?? '下载失败'
      toast(`下载失败：${msg}`, { type: 'error' })
    }
  }

  /* ---------- 删除 ---------- */
  const handleDelete = async (file) => {
    if (!window.confirm(`确认删除文件 "${file.name}" 吗？删除后可通过"显示已删除"找回。`)) return
    try {
      await deleteFile(file.id)
      updateFiles(files.filter((f) => f.id !== file.id))
      toast(`"${file.name}" 已删除`, { type: 'success' })
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message ?? '删除失败'
      toast(`删除失败：${msg}`, { type: 'error' })
    }
  }

  /* ---------- 恢复 ---------- */
  const handleRestore = async (file) => {
    try {
      await restoreFile(file.id)
      setDeletedFiles((prev) => prev.filter((f) => f.id !== file.id))
      updateFiles([{ ...file, deleted: false }, ...files])
      toast(`"${file.name}" 已恢复`, { type: 'success' })
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message ?? '恢复失败'
      toast(`恢复失败：${msg}`, { type: 'error' })
    }
  }

  /* ---------- 回收站 toggle ---------- */
  const handleToggleDeleted = async () => {
    const next = !showDeleted
    setShowDeleted(next)

    if (next) {
      setLoadingDeleted(true)
      try {
        const listFn =
          entityType === 'project'
            ? listProjectFiles(entityId, true)
            : listRecordAttachments(entityId, true)
        const all = await listFn
        const active = []
        const deleted = []
        for (const f of all) {
          const file = {
            id: f.id,
            name: f.originalName ?? f.name,
            size: f.size,
            createdAt: f.createdAt,
            deleted: f.deleted ?? false,
          }
          if (f.deleted) deleted.push(file)
          else active.push(file)
        }
        const isValidId = (id) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
        const existingIds = new Set(active.map((f) => f.id))
        updateFiles([...active, ...files.filter((f) => !existingIds.has(f.id) && isValidId(f.id))])
        setDeletedFiles(deleted)
      } catch (err) {
        const msg = err?.response?.data?.message ?? err.message ?? '加载失败'
        toast(`加载已删除文件失败：${msg}`, { type: 'error' })
        setShowDeleted(false)
      } finally {
        setLoadingDeleted(false)
      }
    } else {
      setDeletedFiles([])
      try {
        const listFn =
          entityType === 'project'
            ? listProjectFiles(entityId, false)
            : listRecordAttachments(entityId, false)
        const active = await listFn
        updateFiles(
          active.map((f) => ({
            id: f.id,
            name: f.originalName ?? f.name,
            size: f.size,
            createdAt: f.createdAt,
            deleted: false,
          }))
        )
      } catch { /* 静默失败 */ }
    }
  }

  const isEmpty = files.length === 0 && deletedFiles.length === 0

  /* ====================== 渲染 ====================== */

  return (
    <div className={`fm-root${compact ? ' fm-root--compact' : ''}`}>
      {/* ── 工具栏 ── */}
      <div className="fm-toolbar">
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".jpg,.jpeg,.png,.pdf,.csv,.xls,.xlsx"
          onChange={handleSelect}
        />
        <button
          className="fm-upload-btn"
          disabled={!!uploading}
          onClick={() => fileInputRef.current?.click()}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          上传附件
        </button>
        {!compact && (
          <span className="fm-toolbar-hint">JPG, PNG, PDF, CSV, XLS · 最大 20 MB</span>
        )}

        {/* iOS 风格 Switch */}
        <label className="fm-switch" title="显示已软删除的文件">
          <input
            type="checkbox"
            className="fm-switch__input"
            checked={showDeleted}
            disabled={loadingDeleted}
            onChange={handleToggleDeleted}
          />
          <span className="fm-switch__track" />
          <span className="fm-switch__label">
            {loadingDeleted ? '加载中…' : '回收站'}
          </span>
        </label>
      </div>

      {/* ── 进度条 ── */}
      {uploading && (
        <div className="fm-progress">
          <div className="fm-progress__meta">
            <span className="fm-progress__name" title={uploading.name}>{uploading.name}</span>
            <span className="fm-progress__pct">{uploading.progress}%</span>
          </div>
          <div className="fm-progress__track">
            <div className="fm-progress__fill" style={{ width: `${uploading.progress}%` }} />
          </div>
        </div>
      )}

      {/* ── 空态 ── */}
      {isEmpty ? (
        <div className="fm-empty">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
               className="fm-empty__icon">
            <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z" />
            <polyline points="13 2 13 9 20 9" />
          </svg>
          <p className="fm-empty__text">暂无附件</p>
          <p className="fm-empty__hint">点击上方按钮上传</p>
        </div>
      ) : (
        /* ── 文件列表 ── */
        <div className="fm-list">
          {/* 表头 */}
          <div className="fm-row fm-row--header">
            <span className="fm-cell fm-cell--icon fm-cell--header" />
            <span className="fm-cell fm-cell--name fm-cell--header">文件名</span>
            <span className="fm-cell fm-cell--size fm-cell--header">大小</span>
            {!compact && (
              <span className="fm-cell fm-cell--time fm-cell--header">上传时间</span>
            )}
            <span className="fm-cell fm-cell--actions fm-cell--header">操作</span>
          </div>

          {/* 活跃文件 */}
          {files.map((f) => (
            <FileRow
              key={f.id}
              file={f}
              compact={compact}
              onPreview={handlePreview}
              onDownload={handleDownload}
              onDelete={handleDelete}
            />
          ))}

          {/* 已删除文件 */}
          {showDeleted && deletedFiles.map((f) => (
            <FileRow
              key={f.id}
              file={f}
              compact={compact}
              isDeleted
              onPreview={handlePreview}
              onDownload={handleDownload}
              onRestore={handleRestore}
            />
          ))}
        </div>
      )}

      {/* ── 预览弹窗 ── */}
      <PreviewModal file={previewFile} onClose={handleClosePreview} />
    </div>
  )
}
