import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class UpdateMyProfileDto {
  @ApiProperty({ example: 'Budi Santoso, S.I.Kom', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Nama lengkap minimal harus 3 karakter.' })
  fullName?: string;

  @ApiProperty({ example: 'budi.s', required: false })
  @IsOptional()
  @IsString()
  @MinLength(3, { message: 'Username minimal harus 3 karakter.' })
  username?: string;

  @ApiProperty({ example: 'budi@polinela.ac.id', required: false })
  @IsOptional()
  @IsEmail({}, { message: 'Format email tidak valid.' })
  email?: string;

  @ApiProperty({ example: '0812-3456-7890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/demo/image/upload/avatar.jpg',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  avatar?: string | null;
}

