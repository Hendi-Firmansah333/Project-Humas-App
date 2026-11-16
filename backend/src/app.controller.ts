import { Controller, Get, Optional } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    @Optional() private readonly prisma?: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('api/health')
  @SkipThrottle()
  @ApiOperation({ summary: 'Health check API & koneksi database PostgreSQL' })
  async getHealth() {
    let database: 'connected' | 'unconfigured' | 'error' = 'unconfigured';
    if (this.prisma && typeof this.prisma.$queryRaw === 'function') {
      try {
        await this.prisma.$queryRaw`SELECT 1`;
        database = 'connected';
      } catch {
        database = 'error';
      }
    }

    return {
      status: database === 'error' ? 'degraded' : 'ok',
      database,
      environment:
        process.env['VERCEL'] === '1'
          ? 'vercel'
          : process.env['NODE_ENV'] || 'development',
      timestamp: new Date().toISOString(),
    };
  }
}
