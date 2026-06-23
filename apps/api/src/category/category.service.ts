import { Injectable, NotFoundException } from '@nestjs/common';
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
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return this.prisma.category.delete({ where: { id } });
  }
}
