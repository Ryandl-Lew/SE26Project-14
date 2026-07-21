/**
 * TemplateCard 模板卡片（重设计）
 * 模板中心的模板概要卡片，可「使用模板」跳转编辑器。
 */
import { useNavigate } from 'react-router-dom'
import { Dna, Microscope, Atom, ShieldCheck, LayoutTemplate, Eye, Copy, ArrowRight } from 'lucide-react'
import { Button, Badge } from '@/components/ui'

/** 模板分类 → 图标与配色 */
const CATEGORY_CONFIG = {
  molecular: { icon: Dna, cls: 'bg-brand-50 text-brand-600' },
  cell: { icon: Microscope, cls: 'bg-emerald-50 text-emerald-600' },
  protein: { icon: Atom, cls: 'bg-violet-50 text-violet-600' },
  immunology: { icon: ShieldCheck, cls: 'bg-amber-50 text-amber-600' },
  mine: { icon: LayoutTemplate, cls: 'bg-slate-100 text-slate-500' },
}

/**
 * @param {Object} props
 * @param {import('@/domain/models').Template} props.template
 */
export default function TemplateCard({ template }) {
  const navigate = useNavigate()
  const config = CATEGORY_CONFIG[template.category] ?? CATEGORY_CONFIG.mine
  const Icon = config.icon

  return (
    <article className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.cls}`}>
          <Icon size={21} strokeWidth={1.8} />
        </div>
        {template.tag && <Badge tone="blue">{template.tag}</Badge>}
      </div>

      <h3 className="mt-3.5 text-[15px] font-semibold text-slate-900">{template.name}</h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
        {template.description}
      </p>

      {/* 操作区：主操作 + 图标化次操作 */}
      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
        {/* TODO: 使用模板时预填字段并携带模板 id */}
        <Button className="flex-1" icon={ArrowRight} onClick={() => navigate('/records/new')}>
          使用模板
        </Button>
        <Button variant="secondary" icon={Eye} title="预览模板" aria-label="预览模板" />
        <Button variant="ghost" icon={Copy} title="复制模板" aria-label="复制模板" />
      </div>
    </article>
  )
}
