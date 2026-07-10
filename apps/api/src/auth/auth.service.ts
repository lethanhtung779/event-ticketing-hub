import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {
    this.googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || '');
  }

  async register(body: any) {
    const { email, password, fullName } = body;
    const userExists = await this.prisma.user.findUnique({ where: { email } });
    if (userExists) {
      throw new BadRequestException('Email này đã được sử dụng!');
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await this.prisma.user.create({
      data: { email, password: hashedPassword, fullName },
    });
    const { password: _, ...userWithoutPassword } = newUser;
    return { message: 'Đăng ký tài khoản thành công!', user: userWithoutPassword };
  }

  async login(body: any) {
    const { email, password } = body;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác!');
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác!');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      message: 'Đăng nhập thành công!',
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  async refresh(refreshTokenStr: string) {
    const stored = await this.prisma.refreshToken.findUnique({ where: { token: refreshTokenStr } });
    if (!stored || stored.expiresAt < new Date()) {
      if (stored) await this.prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
    const user = await this.prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new UnauthorizedException('User không tồn tại');

    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(payload, { expiresIn: '15m' });
    const newRefreshToken = await this.generateRefreshToken(user.id);

    return { access_token: accessToken, refresh_token: newRefreshToken };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('User không tồn tại');

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw new BadRequestException('Mật khẩu hiện tại không chính xác');

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Đổi mật khẩu thành công!' };
  }

  async googleLogin(idToken: string) {
    let payload: { sub: string; email?: string; name?: string; picture?: string };
    try {
      const audiences = [
        process.env.GOOGLE_CLIENT_ID || '',
        process.env.GOOGLE_ANDROID_CLIENT_ID || '',
      ].filter(Boolean)
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: audiences,
      });
      payload = ticket.getPayload() as any;
    } catch (err: any) {
      console.error('Google verify error:', err.message);
      throw new UnauthorizedException('Token Google không hợp lệ');
    }

    if (!payload.email) {
      throw new BadRequestException('Không thể lấy email từ tài khoản Google');
    }

    let user = await this.prisma.user.findUnique({ where: { email: payload.email } });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: payload.email,
          fullName: payload.name || payload.email.split('@')[0],
          password: crypto.randomBytes(32).toString('hex'),
          isVerified: true,
          avatar: payload.picture,
        },
      });
    } else {
      const updateData: any = {};
      if (payload.name && payload.name !== user.fullName) updateData.fullName = payload.name;
      if (payload.picture && payload.picture !== user.avatar) updateData.avatar = payload.picture;
      if (!user.isVerified) updateData.isVerified = true;
      if (Object.keys(updateData).length > 0) {
        user = await this.prisma.user.update({ where: { id: user.id }, data: updateData });
      }
    }

    const jwtPayload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = await this.jwtService.signAsync(jwtPayload, { expiresIn: '15m' });
    const refreshToken = await this.generateRefreshToken(user.id);

    return {
      message: 'Đăng nhập với Google thành công!',
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  private async generateRefreshToken(userId: string) {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.prisma.refreshToken.create({ data: { token, userId, expiresAt } });
    return token;
  }
}
