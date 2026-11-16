import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ChangeMyPasswordDto {
  @ApiProperty({ example: 'PasswordLama123!' })
  @IsString()
  @IsNotEmpty({ message: 'Kata sandi saat ini wajib diisi.' })
  currentPassword: string;

  @ApiProperty({ example: 'PasswordBaru123!', minLength: 8 })
  @IsString()
  @IsNotEmpty({ message: 'Kata sandi baru wajib diisi.' })
  @MinLength(8, { message: 'Password baru minimal harus 8 karakter.' })
  password: string;

  @ApiProperty({ example: 'PasswordBaru123!', minLength: 8 })
  @IsString()
  @IsNotEmpty({ message: 'Konfirmasi password wajib diisi.' })
  @MinLength(8, { message: 'Konfirmasi password minimal harus 8 karakter.' })
  confirmPassword: string;
}

