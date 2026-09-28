import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { LoanStatus } from '@prisma/client';

export class LoanItemDto {
  @ApiProperty({ example: 1, description: 'ID peralatan dari master Equipment' })
  @IsNumber()
  @IsNotEmpty()
  equipmentId: number;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateLoanDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  borrowerName: string;

  @ApiProperty({ example: '08123456789' })
  @IsString()
  @IsNotEmpty()
  borrowerPhone: string;

  @ApiProperty({ example: '2025-06-01T08:00:00Z' })
  @IsString()
  @IsNotEmpty()
  borrowDate: string;

  @ApiProperty({ example: '2025-06-03T16:00:00Z' })
  @IsString()
  @IsNotEmpty()
  returnDate: string;

  @ApiProperty({ example: 'Dokumentasi Acara Wisuda' })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiProperty({ example: 3, description: 'ID kegiatan terkait (opsional)' })
  @IsNumber()
  @IsOptional()
  activityId?: number;

  @ApiProperty({ type: [LoanItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LoanItemDto)
  items: LoanItemDto[];

  @ApiProperty({ enum: LoanStatus, default: LoanStatus.SEDANG_DIPINJAM })
  @IsEnum(LoanStatus)
  @IsOptional()
  status?: LoanStatus;
}
