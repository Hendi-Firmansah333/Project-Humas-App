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
import { EquipmentLoansService } from './equipment-loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { LoanStatus, ReturnCondition, Role } from '@prisma/client';

@ApiTags('Equipment Loans')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('api/equipment-loans')
export class EquipmentLoansController {
  constructor(private readonly equipmentLoansService: EquipmentLoansService) {}

  // ─────────────────────────────────────────────────────────────────────
  // EQUIPMENT MASTER (Inventaris) — Admin CRUD, others Read-only
  // ─────────────────────────────────────────────────────────────────────

  @Get('availability')
  @ApiOperation({ summary: 'Cek ketersediaan alat pada rentang tanggal & waktu tertentu (Time Conflict Check)' })
  @ApiQuery({ name: 'date', required: true, example: '2026-09-10' })
  @ApiQuery({ name: 'startTime', required: false, example: '08:00' })
  @ApiQuery({ name: 'endTime', required: false, example: '12:00' })
  @ApiQuery({ name: 'excludeActivityId', required: false })
  checkAvailability(
    @Query('date') date: string,
    @Query('startTime') startTime?: string,
    @Query('endTime') endTime?: string,
    @Query('excludeActivityId') excludeActivityId?: number,
  ) {
    return this.equipmentLoansService.checkAvailability(
      date,
      startTime,
      endTime,
      excludeActivityId ? Number(excludeActivityId) : undefined,
    );
  }

  @Get('equipment')
  @ApiOperation({ summary: 'Daftar inventaris peralatan beserta stok tersedia' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'includeInactive', required: false })
  findAllEquipment(
    @Query('search') search?: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.equipmentLoansService.findAllEquipment(search, includeInactive === 'true');
  }

  @Get('equipment/:id/stock')
  @ApiOperation({ summary: 'Cek stok tersedia untuk satu peralatan' })
  getStock(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentLoansService.getAvailableStock(id);
  }

  @Get('equipment/:id')
  @ApiOperation({ summary: 'Detail satu peralatan inventaris' })
  findOneEquipment(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentLoansService.findOneEquipment(id);
  }

  @Post('equipment')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tambah peralatan baru ke inventaris (Admin)' })
  createEquipment(@Body() body: any) {
    return this.equipmentLoansService.createEquipment(body);
  }

  @Patch('equipment/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Perbarui data inventaris peralatan (Admin)' })
  updateEquipment(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.equipmentLoansService.updateEquipment(id, body);
  }

  @Delete('equipment/:id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hapus peralatan dari inventaris (Admin, soft delete)' })
  removeEquipment(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentLoansService.removeEquipment(id);
  }

  // ─────────────────────────────────────────────────────────────────────
  // LOANS — all roles can view, Admin manages, USER can create own
  // ─────────────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.USER)
  @ApiOperation({ summary: 'Catat peminjaman alat baru' })
  create(@Request() req: any, @Body() createLoanDto: CreateLoanDto) {
    return this.equipmentLoansService.createLoan(createLoanDto, req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Riwayat peminjaman yang sudah selesai' })
  @ApiQuery({ name: 'status', enum: LoanStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  findHistory(
    @Request() req: any,
    @Query('status') status?: LoanStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const userFilter = req.user.role === Role.USER ? req.user.id : undefined;
    return this.equipmentLoansService.findAll({
      status,
      search,
      startDate,
      endDate,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      history: true,
      userId: userFilter,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Daftar peminjaman aktif (Sedang Dipinjam & Terlambat)' })
  @ApiQuery({ name: 'status', enum: LoanStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  findAll(
    @Request() req: any,
    @Query('status') status?: LoanStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    const userFilter = req.user.role === Role.USER ? req.user.id : undefined;
    return this.equipmentLoansService.findAll({
      status,
      search,
      startDate,
      endDate,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      history: false,
      userId: userFilter,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail satu peminjaman beserta daftar item' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentLoansService.findOne(id);
  }

  @Patch(':id/return-items')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Proses pengembalian sebagian/seluruh item peminjaman dengan kondisi alat' })
  returnItems(
    @Param('id', ParseIntPipe) id: number,
    @Body('returnItems') returnItems: { loanItemId: number; returnedQuantity: number; returnCondition?: ReturnCondition }[],
  ) {
    return this.equipmentLoansService.processReturn(id, returnItems);
  }

  @Patch(':id/verify-return')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Tandai semua item sebagai dikembalikan (pengembalian penuh)' })
  verifyReturn(
    @Param('id', ParseIntPipe) id: number,
    @Body('returnCondition') returnCondition?: ReturnCondition,
  ) {
    return this.equipmentLoansService.verifyReturn(id, returnCondition);
  }

  @Patch(':id/restore')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Aktifkan kembali peminjaman yang sudah selesai' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentLoansService.restore(id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Perbarui data peminjaman' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoanDto: UpdateLoanDto,
  ) {
    return this.equipmentLoansService.update(id, updateLoanDto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Hapus catatan peminjaman (soft delete)' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentLoansService.remove(id);
  }
}
