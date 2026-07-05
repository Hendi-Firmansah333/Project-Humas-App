import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString } from 'class-validator';

export class ActivityMemberDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 'Reporter' })
  @IsString()
  @IsNotEmpty()
  role: string;
}