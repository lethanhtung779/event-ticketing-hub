'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Bell, Send, Users, Mail, Search as SearchIcon, X } from 'lucide-react'
import { Card, CardTitle } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Avatar from '@/components/ui/Avatar'
import { getErrorMessage } from '@/lib/utils'
import { adminApi } from '@/lib/api'
import { useTranslation } from 'react-i18next'

interface UserOption {
  id: string
  fullName: string
  email: string
  role: string
}

export default function AdminNotificationsPage() {
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [allUsers, setAllUsers] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([])
  const [userList, setUserList] = useState<UserOption[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number } | null>(null)
  const { t } = useTranslation()

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data } = await adminApi.getUsers({ limit: '200' })
      const body = data as any
      const list = Array.isArray(body) ? body : body.data ?? []
      setUserList(list)
    } catch {
      toast.error(t('admin.toastUsersLoadFailed'))
    } finally {
      setLoadingUsers(false)
    }
  }

  useEffect(() => {
    if (!allUsers && userList.length === 0) {
      fetchUsers()
    }
  }, [allUsers, userList.length])

  const filteredUsers = userList.filter(
    (u) =>
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const toggleUser = (user: UserOption) => {
    setSelectedUsers((prev) =>
      prev.some((u) => u.id === user.id)
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user]
    )
  }

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast.error(t('admin.toastRequireSubject'))
      return
    }
    if (!allUsers && selectedUsers.length === 0) {
      toast.error(t('admin.toastRequireUsers'))
      return
    }
    setSending(true)
    setResult(null)
    try {
      const { data } = await adminApi.sendNotification({
        subject,
        message,
        allUsers,
        userIds: allUsers ? undefined : selectedUsers.map((u) => u.id),
      })
      setResult(data as { sent: number })
      toast.success(t('admin.sendNotification'))
      setSubject('')
      setMessage('')
      setSelectedUsers([])
    } catch (err) {
      toast.error(getErrorMessage(err, t('admin.toastSendFailed')))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Bell className="h-6 w-6 text-indigo-600" /> {t('admin.sendNotification')}
      </h1>

      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4 text-sm">
          <button
            onClick={() => { setAllUsers(true); setSelectedUsers([]) }}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition-colors ${
              allUsers ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800'
            }`}
          >
            <Users className="h-4 w-4" /> {t('admin.allUsers')}
          </button>
          <button
            onClick={() => { setAllUsers(false); if (userList.length === 0) fetchUsers() }}
            className={`flex items-center gap-1 rounded-lg px-3 py-1.5 font-medium transition-colors ${
              !allUsers ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 dark:bg-gray-800'
            }`}
          >
            <Mail className="h-4 w-4" /> {t('admin.selectUsers')}
          </button>
        </div>

        {!allUsers && (
          <div className="mb-4">
            <div className="relative mb-3">
              <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('admin.searchUsers')}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 pl-9 pr-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {selectedUsers.map((u) => (
                  <span key={u.id} className="inline-flex items-center gap-1 rounded-full bg-indigo-100 dark:bg-emerald-900/30 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:text-emerald-300">
                    {u.fullName}
                    <button onClick={() => toggleUser(u)} className="hover:opacity-70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-800">
              {loadingUsers ? (
                <div className="p-4 text-center text-sm text-gray-500">{t('common.loading')}</div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">{t('admin.noUsersFound')}</div>
              ) : (
                filteredUsers.slice(0, 50).map((u) => {
                  const isSelected = selectedUsers.some((s) => s.id === u.id)
                  return (
                    <button
                      key={u.id}
                      onClick={() => toggleUser(u)}
                      className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                        isSelected ? 'bg-indigo-50 dark:bg-emerald-900/20' : ''
                      }`}
                    >
                      <input type="checkbox" checked={isSelected} readOnly className="rounded border-gray-300" />
                      <Avatar src={null} name={u.fullName} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{u.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{u.email}</p>
                      </div>
                      <span className="text-[10px] uppercase text-gray-400">{u.role}</span>
                    </button>
                  )
                })
              )}
            </div>
            <p className="mt-1 text-xs text-gray-400">{t('admin.selectedCount', { count: selectedUsers.length })}</p>
          </div>
        )}

        <div className="space-y-4">
          <Input label={t('admin.fieldSubject')} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('admin.subjectPlaceholder')} />
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">{t('admin.fieldMessage')}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t('admin.messagePlaceholder')}
              rows={6}
              className="block w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:bg-neutral-900 dark:text-white"
            />
          </div>
          <div className="flex justify-end">
            <Button loading={sending} onClick={handleSend} className="flex items-center gap-2">
              <Send className="h-4 w-4" /> {t('admin.send')}
            </Button>
          </div>
          {result && (
            <p className="text-sm text-green-600 text-center">
              {t('admin.sentResult', { count: result.sent })}
            </p>
          )}
        </div>
      </Card>
    </div>
  )
}
