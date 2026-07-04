import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LiveLocationService } from './live-location.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Live Location')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/live-location')
export class LiveLocationController {
  constructor(private readonly liveLocationService: LiveLocationService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar koordinat GPS real-time seluruh personel humas' })
  findAll() {
    return this.liveLocationService.findAll();
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sinkronisasi / perbarui koordinat GPS personel login' })
  updateLocation(@Request() req: any, @Body() updateLocationDto: UpdateLocationDto) {
    return this.liveLocationService.updateLocation(req.user.id, updateLocationDto);
  }
}
