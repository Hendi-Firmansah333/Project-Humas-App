import { Module } from '@nestjs/common';
import { LiveLocationService } from './live-location.service';
import { LiveLocationController } from './live-location.controller';
import { TeamLocationsController } from './team-locations.controller';
import { LocationsController } from './locations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [LiveLocationController, TeamLocationsController, LocationsController],
  providers: [LiveLocationService],
  exports: [LiveLocationService],
})
export class LiveLocationModule {}
