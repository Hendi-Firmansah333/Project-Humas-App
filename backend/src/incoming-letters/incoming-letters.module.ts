import { Module } from '@nestjs/common';
import { IncomingLettersService } from './incoming-letters.service';
import { IncomingLettersController } from './incoming-letters.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [IncomingLettersController],
  providers: [IncomingLettersService],
  exports: [IncomingLettersService],
})
export class IncomingLettersModule {}
