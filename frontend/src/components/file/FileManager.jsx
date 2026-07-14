/**
 * FileManager — 通用文件管理组件
 *
 * 适用场景：项目详情页附件区 / 实验记录详情页附件区
 *
 * Props:
 *  - entityId      {string}  项目 ID 或记录 ID
 *  - entityType    {"project"|"record"}  实体类型
 *  - initialFiles  {Array}   已有的文件列表，每项形状见下
 *      { id: string, name: string, size?: number, createdAt?: string }
 *  - onFilesChange {(files: Array) => void} [可选]  列表变更回调
 *
 * 交互能力：
 *  1. 点"上传附件" → 选择文件 → 前端校验 → API 上传 → 进度条 → 列表刷新
 *  2. 点击下载 → 调 downloadFile → 解析 Content-Disposition → 触发浏览器下载
 *  3. 点击删除 → confirm → 调 deleteFile → 列表移除
 */
import { useRef, useState } from 'react'
import {
  uploadProjectFile,
  uploadRecordAttachment,
  downloadFile,
  deleteFile,
  formatFileSize,
} from '@/api/files'
import './file-manager.css'

/* --------------------------- 常量 --------------------------- */

/** 允许上传的文件扩展名（小写） */
const ALLOWED_EXTS = ['.jpg', '.jpeg', '.png', '.pdf', '.csv', '.xls', '.xlsx']
/** 文件大小上限（字节） */
const MAX_SIZE = 20 * 1024 * 1024 // 20 MB

/* --------------------------- 辅助函数 --------------------------- */

/** 根据文件名推断图标类型（用于着色） */
function getIconType(name) {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  if (ext === '.pdf') return 'pdf'
  if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'].includes(ext)) return 'image'
  if (['.xls', '.xlsx'].includes(ext)) return 'excel'
  if (ext === '.csv') return 'csv'
  if (['.zip', '.rar', '.7z', '.gz'].includes(ext)) return 'zip'
  return 'generic'
}

/** 返回扩展名大写简写用于图标文字 */
function getIconLabel(name) {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  if (ext === '.jpg' || ext === '.jpeg') return 'JPG'
  return ext.replace('.', '').toUpperCase().slice(0, 4)
}

/** 格式化 ISO 时间字符串为可读形式 */
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

/* ============================ 组件 ============================ */

/**
 * @param {Object} props
 * @param {string} props.entityId
 * @param {'project'|'record'} props.entityType
 * @param {Array} props.initialFiles
 * @param {(files: Array) => void} [props.onFilesChange]
 */
