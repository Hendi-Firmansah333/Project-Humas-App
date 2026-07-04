import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLocationDto } from './dto/update-location.dto';

@Injectable()
export class LiveLocationService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.location.findMany({
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
          },
        },
      },
    });
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
          select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true },
        },
      },
    });
  }
}
