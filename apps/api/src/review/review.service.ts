import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(eventId: string, userId: string, data: { rating: number; comment?: string }) {
    if (data.rating < 1 || data.rating > 5) throw new BadRequestException('Rating must be 1-5');
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Event not found');

    const existing = await this.prisma.review.findUnique({ where: { eventId_userId: { eventId, userId } } });
    if (existing) throw new BadRequestException('Bạn đã đánh giá sự kiện này rồi');

    return this.prisma.review.create({ data: { eventId, userId, rating: data.rating, comment: data.comment } });
  }

  async findByEvent(eventId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.review.findMany({ where: { eventId }, skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { id: true, fullName: true } } } }),
      this.prisma.review.count({ where: { eventId } }),
    ]);
    const avg = await this.prisma.review.aggregate({ where: { eventId }, _avg: { rating: true } });
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit), avgRating: avg._avg.rating ?? 0 } };
  }
}
