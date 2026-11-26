import { IsString } from 'class-validator';
import { IsSafeHttpUrl } from '../../common/validators/safe-url.validator';

export class DocumentationDto {
  @IsString()
  @IsSafeHttpUrl()
  driveUrl: string;
}