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
  };

  async create(dto: CreateContentPlanDto) {
    const { deadline, ...data } = dto;
    return this.prisma.contentPlan.create({
      data: { ...data, deadline: new Date(deadline) },
      include: this.include,
    });
  }

  async findAllPaginated(query: {
    page?: number;
    pageSize?: number;
    platform?: Platform;
    status?: ContentStatus;
    search?: string;
    mobile?: boolean;
    userId?: number;
  }) {
    const { page, pageSize, skip, take } = parsePagination(query);
    const where = {
      deletedAt: null,
      platform: query.platform || undefined,
      status: query.status || undefined,
      picId: query.mobile && query.userId ? query.userId : undefined,
      OR: query.search
        ? [
            { title: { contains: query.search, mode: 'insensitive' as const } },
            { description: { contains: query.search, mode: 'insensitive' as const } },
          ]
        : undefined,
    };

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
    const { deadline, revisionNote, ...data } = dto;

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

    return this.prisma.contentPlan.update({
      where: { id },
      data: updateData,
      include: this.include,
    });
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

    if (plan.status === ContentStatus.DITOLAK) {
      throw new BadRequestException(
        'Konten ditolak admin. Hubungi admin humas untuk membuka kembali penugasan.',
      );
    }

    const poster = this.normalizePosterUrl(dto.posterPath);

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: {
        videoUrl: dto.videoLink,
        thumbnailUrl: poster ?? plan.thumbnailUrl,
        status: ContentStatus.PROSES,
        submittedAt: new Date(),
        revisionNote: plan.status === ContentStatus.REVISI ? null : plan.revisionNote,
      },
      include: this.include,
    });
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
}