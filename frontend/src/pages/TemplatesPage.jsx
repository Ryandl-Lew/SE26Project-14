/**
 * 实验模板 Templates
 * 主从结构：左侧分类 + 搜索 + 模板列表；右侧模板预览与字段结构。
 * 核心目标：帮助用户快速创建实验记录（跳转 /records/new 并携带模板）。
 */
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LayoutTemplate, Plus, Search } from 'lucide-react'
import { PageHeader, Surface, Badge, EmptyState, Icon, useToast } from '@/components/ui'
import { TEMPLATE_CATEGORY_LABELS, TEMPLATE_FIELD_TYPE_LABELS } from '@/domain'
import { fetchTemplates } from '@/api'
import './template-detail.css'

const CATEGORY_OPTIONS = Object.entries(TEMPLATE_CATEGORY_LABELS)

export default function TemplatesPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [templates, setTemplates] = useState([])
  const [category, setCategory] = useState('all')
  const [keyword, setKeyword] = useState('')
  const [activeId, setActiveId] = useState(null)

  useEffect(() => {
    fetchTemplates().then((list) => {
      setTemplates(list)
      setActiveId(list[0]?.id ?? null)
    })
  }, [])

  const visible = useMemo(
    () =>
      templates.filter(
        (t) =>
          (category === 'all' || t.category === category) &&
          (!keyword.trim() ||
            t.name.includes(keyword.trim()) ||
            t.description.includes(keyword.trim())),
      ),
    [templates, category, keyword],
  )

  const active = visible.find((t) => t.id === activeId) ?? visible[0]

  const useTemplate = (tpl) => {
    navigate('/records/new', { state: { templateId: tpl.id } })
  }

  return (
    <section>
      <PageHeader
        eyebrow="实验模板"
        title="实验模板"
        description="模板沉淀常用实验的字段结构。选择模板即可快速创建实验记录。"
        actions={
          <button
            className="secondary-btn"
            onClick={() => toast('「新建模板」为原型占位，暂未接入')}
          >
            <Icon name={Plus} size={15} />
            新建模板
          </button>
        }
      />

      <div className="templates-workspace">
        <aside className="surface templates-master">
          <div className="records-filters">
            <div className="records-search">
              <Icon name={Search} size={14} />
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索模板"
                aria-label="搜索模板"
              />
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="按分类筛选"
            >
              <option value="all">全部分类</option>
              {CATEGORY_OPTIONS.map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {visible.length ? (
            <div className="template-list" role="listbox" aria-label="模板列表">
              {visible.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="option"
                  aria-selected={active?.id === t.id}
                  className={`template-item ${active?.id === t.id ? 'active' : ''}`.trim()}
                  onClick={() => setActiveId(t.id)}
                >
                  <span className="template-item-title">
                    <strong>{t.name}</strong>
                    <Badge tone="gray">{TEMPLATE_CATEGORY_LABELS[t.category]}</Badge>
                  </span>
                  <span className="muted small">使用 {t.usageCount} 次</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={LayoutTemplate}
              title="没有匹配的模板"
              description="调整搜索或分类条件。"
            />
          )}
        </aside>

        <Surface className="templates-detail">
          {active ? (
            <>
              <div className="surface-head">
                <div>
                  <h2>{active.name}</h2>
                  <div className="muted small">
                    {TEMPLATE_CATEGORY_LABELS[active.category]} · 使用 {active.usageCount} 次
                    {active.tag && !active.tag.includes('使用') ? ` · ${active.tag}` : ''}
                  </div>
                </div>
                <button className="primary-btn" onClick={() => useTemplate(active)}>
                  使用模板创建记录
                </button>
              </div>

              <p className="muted">{active.description}</p>

              <h2 style={{ marginTop: 16 }}>字段结构</h2>
              {active.fields.length ? (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>字段名称</th>
                        <th>字段类型</th>
                        <th>是否必填</th>
                        <th>单位</th>
                        <th>参与搜索</th>
                      </tr>
                    </thead>
                    <tbody>
                      {active.fields.map((f) => (
                        <tr key={f.id}>
                          <td>{f.name}</td>
                          <td>{TEMPLATE_FIELD_TYPE_LABELS[f.type]}</td>
                          <td>{f.required ? '是' : '否'}</td>
                          <td>{f.unit || '-'}</td>
                          <td>{f.searchable ? '是' : '否'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="该模板暂未定义字段"
                  description="创建记录时会生成基础分节，字段结构后续补全。"
                />
              )}
            </>
          ) : (
            <EmptyState
              icon={LayoutTemplate}
              title="选择一个模板"
              description="从左侧列表选择模板查看字段结构。"
            />
          )}
        </Surface>
      </div>
    </section>
  )
}
