import { PartialType } from '@nestjs/swagger';
import { CreateContentPlanDto } from './create-content-plan.dto';

export class UpdateContentPlanDto extends PartialType(CreateContentPlanDto) {}
