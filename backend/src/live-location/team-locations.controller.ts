import { Controller, Get, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { LiveLocationService } from './live-location.service';

@ApiTags('Team Locations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/team-locations')
export class TeamLocationsController {
  constructor(private readonly liveLocationService: LiveLocationService) {}

  @Get()
  @ApiOperation({ summary: 'Alias live location untuk mobile' })
  @ApiQuery({ name: 'mobile', required: false })
  findAll(@Request() req: any, @Query('mobile') mobile?: string) {
    return this.liveLocationService.findAll(
      { id: req.user.id, role: req.user.role },
      mobile === 'true' || mobile === '1',
    );
  }
}