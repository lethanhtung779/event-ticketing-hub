import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { EmailService } from '../email/email.service';
import { buildVnpayPayUrl, verifyVnpayCallback } from './vnpay.util';
import * as QRCode from 'qrcode';

const BOOKING_KEY = (id: string) => `booking:${id}`;

@Injectable()
export class VnpayService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private email: EmailService,
  ) {}

  private get config() {
    return {
      tmnCode: process.env.VNPAY_TMN_CODE || '',
      hashSecret: process.env.VNPAY_HASH_SECRET || '',
      returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:3000/payments/vnpay-return',
    };
  }

  async createPayment(userId: string, orderId: string, ipAddr: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { tickets: { where: { status: 'PENDING' }, include: { ticketType: true } } },
    });

    if (!order) {
      throw new NotFoundException('Đơn hàng không tồn tại');
    }

    if (order.status !== 'PENDING') {
      throw new BadRequestException('Đơn hàng đã được thanh toán hoặc đã hủy');
    }

    if (order.tickets.length === 0) {
      throw new NotFoundException('Không tìm thấy vé PENDING nào để thanh toán');
    }

    const orderInfo = `Thanh toan ve su kien - Order ${orderId}`;
    const payUrl = buildVnpayPayUrl({
      amount: order.finalAmount,
      orderInfo,
      orderRef: orderId,
      ipAddr,
      returnUrl: this.config.returnUrl,
      tmnCode: this.config.tmnCode,
      hashSecret: this.config.hashSecret,
    });

    await this.prisma.payment.create({
      data: {
        orderId,
        userId,
        amount: order.finalAmount,
        method: 'VNPAY',
        payUrl,
        status: 'PENDING',
      },
    });

    return { payUrl, orderId, amount: order.finalAmount };
  }

  async handleReturn(query: Record<string, string>) {
    const isValid = verifyVnpayCallback(query, this.config.hashSecret);
    if (!isValid) {
      throw new BadRequestException('Chữ ký không hợp lệ');
    }

    const txnRef = query['vnp_TxnRef'] || '';
    const orderId = txnRef.split('_')[0];
    const responseCode = query['vnp_ResponseCode'];

    if (responseCode !== '00') {
      await this.prisma.payment.updateMany({
        where: { orderId },
        data: { status: 'FAILED', transactionNo: query['vnp_TransactionNo'] || null },
      });
      return { success: false, message: 'Thanh toán thất bại', orderId };
    }

    await this.confirmPayment(orderId, {
      transactionNo: query['vnp_TransactionNo'],
      bankCode: query['vnp_BankCode'],
    });

    return { success: true, message: 'Thanh toán thành công!', orderId };
  }

  async handleIpn(query: Record<string, string>) {
    const isValid = verifyVnpayCallback(query, this.config.hashSecret);
    if (!isValid) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const txnRef = query['vnp_TxnRef'] || '';
    const orderId = txnRef.split('_')[0];
    const responseCode = query['vnp_ResponseCode'];

    if (responseCode === '00') {
      try {
        await this.confirmPayment(orderId, {
          transactionNo: query['vnp_TransactionNo'],
          bankCode: query['vnp_BankCode'],
        });
      } catch {
        return { RspCode: '99', Message: 'Unknown error' };
      }
      return { RspCode: '00', Message: 'Confirm success' };
    }

    return { RspCode: '00', Message: 'Order not paid' };
  }

  private async confirmPayment(orderId: string, details: { transactionNo?: string; bankCode?: string }) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { tickets: { where: { status: 'PENDING' }, include: { ticketType: { include: { event: true } }, user: true } } },
    });

    if (!order || order.tickets.length === 0) return;

    const ticketTypeId = order.tickets[0].ticketTypeId;
    const user = order.tickets[0].user;
    const event = order.tickets[0].ticketType.event;

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
      this.prisma.payment.updateMany({
        where: { orderId },
        data: {
          status: 'PAID',
          transactionNo: details.transactionNo || null,
          bankCode: details.bankCode || null,
          paidAt: new Date(),
        },
      }),
    ]);

    await this.redis.del(BOOKING_KEY(orderId));

    const qrDataUrl = await QRCode.toDataURL(order.tickets[0].qrCodeToken);
    await this.email.sendTicketConfirmation(user.email, user.fullName, event.title, qrDataUrl);
  }

  async refund(orderId: string, reason: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { orderId, status: 'PAID' },
    });

    if (!payment) throw new NotFoundException('Không tìm thấy giao dịch đã thanh toán');

    await this.prisma.$transaction([
      this.prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'REFUNDED', refundAmount: payment.amount, refundReason: reason },
      }),
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'REFUNDED' },
      }),
      this.prisma.ticket.updateMany({
        where: { orderId, status: 'VALID' },
        data: { status: 'CANCELLED' },
      }),
    ]);

    return { message: 'Refund processed', orderId, amount: payment.amount };
  }
}
