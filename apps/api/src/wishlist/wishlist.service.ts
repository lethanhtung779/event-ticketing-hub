import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private prisma: PrismaService) {}

  async save(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const existing = await this.prisma.savedEvent.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (existing) throw new ConflictException('Event already saved');

    return this.prisma.savedEvent.create({
      data: { userId, eventId },
      include: { event: { include: { category: true, ticketTypes: true } } },
    });
  }

  async unsave(userId: string, eventId: string) {
    const saved = await this.prisma.savedEvent.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!saved) throw new NotFoundException('Saved event not found');

    await this.prisma.savedEvent.delete({ where: { id: saved.id } });
    return { message: 'Đã bỏ lưu sự kiện' };
  }

  async findAllByUser(userId: string) {
    const saved = await this.prisma.savedEvent.findMany({
      where: { userId },
      include: {
        event: {
          include: { category: true, ticketTypes: true, organizer: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return saved.map((s) => ({
      id: s.id,
      savedAt: s.createdAt,
      event: s.event,
    }));
  }

  async isSaved(userId: string, eventId: string) {
    const saved = await this.prisma.savedEvent.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    return { isSaved: !!saved };
  }
}
