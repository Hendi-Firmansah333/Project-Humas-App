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
import { EquipmentLoansService } from './equipment-loans.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { AuthGuard } from '@nestjs/passport';
import { LoanStatus } from '@prisma/client';

@ApiTags('Equipment Loans')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'))
@Controller('api/equipment-loans')
export class EquipmentLoansController {
  constructor(private readonly equipmentLoansService: EquipmentLoansService) {}

  @Post()
  @ApiOperation({ summary: 'Catat peminjaman alat baru' })
  create(@Body() createLoanDto: CreateLoanDto) {
    return this.equipmentLoansService.createLoan(createLoanDto);
  }

  @Get('history')
  @ApiOperation({ summary: 'Daftar riwayat peminjaman peralatan' })
  @ApiQuery({ name: 'status', enum: LoanStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  findHistory(
    @Query('status') status?: LoanStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.equipmentLoansService.findAll({
      status,
      search,
      startDate,
      endDate,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      history: true,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Daftar peminjaman peralatan aktif' })
  @ApiQuery({ name: 'status', enum: LoanStatus, required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiQuery({ name: 'year', required: false })
  findAll(
    @Query('status') status?: LoanStatus,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('month') month?: number,
    @Query('year') year?: number,
  ) {
    return this.equipmentLoansService.findAll({
      status,
      search,
      startDate,
      endDate,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      history: false,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail peminjaman inventaris' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentLoansService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Perbarui data peminjaman' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLoanDto: UpdateLoanDto,
  ) {
    return this.equipmentLoansService.update(id, updateLoanDto);
  }

  @Patch(':id/verify-return')
  @ApiOperation({ summary: 'Verifikasi pengembalian alat' })
  verifyReturn(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentLoansService.verifyReturn(id);
  }

  @Patch(':id/restore')
  @ApiOperation({ summary: 'Mengaktifkan kembali peminjaman alat yang sudah selesai' })
  restore(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentLoansService.restore(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Hapus catatan peminjaman' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.equipmentLoansService.remove(id);
  }
}
