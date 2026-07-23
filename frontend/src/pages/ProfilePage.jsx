import { CalendarDays, IdCard, Mail, Pencil, ShieldCheck, UserRound } from 'lucide-react'
import { Badge, Button, PageHeader, Surface } from '@/components/ui'
import { useAuthStore } from '@/store/authStore'

export default function ProfilePage() {
  const currentUser = useAuthStore((state) => state.currentUser)

  const details = [
    { label: '用户 ID', value: currentUser?.id ?? '-', icon: IdCard },
    { label: '注册邮箱', value: currentUser?.email ?? '-', icon: Mail },
    { label: '注册时间', value: '2026-06-28', icon: CalendarDays },
    { label: '账户状态', value: '正常', icon: ShieldCheck },
  ]

  return (
    <section>
      <PageHeader
        eyebrow="个人中心"
        title="用户信息"
        description="查看并维护用于项目协作与实验记录署名的基本资料。"
        actions={<Button icon={Pencil}>编辑资料</Button>}
      />

      <div className="grid items-start gap-6 lg:grid-cols-[300px,minmax(0,1fr)]">
        <Surface className="text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-indigo-600 text-3xl font-bold text-white shadow-pop">
            {currentUser?.avatarText ?? <UserRound size={34} />}
          </div>
          <h2 className="mt-4 text-xl font-semibold text-slate-900">{currentUser?.name}</h2>
          <p className="mt-1 text-sm text-slate-500">{currentUser?.email}</p>
          <div className="mt-4 flex justify-center">
            <Badge tone="blue">已完成身份验证</Badge>
          </div>
        </Surface>

        <Surface title="账户资料">
          <div className="grid gap-3 sm:grid-cols-2">
            {details.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                  <item.icon size={16} />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs text-slate-400">{item.label}</span>
                  <span className="mt-1 block truncate text-sm font-medium text-slate-900">
                    {item.value}
                  </span>
                </span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-3 text-sm text-brand-800">
            用户 ID 与注册时间由系统维护；当前版本支持修改用户名和头像。
          </div>
        </Surface>
      </div>
    </section>
  )
}
