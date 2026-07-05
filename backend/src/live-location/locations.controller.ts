import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LiveLocationService } from './live-location.service';

@ApiTags('Locations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/locations')
export class LocationsController {
  constructor(private readonly liveLocationService: LiveLocationService) {}

  @Get()
  @ApiOperation({ summary: 'Alias live location untuk web admin' })
  findAll() {
    return this.liveLocationService.findAll(false);
  }
}