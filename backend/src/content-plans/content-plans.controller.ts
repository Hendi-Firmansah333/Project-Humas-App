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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ContentPlansService } from './content-plans.service';
import { CreateContentPlanDto } from './dto/create-content-plan.dto';
import { UpdateContentPlanDto } from './dto/update-content-plan.dto';
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

  @Get()
  @ApiOperation({ summary: 'Daftar jadwal publikasi konten' })
  @ApiQuery({ name: 'platform', enum: Platform, required: false })
  @ApiQuery({ name: 'status', enum: ContentStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @Query('platform') platform?: Platform,
    @Query('status') status?: ContentStatus,
    @Query('search') search?: string,
  ) {
    return this.contentPlansService.findAll(platform, status, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail konten serta tautan draf' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.contentPlansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui status atau draf konten' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateContentPlanDto: UpdateContentPlanDto,
  ) {
    return this.contentPlansService.update(id, updateContentPlanDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus rencana konten' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.contentPlansService.remove(id);
  }
}
