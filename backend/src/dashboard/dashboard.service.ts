import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const [totalActivities, totalUsers, totalContentPlans, activeLoans, overdueLoans, pendingContent] =
      await Promise.all([
        this.prisma.activity.count({ where: { deletedAt: null } }),
        this.prisma.user.count({ where: { status: 'AKTIF', deletedAt: null } }),
        this.prisma.contentPlan.count({ where: { deletedAt: null } }),
        this.prisma.equipmentLoan.count({ where: { status: 'SEDANG_DIPINJAM', deletedAt: null } }),
        this.prisma.equipmentLoan.count({ where: { status: 'TERLAMBAT', deletedAt: null } }),
        this.prisma.contentPlan.count({
          where: { deletedAt: null, status: { in: ['PROSES', 'TERENCANA', 'REVISI'] } },
        }),
      ]);

    const recentActivities = await this.prisma.activity.findMany({
      where: { deletedAt: null },
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

    const recentCheckIns = await this.prisma.activityMember.findMany({
      where: { checkInTime: { not: null } },
      take: 5,
      orderBy: { updatedAt: 'desc' },
      include: {
        user: { select: { fullName: true, roleLabel: true } },
        activity: { select: { location: true } },
      },
    });

    const monthlyStats = await this.buildMonthlyStats();

    return {
      statistics: {
        totalActivities,
        totalUsers,
        totalContentPlans,
        activeLoans,
      },
      recentActivities,
      recentCheckIns: recentCheckIns.map((row) => ({
        id: row.id,
        name: row.user.fullName,
        role: row.user.roleLabel,
        location: row.activity.location,
        time: row.checkInTime,
        status: row.checkInStatus === 'SUCCESS' ? 'SUCCESS' : 'MISSED',
      })),
      monthlyStats,
      alerts: {
        pendingContent,
        activeLoans,
        overdueLoans,
      },
    };
  }

  private async buildMonthlyStats() {
    const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const now = new Date();
    const months: { label: string; start: Date; end: Date }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
      months.push({ label: labels[d.getMonth()], start: d, end });
    }

    return Promise.all(
      months.map(async ({ label, start, end }) => {
        const [kegiatan, konten] = await Promise.all([
          this.prisma.activity.count({
            where: { deletedAt: null, date: { gte: start, lte: end } },
          }),
          this.prisma.contentPlan.count({
            where: { deletedAt: null, deadline: { gte: start, lte: end } },
          }),
        ]);
        return { month: label, kegiatan, konten };
      }),
    );
  }
}
