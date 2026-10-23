import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityStatus, ContentStatus, LoanStatus, Role } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardSummary(userId: number, userRole: Role) {
    // ── 1. Unread Notifications Count for Current User ──
    const unreadNotificationsCount = await this.prisma.notification.count({
      where: {
        deletedAt: null,
        isRead: false,
        OR: [{ userId }, { userId: null }],
      },
    });

    // ── 2. User-specific Dashboard View for TIM HUMAS (Role: USER) ──
    if (userRole === Role.USER) {
      const [
        myAssignedActivitiesCount,
        myPendingCheckInsCount,
        myAssignedContentPlansCount,
        myUpcomingActivities,
        myContentPlans,
        myRecentNotifications,
      ] = await Promise.all([
        this.prisma.activityMember.count({
          where: { userId, activity: { deletedAt: null } },
        }),
        this.prisma.activityMember.count({
          where: {
            userId,
            checkInTime: null,
            activity: {
              deletedAt: null,
              status: { in: [ActivityStatus.DITUGASKAN, ActivityStatus.SEDANG_BERLANGSUNG] },
            },
          },
        }),
        this.prisma.contentPlan.count({
          where: { picId: userId, deletedAt: null },
        }),
        this.prisma.activity.findMany({
          where: {
            deletedAt: null,
            members: { some: { userId } },
            status: { in: [ActivityStatus.DISETUJUI, ActivityStatus.DITUGASKAN, ActivityStatus.SEDANG_BERLANGSUNG] },
          },
          take: 5,
          orderBy: { date: 'asc' },
          include: { pic: { select: { id: true, fullName: true, roleLabel: true } } },
        }),
        this.prisma.contentPlan.findMany({
          where: { picId: userId, deletedAt: null },
          take: 5,
          orderBy: { deadline: 'asc' },
        }),
        this.prisma.notification.findMany({
          where: { deletedAt: null, OR: [{ userId }, { userId: null }] },
          take: 5,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      // Calculate action items for Tim Humas (USER)
      const upcomingCount = await this.prisma.activity.count({
        where: {
          deletedAt: null,
          OR: [{ picId: userId }, { members: { some: { userId } } }],
          status: { in: [ActivityStatus.DITUGASKAN, ActivityStatus.AKAN_DATANG] },
        },
      });
      const ongoingCount = await this.prisma.activity.count({
        where: {
          deletedAt: null,
          OR: [{ picId: userId }, { members: { some: { userId } } }],
          status: ActivityStatus.SEDANG_BERLANGSUNG,
        },
      });
      const overdueActivitiesWithoutDoc = await this.prisma.activity.findMany({
        where: {
          deletedAt: null,
          OR: [{ picId: userId }, { members: { some: { userId } } }],
          date: { lt: new Date() },
          status: { notIn: [ActivityStatus.SELESAI, ActivityStatus.DITOLAK, ActivityStatus.DIBATALKAN] },
        },
        include: {
          media: { where: { fileType: 'application/link', deletedAt: null } }
        }
      });
      const pendingDocCount = overdueActivitiesWithoutDoc.filter(act => act.media.length === 0).length;

      const userObj = await this.prisma.user.findUnique({ where: { id: userId } });
      const activeBorrowingsCount = await this.prisma.equipmentLoan.count({
        where: {
          borrowerName: userObj?.fullName || '',
          status: { not: 'SELESAI' },
          deletedAt: null,
        },
      });

      const actionItems = [
        { id: 'kegiatan-mendatang', label: 'Kegiatan Mendatang', count: upcomingCount, link: '/kegiatan' },
        { id: 'kegiatan-aktif', label: 'Kegiatan Sedang Berlangsung', count: ongoingCount, link: '/kegiatan' },
        { id: 'dokumentasi-kurang', label: 'Dokumentasi Belum Lengkap', count: pendingDocCount, link: '/kegiatan' },
        { id: 'pinjam-aktif', label: 'Peminjaman Alat Aktif', count: activeBorrowingsCount, link: '/peminjaman-alat' },
      ];

      return {
        role: userRole,
        statistics: {
          myAssignedActivitiesCount,
          myPendingCheckInsCount,
          myAssignedContentPlansCount,
          unreadNotificationsCount,
        },
        upcomingActivitiesList: myUpcomingActivities,
        upcomingContentPlansList: myContentPlans,
        recentNotifications: myRecentNotifications,
        actionItems,
      };
    }

    // ── 3. Operational / Management Dashboard View (SUPER_ADMIN & ADMIN) ──
    const [
      // Kegiatan Breakdown by Status
      totalActivities,
      pendingApprovalActivities,
      approvedActivities,
      assignedActivities,
      ongoingActivities,
      pendingVerificationActivities,
      completedActivities,
      rejectedActivities,

      // Content Plan Breakdown by Status
      totalContentPlans,
      draftContent,
      waitingContent,
      processContent,
      revisionContent,
      publishedContent,
      completedContent,
      canceledContent,

      // Peminjaman Breakdown by Status
      totalLoans,
      activeLoans,
      overdueLoans,
      completedLoans,

      // Inventaris Stats
      totalEquipmentTypes,
      equipmentAggregation,
      activeLoanItems,

      // Pengguna Breakdown by Role
      totalUsers,
      superAdminUsers,
      adminUsers,
      timHumasUsers,

      // Lists & Activity Feeds
      recentActivities,
      recentNotifications,
      upcomingActivitiesList,
      upcomingContentPlansList,
      dueLoansList,
      recentAuditLogs,
    ] = await Promise.all([
      // Kegiatan Statuses
      this.prisma.activity.count({ where: { deletedAt: null } }),
      this.prisma.activity.count({ where: { status: ActivityStatus.MENUNGGU_PERSETUJUAN, deletedAt: null } }),
      this.prisma.activity.count({ where: { status: ActivityStatus.DISETUJUI, deletedAt: null } }),
      this.prisma.activity.count({ where: { status: ActivityStatus.DITUGASKAN, deletedAt: null } }),
      this.prisma.activity.count({ where: { status: ActivityStatus.SEDANG_BERLANGSUNG, deletedAt: null } }),
      this.prisma.activity.count({ where: { status: ActivityStatus.MENUNGGU_VERIFIKASI, deletedAt: null } }),
      this.prisma.activity.count({ where: { status: ActivityStatus.SELESAI, deletedAt: null } }),
      this.prisma.activity.count({ where: { status: ActivityStatus.DITOLAK, deletedAt: null } }),

      // Content Plan Statuses
      this.prisma.contentPlan.count({ where: { deletedAt: null } }),
      this.prisma.contentPlan.count({ where: { status: ContentStatus.DRAFT, deletedAt: null } }),
      this.prisma.contentPlan.count({ where: { status: ContentStatus.MENUNGGU, deletedAt: null } }),
      this.prisma.contentPlan.count({ where: { status: ContentStatus.PROSES, deletedAt: null } }),
      this.prisma.contentPlan.count({ where: { status: ContentStatus.REVISI, deletedAt: null } }),
      this.prisma.contentPlan.count({ where: { status: ContentStatus.PUBLISHED, deletedAt: null } }),
      this.prisma.contentPlan.count({ where: { status: ContentStatus.SELESAI, deletedAt: null } }),
      this.prisma.contentPlan.count({ where: { status: ContentStatus.DIBATALKAN, deletedAt: null } }),

      // Loan Statuses
      this.prisma.equipmentLoan.count({ where: { deletedAt: null } }),
      this.prisma.equipmentLoan.count({ where: { status: LoanStatus.SEDANG_DIPINJAM, deletedAt: null } }),
      this.prisma.equipmentLoan.count({ where: { status: LoanStatus.TERLAMBAT, deletedAt: null } }),
      this.prisma.equipmentLoan.count({ where: { status: LoanStatus.SELESAI, deletedAt: null } }),

      // Inventaris
      this.prisma.equipment.count({ where: { deletedAt: null } }),
      this.prisma.equipment.aggregate({
        where: { deletedAt: null },
        _sum: { total: true, broken: true },
      }),
      this.prisma.equipmentLoanItem.findMany({
        where: {
          loan: {
            status: { in: [LoanStatus.SEDANG_DIPINJAM, LoanStatus.TERLAMBAT] },
            deletedAt: null,
          },
        },
        select: { quantity: true, returnedQuantity: true },
      }),

      // User Roles
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { role: Role.SUPER_ADMIN, deletedAt: null } }),
      this.prisma.user.count({ where: { role: Role.ADMIN, deletedAt: null } }),
      this.prisma.user.count({ where: { role: Role.USER, deletedAt: null } }),

      // Recent Lists
      this.prisma.activity.findMany({
        where: { deletedAt: null },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } } },
      }),
      this.prisma.notification.findMany({
        where: { deletedAt: null, OR: [{ userId }, { userId: null }] },
        take: 5,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.activity.findMany({
        where: { status: { in: [ActivityStatus.DISETUJUI, ActivityStatus.DITUGASKAN, ActivityStatus.SEDANG_BERLANGSUNG] }, deletedAt: null },
        take: 5,
        orderBy: { date: 'asc' },
        include: { pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } } },
      }),
      this.prisma.contentPlan.findMany({
        where: { status: { in: [ContentStatus.DRAFT, ContentStatus.MENUNGGU, ContentStatus.PROSES, ContentStatus.REVISI] }, deletedAt: null },
        take: 5,
        orderBy: { deadline: 'asc' },
        include: { pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } } },
      }),
      this.prisma.equipmentLoan.findMany({
        where: { status: { in: [LoanStatus.SEDANG_DIPINJAM, LoanStatus.TERLAMBAT] }, deletedAt: null },
        take: 5,
        orderBy: { borrowDate: 'desc' },
      }),
      this.prisma.auditLog.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: { select: { fullName: true, roleLabel: true } } },
      }),
    ]);

    const totalUnits = equipmentAggregation._sum?.total || 0;
    const brokenUnits = equipmentAggregation._sum?.broken || 0;
    const unitsBorrowed = activeLoanItems.reduce(
      (sum, item) => sum + Math.max(0, item.quantity - (item.returnedQuantity || 0)),
      0,
    );
    const unitsAvailable = Math.max(0, totalUnits - brokenUnits - unitsBorrowed);

    const monthlyStats = await this.buildMonthlyStats();

    // Compile action items for SUPER_ADMIN or ADMIN
    let actionItems: any[] = [];
    if (userRole === Role.SUPER_ADMIN) {
      const pendingLettersCount = await this.prisma.incomingLetter.count({
        where: { status: { in: ['MENUNGGU_PERSETUJUAN', 'BARU'] }, deletedAt: null },
      });
      const pendingAssignmentCount = await this.prisma.activity.count({
        where: { status: ActivityStatus.DISETUJUI, deletedAt: null },
      });
      const pendingFinalApprovalCount = await this.prisma.activity.count({
        where: { status: ActivityStatus.MENUNGGU_PERSETUJUAN_AKHIR, deletedAt: null },
      });
      const attentionActivitiesCount = await this.prisma.activity.count({
        where: { status: ActivityStatus.DIKEMBALIKAN, deletedAt: null },
      });

      actionItems = [
        { id: 'surat-approval', label: 'Surat Menunggu Persetujuan', count: pendingLettersCount, link: '/persetujuan' },
        { id: 'kegiatan-penugasan', label: 'Kegiatan Menunggu Penugasan', count: pendingAssignmentCount, link: '/persetujuan' },
        { id: 'kegiatan-final-approval', label: 'Kegiatan Menunggu Persetujuan Akhir', count: pendingFinalApprovalCount, link: '/persetujuan' },
        { id: 'kegiatan-perhatian', label: 'Kegiatan Perlu Perhatian', count: attentionActivitiesCount, link: '/persetujuan' },
      ];
    } else if (userRole === Role.ADMIN) {
      const newLettersCount = await this.prisma.incomingLetter.count({
        where: { status: { in: ['MENUNGGU_PERSETUJUAN', 'BARU'] }, deletedAt: null },
      });
      const pendingVerificationCount = await this.prisma.activity.count({
        where: { status: ActivityStatus.MENUNGGU_VERIFIKASI, deletedAt: null },
      });
      const overdueLoansCount = await this.prisma.equipmentLoan.count({
        where: { status: LoanStatus.TERLAMBAT, deletedAt: null },
      });
      const brokenEquipmentCount = await this.prisma.equipment.count({
        where: { broken: { gt: 0 }, deletedAt: null },
      });

      actionItems = [
        { id: 'surat-baru', label: 'Surat Baru', count: newLettersCount, link: '/surat-masuk' },
        { id: 'kegiatan-verifikasi', label: 'Kegiatan Menunggu Verifikasi', count: pendingVerificationCount, link: '/verifikasi-kegiatan' },
        { id: 'peminjaman-terlambat', label: 'Peminjaman Terlambat', count: overdueLoansCount, link: '/peminjaman-alat' },
        { id: 'inventaris-rusak', label: 'Inventaris Perlu Diperbarui', count: brokenEquipmentCount, link: '/peminjaman-alat' },
      ];
    }

    return {
      role: userRole,
      statistics: {
        // Kegiatan
        totalActivities,
        activeActivities: assignedActivities + ongoingActivities,
        pendingApprovalActivities,
        approvedActivities,
        assignedActivities,
        ongoingActivities,
        pendingVerificationActivities,
        completedActivities,
        rejectedActivities,

        // Content Plan
        totalContentPlans,
        activeContentPlans: draftContent + waitingContent + processContent + revisionContent,
        historyContentPlans: publishedContent + completedContent + canceledContent,
        draftContent,
        waitingContent,
        processContent,
        revisionContent,
        publishedContent,
        completedContent,
        canceledContent,

        // Peminjaman
        totalLoans,
        activeLoans,
        overdueLoans,
        completedLoans,

        // Inventaris
        totalEquipmentTypes,
        totalEquipmentUnits: totalUnits,
        unitsBorrowed,
        unitsAvailable,

        // Pengguna
        totalUsers,
        superAdminUsers,
        adminUsers,
        timHumasUsers,

        // Notifikasi
        unreadNotificationsCount,
      },
      recentActivities,
      recentNotifications,
      upcomingActivitiesList,
      upcomingContentPlansList,
      dueLoansList,
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        user: log.user?.fullName || 'Sistem',
        action: log.action,
        entity: log.entity,
        createdAt: log.createdAt,
      })),
      monthlyStats,
      actionItems,
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
        const [kegiatan, konten, peminjaman] = await Promise.all([
          this.prisma.activity.count({
            where: { deletedAt: null, date: { gte: start, lte: end } },
          }),
          this.prisma.contentPlan.count({
            where: { deletedAt: null, deadline: { gte: start, lte: end } },
          }),
          this.prisma.equipmentLoan.count({
            where: { deletedAt: null, borrowDate: { gte: start, lte: end } },
          }),
        ]);
        return { month: label, kegiatan, konten, peminjaman };
      }),
    );
  }
}
