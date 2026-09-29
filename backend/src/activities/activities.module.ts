import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ActivitiesCrudService } from './services/activities-crud.service';
import { ActivitiesTeamService } from './services/activities-team.service';
import { ActivitiesExecutionService } from './services/activities-execution.service';
import { ActivitiesWorkflowService } from './services/activities-workflow.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActivitiesController],
  providers: [
    ActivitiesService,
    ActivitiesCrudService,
    ActivitiesTeamService,
    ActivitiesExecutionService,
    ActivitiesWorkflowService,
  ],
  exports: [
    ActivitiesService,
    ActivitiesCrudService,
    ActivitiesTeamService,
    ActivitiesExecutionService,
    ActivitiesWorkflowService,
  ],
})
export class ActivitiesModule {}
