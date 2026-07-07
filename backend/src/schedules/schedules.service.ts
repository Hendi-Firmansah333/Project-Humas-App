import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  private async syncStatus() {
    const schedules = await this.prisma.dutySchedule.findMany({
      where: {
        status: { in: ['AKAN_DATANG', 'SEDANG_BERLANGSUNG'] },
      },
    });

    const now = new Date();

    for (const s of schedules) {
      let currentStatus = s.status;

      const scheduleDate = new Date(s.date);
      const startParts = s.startTime.split(':');
      const endParts = s.endTime.split(':');

      const startDateTime = new Date(scheduleDate);
      startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);

      const endDateTime = new Date(scheduleDate);
      endDateTime.setHours(parseInt(endParts[0] || '23', 10), parseInt(endParts[1] || '59', 10), 59, 999);

      if (now > endDateTime) {
        currentStatus = 'SELESAI';
      } else if (now >= startDateTime && now <= endDateTime) {
        currentStatus = 'SEDANG_BERLANGSUNG';
      } else {
        currentStatus = 'AKAN_DATANG';
      }

      if (currentStatus !== s.status) {
        await this.prisma.dutySchedule.update({
          where: { id: s.id },
          data: { status: currentStatus },
        });
      }
    }
  }

  async checkConflict(userId: number, date: string | Date, startTime: string, endTime: string, excludeId?: number) {
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sameDaySchedules = await this.prisma.dutySchedule.findMany({
      where: {
        userId,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
        id: excludeId ? { not: excludeId } : undefined,
      },
    });

    const toMinutes = (timeStr: string) => {
      const parts = timeStr.split(':').map(Number);
      const h = parts[0] ?? 0;
      const m = parts[1] ?? 0;
      return h * 60 + m;
    };

    const newStart = toMinutes(startTime);
    const newEnd = toMinutes(endTime);

    for (const schedule of sameDaySchedules) {
      const existStart = toMinutes(schedule.startTime);
      const existEnd = toMinutes(schedule.endTime);

      if (newStart < existEnd && newEnd > existStart) {
        return true; // Overlap detected
      }
    }

    return false;
  }

  async create(dto: CreateScheduleDto) {
    // Conflict check
    const hasConflict = await this.checkConflict(dto.userId, dto.date, dto.startTime, dto.endTime);
    if (hasConflict) {
      throw new BadRequestException('Jadwal piket bentrok! Anggota sudah memiliki jadwal piket lain pada waktu yang sama.');
    }

    // Determine initial status
    const targetDate = new Date(dto.date);
    const now = new Date();
    const startParts = dto.startTime.split(':');
    const startDateTime = new Date(targetDate);
    startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);

    const endParts = dto.endTime.split(':');
    const endDateTime = new Date(targetDate);
    endDateTime.setHours(parseInt(endParts[0] || '23', 10), parseInt(endParts[1] || '59', 10), 59, 999);

    let initialStatus = 'AKAN_DATANG';
    if (now > endDateTime) {
      initialStatus = 'SELESAI';
    } else if (now >= startDateTime && now <= endDateTime) {
      initialStatus = 'SEDANG_BERLANGSUNG';
    }

    const schedule = await this.prisma.dutySchedule.create({
      data: {
        userId: dto.userId,
        date: targetDate,
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location || 'Kantor Humas',
        notes: dto.notes,
        status: initialStatus,
      },
      include: {
        user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });

    await this.prisma.notification.create({
      data: {
        title: 'Jadwal Piket Baru',
        message: `Jadwal piket ditetapkan untuk ${schedule.user.fullName} pada tanggal ${dto.date.split('T')[0]}.`,
        type: 'INFO',
      },
    });

    return schedule;
  }

  async findAll(options?: {
    userId?: number;
    search?: string;
    status?: string;
    day?: string;
    month?: number;
    year?: number;
  }) {
    await this.syncStatus();

    const where: any = {
      deletedAt: null,
    };

    if (options?.userId) {
      where.userId = Number(options.userId);
    }

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.search) {
      where.OR = [
        { user: { fullName: { contains: options.search, mode: 'insensitive' } } },
        { location: { contains: options.search, mode: 'insensitive' } },
        { notes: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    // Month & Year filters
    const dateFilter: any = {};
    if (options?.year || options?.month) {
      const year = options.year || new Date().getFullYear();
      let start: Date;
      let end: Date;
      if (options.month) {
        start = new Date(year, options.month - 1, 1);
        end = new Date(year, options.month, 0, 23, 59, 59, 999);
      } else {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59, 999);
      }
      dateFilter.gte = start;
      dateFilter.lte = end;
      where.date = dateFilter;
    }

    let schedules = await this.prisma.dutySchedule.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
      orderBy: { date: 'asc' },
    });

    // Filter by day (Hari) name in Indonesian
    if (options?.day) {
      const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const targetDay = options.day.trim().toLowerCase();
      schedules = schedules.filter((s) => {
        const d = new Date(s.date);
        const dayName = dayNames[d.getDay()].toLowerCase();
        return dayName === targetDay;
      });
    }

    return schedules;
  }

  async findOne(id: number) {
    await this.syncStatus();

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
    const existing = await this.findOne(id);

    const userId = dto.userId !== undefined ? dto.userId : existing.userId;
    const date = dto.date !== undefined ? dto.date : existing.date;
    const startTime = dto.startTime !== undefined ? dto.startTime : existing.startTime;
    const endTime = dto.endTime !== undefined ? dto.endTime : existing.endTime;

    // Conflict check
    const hasConflict = await this.checkConflict(userId, date, startTime, endTime, id);
    if (hasConflict) {
      throw new BadRequestException('Jadwal piket bentrok! Anggota sudah memiliki jadwal piket lain pada waktu yang sama.');
    }

    return this.prisma.dutySchedule.update({
      where: { id },
      data: {
        userId: dto.userId,
        date: dto.date ? new Date(dto.date) : undefined,
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: dto.location,
        notes: dto.notes,
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
