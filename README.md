# TicketHub - Online Event Ticketing Platform

A full-stack event ticketing platform built with **Next.js 16** (frontend) and **NestJS** (backend), featuring a comprehensive admin panel, organizer dashboard, and public event discovery.

## Tech Stack

| Layer        | Technology                                                    |
|-------------|---------------------------------------------------------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS v4            |
| **Backend**  | NestJS 11, TypeScript, Prisma ORM, PostgreSQL                |
| **Cache**    | Redis (ticket locking, rate limiting)                        |
| **Auth**     | JWT (access + refresh tokens), bcrypt                        |
| **State**    | Zustand (client-side), react-hook-form + zod                 |
| **i18n**     | i18next + react-i18next (Vietnamese / English)               |
| **Real-time**| Socket.IO (notifications)                                    |
| **Charts**   | Recharts                                                     |
| **Icons**    | Lucide React                                                 |

## Architecture

```
event-ticketing-hub/
├── apps/
│   ├── web/                   # Next.js 16 frontend
│   │   ├── app/               # App Router pages
│   │   │   ├── admin/         # Admin panel (events, users, orders, etc.)
│   │   │   ├── organizer/     # Organizer dashboard
│   │   │   ├── events/        # Public event listing & details
│   │   │   ├── my-tickets/    # User ticket management
│   │   │   └── ...
│   │   ├── components/        # Shared UI components
│   │   ├── lib/               # API client, i18n, utilities
│   │   ├── stores/            # Zustand stores
│   │   └── types/             # TypeScript definitions
│   ├── api/                   # NestJS backend
│   │   ├── prisma/            # Schema, migrations, seed
│   │   └── src/
│   │       ├── auth/          # Authentication & authorization
│   │       ├── admin/         # Admin endpoints
│   │       ├── organizer/     # Organizer endpoints
│   │       ├── event/         # Event CRUD & listing
│   │       ├── ticket/        # Ticket management
│   │       ├── order/         # Order processing
│   │       ├── payment/       # Payment integration
│   │       ├── category/      # Category management
│   │       └── ...
│   └── mobile/                # React Native (Expo) app
├── packages/                  # Shared packages
├── docker-compose.yml         # PostgreSQL + Redis
└── pnpm-workspace.yaml        # Monorepo config
```

## Features

### Public
- Event discovery with category, search, and location filtering
- Category bar: Nhạc sống, Sân khấu & Nghệ thuật, Thể Thao, Hội thảo & Workshop, Tham quan & Trải nghiệm, Khác, Vé bán lại, Blog
- Event detail pages with ticket type selection
- Ticket purchase flow
- User registration, login, email verification, password reset
- Multi-language support (Vietnamese / English)

### Organizer Dashboard
- Event management (create, edit, delete, publish)
- Sales reports and analytics
- Organizer terms & guidelines
- Notes confirmation modal before creating events

### Admin Panel
- Full CRUD for events, users, categories, promo codes
- Order management with refunds
- Check-in system with QR code scanning
- Revenue dashboard with charts
- User activity audit logs
- Review moderation
- System settings & notifications

### Authentication
- JWT-based access + refresh token flow
- Role-based access control (USER, STAFF, ADMIN)
- Email verification
- Password reset via email

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

# 6. Start development servers
cd apps/api
pnpm start:dev     # Backend at http://localhost:3001
cd ../web
pnpm dev           # Frontend at http://localhost:3000
```

### Default Accounts

| Role  | Email                 | Password  |
|-------|-----------------------|-----------|
| Admin | admin@ticketing.com   | admin123  |
| Staff | staff@ticketing.com   | staff123  |
| User  | user@test.com         | user123   |

## Available Scripts

### Frontend (`apps/web`)
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

## API Documentation

Swagger documentation is available at `http://localhost:3001/api/docs` when the backend is running.

## License

ISC
