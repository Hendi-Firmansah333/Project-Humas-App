import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateScheduleDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ example: '2025-05-20T00:00:00Z' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '08:00', default: '08:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '16:00', default: '16:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 'Ruang Rapat Humas', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Keterangan tambahan piket', required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
