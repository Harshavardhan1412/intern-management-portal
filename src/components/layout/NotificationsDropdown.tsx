'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, Check, Trash2, X, Megaphone, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import type { Notification } from '@/lib/types'

export default function NotificationsDropdown() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Notification[]>([])
  const [expandedIds, setExpandedIds] = useState<string[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!user) return

    const fetchNotifications = async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)
      
      if (!error && data) {
        setNotifications(data as Notification[])
      }
    }

    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => [newNotif, ...prev])
          
          // Display real-time toast popup
          setToasts((prev) => [...prev, newNotif])
          
          // Auto remove from toast list after 6 seconds
          setTimeout(() => {
            setToasts((prev) => prev.filter(t => t.id !== newNotif.id))
          }, 6000)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.is_read).length

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
  }

  const markAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length === 0) return

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications(prev => prev.filter(n => n.id !== id))
    await supabase.from('notifications').delete().eq('id', id)
  }

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter(t => t.id !== id))
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }
    setExpandedIds(prev => 
      prev.includes(notification.id)
        ? prev.filter(id => id !== notification.id)
        : [...prev, notification.id]
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
      >
        <Bell size={20} className="text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <h3 className="font-semibold text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-brand hover:text-brand-light font-medium flex items-center gap-1"
              >
                <Check size={14} />
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No notifications yet
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => {
                  const isExpanded = expandedIds.includes(notification.id)
                  
                  return (
                    <div 
                      key={notification.id}
                      onClick={() => handleNotificationClick(notification)}
                      className={`p-4 hover:bg-slate-50/80 transition-colors cursor-pointer group relative ${!notification.is_read ? 'bg-indigo-50/30' : ''}`}
                    >
                      {!notification.is_read && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600" />
                      )}
                      <div className="flex justify-between items-start mb-1 gap-2">
                        <h4 className={`text-sm leading-snug flex-1 ${!notification.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-700'}`}>
                          {notification.title}
                        </h4>
                        <button 
                          onClick={(e) => deleteNotification(notification.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all rounded shrink-0"
                          title="Delete notification"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      
                      {notification.body && (
                        <div className="mt-1 mb-2">
                          <p className={`text-xs text-slate-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                            {notification.body}
                          </p>
                          {notification.body.length > 60 && (
                            <div className="flex items-center gap-1 text-[10px] text-indigo-600 font-semibold mt-1 hover:text-indigo-700">
                              <span>{isExpanded ? 'Show less' : 'Read full message'}</span>
                              {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Real-time Toast Notifications Portal */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-[340px] pointer-events-none">
        {toasts.map((toast) => {
          const isAnnouncement = toast.type === 'announcement'
          const isReminder = toast.type === 'reminder'

          return (
            <div
              key={toast.id}
              className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-205 dark:border-slate-800 rounded-xl p-4 shadow-xl flex gap-3 animate-slide-in-right transition-all duration-300 max-h-48 overflow-hidden hover:scale-[1.02]"
            >
              <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center relative mt-0.5 animate-pulse
                ${isAnnouncement ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400' : ''}
                ${isReminder ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : ''}
                ${!isAnnouncement && !isReminder ? 'bg-indigo-50 text-indigo-600' : ''}
              `}>
                <span className={`absolute inset-0 rounded-full opacity-75 animate-ping
                  ${isAnnouncement ? 'bg-teal-400' : ''}
                  ${isReminder ? 'bg-amber-400' : ''}
                  ${!isAnnouncement && !isReminder ? 'bg-indigo-400' : ''}
                `} />
                {isAnnouncement && <Megaphone size={18} className="relative z-10 animate-bounce" />}
                {isReminder && <AlertCircle size={18} className="relative z-10 animate-bounce" />}
                {!isAnnouncement && !isReminder && <Bell size={18} className="relative z-10 animate-bounce" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {toast.title}
                  </p>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                {toast.body && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 pr-2 leading-relaxed">
                    {toast.body}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
