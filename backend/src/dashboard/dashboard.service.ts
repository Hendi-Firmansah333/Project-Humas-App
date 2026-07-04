import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const [totalActivities, totalUsers, totalContentPlans, activeLoans] =
      await Promise.all([
        this.prisma.activity.count(),
        this.prisma.user.count({ where: { status: 'AKTIF' } }),
        this.prisma.contentPlan.count(),
        this.prisma.equipmentLoan.count({ where: { status: 'DIPINJAM' } }),
      ]);

    const recentActivities = await this.prisma.activity.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      include: {
        pic: {
          select: {
            id: true,
            fullName: true,
            username: true,
            roleLabel: true,
            avatar: true,
          },
        },
      },
    });

    const monthlyStats = [
      { month: 'Jan', kegiatan: 12, konten: 8 },
      { month: 'Feb', kegiatan: 19, konten: 14 },
      { month: 'Mar', kegiatan: 15, konten: 22 },
      { month: 'Apr', kegiatan: 28, konten: 18 },
      { month: 'Mei', kegiatan: 34, konten: 29 },
      { month: 'Jun', kegiatan: 24, konten: 19 },
    ];

    return {
      statistics: {
        totalActivities,
        totalUsers,
        totalContentPlans,
        activeLoans,
      },
      recentActivities,
      monthlyStats,
    };
  }
}
