import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { resolve4Sync } from 'dns';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    let connectionString = process.env.DATABASE_URL || 'postgresql://postgres:mysecretpassword@localhost:5433/ticketing_db?schema=public';
    try {
      const url = new URL(connectionString);
      const [address] = resolve4Sync(url.hostname);
      connectionString = connectionString.replace(url.hostname, address);
    } catch {}
    const pool = new Pool({ connectionString, family: 4 });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
