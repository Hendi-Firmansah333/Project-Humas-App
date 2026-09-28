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
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Buat jadwal kegiatan manual / tanpa surat (Kepala Humas)' })
  create(@Request() req: any, @Body() createActivityDto: CreateActivityDto) {
    return this.activitiesService.create(createActivityDto, req.user.id);
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
      userId: req.user.id,
      role: req.user.role,
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
      userId: req.user.id,
      role: req.user.role,
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

  // ── Approval Workflow Endpoints ────────────────────────────────────────

  @Patch(':id/approve-execution')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Setujui pelaksanaan kegiatan (Kepala Humas)' })
  approveExecution(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.activitiesService.approveExecution(id, req.user.id);
  }

  @Patch(':id/reject-execution')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tolak pelaksanaan kegiatan (Kepala Humas)' })
  rejectExecution(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body('notes') notes: string,
  ) {
    return this.activitiesService.rejectExecution(id, req.user.id, notes);
  }

  @Patch(':id/assign-team')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tentukan PIC, anggota, dan peralatan kegiatan (Kepala Humas)' })
  assignTeam(
    @Param('id', ParseIntPipe) id: number,
    @Body('picId') picId: number,
    @Body('memberIds') memberIds: number[],
    @Body('equipmentItems') equipmentItems?: { equipmentId: number; quantity: number }[],
  ) {
    return this.activitiesService.assignTeam(id, picId, memberIds, equipmentItems);
  }

  @Patch(':id/submit-verification')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Ajukan verifikasi kelengkapan kegiatan (Admin)' })
  submitVerification(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body('notes') notes?: string,
  ) {
    return this.activitiesService.submitVerification(id, req.user.id, notes);
  }

  @Patch(':id/approve-finish')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Setujui kegiatan benar-benar selesai (Kepala Humas)' })
  approveFinish(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body('notes') notes?: string,
  ) {
    return this.activitiesService.approveFinish(id, req.user.id, notes);
  }

  @Patch(':id/return-revision')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Kembalikan kegiatan untuk perbaikan (Admin / Kepala Humas)' })
  returnRevision(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body('notes') notes: string,
  ) {
    return this.activitiesService.returnRevision(id, req.user.id, notes);
  }

  @Patch(':id/restore')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Aktifkan kembali kegiatan yang sudah selesai' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.activitiesService.restore(id);
  }

  @Patch(':id/validate')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: '[Deprecated] Gunakan submit-verification. Validasi legacy.' })
  validate(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body('notes') notes?: string,
  ) {
    return this.activitiesService.submitVerification(id, req.user.id, notes);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Perbarui jadwal atau penugasan kegiatan (Kepala Humas)' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() updateActivityDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, updateActivityDto, req.user.id);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hapus/arsip kegiatan (Kepala Humas)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.activitiesService.remove(id);
  }

  // ── Mobile Endpoints ────────────────────────────────────────

  @Post(':id/check-in')
  @ApiOperation({ summary: 'Check-in kehadiran kegiatan (mobile – Tim Humas)' })
  checkIn(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: CheckInDto,
  ) {
    return this.activitiesService.checkIn(id, req.user.id, dto);
  }

  @Post(':id/documentation')
  @ApiOperation({ summary: 'Upload link Google Drive / dokumentasi kegiatan (mobile)' })
  documentation(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: DocumentationDto,
  ) {
    return this.activitiesService.submitDocumentation(id, req.user.id, dto);
  }
}