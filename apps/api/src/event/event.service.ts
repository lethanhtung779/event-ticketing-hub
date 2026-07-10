import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { EmailService } from '../email/email.service';
import { AppGateway } from '../websocket/websocket.gateway';
import { RedisService } from '../redis/redis.service';

function applyTranslation<T extends { translations?: { language: string; [key: string]: any }[] }>(item: T, lang: string, fields: string[]): T {
  if (!lang || lang === 'vi' || !item.translations?.length) return item;
  const t = item.translations.find(t => t.language === lang);
  if (!t) return item;
  const translated = { ...item };
  for (const field of fields) {
    if (t[field]) (translated as any)[field] = t[field];
  }
  delete (translated as any).translations;
  return translated;
}

@Injectable()
export class EventService {
  constructor(
    private prisma: PrismaService,
    private auditLog: AuditLogService,
    private emailService: EmailService,
    private gateway: AppGateway,
    private redis: RedisService,
  ) {}

  private async clearEventListCache() {
    const keys = await this.redis.keys('events:list:*');
    if (keys.length > 0) await this.redis.del(...keys);
  }

  async createEvent(userId: string, body: any) {
    const organizer = await this.prisma.organizer.findUnique({ where: { userId } });
    if (!organizer) throw new BadRequestException('Bạn chưa có hồ sơ nhà tổ chức. Vui lòng tạo hồ sơ trước.');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    const isAdmin = user?.role === 'ADMIN';
    const status = isAdmin && body.status === 'PUBLISHED' ? 'PUBLISHED' : 'PENDING';

    const event = await this.prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        bannerUrl: body.bannerUrl,
        categoryId: body.categoryId,
        status,
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        isOnline: body.isOnline ?? false,
        googleMapsLink: body.googleMapsLink,
        eventType: body.eventType,
        organizerId: organizer.id,
        venueName: body.venueName,
        province: body.province,
        district: body.district,
        streetAddress: body.streetAddress,
        bankName: body.bankName,
        bankAccountNumber: body.bankAccountNumber,
        bankAccountHolder: body.bankAccountHolder,
        paymentInfo: body.paymentInfo,
      },
    });
    await this.auditLog.log(userId, 'CREATE_EVENT', 'Event', event.id);
    await this.clearEventListCache();
    return event;
  }

  private async checkOwnership(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'ADMIN') {
      const organizer = await this.prisma.organizer.findUnique({ where: { userId } });
      if (!organizer || event.organizerId !== organizer.id) {
        throw new BadRequestException('Bạn không có quyền thao tác trên sự kiện này');
      }
    }
    return event;
  }

  async updateEvent(userId: string, id: string, body: any) {
    const event = await this.checkOwnership(userId, id);
    if (event.status === 'CANCELLED') throw new BadRequestException('Không thể chỉnh sửa sự kiện đã hủy');

    const data: any = { ...body };
    delete data.status;
    if (body.startTime) data.startTime = new Date(body.startTime);
    if (body.endTime) data.endTime = new Date(body.endTime);
    delete data.organizerId;
    const updated = await this.prisma.event.update({ where: { id }, data });
    await this.auditLog.log(userId, 'UPDATE_EVENT', 'Event', id);
    await this.clearEventListCache();
    return updated;
  }

  async deleteEvent(userId: string, id: string) {
    await this.checkOwnership(userId, id);
    await this.prisma.event.delete({ where: { id } });
    await this.auditLog.log(userId, 'DELETE_EVENT', 'Event', id);
    await this.clearEventListCache();
  }

  async publishEvent(userId: string, id: string) {
    const event = await this.checkOwnership(userId, id);
    if (event.status !== 'DRAFT') throw new BadRequestException('Chỉ có thể công bố sự kiện ở trạng thái DRAFT');
    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
    await this.auditLog.log(userId, 'PUBLISH_EVENT', 'Event', id);
    await this.clearEventListCache();
    return updated;
  }

  async approveEvent(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'ADMIN') throw new BadRequestException('Chỉ admin mới có quyền phê duyệt sự kiện');

    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại');
    if (event.status !== 'PENDING') throw new BadRequestException('Chỉ có thể phê duyệt sự kiện ở trạng thái PENDING');

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
    await this.auditLog.log(userId, 'APPROVE_EVENT', 'Event', id);

    // Notify organizer
    await this.notifyOrganizer(event, 'duyệt');
    this.gateway.broadcast('event_update', { eventId: id, status: 'PUBLISHED' });
    await this.clearEventListCache();

    return updated;
  }

  async rejectEvent(userId: string, id: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'ADMIN') throw new BadRequestException('Chỉ admin mới có quyền từ chối sự kiện');

    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại');
    if (event.status !== 'PENDING') throw new BadRequestException('Chỉ có thể từ chối sự kiện ở trạng thái PENDING');

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'REJECTED' },
    });
    await this.auditLog.log(userId, 'REJECT_EVENT', 'Event', id);

    // Notify organizer
    await this.notifyOrganizer(event, 'từ chối');
    await this.clearEventListCache();

    return updated;
  }

  async cancelEvent(userId: string, id: string) {
    const event = await this.checkOwnership(userId, id);
    if (event.status === 'CANCELLED') throw new BadRequestException('Sự kiện đã bị hủy trước đó');

    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    await this.auditLog.log(userId, 'CANCEL_EVENT', 'Event', id);

    // Auto-refund all paid orders
    await this.processRefundsForEvent(event.id, event.title);
    await this.clearEventListCache();

    return updated;
  }

  private async processRefundsForEvent(eventId: string, eventTitle: string) {
    const paidOrders = await this.prisma.order.findMany({
      where: {
        status: 'PAID',
        tickets: { some: { ticketType: { eventId } } },
      },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
        tickets: { where: { status: 'VALID' } },
        payments: { where: { status: 'PAID' } },
      },
    });

    for (const order of paidOrders) {
      try {
        await this.prisma.$transaction([
          this.prisma.payment.updateMany({
            where: { orderId: order.id, status: 'PAID' },
            data: { status: 'REFUNDED', refundAmount: order.finalAmount, refundReason: `Sự kiện "${eventTitle}" đã bị hủy` },
          }),
          this.prisma.order.update({
            where: { id: order.id },
            data: { status: 'REFUNDED' },
          }),
          this.prisma.ticket.updateMany({
            where: { orderId: order.id, status: 'VALID' },
            data: { status: 'CANCELLED' },
          }),
        ]);

        // Notify user via WebSocket
        this.gateway.sendToUser(order.user.id, 'ticket_cancelled', {
          orderId: order.id,
          eventTitle,
          message: `Sự kiện "${eventTitle}" đã bị hủy. Tiền sẽ được hoàn lại.`,
        });

        // Notify via email
        await this.emailService.send(
          order.user.email,
          `Hoàn tiền - Sự kiện "${eventTitle}" đã bị hủy`,
          `<h2>Chào ${order.user.fullName},</h2>
           <p>Sự kiện <strong>${eventTitle}</strong> bạn đã mua vé đã bị hủy.</p>
           <p>Số tiền <strong>${order.finalAmount.toLocaleString()} VND</strong> sẽ được hoàn lại.</p>
           <p>Xin lỗi vì sự bất tiện này.</p>`,
        );
      } catch (error) {
        console.error(`[REFUND ERROR] Order ${order.id}: ${error}`);
      }
    }
  }

  private async notifyOrganizer(event: { id: string; title: string; organizerId: string | null }, action: string) {
    if (!event.organizerId) return;
    const organizer = await this.prisma.organizer.findUnique({
      where: { id: event.organizerId },
      include: { user: { select: { id: true, email: true, fullName: true } } },
    });
    if (!organizer) return;

    const subject = `Sự kiện "${event.title}" đã được ${action}`;
    const html = `<h2>Chào ${organizer.user.fullName},</h2>
      <p>Sự kiện <strong>${event.title}</strong> của bạn đã được <strong>${action}</strong>.</p>
      <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/organizer/events/${event.id}">Xem chi tiết</a></p>`;

    this.gateway.sendToUser(organizer.user.id, 'event_status_changed', {
      eventId: event.id,
      status: action === 'duyệt' ? 'PUBLISHED' : 'REJECTED',
      message: `Sự kiện "${event.title}" đã được ${action}.`,
    });

    await this.emailService.send(organizer.user.email, subject, html);
  }

  async createTicketType(body: { eventId: string; name: string; price: number; totalQuantity: number; minPerOrder?: number; maxPerOrder?: number; saleStartTime?: string; saleEndTime?: string }) {
    const event = await this.prisma.event.findUnique({ where: { id: body.eventId } });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại');

    const data: any = {
      eventId: body.eventId,
      name: body.name,
      price: body.price,
      totalQuantity: body.totalQuantity,
    };
    if (body.minPerOrder !== undefined) data.minPerOrder = body.minPerOrder;
    if (body.maxPerOrder !== undefined) data.maxPerOrder = body.maxPerOrder;
    if (body.saleStartTime) data.saleStartTime = new Date(body.saleStartTime);
    if (body.saleEndTime) data.saleEndTime = new Date(body.saleEndTime);

    const ticketType = await this.prisma.ticketType.create({ data });
    await this.clearEventListCache();
    return ticketType;
  }

  async updateTicketType(ticketTypeId: string, body: any) {
    const tt = await this.prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
    if (!tt) throw new NotFoundException('Loại vé không tồn tại');

    const data: any = { ...body };
    if (body.saleStartTime) data.saleStartTime = new Date(body.saleStartTime);
    if (body.saleEndTime) data.saleEndTime = new Date(body.saleEndTime);
    delete data.eventId;

    const updated = await this.prisma.ticketType.update({ where: { id: ticketTypeId }, data });
    await this.clearEventListCache();
    return updated;
  }

  async deleteTicketType(eventId: string, ticketTypeId: string) {
  const tt = await this.prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
  if (!tt) throw new NotFoundException('Loại vé không tồn tại');
  if (tt.eventId !== eventId) throw new BadRequestException('Loại vé không thuộc sự kiện này');
  if (tt.soldQuantity > 0) throw new BadRequestException('Không thể xoá loại vé đã có người mua');

  await this.prisma.ticketType.delete({ where: { id: ticketTypeId } });
  await this.clearEventListCache();
  return { message: 'Đã xoá loại vé' };
}

