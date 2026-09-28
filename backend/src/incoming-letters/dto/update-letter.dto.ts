import { PartialType } from '@nestjs/swagger';
import { CreateLetterDto } from './create-letter.dto';

export class UpdateLetterDto extends PartialType(CreateLetterDto) {}
