import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary() {
    const [
      // Statistik Kegiatan
      totalActivities,
      upcomingActivities,
      ongoingActivities,
      completedActivities,
      // Statistik Content Plan
      totalContentPlans,
      draftContent,
      processContent,
      publishedContent,
      // Statistik Peminjaman
      totalLoans,
      activeLoans,
      returnedLoans,
      overdueLoans,
      // Statistik Pengguna
      totalUsers,
      adminUsers,
      memberUsers,
      // Lists for display
      recentActivities,
      recentNotifications,
      upcomingActivitiesList,
      upcomingContentPlansList,
      dueLoansList,
      recentCheckIns,
    ] = await Promise.all([
      // Statistik Kegiatan
      this.prisma.activity.count({ where: { deletedAt: null } }),
      this.prisma.activity.count({ where: { status: 'AKAN_DATANG', deletedAt: null } }),
      this.prisma.activity.count({ where: { status: 'SEDANG_BERLANGSUNG', deletedAt: null } }),
      this.prisma.activity.count({ where: { status: 'SELESAI', deletedAt: null } }),

      // Statistik Content Plan
      this.prisma.contentPlan.count({ where: { deletedAt: null } }),
      this.prisma.contentPlan.count({ where: { status: 'DRAFT', deletedAt: null } }),
      this.prisma.contentPlan.count({ where: { status: 'PROSES', deletedAt: null } }),
      this.prisma.contentPlan.count({ where: { status: 'PUBLISHED', deletedAt: null } }),

      // Statistik Peminjaman
      this.prisma.equipmentLoan.count({ where: { deletedAt: null } }),
      this.prisma.equipmentLoan.count({ where: { status: 'SEDANG_DIPINJAM', deletedAt: null } }),
      this.prisma.equipmentLoan.count({ where: { status: 'SELESAI', deletedAt: null } }),
      this.prisma.equipmentLoan.count({ where: { status: 'TERLAMBAT', deletedAt: null } }),

      // Statistik Pengguna
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'ADMIN', deletedAt: null } }),
      this.prisma.user.count({ where: { role: 'USER', deletedAt: null } }),

      // Lists for display
      this.prisma.activity.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { date: 'desc' },
        include: { pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } } },
      }),
      this.prisma.notification.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.findMany({
        where: { status: 'AKAN_DATANG', deletedAt: null },
        take: 5,
        orderBy: { date: 'asc' },
        include: { pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } } },
      }),
      this.prisma.contentPlan.findMany({
        where: { status: { in: ['DRAFT', 'MENUNGGU', 'PROSES', 'REVISI'] }, deletedAt: null },
        take: 5,
        orderBy: { deadline: 'asc' },
        include: { pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } } },
      }),
      this.prisma.equipmentLoan.findMany({
        where: { status: { in: ['SEDANG_DIPINJAM', 'TERLAMBAT'] }, deletedAt: null },
        take: 5,
        orderBy: { returnDate: 'asc' },
      }),
      this.prisma.activityMember.findMany({
        where: { checkInTime: { not: null } },
        take: 5,
        orderBy: { updatedAt: 'desc' },
        include: {
          user: { select: { fullName: true, roleLabel: true } },
          activity: { select: { location: true } },
        },
      }),
    ]);

    const monthlyStats = await this.buildMonthlyStats();

    return {
      statistics: {
        // Kegiatan
        totalActivities,
        upcomingActivities,
        ongoingActivities,
        completedActivities,
        // Content Plan
        totalContentPlans,
        draftContent,
        processContent,
        publishedContent,
        // Peminjaman
        totalLoans,
        activeLoans,
        returnedLoans,
        overdueLoans,
        // Pengguna
        totalUsers,
        adminUsers,
        memberUsers,
      },
      recentActivities,
      recentNotifications,
      upcomingActivitiesList,
      upcomingContentPlansList,
      dueLoansList,
      recentCheckIns: recentCheckIns.map((row) => ({
        id: row.id,
        name: row.user.fullName,
        role: row.user.roleLabel,
        location: row.activity.location,
        time: row.checkInTime,
        status: row.checkInStatus === 'SUCCESS' ? 'SUCCESS' : 'MISSED',
      })),
      monthlyStats,
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
