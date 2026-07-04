import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Daftar notifikasi terbaru untuk pengguna' })
  findAll() {
    return this.notificationsService.findAll();
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Tandai semua notifikasi telah dibaca' })
  markAllAsRead() {
    return this.notificationsService.markAllAsRead();
  }
}
