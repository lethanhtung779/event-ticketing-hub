import { Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  constructor() {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379', 10);
    const tls = process.env.REDIS_TLS === 'true' ? {} : undefined;
    super({
      host,
      port,
      password: process.env.REDIS_PASSWORD || undefined,
      tls,
      lazyConnect: true,
      retryStrategy: (times) => Math.min(times * 200, 3000),
    });
  }

  async onModuleDestroy() {
    await this.quit();
  }
}
