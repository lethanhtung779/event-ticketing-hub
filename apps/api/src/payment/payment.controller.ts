import { Controller, Post, Body } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Post('webhook')
  handleWebhook(@Body() body: { orderId: string }) {
    return this.paymentService.handleWebhook(body);
  }
}
