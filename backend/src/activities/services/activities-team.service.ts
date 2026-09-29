import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ActivityStatus, CheckInStatus } from '@prisma/client';
import { ACTIVITY_INCLUDE, buildMemberCreates } from '../activities.constants';

@Injectable()
export class ActivitiesTeamService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Pastikan PIC terdaftar di daftar anggota kegiatan sebagai 'PIC Lapangan'.
   */
  async syncPicMember(activityId: number, picId: number) {
    const existing = await this.prisma.activityMember.findFirst({
      where: { activityId, userId: picId },
    });
    if (!existing) {
      await this.prisma.activityMember.create({
        data: {
          activityId,
          userId: picId,
          role: 'PIC Lapangan',
          checkInStatus: CheckInStatus.MISSED,
        },
      });
    }
  }

  /**
   * Validasi integritas anggota dan PIC: tidak boleh bentrok PIC merangkap anggota,
   * tidak boleh duplikat, dan keduanya harus memiliki role 'USER'.
   */
  async validateTeam(picId: number, memberIds: number[]) {
    if (memberIds.includes(picId)) {
      throw new BadRequestException('PIC tidak boleh merangkap sebagai anggota kegiatan.');
    }
    const uniqueMembers = new Set(memberIds);
    if (uniqueMembers.size !== memberIds.length) {
      throw new BadRequestException('Daftar anggota tidak boleh berisi anggota duplikat.');
    }

    const picUser = await this.prisma.user.findUnique({ where: { id: picId } });
    if (!picUser) throw new NotFoundException('PIC tidak ditemukan.');
    if (picUser.role !== 'USER') {
      throw new BadRequestException('Hanya pengguna dengan role Anggota yang dapat ditugaskan sebagai PIC.');
    }

    if (memberIds.length > 0) {
      const invalidMembers = await this.prisma.user.findMany({
        where: { id: { in: memberIds }, role: { not: 'USER' } },
        select: { fullName: true },
      });
      if (invalidMembers.length > 0) {
        const names = invalidMembers.map((m) => m.fullName).join(', ');
        throw new BadRequestException(
          `Pengguna berikut bukan Anggota Humas: ${names}. Hanya akun dengan role Anggota yang boleh ditugaskan.`,
        );
      }
    }

    return picUser;
  }

  /**
   * Cek ketersediaan alat dalam jendela waktu kegiatan dan buat peminjaman operasional.
   */
  async allocateEquipment(
    activityId: number,
    activityTitle: string,
    picUser: { id: number; fullName: string; phone?: string | null },
    startDateTime: Date,
    endDateTime: Date,
    equipmentItems: { equipmentId: number; quantity: number }[],
    isUpdate = false,
  ) {
    if (isUpdate) {
      await this.prisma.equipmentLoan.deleteMany({
        where: { activityId, status: 'SEDANG_DIPINJAM' },
      });
    }

    const validItems = equipmentItems.filter((i) => i.quantity > 0);
    if (validItems.length === 0) return;

    for (const eqItem of validItems) {
      const eq = await this.prisma.equipment.findFirst({
        where: { id: eqItem.equipmentId, deletedAt: null },
      });
      if (!eq) throw new NotFoundException(`Alat ID #${eqItem.equipmentId} tidak ditemukan.`);

      const activeOverlapLoans = await this.prisma.equipmentLoan.findMany({
        where: {
          status: { in: ['SEDANG_DIPINJAM', 'TERLAMBAT'] },
          deletedAt: null,
          ...(isUpdate ? { NOT: { activityId } } : {}),
          items: { some: { equipmentId: eqItem.equipmentId } },
        },
        include: {
          activity: true,
          items: { where: { equipmentId: eqItem.equipmentId } },
        },
      });

      let borrowedInWindow = 0;
      for (const oLoan of activeOverlapLoans) {
        let lStart = new Date(oLoan.borrowDate);
        let lEnd = new Date(oLoan.returnDate);
        if (oLoan.activity) {
          const lDate = new Date(oLoan.activity.date);
          const lStartParts = (oLoan.activity.startTime || '08:00').split(':');
          const lEndParts = (oLoan.activity.endTime || '17:00').split(':');
          lStart = new Date(lDate);
          lStart.setHours(parseInt(lStartParts[0] || '0', 10), parseInt(lStartParts[1] || '0', 10), 0, 0);
          lEnd = new Date(lDate);
          lEnd.setHours(parseInt(lEndParts[0] || '23', 10), parseInt(lEndParts[1] || '59', 10), 59, 999);
        }
        if (startDateTime <= lEnd && endDateTime >= lStart) {
          for (const it of oLoan.items) {
            borrowedInWindow += it.quantity - it.returnedQuantity;
          }
        }
      }

      const broken = eq.broken ?? 0;
      const availableInWindow = Math.max(0, eq.total - broken - borrowedInWindow);

      if (eqItem.quantity > availableInWindow) {
        throw new BadRequestException(
          `Alat "${eq.name}" tidak mencukupi untuk jadwal tersebut. Tersedia: ${availableInWindow} unit, Diminta: ${eqItem.quantity} unit.`,
        );
      }
    }

    await this.prisma.equipmentLoan.create({
      data: {
        borrowerName: picUser.fullName,
        borrowerPhone: picUser.phone || '-',
        userId: picUser.id,
        purpose: `Peralatan operasional untuk kegiatan: ${activityTitle}`,
        borrowDate: startDateTime,
        returnDate: endDateTime,
        status: 'SEDANG_DIPINJAM',
        activityId,
        items: {
          create: validItems.map((item) => ({
            equipmentId: item.equipmentId,
            quantity: item.quantity,
            returnedQuantity: 0,
          })),
        },
      },
    });
  }

  /**
   * Penugasan tim kegiatan oleh Admin / Koordinator (menentukan PIC, anggota, dan alat operasional).
   */
  async assignTeam(
    id: number,
    picId: number,
    memberIds: number[],
    equipmentItems?: { equipmentId: number; quantity: number }[],
  ) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, deletedAt: null },
    });
    if (!activity) throw new NotFoundException('Kegiatan tidak ditemukan.');
    if (activity.status !== ActivityStatus.DISETUJUI && activity.status !== ActivityStatus.DITUGASKAN) {
      throw new BadRequestException('Kegiatan harus disetujui terlebih dahulu sebelum penugasan tim.');
    }

    const picUser = await this.validateTeam(picId, memberIds);

    // Update members
    await this.prisma.activityMember.deleteMany({ where: { activityId: id } });
    const memberCreates = buildMemberCreates(memberIds, picId);
    if (memberCreates?.length) {
      await this.prisma.activityMember.createMany({
        data: memberCreates.map((m) => ({ activityId: id, ...m })),
      });
    }

    const actDate = new Date(activity.date);
    const startParts = (activity.startTime || '08:00').split(':');
    const endParts = (activity.endTime || '17:00').split(':');
    const startDateTime = new Date(actDate);
    startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);
    const endDateTime = new Date(actDate);
    endDateTime.setHours(parseInt(endParts[0] || '23', 10), parseInt(endParts[1] || '59', 10), 59, 999);

    if (equipmentItems !== undefined) {
      await this.allocateEquipment(
        id,
        activity.title,
        picUser,
        startDateTime,
        endDateTime,
        equipmentItems,
        true,
      );
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        picId,
        status: ActivityStatus.DITUGASKAN,
      },
      include: ACTIVITY_INCLUDE,
    });

    // Notify PIC
    await this.prisma.notification.create({
      data: {
        userId: picId,
        title: 'Penugasan Sebagai PIC Kegiatan',
        message: `Kamu ditugaskan sebagai PIC pada kegiatan "${updated.title}".`,
        type: 'INFO',
        link: `/kegiatan/${id}`,
      },
    });

    // Notify Members
    for (const mId of memberIds) {
      await this.prisma.notification.create({
        data: {
          userId: mId,
          title: 'Penugasan Anggota Kegiatan',
          message: `Kamu ditugaskan sebagai anggota pada kegiatan "${updated.title}".`,
          type: 'INFO',
          link: `/kegiatan/${id}`,
        },
      });
    }

    return updated;
  }
}
