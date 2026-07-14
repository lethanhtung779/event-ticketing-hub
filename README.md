# TicketHub - Online Event Ticketing Platform

**Giải pháp đặt vé sự kiện toàn diện cho doanh nghiệp — từ bán vé, kiểm soát cửa, đến báo cáo doanh thu.**

TicketHub là nền tảng quản lý vé sự kiện mã nguồn mở, giải quyết bài toán **đặt vé trùng, vé giả, kiểm soát cửa thủ công, và thiếu dữ liệu analytics** mà các tổ chức sự kiện vừa và nhỏ thường gặp phải. Hệ thống hỗ trợ đa nền tảng (**Web + Mobile App**) với quy trình vận hành khép kín: nhà tổ chức tạo sự kiện → khách hàng đặt vé online → nhân viên soát vé qua QR → báo cáo doanh thu tự động.

> **Ứng dụng thực tế:** Concert, hội thảo, workshop, sự kiện thể thao, festival — bất kỳ tổ chức nào cần bán vé, kiểm soát ra vào và phân tích doanh thu đều có thể triển khai TicketHub trong vài phút.

### Bài toán doanh nghiệp giải quyết

| Vấn đề | Giải pháp của TicketHub |
|--------|------------------------|
| ✅ **Vé giả / check-in thủ công chậm** | QR code động + offline queue + phân biệt trạng thái real‑time |
| ✅ **Đặt vé trùng / quá sức chứa** | Redis locking + waiting list tự động |
| ✅ **Thiếu kênh bán vé online** | Web + Mobile app đa nền tảng, tích hợp VNPay |
| ✅ **Không có dữ liệu khách hàng & analytics** | Dashboard doanh thu, top events, user growth tracking |
| ✅ **Quản lý nhiều sự kiện phức tạp** | Organizer dashboard với 4‑bước wizard tạo event |
| ✅ **Hợp tác tổ chức khó khăn** | Staff role + QR check‑in không cần chọn event |
| ✅ **Thanh toán linh hoạt** | VNPay + pay‑later (giữ vé 15 phút) |
| ✅ **Rào cản ngôn ngữ** | Hỗ trợ song ngữ Việt/Anh |

## Tech Stack

| Layer        | Technology                                                              |
|-------------|-------------------------------------------------------------------------|
| **Web**      | Next.js 16, React 19, TypeScript, Tailwind CSS v4                       |
| **Mobile**   | Expo SDK 56, React Native, TypeScript                                   |
| **Backend**  | NestJS 11, TypeScript, Prisma ORM, PostgreSQL                           |
| **Cache**    | Redis (ticket locking, rate limiting)                                  |
| **Auth**     | JWT (access + refresh tokens), bcrypt, Google OAuth                     |
| **Real-time**| Socket.IO (notifications)                                              |
| **Charts**   | Recharts                                                               |
| **i18n**     | i18next + react-i18next (Vietnamese / English)                         |
| **Payment**  | VNPay integration                                                      |
| **Icons**    | Lucide React (web), Unicode emoji (mobile)                             |

## Architecture

```
event-ticketing-hub/
├── apps/
│   ├── web/                        # Next.js 16 frontend
│   │   ├── app/                    # App Router pages
│   │   │   ├── admin/              # Admin panel
│   │   │   ├── organizer/          # Organizer dashboard
│   │   │   ├── events/             # Public event listing & details
│   │   │   ├── my-tickets/         # User ticket management
│   │   │   └── ...                 # Auth, profile, payments
│   │   ├── components/             # Shared UI components
│   │   ├── lib/                    # API client, i18n, utilities
│   │   ├── stores/                 # Zustand stores
│   │   └── types/                  # TypeScript definitions
│   ├── api/                        # NestJS backend
│   │   ├── prisma/                 # Schema, migrations, seed
│   │   └── src/
│   │       ├── auth/               # Authentication & authorization
│   │       ├── admin/              # Admin endpoints
│   │       ├── organizer/          # Organizer endpoints
│   │       ├── event/              # Event CRUD & listing
│   │       ├── ticket/             # Ticket management & check-in
│   │       ├── payment/            # Payment integration
│   │       ├── category/           # Category management
│   │       ├── review/             # Reviews & ratings
│   │       ├── follow/             # Organizer following
│   │       ├── wishlist/           # Saved events
│   │       ├── websocket/          # Real-time notifications
│   │       └── ...
│   └── mobile/                     # React Native (Expo) mobile app
│       └── src/
│           ├── screens/            # All screens (customer, staff, organizer)
│           ├── components/         # Shared components
│           ├── navigation/         # React Navigation setup
│           ├── api/                # API client
│           ├── stores/             # Auth & notification stores
│           └── i18n/               # Vietnamese / English locales
├── packages/                       # Shared packages
├── docker-compose.yml              # PostgreSQL + Redis
└── pnpm-workspace.yaml             # Monorepo config
```

