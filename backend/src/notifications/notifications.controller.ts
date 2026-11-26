import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { PushNotificationService } from './push-notification.service';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/notifications')
export class NotificationsController {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Post('device-token')
  @ApiOperation({ summary: 'Daftarkan FCM device token untuk push notification' })
  registerDeviceToken(
    @Request() req: any,
    @Body() body: { token?: string; platform?: string },
  ) {
    return this.pushNotificationService.registerToken(
      req.user.id,
      body?.token ?? '',
      body?.platform ?? 'android',
    );
  }

  @Delete('device-token')
  @ApiOperation({ summary: 'Hapus FCM device token saat logout atau notifikasi dimatikan' })
  unregisterDeviceToken(
    @Request() req: any,
    @Body() body?: { token?: string },
  ) {
    return this.pushNotificationService.unregisterToken(req.user.id, body?.token);
  }

  @Post('test-push')
  @ApiOperation({ summary: 'Kirim notifikasi uji coba ke perangkat terdaftar pengguna' })
  sendTestPush(@Request() req: any) {
    return this.pushNotificationService.sendTestPush(req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar notifikasi pengguna' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'filter', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'mobile', required: false })
  findAll(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('filter') filter?: string,
    @Query('search') search?: string,
    @Query('mobile') mobile?: string,
  ) {
    return this.notificationsService.findAllForUser(req.user.id, {
      page,
      pageSize,
      filter,
      search,
      mobile: mobile === 'true' || mobile === '1',
    });
  }

  @Patch('read-all')
  @ApiOperation({ summary: 'Tandai semua notifikasi telah dibaca' })
  markAllAsRead(@Request() req: any) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Tandai satu notifikasi dibaca' })
  markAsRead(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus notifikasi' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.notificationsService.remove(id, req.user.id);
  }
}