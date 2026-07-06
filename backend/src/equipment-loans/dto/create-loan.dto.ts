import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LoanStatus } from '@prisma/client';

export class CreateLoanDto {
  @ApiProperty({ example: 'Budi Santoso' })
  @IsString()
  @IsNotEmpty()
  borrowerName: string;

  @ApiProperty({ example: '08123456789' })
  @IsString()
  @IsNotEmpty()
  borrowerPhone: string;

  @ApiProperty({ example: 'Kamera Sony A7III' })
  @IsString()
  @IsNotEmpty()
  equipmentName: string;

  @ApiProperty({ example: '2025-06-01T08:00:00Z' })
  @IsString()
  @IsNotEmpty()
  borrowDate: string;

  @ApiProperty({ example: '2025-06-03T16:00:00Z' })
  @IsString()
  @IsNotEmpty()
  returnDate: string;

  @ApiProperty({ example: 'Dokumentasi Acara' })
  @IsString()
  @IsOptional()
  purpose?: string;

  @ApiProperty({ enum: LoanStatus, default: LoanStatus.SEDANG_DIPINJAM })
  @IsEnum(LoanStatus)
  @IsOptional()
  status?: LoanStatus;
}
