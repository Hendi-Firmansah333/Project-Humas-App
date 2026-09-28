import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsNumber, IsArray } from 'class-validator';

export class CreateActivityFromLetterDto {
  @ApiProperty({ example: 'Liputan Seminar Nasional Perikanan' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'Liputan Eksternal', default: 'Liputan Eksternal' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiProperty({ example: '2026-08-25T00:00:00Z' })
  @IsString()
  @IsNotEmpty()
  date: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ example: '16:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiProperty({ example: 'Aula Utama Polinela', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Peliputan seminar atas permintaan dinas terkait.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 3, required: false })
  @IsNumber()
  @IsOptional()
  picId?: number;

  @ApiProperty({ example: [4, 5], required: false })
  @IsArray()
  @IsOptional()
  memberIds?: number[];

  @ApiProperty({ example: -5.3582, required: false })
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 105.2321, required: false })
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  radius?: number;

  @ApiProperty({ example: [{ equipmentId: 1, quantity: 1 }], required: false })
  @IsArray()
  @IsOptional()
  equipmentItems?: { equipmentId: number; quantity: number }[];
}
