import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as crypto from 'crypto';

@Injectable()
export class VerificationService {
  constructor(
    private prisma: PrismaService,
    private email: EmailService,
  ) {}

  async sendVerificationEmail(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');
    if (user.isVerified) throw new BadRequestException('Email đã được xác thực');

    const token = crypto.randomBytes(32).toString('hex');
    await this.prisma.user.update({
      where: { id: userId },
      data: { verificationToken: token },
    });

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/verify-email?token=${token}`;

    await this.email.send(
      user.email,
      'Xác thực email - Event Ticketing Hub',
      `
        <h2>Chào ${user.fullName},</h2>
        <p>Cảm ơn bạn đã đăng ký tài khoản Event Ticketing Hub.</p>
        <p>Click vào link sau để xác thực email:</p>
        <a href="${verifyUrl}">${verifyUrl}</a>
      `,
    );

    return { message: 'Email xác thực đã được gửi!' };
  }

  async verifyEmail(token: string) {
    const user = await this.prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) throw new BadRequestException('Token xác thực không hợp lệ');

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verificationToken: null },
    });

    return { message: 'Email đã được xác thực thành công!' };
  }
}
