import { Controller, Get, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LiveLocationService } from './live-location.service';

@ApiTags('Locations')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('api/locations')
export class LocationsController {
  constructor(private readonly liveLocationService: LiveLocationService) {}

  @Get()
  @ApiOperation({ summary: 'Alias live location untuk web admin' })
  findAll(@Request() req: any) {
    return this.liveLocationService.findAll({ id: req.user.id, role: req.user.role }, false);
  }
}