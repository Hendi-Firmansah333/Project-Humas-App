import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanStatus } from '@prisma/client';

@Injectable()
export class EquipmentLoansService {
  constructor(private prisma: PrismaService) {}

  async getEquipmentList() {
    return this.prisma.equipment.findMany();
  }

  async createLoan(dto: CreateLoanDto) {
    return this.prisma.equipmentLoan.create({
      data: {
        equipmentId: dto.equipmentId,
        borrowerId: dto.borrowerId,
        borrowDate: new Date(dto.borrowDate),
        returnDate: new Date(dto.returnDate),
        status: dto.status || LoanStatus.DIPINJAM,
      },
      include: {
        equipment: true,
        borrower: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });
  }

  async findAll(status?: LoanStatus, search?: string) {
    return this.prisma.equipmentLoan.findMany({
      where: {
        status: status || undefined,
        OR: search
          ? [
              { equipment: { name: { contains: search } } },
              { borrower: { fullName: { contains: search } } },
            ]
          : undefined,
      },
      include: {
        equipment: true,
        borrower: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
      orderBy: { borrowDate: 'desc' },
    });
  }

  async findOne(id: number) {
    const loan = await this.prisma.equipmentLoan.findUnique({
      where: { id },
      include: {
        equipment: true,
        borrower: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });

    if (!loan) {
      throw new NotFoundException(`Data peminjaman dengan ID #${id} tidak ditemukan.`);
    }
    return loan;
  }

  async update(id: number, dto: UpdateLoanDto) {
    await this.findOne(id);
    return this.prisma.equipmentLoan.update({
      where: { id },
      data: {
        equipmentId: dto.equipmentId,
        borrowerId: dto.borrowerId,
        borrowDate: dto.borrowDate ? new Date(dto.borrowDate) : undefined,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
        status: dto.status,
      },
      include: {
        equipment: true,
        borrower: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });
  }

  async verifyReturn(id: number) {
    await this.findOne(id);
    return this.prisma.equipmentLoan.update({
      where: { id },
      data: { status: LoanStatus.DIKEMBALIKAN },
      include: {
        equipment: true,
        borrower: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.equipmentLoan.delete({ where: { id } });
    return { message: `Data peminjaman ID #${id} berhasil dihapus.` };
  }
}
