'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Pagination } from '@/components/ui/Pagination'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate, unwrapList, unwrapMeta, getErrorMessage } from '@/lib/utils'
import { adminApi } from '@/lib/api'
import type { PromoCode } from '@/types'
import { useTranslation } from 'react-i18next'

export default function AdminPromoCodesPage() {
  const [promos, setPromos] = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<PromoCode | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PromoCode | null>(null)
  const [form, setForm] = useState({
    code: '', discountPct: '', maxUses: '', expiresAt: '', isActive: true,
  })
  const { t } = useTranslation()

  const fetch = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getPromoCodes({ page: String(page), limit: '10' })
      setPromos(unwrapList<PromoCode>(res))
      const meta = unwrapMeta(res)
      if (meta) setTotalPages(meta.totalPages)
    } catch { setPromos([]) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [page])

  const openCreate = () => {
    setEditing(null)
    setForm({ code: '', discountPct: '', maxUses: '', expiresAt: '', isActive: true })
    setModalOpen(true)
  }

  const openEdit = (p: PromoCode) => {
    setEditing(p)
    setForm({
      code: p.code,
      discountPct: String(p.discountPct),
      maxUses: String(p.maxUses),
      expiresAt: p.expiresAt ? p.expiresAt.slice(0, 16) : '',
      isActive: p.isActive,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        code: form.code,
        discountPct: Number(form.discountPct),
        maxUses: Number(form.maxUses),
        isActive: form.isActive,
      }
      if (form.expiresAt) payload.expiresAt = form.expiresAt

      if (editing) {
        await adminApi.updatePromoCode(editing.id, payload)
        toast.success(t('admin.toastPromoUpdated'))
      } else {
        await adminApi.createPromoCode(payload)
        toast.success(t('admin.toastPromoCreated'))
      }
      setModalOpen(false)
      fetch()
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, t('common.error')))
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      await adminApi.deletePromoCode(deleteTarget.id)
      toast.success(t('admin.toastPromoDeleted', { code: deleteTarget.code }))
      setDeleteTarget(null)
      fetch()
    } catch { toast.error(t('admin.toastCategoryDeleteFailed')) }
  }

  if (loading) return <PageSpinner />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('admin.promoCodes')}</h1>
        <Button onClick={openCreate}><Plus className="h-4 w-4" /> {t('admin.createCode')}</Button>
      </div>

      <Card className="!p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-800/50 text-left">
            <tr>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colCode')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colDiscountPct')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colUsage')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colExpires')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colStatus')}</th>
              <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">{t('admin.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {promos.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">{t('admin.noPromoCodes')}</td></tr>
            ) : promos.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-800/50">
                <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">{p.code}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.discountPct}%</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.usedCount}/{p.maxUses}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{p.expiresAt ? formatDate(p.expiresAt, 'dd/MM/yyyy') : '---'}</td>
                <td className="px-4 py-3">
                  <Badge className={p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {p.isActive ? t('admin.active') : t('admin.inactive')}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteTarget(p)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-4">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? t('admin.editPromoCode') : t('admin.createPromoCode')}>
        <div className="space-y-4">
          <Input label={t('admin.fieldCode')} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <Input label={t('admin.fieldDiscountPct')} type="number" value={form.discountPct}
            onChange={(e) => setForm({ ...form, discountPct: e.target.value })} />
          <Input label={t('admin.fieldMaxUses')} type="number" value={form.maxUses}
            onChange={(e) => setForm({ ...form, maxUses: e.target.value })} />
          <Input label={t('admin.fieldExpires')} type="datetime-local" value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
            {t('admin.fieldIsActive')}
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>{t('common.cancel')}</Button>
            <Button loading={saving} onClick={handleSave}>{editing ? t('admin.update') : t('admin.create')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title={t('admin.deletePromoCode')}>
        {deleteTarget && (
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {t('admin.confirmDeletePromo', { code: deleteTarget.code, pct: deleteTarget.discountPct })}
            </p>
            <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 space-y-2 text-sm mb-6">
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('admin.colUsed')}</span>
                <span className="font-medium text-gray-900 dark:text-white">{deleteTarget.usedCount}/{deleteTarget.maxUses}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 dark:text-gray-400">{t('admin.colStatus')}</span>
                <Badge className={deleteTarget.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {deleteTarget.isActive ? t('admin.active') : t('admin.inactive')}
                </Badge>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setDeleteTarget(null)}>{t('common.cancel')}</Button>
              <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700">{t('admin.btnConfirmDelete')}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
