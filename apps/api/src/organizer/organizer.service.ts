import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizerService {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string) {
    const organizer = await this.prisma.organizer.findUnique({ where: { userId } });
    if (!organizer) throw new NotFoundException('Không tìm thấy hồ sơ nhà tổ chức');
    return organizer;
  }

  async getProfile(userId: string) {
    const organizer = await this.prisma.organizer.findUnique({ where: { userId } });
    if (!organizer) throw new NotFoundException('Không tìm thấy hồ sơ nhà tổ chức');
    return organizer;
  }

  async create(userId: string, data: { name: string; description?: string; email?: string; phone?: string; website?: string }) {
    const existing = await this.prisma.organizer.findUnique({ where: { userId } });
    if (existing) throw new BadRequestException('Bạn đã có hồ sơ nhà tổ chức');
    return this.prisma.organizer.create({
      data: { ...data, userId },
    });
  }

  async update(userId: string, data: { name?: string; description?: string; email?: string; phone?: string; website?: string; logo?: string }) {
    const organizer = await this.prisma.organizer.findUnique({ where: { userId } });
    if (!organizer) throw new NotFoundException('Không tìm thấy hồ sơ nhà tổ chức');
    return this.prisma.organizer.update({
      where: { userId },
      data,
    });
  }

  async getStats(organizerId: string) {
    const [totalEvents, totalTicketsSold, totalRevenue, recentOrders] = await this.prisma.$transaction([
      this.prisma.event.count({ where: { organizerId } }),
      this.prisma.ticket.count({
        where: {
          ticketType: { event: { organizerId } },
          status: 'VALID',
        },
      }),
      this.prisma.order.aggregate({
        where: {
          status: 'PAID',
          tickets: { some: { ticketType: { event: { organizerId } } } },
        },
        _sum: { finalAmount: true },
      }),
      this.prisma.order.findMany({
        where: {
          status: 'PAID',
          tickets: { some: { ticketType: { event: { organizerId } } } },
        },
        take: 5,
        orderBy: { paidAt: 'desc' },
        select: {
          id: true, finalAmount: true, paidAt: true,
          tickets: {
            take: 1,
            select: { ticketType: { select: { event: { select: { title: true } } } } },
          },
        },
      }),
    ])

    return {
      totalEvents,
      totalTicketsSold,
      totalRevenue: totalRevenue._sum.finalAmount || 0,
      recentOrders: recentOrders.map(o => ({
        id: o.id,
        finalAmount: o.finalAmount,
        paidAt: o.paidAt,
        eventTitle: o.tickets[0]?.ticketType?.event?.title || '',
      })),
    }
  }

  async getTransactions(organizerId: string, page: number, limit: number, eventId?: string, status?: string) {
    const where: any = {
      tickets: { some: { ticketType: { event: { organizerId } } } },
    }
    if (eventId) {
      where.tickets = { some: { ticketType: { eventId } } }
    }
    if (status) {
      where.status = status
    }

    const skip = (page - 1) * limit
    const [data, total] = await this.prisma.$transaction([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          payments: { select: { method: true, status: true, transactionNo: true, paidAt: true, refundAmount: true } },
          tickets: {
            include: {
              ticketType: {
                select: { name: true, price: true, event: { select: { id: true, title: true } } },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ])

    return {
      data: data.map(o => ({
        id: o.id,
        buyer: o.user,
        eventTitle: o.tickets[0]?.ticketType?.event?.title || '',
        ticketType: o.tickets[0]?.ticketType?.name || '',
        quantity: o.tickets.length,
        unitPrice: o.tickets[0]?.ticketType?.price || 0,
        totalAmount: o.totalAmount,
        discount: o.discount,
        finalAmount: o.finalAmount,
        promoCode: o.promoCode,
        status: o.status,
        paidAt: o.paidAt,
        payment: o.payments[0] || null,
        createdAt: o.createdAt,
      })),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    }
  }
}