## Tính năng nổi bật (Business Features)

### Luồng vận hành khép kín
```
Nhà tổ chức tạo sự kiện (Web wizard)
    → Xuất bản lên danh sách công khai
        → Khách hàng tìm kiếm & đặt vé (Web / Mobile)
            → Thanh toán VNPay hoặc giữ vé tạm thời
                → QR code được tạo động, gắn eventId
                    → Nhân viên check-in bằng QR (Mobile app)
                        → Báo cáo doanh thu tự động (Dashboard)
```

### Web App
#### Public
- Event discovery with category, search, location, price, and date filtering
- Category bar: Nhạc sống, Sân khấu & Nghệ thuật, Thể Thao, Hội thảo & Workshop, Tham quan & Trải nghiệm, Khác, Vé bán lại, Blog
- Event detail pages with ticket type selection, reviews, and similar events
- Ticket purchase flow with promo code validation and VNPay payment
- User registration, login, Google OAuth, email verification, password reset
- Multi-language support (Vietnamese / English)
- Dark mode toggle

#### User Dashboard
- My tickets grouped by status (unpaid, valid, checked-in, cancelled)
- Ticket detail with QR code display and PNG download
- Ticket transfer to another email
- Cancel ticket
- Wishlist (saved events)
- Follow/unfollow organizers
- Leave reviews with star ratings
- Order history
- Real-time notifications (Socket.IO)

#### Organizer Dashboard
- Event management (create with 4-step wizard, edit, delete, publish)
- Ticket type CRUD (name, price, quantity, sale windows)
- Sales reports and per-event revenue breakdown
- Organizer profile setup and editing
- Event banner/image upload

#### Admin Panel
- Dashboard overview (users, events, orders, revenue)
- Event management (approve/reject, bulk publish/cancel, CSV export)
- Order management with refunds
- User management (role assignment, CSV export)
- Category CRUD with translations
- Review moderation
- Promo code management
- Revenue dashboard with charts
- Advanced analytics (top events, revenue by category, user growth)
- Check-in tool (lookup by QR token)
- Attendees list per event (CSV export)
- Audit logs
- Send notifications to users
- System settings

### Mobile App (Expo / React Native)
#### Customer
- Event browsing with banner slider and curated sections (featured, trending, weekend, monthly, by category)
- Advanced search with filters (category, location, price range, date range, sort)
- Event detail with ticket types, reviews, organizer follow, wishlist toggle
- Ticket purchase with VNPay (WebView) and pay-later options
- My tickets grouped by status with pay and view actions
- Ticket detail with QR code display, share, save to photo library
- Transfer ticket / Cancel ticket
- Wishlist management
- Profile with avatar upload, change password, email verification
- Notification list with real-time push via Socket.IO
- Language switcher (Vietnamese / English)

#### Staff Check-in
- QR code scanner (expo-camera) with torch toggle
- Auto-detect event from QR code (no event selection needed)
- Scan result with full-screen color flash: green (success), red (already used / invalid)
- Haptic vibration feedback (3 patterns)
- Manual lookup by email, name, or order ID
- Offline check-in queue with sync
- Support for legacy QR codes (backward-compatible)

#### Organizer
- Dashboard overview (events, tickets sold, revenue)
- Event list with status filters
- Organizer profile setup and editing
- Reports with per-event breakdown
- Terms & conditions

### Authentication
- JWT-based access + refresh token flow with auto-refresh
- Role-based access control (USER, STAFF, ADMIN)
- Email / password login
- Google OAuth login
- Email verification
- Password reset via email

### Check-in System
- QR code format: `eventId:::randomHexToken` (auto-embeds event ID)
- Backward-compatible with old-format QR codes (plain hex token)
- Staff scan any QR, system auto-identifies the event
- Conflict detection (already checked-in, invalid status, not found)
- Offline fallback queue stored in AsyncStorage

## Hiệu năng & Độ tin cậy

- **Redis ticket locking** — chống đặt trùng trong lượt cao điểm, giữ vé 15 phút cho người dùng đang thanh toán
- **JWT access + refresh token** — tự động refresh, không lo mất phiên đăng nhập
- **Offline check-in queue** — nhân viên soát vé vẫn làm việc được khi mất mạng, dữ liệu đồng bộ khi có lại kết nối
- **Real‑time notifications** — thông báo ngay lập tức qua Socket.IO khi vé được xác nhận, sự kiện thay đổi trạng thái
- **Phân quyền chi tiết** — 4 role (USER, STAFF, ORGANIZER, ADMIN) với quyền truy cập riêng biệt

