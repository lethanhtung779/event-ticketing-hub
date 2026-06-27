import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CategoryService {
  constructor(private prisma: PrismaService) {}

  async create(name: string) {
    return this.prisma.category.create({ data: { name } });
  }

  async findAll() {
    return this.prisma.category.findMany({ include: { _count: { select: { events: true } } } });
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
    return this.prisma.category.delete({ where: { id } });
  }
}
