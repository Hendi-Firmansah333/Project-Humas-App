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
import { ContentPlansService } from './content-plans.service';
import { CreateContentPlanDto } from './dto/create-content-plan.dto';
import { UpdateContentPlanDto } from './dto/update-content-plan.dto';
import { SubmitProofDto } from './dto/submit-proof.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Platform, ContentStatus, Role } from '@prisma/client';

@ApiTags('Content Plans')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/content-plans')
export class ContentPlansController {
  constructor(private readonly contentPlansService: ContentPlansService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Buat rencana konten editorial baru' })
  create(@Request() req: any, @Body() createContentPlanDto: CreateContentPlanDto) {
    return this.contentPlansService.create(createContentPlanDto, req?.user?.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Daftar riwayat publikasi konten' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'platform', enum: Platform, required: false })
  @ApiQuery({ name: 'status', enum: ContentStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  findHistory(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
    @Query('platform') platform?: Platform,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const validStatuses = Object.values(ContentStatus);
    const parsedStatus =
      status && status !== 'Semua' && validStatuses.includes(status as ContentStatus)
        ? (status as ContentStatus)
        : undefined;

    return this.contentPlansService.findAllPaginated({
      page,
      pageSize,
      platform,
      status: parsedStatus,
      search,
      startDate,
      endDate,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      history: true,
      userId: req?.user?.id,
      role: req?.user?.role,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Daftar jadwal publikasi konten' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'pageSize', required: false })
  @ApiQuery({ name: 'platform', enum: Platform, required: false })
  @ApiQuery({ name: 'status', enum: ContentStatus, required: false })
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
    @Query('platform') platform?: Platform,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
    @Query('mobile') mobile?: string,
  ) {
    const validStatuses = Object.values(ContentStatus);
    const parsedStatus =
      status && status !== 'Semua' && validStatuses.includes(status as ContentStatus)
        ? (status as ContentStatus)
        : undefined;

    return this.contentPlansService.findAllPaginated({
      page,
      pageSize,
      platform,
      status: parsedStatus,
      search,
      startDate,
      endDate,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      mobile: mobile === 'true' || mobile === '1',
      userId: req?.user?.id,
      role: req?.user?.role,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail konten serta tautan draf' })
  @ApiQuery({ name: 'mobile', required: false })
  findOne(@Param('id', ParseIntPipe) id: number, @Query('mobile') mobile?: string) {
    return this.contentPlansService.findOne(id, mobile === 'true' || mobile === '1');
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui status atau draf konten' })
  update(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContentPlanDto: UpdateContentPlanDto,
  ) {
    return this.contentPlansService.update(id, updateContentPlanDto, req?.user?.id, req?.user?.role);
  }

  @Patch(':id/start-progress')
  @ApiOperation({ summary: 'PIC memulai pengerjaan konten' })
  startProgress(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.contentPlansService.startProgress(id, req?.user?.id, req?.user?.role);
  }

  @Post(':id/submit-work')
  @ApiOperation({ summary: 'PIC mengirimkan draf konten / video / caption dan menandai siap direview' })
  submitWork(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: { videoUrl?: string; draftUrl?: string; thumbnailUrl?: string; caption?: string },
  ) {
    return this.contentPlansService.submitWork(id, req?.user?.id, dto, req?.user?.role);
  }

  @Patch(':id/send-review')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin memverifikasi dan mengajukan konten ke Kepala Humas' })
  sendReview(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.contentPlansService.verifyAndSendToHead(id, req?.user?.id, adminNotes);
  }

  @Patch(':id/verify-admin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin memverifikasi lengkap dan mengajukan ke Kepala Humas' })
  verifyAdmin(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.contentPlansService.verifyAndSendToHead(id, req?.user?.id, adminNotes);
  }

  @Patch(':id/request-fix')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Admin meminta perbaikan internal ke PIC' })
  requestFix(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('notes') notes: string,
  ) {
    return this.contentPlansService.requestFix(id, req?.user?.id, notes);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Kepala Humas menyetujui konten (Final Approval)' })
  approve(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.contentPlansService.approve(id, req?.user?.id);
  }

  @Patch(':id/request-revision')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Kepala Humas meminta revisi ke PIC' })
  requestRevision(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body('notes') notes: string,
  ) {
    return this.contentPlansService.requestRevision(id, req?.user?.id, notes);
  }

  @Patch(':id/publish')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mempublikasikan konten (Sudah Tayang)' })
  publish(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.contentPlansService.publish(id, req?.user?.id);
  }

  @Patch(':id/cancel')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Membatalkan konten' })
  cancel(@Request() req: any, @Param('id', ParseIntPipe) id: number) {
    return this.contentPlansService.cancel(id, req?.user?.id);
  }

  @Post(':id/submit-proof')
  @ApiOperation({ summary: 'Kirim bukti konten (mobile)' })
  submitProof(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitProofDto,
  ) {
    return this.contentPlansService.submitProof(id, dto, req?.user?.id);
  }

  @Patch(':id/restore')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Mengaktifkan kembali content plan dari riwayat' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.contentPlansService.restore(id);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Hapus rencana konten' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentPlansService.remove(id);
  }
}