export default function FileManager({ entityId, entityType, initialFiles = [], onFilesChange }) {
  const fileInputRef = useRef(null)
  const [files, setFiles] = useState(initialFiles)
  const [uploading, setUploading] = useState(null) // { name, progress: 0-100 }

  /* ---------- 文件列表同步 ---------- */
  const updateFiles = (next) => {
    setFiles(next)
    onFilesChange?.(next)
  }

  /* ---------- 校验 ---------- */
  const validateFile = (file) => {
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (!ALLOWED_EXTS.includes(ext)) {
      alert(`不支持的文件类型 ".${ext}"。支持的格式：JPG, PNG, PDF, CSV, XLS`)
      return false
    }
    if (file.size > MAX_SIZE) {
      alert(`文件 "${file.name}" 大小为 ${formatFileSize(file.size)}，超出 20 MB 上限，请压缩后上传。`)
      return false
    }
    return true
  }

  /* ---------- 选择文件 → 上传 ---------- */
  const handleSelect = (e) => {
    const file = e.target.files?.[0]
    // 重置 input 以便重复选择同一文件
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (!file) return
    if (!validateFile(file)) return

    // 设置上传状态
    setUploading({ name: file.name, progress: 0 })

    const uploadFn =
      entityType === 'project'
        ? uploadProjectFile(entityId, file, (pct) => setUploading({ name: file.name, progress: pct }))
        : uploadRecordAttachment(entityId, file, (pct) => setUploading({ name: file.name, progress: pct }))

    uploadFn
      .then((res) => {
        // 后端返回新建的附件对象
        const created = res.data ?? {}
        const newFile = {
          id: created.id ?? `f-${Date.now()}`,
          name: created.name ?? file.name,
          size: created.size ?? file.size,
          createdAt: created.createdAt ?? new Date().toISOString(),
        }
        updateFiles([newFile, ...files])
        setUploading(null)
      })
      .catch((err) => {
        // 开发联调：在控制台打印完整错误信息
        console.error('=== 文件上传出错 ===')
        console.error('err.message:', err.message)
        console.error('err.response?.status:', err.response?.status)
        console.error('err.response?.data:', err.response?.data)
        console.error('完整 err 对象:', err)
        const msg = err?.response?.data?.message ?? err.message ?? '上传失败'
        alert(`上传失败：${msg}`)
        setUploading(null)
      })
  }

  /* ---------- 下载 ---------- */
  const handleDownload = async (file) => {
    try {
      await downloadFile(file.id)
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message ?? '下载失败'
      alert(`下载失败：${msg}`)
    }
  }

  /* ---------- 删除 ---------- */
  const handleDelete = async (file) => {
    if (!window.confirm(`确认删除文件 "${file.name}" 吗？此操作不可撤销。`)) return
    try {
      await deleteFile(file.id)
      updateFiles(files.filter((f) => f.id !== file.id))
    } catch (err) {
      const msg = err?.response?.data?.message ?? err.message ?? '删除失败'
      alert(`删除失败：${msg}`)
    }
  }

  /* ====================== 渲染 ====================== */

  return (
    <div className="fm-root">
      {/* ===== 上传区 ===== */}
      <div className="fm-upload-bar">
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
          <span>+</span> 上传附件
        </button>
        <span className="fm-upload-hint">
          支持 JPG, PNG, PDF, CSV, XLS，最大 20 MB
        </span>
      </div>

      {/* ===== 上传进度条 ===== */}
      {uploading && (
        <div className="fm-progress-bar">
          <div className="fm-progress-meta">
            <span className="fm-progress-name" title={uploading.name}>
              {uploading.name}
            </span>
            <span className="fm-progress-pct">{uploading.progress}%</span>
          </div>
          <div className="fm-progress-track">
            <div
              className="fm-progress-fill"
              style={{ width: `${uploading.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* ===== 文件列表 ===== */}
      {files.length === 0 ? (
        <div className="fm-empty">暂无附件，点击上方按钮上传</div>
      ) : (
        <div className="fm-file-list">
          {/* 表头 */}
          <div className="fm-row fm-header">
            <span className="fm-header-cell" />
            <span className="fm-header-cell">文件名</span>
            <span className="fm-header-cell">大小</span>
            <span className="fm-header-cell">上传时间</span>
            <span className="fm-header-cell">操作</span>
          </div>

          {/* 数据行 */}
          {files.map((f) => (
            <div className="fm-row" key={f.id}>
              {/* 类型图标 */}
              <div className={`fm-file-icon fm-icon-${getIconType(f.name)}`}>
                {getIconLabel(f.name)}
              </div>

              {/* 文件名 */}
              <span className="fm-file-name" title={f.name}>
                {f.name}
              </span>

              {/* 大小 */}
              <span className="fm-file-size">{formatFileSize(f.size)}</span>

              {/* 上传时间 */}
              <span className="fm-file-time">{formatTime(f.createdAt)}</span>

              {/* 操作按钮 */}
              <div className="fm-actions">
                <button
                  className="fm-icon-btn"
                  title="下载"
                  onClick={() => handleDownload(f)}
                >
                  ↓
                </button>
                <button
                  className="fm-icon-btn fm-delete"
                  title="删除"
                  onClick={() => handleDelete(f)}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
