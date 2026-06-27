import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { OrganizerService } from './organizer.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('organizer')
@UseGuards(JwtAuthGuard)
export class OrganizerController {
  constructor(private organizerService: OrganizerService) {}

  @Get('stats')
  getStats(@Req() req: any) {
    return this.organizerService.getStats(req.user.sub);
  }
}
