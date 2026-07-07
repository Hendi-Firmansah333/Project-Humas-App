import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private buildDateFilter(query: { startDate?: string; endDate?: string; month?: number; year?: number }) {
    const dateFilter: any = {};
    if (query.startDate) {
      dateFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      if (query.endDate.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
      dateFilter.lte = end;
    }

    if (query.month || query.year) {
      const year = query.year || new Date().getFullYear();
      let start: Date;
      let end: Date;
      if (query.month) {
        start = new Date(year, query.month - 1, 1);
        end = new Date(year, query.month, 0, 23, 59, 59, 999);
      } else {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59, 999);
      }
      dateFilter.gte = start;
      dateFilter.lte = end;
    }

    return Object.keys(dateFilter).length > 0 ? dateFilter : undefined;
  }

  async getActivityReport(query: { startDate?: string; endDate?: string; month?: number; year?: number }) {
    const dateFilter = this.buildDateFilter(query);
    return this.prisma.activity.findMany({
      where: {
        deletedAt: null,
        date: dateFilter,
      },
      include: {
        pic: { select: { fullName: true } },
        members: {
          include: { user: { select: { fullName: true } } },
        },
      },
      orderBy: { date: 'asc' },
    });
  }

  async getContentPlanReport(query: { startDate?: string; endDate?: string; month?: number; year?: number }) {
    const dateFilter = this.buildDateFilter(query);
    return this.prisma.contentPlan.findMany({
      where: {
        deletedAt: null,
        deadline: dateFilter,
      },
      include: {
        pic: { select: { fullName: true } },
      },
      orderBy: { deadline: 'asc' },
    });
  }

  async getLoanReport(query: { startDate?: string; endDate?: string; month?: number; year?: number }) {
    const dateFilter = this.buildDateFilter(query);
    return this.prisma.equipmentLoan.findMany({
      where: {
        deletedAt: null,
        borrowDate: dateFilter,
      },
      orderBy: { borrowDate: 'asc' },
    });
  }

  async getUserReport(query: { startDate?: string; endDate?: string; month?: number; year?: number }) {
    const dateFilter = this.buildDateFilter(query);
    return this.prisma.user.findMany({
      where: {
        deletedAt: null,
        joinedAt: dateFilter,
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  /**
   * Evaluasi Pengguna — hitung performa setiap anggota (role USER) dalam periode tertentu.
   * Formula Nilai Kinerja: 60% kehadiran + 25% dokumentasi + 15% content plan
   */
  async getUserEvaluation(query: { startDate?: string; endDate?: string; month?: number; year?: number }) {
    const dateFilter = this.buildDateFilter(query);

    // Ambil semua pengguna dengan role USER
    const users = await this.prisma.user.findMany({
      where: { deletedAt: null, role: 'USER' },
      orderBy: { fullName: 'asc' },
    });

    const results = await Promise.all(
      users.map(async (user) => {
        // Total kegiatan yang diikuti
        const totalKegiatan = await this.prisma.activityMember.count({
          where: {
            userId: user.id,
            activity: {
              deletedAt: null,
              date: dateFilter,
            },
          },
        });

        // Total check-in berhasil
        const totalCheckin = await this.prisma.activityMember.count({
          where: {
            userId: user.id,
            checkInStatus: { in: ['SUCCESS', 'TERLAMBAT'] },
            activity: {
              deletedAt: null,
              date: dateFilter,
            },
          },
        });

        // Total check-in tepat waktu
        const totalTepatWaktu = await this.prisma.activityMember.count({
          where: {
            userId: user.id,
            checkInStatus: 'SUCCESS',
            activity: {
              deletedAt: null,
              date: dateFilter,
            },
          },
        });

        // Total check-in terlambat
        const totalTerlambat = await this.prisma.activityMember.count({
          where: {
            userId: user.id,
            checkInStatus: 'TERLAMBAT',
            activity: {
              deletedAt: null,
              date: dateFilter,
            },
          },
        });

        // Total upload dokumentasi
        const totalDokumentasi = await this.prisma.media.count({
          where: {
            uploaderId: user.id,
            deletedAt: null,
            activityId: { not: null },
            activity: dateFilter ? { date: dateFilter } : undefined,
          },
        });

        // Total content plan sebagai PIC
        const totalContentPlan = await this.prisma.contentPlan.count({
          where: {
            picId: user.id,
            deletedAt: null,
            deadline: dateFilter,
          },
        });

        // Total peminjaman alat (borrower name matches — best effort since loan doesn't link to user)
        // Gunakan pengecekan nama
        const totalPeminjaman = await this.prisma.equipmentLoan.count({
          where: {
            borrowerName: { contains: user.fullName, mode: 'insensitive' },
            deletedAt: null,
            borrowDate: dateFilter,
          },
        });

        // Persentase kehadiran
        const persenKehadiran = totalKegiatan > 0 ? Math.round((totalCheckin / totalKegiatan) * 100) : 0;

        // Nilai Kinerja: 60% kehadiran + 25% dokumentasi (max 5 doc = 100%) + 15% content plan (max 5 = 100%)
        const nilaiKehadiran = persenKehadiran * 0.6;
        const nilaiDokumentasi = Math.min(totalDokumentasi / 5, 1) * 100 * 0.25;
        const nilaiContentPlan = Math.min(totalContentPlan / 5, 1) * 100 * 0.15;
        const nilaiKinerja = Math.round(nilaiKehadiran + nilaiDokumentasi + nilaiContentPlan);

        return {
          id: user.id,
          fullName: user.fullName,
          username: user.username,
          avatar: user.avatar,
          roleLabel: user.roleLabel,
          totalKegiatan,
          totalCheckin,
          totalTepatWaktu,
          totalTerlambat,
          persenKehadiran,
          totalDokumentasi,
          totalContentPlan,
          totalPeminjaman,
          nilaiKinerja,
        };
      }),
    );

    // Sort by nilai kinerja descending
    results.sort((a, b) => b.nilaiKinerja - a.nilaiKinerja);

    return results;
  }

  async create(dto: CreateReportDto) {
    return this.prisma.report.create({
      data: {
        title: dto.title,
        category: dto.category || 'Kegiatan',
        date: new Date(dto.date),
        picId: dto.picId,
        status: dto.status || 'Selesai',
      },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });
  }

  async findAll(category?: string, search?: string) {
    return this.prisma.report.findMany({
      where: {
        category: category || undefined,
        OR: search
          ? [
              { title: { contains: search } },
              { pic: { fullName: { contains: search } } },
            ]
          : undefined,
      },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });

    if (!report) {
      throw new NotFoundException(`Laporan dengan ID #${id} tidak ditemukan.`);
    }
    return report;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.report.delete({ where: { id } });
    return { message: `Laporan ID #${id} berhasil dihapus.` };
  }
}
