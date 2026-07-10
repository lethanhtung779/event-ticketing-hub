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
      toast.success('Tạo danh mục thành công!')
      setNewName('')
      fetchCategories()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Có lỗi xảy ra'))
    } finally { setCreating(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await categoryApi.delete(deleteTarget.id)
      toast.success(`Đã xoá danh mục "${deleteTarget.name}"`)
      setDeleteTarget(null)
      fetchCategories()
    } catch { toast.error('Xoá thất bại') }
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
      toast.success('Cập nhật danh mục thành công!')
      setEditTarget(null)
      fetchCategories()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Cập nhật thất bại'))
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
      toast.success('Đã lưu bản dịch!')
      setTransTarget(null)
    } catch {
      toast.error('Lưu thất bại')
    } finally { setSavingTrans(false) }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Quản lý danh mục</h1>

      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Tên danh mục mới"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          className="max-w-xs"
        />
        <Button loading={creating} onClick={handleCreate} disabled={!newName.trim()}>
          <Plus className="h-4 w-4" /> Thêm
        </Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tên</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Số sự kiện</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {categories.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">Chưa có danh mục nào</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50">
                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{cat.name}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{cat._count?.events ?? 0}</td>
                <td className="px-4 py-3 flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openTrans(cat)} title="Dịch thuật">
                    <Languages className="h-4 w-4 text-blue-500" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openEdit(cat)} title="Sửa tên">
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

      <Modal open={!!editTarget} onClose={() => setEditTarget(null)} title="Sửa tên danh mục">
        {editTarget && (
          <div className="space-y-4">
            <Input label="Tên danh mục" value={editName} onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()} placeholder="Nhập tên mới..." />
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setEditTarget(null)}>Huỷ</Button>
              <Button loading={savingEdit} onClick={handleEdit} disabled={!editName.trim()}>Lưu</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xoá danh mục">
        {deleteTarget && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Bạn có chắc muốn xoá danh mục <strong>"{deleteTarget.name}"</strong>?
              {deleteTarget._count?.events ? (
                <span className="text-amber-600 block mt-1">
                  Danh mục này đang có {deleteTarget._count.events} sự kiện.
                </span>
              ) : null}
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Huỷ</Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Xác nhận xoá</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!transTarget} onClose={() => setTransTarget(null)} title="Dịch danh mục">
        {transTarget && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Đang dịch: <strong>{transTarget.name}</strong></p>
            <Select
              label="Ngôn ngữ"
              value={transLang}
              onChange={(e) => setTransLang(e.target.value)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'vi', label: 'Tiếng Việt' },
              ]}
            />
            <Input label="Tên danh mục" value={transName} onChange={(e) => setTransName(e.target.value)} placeholder="Nhập tên dịch..." />
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={() => setTransTarget(null)}>Huỷ</Button>
              <Button loading={savingTrans} onClick={handleSaveTrans}>Lưu bản dịch</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
