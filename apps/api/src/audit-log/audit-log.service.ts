import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async log(userId: string, action: string, entity: string, entityId?: string, detail?: string) {
    await this.prisma.auditLog.create({ data: { userId, action, entity, entityId, detail } });
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' }, include: { user: { select: { fullName: true, email: true } } } }),
      this.prisma.auditLog.count(),
    ]);
    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }
}
