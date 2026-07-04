import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { LoanStatus } from '@prisma/client';

export class CreateLoanDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  equipmentId: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsNotEmpty()
  borrowerId: number;

  @ApiProperty({ example: '2025-06-01T08:00:00Z' })
  @IsString()
  @IsNotEmpty()
  borrowDate: string;

  @ApiProperty({ example: '2025-06-03T16:00:00Z' })
  @IsString()
  @IsNotEmpty()
  returnDate: string;

  @ApiProperty({ enum: LoanStatus, default: LoanStatus.DIPINJAM })
  @IsEnum(LoanStatus)
  @IsOptional()
  status?: LoanStatus;
}
