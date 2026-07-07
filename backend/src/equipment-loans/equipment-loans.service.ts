import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class EquipmentLoansService {
  constructor(private prisma: PrismaService) {}

  // Auto-update status for overdue items
  private async syncStatus() {
    const overdueLoans = await this.prisma.equipmentLoan.findMany({
      where: {
        status: LoanStatus.SEDANG_DIPINJAM,
        returnDate: { lt: new Date() },
        deletedAt: null,
      },
    });

    for (const loan of overdueLoans) {
      await this.prisma.equipmentLoan.update({
        where: { id: loan.id },
        data: { status: LoanStatus.TERLAMBAT },
      });

      await this.prisma.notification.create({
        data: {
          title: 'Peminjaman Terlambat',
          message: `Peminjaman alat oleh ${loan.borrowerName} telah melewati batas pengembalian!`,
          type: 'ALERT',
        },
      });
    }
  }

  async createLoan(dto: CreateLoanDto) {
    const loan = await this.prisma.equipmentLoan.create({
      data: {
        borrowerName: dto.borrowerName,
        borrowerPhone: dto.borrowerPhone,
        equipmentName: dto.equipmentName,
        purpose: dto.purpose,
        borrowDate: new Date(dto.borrowDate),
        returnDate: new Date(dto.returnDate),
        status: dto.status || LoanStatus.SEDANG_DIPINJAM,
      },
    });

    await this.prisma.notification.create({
      data: {
        title: 'Peminjaman Alat Baru',
        message: `Peminjam ${dto.borrowerName} meminjam peralatan: ${dto.equipmentName}.`,
        type: 'INFO',
      },
    });

    return loan;
  }

  async findAll(options?: {
    status?: LoanStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    history?: boolean;
  }) {
    await this.syncStatus();

    const statusFilter = options?.status
      ? { status: options.status }
      : options?.history
        ? { status: LoanStatus.SELESAI }
        : { status: { in: [LoanStatus.SEDANG_DIPINJAM, LoanStatus.TERLAMBAT] } };

    const where: any = {
      deletedAt: null,
      ...statusFilter,
    };

    if (options?.search) {
      where.OR = [
        { equipmentName: { contains: options.search, mode: 'insensitive' as const } },
        { borrowerName: { contains: options.search, mode: 'insensitive' as const } },
        { borrowerPhone: { contains: options.search, mode: 'insensitive' as const } },
      ];
    }

    const dateFilter: any = {};
    if (options?.startDate) {
      dateFilter.gte = new Date(options.startDate);
    }
    if (options?.endDate) {
      const end = new Date(options.endDate);
      if (options.endDate.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
      dateFilter.lte = end;
    }

    if (options?.month || options?.year) {
      const year = options.year || new Date().getFullYear();
      let start: Date;
      let end: Date;
      if (options.month) {
        start = new Date(year, options.month - 1, 1);
        end = new Date(year, options.month, 0, 23, 59, 59, 999);
      } else {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59, 999);
      }
      dateFilter.gte = start;
      dateFilter.lte = end;
    }

    if (Object.keys(dateFilter).length > 0) {
      where.borrowDate = dateFilter;
    }

    return this.prisma.equipmentLoan.findMany({
      where,
      orderBy: { borrowDate: 'desc' },
    });
  }

  async findOne(id: number) {
    await this.syncStatus();

    const loan = await this.prisma.equipmentLoan.findFirst({
      where: { id, deletedAt: null },
    });

    if (!loan) {
      throw new NotFoundException(`Data peminjaman dengan ID #${id} tidak ditemukan.`);
    }
    return loan;
  }

  async update(id: number, dto: UpdateLoanDto) {
    await this.findOne(id); // Ensure it exists and syncs
    
    // Check if we need to auto-update status based on the new dates
    let currentStatus = dto.status;
    if (dto.returnDate && (!dto.status || dto.status === LoanStatus.SEDANG_DIPINJAM)) {
      if (new Date(dto.returnDate) < new Date()) {
        currentStatus = LoanStatus.TERLAMBAT;
      } else {
        currentStatus = LoanStatus.SEDANG_DIPINJAM;
      }
    }

    return this.prisma.equipmentLoan.update({
      where: { id },
      data: {
        borrowerName: dto.borrowerName,
        borrowerPhone: dto.borrowerPhone,
        equipmentName: dto.equipmentName,
        purpose: dto.purpose,
        borrowDate: dto.borrowDate ? new Date(dto.borrowDate) : undefined,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
        status: currentStatus,
      },
    });
  }

  async verifyReturn(id: number) {
    await this.findOne(id);
    return this.prisma.equipmentLoan.update({
      where: { id },
      data: { 
        status: LoanStatus.SELESAI,
        actualReturnDate: new Date()
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    // Soft delete to prevent data loss in riwayat
    return this.prisma.equipmentLoan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async restore(id: number) {
    // We should be able to restore soft-deleted items too, so use findUnique instead of findOne which filters deletedAt
    const loan = await this.prisma.equipmentLoan.findUnique({ where: { id } });
    if (!loan) {
      throw new NotFoundException(`Data peminjaman dengan ID #${id} tidak ditemukan.`);
    }
    return this.prisma.equipmentLoan.update({
      where: { id },
      data: { status: LoanStatus.SEDANG_DIPINJAM, actualReturnDate: null, deletedAt: null },
    });
  }
}
