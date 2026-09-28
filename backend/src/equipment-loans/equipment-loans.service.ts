import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLoanDto } from './dto/create-loan.dto';
import { UpdateLoanDto } from './dto/update-loan.dto';
import { LoanStatus, ReturnCondition } from '@prisma/client';

const loanInclude = {
  user: { select: { id: true, fullName: true, username: true } },
  items: {
    include: {
      equipment: {
        select: { id: true, name: true, code: true, category: true },
      },
    },
  },
  activity: {
    select: { id: true, title: true },
  },
};

@Injectable()
export class EquipmentLoansService {
  constructor(private prisma: PrismaService) {}

  // ── Auto-update overdue status ────────────────────────────────────────
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

  // ── Compute overdue days ──────────────────────────────────────────────
  computeOverdueDays(loan: { status: LoanStatus; returnDate: Date }): number {
    if (loan.status !== LoanStatus.TERLAMBAT) return 0;
    const now = new Date();
    const diff = now.getTime() - new Date(loan.returnDate).getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  // ── Compute available stock for an equipment (on-the-fly) ─────────────
  async getAvailableStock(equipmentId: number): Promise<{
    total: number;
    borrowed: number;
    broken: number;
    available: number;
  }> {
    const equipment = await this.prisma.equipment.findFirst({
      where: { id: equipmentId, deletedAt: null },
    });
    if (!equipment) throw new NotFoundException(`Peralatan ID #${equipmentId} tidak ditemukan.`);

    const activeItems = await this.prisma.equipmentLoanItem.findMany({
      where: {
        equipmentId,
        loan: { status: { in: [LoanStatus.SEDANG_DIPINJAM, LoanStatus.TERLAMBAT] }, deletedAt: null },
      },
      select: { quantity: true, returnedQuantity: true },
    });

    const borrowed = activeItems.reduce((sum, item) => sum + (item.quantity - item.returnedQuantity), 0);
    const broken = equipment.broken ?? 0;
    const available = Math.max(0, equipment.total - borrowed - broken);

    return { total: equipment.total, borrowed, broken, available };
  }

  // ── Compute active allocations for an equipment ──────────────────────
  async getActiveAllocations(equipmentId: number) {
    const activeItems = await this.prisma.equipmentLoanItem.findMany({
      where: {
        equipmentId,
        loan: { status: { in: [LoanStatus.SEDANG_DIPINJAM, LoanStatus.TERLAMBAT] }, deletedAt: null },
      },
      include: {
        loan: {
          select: {
            id: true,
            borrowerName: true,
            borrowerPhone: true,
            purpose: true,
            borrowDate: true,
            returnDate: true,
            status: true,
            activity: {
              select: { id: true, title: true, date: true, startTime: true, endTime: true, pic: { select: { id: true, fullName: true } } },
            },
          },
        },
      },
    });

    return activeItems
      .filter((i) => i.quantity - i.returnedQuantity > 0)
      .map((i) => ({
        loanId: i.loan.id,
        activityId: i.loan.activity?.id,
        activityTitle: i.loan.activity?.title || i.loan.purpose || 'Peminjaman Operasional',
        borrowerName: i.loan.borrowerName,
        picName: i.loan.activity?.pic?.fullName || i.loan.borrowerName,
        date: i.loan.activity?.date ? i.loan.activity.date.toISOString().split('T')[0] : i.loan.borrowDate.toISOString().split('T')[0],
        startTime: i.loan.activity?.startTime || '08:00',
        endTime: i.loan.activity?.endTime || '17:00',
        quantity: i.quantity - i.returnedQuantity,
        status: i.loan.status,
      }));
  }

  // ── Compute availability with Time-Conflict Check ─────────────────────
  async checkAvailability(
    dateStr: string,
    startTime = '00:00',
    endTime = '23:59',
    excludeActivityId?: number,
  ) {
    const actDate = new Date(dateStr);
    const startParts = (startTime || '00:00').split(':');
    const endParts = (endTime || '23:59').split(':');

    const targetStart = new Date(actDate);
    targetStart.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);

    const targetEnd = new Date(actDate);
    targetEnd.setHours(parseInt(endParts[0] || '23', 10), parseInt(endParts[1] || '59', 10), 59, 999);

    const equipmentList = await this.prisma.equipment.findMany({
      where: { deletedAt: null, status: 'AKTIF' },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const activeLoans = await this.prisma.equipmentLoan.findMany({
      where: {
        status: { in: [LoanStatus.SEDANG_DIPINJAM, LoanStatus.TERLAMBAT] },
        deletedAt: null,
        ...(excludeActivityId ? { NOT: { activityId: excludeActivityId } } : {}),
      },
      include: {
        activity: {
          select: { id: true, title: true, date: true, startTime: true, endTime: true, pic: { select: { fullName: true } } },
        },
        items: {
          select: { equipmentId: true, quantity: true, returnedQuantity: true },
        },
      },
    });

    return equipmentList.map((eq) => {
      let borrowedInWindow = 0;
      const conflicts: Array<{
        activityId?: number;
        activityTitle?: string;
        picName?: string;
        borrowerName?: string;
        date?: string;
        startTime?: string;
        endTime?: string;
        quantity: number;
      }> = [];

      for (const loan of activeLoans) {
        let loanStart = new Date(loan.borrowDate);
        let loanEnd = new Date(loan.returnDate);

        if (loan.activity) {
          const lDate = new Date(loan.activity.date);
          const lStartParts = (loan.activity.startTime || '08:00').split(':');
          const lEndParts = (loan.activity.endTime || '17:00').split(':');
          loanStart = new Date(lDate);
          loanStart.setHours(parseInt(lStartParts[0] || '0', 10), parseInt(lStartParts[1] || '0', 10), 0, 0);
          loanEnd = new Date(lDate);
          loanEnd.setHours(parseInt(lEndParts[0] || '23', 10), parseInt(lEndParts[1] || '59', 10), 59, 999);
        }

        const hasOverlap = targetStart <= loanEnd && targetEnd >= loanStart;

        if (hasOverlap) {
          const item = loan.items.find((i) => i.equipmentId === eq.id);
          if (item) {
            const remaining = item.quantity - item.returnedQuantity;
            if (remaining > 0) {
              borrowedInWindow += remaining;
              conflicts.push({
                activityId: loan.activity?.id,
                activityTitle: loan.activity?.title || loan.purpose || 'Peminjaman Operasional',
                picName: loan.activity?.pic?.fullName || loan.borrowerName,
                borrowerName: loan.borrowerName,
                date: loan.activity?.date ? loan.activity.date.toISOString().split('T')[0] : loan.borrowDate.toISOString().split('T')[0],
                startTime: loan.activity?.startTime || '08:00',
                endTime: loan.activity?.endTime || '17:00',
                quantity: remaining,
              });
            }
          }
        }
      }

      const broken = eq.broken ?? 0;
      const available = Math.max(0, eq.total - broken - borrowedInWindow);

      return {
        ...eq,
        total: eq.total,
        broken,
        borrowed: borrowedInWindow,
        available,
        conflicts,
      };
    });
  }

  // ── List all equipment with stock status ─────────────────────────────
  async findAllEquipment(search?: string, includeInactive = false) {
    const equipmentList = await this.prisma.equipment.findMany({
      where: {
        deletedAt: null,
        ...(includeInactive ? {} : { status: 'AKTIF' }),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { code: { contains: search, mode: 'insensitive' } },
                { category: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    return Promise.all(
      equipmentList.map(async (eq) => {
        const stock = await this.getAvailableStock(eq.id);
        const activeAllocations = await this.getActiveAllocations(eq.id);
        return { ...eq, ...stock, activeAllocations };
      }),
    );
  }

  // ── Find one equipment ──────────────────────────────────────────────
  async findOneEquipment(id: number) {
    const eq = await this.prisma.equipment.findFirst({ where: { id, deletedAt: null } });
    if (!eq) throw new NotFoundException(`Peralatan ID #${id} tidak ditemukan.`);
    const stock = await this.getAvailableStock(id);
    const activeAllocations = await this.getActiveAllocations(id);
    return { ...eq, ...stock, activeAllocations };
  }

  // ── Create equipment (Admin only) ─────────────────────────────────────
  async createEquipment(dto: {
    name: string;
    code: string;
    category?: string;
    brand?: string;
    serialNumber?: string;
    photoUrl?: string;
    acquisitionDate?: string;
    total?: number;
    storage?: string;
    condition?: string;
    description?: string;
    status?: string;
  }) {
    // Check unique code
    const existing = await this.prisma.equipment.findFirst({ where: { code: dto.code, deletedAt: null } });
    if (existing) throw new BadRequestException('Kode inventaris sudah digunakan.');

    return this.prisma.equipment.create({
      data: {
        name: dto.name,
        code: dto.code,
        category: dto.category ?? 'Kamera & Audio',
        brand: dto.brand,
        serialNumber: dto.serialNumber,
        photoUrl: dto.photoUrl,
        acquisitionDate: dto.acquisitionDate ? new Date(dto.acquisitionDate) : undefined,
        total: dto.total ?? 1,
        storage: dto.storage,
        condition: dto.condition ?? 'BAIK',
        description: dto.description,
        status: dto.status ?? 'AKTIF',
      },
    });
  }

  // ── Update equipment (Admin only) ─────────────────────────────────────
  async updateEquipment(
    id: number,
    dto: {
      name?: string;
      code?: string;
      category?: string;
      brand?: string;
      serialNumber?: string;
      photoUrl?: string;
      acquisitionDate?: string;
      total?: number;
      storage?: string;
      condition?: string;
      description?: string;
      status?: string;
    },
  ) {
    await this.findOneEquipment(id);

    // Check unique code (exclude self)
    if (dto.code) {
      const conflict = await this.prisma.equipment.findFirst({
        where: { code: dto.code, deletedAt: null, NOT: { id } },
      });
      if (conflict) throw new BadRequestException('Kode inventaris sudah digunakan.');
    }

    // Validate total >= currently borrowed
    if (dto.total !== undefined) {
      const stock = await this.getAvailableStock(id);
      if (dto.total < stock.borrowed) {
        throw new BadRequestException(
          `Jumlah alat tidak dapat lebih kecil dari jumlah alat yang sedang dipinjam (${stock.borrowed} unit sedang dipinjam).`,
        );
      }
      if (dto.total < 0) throw new BadRequestException('Total unit tidak boleh negatif.');
    }

    return this.prisma.equipment.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code,
        category: dto.category,
        brand: dto.brand,
        serialNumber: dto.serialNumber,
        photoUrl: dto.photoUrl,
        acquisitionDate: dto.acquisitionDate ? new Date(dto.acquisitionDate) : undefined,
        total: dto.total,
        storage: dto.storage,
        condition: dto.condition,
        description: dto.description,
        status: dto.status,
      },
    });
  }

  // ── Soft-delete equipment (Admin only) ───────────────────────────────
  async removeEquipment(id: number) {
    await this.findOneEquipment(id);
    const stock = await this.getAvailableStock(id);
    if (stock.borrowed > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus alat yang masih dipinjam (${stock.borrowed} unit sedang dipinjam).`,
      );
    }
    return this.prisma.equipment.update({ where: { id }, data: { deletedAt: new Date(), status: 'NONAKTIF' } });
  }

  // ── Create multi-item loan with stock validation ──────────────────────
  async createLoan(dto: CreateLoanDto, userId?: number) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Minimal satu peralatan harus dipilih.');
    }

    // Validate stock for all items
    for (const item of dto.items) {
      const stock = await this.getAvailableStock(item.equipmentId);
      if (item.quantity > stock.available) {
        const eq = await this.prisma.equipment.findUnique({ where: { id: item.equipmentId } });
        throw new BadRequestException(
          `Stok ${eq?.name ?? `ID #${item.equipmentId}`} tidak mencukupi. ` +
            `Tersedia: ${stock.available}, Diminta: ${item.quantity}.`,
        );
      }
    }

    const loan = await this.prisma.equipmentLoan.create({
      data: {
        borrowerName: dto.borrowerName,
        borrowerPhone: dto.borrowerPhone,
        userId: userId ?? null,
        purpose: dto.purpose,
        borrowDate: new Date(dto.borrowDate),
        returnDate: new Date(dto.returnDate),
        status: dto.status ?? LoanStatus.SEDANG_DIPINJAM,
        activityId: dto.activityId ?? null,
        items: {
          create: dto.items.map((i) => ({
            equipmentId: i.equipmentId,
            quantity: i.quantity,
            returnedQuantity: 0,
          })),
        },
      },
      include: loanInclude,
    });

    const itemsList = (loan as any).items || [];
    const itemNames = itemsList.map((i: any) => `${i.equipment?.name ?? 'Alat'} x${i.quantity}`).join(', ');
    await this.prisma.notification.create({
      data: {
        title: 'Peminjaman Alat Baru',
        message: `${dto.borrowerName} meminjam: ${itemNames}.`,
        type: 'INFO',
      },
    });

    return loan;
  }

  // ── Find all loans (active or history) ──────────────────────────────
  async findAll(options?: {
    status?: LoanStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    history?: boolean;
    userId?: number; // filter by borrower userId (for USER role)
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

    if (options?.userId) {
      where.userId = options.userId;
    }

    if (options?.search) {
      where.OR = [
        { borrowerName: { contains: options.search, mode: 'insensitive' as const } },
        { borrowerPhone: { contains: options.search, mode: 'insensitive' as const } },
        { items: { some: { equipment: { name: { contains: options.search, mode: 'insensitive' as const } } } } },
      ];
    }

    const dateFilter: any = {};
    if (options?.startDate) dateFilter.gte = new Date(options.startDate);
    if (options?.endDate) {
      const end = new Date(options.endDate);
      if (options.endDate.length <= 10) end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    if (options?.month || options?.year) {
      const year = options.year || new Date().getFullYear();
      let start: Date, end: Date;
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
    if (Object.keys(dateFilter).length > 0) where.borrowDate = dateFilter;

    const loans = await this.prisma.equipmentLoan.findMany({
      where,
      orderBy: { borrowDate: 'desc' },
      include: loanInclude,
    });

    // Attach computed overdueDays
    return loans.map((loan) => ({
      ...loan,
      overdueDays: this.computeOverdueDays(loan),
    }));
  }

  // ── Find one loan by id ──────────────────────────────────────────────
  async findOne(id: number) {
    await this.syncStatus();
    const loan = await this.prisma.equipmentLoan.findFirst({
      where: { id, deletedAt: null },
      include: loanInclude,
    });
    if (!loan) throw new NotFoundException(`Data peminjaman ID #${id} tidak ditemukan.`);
    return { ...loan, overdueDays: this.computeOverdueDays(loan) };
  }

  // ── Update loan metadata ─────────────────────────────────────────────
  async update(id: number, dto: UpdateLoanDto) {
    await this.findOne(id);

    if (dto.returnItems && dto.returnItems.length > 0) {
      for (const ret of dto.returnItems) {
        const loanItem = await this.prisma.equipmentLoanItem.findFirst({
          where: { id: ret.loanItemId, loanId: id },
        });
        if (!loanItem) {
          throw new NotFoundException(`Item peminjaman ID #${ret.loanItemId} tidak ditemukan.`);
        }
        const newReturned = loanItem.returnedQuantity + ret.returnedQuantity;
        if (newReturned > loanItem.quantity) {
          throw new BadRequestException(
            `Jumlah pengembalian (${newReturned}) melebihi jumlah pinjaman (${loanItem.quantity}).`,
          );
        }

        const condition = (ret.returnCondition as ReturnCondition) ?? ReturnCondition.BAIK;

        await this.prisma.equipmentLoanItem.update({
          where: { id: ret.loanItemId },
          data: {
            returnedQuantity: newReturned,
            returnCondition: condition,
            returnedAt: newReturned >= loanItem.quantity ? new Date() : (loanItem.returnedAt ?? undefined),
          },
        });

        // If returned in broken condition, increment Equipment.broken
        if (condition === ReturnCondition.RUSAK_RINGAN || condition === ReturnCondition.RUSAK_BERAT || condition === ReturnCondition.HILANG) {
          await this.prisma.equipment.update({
            where: { id: loanItem.equipmentId },
            data: { broken: { increment: ret.returnedQuantity } },
          });
        }
      }

      // Check if all items fully returned → auto-close loan
      const allItems = await this.prisma.equipmentLoanItem.findMany({ where: { loanId: id } });
      const allReturned = allItems.every((i) => i.returnedQuantity >= i.quantity);
      if (allReturned) {
        const updated = await this.prisma.equipmentLoan.update({
          where: { id },
          data: { status: LoanStatus.SELESAI, actualReturnDate: new Date() },
          include: loanInclude,
        });
        return { ...updated, overdueDays: 0 };
      }
    }

    let resolvedStatus = dto.status;
    if (dto.returnDate && (!dto.status || dto.status === LoanStatus.SEDANG_DIPINJAM)) {
      resolvedStatus = new Date(dto.returnDate) < new Date() ? LoanStatus.TERLAMBAT : LoanStatus.SEDANG_DIPINJAM;
    }

    const updated = await this.prisma.equipmentLoan.update({
      where: { id },
      data: {
        borrowerName: dto.borrowerName,
        borrowerPhone: dto.borrowerPhone,
        purpose: dto.purpose,
        notes: dto.notes,
        borrowDate: dto.borrowDate ? new Date(dto.borrowDate) : undefined,
        returnDate: dto.returnDate ? new Date(dto.returnDate) : undefined,
        status: resolvedStatus,
      },
      include: loanInclude,
    });
    return { ...updated, overdueDays: this.computeOverdueDays(updated) };
  }

  // ── Verify full return (manually mark SELESAI) ───────────────────────
  async verifyReturn(id: number, returnCondition?: ReturnCondition) {
    await this.findOne(id);
    const items = await this.prisma.equipmentLoanItem.findMany({ where: { loanId: id } });

    for (const item of items) {
      if (item.returnedQuantity < item.quantity) {
        const returnQty = item.quantity - item.returnedQuantity;
        const condition = returnCondition ?? ReturnCondition.BAIK;

        await this.prisma.equipmentLoanItem.update({
          where: { id: item.id },
          data: { returnedQuantity: item.quantity, returnCondition: condition, returnedAt: new Date() },
        });

        // Track broken if applicable
        if (
          condition === ReturnCondition.RUSAK_RINGAN ||
          condition === ReturnCondition.RUSAK_BERAT ||
          condition === ReturnCondition.HILANG
        ) {
          await this.prisma.equipment.update({
            where: { id: item.equipmentId },
            data: { broken: { increment: returnQty } },
          });
        }
      }
    }

    const updated = await this.prisma.equipmentLoan.update({
      where: { id },
      data: { status: LoanStatus.SELESAI, actualReturnDate: new Date() },
      include: loanInclude,
    });
    return { ...updated, overdueDays: 0 };
  }

  // ── Partial return: return specific items ─────────────────────────────
  async processReturn(id: number, returnItems: { loanItemId: number; returnedQuantity: number; returnCondition?: string }[]) {
    return this.update(id, { returnItems } as any);
  }

  // ── Soft delete ───────────────────────────────────────────────────────
  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.equipmentLoan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  // ── Restore soft-deleted ──────────────────────────────────────────────
  async restore(id: number) {
    const loan = await this.prisma.equipmentLoan.findUnique({ where: { id } });
    if (!loan) throw new NotFoundException(`Data peminjaman ID #${id} tidak ditemukan.`);
    return this.prisma.equipmentLoan.update({
      where: { id },
      data: { status: LoanStatus.SEDANG_DIPINJAM, actualReturnDate: null, deletedAt: null },
      include: loanInclude,
    });
  }
}
