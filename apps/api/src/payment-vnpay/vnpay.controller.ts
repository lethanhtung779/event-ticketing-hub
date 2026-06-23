import { Controller, Post, Get, Body, Query, Req, UseGuards, Res } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request, Response } from 'express';

@Controller('payments')
export class VnpayController {
  constructor(private vnpayService: VnpayService) {}

  @Post('vnpay/create')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Req() req: Request & { user: { sub: string } },
    @Body() body: { orderId: string },
  ) {
    const ipAddr = (req.headers['x-forwarded-for'] as string) || req.ip || '127.0.0.1';
    return this.vnpayService.createPayment(req.user.sub, body.orderId, ipAddr);
  }

  @Get('vnpay-return')
  async handleReturn(@Query() query: Record<string, string>, @Res() res: Response) {
    const result = await this.vnpayService.handleReturn(query);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
    const status = result.success ? 'success' : 'failure';
    const orderId = result.orderId || '';
    return res.redirect(`${frontendUrl}/my-tickets?payment=${status}&orderId=${orderId}`);
  }

  @Get('vnpay-ipn')
  async handleIpn(@Query() query: Record<string, string>) {
    return this.vnpayService.handleIpn(query);
  }

  @Post('vnpay/refund')
  @UseGuards(JwtAuthGuard)
  async refund(@Body() body: { orderId: string; reason: string }) {
    return this.vnpayService.refund(body.orderId, body.reason);
  }
}
