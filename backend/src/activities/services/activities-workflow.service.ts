import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityStatus } from '@prisma/client';
import { ACTIVITY_INCLUDE } from '../activities.constants';

@Injectable()
export class ActivitiesWorkflowService {
  constructor(private readonly prisma: PrismaService) {}

  private async appendApprovalHistory(
    activityId: number,
    userId: number,
    stage: string,
    status: string,
    notes?: string,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User tidak ditemukan.');

    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');

    const history = (activity.approvalHistory as any[]) || [];
    const newEntry = {
      stage,
      status,
      userId: user.id,
      fullName: user.fullName,
      role: user.role,
      date: new Date().toISOString(),
      notes: notes || '',
    };

    return this.prisma.activity.update({
      where: { id: activityId },
      data: {
        approvalHistory: [...history, newEntry],
      },
    });
  }

  /**
   * Persetujuan pelaksanaan kegiatan (dari status MENUNGGU_PERSETUJUAN menjadi DISETUJUI).
   */
  async approveExecution(id: number, userId: number) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      include: ACTIVITY_INCLUDE,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');
    if (activity.status !== ActivityStatus.MENUNGGU_PERSETUJUAN) {
      throw new BadRequestException('Kegiatan tidak sedang menunggu persetujuan pelaksanaan.');
    }

    await this.prisma.activity.update({
      where: { id },
      data: { status: ActivityStatus.DISETUJUI },
      include: ACTIVITY_INCLUDE,
    });

    await this.appendApprovalHistory(
      id,
      userId,
      'Persetujuan Pelaksanaan',
      'DISETUJUI',
      'Kegiatan disetujui untuk dilaksanakan.',
    );

