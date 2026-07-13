import { Controller, Get, Post, Param, Body, UseGuards, Req, Query } from '@nestjs/common';
import { TicketService } from './ticket.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PurchaseTicketDto } from './dto/purchase-ticket.dto';
import { TransferTicketDto } from './dto/transfer-ticket.dto';
import { CheckInDto } from './dto/check-in.dto';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: { sub: string; role: string };
}

@Controller('tickets')
export class TicketController {
  constructor(private ticketService: TicketService) {}

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getTicket(@Param('id') id: string) {
    return this.ticketService.getTicket(id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getMyTickets(@Req() req: RequestWithUser) {
    return this.ticketService.getMyTickets(req.user.sub);
  }

  @Post('purchase')
  @UseGuards(JwtAuthGuard)
  async purchase(@Req() req: RequestWithUser, @Body() body: PurchaseTicketDto) {
    return this.ticketService.purchase(req.user.sub, body.ticketTypeId, body.quantity, body.promoCode);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancelTicket(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.ticketService.cancelTicket(id, req.user.sub);
  }

  @Post(':id/transfer')
  @UseGuards(JwtAuthGuard)
  transfer(@Param('id') id: string, @Req() req: RequestWithUser, @Body() body: TransferTicketDto) {
    return this.ticketService.transfer(id, req.user.sub, body.targetEmail);
  }

  @Post('waiting-list')
  @UseGuards(JwtAuthGuard)
  joinWaitingList(@Req() req: RequestWithUser, @Body() body: { eventId: string; ticketTypeId: string; quantity: number }) {
    return this.ticketService.joinWaitingList(body.eventId, req.user.sub, body.ticketTypeId, body.quantity);
  }

  @Post('validate-promo')
  @UseGuards(JwtAuthGuard)
  validatePromo(@Body() body: { code: string; totalPrice: number }) {
    return this.ticketService.applyPromoCode(body.code, body.totalPrice);
  }

  @Post('check-in/lookup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async lookupTicket(@Body() body: CheckInDto) {
    return this.ticketService.lookupTicket(body.qrCodeToken);
  }

  @Post('check-in')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async checkIn(@Req() req: RequestWithUser, @Body() body: CheckInDto) {
    return this.ticketService.checkIn(body.qrCodeToken, req.user.sub);
  }

  @Post('check-in/manual')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async checkInManual(@Req() req: RequestWithUser, @Body() body: { query: string }) {
    return this.ticketService.checkInManual(body.query, req.user.sub);
  }

  @Get('check-in/history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async getCheckInHistory(@Req() req: RequestWithUser) {
    return this.ticketService.getCheckInHistory(req.user.sub);
  }

  @Get('event/:eventId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async getEventTickets(@Param('eventId') eventId: string) {
    return this.ticketService.getEventTickets(eventId);
  }

  @Get('search')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'STAFF')
  async searchTicket(@Query('q') q: string) {
    return this.ticketService.searchTicket(q);
  }
}
