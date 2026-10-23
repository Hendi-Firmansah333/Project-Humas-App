import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class ActivityMemberDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  userId: number;

  @ApiProperty({ example: 'Anggota Humas', required: false })
  @IsString()
  @IsOptional()
  role?: string;
}