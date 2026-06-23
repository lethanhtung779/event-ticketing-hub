import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CreateReviewDto } from './dto/create-review.dto';
import type { Request } from 'express';

@Controller('events/:eventId/reviews')
export class ReviewController {
  constructor(private reviewService: ReviewService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Param('eventId') eventId: string, @Req() req: Request & { user: { sub: string } }, @Body() body: CreateReviewDto) {
    return this.reviewService.create(eventId, req.user.sub, body);
  }

  @Get()
  findAll(@Param('eventId') eventId: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.reviewService.findByEvent(eventId, parseInt(page || '1'), parseInt(limit || '10'));
  }
}
