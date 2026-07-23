/**
 * StatCard 统计卡（新设计）
 * 工作台 / 项目详情的关键指标卡片。
 * stat.icon 传入 lucide 图标组件，stat.tone 决定图标底色。
 */

const ICON_TONES = {
  blue: 'bg-brand-50 text-brand-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  red: 'bg-red-50 text-red-600',
}

/**
 * @param {Object} props
 * @param {import('@/domain/models').DashboardStat & { tone?: string }} props.stat
 */
export default function StatCard({ stat }) {
  const Icon = stat.icon
  return (
    <article className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-card transition-shadow hover:shadow-pop">
      {Icon && (
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${ICON_TONES[stat.tone] ?? ICON_TONES.blue}`}
        >
          <Icon size={20} strokeWidth={2} />
        </div>
      )}
      <div className="min-w-0">
        <div className="text-sm text-slate-500">{stat.label}</div>
        <div className="mt-1 text-[26px] font-bold leading-8 tracking-tight text-slate-900">
          {stat.value}
        </div>
        {stat.note && <div className="mt-1 truncate text-xs text-slate-400">{stat.note}</div>}
      </div>
    </article>
  )
}
