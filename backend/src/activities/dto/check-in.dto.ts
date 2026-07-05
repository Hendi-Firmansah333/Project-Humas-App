import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @IsOptional()
  @IsString()
  selfiePath?: string;

  @IsOptional()
  @IsBoolean()
  isLate?: boolean;

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;
}