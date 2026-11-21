import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Role, ActivityStatus } from '@prisma/client';
import { mapTeamMemberFromLocation } from '../common/mappers/mobile.mapper';
import { RealtimeEventsService } from '../events/realtime-events.service';

@Injectable()
export class LiveLocationService {
  constructor(
    private prisma: PrismaService,
    private eventsService: RealtimeEventsService,
  ) {}

  async findAll(userOrMobile?: { id: number; role: Role } | boolean, mobileParam = false) {
    let user: { id: number; role: Role } | undefined;
    let isMobileRequest = mobileParam;

    if (typeof userOrMobile === 'boolean') {
      isMobileRequest = userOrMobile;
    } else if (userOrMobile && typeof userOrMobile === 'object') {
      user = userOrMobile;
    }

    const where: any = {
      deletedAt: null,
      user: {
        role: Role.USER,
        deletedAt: null,
      },
    };

    const locations = await this.prisma.location.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            username: true,
            roleLabel: true,
            avatar: true,
            phone: true,
            status: true,
            role: true,
          },
        },
      },
    });

    const now = new Date();
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    // Fetch all today's active activities once to eliminate N+1 DB queries
    const todayActivities =
      locations.length > 0
        ? await this.prisma.activity.findMany({
            where: {
              deletedAt: null,
              status: {
                in: [ActivityStatus.DISETUJUI, ActivityStatus.DITUGASKAN, ActivityStatus.SEDANG_BERLANGSUNG],
              },
              date: { gte: todayStart, lte: todayEnd },
            },
            select: {
              id: true,
              title: true,
              date: true,
              location: true,
              status: true,
              picId: true,
              members: { select: { userId: true } },
            },
          })
        : [];

    const enhancedLocations = locations.map((loc) => {
      const timeDiff = now.getTime() - new Date(loc.updatedAt).getTime();
      const isOnline = timeDiff <= FIFTEEN_MINUTES_MS && loc.isOnline;

      const currentActivity = todayActivities.find(
        (a) => a.picId === loc.userId || a.members.some((m) => m.userId === loc.userId),
      );

      let activityAssignment: any = null;
      if (currentActivity) {
        activityAssignment = {
          id: currentActivity.id,
          title: currentActivity.title,
          date: currentActivity.date,
          location: currentActivity.location,
          status: currentActivity.status,
          userRoleInActivity: currentActivity.picId === loc.userId ? 'PIC' : 'Anggota',
        };
      }

      return {
        ...loc,
        isOnline,
        updatedAtFormatted: loc.updatedAt,
        currentActivity: activityAssignment,
      };
    });

    // Role Enforcement (Opsi A): USER melihat lokasinya sendiri + rekan yang sedang aktif/online (15 menit terakhir)
    const visibleLocations =
      user?.role === Role.USER
        ? enhancedLocations.filter((loc) => (loc.userId ?? loc.user?.id) === user.id || loc.isOnline)
        : enhancedLocations;

    if (isMobileRequest) {
      return { items: visibleLocations.map(mapTeamMemberFromLocation) };
    }

    return visibleLocations;
  }

  async updateLocation(userId: number, dto: UpdateLocationDto) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      select: { id: true, role: true },
    });

    if (!user || user.role !== Role.USER) {
      throw new ForbiddenException('Admin Humas dan Kepala Humas tidak dapat membagikan atau muncul di Live Location.');
    }

    const updated = await this.prisma.location.upsert({
      where: { userId },
      update: {
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        distance: dto.distance,
        isOnline: dto.isOnline !== undefined ? dto.isOnline : true,
      },
      create: {
        userId,
        latitude: dto.latitude,
        longitude: dto.longitude,
        address: dto.address,
        distance: dto.distance,
        isOnline: dto.isOnline !== undefined ? dto.isOnline : true,
      },
      include: {
        user: {
          select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true, phone: true },
        },
      },
    });
    this.eventsService.emit('teamLocations', 'synced', userId);
    return updated;
  }
}