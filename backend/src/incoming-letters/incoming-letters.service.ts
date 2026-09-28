import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLetterDto } from './dto/create-letter.dto';
import { UpdateLetterDto } from './dto/update-letter.dto';
import { CreateActivityFromLetterDto } from './dto/create-activity-from-letter.dto';
import { ActivityStatus, CheckInStatus } from '@prisma/client';

const letterInclude = {
  createdBy: {
    select: { id: true, fullName: true, role: true },
  },
  activities: {
    where: { deletedAt: null },
    select: { id: true, title: true, status: true, date: true },
  },
};

@Injectable()
export class IncomingLettersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, dto: CreateLetterDto) {
    const letter = await this.prisma.incomingLetter.create({
      data: {
        letterNumber: dto.letterNumber,
        letterDate: new Date(dto.letterDate),
        receivedDate: new Date(dto.receivedDate),
        sender: dto.sender,
        institution: dto.institution,
        subject: dto.subject,
        destination: dto.destination,
        fileUrl: dto.fileUrl || null,
        notes: dto.notes || null,
        status: (!dto.status || dto.status === 'BARU' || dto.status === 'DRAFT' || dto.status === 'MENUNGGU_VERIFIKASI_ADMIN') ? 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' : dto.status,
        eventLocation: dto.eventLocation || null,
        latitude: dto.latitude != null ? Number(dto.latitude) : null,
        longitude: dto.longitude != null ? Number(dto.longitude) : null,
        radius: dto.radius != null ? Number(dto.radius) : 100,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : null,
        startTime: dto.startTime || null,
        endTime: dto.endTime || null,
        createdById: userId,
      },
      include: letterInclude,
    });

