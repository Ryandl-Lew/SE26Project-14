/**
 * Topbar 顶栏
 * 极简设计：仅保留移动端菜单按钮与通知入口。
 * 搜索 / 项目切换 / 新建操作均归属具体页面，不在全局顶栏重复。
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, CheckCheck, FileCheck2, UserPlus, Undo2 } from 'lucide-react'

const INITIAL_NOTIFICATIONS = [
  {
    id: 'nt-1',
    title: '新的审核任务',
    description: '王同学提交了「qPCR 引物扩增效率验证」R2',
    time: '10 分钟前',
    type: 'review',
    unread: true,
    path: '/records/r-006',
  },
  {
    id: 'nt-2',
    title: '记录被退回修改',
    description: '张老师对「qPCR 检测 IFN-β 表达」提出了修改意见',
    time: '2 小时前',
    type: 'change',
    unread: true,
    path: '/records/r-002',
  },
  {
    id: 'nt-3',
    title: '项目邀请',
    description: '陈同学邀请你加入「蛋白互作验证」',
    time: '昨天',
    type: 'invite',
    unread: false,
  },
]

const NOTIFICATION_ICONS = {
  review: FileCheck2,
  change: Undo2,
  invite: UserPlus,
}

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
  const unreadCount = notifications.filter((item) => item.unread).length

  const openNotification = (item) => {
    setNotifications((list) =>
      list.map((notification) =>
        notification.id === item.id ? { ...notification, unread: false } : notification,
      ),
    )
    setOpen(false)
    if (item.path) navigate(item.path)
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      {/* 移动端菜单按钮 */}
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="打开导航菜单"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="ml-auto flex items-center gap-2.5">
        {/* 通知 */}
        <div className="relative">
          <button
            type="button"
            aria-label={`通知，${unreadCount} 条未读`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="relative rounded-lg p-2.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-pop animate-scale-in">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900">通知</h2>
                  <p className="text-xs text-slate-400">{unreadCount} 条未读消息</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setNotifications((list) => list.map((item) => ({ ...item, unread: false })))
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50"
                >
                  <CheckCheck size={14} />
                  全部已读
                </button>
              </div>
              <div className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
                {notifications.map((item) => {
                  const Icon = NOTIFICATION_ICONS[item.type] ?? Bell
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => openNotification(item)}
                      className={`flex w-full gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 ${
                        item.unread ? 'bg-brand-50/40' : 'bg-white'
                      }`}
                    >
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                          {item.title}
                          {item.unread && <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
                        </span>
                        <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                          {item.description}
                        </span>
                        <span className="mt-1 block text-[11px] text-slate-400">{item.time}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
