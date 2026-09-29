import { ActivityStatus, CheckInStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export const ACTIVITY_INCLUDE = {
  pic: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
  validatedBy: { select: { id: true, fullName: true, roleLabel: true } },
  members: {
    include: {
      user: { select: { id: true, fullName: true, username: true, roleLabel: true, avatar: true } },
    },
    orderBy: { createdAt: 'asc' as const },
  },
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
      uploader: { select: { id: true, fullName: true } },
    },
  },
  attendances: {
    orderBy: { checkInTime: 'asc' as const },
    include: {
      user: { select: { id: true, fullName: true } },
    },
  },
  surat: {
    select: {
      id: true,
      letterNumber: true,
      letterDate: true,
      receivedDate: true,
      sender: true,
      institution: true,
      subject: true,
      destination: true,
      fileUrl: true,
    },
  },
  loans: {
    where: { deletedAt: null },
    include: {
      items: {
        include: {
          equipment: {
            select: { id: true, name: true, code: true, category: true, brand: true, photoUrl: true, condition: true },
          },
        },
      },
    },
  },
};

/**
 * Sinkronisasi status kegiatan secara otomatis sesuai waktu kegiatan saat ini.
 */
export async function syncActivityStatus(prisma: PrismaService): Promise<void> {
  const activities = await prisma.activity.findMany({
    where: {
      status: {
        in: [
          ActivityStatus.AKAN_DATANG,
          ActivityStatus.DITUGASKAN,
          ActivityStatus.SEDANG_BERLANGSUNG,
          ActivityStatus.MENUNGGU_VERIFIKASI,
        ],
      },
      deletedAt: null,
    },
    include: {
      members: true,
      media: {
        where: { deletedAt: null, fileType: 'application/link' },
      },
    },
  });

  const now = new Date();

  for (const activity of activities) {
    let currentStatus = activity.status;

    const activityDate = new Date(activity.date);
    const startParts = (activity.startTime || '08:00').split(':');
    const endParts = (activity.endTime || '17:00').split(':');

    const startDateTime = new Date(activityDate);
    startDateTime.setHours(parseInt(startParts[0] || '0', 10), parseInt(startParts[1] || '0', 10), 0, 0);

    const endDateTime = new Date(activityDate);
    endDateTime.setHours(parseInt(endParts[0] || '23', 10), parseInt(endParts[1] || '59', 10), 59, 999);

    if (now > endDateTime) {
      currentStatus = ActivityStatus.MENUNGGU_VERIFIKASI;
    } else if (now >= startDateTime && now <= endDateTime) {
      currentStatus = ActivityStatus.SEDANG_BERLANGSUNG;
    } else {
      currentStatus = ActivityStatus.AKAN_DATANG;
    }

    if (currentStatus !== activity.status) {
      const updated = await prisma.activity.update({
        where: { id: activity.id },
        data: { status: currentStatus },
      });
      await prisma.notification.create({
        data: {
          title: 'Status Kegiatan Berubah',
          message: `Status kegiatan "${updated.title}" kini berubah menjadi ${updated.status}.`,
          type: 'INFO',
        },
      });
    }
  }
}

/**
 * Bangun relasi anggota kegiatan (default role: 'Anggota Humas', PIC: 'PIC Lapangan').
 */
export function buildMemberCreates(memberIds?: number[], picId?: number) {
  const resolved: { userId: number; role: string; checkInStatus: CheckInStatus }[] = [];

  if (memberIds?.length) {
    for (const userId of memberIds) {
      if (userId !== picId) {
        resolved.push({
          userId,
          role: 'Anggota Humas',
          checkInStatus: CheckInStatus.MISSED,
        });
      }
    }
  }

  if (picId) {
    const picAlready = resolved.some((m) => m.userId === picId);
    if (!picAlready) {
      resolved.unshift({
        userId: picId,
        role: 'PIC Lapangan',
        checkInStatus: CheckInStatus.MISSED,
      });
    }
  }

  return resolved.length ? resolved : undefined;
}

/**
 * Filter query kegiatan untuk user mobile
 */
export function mobileActivityWhere(userId: number) {
  return {
    OR: [{ picId: userId }, { members: { some: { userId } } }],
  };
}

/**
 * Hitung jarak antara dua koordinat GPS menggunakan Haversine Formula (dalam meter).
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