    return this.prisma.activity.findUnique({
      where: { id },
      include: ACTIVITY_INCLUDE,
    });
  }

  /**
   * Penolakan pelaksanaan kegiatan dengan alasan tertulis.
   */
  async rejectExecution(id: number, userId: number, notes: string) {
    if (!notes) {
      throw new BadRequestException('Catatan penolakan wajib diisi.');
    }
    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      include: ACTIVITY_INCLUDE,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');
    if (activity.status !== ActivityStatus.MENUNGGU_PERSETUJUAN) {
      throw new BadRequestException('Kegiatan tidak sedang menunggu persetujuan pelaksanaan.');
    }

    await this.prisma.activity.update({
      where: { id },
      data: { status: ActivityStatus.DITOLAK },
      include: ACTIVITY_INCLUDE,
    });

    await this.appendApprovalHistory(
      id,
      userId,
      'Persetujuan Pelaksanaan',
      'DITOLAK',
      notes,
    );

    return this.prisma.activity.findUnique({
      where: { id },
      include: ACTIVITY_INCLUDE,
    });
  }

  /**
   * Verifikasi kelengkapan syarat kegiatan (PIC check-in, seluruh anggota hadir,
   * link Google Drive dokumentasi diunggah, dan peralatan operasional sudah dikembalikan).
   */
  async submitVerification(id: number, userId: number, notes?: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      include: ACTIVITY_INCLUDE,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');

    // Cek kelengkapan syarat
    const members = activity.members || [];
    const hasPic = members.some((m) => m.userId === activity.picId && m.checkInTime);
    const allMembersCheckIn = members.length > 0 && members.every((m) => m.checkInTime);
    const hasDriveLink = activity.media.some((m) => m.fileType === 'application/link');

    // Cek peminjaman alat yang belum selesai
    const activeLoans = await this.prisma.equipmentLoan.findMany({
      where: { activityId: id, status: { not: 'SELESAI' }, deletedAt: null },
    });
    const toolsReturned = activeLoans.length === 0;

    if (!hasPic || !allMembersCheckIn || !hasDriveLink || !toolsReturned) {
      let missingMsg = 'Belum dapat diajukan karena masih terdapat data yang belum lengkap:';
      if (!hasPic) missingMsg += ' PIC belum check-in.';
      if (!allMembersCheckIn) missingMsg += ' Beberapa anggota belum check-in.';
      if (!hasDriveLink) missingMsg += ' Link Google Drive belum diupload.';
      if (!toolsReturned) missingMsg += ' Beberapa peralatan belum dikembalikan.';
      throw new BadRequestException(missingMsg);
    }

    await this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.MENUNGGU_PERSETUJUAN_AKHIR,
      },
      include: ACTIVITY_INCLUDE,
    });

    await this.appendApprovalHistory(
      id,
      userId,
      'Verifikasi Kelengkapan',
      'MENUNGGU_PERSETUJUAN_AKHIR',
      notes || 'Semua persyaratan kegiatan telah lengkap.',
    );

    return this.prisma.activity.findUnique({
      where: { id },
      include: ACTIVITY_INCLUDE,
    });
  }

  /**
   * Persetujuan akhir (kegiatan selesai resmi / terverifikasi oleh Kepala Humas).
   */
  async approveFinish(id: number, userId: number, notes?: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      include: ACTIVITY_INCLUDE,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');
    if (activity.status !== ActivityStatus.MENUNGGU_PERSETUJUAN_AKHIR) {
      throw new BadRequestException('Kegiatan tidak sedang menunggu persetujuan akhir.');
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.SELESAI,
        validatedById: userId,
        validatedAt: new Date(),
        validationNotes: notes || 'Kegiatan selesai disetujui oleh Kepala Humas.',
      },
      include: ACTIVITY_INCLUDE,
    });

    await this.appendApprovalHistory(
      id,
      userId,
      'Persetujuan Akhir',
      'SELESAI',
      notes || 'Kegiatan selesai disetujui oleh Kepala Humas.',
    );

    // Kirim notifikasi ke seluruh anggota kegiatan
    const allMemberIds = [
      updated.picId,
      ...(updated.members as any[]).map((m: any) => m.userId),
    ].filter((uid, idx, arr) => arr.indexOf(uid) === idx);

    for (const uid of allMemberIds) {
      await this.prisma.notification.create({
        data: {
          userId: uid,
          title: 'Kegiatan Selesai & Terverifikasi',
          message: `Kegiatan "${updated.title}" telah disetujui selesai oleh Kepala Humas.`,
          type: 'SUCCESS',
        },
      });
    }

    return this.prisma.activity.findUnique({
      where: { id },
      include: ACTIVITY_INCLUDE,
    });
  }

  /**
   * Pengembalian kegiatan ke tahap revisi / catatan perbaikan.
   */
  async returnRevision(id: number, userId: number, notes: string) {
    if (!notes) {
      throw new BadRequestException('Catatan perbaikan wajib diisi.');
    }
    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
      include: ACTIVITY_INCLUDE,
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');
    if (
      activity.status !== ActivityStatus.MENUNGGU_PERSETUJUAN_AKHIR &&
      activity.status !== ActivityStatus.MENUNGGU_VERIFIKASI
    ) {
      throw new BadRequestException('Kegiatan tidak sedang dalam tahap verifikasi atau persetujuan.');
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        status: ActivityStatus.DIKEMBALIKAN,
      },
      include: ACTIVITY_INCLUDE,
    });

    await this.appendApprovalHistory(
      id,
      userId,
      'Persetujuan Akhir',
      'DIKEMBALIKAN',
      notes,
    );

    // Notifikasi ke PIC
    await this.prisma.notification.create({
      data: {
        userId: updated.picId,
        title: 'Kegiatan Dikembalikan untuk Perbaikan',
        message: `Kegiatan "${updated.title}" dikembalikan oleh Kepala Humas: ${notes}`,
        type: 'WARNING',
      },
    });

    return this.prisma.activity.findUnique({
      where: { id },
      include: ACTIVITY_INCLUDE,
    });
  }
}
