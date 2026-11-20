import * as dotenv from 'dotenv';
dotenv.config({ override: true });
import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import { execSync } from 'child_process';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private pool: pg.Pool;

  constructor() {
    const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    super({ adapter });
    this.pool = pool;
  }

  async onModuleInit() {
    // Test connection and auto-start PostgreSQL in WSL if ECONNREFUSED
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await this.$queryRaw`SELECT 1`;
        this.logger.log('Database PostgreSQL terhubung dengan sukses.');
        return;
      } catch (err: any) {
        if (err?.code === 'ECONNREFUSED' || err?.message?.includes('ECONNREFUSED') || String(err).includes('ECONNREFUSED')) {
          this.logger.warn(`Koneksi database terputus (Percobaan ${attempt}/3). Menyalakan humas_postgres di Docker WSL...`);
          try {
            execSync('wsl -d Ubuntu -u root bash -c "service docker status >/dev/null 2>&1 || service docker start; docker start humas_postgres"', {
              stdio: 'ignore',
              timeout: 15000,
            });
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } catch (startErr: any) {
            this.logger.error('Gagal menjalankan container humas_postgres secara otomatis:', startErr?.message);
          }
        } else {
          throw err;
        }
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
