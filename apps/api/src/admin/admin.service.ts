import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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
}
