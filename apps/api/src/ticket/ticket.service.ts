import { Injectable, BadRequestException, NotFoundException, ConflictException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { NotificationsService } from '../notifications/notifications.service';
import * as crypto from 'crypto';

const QR_SEPARATOR = ':::'
const TICKET_AVAILABLE_KEY = (id: string) => `ticket_type:${id}:available`;
const TICKET_TOTAL_KEY = (id: string) => `ticket_type:${id}:total`;
const BOOKING_KEY = (id: string) => `booking:${id}`;

const RESERVE_SCRIPT = `
  local availableKey = KEYS[1]
  local totalKey = KEYS[2]
  local bookingKey = KEYS[3]
  local quantity = tonumber(ARGV[1])
  local ttl = tonumber(ARGV[2])
  local bookingId = ARGV[3]

  local available = redis.call('GET', availableKey)
  if not available then
    return {0, 'NOT_INITIALIZED'}
  end

  available = tonumber(available)
  if available < quantity then
    return {0, 'INSUFFICIENT', available}
  end

  redis.call('DECRBY', availableKey, quantity)
  redis.call('SET', bookingKey, quantity, 'EX', ttl)

  return {1, 'RESERVED', available - quantity}
`;

const RELEASE_SCRIPT = `
  local availableKey = KEYS[1]
  local bookingKey = KEYS[2]
  local quantity = tonumber(ARGV[1])

  redis.call('INCRBY', availableKey, quantity)
  redis.call('DEL', bookingKey)

  return {1, 'RELEASED'}
`;

function generateQrToken(eventId: string): string {
  const token = crypto.randomBytes(32).toString('hex');
  return `${eventId}${QR_SEPARATOR}${token}`;
}

function parseQrString(qr: string): { eventId?: string; token: string; raw: string } {
  const idx = qr.indexOf(QR_SEPARATOR);
  if (idx !== -1) {
    return { eventId: qr.slice(0, idx), token: qr.slice(idx + QR_SEPARATOR.length), raw: qr };
  }
  return { token: qr, raw: qr };
}

@Injectable()
export class TicketService implements OnModuleInit, OnModuleDestroy {
  private reserveSha: string | null = null;
  private releaseSha: string | null = null;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private notifications: NotificationsService,
  ) {}

  async onModuleInit() {
    await this.redis.connect();
    this.reserveSha = (await this.redis.script('LOAD', RESERVE_SCRIPT)) as string;
    this.releaseSha = (await this.redis.script('LOAD', RELEASE_SCRIPT)) as string;
    await this.syncSoldQuantity();
    await this.syncAvailable();
    await this.cleanupExpiredOrders();
    this.cleanupInterval = setInterval(() => this.cleanupExpiredOrders(), 60_000);
  }

  async onModuleDestroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  async syncSoldQuantity() {
    const ticketTypes = await this.prisma.ticketType.findMany();
    const validCounts = await this.prisma.ticket.groupBy({
      by: ['ticketTypeId'],
      where: { status: 'VALID' },
      _count: { id: true },
    });
    const countMap = new Map(validCounts.map(v => [v.ticketTypeId, v._count.id]));
    for (const tt of ticketTypes) {
      const actualValid = countMap.get(tt.id) ?? 0;
      if (tt.soldQuantity !== actualValid) {
        await this.prisma.ticketType.update({
          where: { id: tt.id },
          data: { soldQuantity: actualValid },
        });
      }
    }
  }

  async syncAvailable() {
    const ticketTypes = await this.prisma.ticketType.findMany();
    const validCounts = await this.prisma.ticket.groupBy({
      by: ['ticketTypeId'],
      where: { status: 'VALID' },
      _count: { id: true },
    });
    const countMap = new Map(validCounts.map(v => [v.ticketTypeId, v._count.id]));
    const pipeline = this.redis.pipeline();
    for (const tt of ticketTypes) {
      const validCount = countMap.get(tt.id) ?? 0;
      pipeline.set(TICKET_AVAILABLE_KEY(tt.id), tt.totalQuantity - validCount);
      pipeline.set(TICKET_TOTAL_KEY(tt.id), tt.totalQuantity);
    }
    await pipeline.exec();
  }

  async cleanupExpiredOrders() {
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: new Date(Date.now() - 10 * 60 * 1000) },
      },
      include: { tickets: { where: { status: 'PENDING' } } },
    });

    for (const order of expiredOrders) {
      if (order.tickets.length === 0) continue;

      await this.prisma.ticket.updateMany({
        where: { orderId: order.id, status: 'PENDING' },
        data: { status: 'CANCELLED' },
      });

      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: 'CANCELLED' },
      });

      const ticketTypeId = order.tickets[0].ticketTypeId;
      await this.releaseTickets(ticketTypeId, order.id, order.tickets.length);
    }

    if (expiredOrders.length > 0) {
      console.log(`[CLEANUP] Đã hủy ${expiredOrders.length} đơn hàng hết hạn`);
    }
  }

  private async reserveTicketsAtomic(ticketTypeId: string, quantity: number, ttl: number) {
    const bookingId = crypto.randomUUID();
    const result = (await this.redis.evalsha(
      this.reserveSha!,
      3,
      TICKET_AVAILABLE_KEY(ticketTypeId),
      TICKET_TOTAL_KEY(ticketTypeId),
      BOOKING_KEY(bookingId),
      quantity.toString(),
      ttl.toString(),
      bookingId,
    )) as [number, string, number?];

    return { ok: result[0] === 1, reason: result[1], available: result[2], bookingId };
  }

  private async releaseTickets(ticketTypeId: string, orderId: string, quantity: number) {
    await this.redis.evalsha(
      this.releaseSha!,
      2,
      TICKET_AVAILABLE_KEY(ticketTypeId),
      BOOKING_KEY(orderId),
      quantity.toString(),
    );
    await this.notifications.notifyWaitingList(ticketTypeId, quantity);
  }

  async getMyTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { userId },
      include: {
        order: { select: { id: true, status: true, finalAmount: true } },
        ticketType: { include: { event: { select: { id: true, title: true, location: true, startTime: true, bannerUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async purchase(userId: string, ticketTypeId: string, quantity: number, promoCode?: string) {
    const ticketType = await this.prisma.ticketType.findUnique({
      where: { id: ticketTypeId },
      include: { event: { select: { id: true, status: true } } },
    });

    if (!ticketType) {
      throw new NotFoundException('Loại vé không tồn tại');
    }

    if (ticketType.event.status !== 'PUBLISHED') {
      throw new BadRequestException('Sự kiện chưa được công bố hoặc đã bị hủy');
    }

    if (quantity < ticketType.minPerOrder) {
      throw new BadRequestException(`Số lượng vé tối thiểu cho mỗi đơn là ${ticketType.minPerOrder}`);
    }

    if (ticketType.maxPerOrder && quantity > ticketType.maxPerOrder) {
      throw new BadRequestException(`Số lượng vé tối đa cho mỗi đơn là ${ticketType.maxPerOrder}`);
    }

    const now = new Date();
    if (ticketType.saleStartTime && now < ticketType.saleStartTime) {
      throw new BadRequestException('Vé chưa đến thời gian mở bán');
    }
    if (ticketType.saleEndTime && now > ticketType.saleEndTime) {
      throw new BadRequestException('Vé đã hết thời gian mở bán');
    }

    let totalPrice = ticketType.price * quantity;
    let discount = 0;

    if (promoCode) {
      const promoResult = await this.applyPromoCode(promoCode, totalPrice);
      discount = promoResult.discount;
      totalPrice = promoResult.finalPrice;
      await this.prisma.promoCode.update({ where: { code: promoCode }, data: { usedCount: { increment: 1 } } });
    }

    const isWarmed = await this.redis.exists(TICKET_AVAILABLE_KEY(ticketTypeId));
    if (!isWarmed) {
      const validCount = await this.prisma.ticket.count({
        where: { ticketTypeId, status: 'VALID' },
      });
      await this.redis.set(TICKET_AVAILABLE_KEY(ticketTypeId), ticketType.totalQuantity - validCount);
      await this.redis.set(TICKET_TOTAL_KEY(ticketTypeId), ticketType.totalQuantity);
    }

    const reserve = await this.reserveTicketsAtomic(ticketTypeId, quantity, 600);
    if (!reserve.ok) {
      if (reserve.reason === 'NOT_INITIALIZED') {
        throw new BadRequestException('Vé chưa được khởi tạo, vui lòng thử lại');
      }
      throw new BadRequestException(`Không đủ vé. Còn lại: ${reserve.available ?? 0}`);
    }

    const order = await this.prisma.order.create({
      data: {
        userId,
        totalAmount: ticketType.price * quantity,
        discount,
        finalAmount: totalPrice,
        promoCode,
        status: 'PENDING',
      },
    });

    const ticketData: Array<{
      orderId: string;
      ticketTypeId: string;
      userId: string;
      status: 'PENDING';
      qrCodeToken: string;
    }> = [];

    const eventId = ticketType.event.id;
    for (let i = 0; i < quantity; i++) {
      ticketData.push({
        orderId: order.id,
        ticketTypeId,
        userId,
        status: 'PENDING',
        qrCodeToken: generateQrToken(eventId),
      });
    }

    await this.prisma.ticket.createMany({ data: ticketData });

    setTimeout(async () => {
      try {
        const existing = await this.prisma.order.findUnique({
          where: { id: order.id },
          include: { tickets: { where: { status: 'PENDING' }, take: 1 } },
        });
        if (existing && existing.tickets.length > 0 && existing.status === 'PENDING') {
          await this.cancelOrder(order.id);
        }
      } catch {
        // order already processed
      }
    }, 10 * 60 * 1000);

    return {
      message: 'Đặt vé thành công. Vui lòng thanh toán trong 10 phút.',
      orderId: order.id,
      quantity,
      ticketType: { id: ticketTypeId, name: ticketType.name, price: ticketType.price },
      totalPrice,
      originalPrice: ticketType.price * quantity,
      discount,
      expiresIn: '10 phút',
    };
  }

  async cancelOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { tickets: { where: { status: 'PENDING' } } },
    });

    if (!order || order.tickets.length === 0) return;

    const ticketTypeId = order.tickets[0].ticketTypeId;

    await this.prisma.ticket.updateMany({
      where: { orderId, status: 'PENDING' },
      data: { status: 'CANCELLED' },
    });

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    await this.releaseTickets(ticketTypeId, orderId, order.tickets.length);
  }

  async getTicket(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        order: { select: { id: true, status: true, finalAmount: true } },
        ticketType: { include: { event: { select: { id: true, title: true, location: true, startTime: true } } } },
      },
    });
    if (!ticket) throw new NotFoundException('Vé không tồn tại');
    return ticket;
  }

  async cancelTicket(id: string, userId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id }, include: { order: true } });
    if (!ticket) throw new NotFoundException('Vé không tồn tại');
    if (ticket.userId !== userId) throw new BadRequestException('Không phải vé của bạn');
    if (ticket.status !== 'VALID') throw new BadRequestException('Chỉ có thể hủy vé VALID');
    if (ticket.checkedInAt) throw new BadRequestException('Vé đã được check-in, không thể hủy');

    await this.prisma.ticketType.update({
      where: { id: ticket.ticketTypeId },
      data: { soldQuantity: { decrement: 1 } },
    });

    if (ticket.orderId) {
      await this.releaseTickets(ticket.ticketTypeId, ticket.orderId, 1);
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    if (ticket.orderId) {
      const remainingValid = await this.prisma.ticket.count({
        where: { orderId: ticket.orderId, status: 'VALID' },
      });
      if (remainingValid === 0) {
        await this.prisma.order.update({
          where: { id: ticket.orderId },
          data: { status: 'CANCELLED' },
        });
      }
    }

    return updatedTicket;
  }

  async transfer(id: string, userId: string, targetEmail: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: { ticketType: { select: { eventId: true } } },
    });
    if (!ticket) throw new NotFoundException('Vé không tồn tại');
    if (ticket.userId !== userId) throw new BadRequestException('Không phải vé của bạn');
    if (ticket.status !== 'VALID') throw new BadRequestException('Chỉ có thể chuyển vé VALID');

    const target = await this.prisma.user.findUnique({ where: { email: targetEmail } });
    if (!target) throw new NotFoundException('Người nhận không tồn tại');
    if (target.id === userId) throw new BadRequestException('Không thể chuyển cho chính mình');

    const eventId = ticket.ticketType.eventId;
    const transferResult = await this.prisma.$transaction([
      this.prisma.ticket.update({ where: { id }, data: { userId: target.id, transferredFromId: userId, transferredToId: target.id, status: 'TRANSFERRED' } }),
      this.prisma.ticket.create({ data: { orderId: ticket.orderId, ticketTypeId: ticket.ticketTypeId, userId: target.id, qrCodeToken: generateQrToken(eventId), status: 'VALID' } }),
    ]);

    return { message: 'Chuyển vé thành công', newOwner: target.fullName };
  }

  async joinWaitingList(eventId: string, userId: string, ticketTypeId: string, quantity: number) {
    const existing = await this.prisma.waitingListEntry.findUnique({ where: { eventId_userId_ticketTypeId: { eventId, userId, ticketTypeId } } });
    if (existing) throw new BadRequestException('Bạn đã trong danh sách chờ rồi');
    return this.prisma.waitingListEntry.create({ data: { eventId, userId, ticketTypeId, quantity } });
  }

  async applyPromoCode(code: string, totalPrice: number) {
    const promo = await this.prisma.promoCode.findUnique({ where: { code } });
    if (!promo) throw new NotFoundException('Mã giảm giá không hợp lệ');
    if (!promo.isActive) throw new BadRequestException('Mã giảm giá đã bị vô hiệu hóa');
    if (promo.expiresAt && promo.expiresAt < new Date()) throw new BadRequestException('Mã giảm giá đã hết hạn');
    if (promo.usedCount >= promo.maxUses) throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
    const discount = totalPrice * (promo.discountPct / 100);
    return { originalPrice: totalPrice, discount, finalPrice: totalPrice - discount };
  }

  private async findTicketByQr(qrCodeToken: string) {
    const parsed = parseQrString(qrCodeToken);
    let ticket = await this.prisma.ticket.findUnique({
      where: { qrCodeToken: parsed.raw },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        ticketType: { select: { name: true, event: { select: { id: true, title: true, startTime: true, location: true } } } },
      },
    });
    if (!ticket && parsed.raw !== parsed.token) {
      ticket = await this.prisma.ticket.findUnique({
        where: { qrCodeToken: parsed.token },
        include: {
          user: { select: { id: true, fullName: true, email: true } },
          ticketType: { select: { name: true, event: { select: { id: true, title: true, startTime: true, location: true } } } },
        },
      });
    }
    return { ticket, parsed };
  }

  async lookupTicket(qrCodeToken: string) {
    const { ticket } = await this.findTicketByQr(qrCodeToken);
    if (!ticket) {
      throw new NotFoundException('Vé không tồn tại');
    }
    return ticket;
  }

  async checkIn(qrCodeToken: string) {
    const { ticket } = await this.findTicketByQr(qrCodeToken);

    if (!ticket) {
      throw new NotFoundException('Vé không tồn tại');
    }

    if (ticket.status === 'CHECKED_IN') {
      const time = ticket.checkedInAt
        ? ticket.checkedInAt.toLocaleString('vi-VN')
        : 'không xác định';
      throw new ConflictException({
        statusCode: 409,
        message: `Vé này đã được sử dụng lúc ${time}!`,
        ticket: {
          id: ticket.id,
          fullName: ticket.user?.fullName,
          ticketType: { name: ticket.ticketType?.name },
          checkedInAt: ticket.checkedInAt,
        },
      });
    }

    if (ticket.status !== 'VALID') {
      throw new BadRequestException(`Vé ở trạng thái ${ticket.status}, không thể check-in`);
    }

    return this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'CHECKED_IN', checkedInAt: new Date() },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        ticketType: { select: { name: true, event: { select: { title: true, startTime: true, location: true } } } },
      },
    });
  }

  async getEventTickets(eventId: string) {
    return this.prisma.ticket.findMany({
      where: { ticketType: { eventId } },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        ticketType: { select: { name: true, event: { select: { id: true, title: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchTicket(query: string) {
    const tickets = await this.prisma.ticket.findMany({
      take: 50,
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        ticketType: { select: { name: true, event: { select: { id: true, title: true } } } },
        order: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const q = query.toLowerCase().trim();
    const filtered = tickets.filter((t: any) => {
      const name = t.user?.fullName?.toLowerCase() ?? '';
      const email = t.user?.email?.toLowerCase() ?? '';
      const orderId = t.order?.id?.toLowerCase() ?? '';
      return name.includes(q) || email.includes(q) || orderId.includes(q);
    });

    return filtered.slice(0, 20);
  }

  async checkInManual(query: string) {
    const results = await this.searchTicket(query);
    if (results.length === 0) {
      throw new NotFoundException('Không tìm thấy vé phù hợp');
    }
    const ticket = results[0];
    if (ticket.status === 'CHECKED_IN') {
      throw new ConflictException('Vé này đã được sử dụng');
    }
    if (ticket.status !== 'VALID') {
      throw new BadRequestException('Vé không ở trạng thái hợp lệ để check-in');
    }
    return this.prisma.ticket.update({
      where: { id: ticket.id },
      data: { status: 'CHECKED_IN', checkedInAt: new Date() },
      include: {
        user: { select: { id: true, fullName: true, email: true } },
        ticketType: { select: { name: true, event: { select: { id: true, title: true } } } },
      },
    });
  }
}
