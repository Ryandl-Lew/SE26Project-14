/**
 * 模板中心 Templates
 * 分类标签 + 模板卡片 + 选中模板的字段结构表。
 */
import { useEffect, useState } from 'react'
import { PageHeader, Surface } from '@/components/ui'
import TemplateCard from '@/components/template/TemplateCard'
import { TEMPLATE_CATEGORY_LABELS, TEMPLATE_FIELD_TYPE_LABELS } from '@/domain'
import { fetchTemplates } from '@/api'

const CATEGORY_TABS = Object.entries(TEMPLATE_CATEGORY_LABELS)

export default function TemplatesPage() {
  const [templates, setTemplates] = useState([])
  const [activeTab, setActiveTab] = useState('molecular')

  useEffect(() => {
    fetchTemplates().then(setTemplates)
  }, [])

  // 「我的模板」暂无 mock，展示全部；其余按分类过滤
  const visible =
    activeTab === 'mine' ? templates : templates.filter((t) => t.category === activeTab)
  const fieldTemplate = templates.find((t) => t.fields.length > 0)

  return (
    <section>
      <PageHeader
        eyebrow="模板中心"
        title="实验模板"
        description="用模板字段沉淀 PCR、qPCR、细胞实验等常用记录结构。"
        actions={<button className="primary-btn">＋ 新建模板</button>}
      />

      <div className="tabs">
        {CATEGORY_TABS.map(([key, label]) => (
          <button
            key={key}
            className={`tab-btn ${key === activeTab ? 'active' : ''}`.trim()}
            onClick={() => setActiveTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="template-grid">
        {visible.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>

      {fieldTemplate && (
        <Surface
          title={`${fieldTemplate.name}字段结构`}
          extra={<button className="secondary-btn">编辑字段</button>}
          style={{ marginTop: 18 }}
        >
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
                {fieldTemplate.fields.map((f) => (
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
        </Surface>
      )}
    </section>
  )
}