async findAll(query: {
    page?: string; limit?: string; search?: string;
    categoryId?: string; fromDate?: string; toDate?: string;
    location?: string; minPrice?: string; maxPrice?: string;
    status?: string; lang?: string; admin?: string; organizerId?: string;
    sortBy?: string;
  }) {
    const cacheKey = `events:list:${JSON.stringify(query)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '10', 10)));
    const skip = (page - 1) * limit;
    const where: any = {};
    const lang = query.lang || 'vi';

    if (query.admin !== 'true') {
      where.status = query.status || 'PUBLISHED';
    } else if (query.status) {
      where.status = query.status;
    }
    if (query.organizerId) {
      // Hỗ trợ cả organizer.id và user.id (tra ngược)
      const org = await this.prisma.organizer.findUnique({ where: { userId: query.organizerId } });
      where.organizerId = org?.id || query.organizerId;
    }

    if (query.search) where.title = { contains: query.search, mode: 'insensitive' };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.location) where.location = { contains: query.location, mode: 'insensitive' };
    if (query.fromDate || query.toDate) {
      where.startTime = {};
      if (query.fromDate) where.startTime.gte = new Date(query.fromDate);
      if (query.toDate) where.startTime.lte = new Date(query.toDate);
    }

    if (query.minPrice || query.maxPrice) {
      where.ticketTypes = { some: { price: {} } };
      if (query.minPrice) where.ticketTypes.some.price.gte = parseFloat(query.minPrice);
      if (query.maxPrice) where.ticketTypes.some.price.lte = parseFloat(query.maxPrice);
    }

    const sortBy = query.sortBy || 'startTime_asc';
    let orderBy: any;

    if (sortBy === 'price_asc' || sortBy === 'price_desc') {
      const dir = sortBy === 'price_asc' ? 'ASC' : 'DESC';
      const total = await this.prisma.event.count({ where });

      const whereClauses: string[] = ['1=1'];
      const params: any[] = [];
      let paramIdx = 1;

      if (where.status) {
        whereClauses.push(`e.status = $${paramIdx++}`);
        params.push(where.status);
      }
      if (where.organizerId) {
        whereClauses.push(`e."organizerId" = $${paramIdx++}`);
        params.push(where.organizerId);
      }
      if (where.title?.contains) {
        whereClauses.push(`e.title ILIKE $${paramIdx++}`);
        params.push(`%${where.title.contains}%`);
      }
      if (where.categoryId) {
        whereClauses.push(`e."categoryId" = $${paramIdx++}`);
        params.push(where.categoryId);
      }
      if (where.location?.contains) {
        whereClauses.push(`e.location ILIKE $${paramIdx++}`);
        params.push(`%${where.location.contains}%`);
      }
      if (where.startTime?.gte) {
        whereClauses.push(`e."startTime" >= $${paramIdx++}`);
        params.push(where.startTime.gte);
      }
      if (where.startTime?.lte) {
        whereClauses.push(`e."startTime" <= $${paramIdx++}`);
        params.push(where.startTime.lte);
      }

      const whereSQL = whereClauses.join(' AND ');
      const sorted: { id: string }[] = await this.prisma.$queryRawUnsafe(`
        SELECT e.id FROM "Event" e
        LEFT JOIN "TicketType" tt ON tt."eventId" = e.id
        WHERE ${whereSQL}
        GROUP BY e.id
        ORDER BY MIN(tt.price) ${dir} NULLS LAST
        LIMIT $${paramIdx++} OFFSET $${paramIdx++}
      `, ...params, limit, skip);

      const ids = sorted.map(r => r.id);
      if (ids.length === 0) {
        const result = { data: [], meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
        await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
        return result;
      }

      const events = await this.prisma.event.findMany({
        where: { id: { in: ids } },
        include: {
          category: { include: { translations: true } },
          organizer: { select: { id: true, name: true, description: true, logo: true, email: true, phone: true, website: true, _count: { select: { follows: true } } } },
          ticketTypes: {
            select: { id: true, name: true, price: true, totalQuantity: true, soldQuantity: true, minPerOrder: true, maxPerOrder: true, saleStartTime: true, saleEndTime: true },
          },
          reviews: { select: { rating: true } },
          translations: true,
        },
      });

      const idOrder = new Map(ids.map((id, i) => [id, i]));
      events.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

      const data = events.map(e => {
        const translated = applyTranslation(e, lang, ['title', 'description', 'location']);
        return {
          ...translated,
          category: e.category ? applyTranslation(e.category, lang, ['name']) : e.category,
          avgRating: e.reviews.length ? e.reviews.reduce((s, r) => s + r.rating, 0) / e.reviews.length : null,
          reviews: undefined,
        };
      });

      const result = { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
      await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
      return result;
    } else {
      switch (sortBy) {
        case 'startTime_desc': orderBy = { startTime: 'desc' }; break;
        case 'newest': orderBy = { createdAt: 'desc' }; break;
        default: orderBy = { startTime: 'asc' };
      }
    }

    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where, skip, take: limit, orderBy,
        include: {
          category: { include: { translations: true } },
          organizer: { select: { id: true, name: true, description: true, logo: true, email: true, phone: true, website: true, _count: { select: { follows: true } } } },
          ticketTypes: {
            select: { id: true, name: true, price: true, totalQuantity: true, soldQuantity: true, minPerOrder: true, maxPerOrder: true, saleStartTime: true, saleEndTime: true },
          },
          reviews: { select: { rating: true } },
          translations: true,
        },
      }),
      this.prisma.event.count({ where }),
    ]);

    const data = events.map(e => {
      const translated = applyTranslation(e, lang, ['title', 'description', 'location']);
      return {
        ...translated,
        category: e.category ? applyTranslation(e.category, lang, ['name']) : e.category,
        avgRating: e.reviews.length ? e.reviews.reduce((s, r) => s + r.rating, 0) / e.reviews.length : null,
        reviews: undefined,
      };
    });

    const result = { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
    await this.redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    return result;
  }

  async findOne(id: string, lang?: string) {
    const language = lang || 'vi';
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        category: { include: { translations: true } },
        organizer: { select: { id: true, name: true, description: true, logo: true, email: true, phone: true, website: true, _count: { select: { follows: true } } } },
        ticketTypes: {
          select: {
            id: true, name: true, price: true, totalQuantity: true,
            soldQuantity: true, minPerOrder: true, maxPerOrder: true,
            saleStartTime: true, saleEndTime: true, createdAt: true,
          },
        },
        reviews: { include: { user: { select: { id: true, fullName: true } } }, orderBy: { createdAt: 'desc' } },
        translations: true,
      },
    });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại');

    const translated = applyTranslation(event, language, ['title', 'description', 'location']);
    const avgRating = event.reviews.length ? event.reviews.reduce((s, r) => s + r.rating, 0) / event.reviews.length : null;
    return {
      ...translated,
      category: event.category ? applyTranslation(event.category, language, ['name']) : event.category,
      avgRating,
    };
  }
}
