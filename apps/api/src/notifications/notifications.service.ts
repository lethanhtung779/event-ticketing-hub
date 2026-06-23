import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { AppGateway } from '../websocket/websocket.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
    private gateway: AppGateway,
  ) {}

  async notifyWaitingList(ticketTypeId: string, availableCount: number) {
    const waitingEntries = await this.prisma.waitingListEntry.findMany({
      where: { ticketTypeId, notified: false },
      include: { user: true, event: true },
      orderBy: { createdAt: 'asc' },
    });

    for (const entry of waitingEntries) {
      if (availableCount <= 0) break;

      const subject = `Vé đã có sẵn - ${entry.event.title}`;
      const html = `
        <h2>Chào ${entry.user.fullName},</h2>
        <p>Vé cho sự kiện <strong>${entry.event.title}</strong> đã có sẵn trở lại!</p>
        <p>Hãy nhanh tay đặt vé trước khi hết.</p>
      `;

      this.gateway.sendToUser(entry.user.id, 'ticket_available', {
        eventId: entry.eventId,
        ticketTypeId: entry.ticketTypeId,
        message: `Vé cho "${entry.event.title}" đã có sẵn!`,
      });

      await this.email.send(entry.user.email, subject, html);
      await this.prisma.waitingListEntry.update({
        where: { id: entry.id },
        data: { notified: true },
      });

      availableCount -= entry.quantity;
    }
  }

  async sendPaymentConfirmation(userId: string, bookingId: string) {
    this.gateway.sendToUser(userId, 'payment_confirmed', {
      bookingId,
      message: 'Thanh toán thành công! Vé đã được kích hoạt.',
    });
  }

  async sendTicketCancelled(userId: string, ticketId: string) {
    this.gateway.sendToUser(userId, 'ticket_cancelled', {
      ticketId,
      message: 'Vé của bạn đã bị hủy.',
    });
  }

  async sendEventUpdate(eventId: string, data: Record<string, unknown>) {
    this.gateway.broadcast('event_update', { eventId, ...data });
  }
}
