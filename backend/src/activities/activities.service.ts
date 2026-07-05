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
    members: {
      include: {
        user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    },
    media: {
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' as const },
      select: { id: true, fileName: true, fileUrl: true, fileType: true, createdAt: true, uploader: { select: { fullName: true } } },
    },
  };

  private buildMemberCreates(
    members?: { userId: number; role: string }[],
    memberIds?: number[],
    picId?: number,
  ) {
    const resolved: { userId: number; role: string; checkInStatus: CheckInStatus }[] = [];

    if (members?.length) {
      for (const m of members) {
        resolved.push({
          userId: m.userId,
          role: m.role,
          checkInStatus: CheckInStatus.MISSED,
        });
      }
    } else if (memberIds?.length) {
      for (const userId of memberIds) {
        resolved.push({
          userId,
          role: 'Anggota Humas',
          checkInStatus: CheckInStatus.MISSED,
        });
      }
    }

    if (picId && !resolved.some((m) => m.userId === picId)) {
      resolved.unshift({
        userId: picId,
        role: 'PIC Lapangan',
        checkInStatus: CheckInStatus.MISSED,
      });
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
    const { memberIds, members, date, ...data } = dto;
    const memberCreates = this.buildMemberCreates(members, memberIds, data.picId);

    return this.prisma.activity.create({
      data: {
        ...data,
        date: new Date(date),
        members: memberCreates
          ? { create: memberCreates }
          : undefined,
      },
      include: this.activityInclude,
    });
  }

  private buildWhere(status?: ActivityStatus, search?: string, history = false) {
    const statusFilter = history
      ? status
        ? { status }
        : { status: { in: [ActivityStatus.SELESAI, ActivityStatus.DIBATALKAN] } }
      : status
        ? { status }
        : { status: { notIn: [ActivityStatus.SELESAI, ActivityStatus.DIBATALKAN] } };

    return {
      deletedAt: null,
      ...statusFilter,
      OR: search
        ? [
            { title: { contains: search, mode: 'insensitive' as const } },
            { location: { contains: search, mode: 'insensitive' as const } },
            { description: { contains: search, mode: 'insensitive' as const } },
          ]
        : undefined,
    };
  }

  async findAllPaginated(query: {
    page?: number;
    pageSize?: number;
    status?: ActivityStatus;
    search?: string;
    history?: boolean;
    mobile?: boolean;
    userId?: number;
  }) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const where = {
      ...this.buildWhere(query.status, query.search, query.history),
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
    await this.findOne(id);
    const { memberIds, members, date, ...data } = dto;

    const nextPicId = data.picId;

    if (members !== undefined || memberIds !== undefined) {
      await this.prisma.activityMember.deleteMany({ where: { activityId: id } });
      const memberCreates = this.buildMemberCreates(members, memberIds, nextPicId);
      if (memberCreates?.length) {
        await this.prisma.activityMember.createMany({
          data: memberCreates.map((m) => ({ activityId: id, ...m })),
        });
      }
    } else if (nextPicId !== undefined) {
      await this.syncPicMember(id, nextPicId);
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        ...data,
        date: date ? new Date(date) : undefined,
      },
      include: this.activityInclude,
    });

    if (nextPicId === undefined) {
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

    const isMember = activity.members.some((m) => m.userId === userId) || activity.picId === userId;
    if (!isMember) throw new ForbiddenException('Anda tidak ditugaskan pada kegiatan ini.');

    await this.prisma.media.create({
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
      },
    };
  }
}