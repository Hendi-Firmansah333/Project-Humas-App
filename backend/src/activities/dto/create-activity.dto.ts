import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ActivityStatus } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ example: 'Liputan Dies Natalis Polinela ke-41' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Liputan Eksternal', default: 'Liputan Internal' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: '2025-05-20T08:00:00Z' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '12:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 'Gedung Serbaguna Polinela' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ enum: ActivityStatus, default: ActivityStatus.AKAN_DATANG })
  @IsEnum(ActivityStatus)
  @IsOptional()
  status?: ActivityStatus;

  @ApiProperty({ example: 'Peliputan lengkap beserta dokumentasi video dan rilis berita resmi.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  picId: number;

  @ApiProperty({ example: [2, 3], required: false })
  @IsArray()
  @IsOptional()
  memberIds?: number[];
}
