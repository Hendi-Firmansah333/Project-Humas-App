import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LoanStatus, ReturnCondition } from '@prisma/client';

export class ReturnItemDto {
  @ApiProperty({ example: 1, description: 'ID EquipmentLoanItem yang akan dikembalikan' })
  @IsNumber()
  loanItemId: number;

  @ApiProperty({ example: 1, description: 'Jumlah yang dikembalikan pada sesi ini' })
  @IsNumber()
  @Min(1)
  returnedQuantity: number;

  @ApiProperty({ enum: ReturnCondition, example: ReturnCondition.BAIK, description: 'Kondisi alat saat dikembalikan' })
  @IsEnum(ReturnCondition)
  @IsOptional()
  returnCondition?: ReturnCondition;
}

export class UpdateLoanDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsOptional()
  borrowerName?: string;

  @ApiProperty({ example: '08123456789' })
  @IsString()
  @IsOptional()
  borrowerPhone?: string;

  @ApiProperty({ example: '2025-06-01T08:00:00Z' })
  @IsString()
  @IsOptional()
  borrowDate?: string;

  @ApiProperty({ example: '2025-06-03T16:00:00Z' })
  @IsString()
  @IsOptional()
  returnDate?: string;

  @ApiProperty({ example: 'Dokumentasi Acara' })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiProperty({ example: 'Catatan tambahan' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ enum: LoanStatus })
  @IsEnum(LoanStatus)
  @IsOptional()
  status?: LoanStatus;

  @ApiProperty({ type: [ReturnItemDto], description: 'Daftar item yang dikembalikan (partial/full return)' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnItemDto)
  @IsOptional()
  returnItems?: ReturnItemDto[];
}
