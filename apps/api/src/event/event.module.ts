import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [EventController],
  providers: [EventService, JwtAuthGuard, RolesGuard],
})
export class EventModule {}
