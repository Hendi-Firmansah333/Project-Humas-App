import { IsOptional, IsString } from 'class-validator';

export class SubmitProofDto {
  @IsString()
  videoLink: string;

  @IsOptional()
  @IsString()
  posterPath?: string;

  @IsOptional()
  @IsString()
  videoFileName?: string;
}