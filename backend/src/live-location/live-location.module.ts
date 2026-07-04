import { Module } from '@nestjs/common';
import { LiveLocationService } from './live-location.service';
import { LiveLocationController } from './live-location.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LiveLocationController],
  providers: [LiveLocationService],
  exports: [LiveLocationService],
})
export class LiveLocationModule {}
