import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT || '1025', 10),
      secure: false,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });
  }

  async send(to: string, subject: string, html: string) {
    if (process.env.NODE_ENV === 'test') return;
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    try {
      await this.transporter.sendMail({ from: process.env.SMTP_FROM || 'noreply@ticketing.com', to, subject, html });
    } catch {
      console.log('[EMAIL] Failed to send (SMTP not available)');
    }
  }

  async sendTicketConfirmation(to: string, fullName: string, eventTitle: string, qrDataUrl: string) {
    await this.send(to, 'Xác nhận đặt vé thành công', `
      <h2>Chào ${fullName},</h2>
      <p>Bạn đã đặt vé thành công cho sự kiện <strong>${eventTitle}</strong>.</p>
      <p>QR Code của bạn:</p>
      <img src="${qrDataUrl}" alt="QR Code" />
      <p>Vui lòng xuất trình mã QR này tại cửa vào.</p>
    `);
  }
}
