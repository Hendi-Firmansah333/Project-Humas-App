import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLocationDto } from './dto/update-location.dto';
import { Role, ActivityStatus } from '@prisma/client';
import { mapTeamMemberFromLocation } from '../common/mappers/mobile.mapper';

@Injectable()
export class LiveLocationService {
  constructor(private prisma: PrismaService) {}

  async findAll(userOrMobile?: { id: number; role: Role } | boolean, mobileParam = false) {
    let user: { id: number; role: Role } | undefined;
    let isMobileRequest = mobileParam;

    if (typeof userOrMobile === 'boolean') {
      isMobileRequest = userOrMobile;
    } else if (userOrMobile && typeof userOrMobile === 'object') {
      user = userOrMobile;
    }

    const where: any = { deletedAt: null };

    // Role Enforcement: Tim Humas (USER role) can only view their own location
    if (user && user.role === Role.USER) {
      where.userId = user.id;
    }

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

    const enhancedLocations = await Promise.all(
      locations.map(async (loc) => {
        const timeDiff = now.getTime() - new Date(loc.updatedAt).getTime();
        const isOnline = timeDiff <= FIFTEEN_MINUTES_MS && loc.isOnline;

        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

        const currentActivity = await this.prisma.activity.findFirst({
          where: {
            deletedAt: null,
            status: { in: [ActivityStatus.DISETUJUI, ActivityStatus.DITUGASKAN, ActivityStatus.SEDANG_BERLANGSUNG] },
            date: { gte: todayStart, lte: todayEnd },
            OR: [
              { picId: loc.userId },
              { members: { some: { userId: loc.userId } } },
            ],
          },
          select: {
            id: true,
            title: true,
            date: true,
            location: true,
            status: true,
            picId: true,
          },
        });

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
      }),
    );

    if (isMobileRequest) {
      return { items: locations.map(mapTeamMemberFromLocation) };
    }

    return enhancedLocations;
  }

  async updateLocation(userId: number, dto: UpdateLocationDto) {
    return this.prisma.location.upsert({
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
  }
}