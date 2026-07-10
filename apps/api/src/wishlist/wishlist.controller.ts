import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { Request } from 'express';

@Controller('wishlist')
export class WishlistController {
  constructor(private wishlistService: WishlistService) {}

  @Post(':eventId')
  @UseGuards(JwtAuthGuard)
  save(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.wishlistService.save((req as any).user.sub, eventId);
  }

  @Delete(':eventId')
  @UseGuards(JwtAuthGuard)
  unsave(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.wishlistService.unsave((req as any).user.sub, eventId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  myWishlist(@Req() req: Request) {
    return this.wishlistService.findAllByUser((req as any).user.sub);
  }

  @Get('check/:eventId')
  @UseGuards(JwtAuthGuard)
  check(@Param('eventId') eventId: string, @Req() req: Request) {
    return this.wishlistService.isSaved((req as any).user.sub, eventId);
  }
}
