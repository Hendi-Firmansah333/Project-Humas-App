import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateReportDto {
  @ApiProperty({ example: 'Rekapitulasi Liputan Semester 1' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Kegiatan', default: 'Kegiatan' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: '2025-06-01T00:00:00Z' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  picId: number;

  @ApiProperty({ example: 'Selesai', default: 'Selesai' })
  @IsString()
  @IsOptional()
  status?: string;
}
