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
            status: { notIn: [ActivityStatus.DITOLAK, ActivityStatus.DIBATALKAN] },
          },
          take: 10,
          orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
          include: {
            pic: { select: { id: true, fullName: true, roleLabel: true } },
            members: {
              include: {
                user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
              },
            },
            loans: {
              where: { deletedAt: null },
              include: { items: { include: { equipment: { select: { name: true } } } } },
            },
          },
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
        todaySchedules: await this.prisma.dutySchedule.findMany({
          where: { deletedAt: null },
          take: 6,
          include: { user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } } },
          orderBy: { date: 'desc' },
        }),
        actionItems,
        agendaAnalytics: await this.getAgendaAnalytics('3m'),
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
      this.prisma.activity.count({
        where: {
          status: {
            in: [
              ActivityStatus.MENUNGGU_PERSETUJUAN,
              ActivityStatus.MENUNGGU_PERSETUJUAN_AKHIR,
              ActivityStatus.MENUNGGU_VERIFIKASI,
            ],
          },
          deletedAt: null,
        },
      }),
      this.prisma.activity.count({ where: { status: ActivityStatus.DISETUJUI, deletedAt: null } }),
      this.prisma.activity.count({ where: { status: ActivityStatus.DITUGASKAN, deletedAt: null } }),
      this.prisma.activity.count({ where: { status: ActivityStatus.SEDANG_BERLANGSUNG, deletedAt: null } }),
      this.prisma.activity.count({ where: { status: ActivityStatus.MENUNGGU_PERSETUJUAN_AKHIR, deletedAt: null } }),
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
        where: {
          deletedAt: null,
          status: {
            notIn: [ActivityStatus.DITOLAK, ActivityStatus.DIBATALKAN],
          },
        },
        take: 10,
        orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
        include: {
          pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
          members: {
            include: {
              user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
            },
          },
          loans: {
            where: { deletedAt: null },
            include: { items: { include: { equipment: { select: { name: true } } } } },
          },
        },
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
        where: { status: { in: [ActivityStatus.MENUNGGU_PERSETUJUAN_AKHIR, ActivityStatus.MENUNGGU_VERIFIKASI] }, deletedAt: null },
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
      const overdueLoansCount = await this.prisma.equipmentLoan.count({
        where: { status: LoanStatus.TERLAMBAT, deletedAt: null },
      });
      const brokenEquipmentCount = await this.prisma.equipment.count({
        where: { broken: { gt: 0 }, deletedAt: null },
      });

      actionItems = [
        { id: 'surat-baru', label: 'Surat Baru', count: newLettersCount, link: '/surat-masuk' },
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
      todaySchedules: await (async () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        const scheds = await this.prisma.dutySchedule.findMany({
          where: { date: { gte: start, lte: end }, deletedAt: null },
          include: { user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } } },
          orderBy: { startTime: 'asc' },
        });
        if (scheds.length > 0) return scheds;
        return this.prisma.dutySchedule.findMany({
          where: { deletedAt: null },
          take: 6,
          include: { user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } } },
          orderBy: { date: 'desc' },
        });
      })(),
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        user: log.user?.fullName || 'Sistem',
        action: log.action,
        entity: log.entity,
        createdAt: log.createdAt,
      })),
      monthlyStats,
      actionItems,
      agendaAnalytics: await this.getAgendaAnalytics('3m'),
    };
  }

  async getAgendaAnalytics(period: string = '3m') {
    const fullMonthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
    ];
    const shortMonthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
    ];

    const now = new Date();
    let startDate: Date | null = null;
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    if (period === '3m') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0, 0);
    } else if (period === '6m') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0, 0);
    } else if (period === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    }

    const activities = await this.prisma.activity.findMany({
      where: {
        deletedAt: null,
        status: { notIn: [ActivityStatus.DITOLAK, ActivityStatus.DIBATALKAN] },
        ...(startDate ? { date: { gte: startDate, lte: endDate } } : {}),
      },
      select: {
        id: true,
        category: true,
        date: true,
        suratId: true,
      },
      orderBy: { date: 'asc' },
    });

    // Build ordered list of months in the selected period
    const monthBuckets: Array<{ year: number; monthIdx: number; label: string; shortLabel: string }> = [];
    if (period === '3m' || period === '6m') {
      const count = period === '3m' ? 3 : 6;
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        monthBuckets.push({
          year: d.getFullYear(),
          monthIdx: d.getMonth(),
          label: fullMonthNames[d.getMonth()],
          shortLabel: shortMonthNames[d.getMonth()],
        });
      }
    } else if (period === 'year') {
      for (let m = 0; m <= now.getMonth(); m++) {
        monthBuckets.push({
          year: now.getFullYear(),
          monthIdx: m,
          label: fullMonthNames[m],
          shortLabel: shortMonthNames[m],
        });
      }
    } else {
      // 'all': collect distinct year-month from activities, or fallback to last 3 months
      if (activities.length === 0) {
        for (let i = 2; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          monthBuckets.push({
            year: d.getFullYear(),
            monthIdx: d.getMonth(),
            label: fullMonthNames[d.getMonth()],
            shortLabel: shortMonthNames[d.getMonth()],
          });
        }
      } else {
        const firstDate = new Date(activities[0].date);
        const lastDate = new Date(Math.max(now.getTime(), new Date(activities[activities.length - 1].date).getTime()));
        let cur = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
        const limit = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
        while (cur <= limit && monthBuckets.length < 24) {
          monthBuckets.push({
            year: cur.getFullYear(),
            monthIdx: cur.getMonth(),
            label: fullMonthNames[cur.getMonth()],
            shortLabel: shortMonthNames[cur.getMonth()],
          });
          cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
        }
      }
    }

    // Aggregate per month and per category
    const categoryMap = new Map<string, number>();
    const monthTotalsMap = new Map<string, { total: number; internal: number; eksternal: number }>();

    for (const b of monthBuckets) {
      monthTotalsMap.set(`${b.year}-${b.monthIdx}`, { total: 0, internal: 0, eksternal: 0 });
    }

    let totalInternal = 0;
    let totalEksternal = 0;

    for (const act of activities) {
      const cat = (act.category || 'Lainnya').trim();
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);

      const d = new Date(act.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const catLower = cat.toLowerCase();
      const isEksternal =
        act.suratId !== null ||
        catLower.includes('eksternal') ||
        catLower.includes('undangan');

      if (isEksternal) {
        totalEksternal += 1;
      } else {
        totalInternal += 1;
      }

      const bucket = monthTotalsMap.get(key);
      if (bucket) {
        bucket.total += 1;
        if (isEksternal) bucket.eksternal += 1;
        else bucket.internal += 1;
      }
    }

    const serviceFrequencies = Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const monthlyTotals = monthBuckets.map((b) => {
      const stats = monthTotalsMap.get(`${b.year}-${b.monthIdx}`) || { total: 0, internal: 0, eksternal: 0 };
      return {
        month: b.label,
        shortMonth: b.shortLabel,
        count: stats.total,
      };
    });

    // Ringkasan Layanan Humas: Total on top, then newest to oldest month (matching reference chart)
    const monthComparisonRows = [...monthBuckets]
      .reverse()
      .map((b) => {
        const stats = monthTotalsMap.get(`${b.year}-${b.monthIdx}`) || { total: 0, internal: 0, eksternal: 0 };
        return {
          month: b.label,
          eksternal: stats.eksternal,
          internal: stats.internal,
        };
      });

    const serviceComparison = [
      { month: 'Total', eksternal: totalEksternal, internal: totalInternal },
      ...monthComparisonRows,
    ];

    let busiestMonth = { month: monthBuckets[monthBuckets.length - 1]?.label || '-', count: 0 };
    for (const m of monthlyTotals) {
      if (m.count >= busiestMonth.count) {
        busiestMonth = { month: m.month, count: m.count };
      }
    }

    const firstBucket = monthBuckets[0];
    const lastBucket = monthBuckets[monthBuckets.length - 1];
    const monthsRangeLabel =
      firstBucket && lastBucket
        ? firstBucket.label === lastBucket.label
          ? firstBucket.label
          : `${firstBucket.label}–${lastBucket.label}`
        : '-';
    const periodLabel =
      firstBucket && lastBucket
        ? firstBucket.year === lastBucket.year
          ? `${monthsRangeLabel.toUpperCase()} ${lastBucket.year}`
          : `${firstBucket.label.toUpperCase()} ${firstBucket.year} – ${lastBucket.label.toUpperCase()} ${lastBucket.year}`
        : `${now.getFullYear()}`;

    return {
      period,
      periodLabel,
      totalActivities: activities.length,
      monthsCovered: monthBuckets.length,
      monthsRangeLabel,
      busiestMonth,
      serviceFrequencies,
      monthlyTotals,
      serviceComparison,
      totalInternal,
      totalEksternal,
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
