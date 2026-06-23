import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { EventModule } from './event/event.module';
import { TicketModule } from './ticket/ticket.module';
import { PaymentModule } from './payment/payment.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { CategoryModule } from './category/category.module';
import { ReviewModule } from './review/review.module';
import { EmailModule } from './email/email.module';
import { AuditLogModule } from './audit-log/audit-log.module';
import { VnpayModule } from './payment-vnpay/vnpay.module';
import { WebsocketModule } from './websocket/websocket.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    AuditLogModule, PrismaModule, RedisModule, EmailModule,
    AuthModule, EventModule, TicketModule, PaymentModule,
    UserModule, AdminModule, CategoryModule, ReviewModule,
    VnpayModule, WebsocketModule, NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
