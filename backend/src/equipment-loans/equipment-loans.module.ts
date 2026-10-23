import { Module } from '@nestjs/common';
import { EquipmentLoansService } from './equipment-loans.service';
import { EquipmentLoansController } from './equipment-loans.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentLoansController],
  providers: [EquipmentLoansService],
  exports: [EquipmentLoansService],
})
export class EquipmentLoansModule {}
