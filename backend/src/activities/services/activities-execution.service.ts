import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CheckInDto } from '../dto/check-in.dto';
import { DocumentationDto } from '../dto/documentation.dto';
import { CheckInStatus } from '@prisma/client';
import { ACTIVITY_INCLUDE, calculateDistance } from '../activities.constants';
import { mapActivityForMobile } from '../../common/mappers/mobile.mapper';

@Injectable()
export class ActivitiesExecutionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Presensi kehadiran anggota/PIC di lokasi kegiatan berbasis GPS & Selfie.
   */
  async checkIn(activityId: number, userId: number, dto: CheckInDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, deletedAt: null },
      include: ACTIVITY_INCLUDE,
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
    const isLate = dto.isLate ?? now > startDateTime;
    const checkInStatus = isLate ? CheckInStatus.TERLAMBAT : CheckInStatus.SUCCESS;

    // 2. GPS Location Validation
    let distanceCalculated: number | null = null;
    if (activity.latitude != null && activity.longitude != null) {
      if (dto.latitude == null || dto.longitude == null) {
        throw new BadRequestException('Lokasi GPS perangkat wajib diaktifkan untuk absensi.');
      }
      distanceCalculated = calculateDistance(
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

    const timeLabel =
      now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

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
      include: ACTIVITY_INCLUDE,
    });

    return { item: mapActivityForMobile(refreshed!, false, userId) };
  }

  /**
   * Upload bukti dokumentasi lapangan (Link Google Drive) oleh PIC / Anggota.
   */
  async submitDocumentation(activityId: number, userId: number, dto: DocumentationDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, deletedAt: null },
      include: ACTIVITY_INCLUDE,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');

    const isMember =
      (activity.members as any[]).some((m: any) => m.userId === userId) || activity.picId === userId;
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
      const canEdit =
        existingDoc.uploaderId === userId ||
        activity.picId === userId ||
        userObj?.role === 'ADMIN' ||
        (userObj?.role as any) === 'SUPER_ADMIN';
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
}
