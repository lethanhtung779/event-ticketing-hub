'use client'

import { Card, CardTitle } from '@/components/ui/Card'
import { FileText, Shield, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const sections = [
  {
    icon: Shield,
    title: 'Trách nhiệm của Ban Tổ chức',
    items: [
      'Đảm bảo thông tin sự kiện chính xác, đầy đủ trước khi công bố.',
      'Chịu trách nhiệm về chất lượng nội dung và trải nghiệm của người tham dự.',
      'Tuân thủ các quy định pháp luật về tổ chức sự kiện và bán vé.',
      'Xử lý kịp thời các khiếu nại từ người mua vé.',
    ],
  },
  {
    icon: DollarSign,
    title: 'Chính sách thanh toán & hoàn tiền',
    items: [
      'Doanh thu từ bán vé được chuyển khoản vào tài khoản BTC sau khi sự kiện kết thúc.',
      'Phí nền tảng được khấu trừ trước khi chuyển doanh thu (tham khảo bảng phí).',
      'BTC có trách nhiệm thiết lập chính sách hoàn tiền và thông báo rõ ràng tới người mua.',
      'Trường hợp hủy sự kiện, BTC phải hoàn tiền đầy đủ cho người mua vé.',
    ],
  },
  {
    icon: AlertTriangle,
    title: 'Quy định về hủy & thay đổi',
    items: [
      'Sự kiện đã công bố có thể bị hủy nếu vi phạm điều khoản nền tảng.',
      'Mọi thay đổi về thời gian, địa điểm phải được cập nhật tối thiểu 48h trước giờ diễn ra.',
      'BTC không được phép bán vé vượt quá sức chứa đã đăng ký.',
      'Vi phạm nhiều lần có thể dẫn đến khóa tài khoản tổ chức.',
    ],
  },
  {
    icon: CheckCircle,
    title: 'Tiêu chuẩn sự kiện',
    items: [
      'Sự kiện phải có mô tả chi tiết, hình ảnh rõ ràng và thông tin liên hệ.',
      'Giá vé phải được niêm yết công khai và không thay đổi sau khi công bố.',
      'Tuân thủ quy định về thuế và các nghĩa vụ tài chính liên quan.',
      'Đảm bảo an ninh, an toàn cho người tham dự tại sự kiện.',
    ],
  },
]

export default function TermsPage() {
  const { t } = useTranslation()
  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-6">
        <FileText className="h-7 w-7 text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('organizer.terms')}</h1>
      </div>

      <p className="text-gray-500 dark:text-gray-400 mb-8">
        {t('organizer.termsDesc')}
      </p>

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.title}>
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <section.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <CardTitle>{section.title}</CardTitle>
                <ul className="mt-3 space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <span className="text-indigo-400 mt-1 shrink-0">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
