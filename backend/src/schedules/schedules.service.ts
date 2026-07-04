import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateScheduleDto) {
    return this.prisma.dutySchedule.create({
      data: {
        userId: dto.userId,
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
      include: {
        user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });
  }

  async findAll(userId?: number) {
    return this.prisma.dutySchedule.findMany({
      where: {
        userId: userId ? Number(userId) : undefined,
      },
      include: {
        user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: number) {
    const schedule = await this.prisma.dutySchedule.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });

    if (!schedule) {
      throw new NotFoundException(`Jadwal piket dengan ID #${id} tidak ditemukan.`);
    }
    return schedule;
  }

  async update(id: number, dto: UpdateScheduleDto) {
    await this.findOne(id);
    return this.prisma.dutySchedule.update({
      where: { id },
      data: {
        userId: dto.userId,
        date: dto.date ? new Date(dto.date) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
      },
      include: {
        user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.dutySchedule.delete({ where: { id } });
    return { message: `Jadwal piket ID #${id} berhasil dihapus.` };
  }
}
