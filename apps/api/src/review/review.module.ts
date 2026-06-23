import { Module } from '@nestjs/common';
import { ReviewController } from './review.controller';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Module({
  controllers: [ReviewController],
  providers: [ReviewService, JwtAuthGuard],
})
export class ReviewModule {}
