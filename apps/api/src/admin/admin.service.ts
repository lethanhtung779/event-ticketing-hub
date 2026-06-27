import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async getStats(fromDate?: string, toDate?: string) {
    const dateFilter: any = {};
    if (fromDate) dateFilter.createdAt = { ...dateFilter.createdAt, gte: new Date(fromDate) };
    if (toDate) dateFilter.createdAt = { ...dateFilter.createdAt, lte: new Date(toDate) };

    const hasDateFilter = fromDate || toDate;

    const [totalUsers, totalEvents, totalTickets, checkedIn, categories, totalOrders, totalRevenueAgg] = await Promise.all([
      this.prisma.user.count(hasDateFilter ? { where: dateFilter } : undefined),
      this.prisma.event.count(hasDateFilter ? { where: dateFilter } : undefined),
      this.prisma.ticket.count({ where: { status: 'VALID', ...(hasDateFilter ? dateFilter : {}) } }),
      this.prisma.ticket.count({ where: { status: 'CHECKED_IN' } }),
      this.prisma.category.count(),
      this.prisma.order.count({ where: { status: 'PAID', ...(hasDateFilter ? { paidAt: { ...(fromDate ? { gte: new Date(fromDate) } : {}), ...(toDate ? { lte: new Date(toDate) } : {}) } } : {}) } }),
      this.prisma.order.aggregate({ where: { status: 'PAID' }, _sum: { finalAmount: true } }),
    ]);

    const recentUsers = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, fullName: true, email: true, role: true, createdAt: true },
    });

    const recentOrders = await this.prisma.order.findMany({
      where: { status: 'PAID' },
      orderBy: { paidAt: 'desc' },
      take: 5,
      include: { user: { select: { fullName: true, email: true } } },
    });

    return {
      totalUsers,
      totalEvents,
      totalTickets,
      checkedInTickets: checkedIn,
      totalCategories: categories,
      totalOrders,
      revenue: totalRevenueAgg._sum.finalAmount || 0,
      recentUsers,
      recentOrders,
    };
  }

  async getRevenueReport(fromDate?: string, toDate?: string) {
    const where: any = { status: 'PAID' };
    if (fromDate) where.paidAt = { ...where.paidAt, gte: new Date(fromDate) };
    if (toDate) where.paidAt = { ...where.paidAt, lte: new Date(toDate) };

    const payments = await this.prisma.payment.findMany({
      where,
      orderBy: { paidAt: 'asc' },
      select: { amount: true, paidAt: true, method: true, orderId: true },
    });

    const totalRevenue = payments.reduce((s, p) => s + p.amount, 0);
    const byMethod = payments.reduce<Record<string, number>>((acc, p) => {
      acc[p.method] = (acc[p.method] || 0) + p.amount;
      return acc;
    }, {});

    return { totalRevenue, totalTransactions: payments.length, byMethod, payments };
  }

  async getAttendees(eventId: string, format?: string) {
    const attendees = await this.prisma.ticket.findMany({
      where: { ticketType: { eventId }, status: 'CHECKED_IN' },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        ticketType: { select: { name: true } },
      },
      orderBy: { checkedInAt: 'desc' },
    });

    if (format === 'csv') {
      const header = 'STT,Họ tên,Email,Loại vé,Thời gian check-in';
      const rows = attendees.map((a, i) =>
        `${i + 1},${a.user.fullName},${a.user.email},${a.ticketType.name},${a.checkedInAt?.toISOString() || ''}`
      );
      return [header, ...rows].join('\n');
    }

    return attendees;
  }

  async getUsers(page: number, limit: number, search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, fullName: true, role: true, isVerified: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, email: true, fullName: true, role: true, isVerified: true, createdAt: true,
        _count: { select: { tickets: true, reviews: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateUserRole(id: string, role: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { role: role as any },
      select: { id: true, email: true, fullName: true, role: true },
    });
  }

  async getPromoCodes(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.promoCode.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.promoCode.count(),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async createPromoCode(body: { code: string; discountPct: number; maxUses: number; expiresAt?: string; isActive?: boolean }) {
    const existing = await this.prisma.promoCode.findUnique({ where: { code: body.code } });
    if (existing) throw new ConflictException('Mã giảm giá đã tồn tại');
    return this.prisma.promoCode.create({
      data: {
        code: body.code,
        discountPct: body.discountPct,
        maxUses: body.maxUses,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        isActive: body.isActive ?? true,
      },
    });
  }

  async updatePromoCode(id: string, body: any) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
    const data: any = { ...body };
    if (body.expiresAt) data.expiresAt = new Date(body.expiresAt);
    return this.prisma.promoCode.update({ where: { id }, data });
  }

  async deletePromoCode(id: string) {
    const promo = await this.prisma.promoCode.findUnique({ where: { id } });
    if (!promo) throw new NotFoundException('Promo code not found');
    return this.prisma.promoCode.delete({ where: { id } });
  }

  // Orders
  async getOrders(page: number, limit: number, status?: string, search?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          _count: { select: { tickets: true } },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getOrder(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        tickets: {
          include: {
            ticketType: { select: { name: true, price: true, event: { select: { title: true } } } },
          },
        },
        payments: true,
      },
    });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // Reviews
  async getReviews(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          event: { select: { id: true, title: true } },
        },
      }),
      this.prisma.review.count(),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async deleteReview(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    return this.prisma.review.delete({ where: { id } });
  }

  // Waiting list
  async getWaitingList(eventId: string) {
    return this.prisma.waitingListEntry.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // Export
  async exportEvents() {
    const events = await this.prisma.event.findMany({
      include: { category: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const header = 'ID,Title,Description,Location,Category,Status,StartTime,EndTime,CreatedAt';
    const rows = events.map(e =>
      `${e.id},${e.title.replace(/,/g, ';')},${(e.description || '').replace(/,/g, ';')},${e.location.replace(/,/g, ';')},${e.category?.name || ''},${e.status},${e.startTime.toISOString()},${e.endTime.toISOString()},${e.createdAt.toISOString()}`
    );
    return [header, ...rows].join('\n');
  }

  async exportUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, email: true, fullName: true, role: true, isVerified: true, createdAt: true },
    });

    const header = 'ID,Email,FullName,Role,Verified,CreatedAt';
    const rows = users.map(u =>
      `${u.id},${u.email},${u.fullName},${u.role},${u.isVerified},${u.createdAt.toISOString()}`
    );
    return [header, ...rows].join('\n');
  }

  // Bulk
  async bulkPublishEvents(ids: string[]) {
    const events = await this.prisma.event.findMany({ where: { id: { in: ids }, status: 'DRAFT' } });
    const updated = await this.prisma.event.updateMany({
      where: { id: { in: ids }, status: 'DRAFT' },
      data: { status: 'PUBLISHED' },
    });
    return { count: updated.count, events: events.map(e => ({ id: e.id, title: e.title })) };
  }

  async bulkCancelEvents(ids: string[]) {
    const events = await this.prisma.event.findMany({
      where: { id: { in: ids }, status: { in: ['DRAFT', 'PUBLISHED'] } },
    });
    const updated = await this.prisma.event.updateMany({
      where: { id: { in: ids }, status: { in: ['DRAFT', 'PUBLISHED'] } },
      data: { status: 'CANCELLED' },
    });
    return { count: updated.count, events: events.map(e => ({ id: e.id, title: e.title })) };
  }

  // Notifications
  async sendNotification(data: { userIds?: string[]; allUsers?: boolean; subject: string; message: string }) {
    let users: { id: string; email: string; fullName: string }[] = []

    if (data.allUsers) {
      users = await this.prisma.user.findMany({ select: { id: true, email: true, fullName: true } })
    } else if (data.userIds?.length) {
      users = await this.prisma.user.findMany({
        where: { id: { in: data.userIds } },
        select: { id: true, email: true, fullName: true },
      })
    }

    for (const user of users) {
      await this.emailService.send(
        user.email,
        data.subject,
        `<h2>Chào ${user.fullName},</h2><p>${data.message.replace(/\n/g, '<br>')}</p>`,
      )
    }

    return { sent: users.length }
  }

  // Event report
  async getEventReport(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        ticketTypes: {
          select: {
            id: true, name: true, price: true, totalQuantity: true, soldQuantity: true,
          },
        },
        reviews: { select: { rating: true } },
        _count: { select: { waitingListEntries: true } },
      },
    })
    if (!event) throw new NotFoundException('Event not found')

    const totalSold = event.ticketTypes.reduce((s, t) => s + t.soldQuantity, 0)
    const totalCapacity = event.ticketTypes.reduce((s, t) => s + t.totalQuantity, 0)
    const avgRating = event.reviews.length
      ? event.reviews.reduce((s, r) => s + r.rating, 0) / event.reviews.length
      : null

    return {
      ...event,
      totalSold,
      totalCapacity,
      fillRate: totalCapacity > 0 ? Math.round((totalSold / totalCapacity) * 100) : 0,
      avgRating,
    }
  }

  // Translations
  async upsertEventTranslation(eventId: string, language: string, data: { title?: string; description?: string; location?: string }) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } })
    if (!event) throw new NotFoundException('Event not found')
    return this.prisma.eventTranslation.upsert({
      where: { eventId_language: { eventId, language } },
      create: { eventId, language, title: data.title || event.title, description: data.description || event.description, location: data.location || event.location },
      update: { ...(data.title && { title: data.title }), ...(data.description && { description: data.description }), ...(data.location && { location: data.location }) },
    })
  }

  async upsertCategoryTranslation(categoryId: string, language: string, data: { name: string }) {
    const cat = await this.prisma.category.findUnique({ where: { id: categoryId } })
    if (!cat) throw new NotFoundException('Category not found')
    return this.prisma.categoryTranslation.upsert({
      where: { categoryId_language: { categoryId, language } },
      create: { categoryId, language, name: data.name },
      update: { name: data.name },
    })
  }

  async upsertTicketTypeTranslation(ticketTypeId: string, language: string, data: { name: string }) {
    const tt = await this.prisma.ticketType.findUnique({ where: { id: ticketTypeId } })
    if (!tt) throw new NotFoundException('TicketType not found')
    return this.prisma.ticketTypeTranslation.upsert({
      where: { ticketTypeId_language: { ticketTypeId, language } },
      create: { ticketTypeId, language, name: data.name },
      update: { name: data.name },
    })
  }

  // Advanced analytics
  async getAnalytics() {
    const [
      topEvents,
      monthlyRevenue,
      userGrowth,
      ticketTypePerformance,
      totalStats,
    ] = await this.prisma.$transaction([
      // Top 5 best-selling events
      this.prisma.event.findMany({
        where: { status: { in: ['PUBLISHED', 'COMPLETED'] } },
        orderBy: { ticketTypes: { _count: 'desc' } },
        take: 5,
        include: {
          _count: { select: { ticketTypes: true } },
          ticketTypes: { select: { soldQuantity: true, price: true } },
        },
      }),

      // Monthly revenue (last 12 months)
      this.prisma.$queryRawUnsafe<Array<{ month: string; revenue: number; orders: number }>>(`
        SELECT to_char("paidAt", 'YYYY-MM') as month,
               SUM("finalAmount")::int as revenue,
               COUNT(*)::int as orders
        FROM "Order"
        WHERE status = 'PAID'
          AND "paidAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `),

      // User growth (last 12 months)
      this.prisma.$queryRawUnsafe<Array<{ month: string; count: number }>>(`
        SELECT to_char("createdAt", 'YYYY-MM') as month,
               COUNT(*)::int as count
        FROM "User"
        WHERE "createdAt" >= NOW() - INTERVAL '12 months'
        GROUP BY month
        ORDER BY month ASC
      `),

      // Ticket type performance
      this.prisma.ticketType.findMany({
        take: 10,
        orderBy: { soldQuantity: 'desc' },
        include: {
          event: { select: { title: true } },
          _count: { select: { tickets: true } },
        },
      }),

      // Total stats
      this.prisma.order.aggregate({
        where: { status: 'PAID' },
        _sum: { finalAmount: true },
        _count: true,
      }),
    ])

    // Calculate revenue by category
    const catRevenueRaw = await this.prisma.order.findMany({
      where: { status: 'PAID' },
      select: {
        finalAmount: true,
        tickets: {
          select: { ticketType: { select: { event: { select: { category: { select: { name: true } } } } } } },
        },
      },
    })

    const catRevenueMap: Record<string, number> = {}
    for (const o of catRevenueRaw) {
      const catName = o.tickets[0]?.ticketType?.event?.category?.name || 'Khác'
      catRevenueMap[catName] = (catRevenueMap[catName] || 0) + o.finalAmount
    }
    const revenueByCategoryArr = Object.entries(catRevenueMap)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)

    // Top events with sold count
    const topEventsData = topEvents.map(e => {
      const totalSold = e.ticketTypes.reduce((s, t) => s + t.soldQuantity, 0)
      const totalRevenue = e.ticketTypes.reduce((s, t) => s + t.soldQuantity * t.price, 0)
      return { id: e.id, title: e.title, totalSold, totalRevenue }
    })

    return {
      topEvents: topEventsData,
      revenueByCategory: revenueByCategoryArr,
      monthlyRevenue,
      userGrowth,
      ticketTypePerformance: ticketTypePerformance.map(tt => ({
        name: tt.name,
        eventTitle: tt.event.title,
        soldQuantity: tt.soldQuantity,
        price: tt.price,
      })),
      totalRevenue: totalStats._sum.finalAmount || 0,
      totalPaidOrders: totalStats._count,
    }
  }

  // Audit log with filters
  async getAuditLogs(page: number, limit: number, filters?: { action?: string; entity?: string; fromDate?: string; toDate?: string }) {
    const where: any = {}
    if (filters?.action) where.action = filters.action
    if (filters?.entity) where.entity = filters.entity
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {}
      if (filters.fromDate) where.createdAt.gte = new Date(filters.fromDate)
      if (filters.toDate) where.createdAt.lte = new Date(filters.toDate)
    }

    const skip = (page - 1) * limit
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ])
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } }
  }
}
