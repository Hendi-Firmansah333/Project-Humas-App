import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentPlanDto } from './dto/create-content-plan.dto';
import { UpdateContentPlanDto } from './dto/update-content-plan.dto';
import { SubmitProofDto } from './dto/submit-proof.dto';
import { ContentStatus, Platform } from '@prisma/client';
import { buildPaginatedResult, parsePagination } from '../common/utils/pagination.util';
import { mapContentPlanForMobile } from '../common/mappers/mobile.mapper';

@Injectable()
export class ContentPlansService {
  constructor(private prisma: PrismaService) {}

  private include = {
    pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
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
        uploader: { select: { id: true, fullName: true, avatar: true } },
      },
    },
  };

  async create(dto: CreateContentPlanDto) {
    // Strip 'category' — no longer used
    const { deadline, category: _ignoredCategory, ...data } = dto as any;
    const plan = await this.prisma.contentPlan.create({
      data: { ...data, deadline: new Date(deadline) },
      include: this.include,
    });

    await this.prisma.notification.create({
      data: {
        title: 'Content Plan Baru',
        message: `Content plan baru "${dto.title}" telah dibuat untuk platform ${dto.platform}.`,
        type: 'INFO',
      },
    });

    return plan;
  }

  async findAllPaginated(query: {
    page?: number;
    pageSize?: number;
    platform?: Platform;
    status?: ContentStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
    month?: number;
    year?: number;
    history?: boolean;
    mobile?: boolean;
    userId?: number;
  }) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const statusFilter = query.status
      ? { status: query.status }
      : query.history
        ? { status: { in: [ContentStatus.PUBLISHED, ContentStatus.SELESAI, ContentStatus.DIBATALKAN] } }
        : { status: { in: [ContentStatus.DRAFT, ContentStatus.MENUNGGU, ContentStatus.PROSES, ContentStatus.REVISI] } };

    const where: any = {
      deletedAt: null,
      ...statusFilter,
      platform: query.platform || undefined,
      picId: query.mobile && query.userId ? query.userId : undefined,
    };

    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' as const } },
        { description: { contains: query.search, mode: 'insensitive' as const } },
        { pic: { fullName: { contains: query.search, mode: 'insensitive' as const } } },
      ];
    }

    const dateFilter: any = {};
    if (query.startDate) {
      dateFilter.gte = new Date(query.startDate);
    }
    if (query.endDate) {
      const end = new Date(query.endDate);
      if (query.endDate.length <= 10) {
        end.setHours(23, 59, 59, 999);
      }
      dateFilter.lte = end;
    }

    if (query.month || query.year) {
      const year = query.year || new Date().getFullYear();
      let start: Date;
      let end: Date;
      if (query.month) {
        start = new Date(year, query.month - 1, 1);
        end = new Date(year, query.month, 0, 23, 59, 59, 999);
      } else {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59, 999);
      }
      dateFilter.gte = start;
      dateFilter.lte = end;
    }

    if (Object.keys(dateFilter).length > 0) {
      where.deadline = dateFilter;
    }

    const [rows, total] = await Promise.all([
      this.prisma.contentPlan.findMany({
        where,
        include: this.include,
        orderBy: { deadline: 'asc' },
        skip,
        take,
      }),
      this.prisma.contentPlan.count({ where }),
    ]);

    const items = query.mobile ? rows.map(mapContentPlanForMobile) : rows;
    return buildPaginatedResult<typeof items[number]>(items, total, page, pageSize);
  }

  private async findOneRaw(id: number) {
    const plan = await this.prisma.contentPlan.findFirst({
      where: { id, deletedAt: null },
      include: this.include,
    });
    if (!plan) throw new NotFoundException(`Rencana konten dengan ID #${id} tidak ditemukan.`);
    return plan;
  }

  async findOne(id: number, mobile = false) {
    const plan = await this.findOneRaw(id);
    return mobile ? mapContentPlanForMobile(plan) : plan;
  }

  async update(id: number, dto: UpdateContentPlanDto) {
    const existing = await this.findOneRaw(id);
    const { deadline, revisionNote, category: _ignoredCategory, ...data } = dto as any;

    const updateData: Record<string, unknown> = {
      ...data,
      deadline: deadline ? new Date(deadline) : undefined,
    };

    if (revisionNote !== undefined) {
      updateData.revisionNote = revisionNote;
    }

    if (data.status === ContentStatus.REVISI) {
      updateData.submittedAt = null;
      updateData.videoUrl = null;
    }

    if (data.status === ContentStatus.SELESAI && !existing.submittedAt && existing.videoUrl) {
      updateData.submittedAt = new Date();
    }

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: updateData,
      include: this.include,
    });

    if (data.status === ContentStatus.PUBLISHED || data.status === ContentStatus.SELESAI) {
      await this.prisma.notification.create({
        data: {
          title: 'Content Plan Selesai',
          message: `Konten "${updated.title}" telah selesai/dipublikasikan pada platform ${updated.platform}.`,
          type: 'SUCCESS',
        },
      });
    }

    return updated;
  }

  async remove(id: number) {
    await this.findOneRaw(id);
    await this.prisma.contentPlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: `Rencana konten ID #${id} berhasil dihapus.` };
  }

  async submitProof(id: number, dto: SubmitProofDto) {
    const plan = await this.findOneRaw(id);

    if (plan.status === ContentStatus.SELESAI) {
      throw new BadRequestException(
        'Konten sudah disetujui admin. Tidak dapat mengirim ulang kecuali admin meminta revisi.',
      );
    }

    if (plan.status === ContentStatus.PROSES && plan.videoUrl) {
      throw new BadRequestException(
        'Bukti sudah dikirim dan menunggu review admin. Tunggu persetujuan atau permintaan revisi.',
      );
    }

    if (plan.status === ContentStatus.DIBATALKAN) {
      throw new BadRequestException(
        'Konten dibatalkan admin. Hubungi admin humas untuk membuka kembali penugasan.',
      );
    }

    const poster = this.normalizePosterUrl(dto.posterPath);
    const now = new Date();

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: {
        videoUrl: dto.videoLink,
        thumbnailUrl: poster ?? plan.thumbnailUrl,
        status: ContentStatus.PROSES,
        submittedAt: now,
        revisionNote: plan.status === ContentStatus.REVISI ? null : plan.revisionNote,
      },
      include: this.include,
    });

    // Save to media table for upload history
    if (dto.videoLink) {
      await this.prisma.media.create({
        data: {
          fileName: 'proof-upload',
          fileUrl: dto.videoLink,
          fileType: 'application/link',
          uploaderId: (dto as any).uploaderId || plan.picId,
          contentPlanId: id,
        },
      });
    }

    return { item: mapContentPlanForMobile(updated) };
  }

  private normalizePosterUrl(posterPath?: string | null) {
    if (!posterPath?.trim()) return undefined;
    const value = posterPath.trim();
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:')) {
      return value;
    }
    return undefined;
  }

  async restore(id: number) {
    await this.findOneRaw(id);
    return this.prisma.contentPlan.update({
      where: { id },
      data: { status: ContentStatus.DRAFT },
      include: this.include,
    });
  }
}