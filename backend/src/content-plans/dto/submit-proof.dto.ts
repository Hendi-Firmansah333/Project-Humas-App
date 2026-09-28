import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class SubmitProofDto {
  @IsOptional()
  @IsString()
  videoLink?: string;

  @IsOptional()
  @IsString()
  posterPath?: string;

  @IsOptional()
  @IsString()
  videoFileName?: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsBoolean()
  sendToReview?: boolean;
}