## Getting Started

### Prerequisites
- **Node.js** >= 20
- **pnpm** >= 11.8
- **Docker** (for PostgreSQL & Redis)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/lethanhtung779/event-ticketing-hub.git
cd event-ticketing-hub

# 2. Install dependencies
pnpm install

# 3. Start infrastructure (PostgreSQL + Redis)
docker compose up -d

# 4. Configure environment
cp apps/api/.env.example apps/api/.env
# Edit .env with your database URL and other settings

# 5. Push database schema and seed data
cd apps/api
npx prisma db push
npx prisma db seed
cd ../..

# 6. Start backend
cd apps/api
pnpm start:dev     # Backend at http://localhost:3001

# 7. Start web (in another terminal)
cd apps/web
pnpm dev           # Frontend at http://localhost:3000

# 8. Start mobile (in another terminal)
cd apps/mobile
npx expo start     # Expo dev server
```

### Default Accounts

| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| Admin | admin@ticketing.com   | admin123  |
| Staff | staff@ticketing.com   | staff123  |
| User  | user@test.com         | user123   |

## Available Scripts

### Web (`apps/web`)
- `pnpm dev` - Start development server
- `pnpm build` - Production build
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Backend (`apps/api`)
- `pnpm start:dev` - Watch mode development
- `pnpm build` - Production build
- `pnpm start:prod` - Start production server
- `pnpm prisma:seed` - Seed database
- `pnpm test` - Run unit tests
- `pnpm test:e2e` - Run e2e tests

### Mobile (`apps/mobile`)
- `npx expo start` - Start Expo dev server
- `npx expo run:android` - Build and run on Android
- `npx expo run:ios` - Build and run on iOS
- `npx expo start --clear` - Clear Metro cache and start

## API Documentation

Swagger documentation is available at `http://localhost:3001/api/docs` when the backend is running.

## Deployment (Free Tier)

### 1. PostgreSQL — Supabase

1. Đăng ký [supabase.com](https://supabase.com) (GitHub login)
2. Tạo project mới, copy **Connection string** (URI) từ Settings → Database
3. Thay `postgresql://...` vào biến `DATABASE_URL`

### 2. Redis — Upstash

1. Đăng ký [upstash.com](https://upstash.com) (GitHub login)
2. Tạo Redis database (Region gần nhất)
3. Copy **UPSTASH_REDIS_REST_URL** và **UPSTASH_REDIS_REST_TOKEN**

### 3. Backend API — Render

1. Fork repo, vào [render.com](https://render.com) → New Web Service
2. Chọn repo, branch `main`
3. **Build Command:**
   ```bash
   pnpm install --frozen-lockfile && pnpm --filter api build && npx prisma generate --schema=apps/api/prisma/schema.prisma
   ```
4. **Start Command:** `node apps/api/dist/main`
5. **Plan:** Free
6. **Health Check Path:** `/auth/login`
7. **Environment Variables (cần set):**

   | Variable | Giá trị |
   |---|---|
   | `DATABASE_URL` | Connection string từ Supabase |
   | `JWT_SECRET` | Chuỗi bí mật (vd: openssl rand -hex 32) |
   | `REDIS_HOST` | `upstash.com` (hoặc host từ Upstash) |
   | `REDIS_PORT` | `6379` |
   | `CORS_ORIGIN` | `https://<web-app>.vercel.app` |
   | `FRONTEND_URL` | `https://<web-app>.vercel.app` |
   | `BACKEND_URL` | `https://<api>.onrender.com` |
   | `SMTP_HOST` | (để trống nếu chưa có SMTP) |
   | `GOOGLE_CLIENT_ID` | Google OAuth Client ID |
   | `VNPAY_*` | (bỏ qua nếu chưa dùng VNPay) |

8. Deploy xong, copy URL dạng `https://<api>.onrender.com`

### 4. Web Frontend — Vercel

1. Vào [vercel.com](https://vercel.com) → Add New Project → Import GitHub repo
2. **Root Directory:** `apps/web`
3. **Framework Preset:** Next.js (tự động detect)
4. **Environment Variables:**

   | Variable | Giá trị |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://<api>.onrender.com` |

5. Deploy — web app có sẵn tại `https://<web>.vercel.app`

### 5. Mobile App

```bash
# Build APK locally
cd apps/mobile
npx expo run:android

# Hoặc dùng EAS Build (30 builds/tháng free)
npx eas build --platform android --profile preview
```

> **Lưu ý:** Với Render free tier, API sẽ **sleep** sau 15 phút không có request. Khi có request đầu tiên, cần chờ ~30s để khởi động lại. Để tránh sleep, có thể dùng [cron-job.org](https://cron-job.org) ping health check mỗi 10 phút.

## License

ISC
