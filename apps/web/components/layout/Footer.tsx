import Link from 'next/link'
import { Ticket } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-indigo-600">
              <Ticket className="h-5 w-5" />
              TicketHub
            </Link>
            <p className="mt-2 text-sm text-gray-500">
              Nền tảng đặt vé sự kiện trực tuyến hàng đầu Việt Nam.
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Liên kết</h3>
            <ul className="mt-3 space-y-2">
              <li><Link href="/events" className="text-sm text-gray-500 hover:text-indigo-600">Sự kiện</Link></li>
              <li><Link href="/login" className="text-sm text-gray-500 hover:text-indigo-600">Đăng nhập</Link></li>
              <li><Link href="/register" className="text-sm text-gray-500 hover:text-indigo-600">Đăng ký</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Hỗ trợ</h3>
            <ul className="mt-3 space-y-2">
              <li><span className="text-sm text-gray-500">Email: support@tickethub.com</span></li>
              <li><span className="text-sm text-gray-500">Điện thoại: 1900 1234</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t border-gray-200 pt-8 text-center">
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} TicketHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
