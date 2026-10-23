import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContentPlanDto } from './dto/create-content-plan.dto';
import { UpdateContentPlanDto } from './dto/update-content-plan.dto';
import { SubmitProofDto } from './dto/submit-proof.dto';
import { ContentStatus, Platform, Role } from '@prisma/client';
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

  async create(dto: CreateContentPlanDto, userId?: number) {
    const { deadline, category: _ignoredCategory, ...data } = dto as any;
    const plan = await this.prisma.contentPlan.create({
      data: {
        ...data,
        deadline: new Date(deadline),
        status: data.status || ContentStatus.DITUGASKAN,
      },
      include: this.include,
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'CREATE_CONTENT_PLAN',
          entity: 'ContentPlan',
          entityId: String(plan.id),
          newValue: JSON.stringify({ title: plan.title, platform: plan.platform, picId: plan.picId }),
        },
      });
    }

    if (plan.picId) {
      await this.prisma.notification.create({
        data: {
          userId: plan.picId,
          title: 'Tugas Content Plan Baru',
          message: `Kamu telah ditugaskan untuk Content Plan "${dto.title}" pada platform ${dto.platform}.`,
          type: 'INFO',
        },
      });
    }

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
    role?: Role;
  }) {
    const { page, pageSize, skip, take } = parsePagination(query);

    const statusFilter = query.status
      ? { status: query.status }
      : query.history
        ? { status: { in: [ContentStatus.PUBLISHED, ContentStatus.SELESAI, ContentStatus.DIBATALKAN] } }
        : {
            status: {
              in: [
                ContentStatus.DRAFT,
                ContentStatus.DITUGASKAN,
                ContentStatus.DALAM_PENGERJAAN,
                ContentStatus.MENUNGGU_VERIFIKASI_ADMIN,
                ContentStatus.REVISI,
                ContentStatus.MENUNGGU_PERSETUJUAN_KEPALA_HUMAS,
                ContentStatus.DISETUJUI,
                ContentStatus.MENUNGGU,
                ContentStatus.PROSES,
              ],
            },
          };

    const isUserRole = query.role === Role.USER || query.mobile;

    const where: any = {
      deletedAt: null,
      ...statusFilter,
      platform: query.platform || undefined,
      picId: isUserRole && query.userId ? query.userId : undefined,
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

  async update(id: number, dto: UpdateContentPlanDto, userId?: number, userRole?: Role) {
    const existing = await this.findOneRaw(id);

    // If role is USER (PIC), they can only update their own content
    if (userRole === Role.USER && existing.picId !== userId) {
      throw new ForbiddenException('Anda hanya dapat mengubah konten yang ditugaskan kepada Anda.');
    }

    const { deadline, revisionNote, adminNotes, category: _ignoredCategory, ...data } = dto as any;

    const updateData: Record<string, unknown> = {
      ...data,
      deadline: deadline ? new Date(deadline) : undefined,
    };

    if (revisionNote !== undefined) {
      updateData.revisionNote = revisionNote;
    }
    if (adminNotes !== undefined) {
      updateData.adminNotes = adminNotes;
    }

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: updateData,
      include: this.include,
    });

    return updated;
  }

  // ── WORKFLOW 1: PIC Mulai Kerjakan ─────────────────────────────
  async startProgress(id: number, userId: number, userRole: Role) {
    const plan = await this.findOneRaw(id);
    if (userRole === Role.USER && plan.picId !== userId) {
      throw new ForbiddenException('Hanya PIC yang ditugaskan yang dapat memulai pengerjaan konten.');
    }

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: {
        status: ContentStatus.DALAM_PENGERJAAN,
      },
      include: this.include,
    });

    return updated;
  }

  // ── WORKFLOW 2: PIC Simpan Draft / Kirim untuk Review ────────
  async submitWork(
    id: number,
    userId: number,
    dto: { videoUrl?: string; draftUrl?: string; thumbnailUrl?: string; caption?: string; sendToReview?: boolean },
    userRole: Role,
  ) {
    const plan = await this.findOneRaw(id);
    if (userRole === Role.USER && plan.picId !== userId) {
      throw new ForbiddenException('Hanya PIC yang ditugaskan yang dapat mengirimkan hasil konten.');
    }

    const isSendingReview = dto.sendToReview !== false; // Default true if not explicitly false
    const now = new Date();

    if (isSendingReview) {
      if (!dto.caption?.trim() && !plan.description?.trim()) {
        throw new BadRequestException('Caption / copywriting wajib diisi sebelum mengirim untuk review.');
      }
      if (!dto.videoUrl?.trim() && !dto.draftUrl?.trim() && !plan.videoUrl?.trim() && !plan.draftUrl?.trim()) {
        throw new BadRequestException('Link Google Drive / hasil konten wajib diisi sebelum mengirim untuk review.');
      }
    }

    const nextStatus = isSendingReview
      ? ContentStatus.MENUNGGU_VERIFIKASI_ADMIN
      : (plan.status === ContentStatus.REVISI ? ContentStatus.REVISI : ContentStatus.DALAM_PENGERJAAN);

    const updateData: Record<string, unknown> = {
      status: nextStatus,
      submittedAt: isSendingReview ? now : plan.submittedAt,
    };

    if (dto.videoUrl !== undefined) updateData.videoUrl = dto.videoUrl;
    if (dto.draftUrl !== undefined) updateData.draftUrl = dto.draftUrl;
    if (dto.thumbnailUrl !== undefined) updateData.thumbnailUrl = dto.thumbnailUrl;
    if (dto.caption !== undefined) updateData.description = dto.caption;

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: updateData,
      include: this.include,
    });

    // Save link to media table if videoUrl or draftUrl is supplied
    const fileUrl = dto.videoUrl || dto.draftUrl;
    if (fileUrl) {
      await this.prisma.media.create({
        data: {
          fileName: 'Hasil Konten / Drive',
          fileUrl,
          fileType: 'application/link',
          uploaderId: userId,
          contentPlanId: id,
        },
      });
    }

    if (isSendingReview) {
      await this.prisma.notification.create({
        data: {
          title: 'Hasil Konten Siap Diverifikasi Admin',
          message: `PIC ${plan.pic?.fullName || 'Kreator'} telah mengirimkan hasil konten "${plan.title}" untuk diverifikasi oleh Admin Humas.`,
          type: 'INFO',
        },
      });
    }

    return updated;
  }

  // ── WORKFLOW 3: Admin Humas Verifikasi Lengkap & Ajukan ke Kepala Humas ─
  async verifyAndSendToHead(id: number, userId: number, adminNotes?: string) {
    const plan = await this.findOneRaw(id);

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: {
        status: ContentStatus.MENUNGGU_PERSETUJUAN_KEPALA_HUMAS,
        adminNotes: adminNotes || plan.adminNotes || 'Verifikasi lengkap oleh Admin Humas.',
      },
      include: this.include,
    });

    await this.prisma.notification.create({
      data: {
        title: 'Persetujuan Content Plan Diperlukan',
        message: `Konten "${plan.title}" telah diverifikasi lengkap oleh Admin dan menunggu persetujuan Kepala Humas.`,
        type: 'INFO',
      },
    });

    return updated;
  }

  // Backward compatibility alias for sendReview
  async sendReview(id: number, userId: number, adminNotes?: string) {
    return this.verifyAndSendToHead(id, userId, adminNotes);
  }

  // ── WORKFLOW 4: Admin Humas Minta Perbaikan ke PIC ───────────
  async requestFix(id: number, userId: number, notes: string) {
    if (!notes?.trim()) {
      throw new BadRequestException('Catatan perbaikan wajib diisi.');
    }
    const plan = await this.findOneRaw(id);

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: {
        status: ContentStatus.REVISI,
        revisionNote: notes,
      },
      include: this.include,
    });

    if (plan.picId) {
      await this.prisma.notification.create({
        data: {
          userId: plan.picId,
          title: 'Perbaikan Hasil Konten (Admin)',
          message: `Admin meminta perbaikan pada konten "${plan.title}": "${notes}".`,
          type: 'WARNING',
        },
      });
    }

    return updated;
  }

  // ── WORKFLOW 5: Kepala Humas Menyetujui Konten (Final Approval) ─
  async approve(id: number, userId: number) {
    const plan = await this.findOneRaw(id);

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: {
        status: ContentStatus.DISETUJUI,
      },
      include: this.include,
    });

    if (plan.picId) {
      await this.prisma.notification.create({
        data: {
          userId: plan.picId,
          title: 'Konten Telah Disetujui',
          message: `Konten "${plan.title}" telah disetujui oleh Kepala Humas dan siap dijadwalkan / tayang.`,
          type: 'SUCCESS',
        },
      });
    }

    return updated;
  }

  // ── WORKFLOW 6: Kepala Humas Meminta Revisi ────────────────────
  async requestRevision(id: number, userId: number, notes: string) {
    if (!notes?.trim()) {
      throw new BadRequestException('Catatan revisi wajib diisi.');
    }
    const plan = await this.findOneRaw(id);

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: {
        status: ContentStatus.REVISI,
        revisionNote: notes,
      },
      include: this.include,
    });

    if (plan.picId) {
      await this.prisma.notification.create({
        data: {
          userId: plan.picId,
          title: 'Permintaan Revisi Konten (Kepala Humas)',
          message: `Kepala Humas meminta revisi untuk konten "${plan.title}": "${notes}".`,
          type: 'WARNING',
        },
      });
    }

    return updated;
  }

  // ── WORKFLOW 7: Publikasikan Konten (Sudah Tayang) ─────────────
  async publish(id: number, userId: number) {
    const plan = await this.findOneRaw(id);

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: {
        status: ContentStatus.PUBLISHED,
      },
      include: this.include,
    });

    await this.prisma.notification.create({
      data: {
        title: 'Konten Telah Tayang',
        message: `Konten "${plan.title}" telah berhasil dipublikasikan pada platform ${plan.platform}.`,
        type: 'SUCCESS',
      },
    });

    return updated;
  }

  // ── WORKFLOW 8: Batalkan Konten ────────────────────────────────
  async cancel(id: number, userId: number) {
    const plan = await this.findOneRaw(id);

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: {
        status: ContentStatus.DIBATALKAN,
      },
      include: this.include,
    });

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

  async submitProof(id: number, dto: SubmitProofDto, userId?: number) {
    const plan = await this.findOneRaw(id);

    if (plan.status === ContentStatus.PUBLISHED || plan.status === ContentStatus.SELESAI) {
      throw new BadRequestException('Konten sudah dipublikasikan.');
    }

    const poster = this.normalizePosterUrl(dto.posterPath);
    const now = new Date();
    const isSendingReview = dto.sendToReview !== false;

    if (isSendingReview) {
      if (!dto.caption?.trim() && !plan.description?.trim()) {
        throw new BadRequestException('Caption / copywriting wajib diisi sebelum mengirim untuk review.');
      }
      if (!dto.videoLink?.trim() && !plan.videoUrl?.trim() && !plan.draftUrl?.trim()) {
        throw new BadRequestException('Link Google Drive / hasil konten wajib diisi sebelum mengirim untuk review.');
      }
    }

    const nextStatus = isSendingReview
      ? ContentStatus.MENUNGGU_VERIFIKASI_ADMIN
      : (plan.status === ContentStatus.REVISI ? ContentStatus.REVISI : ContentStatus.DALAM_PENGERJAAN);

    const updateData: Record<string, unknown> = {
      videoUrl: dto.videoLink ?? plan.videoUrl,
      thumbnailUrl: poster ?? plan.thumbnailUrl,
      description: dto.caption !== undefined ? dto.caption : plan.description,
      status: nextStatus,
      submittedAt: isSendingReview ? now : plan.submittedAt,
    };

    const updated = await this.prisma.contentPlan.update({
      where: { id },
      data: updateData,
      include: this.include,
    });

    if (dto.videoLink) {
      await this.prisma.media.create({
        data: {
          fileName: dto.videoFileName || 'Hasil Konten / Drive',
          fileUrl: dto.videoLink,
          fileType: 'application/link',
          uploaderId: userId || plan.picId,
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
      data: { status: ContentStatus.DITUGASKAN, deletedAt: null },
      include: this.include,
    });
  }
}