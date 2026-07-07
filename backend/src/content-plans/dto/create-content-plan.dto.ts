import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Platform, ContentStatus } from '@prisma/client';

export class CreateContentPlanDto {
  @ApiProperty({ example: 'Rilis Berita Prestasi Mahasiswa' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ enum: Platform, default: Platform.INSTAGRAM })
  @IsEnum(Platform)
  @IsOptional()
  platform?: Platform;

  @ApiProperty({ example: 'Reels', default: 'Reels' })
  @IsString()
  @IsOptional()
  contentType?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsNotEmpty()
  picId: number;

  @ApiProperty({ example: '2025-05-25T15:00:00Z' })
  @IsString()
  @IsNotEmpty()
  deadline: string;

  @ApiProperty({ enum: ContentStatus, default: ContentStatus.DRAFT })
  @IsEnum(ContentStatus)
  @IsOptional()
  status?: ContentStatus;

  @ApiProperty({ example: 'Draft konten video vertikal durasi 60 detik.', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Perbaiki hook video pada detik ke-3.', required: false })
  @IsString()
  @IsOptional()
  revisionNote?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/...', required: false })
  @IsString()
  @IsOptional()
  thumbnailUrl?: string;

  @ApiProperty({ example: 'https://drive.google.com/...', required: false })
  @IsString()
  @IsOptional()
  draftUrl?: string;

  @ApiProperty({ example: 'https://video.mp4...', required: false })
  @IsString()
  @IsOptional()
  videoUrl?: string;
}
