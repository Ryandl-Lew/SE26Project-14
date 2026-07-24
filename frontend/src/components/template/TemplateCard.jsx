/**
 * TemplateCard 模板卡片（重设计）
 * 模板中心的模板概要卡片，可「使用模板」跳转编辑器。
 */
import { useNavigate } from 'react-router-dom'
import { Dna, Microscope, Atom, ShieldCheck, LayoutTemplate, Eye, Copy, ArrowRight, Star } from 'lucide-react'
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
 * @param {Function} [props.onView]
 * @param {boolean} [props.isFavorited]
 * @param {Function} [props.onToggleFavorite]
 */
export default function TemplateCard({ template, onView, isFavorited, onToggleFavorite }) {
  const config = CATEGORY_CONFIG[template.category] ?? CATEGORY_CONFIG.mine
  const Icon = config.icon

  return (
    <article className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-pop">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${config.cls}`}>
          <Icon size={21} strokeWidth={1.8} />
        </div>
        <div className="flex items-center gap-1">
          {template.tag && <Badge tone="blue">{template.tag}</Badge>}
          {onToggleFavorite && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(template.id) }}
              className={`rounded-lg p-1.5 transition-colors ${
                isFavorited
                  ? 'text-amber-400 hover:text-amber-500'
                  : 'text-slate-300 hover:text-amber-400'
              }`}
              title={isFavorited ? '取消收藏' : '收藏模板'}
            >
              <Star size={16} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>

      <h3 className="mt-3.5 text-[15px] font-semibold text-slate-900">{template.name}</h3>
      <p className="mt-1.5 line-clamp-2 flex-1 text-sm leading-relaxed text-slate-500">
        {template.description}
      </p>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <Button className="w-full" variant="secondary" icon={Eye} onClick={() => onView?.(template)}>
          查看模板
        </Button>
      </div>
    </article>
  )
}
