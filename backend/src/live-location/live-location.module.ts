import { Module, Provider } from '@nestjs/common';
import { LiveLocationService } from './live-location.service';
import { LiveLocationController } from './live-location.controller';
import { TeamLocationsController } from './team-locations.controller';
import { LocationsController } from './locations.controller';
import { LiveLocationGateway } from './live-location.gateway';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

const isServerless =
  process.env['VERCEL'] === '1' || process.env['DISABLE_WEBSOCKETS'] === 'true';

const providers: Provider[] = isServerless
  ? [LiveLocationService]
  : [LiveLocationService, LiveLocationGateway];

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [LiveLocationController, TeamLocationsController, LocationsController],
  providers,
  exports: providers,
})
export class LiveLocationModule {}
