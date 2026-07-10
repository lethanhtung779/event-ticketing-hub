import { Module } from '@nestjs/common';
import { TicketController } from './ticket.controller';
import { TicketService } from './ticket.service';
import { TicketPdfService } from './ticket-pdf.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  imports: [NotificationsModule],
  controllers: [TicketController],
  providers: [TicketService, TicketPdfService, JwtAuthGuard, RolesGuard],
  exports: [TicketPdfService],
})
export class TicketModule {}
