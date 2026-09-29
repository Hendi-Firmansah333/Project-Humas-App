import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { UpdateActivityDto } from '../dto/update-activity.dto';
import { ActivityStatus } from '@prisma/client';
import { buildPaginatedResult, parsePagination } from '../../common/utils/pagination.util';
import { mapActivityForMobile } from '../../common/mappers/mobile.mapper';
import {
  ACTIVITY_INCLUDE,
  buildMemberCreates,
  mobileActivityWhere,
  syncActivityStatus,
} from '../activities.constants';
import { ActivitiesTeamService } from './activities-team.service';

@Injectable()
export class ActivitiesCrudService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamService: ActivitiesTeamService,
  ) {}

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

  /**
   * Membuat kegiatan baru (manual tanpa surat ataupun melalui penugasan).
   */
  async create(dto: CreateActivityDto, userId?: number) {
    const { memberIds, date, isManual, ...data } = dto;
    const ids = memberIds || [];

    const picUser = await this.teamService.validateTeam(dto.picId, ids);
    const memberCreates = buildMemberCreates(memberIds, data.picId);
    const { members: _ignored, ...cleanData } = data as any;

    const actDate = new Date(date);
    const startParts = (cleanData.startTime || '08:00').split(':');
    const endParts = (cleanData.endTime || '17:00').split(':');
    const startDateTime = new Date(actDate);
    startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);
    const endDateTime = new Date(actDate);
    endDateTime.setHours(parseInt(endParts[0] || '23', 10), parseInt(endParts[1] || '59', 10), 59, 999);
    const now = new Date();

    let initialStatus: ActivityStatus = ActivityStatus.AKAN_DATANG;
    if (now > endDateTime) {
      initialStatus = ActivityStatus.MENUNGGU_VERIFIKASI;
    } else if (now >= startDateTime && now <= endDateTime) {
      initialStatus = ActivityStatus.SEDANG_BERLANGSUNG;
    }

    const activity = await this.prisma.activity.create({
      data: {
        ...cleanData,
        date: new Date(date),
        status: initialStatus,
        isManual: isManual !== undefined ? isManual : true,
        members: memberCreates ? { create: memberCreates } : undefined,
      },
      include: ACTIVITY_INCLUDE,
    });

    if (dto.equipmentItems && dto.equipmentItems.length > 0) {
      await this.teamService.allocateEquipment(
        activity.id,
        activity.title,
        picUser,
        startDateTime,
        endDateTime,
        dto.equipmentItems,
        false,
      );
    }

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_KEGIATAN_MANUAL',
          entity: 'Activity',
          entityId: String(activity.id),
          newValue: JSON.stringify({ title: activity.title, isManual: true }),
        },
      });
    }

    await this.prisma.notification.create({
      data: {
        title: 'Penugasan Kegiatan Baru',
        message: `Kegiatan "${activity.title}" (Kegiatan Manual / Tanpa Surat) telah dijadwalkan untuk tanggal ${date.split('T')[0]}.`,
        type: 'INFO',
      },
    });

    return activity;
  }

  /**
   * Menampilkan daftar kegiatan dengan pagination dan filter lengkap.
   */
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
    role?: string;
  }) {
    await syncActivityStatus(this.prisma);

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
      ...(((query.mobile && query.userId) || (query.role === 'USER' && query.userId))
        ? mobileActivityWhere(query.userId)
        : {}),
    };

    const [rows, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: ACTIVITY_INCLUDE,
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

  /**
   * Mengambil detail satu kegiatan.
   */
  async findOne(id: number, mobile = false) {
    await syncActivityStatus(this.prisma);

    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      include: ACTIVITY_INCLUDE,
    });

    if (!activity) {
      throw new NotFoundException(`Kegiatan dengan ID #${id} tidak ditemukan.`);
    }

    return mobile ? mapActivityForMobile(activity) : activity;
  }

  /**
   * Memperbarui informasi kegiatan.
   */
  async update(id: number, dto: UpdateActivityDto, userId?: number) {
    const existing = (await this.findOne(id)) as any;
    const { memberIds, date, ...data } = dto as any;

    const nextPicId = data.picId !== undefined ? data.picId : existing.picId;
    const currentMemberIds = existing.members
      .map((m: any) => m.userId)
      .filter((uid: number) => uid !== existing.picId);
    const nextMemberIds = memberIds !== undefined ? memberIds : currentMemberIds;

    await this.teamService.validateTeam(nextPicId, nextMemberIds);

    // Rebuild members jika memberIds diupdate
    if (memberIds !== undefined) {
      await this.prisma.activityMember.deleteMany({ where: { activityId: id } });
      const memberCreates = buildMemberCreates(memberIds, nextPicId);
      if (memberCreates?.length) {
        await this.prisma.activityMember.createMany({
          data: memberCreates.map((m) => ({ activityId: id, ...m })),
        });
      }
    } else if (data.picId !== undefined) {
      await this.teamService.syncPicMember(id, nextPicId);
    }

    const { members: _ignored, ...cleanData } = data;

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        ...cleanData,
        date: date ? new Date(date) : undefined,
      },
      include: ACTIVITY_INCLUDE,
    });

    // Catat Audit Log
    if (userId) {
      if (cleanData.location && cleanData.location !== existing.location) {
        await this.prisma.auditLog.create({
          data: {
            userId,
            action: 'UPDATE_KEGIATAN_LOCATION',
            entity: 'Activity',
            entityId: String(id),
            oldValue: JSON.stringify({ location: existing.location }),
            newValue: JSON.stringify({ location: cleanData.location }),
          },
        });
      } else {
        await this.prisma.auditLog.create({
          data: {
            userId,
            action: 'UPDATE_KEGIATAN',
            entity: 'Activity',
            entityId: String(id),
            newValue: JSON.stringify(cleanData),
          },
        });
      }
    }

    // Kirim notifikasi jika status diubah menjadi SELESAI
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
      await this.teamService.syncPicMember(id, updated.picId);
    }

    return this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      include: ACTIVITY_INCLUDE,
    });
  }

  /**
   * Menghapus (soft delete) kegiatan.
   */
  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.activity.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: `Kegiatan ID #${id} berhasil dihapus.` };
  }

  /**
   * Memulihkan kegiatan yang di-soft delete.
   */
  async restore(id: number) {
    await this.findOne(id);
    return this.prisma.activity.update({
      where: { id },
      data: { status: ActivityStatus.AKAN_DATANG },
      include: ACTIVITY_INCLUDE,
    });
  }

  /**
   * Mendapatkan daftar kategori kegiatan yang unik.
   */
  async getCategories() {
    const activities = await this.prisma.activity.findMany({
      where: { deletedAt: null },
      select: { category: true },
      distinct: ['category'],
    });
    return activities.map((a) => a.category).filter(Boolean);
  }
}
