# TicketHub - Online Event Ticketing Platform

**An end-to-end event ticketing solution for businesses — from ticket sales and gate control to revenue reports.**

TicketHub is an open-source event ticketing platform that solves the real-world problems of **duplicate bookings, counterfeit tickets, manual check-ins, and lack of analytics** that small-to-medium event organizers face. It provides a unified **Web + Mobile App** with a closed-loop operational workflow: organizers create events → customers book tickets online → staff scan QR codes at the door → revenue reports are generated automatically.

> **Real-world use cases:** Concerts, conferences, workshops, sports events, festivals — any organization that needs ticket sales, access control, and revenue analytics can deploy TicketHub in minutes.

### Business Problems Solved

| Problem | TicketHub Solution |
|---------|-------------------|
| ✅ **Counterfeit tickets / slow manual check-in** | Dynamic QR codes + offline queue + real-time status validation |
| ✅ **Duplicate bookings / overselling** | Redis locking + automatic waiting list |
| ✅ **No online sales channel** | Cross-platform Web + Mobile app, VNPay integrated |
| ✅ **No customer data & analytics** | Revenue dashboard, top events, user growth tracking |
| ✅ **Complex multi-event management** | Organizer dashboard with 4-step event creation wizard |
| ✅ **Hard to coordinate event staff** | Staff role + QR check-in without event selection |
| ✅ **Rigid payment options** | VNPay + pay-later (15-minute hold) |
| ✅ **Language barrier** | Bilingual support (Vietnamese / English) |

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

## Key Business Features

### Closed-Loop Workflow
```
Organizer creates event (Web wizard)
    → Publish to public listing
        → Customer discovers & books tickets (Web / Mobile)
            → VNPay payment or temporary hold
                → Dynamic QR code generated with embedded eventId
                    → Staff scans QR for check-in (Mobile app)
                        → Automatic revenue reports (Dashboard)
```

### Web App
#### Public
- Event discovery with category, search, location, price, and date filtering
- Category bar: Music, Stage & Arts, Sports, Workshops, Tours & Experiences, Other, Resale, Blog
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

## Performance & Reliability

- **Redis ticket locking** — prevents duplicate bookings during peak traffic, holds tickets for 15 minutes during payment
- **JWT access + refresh tokens** — automatic silent refresh, no session loss
- **Offline check-in queue** — staff can scan tickets even without internet; data syncs when connection resumes
- **Real-time notifications** — instant Socket.IO push on ticket confirmation and event status changes
- **Granular access control** — 4 roles (USER, STAFF, ORGANIZER, ADMIN) with distinct permissions

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

## License

ISC
