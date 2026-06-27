import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';

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
  ) {}

  async createEvent(userId: string, body: any) {
    const event = await this.prisma.event.create({
      data: {
        title: body.title,
        description: body.description,
        location: body.location,
        bannerUrl: body.bannerUrl,
        categoryId: body.categoryId,
        status: 'DRAFT',
        startTime: new Date(body.startTime),
        endTime: new Date(body.endTime),
        isOnline: body.isOnline ?? false,
        googleMapsLink: body.googleMapsLink,
        eventType: body.eventType,
        organizerId: userId,
        organizerName: body.organizerName,
        organizerInfo: body.organizerInfo,
        organizerLogo: body.organizerLogo,
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
    return event;
  }

  private async checkOwnership(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Sự kiện không tồn tại');
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'ADMIN' && event.organizerId !== userId) {
      throw new BadRequestException('Bạn không có quyền thao tác trên sự kiện này');
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
    return updated;
  }

  async deleteEvent(userId: string, id: string) {
    await this.checkOwnership(userId, id);
    await this.prisma.event.delete({ where: { id } });
    await this.auditLog.log(userId, 'DELETE_EVENT', 'Event', id);
  }

  async publishEvent(userId: string, id: string) {
    const event = await this.checkOwnership(userId, id);
    if (event.status !== 'DRAFT') throw new BadRequestException('Chỉ có thể công bố sự kiện ở trạng thái DRAFT');
    const updated = await this.prisma.event.update({
      where: { id },
      data: { status: 'PUBLISHED' },
    });
    await this.auditLog.log(userId, 'PUBLISH_EVENT', 'Event', id);
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
    return updated;
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

    return this.prisma.ticketType.create({ data });
  }

  async updateTicketType(ticketTypeId: string, body: any) {
    const tt = await this.prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
    if (!tt) throw new NotFoundException('Loại vé không tồn tại');

    const data: any = { ...body };
    if (body.saleStartTime) data.saleStartTime = new Date(body.saleStartTime);
    if (body.saleEndTime) data.saleEndTime = new Date(body.saleEndTime);
    delete data.eventId;

    return this.prisma.ticketType.update({ where: { id: ticketTypeId }, data });
  }

  async deleteTicketType(eventId: string, ticketTypeId: string) {
  const tt = await this.prisma.ticketType.findUnique({ where: { id: ticketTypeId } });
  if (!tt) throw new NotFoundException('Loại vé không tồn tại');
  if (tt.eventId !== eventId) throw new BadRequestException('Loại vé không thuộc sự kiện này');
  if (tt.soldQuantity > 0) throw new BadRequestException('Không thể xoá loại vé đã có người mua');

  await this.prisma.ticketType.delete({ where: { id: ticketTypeId } });
  return { message: 'Đã xoá loại vé' };
}

async findAll(query: {
    page?: string; limit?: string; search?: string;
    categoryId?: string; fromDate?: string; toDate?: string;
    location?: string; minPrice?: string; maxPrice?: string;
    status?: string; lang?: string; admin?: string; organizerId?: string;
  }) {
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
    if (query.organizerId) where.organizerId = query.organizerId;

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

    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where, skip, take: limit, orderBy: { startTime: 'asc' },
        include: {
          category: { include: { translations: true } },
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

    return { data, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, lang?: string) {
    const language = lang || 'vi';
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        category: { include: { translations: true } },
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
