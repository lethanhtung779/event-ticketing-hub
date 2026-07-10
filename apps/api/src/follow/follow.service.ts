import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowService {
  constructor(private prisma: PrismaService) {}

  async follow(userId: string, organizerId: string) {
    const organizer = await this.prisma.organizer.findUnique({ where: { id: organizerId } });
    if (!organizer) throw new NotFoundException('Không tìm thấy nhà tổ chức');

    const existing = await this.prisma.follow.findUnique({
      where: { userId_organizerId: { userId, organizerId } },
    });
    if (existing) throw new ConflictException('Bạn đã theo dõi nhà tổ chức này rồi');

    return this.prisma.follow.create({
      data: { userId, organizerId },
      include: { organizer: true },
    });
  }

  async unfollow(userId: string, organizerId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: { userId_organizerId: { userId, organizerId } },
    });
    if (!existing) throw new NotFoundException('Bạn chưa theo dõi nhà tổ chức này');

    await this.prisma.follow.delete({ where: { id: existing.id } });
    return { message: 'Đã bỏ theo dõi' };
  }

  async findAllByUser(userId: string) {
    const follows = await this.prisma.follow.findMany({
      where: { userId },
      include: {
        organizer: {
          select: {
            id: true,
            name: true,
            description: true,
            logo: true,
            verified: true,
            _count: { select: { events: true, follows: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return follows.map(f => ({
      id: f.organizer.id,
      name: f.organizer.name,
      description: f.organizer.description,
      logo: f.organizer.logo,
      verified: f.organizer.verified,
      eventCount: f.organizer._count.events,
      followerCount: f.organizer._count.follows,
      followedAt: f.createdAt,
    }));
  }

  async isFollowing(userId: string, organizerId: string) {
    const count = await this.prisma.follow.count({
      where: { userId, organizerId },
    });
    return { isFollowing: count > 0 };
  }

  async getFollowers(organizerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [follows, total] = await this.prisma.$transaction([
      this.prisma.follow.findMany({
        where: { organizerId },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, fullName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { organizerId } }),
    ]);
    return {
      data: follows.map(f => f.user),
      total,
      page,
      limit,
    };
  }
}
