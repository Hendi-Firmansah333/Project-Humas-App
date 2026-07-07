import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CheckInDto } from './dto/check-in.dto';
import { DocumentationDto } from './dto/documentation.dto';
import { ActivityStatus, CheckInStatus } from '@prisma/client';
import { buildPaginatedResult, parsePagination } from '../common/utils/pagination.util';
import { mapActivityForMobile } from '../common/mappers/mobile.mapper';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  private activityInclude = {
    pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
    validatedBy: { select: { id: true, fullName: true, roleLabel: true } },
    members: {
      include: {
        user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
      orderBy: { createdAt: 'asc' as const },
    },
    media: {
      where: { deletedAt: null },
      orderBy: { createdAt: 'asc' as const },
      select: {
        id: true,
        fileName: true,
        fileUrl: true,
        fileType: true,
        fileSize: true,
        createdAt: true,
        uploader: { select: { id: true, fullName: true } },
      },
    },
    attendances: {
      orderBy: { checkInTime: 'asc' as const },
      include: {
        user: { select: { id: true, fullName: true } },
      },
    },
  };

  private async syncStatus() {
    const activities = await this.prisma.activity.findMany({
      where: {
        status: { in: [ActivityStatus.AKAN_DATANG, ActivityStatus.SEDANG_BERLANGSUNG, ActivityStatus.MENUNGGU_VALIDASI] },
        deletedAt: null,
      },
      include: {
        members: true,
        media: {
          where: { deletedAt: null, fileType: 'application/link' },
        },
      },
    });

    const now = new Date();

    for (const activity of activities) {
      let currentStatus = activity.status;

      const activityDate = new Date(activity.date);
      const startParts = activity.startTime.split(':');
      const endParts = activity.endTime.split(':');

      const startDateTime = new Date(activityDate);
      startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);

      const endDateTime = new Date(activityDate);
      endDateTime.setHours(parseInt(endParts[0] || '23', 10), parseInt(endParts[1] || '59', 10), 59, 999);

      // Check checklist
      const members = activity.members || [];
      const hasPic = members.some((m) => m.userId === activity.picId && m.checkInTime);
      const allMembersCheckIn = members.length > 0 && members.every((m) => m.checkInTime);
      const hasDriveLink = activity.media.some((m) => m.fileType === 'application/link');

      const checklistMet = hasPic && allMembersCheckIn && hasDriveLink;

      if (checklistMet || now > endDateTime) {
        currentStatus = ActivityStatus.MENUNGGU_VALIDASI;
      } else if (now >= startDateTime && now <= endDateTime) {
        currentStatus = ActivityStatus.SEDANG_BERLANGSUNG;
      } else {
        currentStatus = ActivityStatus.AKAN_DATANG;
      }

      if (currentStatus !== activity.status) {
        const updated = await this.prisma.activity.update({
          where: { id: activity.id },
          data: { status: currentStatus },
        });
        await this.prisma.notification.create({
          data: {
            title: 'Status Kegiatan Berubah',
            message: `Status kegiatan "${updated.title}" kini berubah menjadi ${updated.status}.`,
            type: 'SUCCESS',
          },
        });
      }
    }
  }

  /**
   * Build member creates — selalu gunakan role default 'Anggota Humas'.
   * Tidak lagi menerima role dari frontend.
   */
  private buildMemberCreates(memberIds?: number[], picId?: number) {
    const resolved: { userId: number; role: string; checkInStatus: CheckInStatus }[] = [];

    if (memberIds?.length) {
      for (const userId of memberIds) {
        if (userId !== picId) {
          resolved.push({
            userId,
            role: 'Anggota Humas',
            checkInStatus: CheckInStatus.MISSED,
          });
        }
      }
    }

    if (picId) {
      const picAlready = resolved.some((m) => m.userId === picId);
      if (!picAlready) {
        resolved.unshift({
          userId: picId,
          role: 'PIC Lapangan',
          checkInStatus: CheckInStatus.MISSED,
        });
      }
    }

    return resolved.length ? resolved : undefined;
  }

  private mobileActivityWhere(userId: number) {
    return {
      OR: [{ picId: userId }, { members: { some: { userId } } }],
    };
  }

  async syncPicMember(activityId: number, picId: number) {
    const existing = await this.prisma.activityMember.findFirst({
      where: { activityId, userId: picId },
    });
    if (!existing) {
      await this.prisma.activityMember.create({
        data: {
          activityId,
          userId: picId,
          role: 'PIC Lapangan',
          checkInStatus: CheckInStatus.MISSED,
        },
      });
    }
  }

  async create(dto: CreateActivityDto) {
    const { memberIds, date, ...data } = dto;

    // Reject 'members' field with roles — not supported anymore
    const ids = memberIds || [];

    if (ids.includes(dto.picId)) {
      throw new BadRequestException('PIC tidak boleh merangkap sebagai anggota kegiatan.');
    }
    const uniqueMembers = new Set(ids);
    if (uniqueMembers.size !== ids.length) {
      throw new BadRequestException('Daftar anggota tidak boleh berisi anggota duplikat.');
    }

    // Verify PIC is role USER
    const picUser = await this.prisma.user.findUnique({ where: { id: dto.picId } });
    if (!picUser) throw new NotFoundException('PIC tidak ditemukan.');
    if (picUser.role !== 'USER') {
      throw new BadRequestException('Hanya pengguna dengan role Anggota yang dapat ditugaskan sebagai PIC.');
    }

    // Verify all members have role USER
    if (ids.length > 0) {
      const invalidMembers = await this.prisma.user.findMany({
        where: { id: { in: ids }, role: { not: 'USER' } },
        select: { fullName: true },
      });
      if (invalidMembers.length > 0) {
        const names = invalidMembers.map((m) => m.fullName).join(', ');
        throw new BadRequestException(
          `Pengguna berikut bukan Anggota Humas: ${names}. Hanya akun dengan role Anggota yang boleh ditugaskan.`,
        );
      }
    }

    const memberCreates = this.buildMemberCreates(memberIds, data.picId);

    // Remove legacy 'members' field from data if present
    const { members: _ignored, ...cleanData } = data as any;

    const activity = await this.prisma.activity.create({
      data: {
        ...cleanData,
        date: new Date(date),
        members: memberCreates ? { create: memberCreates } : undefined,
      },
      include: this.activityInclude,
    });

    await this.prisma.notification.create({
      data: {
        title: 'Kegiatan Baru Ditambahkan',
        message: `Kegiatan "${activity.title}" telah ditambahkan pada tanggal ${date.split('T')[0]}.`,
        type: 'INFO',
      },
    });

    return activity;
  }

  private buildWhere(options: {
    status?: ActivityStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    history?: boolean;
  }) {
    const { status, search, startDate, endDate, month, year, history } = options;

    const statusFilter = history
      ? status
        ? { status }
        : { status: ActivityStatus.SELESAI }
      : status
        ? { status }
        : { status: { notIn: [ActivityStatus.SELESAI] } };

    const where: any = {
      deletedAt: null,
      ...statusFilter,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' as const } },
        { location: { contains: search, mode: 'insensitive' as const } },
        { description: { contains: search, mode: 'insensitive' as const } },
        { category: { contains: search, mode: 'insensitive' as const } },
        { pic: { fullName: { contains: search, mode: 'insensitive' as const } } },
      ];
    }

    const dateFilter: any = {};
    if (startDate) {
      dateFilter.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      if (endDate.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
      dateFilter.lte = end;
    }

    if (month || year) {
      let start: Date;
      let end: Date;
      if (year && month) {
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0, 23, 59, 59, 999);
      } else if (year) {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59, 999);
      } else {
        const currentYear = new Date().getFullYear();
        start = new Date(currentYear, month! - 1, 1);
        end = new Date(currentYear, month!, 0, 23, 59, 59, 999);
      }
      dateFilter.gte = start;
      dateFilter.lte = end;
    }

    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter;
    }

    return where;
  }

  async findAllPaginated(query: {
    page?: number;
    pageSize?: number;
    status?: ActivityStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    history?: boolean;
    mobile?: boolean;
    userId?: number;
  }) {
    await this.syncStatus();

    const { page, pageSize, skip, take } = parsePagination(query);
    const where = {
      ...this.buildWhere({
        status: query.status,
        search: query.search,
        startDate: query.startDate,
        endDate: query.endDate,
        month: query.month,
        year: query.year,
        history: query.history,
      }),
      ...(query.mobile && query.userId ? this.mobileActivityWhere(query.userId) : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: this.activityInclude,
        orderBy: { date: 'desc' },
        skip,
        take,
      }),
      this.prisma.activity.count({ where }),
    ]);

    const items = query.mobile
      ? rows.map((row) => mapActivityForMobile(row, !!query.history, query.userId))
      : rows;

    return buildPaginatedResult<typeof items[number]>(items, total, page, pageSize);
  }

  async findOne(id: number, mobile = false) {
    await this.syncStatus();

    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      include: this.activityInclude,
    });

    if (!activity) {
      throw new NotFoundException(`Kegiatan dengan ID #${id} tidak ditemukan.`);
    }

    return mobile ? mapActivityForMobile(activity) : activity;
  }

  async update(id: number, dto: UpdateActivityDto) {
    const existing = await this.findOne(id) as any;
    const { memberIds, date, ...data } = dto as any;

    const nextPicId = data.picId !== undefined ? data.picId : existing.picId;
    const currentMemberIds = existing.members.map((m: any) => m.userId).filter((uid: number) => uid !== existing.picId);
    const nextMemberIds = memberIds !== undefined ? memberIds : currentMemberIds;

    if (data.picId !== undefined) {
      const picUser = await this.prisma.user.findUnique({ where: { id: data.picId } });
      if (!picUser) throw new NotFoundException('PIC tidak ditemukan.');
      if (picUser.role !== 'USER') {
        throw new BadRequestException('Hanya pengguna dengan role Anggota yang dapat ditugaskan sebagai PIC.');
      }
    }

    if (nextMemberIds.includes(nextPicId)) {
      throw new BadRequestException('PIC tidak boleh merangkap sebagai anggota kegiatan.');
    }
    const uniqueMembers = new Set(nextMemberIds);
    if (uniqueMembers.size !== nextMemberIds.length) {
      throw new BadRequestException('Daftar anggota tidak boleh berisi anggota duplikat.');
    }

    // Verify all members have role USER
    if (nextMemberIds.length > 0) {
      const invalidMembers = await this.prisma.user.findMany({
        where: { id: { in: nextMemberIds }, role: { not: 'USER' } },
        select: { fullName: true },
      });
      if (invalidMembers.length > 0) {
        const names = invalidMembers.map((m) => m.fullName).join(', ');
        throw new BadRequestException(
          `Pengguna berikut bukan Anggota Humas: ${names}. Hanya akun dengan role Anggota yang boleh ditugaskan.`,
        );
      }
    }

    // Rebuild members if memberIds changed
    if (memberIds !== undefined) {
      await this.prisma.activityMember.deleteMany({ where: { activityId: id } });
      const memberCreates = this.buildMemberCreates(memberIds, nextPicId);
      if (memberCreates?.length) {
        await this.prisma.activityMember.createMany({
          data: memberCreates.map((m) => ({ activityId: id, ...m })),
        });
      }
    } else if (data.picId !== undefined) {
      await this.syncPicMember(id, nextPicId);
    }

    // Remove legacy members field
    const { members: _ignored, ...cleanData } = data;

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        ...cleanData,
        date: date ? new Date(date) : undefined,
      },
      include: this.activityInclude,
    });

    // Send per-member notifications if status changed to SELESAI
    if (cleanData.status === ActivityStatus.SELESAI) {
      const allMemberIds = [
        updated.picId,
        ...(updated.members as any[]).map((m: any) => m.userId),
      ].filter((uid, idx, arr) => arr.indexOf(uid) === idx);

      for (const uid of allMemberIds) {
        await this.prisma.notification.create({
          data: {
            userId: uid,
            title: 'Kegiatan Selesai',
            message: `Kegiatan "${updated.title}" telah ditandai selesai oleh Admin. Terima kasih atas partisipasi Anda!`,
            type: 'SUCCESS',
          },
        });
      }
    }

    if (memberIds === undefined && data.picId === undefined) {
      await this.syncPicMember(id, updated.picId);
    }

    return this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      include: this.activityInclude,
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.activity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: `Kegiatan ID #${id} berhasil dihapus.` };
  }

  async checkIn(activityId: number, userId: number, dto: CheckInDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, deletedAt: null },
      include: this.activityInclude,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');

    const status = dto.isLate ? CheckInStatus.TERLAMBAT : CheckInStatus.SUCCESS;
    const now = new Date();
    const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    let member = await this.prisma.activityMember.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });

    if (!member) {
      member = await this.prisma.activityMember.create({
        data: {
          activityId,
          userId,
          role: 'Petugas Lapangan',
          checkInStatus: status,
          checkInTime: timeLabel,
          selfieUrl: dto.selfiePath,
        },
      });
    } else {
      member = await this.prisma.activityMember.update({
        where: { id: member.id },
        data: {
          checkInStatus: status,
          checkInTime: timeLabel,
          selfieUrl: dto.selfiePath,
        },
      });
    }

    await this.prisma.attendance.create({
      data: {
        userId,
        activityId,
        status,
        latitude: dto.latitude,
        longitude: dto.longitude,
        selfieUrl: dto.selfiePath,
      },
    });

    const refreshed = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: this.activityInclude,
    });

    return { item: mapActivityForMobile(refreshed!, false) };
  }

  async submitDocumentation(activityId: number, userId: number, dto: DocumentationDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, deletedAt: null },
      include: this.activityInclude,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');

    const isMember = (activity.members as any[]).some((m: any) => m.userId === userId) || activity.picId === userId;
    if (!isMember) throw new ForbiddenException('Anda tidak ditugaskan pada kegiatan ini.');

    // Validate: only 1 documentation upload allowed per activity
    const existingDoc = await this.prisma.media.findFirst({
      where: {
        activityId,
        deletedAt: null,
        fileType: 'application/link',
      },
    });
    if (existingDoc) {
      throw new BadRequestException(
        'Dokumentasi sudah diupload oleh anggota lain. Hanya satu upload yang diperbolehkan per kegiatan.',
      );
    }

    const media = await this.prisma.media.create({
      data: {
        fileName: 'documentation',
        fileUrl: dto.driveUrl,
        fileType: 'application/link',
        uploaderId: userId,
        activityId,
      },
    });

    return {
      item: {
        ...mapActivityForMobile(activity),
        documentationUrl: dto.driveUrl,
        docStatus: 'Sudah Upload',
        uploadedAt: media.createdAt,
      },
    };
  }

  async restore(id: number) {
    await this.findOne(id);
    return this.prisma.activity.update({
      where: { id },
      data: { status: ActivityStatus.AKAN_DATANG },
      include: this.activityInclude,
    });
  }

  async validateActivity(id: number, userId: number, notes?: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      include: this.activityInclude,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');

    // Check conditions
    const members = activity.members || [];
    const hasPic = members.some((m) => m.userId === activity.picId && m.checkInTime);
    const allMembersCheckIn = members.length > 0 && members.every((m) => m.checkInTime);
    const hasDriveLink = activity.media.some((m) => m.fileType === 'application/link');

    if (!hasPic || !allMembersCheckIn || !hasDriveLink) {
      throw new BadRequestException('Belum dapat divalidasi. Lengkapi seluruh persyaratan kegiatan.');
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.SELESAI,
        validatedById: userId,
        validatedAt: new Date(),
        validationNotes: notes || 'Semua persyaratan kegiatan telah lengkap.',
      },
      include: this.activityInclude,
    });

    // Create notifications for all members
    const allMemberIds = [
      updated.picId,
      ...(updated.members as any[]).map((m: any) => m.userId),
    ].filter((uid, idx, arr) => arr.indexOf(uid) === idx);

    for (const uid of allMemberIds) {
      await this.prisma.notification.create({
        data: {
          userId: uid,
          title: 'Kegiatan Selesai & Valid',
          message: `Kegiatan "${updated.title}" telah divalidasi oleh Admin. Terima kasih atas partisipasi Anda!`,
          type: 'SUCCESS',
        },
      });
    }

    return updated;
  }

  async getCategories() {
    const activities = await this.prisma.activity.findMany({
      where: { deletedAt: null },
      select: { category: true },
      distinct: ['category'],
    });
    return activities.map((a) => a.category).filter(Boolean);
  }
}