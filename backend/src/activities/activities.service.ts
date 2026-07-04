import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { ActivityStatus, CheckInStatus } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateActivityDto) {
    const { memberIds, date, ...data } = dto;

    return this.prisma.activity.create({
      data: {
        ...data,
        date: new Date(date),
        members: memberIds && memberIds.length > 0
          ? {
              create: memberIds.map((userId) => ({
                userId,
                role: 'Petugas Liputan',
                checkInStatus: CheckInStatus.SUCCESS,
              })),
            }
          : undefined,
      },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
          },
        },
      },
    });
  }

  async findAll(status?: ActivityStatus, search?: string) {
    return this.prisma.activity.findMany({
      where: {
        status: status || undefined,
        OR: search
          ? [
              { title: { contains: search } },
              { location: { contains: search } },
              { description: { contains: search } },
            ]
          : undefined,
      },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true, email: true, phone: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException(`Kegiatan dengan ID #${id} tidak ditemukan.`);
    }
    return activity;
  }

  async update(id: number, dto: UpdateActivityDto) {
    await this.findOne(id);
    const { memberIds, date, ...data } = dto;

    return this.prisma.activity.update({
      where: { id },
      data: {
        ...data,
        date: date ? new Date(date) : undefined,
      },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
        members: {
          include: {
            user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.activity.delete({ where: { id } });
    return { message: `Kegiatan ID #${id} berhasil dihapus.` };
  }
}
