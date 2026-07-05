import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { buildPaginatedResult, parsePagination } from '../common/utils/pagination.util';
import { mapNotificationForMobile } from '../common/mappers/mobile.mapper';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  private buildWhere(userId: number, filter?: string, search?: string) {
    const readFilter =
      filter === 'Belum Dibaca'
        ? { isRead: false }
        : filter === 'Sudah Dibaca'
          ? { isRead: true }
          : {};

    return {
      deletedAt: null,
      OR: [{ userId }, { userId: null }],
      ...readFilter,
      AND: search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' as const } },
              { message: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : undefined,
    };
  }

  async findAllForUser(
    userId: number,
    query: { page?: number; pageSize?: number; filter?: string; search?: string; mobile?: boolean },
  ) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const where = this.buildWhere(userId, query.filter, query.search);

    const [rows, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notification.count({ where }),
    ]);

    const items = query.mobile ? rows.map(mapNotificationForMobile) : rows;
    return buildPaginatedResult<typeof items[number]>(items, total, page, pageSize);
  }

  async markAsRead(id: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, deletedAt: null, OR: [{ userId }, { userId: null }] },
    });
    if (!notification) throw new NotFoundException('Notifikasi tidak ditemukan.');

    await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { message: 'Notifikasi ditandai sudah dibaca.' };
  }

  async markAllAsRead(userId: number) {
    await this.prisma.notification.updateMany({
      where: { deletedAt: null, OR: [{ userId }, { userId: null }], isRead: false },
      data: { isRead: true },
    });
    return { message: 'Semua notifikasi ditandai sudah dibaca.' };
  }

  async remove(id: number, userId: number) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, deletedAt: null, OR: [{ userId }, { userId: null }] },
    });
    if (!notification) throw new NotFoundException('Notifikasi tidak ditemukan.');

    await this.prisma.notification.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Notifikasi berhasil dihapus.' };
  }
}