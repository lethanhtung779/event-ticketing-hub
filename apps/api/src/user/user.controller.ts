import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

interface RequestWithUser extends Request {
  user: { sub: string };
}

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: RequestWithUser) {
    return this.userService.getProfile(req.user.sub);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateProfile(@Req() req: RequestWithUser, @Body() body: { fullName?: string }) {
    return this.userService.updateProfile(req.user.sub, body);
  }

  @Get('me/tickets')
  @UseGuards(JwtAuthGuard)
  getMyTickets(@Req() req: RequestWithUser) {
    return this.userService.getMyTickets(req.user.sub);
  }

  @Get('me/orders')
  @UseGuards(JwtAuthGuard)
  getMyOrders(@Req() req: RequestWithUser) {
    return this.userService.getMyOrders(req.user.sub);
  }
}
