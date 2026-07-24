import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Bell, CheckCheck, FileCheck2, UserPlus, Undo2, MessageSquare } from 'lucide-react'
import { fetchNotifications } from '@/api'

const NOTIFICATION_ICONS = {
  review: FileCheck2,
  REVIEW: FileCheck2,
  change: Undo2,
  SUPPLEMENT: Undo2,
  invite: UserPlus,
  comment: MessageSquare,
}

function formatRelativeTime(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} 天前`
  return new Date(isoString).toLocaleDateString('zh-CN')
}

export default function Topbar({ onMenuClick }) {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    fetchNotifications()
      .then((list) => {
        setNotifications(
          list.map((n) => ({
            id: n.id,
            title: n.title,
            description: n.description ?? '',
            time: formatRelativeTime(n.createdAt),
            type: n.badgeText ?? 'review',
            unread: true,
          })),
        )
      })
      .catch(() => {
        // silently fail, keep empty
      })
  }, [])

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
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="打开导航菜单"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="ml-auto flex items-center gap-2.5">
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
                  <p className="text-xs text-slate-400">
                    {notifications.length > 0
                      ? `${unreadCount} 条未读消息`
                      : '暂无通知'}
                  </p>
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
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                    <Bell size={28} className="mb-2 opacity-50" />
                    <p className="text-sm">暂无通知消息</p>
                  </div>
                ) : (
                  notifications.map((item) => {
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
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
