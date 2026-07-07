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
import { Platform, ContentStatus } from '@prisma/client';

@ApiTags('Content Plans')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/content-plans')
export class ContentPlansController {
  constructor(private readonly contentPlansService: ContentPlansService) {}

  @Post()
  @ApiOperation({ summary: 'Buat rencana konten editorial baru' })
  create(@Body() createContentPlanDto: CreateContentPlanDto) {
    return this.contentPlansService.create(createContentPlanDto);
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
      userId: mobile === 'true' || mobile === '1' ? req?.user?.id : undefined,
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
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContentPlanDto: UpdateContentPlanDto,
  ) {
    return this.contentPlansService.update(id, updateContentPlanDto);
  }

  @Post(':id/submit-proof')
  @ApiOperation({ summary: 'Kirim bukti konten (mobile)' })
  submitProof(@Param('id', ParseIntPipe) id: number, @Body() dto: SubmitProofDto) {
    return this.contentPlansService.submitProof(id, dto);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Mengaktifkan kembali content plan dari riwayat' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.contentPlansService.restore(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus rencana konten' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentPlansService.remove(id);
  }
}