import { IsString } from 'class-validator';

export class DocumentationDto {
  @IsString()
  driveUrl: string;
}