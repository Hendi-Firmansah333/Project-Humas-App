import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateLocationDto {
  @ApiProperty({ example: -5.3582 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ example: 105.2335 })
  @IsNumber()
  longitude: number;

  @ApiProperty({ example: 'Gedung Direktorat Polinela' })
  @IsString()
  address: string;

  @ApiProperty({ example: '0.2 km dari pusat kampus', required: false })
  @IsString()
  @IsOptional()
  distance?: string;

  @ApiProperty({ example: true, default: true })
  @IsBoolean()
  @IsOptional()
  isOnline?: boolean;
}
