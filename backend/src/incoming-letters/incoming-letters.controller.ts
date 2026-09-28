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
import { IncomingLettersService } from './incoming-letters.service';
import { CreateLetterDto } from './dto/create-letter.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { CreateActivityFromLetterDto } from './dto/create-activity-from-letter.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Incoming Letters')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
@Controller('api/incoming-letters')
export class IncomingLettersController {
  constructor(private readonly incomingLettersService: IncomingLettersService) {}

  @Post()
  @ApiOperation({ summary: 'Input surat masuk baru (Admin / Super Admin)' })
  create(@Request() req: any, @Body() dto: CreateLetterDto) {
    return this.incomingLettersService.create(req.user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Daftar surat masuk' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(@Query('search') search?: string, @Query('status') status?: string) {
    return this.incomingLettersService.findAll({ search, status });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail surat masuk' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.incomingLettersService.findOne(id);
  }

  @Patch(':id/verify-admin')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Verifikasi kelengkapan surat oleh Admin Humas' })
  verifyAdmin(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.incomingLettersService.verifyAdmin(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui data surat masuk' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: UpdateLetterDto,
  ) {
    return this.incomingLettersService.update(id, req.user.id, dto);
  }

  @Post(':id/create-activity')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Buat kegiatan berdasarkan surat masuk (Kepala Humas)' })
  createActivity(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body() dto: CreateActivityFromLetterDto,
  ) {
    return this.incomingLettersService.createActivityFromLetter(id, req.user.id, dto);
  }

  @Patch(':id/approve')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Setujui surat masuk (Kepala Humas)' })
  approve(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.incomingLettersService.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tolak surat masuk (Kepala Humas)' })
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
    @Body('notes') notes: string,
  ) {
    return this.incomingLettersService.reject(id, req.user.id, notes);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus surat masuk (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    return this.incomingLettersService.remove(id, req.user.id);
  }
}
