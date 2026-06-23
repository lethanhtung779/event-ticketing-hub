'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { unwrapList, getErrorMessage } from '@/lib/utils'
import { categoryApi } from '@/lib/api'
import type { Category } from '@/types'

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

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

  const handleDelete = async (id: string) => {
    if (!confirm('Xoá danh mục này?')) return
    try {
      await categoryApi.delete(id)
      toast.success('Đã xoá danh mục')
      fetchCategories()
    } catch { toast.error('Xoá thất bại') }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Quản lý danh mục</h1>

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
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500">Tên</th>
              <th className="px-4 py-3 font-medium text-gray-500">Số sự kiện</th>
              <th className="px-4 py-3 font-medium text-gray-500">Hành động</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories.length === 0 ? (
              <tr><td colSpan={3} className="px-4 py-12 text-center text-gray-500">Chưa có danh mục nào</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                <td className="px-4 py-3 text-gray-600">{cat._count?.events ?? 0}</td>
                <td className="px-4 py-3">
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(cat.id)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  )
}
