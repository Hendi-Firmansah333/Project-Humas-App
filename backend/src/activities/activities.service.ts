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
    surat: {
      select: {
        id: true,
        letterNumber: true,
        letterDate: true,
        receivedDate: true,
        sender: true,
        institution: true,
        subject: true,
        destination: true,
        fileUrl: true,
      },
    },
    loans: {
      where: { deletedAt: null },
      include: {
        items: {
          include: {
            equipment: {
              select: { id: true, name: true, code: true, category: true, brand: true, photoUrl: true, condition: true },
            },
          },
        },
      },
    },
  };

  private async syncStatus() {
    const activities = await this.prisma.activity.findMany({
      where: {
        status: { in: [ActivityStatus.AKAN_DATANG, ActivityStatus.DITUGASKAN, ActivityStatus.SEDANG_BERLANGSUNG, ActivityStatus.MENUNGGU_VERIFIKASI] },
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
      const startParts = (activity.startTime || '08:00').split(':');
      const endParts = (activity.endTime || '17:00').split(':');

      const startDateTime = new Date(activityDate);
      startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);

      const endDateTime = new Date(activityDate);
      endDateTime.setHours(parseInt(endParts[0] || '23', 10), parseInt(endParts[1] || '59', 10), 59, 999);

      if (now > endDateTime) {
        currentStatus = ActivityStatus.MENUNGGU_VERIFIKASI;
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
            type: 'INFO',
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

  async create(dto: CreateActivityDto, userId?: number) {
    const { memberIds, date, isManual, ...data } = dto;

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
      include: this.activityInclude,
    });

    // Create Equipment Loan if equipment items provided
    if (dto.equipmentItems && dto.equipmentItems.length > 0) {
      for (const eqItem of dto.equipmentItems) {
        if (eqItem.quantity <= 0) continue;
        const eq = await this.prisma.equipment.findFirst({
          where: { id: eqItem.equipmentId, deletedAt: null },
        });
        if (!eq) throw new NotFoundException(`Alat ID #${eqItem.equipmentId} tidak ditemukan.`);

        const activeOverlapLoans = await this.prisma.equipmentLoan.findMany({
          where: {
            status: { in: ['SEDANG_DIPINJAM', 'TERLAMBAT'] },
            deletedAt: null,
            items: { some: { equipmentId: eqItem.equipmentId } },
          },
          include: {
            activity: true,
            items: { where: { equipmentId: eqItem.equipmentId } },
          },
        });

        let borrowedInWindow = 0;
        for (const oLoan of activeOverlapLoans) {
          let lStart = new Date(oLoan.borrowDate);
          let lEnd = new Date(oLoan.returnDate);
          if (oLoan.activity) {
            const lDate = new Date(oLoan.activity.date);
            const lStartParts = (oLoan.activity.startTime || '08:00').split(':');
            const lEndParts = (oLoan.activity.endTime || '17:00').split(':');
            lStart = new Date(lDate);
            lStart.setHours(parseInt(lStartParts[0] || '0', 10), parseInt(lStartParts[1] || '0', 10), 0, 0);
            lEnd = new Date(lDate);
            lEnd.setHours(parseInt(lEndParts[0] || '23', 10), parseInt(lEndParts[1] || '59', 10), 59, 999);
          }
          if (startDateTime <= lEnd && endDateTime >= lStart) {
            for (const it of oLoan.items) {
              borrowedInWindow += it.quantity - it.returnedQuantity;
            }
          }
        }

        const broken = eq.broken ?? 0;
        const availableInWindow = Math.max(0, eq.total - broken - borrowedInWindow);

        if (eqItem.quantity > availableInWindow) {
          throw new BadRequestException(
            `Alat "${eq.name}" tidak mencukupi untuk jadwal tersebut. Tersedia: ${availableInWindow} unit, Diminta: ${eqItem.quantity} unit.`,
          );
        }
      }

      const validItems = dto.equipmentItems.filter((i) => i.quantity > 0);
      if (validItems.length > 0) {
        await this.prisma.equipmentLoan.create({
          data: {
            borrowerName: picUser.fullName,
            borrowerPhone: picUser.phone || '-',
            userId: dto.picId,
            purpose: `Peralatan operasional untuk kegiatan: ${activity.title}`,
            borrowDate: startDateTime,
            returnDate: endDateTime,
            status: 'SEDANG_DIPINJAM',
            activityId: activity.id,
            items: {
              create: validItems.map((item) => ({
                equipmentId: item.equipmentId,
                quantity: item.quantity,
                returnedQuantity: 0,
              })),
            },
          },
        });
      }
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
    role?: string;
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
      ...(((query.mobile && query.userId) || (query.role === 'USER' && query.userId))
        ? this.mobileActivityWhere(query.userId)
        : {}),
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

  async update(id: number, dto: UpdateActivityDto, userId?: number) {
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

    // Record Audit Log if location or other core fields updated
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

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }

  async checkIn(activityId: number, userId: number, dto: CheckInDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, deletedAt: null },
      include: this.activityInclude,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');

    // 1. Time Validation
    const actDate = new Date(activity.date);
    const startParts = (activity.startTime || '08:00').split(':');
    const startDateTime = new Date(actDate);
    startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);

    const now = new Date();
    if (now < startDateTime) {
      throw new BadRequestException(
        `Absensi belum tersedia. Kegiatan baru dimulai pada pukul ${activity.startTime} WIB.`,
      );
    }

    // Determine if late
    const isLate = dto.isLate ?? (now > startDateTime);
    const checkInStatus = isLate ? CheckInStatus.TERLAMBAT : CheckInStatus.SUCCESS;

    // 2. GPS Location Validation
    let distanceCalculated: number | null = null;
    if (activity.latitude != null && activity.longitude != null) {
      if (dto.latitude == null || dto.longitude == null) {
        throw new BadRequestException('Lokasi GPS perangkat wajib diaktifkan untuk absensi.');
      }
      distanceCalculated = this.calculateDistance(
        activity.latitude,
        activity.longitude,
        dto.latitude,
        dto.longitude,
      );
      const maxRadius = activity.radius ?? 100;
      if (distanceCalculated > maxRadius) {
        throw new BadRequestException(
          `Anda berada ${Math.round(distanceCalculated)} meter dari lokasi kegiatan. Maksimal radius ${maxRadius} meter.`,
        );
      }
    }

    const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

    let member = await this.prisma.activityMember.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });

    if (!member) {
      if (activity.picId === userId) {
        // Create or sync PIC as member
        member = await this.prisma.activityMember.create({
          data: {
            activityId,
            userId,
            role: 'PIC Lapangan',
            checkInStatus,
            checkInTime: timeLabel,
            selfieUrl: dto.selfiePath,
          },
        });
      } else {
        throw new ForbiddenException('Anda tidak ditugaskan pada kegiatan ini.');
      }
    } else {
      member = await this.prisma.activityMember.update({
        where: { id: member.id },
        data: {
          checkInStatus,
          checkInTime: timeLabel,
          selfieUrl: dto.selfiePath,
        },
      });
    }

    await this.prisma.attendance.create({
      data: {
        userId,
        activityId,
        status: checkInStatus,
        latitude: dto.latitude,
        longitude: dto.longitude,
        distance: distanceCalculated != null ? Math.round(distanceCalculated) : null,
        selfieUrl: dto.selfiePath,
        notes: isLate ? 'Absensi Terlambat' : 'Hadir Tepat Waktu',
      },
    });

    const refreshed = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: this.activityInclude,
    });

    return { item: mapActivityForMobile(refreshed!, false, userId) };
  }

  async submitDocumentation(activityId: number, userId: number, dto: DocumentationDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, deletedAt: null },
      include: this.activityInclude,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');

    const isMember = (activity.members as any[]).some((m: any) => m.userId === userId) || activity.picId === userId;
    if (!isMember) throw new ForbiddenException('Anda tidak ditugaskan pada kegiatan ini.');

    // Time validation: documentation only permitted after start time
    const actDate = new Date(activity.date);
    const startParts = (activity.startTime || '08:00').split(':');
    const startDateTime = new Date(actDate);
    startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);

    const now = new Date();
    if (now < startDateTime) {
      throw new BadRequestException('Dokumentasi hanya dapat diunggah setelah kegiatan dimulai.');
    }

    // Validate: only 1 documentation upload allowed per activity
    const existingDoc = await this.prisma.media.findFirst({
      where: {
        activityId,
        deletedAt: null,
        fileType: 'application/link',
      },
    });
    if (existingDoc) {
      const userObj = await this.prisma.user.findUnique({ where: { id: userId } });
      const canEdit = existingDoc.uploaderId === userId || activity.picId === userId || userObj?.role === 'ADMIN' || userObj?.role === 'SUPER_ADMIN';
      if (canEdit) {
        await this.prisma.media.update({
          where: { id: existingDoc.id },
          data: { fileUrl: dto.driveUrl },
        });
        return {
          item: {
            ...mapActivityForMobile(activity, false, userId),
            documentationUrl: dto.driveUrl,
            docStatus: 'Sudah Upload',
            uploadedAt: existingDoc.createdAt,
          },
        };
      } else {
        throw new BadRequestException('Link Google Drive untuk kegiatan ini sudah tersedia.');
      }
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
        ...mapActivityForMobile(activity, false, userId),
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

  private async appendApprovalHistory(activityId: number, userId: number, stage: string, status: string, notes?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan.');

    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');

    const history = (activity.approvalHistory as any[]) || [];
    const newEntry = {
      stage,
      status,
      userId: user.id,
      fullName: user.fullName,
      role: user.role,
      date: new Date().toISOString(),
      notes: notes || '',
    };

    return this.prisma.activity.update({
      where: { id: activityId },
      data: {
        approvalHistory: [...history, newEntry]
      }
    });
  }

  async approveExecution(id: number, userId: number) {
    const activity = await this.findOne(id);
    if (activity.status !== ActivityStatus.MENUNGGU_PERSETUJUAN) {
      throw new BadRequestException('Kegiatan tidak sedang menunggu persetujuan pelaksanaan.');
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: { status: ActivityStatus.DISETUJUI },
      include: this.activityInclude,
    });

    await this.appendApprovalHistory(
      id,
      userId,
      'Persetujuan Pelaksanaan',
      'DISETUJUI',
      'Kegiatan disetujui untuk dilaksanakan.'
    );

    return this.prisma.activity.findUnique({
      where: { id },
      include: this.activityInclude,
    });
  }

  async rejectExecution(id: number, userId: number, notes: string) {
    if (!notes) {
      throw new BadRequestException('Catatan penolakan wajib diisi.');
    }
    const activity = await this.findOne(id);
    if (activity.status !== ActivityStatus.MENUNGGU_PERSETUJUAN) {
      throw new BadRequestException('Kegiatan tidak sedang menunggu persetujuan pelaksanaan.');
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: { status: ActivityStatus.DITOLAK },
      include: this.activityInclude,
    });

    await this.appendApprovalHistory(
      id,
      userId,
      'Persetujuan Pelaksanaan',
      'DITOLAK',
      notes
    );

    return this.prisma.activity.findUnique({
      where: { id },
      include: this.activityInclude,
    });
  }

  async assignTeam(
    id: number,
    picId: number,
    memberIds: number[],
    equipmentItems?: { equipmentId: number; quantity: number }[],
  ) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');
    if (activity.status !== ActivityStatus.DISETUJUI && activity.status !== ActivityStatus.DITUGASKAN) {
      throw new BadRequestException('Kegiatan harus disetujui terlebih dahulu sebelum penugasan tim.');
    }

    if (memberIds.includes(picId)) {
      throw new BadRequestException('PIC tidak boleh merangkap sebagai anggota kegiatan.');
    }
    const uniqueMembers = new Set(memberIds);
    if (uniqueMembers.size !== memberIds.length) {
      throw new BadRequestException('Daftar anggota tidak boleh berisi anggota duplikat.');
    }

    // Verify PIC has role USER (Tim Humas)
    const picUser = await this.prisma.user.findUnique({ where: { id: picId } });
    if (!picUser) throw new NotFoundException('PIC tidak ditemukan.');
    if (picUser.role !== 'USER') {
      throw new BadRequestException('PIC harus berasal dari akun Tim Humas.');
    }

    // Verify all members have role USER (Tim Humas)
    if (memberIds.length > 0) {
      const invalidMembers = await this.prisma.user.findMany({
        where: { id: { in: memberIds }, role: { not: 'USER' } },
        select: { fullName: true },
      });
      if (invalidMembers.length > 0) {
        const names = invalidMembers.map((m) => m.fullName).join(', ');
        throw new BadRequestException(
          `Pengguna berikut bukan Tim Humas: ${names}. Anggota kegiatan harus berasal dari akun Tim Humas.`
        );
      }
    }

    // Update members
    await this.prisma.activityMember.deleteMany({ where: { activityId: id } });
    const memberCreates = this.buildMemberCreates(memberIds, picId);
    if (memberCreates?.length) {
      await this.prisma.activityMember.createMany({
        data: memberCreates.map((m) => ({ activityId: id, ...m })),
      });
    }

    const actDate = new Date(activity.date);
    const startParts = (activity.startTime || '08:00').split(':');
    const endParts = (activity.endTime || '17:00').split(':');
    const startDateTime = new Date(actDate);
    startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);
    const endDateTime = new Date(actDate);
    endDateTime.setHours(parseInt(endParts[0] || '23', 10), parseInt(endParts[1] || '59', 10), 59, 999);

    // Handle equipment allocation if provided
    if (equipmentItems !== undefined) {
      await this.prisma.equipmentLoan.deleteMany({
        where: { activityId: id, status: 'SEDANG_DIPINJAM' },
      });

      const validItems = equipmentItems.filter((i) => i.quantity > 0);
      if (validItems.length > 0) {
        for (const eqItem of validItems) {
          const eq = await this.prisma.equipment.findFirst({
            where: { id: eqItem.equipmentId, deletedAt: null },
          });
          if (!eq) throw new NotFoundException(`Alat ID #${eqItem.equipmentId} tidak ditemukan.`);

          const activeOverlapLoans = await this.prisma.equipmentLoan.findMany({
            where: {
              status: { in: ['SEDANG_DIPINJAM', 'TERLAMBAT'] },
              deletedAt: null,
              NOT: { activityId: id },
              items: { some: { equipmentId: eqItem.equipmentId } },
            },
            include: {
              activity: true,
              items: { where: { equipmentId: eqItem.equipmentId } },
            },
          });

          let borrowedInWindow = 0;
          for (const oLoan of activeOverlapLoans) {
            let lStart = new Date(oLoan.borrowDate);
            let lEnd = new Date(oLoan.returnDate);
            if (oLoan.activity) {
              const lDate = new Date(oLoan.activity.date);
              const lStartParts = (oLoan.activity.startTime || '08:00').split(':');
              const lEndParts = (oLoan.activity.endTime || '17:00').split(':');
              lStart = new Date(lDate);
              lStart.setHours(parseInt(lStartParts[0] || '0', 10), parseInt(lStartParts[1] || '0', 10), 0, 0);
              lEnd = new Date(lDate);
              lEnd.setHours(parseInt(lEndParts[0] || '23', 10), parseInt(lEndParts[1] || '59', 10), 59, 999);
            }
            if (startDateTime <= lEnd && endDateTime >= lStart) {
              for (const it of oLoan.items) {
                borrowedInWindow += it.quantity - it.returnedQuantity;
              }
            }
          }

          const broken = eq.broken ?? 0;
          const availableInWindow = Math.max(0, eq.total - broken - borrowedInWindow);

          if (eqItem.quantity > availableInWindow) {
            throw new BadRequestException(
              `Alat "${eq.name}" tidak mencukupi untuk jadwal tersebut. Tersedia: ${availableInWindow} unit, Diminta: ${eqItem.quantity} unit.`,
            );
          }
        }

        await this.prisma.equipmentLoan.create({
          data: {
            borrowerName: picUser.fullName,
            borrowerPhone: picUser.phone || '-',
            userId: picId,
            purpose: `Peralatan operasional untuk kegiatan: ${activity.title}`,
            borrowDate: startDateTime,
            returnDate: endDateTime,
            status: 'SEDANG_DIPINJAM',
            activityId: id,
            items: {
              create: validItems.map((item) => ({
                equipmentId: item.equipmentId,
                quantity: item.quantity,
                returnedQuantity: 0,
              })),
            },
          },
        });
      }
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        picId,
        status: ActivityStatus.DITUGASKAN,
      },
      include: this.activityInclude,
    });

    // Notify PIC
    await this.prisma.notification.create({
      data: {
        userId: picId,
        title: 'Penugasan Sebagai PIC Kegiatan',
        message: `Kamu ditugaskan sebagai PIC pada kegiatan "${updated.title}".`,
        type: 'INFO',
        link: `/kegiatan/${id}`,
      },
    });

    // Notify Members
    for (const mId of memberIds) {
      await this.prisma.notification.create({
        data: {
          userId: mId,
          title: 'Penugasan Anggota Kegiatan',
          message: `Kamu ditugaskan sebagai anggota pada kegiatan "${updated.title}".`,
          type: 'INFO',
          link: `/kegiatan/${id}`,
        },
      });
    }

    return updated;
  }

  async submitVerification(id: number, userId: number, notes?: string) {
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

    // Check active loans for this activity
    const activeLoans = await this.prisma.equipmentLoan.findMany({
      where: { activityId: id, status: { not: 'SELESAI' }, deletedAt: null }
    });
    const toolsReturned = activeLoans.length === 0;

    if (!hasPic || !allMembersCheckIn || !hasDriveLink || !toolsReturned) {
      let missingMsg = 'Belum dapat diajukan karena masih terdapat data yang belum lengkap:';
      if (!hasPic) missingMsg += ' PIC belum check-in.';
      if (!allMembersCheckIn) missingMsg += ' Beberapa anggota belum check-in.';
      if (!hasDriveLink) missingMsg += ' Link Google Drive belum diupload.';
      if (!toolsReturned) missingMsg += ' Beberapa peralatan belum dikembalikan.';
      throw new BadRequestException(missingMsg);
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.MENUNGGU_PERSETUJUAN_AKHIR,
      },
      include: this.activityInclude,
    });

    await this.appendApprovalHistory(
      id,
      userId,
      'Verifikasi Kelengkapan',
      'MENUNGGU_PERSETUJUAN_AKHIR',
      notes || 'Semua persyaratan kegiatan telah lengkap.'
    );

    return this.prisma.activity.findUnique({
      where: { id },
      include: this.activityInclude,
    });
  }

  async approveFinish(id: number, userId: number, notes?: string) {
    const activity = await this.findOne(id);
    if (activity.status !== ActivityStatus.MENUNGGU_PERSETUJUAN_AKHIR) {
      throw new BadRequestException('Kegiatan tidak sedang menunggu persetujuan akhir.');
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.SELESAI,
        validatedById: userId,
        validatedAt: new Date(),
        validationNotes: notes || 'Kegiatan selesai disetujui oleh Kepala Humas.',
      },
      include: this.activityInclude,
    });

    await this.appendApprovalHistory(
      id,
      userId,
      'Persetujuan Akhir',
      'SELESAI',
      notes || 'Kegiatan selesai disetujui oleh Kepala Humas.'
    );

    // Notify all members
    const allMemberIds = [
      updated.picId,
      ...(updated.members as any[]).map((m: any) => m.userId),
    ].filter((uid, idx, arr) => arr.indexOf(uid) === idx);

    for (const uid of allMemberIds) {
      await this.prisma.notification.create({
        data: {
          userId: uid,
          title: 'Kegiatan Selesai & Terverifikasi',
          message: `Kegiatan "${updated.title}" telah disetujui selesai oleh Kepala Humas.`,
          type: 'SUCCESS',
        },
      });
    }

    return this.prisma.activity.findUnique({
      where: { id },
      include: this.activityInclude,
    });
  }

  async returnRevision(id: number, userId: number, notes: string) {
    if (!notes) {
      throw new BadRequestException('Catatan perbaikan wajib diisi.');
    }
    const activity = await this.findOne(id);
    if (activity.status !== ActivityStatus.MENUNGGU_PERSETUJUAN_AKHIR && activity.status !== ActivityStatus.MENUNGGU_VERIFIKASI) {
      throw new BadRequestException('Kegiatan tidak sedang dalam tahap verifikasi atau persetujuan.');
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.DIKEMBALIKAN,
      },
      include: this.activityInclude,
    });

    await this.appendApprovalHistory(
      id,
      userId,
      'Persetujuan Akhir',
      'DIKEMBALIKAN',
      notes
    );

    // Notify PIC
    await this.prisma.notification.create({
      data: {
        userId: updated.picId,
        title: 'Kegiatan Dikembalikan untuk Perbaikan',
        message: `Kegiatan "${updated.title}" dikembalikan oleh Kepala Humas: ${notes}`,
        type: 'WARNING',
      },
    });

    return this.prisma.activity.findUnique({
      where: { id },
      include: this.activityInclude,
    });
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