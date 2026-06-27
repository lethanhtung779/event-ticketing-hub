import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrganizerService {
  constructor(private prisma: PrismaService) {}

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
}
