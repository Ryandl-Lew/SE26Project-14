/**
 * 模板中心 Templates（重设计）
 * 分类选项卡 + 模板卡片 + 选中模板的字段结构表。
 */
import { useEffect, useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import { Button, PageHeader, Surface, Tabs } from '@/components/ui'
import TemplateCard from '@/components/template/TemplateCard'
import { TEMPLATE_CATEGORY_LABELS, TEMPLATE_FIELD_TYPE_LABELS } from '@/domain'
import { fetchTemplates } from '@/api'

const CATEGORY_TABS = Object.entries(TEMPLATE_CATEGORY_LABELS).map(([key, label]) => ({
  key,
  label,
}))

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
        actions={<Button icon={Plus}>新建模板</Button>}
      />

      <Tabs items={CATEGORY_TABS} activeKey={activeTab} onChange={setActiveTab} />

      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2 2xl:grid-cols-3">
        {visible.map((t) => (
          <TemplateCard key={t.id} template={t} />
        ))}
      </div>

      {fieldTemplate && (
        <Surface
          title={`「${fieldTemplate.name}」字段结构`}
          extra={
            <Button variant="secondary" size="sm" icon={Pencil}>
              编辑字段
            </Button>
          }
          className="mt-6"
        >
          <div className="table-wrap">
            <table className="data-table">
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
                    <td className="font-medium text-slate-900">{f.name}</td>
                    <td>{TEMPLATE_FIELD_TYPE_LABELS[f.type]}</td>
                    <td>
                      {f.required ? (
                        <span className="font-medium text-brand-600">必填</span>
                      ) : (
                        <span className="text-slate-400">选填</span>
                      )}
                    </td>
                    <td className="font-mono text-xs">{f.unit || '-'}</td>
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
