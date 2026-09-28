import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateLetterDto {
  @ApiProperty({ example: '001/DINAS-DKP/VIII/2026' })
  @IsString()
  @IsNotEmpty()
  letterNumber: string;

  @ApiProperty({ example: '2026-08-20T00:00:00Z' })
  @IsString()
  @IsNotEmpty()
  letterDate: string;

  @ApiProperty({ example: '2026-08-21T00:00:00Z' })
  @IsString()
  @IsNotEmpty()
  receivedDate: string;

  @ApiProperty({ example: 'Dinas Kelautan dan Perikanan' })
  @IsString()
  @IsNotEmpty()
  sender: string;

  @ApiProperty({ example: 'Pemerintah Provinsi Lampung' })
  @IsString()
  @IsNotEmpty()
  institution: string;

  @ApiProperty({ example: 'Permohonan Peliputan Seminar' })
  @IsString()
  @IsNotEmpty()
  subject: string;

  @ApiProperty({ example: 'Kepala Bagian Humas Polinela' })
  @IsString()
  @IsNotEmpty()
  destination: string;

  @ApiProperty({ example: 'https://drive.google.com/file/d/sample/view', required: false })
  @IsString()
  @IsOptional()
  fileUrl?: string;

  @ApiProperty({ example: 'Catatan tambahan...', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'BARU', default: 'BARU', required: false })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({ example: 'Gedung Serbaguna Polinela', required: false })
  @IsString()
  @IsOptional()
  eventLocation?: string;

  @ApiProperty({ example: '2026-08-25T00:00:00Z', required: false })
  @IsString()
  @IsOptional()
  eventDate?: string;

  @ApiProperty({ example: '08:00', required: false })
  @IsString()
  @IsOptional()
  startTime?: string;

  @ApiProperty({ example: '12:00', required: false })
  @IsString()
  @IsOptional()
  endTime?: string;

  @ApiProperty({ example: -5.3582, required: false })
  @IsOptional()
  latitude?: number;

  @ApiProperty({ example: 105.2321, required: false })
  @IsOptional()
  longitude?: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  radius?: number;
}
