import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CheckInDto } from './dto/check-in.dto';
import { DocumentationDto } from './dto/documentation.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ActivityStatus, Role } from '@prisma/client';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Buat jadwal kegiatan liputan baru' })
  create(@Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Riwayat kegiatan selesai (mobile/web)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'mobile', required: false })
  findHistory(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('mobile') mobile?: string,
  ) {
    const isMobile = mobile === 'true' || mobile === '1';
    const parsedStatus = status && status !== 'Semua' ? (status as ActivityStatus) : undefined;
    return this.activitiesService.findAllPaginated({
      page,
      pageSize,
      search,
      status: parsedStatus,
      startDate,
      endDate,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      history: true,
      mobile: isMobile,
      userId: isMobile ? req.user.id : undefined,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Daftar agenda kegiatan kehumasan' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'status', enum: ActivityStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'mobile', required: false })
  findAll(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('mobile') mobile?: string,
  ) {
    const isMobile = mobile === 'true' || mobile === '1';
    const parsedStatus = status && status !== 'Semua' ? (status as ActivityStatus) : undefined;
    return this.activitiesService.findAllPaginated({
      page,
      pageSize,
      status: parsedStatus,
      search,
      startDate,
      endDate,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      mobile: isMobile,
      userId: isMobile ? req.user.id : undefined,
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Daftar semua kategori kegiatan yang ada' })
  getCategories() {
    return this.activitiesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail agenda kegiatan dan penugasan tim' })
  @ApiQuery({ name: 'mobile', required: false })
  findOne(@Param('id', ParseIntPipe) id: number, @Query('mobile') mobile?: string) {
    return this.activitiesService.findOne(id, mobile === 'true' || mobile === '1');
  }

  @Patch(':id/restore')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Aktifkan kembali kegiatan yang sudah selesai' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.activitiesService.restore(id);
  }

  @Patch(':id/validate')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Validasi penyelesaian kegiatan oleh Admin' })
  validate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body('notes') notes?: string,
  ) {
    return this.activitiesService.validateActivity(id, req.user.id, notes);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Perbarui jadwal atau status kegiatan' })
  update(@Param('id', ParseIntPipe) id: number, @Body() updateActivityDto: UpdateActivityDto) {
    return this.activitiesService.update(id, updateActivityDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Hapus kegiatan dari jadwal' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.activitiesService.remove(id);
  }

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check-in kehadiran kegiatan (mobile)' })
  checkIn(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: CheckInDto,
  ) {
    return this.activitiesService.checkIn(id, req.user.id, dto);
  }

  @Post(':id/documentation')
  @ApiOperation({ summary: 'Upload dokumentasi kegiatan (mobile)' })
  documentation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: DocumentationDto,
  ) {
    return this.activitiesService.submitDocumentation(id, req.user.id, dto);
  }
}