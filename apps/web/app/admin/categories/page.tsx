'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Languages } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import { PageSpinner } from '@/components/ui/Spinner'
import { Modal } from '@/components/ui/Modal'
import { unwrapList, getErrorMessage } from '@/lib/utils'
import { adminApi, categoryApi } from '@/lib/api'
import type { Category } from '@/types'
import { useTranslation } from 'react-i18next'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [transTarget, setTransTarget] = useState<Category | null>(null)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [editName, setEditName] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [transLang, setTransLang] = useState('en')
  const [transName, setTransName] = useState('')
  const [savingTrans, setSavingTrans] = useState(false)
  const { t } = useTranslation()

  const fetchCategories = async () => {
    try {
      const res = await categoryApi.getAll()
      setCategories(unwrapList<Category>(res))
    } catch { setCategories([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchCategories() }, [])

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await categoryApi.create(newName.trim())
      toast.success(t('admin.toastCategoryCreated'))
      setNewName('')
      fetchCategories()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('common.error')))
    } finally { setCreating(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await categoryApi.delete(deleteTarget.id)
      toast.success(t('admin.toastCategoryDeleted', { name: deleteTarget.name }))
      setDeleteTarget(null)
      fetchCategories()
    } catch { toast.error(t('admin.toastCategoryDeleteFailed')) }
  }

  const openEdit = (cat: Category) => {
    setEditTarget(cat)
    setEditName(cat.name)
  }

  const handleEdit = async () => {
    if (!editTarget || !editName.trim()) return
    setSavingEdit(true)
    try {
      await categoryApi.update(editTarget.id, editName.trim())
      toast.success(t('admin.toastCategoryUpdated'))
      setEditTarget(null)
      fetchCategories()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('admin.toastCategorySaveFailed')))
    } finally { setSavingEdit(false) }
  }

  const openTrans = (cat: Category) => {
    setTransTarget(cat)
    setTransLang('en')
    setTransName('')
  }

  const handleSaveTrans = async () => {
    if (!transTarget || !transName.trim()) return
    setSavingTrans(true)
    try {
      await adminApi.upsertCategoryTranslation(transTarget.id, { language: transLang, name: transName })
      toast.success(t('admin.toastTranslationSaved'))
      setTransTarget(null)
    } catch {
      toast.error(t('admin.toastCategorySaveFailed'))
    } finally { setSavingTrans(false) }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('admin.categoryManagement')}</h1>

      <div className="flex gap-3 mb-6">
        <Input
          placeholder={t('admin.newCategoryPlaceholder')}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="max-w-xs"
        />
        <Button loading={creating} onClick={handleCreate} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" /> {t('admin.add')}
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colName')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colEventCount')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">{t('admin.noCategories')}</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{cat.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{cat._count?.events ?? 0}</td>
                <td className="px-4 py-3 flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openTrans(cat)} title={t('admin.translate')}>
                    <Languages className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)} title={t('admin.editCategory')}>
                    <Pencil className="h-4 w-4 text-indigo-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(cat)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title={t('admin.editCategory')}>
        {editTarget && (
          <div className="space-y-4">
            <Input label={t('admin.categoryName')} value={editName} onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()} placeholder={t('admin.categoryNamePlaceholder')} />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditTarget(null)}>{t('common.cancel')}</Button>
              <Button loading={savingEdit} onClick={handleEdit} disabled={!editName.trim()}>{t('common.save')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('admin.deleteCategory')}>
        {deleteTarget && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {t('admin.confirmDeleteCategory', { name: deleteTarget.name })}
              {deleteTarget._count?.events ? (
                <span className="text-amber-600 block mt-1">
                  {t('admin.categoryHasEvents', { count: deleteTarget._count.events })}
                </span>
              ) : null}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{t('admin.btnConfirmDelete')}</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!transTarget} onClose={() => setTransTarget(null)} title={t('admin.translateCategory')}>
        {transTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.translatingFor')} <strong>{transTarget.name}</strong></p>
            <Select
              label={t('admin.fieldLanguage')}
              value={transLang}
              onChange={(e) => setTransLang(e.target.value)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'vi', label: 'Tiếng Việt' },
              ]}
            />
            <Input label={t('admin.transCategoryName')} value={transName} onChange={(e) => setTransName(e.target.value)} placeholder={t('admin.transNamePlaceholder')} />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setTransTarget(null)}>{t('common.cancel')}</Button>
              <Button loading={savingTrans} onClick={handleSaveTrans}>{t('admin.saveTranslation')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
