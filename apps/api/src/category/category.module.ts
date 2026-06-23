import { Module } from '@nestjs/common';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService, JwtAuthGuard, RolesGuard],
})
export class CategoryModule {}
