import 'dotenv/config';
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private pool: pg.Pool;

  constructor() {
    const connectionString =
      process.env['DATABASE_URL'] ||
      process.env['POSTGRES_PRISMA_URL'] ||
      process.env['POSTGRES_URL'];

    const isServerless =
      process.env['VERCEL'] === '1' || process.env['SERVERLESS'] === 'true';

    const pool = new pg.Pool({
      connectionString,
      max: isServerless ? 3 : 10,
      idleTimeoutMillis: isServerless ? 10000 : 30000,
      connectionTimeoutMillis: isServerless ? 15000 : 10000,
    });

    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    // Koneksi dibuka lazy oleh pg.Pool untuk mengurangi overhead cold-start serverless
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