    // Create Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_SURAT_MASUK',
        entity: 'IncomingLetter',
        entityId: String(letter.id),
        newValue: JSON.stringify({ letterNumber: letter.letterNumber, subject: letter.subject, institution: letter.institution, eventLocation: letter.eventLocation }),
      },
    });

    return letter;
  }

  async verifyAdmin(id: number, userId: number) {
    const letter = await this.findOne(id);
    if (letter.status !== 'MENUNGGU_VERIFIKASI_ADMIN' && letter.status !== 'BARU' && letter.status !== 'DRAFT') {
      throw new BadRequestException('Surat tidak sedang dalam tahap verifikasi administrasi.');
    }

    if (!letter.eventLocation || !letter.eventLocation.trim()) {
      throw new BadRequestException('Lokasi kegiatan wajib diisi sebelum surat dapat diverifikasi.');
    }
    if (!letter.eventDate) {
      throw new BadRequestException('Tanggal pelaksanaan kegiatan wajib diisi sebelum surat dapat diverifikasi.');
    }
    if (!letter.startTime) {
      throw new BadRequestException('Waktu mulai kegiatan wajib diisi sebelum surat dapat diverifikasi.');
    }

    const updated = await this.prisma.incomingLetter.update({
      where: { id },
      data: {
        status: 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS',
        verifiedById: userId,
        verifiedAt: new Date(),
      },
      include: letterInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'VERIFY_ADMIN_SURAT_MASUK',
        entity: 'IncomingLetter',
        entityId: String(id),
        newValue: JSON.stringify({ status: 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' }),
      },
    });

    return updated;
  }

  async findAll(options?: { search?: string; status?: string }) {
    const where: any = { deletedAt: null };

    if (options?.status) {
      where.status = options.status;
    }

    if (options?.search) {
      where.OR = [
        { letterNumber: { contains: options.search, mode: 'insensitive' } },
        { sender: { contains: options.search, mode: 'insensitive' } },
        { institution: { contains: options.search, mode: 'insensitive' } },
        { subject: { contains: options.search, mode: 'insensitive' } },
        { eventLocation: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.incomingLetter.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: letterInclude,
    });
  }

  async findOne(id: number) {
    const letter = await this.prisma.incomingLetter.findFirst({
      where: { id, deletedAt: null },
      include: letterInclude,
    });
    if (!letter) {
      throw new NotFoundException(`Surat masuk dengan ID #${id} tidak ditemukan.`);
    }
    return letter;
  }

  async update(id: number, userId: number, dto: UpdateLetterDto) {
    const existing = await this.findOne(id);
    if (existing.status !== 'DRAFT' && existing.status !== 'BARU' && existing.status !== 'MENUNGGU_VERIFIKASI_ADMIN') {
      throw new BadRequestException('Surat yang sudah diproses atau disetujui tidak dapat diubah.');
    }

    const updated = await this.prisma.incomingLetter.update({
      where: { id },
      data: {
        letterNumber: dto.letterNumber,
        letterDate: dto.letterDate ? new Date(dto.letterDate) : undefined,
        receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : undefined,
        sender: dto.sender,
        institution: dto.institution,
        subject: dto.subject,
        destination: dto.destination,
        fileUrl: dto.fileUrl,
        notes: dto.notes,
        status: dto.status,
        eventLocation: dto.eventLocation !== undefined ? dto.eventLocation : undefined,
        eventDate: dto.eventDate ? new Date(dto.eventDate) : undefined,
        startTime: dto.startTime !== undefined ? dto.startTime : undefined,
        endTime: dto.endTime !== undefined ? dto.endTime : undefined,
      },
      include: letterInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_SURAT_MASUK',
        entity: 'IncomingLetter',
        entityId: String(id),
        newValue: JSON.stringify(dto),
      },
    });

    return updated;
  }

  async approve(id: number, userId: number) {
    const letter = await this.findOne(id);
    if (letter.status === 'DISETUJUI' || letter.status === 'DITUGASKAN') {
      throw new BadRequestException('Surat sudah disetujui atau ditugaskan sebelumnya.');
    }
    if (letter.status === 'DITOLAK') {
      throw new BadRequestException('Surat yang sudah ditolak tidak dapat disetujui.');
    }

    const updated = await this.prisma.incomingLetter.update({
      where: { id },
      data: { status: 'DISETUJUI' },
      include: letterInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'APPROVE_SURAT_MASUK',
        entity: 'IncomingLetter',
        entityId: String(id),
        newValue: JSON.stringify({ status: 'DISETUJUI' }),
      },
    });

    // Notify creator/Admin
    await this.prisma.notification.create({
      data: {
        userId: letter.createdById,
        title: 'Surat Disetujui Kepala Humas',
        message: `Surat No. ${letter.letterNumber} telah disetujui oleh Kepala Humas.`,
        type: 'SUCCESS',
        link: `/surat-masuk`,
      },
    });

    return updated;
  }

  async reject(id: number, userId: number, rejectNotes: string) {
    if (!rejectNotes) {
      throw new BadRequestException('Alasan penolakan wajib diisi.');
    }
    const letter = await this.findOne(id);
    if (letter.status === 'DISETUJUI' || letter.status === 'DITUGASKAN') {
      throw new BadRequestException('Surat yang sudah disetujui atau ditugaskan tidak dapat ditolak.');
    }

    const updated = await this.prisma.incomingLetter.update({
      where: { id },
      data: {
        status: 'DITOLAK',
        notes: rejectNotes,
      },
      include: letterInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'REJECT_SURAT_MASUK',
        entity: 'IncomingLetter',
        entityId: String(id),
        newValue: JSON.stringify({ status: 'DITOLAK', notes: rejectNotes }),
      },
    });

    // Notify creator/Admin
    await this.prisma.notification.create({
      data: {
        userId: letter.createdById,
        title: 'Surat Ditolak Kepala Humas',
        message: `Surat No. ${letter.letterNumber} ditolak oleh Kepala Humas dengan alasan: ${rejectNotes}`,
        type: 'ALERT',
        link: `/surat-masuk`,
      },
    });

    return updated;
  }

  async createActivityFromLetter(letterId: number, userId: number, dto: CreateActivityFromLetterDto) {
    const letter = await this.findOne(letterId);

    const locationToUse = dto.location || letter.eventLocation || letter.institution;
    if (!locationToUse || !locationToUse.trim()) {
      throw new BadRequestException('Lokasi kegiatan wajib diisi.');
    }

    if (letter.status === 'DITOLAK' || letter.status === 'DITUGASKAN' || letter.status === 'SELESAI') {
      throw new BadRequestException('Surat ini sudah ditolak atau telah ditugaskan sebelumnya.');
    }

    const picId = dto.picId || userId;
    const memberIds = dto.memberIds || [];

    // Verify PIC is role USER
    const picUser = await this.prisma.user.findUnique({ where: { id: picId } });
    if (!picUser) throw new NotFoundException('PIC tidak ditemukan.');
    if (picUser.role !== 'USER') {
      throw new BadRequestException('Hanya pengguna dengan role Anggota yang dapat ditugaskan sebagai PIC.');
    }

    // Verify all members have role USER
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

    const memberCreates: Array<{ userId: number; role: string; checkInStatus: CheckInStatus }> = [];
    if (picId) {
      memberCreates.push({
        userId: picId,
        role: 'PIC Lapangan',
        checkInStatus: CheckInStatus.MISSED,
      });
    }
    for (const mId of memberIds) {
      if (mId !== picId) {
        memberCreates.push({
          userId: mId,
          role: 'Anggota Humas',
          checkInStatus: CheckInStatus.MISSED,
        });
      }
    }

    const actDate = new Date(dto.date);
    const startParts = (dto.startTime || '08:00').split(':');
    const endParts = (dto.endTime || '17:00').split(':');
    const startDateTime = new Date(actDate);
    startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);
    const endDateTime = new Date(actDate);
    endDateTime.setHours(parseInt(endParts[0] || '23', 10), parseInt(endParts[1] || '59', 10), 59, 999);
    const now = new Date();

    let initialStatus: ActivityStatus = ActivityStatus.AKAN_DATANG;
    if (now > endDateTime) {
      initialStatus = ActivityStatus.MENUNGGU_VERIFIKASI;
    } else if (now >= startDateTime && now <= endDateTime) {
      initialStatus = ActivityStatus.SEDANG_BERLANGSUNG;
    }

    // Create activity linked to letter
    const activity = await this.prisma.activity.create({
      data: {
        title: dto.title,
        category: dto.category || 'Liputan Eksternal',
        date: new Date(dto.date),
        startTime: dto.startTime,
        endTime: dto.endTime,
        location: locationToUse,
        latitude: dto.latitude != null ? Number(dto.latitude) : letter.latitude,
        longitude: dto.longitude != null ? Number(dto.longitude) : letter.longitude,
        radius: dto.radius != null ? Number(dto.radius) : (letter.radius ?? 100),
        description: dto.description,
        status: initialStatus,
        isManual: false,
        picId,
        suratId: letterId,
        members: { create: memberCreates },
      },
      include: {
        pic: { select: { id: true, fullName: true } },
        surat: { select: { id: true, letterNumber: true, sender: true, subject: true } },
      },
    });

    // Update letter status to DITUGASKAN
    await this.prisma.incomingLetter.update({
      where: { id: letterId },
      data: { status: 'DITUGASKAN' },
    });

    // Create Equipment Loan if equipment items are provided
    if (dto.equipmentItems && dto.equipmentItems.length > 0) {
      for (const eqItem of dto.equipmentItems) {
        if (eqItem.quantity <= 0) continue;
        const eq = await this.prisma.equipment.findFirst({
          where: { id: eqItem.equipmentId, deletedAt: null },
        });
        if (!eq) throw new NotFoundException(`Alat ID #${eqItem.equipmentId} tidak ditemukan.`);

        const activeOverlapLoans = await this.prisma.equipmentLoan.findMany({
          where: {
            status: { in: ['SEDANG_DIPINJAM', 'TERLAMBAT'] },
            deletedAt: null,
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

      const validItems = dto.equipmentItems.filter((i) => i.quantity > 0);
      if (validItems.length > 0) {
        await this.prisma.equipmentLoan.create({
          data: {
            borrowerName: picUser.fullName,
            borrowerPhone: picUser.phone || '-',
            userId: picId,
            purpose: `Peralatan operasional untuk kegiatan: ${activity.title}`,
            borrowDate: startDateTime,
            returnDate: endDateTime,
            status: 'SEDANG_DIPINJAM',
            activityId: activity.id,
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
    }

    // Audit Log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'CREATE_KEGIATAN_FROM_SURAT',
        entity: 'Activity',
        entityId: String(activity.id),
        newValue: JSON.stringify({ activityId: activity.id, suratId: letterId, title: activity.title }),
      },
    });

    // Notify PIC
    await this.prisma.notification.create({
      data: {
        userId: picId,
        title: 'Penugasan Sebagai PIC Kegiatan',
        message: `Kamu ditugaskan sebagai PIC pada kegiatan "${activity.title}" dari Surat No. ${letter.letterNumber}.`,
        type: 'INFO',
        link: `/kegiatan/${activity.id}`,
      },
    });

    // Notify Members
    for (const mId of memberIds) {
      if (mId !== picId) {
        await this.prisma.notification.create({
          data: {
            userId: mId,
            title: 'Penugasan Anggota Kegiatan',
            message: `Kamu ditugaskan sebagai anggota pada kegiatan "${activity.title}" dari Surat No. ${letter.letterNumber}.`,
            type: 'INFO',
            link: `/kegiatan/${activity.id}`,
          },
        });
      }
    }

    return activity;
  }

  async remove(id: number, userId: number) {
    await this.findOne(id);
    const deleted = await this.prisma.incomingLetter.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_SURAT_MASUK',
        entity: 'IncomingLetter',
        entityId: String(id),
      },
    });

    return deleted;
  }
}
