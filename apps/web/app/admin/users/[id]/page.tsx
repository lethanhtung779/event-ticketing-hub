'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, User as UserIcon, Calendar, Shield, Ticket, Star } from 'lucide-react'
import toast from 'react-hot-toast'
import { Card, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDate } from '@/lib/utils'
import { adminApi } from '@/lib/api'

export default function AdminUserDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params)
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = () => {
    adminApi
      .getUser(params.id)
      .then(({ data }) => setUser(data))
      .catch(() => router.push('/admin/users'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUser() }, [params.id])

  const handleRoleChange = async (role: string) => {
    try {
      await adminApi.updateUserRole(params.id, role)
      toast.success('Cập nhật vai trò thành công!')
      fetchUser()
    } catch {
      toast.error('Cập nhật thất bại')
    }
  }

  if (loading) return <PageSpinner />
  if (!user) return null

  return (
    <div>
      <Link href="/admin/users" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-indigo-600 mb-4">
        <ArrowLeft className="h-4 w-4" /> Quản lý người dùng
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
        <p className="text-sm text-gray-500">{user.email}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardTitle className="flex items-center gap-2">
            <UserIcon className="h-5 w-5 text-indigo-600" />
            Thông tin cá nhân
          </CardTitle>
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm font-medium text-gray-900">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Vai trò</p>
                <Select
                  value={user.role}
                  onChange={(e) => handleRoleChange(e.target.value)}
                  options={[
                    { value: 'USER', label: 'USER' },
                    { value: 'STAFF', label: 'STAFF' },
                    { value: 'ADMIN', label: 'ADMIN' },
                  ]}
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Ngày tham gia</p>
                <p className="text-sm font-medium text-gray-900">{formatDate(user.createdAt, 'dd/MM/yyyy')}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Trạng thái email</p>
              <Badge className={user.isVerified ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                {user.isVerified ? 'Đã xác thực' : 'Chưa xác thực'}
              </Badge>
            </div>
          </div>
        </Card>

        <Card>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-indigo-600" />
            Hoạt động
          </CardTitle>
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Vé đã mua</span>
              <span className="text-lg font-bold text-gray-900">{user._count?.tickets ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">Đánh giá</span>
              <span className="text-lg font-bold text-gray-900">{user._count?.reviews ?? 0}</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
