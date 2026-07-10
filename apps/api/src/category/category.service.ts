import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class CategoryService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private async clearCache() {
    await this.redis.del('categories:all');
  }

  async create(name: string) {
    const category = await this.prisma.category.create({ data: { name } });
    await this.clearCache();
    return category;
  }

  async findAll() {
    const cacheKey = 'categories:all';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const data = await this.prisma.category.findMany({ include: { _count: { select: { events: true } } } });
    await this.redis.set(cacheKey, JSON.stringify(data), 'EX', 600);
    return data;
  }

  async update(id: string, name: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    const updated = await this.prisma.category.update({ where: { id }, data: { name } });
    await this.clearCache();
    return updated;
  }

  async delete(id: string) {
    const cat = await this.prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { events: true } } },
    });
    if (!cat) throw new NotFoundException('Category not found');
    if (cat._count.events > 0) {
      throw new BadRequestException(
        `Không thể xoá danh mục "${cat.name}" vì có ${cat._count.events} sự kiện đang thuộc danh mục này. Hãy chuyển sự kiện sang danh mục khác trước.`,
      );
    }
    const deleted = await this.prisma.category.delete({ where: { id } });
    await this.clearCache();
    return deleted;
  }
}
