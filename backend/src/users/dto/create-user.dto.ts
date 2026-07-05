import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { Role, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'Budi Santoso, S.I.Kom' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: 'budi.s' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'budi@polinela.ac.id' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: '0812-3456-7890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'secret123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, default: Role.USER })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiProperty({ example: 'Jurnalis Lapangan', required: false })
  @IsString()
  @IsOptional()
  roleLabel?: string;

  @ApiProperty({ enum: UserStatus, default: UserStatus.AKTIF, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({ example: 'https://images.unsplash.com/...', required: false })
  @IsString()
  @IsOptional()
  avatar?: string;
}
