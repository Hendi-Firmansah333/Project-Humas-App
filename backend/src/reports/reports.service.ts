import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReportDto } from './dto/create-report.dto';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReportDto) {
    return this.prisma.report.create({
      data: {
        title: dto.title,
        category: dto.category || 'Kegiatan',
        date: new Date(dto.date),
        picId: dto.picId,
        status: dto.status || 'Selesai',
      },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });
  }

  async findAll(category?: string, search?: string) {
    return this.prisma.report.findMany({
      where: {
        category: category || undefined,
        OR: search
          ? [
              { title: { contains: search } },
              { pic: { fullName: { contains: search } } },
            ]
          : undefined,
      },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: number) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      include: {
        pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
      },
    });

    if (!report) {
      throw new NotFoundException(`Laporan dengan ID #${id} tidak ditemukan.`);
    }
    return report;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.report.delete({ where: { id } });
    return { message: `Laporan ID #${id} berhasil dihapus.` };
  }
}
