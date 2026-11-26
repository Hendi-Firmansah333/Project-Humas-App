import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { IsSafeHttpUrl } from '../../common/validators/safe-url.validator';

export class SubmitProofDto {
  @IsOptional()
  @IsString()
  @IsSafeHttpUrl()
  videoLink?: string;

  @IsOptional()
  @IsString()
  @IsSafeHttpUrl()
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