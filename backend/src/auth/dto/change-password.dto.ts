import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPass123' })
  @IsString()
  @IsNotEmpty({ message: 'Kata sandi saat ini wajib diisi.' })
  currentPassword: string;

  @ApiProperty({ example: 'NewPass123!' })
  @IsString()
  @MinLength(6, { message: 'Kata sandi baru minimal 6 karakter.' })
  newPassword: string;
}
