import { Controller, Get, Post, Delete, Param, Query, UseGuards, Req } from '@nestjs/common';
import { FollowService } from './follow.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('follow')
export class FollowController {
  constructor(private followService: FollowService) {}

  @Post(':organizerId')
  @UseGuards(JwtAuthGuard)
  async follow(@Req() req: any, @Param('organizerId') organizerId: string) {
    return this.followService.follow(req.user.sub, organizerId);
  }

  @Delete(':organizerId')
  @UseGuards(JwtAuthGuard)
  async unfollow(@Req() req: any, @Param('organizerId') organizerId: string) {
    return this.followService.unfollow(req.user.sub, organizerId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async myFollows(@Req() req: any) {
    return this.followService.findAllByUser(req.user.sub);
  }

  @Get('check/:organizerId')
  @UseGuards(JwtAuthGuard)
  async check(@Req() req: any, @Param('organizerId') organizerId: string) {
    return this.followService.isFollowing(req.user.sub, organizerId);
  }

  @Get(':organizerId/followers')
  async followers(
    @Param('organizerId') organizerId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.followService.getFollowers(organizerId, page, limit);
  }
}
