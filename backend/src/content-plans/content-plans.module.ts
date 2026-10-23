import { Module } from '@nestjs/common';
import { ContentPlansService } from './content-plans.service';
import { ContentPlansController } from './content-plans.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContentPlansController],
  providers: [ContentPlansService],
  exports: [ContentPlansService],
})
export class ContentPlansModule {}
