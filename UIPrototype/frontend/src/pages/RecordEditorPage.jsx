/**
 * 新建 / 编辑实验记录 RecordEditor
 * 三栏：目录大纲 + 主编辑区（表单占位）+ 关联信息。
 * 注意：本阶段仅搭建结构与占位表单，不实现富文本编辑器能力。
 */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { PageHeader, Surface, Badge } from '@/components/ui'
import { fetchRecord } from '@/api'
import './editor.css'

/** 编辑器左侧目录锚点 */
const OUTLINE = [
  '基础信息',
  '实验目的',
  '材料与试剂',
  '实验步骤',
  '实验参数',
  '实验结果',
  '结论与讨论',
  '附件',
  '修改历史',
]

export default function RecordEditorPage() {
  const { recordId } = useParams()
  const isNew = !recordId
  const [record, setRecord] = useState(null)
  const [activeOutline, setActiveOutline] = useState('基础信息')

  useEffect(() => {
    if (recordId) fetchRecord(recordId).then(setRecord)
  }, [recordId])

  const title = isNew ? '新建实验记录' : record?.title ?? '加载中…'

  return (
    <section>
      <PageHeader
        eyebrow="新建 / 编辑实验记录"
        title={title}
        description={isNew ? '填写实验信息并保存为草稿。' : `实验编号 ${record?.code ?? ''}`}
        actions={
          <>
            {/* TODO: 接入保存草稿 / 提交审核（saveRecordDraft / submitRecordForReview） */}
            <button className="secondary-btn">保存草稿</button>
            <button className="primary-btn">提交审核</button>
          </>
        }
      />

      <div className="editor-shell">
        <aside className="surface">
          <h2>目录</h2>
          <div className="outline-list">
            {OUTLINE.map((item) => (
              <button
                key={item}
                className={item === activeOutline ? 'active' : ''}
                onClick={() => setActiveOutline(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </aside>

        <Surface>
          {/* TODO: 编辑工具栏为占位按钮，后续接入富文本能力 */}
          <div className="editor-toolbar" aria-label="编辑工具栏">
            {['H', 'B', 'I', '▦', '▧', 'Σ', '{}', '◎', '◈'].map((t, i) => (
              <button className="tool-btn" key={i} type="button">
                {t}
              </button>
            ))}
          </div>

          <div className="editor-document">
            <div className="form-grid">
              <div className="field">
                <label>实验标题</label>
                <input defaultValue={record?.title ?? ''} placeholder="如：PCR 扩增 GFP 片段" />
              </div>
              <div className="field">
                <label>实验类型</label>
                <select defaultValue={record?.experimentType ?? 'PCR'}>
                  <option>PCR</option>
                  <option>qPCR</option>
                  <option>Western blot</option>
                </select>
              </div>
              <div className="field">
                <label>所属项目</label>
                <input defaultValue={record?.projectName ?? ''} placeholder="选择所属项目" />
              </div>
              <div className="field">
                <label>实验日期</label>
                <input type="date" defaultValue={record?.experimentDate ?? '2026-07-09'} />
              </div>
              <div className="field">
                <label>负责人</label>
                <input defaultValue={record?.ownerName ?? ''} />
              </div>
              <div className="field">
                <label>实验地点</label>
                <input defaultValue={record?.location ?? ''} placeholder="如：实验室 A203" />
              </div>
            </div>

            <h2>实验目的</h2>
            <p className="muted">{record?.purpose ?? '（在此填写实验目的）'}</p>

            {/* TODO: 材料与试剂 / 反应体系表格改为可编辑表格组件 */}
            <h2>材料与试剂</h2>
            <p className="muted small">占位：后续接入可编辑的材料试剂表格。</p>
          </div>
        </Surface>

        <aside className="surface">
          <h2>关联信息</h2>
          <div className="field">
            <label>状态</label>
            <select defaultValue={record?.status ?? 'in_progress'}>
              <option value="in_progress">进行中</option>
              <option value="pending_review">待审核</option>
              <option value="completed">已完成</option>
            </select>
          </div>
          <div className="side-list">
            {(record?.relations ?? []).map((rel) => (
              <div className="side-chip" key={rel.id}>
                <span>{rel.label}</span>
                <Badge tone="green">{rel.kind}</Badge>
              </div>
            ))}
          </div>
          <h2 style={{ marginTop: 18 }}>操作</h2>
          <div className="stack">
            <button className="primary-btn">提交审核</button>
            <button className="secondary-btn">导出 PDF</button>
            <button className="secondary-btn">复制为新实验</button>
          </div>
        </aside>
      </div>
    </section>
  )
}
