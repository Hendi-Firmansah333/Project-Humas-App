import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiProperty({ example: 'Komang Ari', required: false })
  @IsString()
  @IsOptional()
  fullName?: string;

  @ApiProperty({ example: 'komang.ari', required: false })
  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({ example: 'komang.ari@polinela.ac.id', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '0812-3456-7890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: '198701012020121001', required: false })
  @IsString()
  @IsOptional()
  nip?: string;

  @ApiProperty({ example: 'https://images.unsplash.com/...', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
}

