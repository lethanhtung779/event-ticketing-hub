import { Controller, Post, Get, Query, UseGuards, Req } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('auth')
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post('send-verification')
  @UseGuards(JwtAuthGuard)
  sendVerification(@Req() req: Request & { user: { sub: string } }) {
    return this.verificationService.sendVerificationEmail(req.user.sub);
  }

  @Get('verify-email')
  verifyEmail(@Query('token') token: string) {
    return this.verificationService.verifyEmail(token);
  }
}
