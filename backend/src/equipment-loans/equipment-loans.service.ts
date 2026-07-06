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
    await this.prisma.equipmentLoan.updateMany({
      where: {
        status: LoanStatus.SEDANG_DIPINJAM,
        returnDate: { lt: new Date() },
      },
      data: { status: LoanStatus.TERLAMBAT },
    });
  }

  async createLoan(dto: CreateLoanDto) {
    return this.prisma.equipmentLoan.create({
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
  }

  async findAll(status?: LoanStatus, search?: string) {
    await this.syncStatus();

    return this.prisma.equipmentLoan.findMany({
      where: {
        status: status || undefined,
        OR: search
          ? [
              { equipmentName: { contains: search, mode: 'insensitive' } },
              { borrowerName: { contains: search, mode: 'insensitive' } },
              { borrowerPhone: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: { borrowDate: 'desc' },
    });
  }

  async findOne(id: number) {
    await this.syncStatus();

    const loan = await this.prisma.equipmentLoan.findUnique({
      where: { id },
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
    await this.prisma.equipmentLoan.delete({ where: { id } });
    return { message: `Data peminjaman ID #${id} berhasil dihapus.` };
  }
}
