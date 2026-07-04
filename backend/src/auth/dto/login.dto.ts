import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'komang.ari', description: 'Username of Admin Humas' })
  @IsNotEmpty()
  @IsString()
  username!: string;

  @ApiProperty({ example: 'password123', description: 'Password of Admin Humas' })
  @IsNotEmpty()
  @IsString()
  password!: string;
}
