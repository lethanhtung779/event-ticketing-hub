import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, role: true, isVerified: true, avatar: true, createdAt: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { fullName?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, email: true, fullName: true, role: true, isVerified: true, avatar: true },
    });
  }

  async getMyTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      include: {
        ticketType: {
          include: { event: { select: { id: true, title: true, startTime: true, location: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        tickets: {
          include: {
            ticketType: {
              select: { id: true, name: true, price: true, event: { select: { id: true, title: true, startTime: true, location: true, bannerUrl: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
