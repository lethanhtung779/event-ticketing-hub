import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import * as QRCode from 'qrcode';

const BOOKING_KEY = (id: string) => `booking:${id}`;

@Injectable()
export class PaymentService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async handleWebhook(body: { orderId: string }) {
    const { orderId } = body;

    const bookingData = await this.redis.get(BOOKING_KEY(orderId));
    if (!bookingData) {
      throw new BadRequestException('Booking không tồn tại hoặc đã hết hạn');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { tickets: { where: { status: 'PENDING' } } },
    });

    if (!order || order.tickets.length === 0) {
      throw new NotFoundException('Không tìm thấy vé PENDING nào để xác nhận');
    }

    const ticketTypeId = order.tickets[0].ticketTypeId;

    await this.prisma.$transaction([
      this.prisma.ticket.updateMany({
        where: { orderId, status: 'PENDING' },
        data: { status: 'VALID' },
      }),
      this.prisma.ticketType.update({
        where: { id: ticketTypeId },
        data: { soldQuantity: { increment: order.tickets.length } },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID', paidAt: new Date() },
      }),
    ]);

    await this.redis.del(BOOKING_KEY(orderId));

    const qrCodes = await Promise.all(
      order.tickets.map(async (ticket) => {
        const qrDataUrl = await QRCode.toDataURL(ticket.qrCodeToken);
        return { ticketId: ticket.id, qrCodeToken: ticket.qrCodeToken, qrDataUrl };
      }),
    );

    return {
      message: 'Thanh toán thành công! Vé đã được kích hoạt.',
      orderId,
      quantity: order.tickets.length,
      qrCodes,
    };
  }
}
