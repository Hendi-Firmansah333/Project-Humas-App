import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, ActivityStatus, CheckInStatus, ContentStatus, LoanStatus, Platform } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { username: 'komang.ari' },
    update: {},
    create: {
      fullName: 'Komang Ari',
      username: 'komang.ari',
      email: 'komang.ari@polinela.ac.id',
      phone: '0812-3456-7890',
      password,
      role: 'ADMIN',
      roleLabel: 'Admin Humas',
      status: 'AKTIF',
    },
  });

  const staff = await prisma.user.upsert({
    where: { username: 'budi.fotografer' },
    update: { role: 'USER', roleLabel: 'Anggota Humas', fullName: 'Budi Santoso' },
    create: {
      fullName: 'Budi Santoso',
      username: 'budi.fotografer',
      email: 'budi@polinela.ac.id',
      phone: '0812-1111-2222',
      password,
      role: 'USER',
      roleLabel: 'Anggota Humas',
      status: 'AKTIF',
    },
  });

  const jurnalis = await prisma.user.upsert({
    where: { username: 'rina.wati' },
    update: { role: 'USER', roleLabel: 'Anggota Humas' },
    create: {
      fullName: 'Rina Wati',
      username: 'rina.wati',
      email: 'rina@polinela.ac.id',
      phone: '0813-9876-5432',
      password,
      role: 'USER',
      roleLabel: 'Anggota Humas',
      status: 'AKTIF',
    },
  });

  const videografer = await prisma.user.upsert({
    where: { username: 'budi.s' },
    update: { role: 'USER', roleLabel: 'Anggota Humas' },
    create: {
      fullName: 'Budi Santoso',
      username: 'budi.s',
      email: 'budi.s@polinela.ac.id',
      phone: '0852-1122-3344',
      password,
      role: 'USER',
      roleLabel: 'Anggota Humas',
      status: 'AKTIF',
    },
  });

  const existingActivity = await prisma.activity.findFirst({
    where: { title: 'Liputan Dies Natalis POLINELA', deletedAt: null },
  });

  const activity = existingActivity ?? await prisma.activity.create({
    data: {
      title: 'Liputan Dies Natalis POLINELA',
      category: 'Dokumentasi Kegiatan',
      date: new Date(),
      startTime: '09:00',
      endTime: '12:00',
      location: 'Gedung Serbaguna POLINELA',
      status: ActivityStatus.SEDANG_BERLANGSUNG,
      description: 'Dokumentasi kegiatan Dies Natalis ke-41 POLINELA.',
      picId: admin.id,
      members: {
        create: [
          { userId: staff.id, role: 'Fotografer', checkInStatus: CheckInStatus.SUCCESS, checkInTime: '08:55' },
          { userId: jurnalis.id, role: 'Reporter', checkInStatus: CheckInStatus.MISSED },
          { userId: videografer.id, role: 'Videografer', checkInStatus: CheckInStatus.MISSED },
        ],
      },
    },
  });

  // Pastikan semua anggota humas terdaftar di kegiatan demo (sinkron web ↔ mobile)
  const memberUserIds = [staff.id, jurnalis.id, videografer.id];
  for (const userId of memberUserIds) {
    const exists = await prisma.activityMember.findFirst({
      where: { activityId: activity.id, userId },
    });
    if (!exists) {
      await prisma.activityMember.create({
        data: {
          activityId: activity.id,
          userId,
          role: userId === staff.id ? 'Fotografer' : userId === jurnalis.id ? 'Reporter' : 'Videografer',
          checkInStatus: userId === staff.id ? CheckInStatus.SUCCESS : CheckInStatus.MISSED,
          checkInTime: userId === staff.id ? '08:55' : null,
        },
      });
    }
  }

  const existingContent = await prisma.contentPlan.findFirst({
    where: { title: 'Reels Dies Natalis 2026', deletedAt: null },
  });
  if (!existingContent) {
  await prisma.contentPlan.create({
    data: {
      title: 'Reels Dies Natalis 2026',
      category: 'Sosial Media',
      platform: Platform.INSTAGRAM,
      contentType: 'Reels',
      picId: staff.id,
      deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      status: ContentStatus.PROSES,
      description: 'Highlight acara pembukaan Dies Natalis.',
    },
  });
  }

  const existingLoan = await prisma.equipmentLoan.findFirst({
    where: { borrowerName: staff.fullName, equipmentName: 'Kamera Sony A7III', status: LoanStatus.SEDANG_DIPINJAM },
  });
  if (!existingLoan) {
  await prisma.equipmentLoan.create({
    data: {
      borrowerName: staff.fullName,
      borrowerPhone: staff.phone || '08123456789',
      equipmentName: 'Kamera Sony A7III',
      borrowDate: new Date(),
      returnDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      status: LoanStatus.SEDANG_DIPINJAM,
      purpose: 'Liputan Dies Natalis',
    },
  });
  }

  const notificationCount = await prisma.notification.count();
  if (notificationCount === 0) {
  await prisma.notification.createMany({
    data: [
      {
        userId: staff.id,
        title: 'Jadwal Liputan Baru',
        message: 'Anda ditugaskan meliput Dies Natalis pukul 09:00 WIB.',
        type: 'INFO',
      },
      {
        userId: admin.id,
        title: 'Content Plan Deadline',
        message: 'Reels Dies Natalis jatuh tempo dalam 3 hari.',
        type: 'WARNING',
      },
    ],
  });
  }

  for (const [userId, lat, lng, address] of [
    [staff.id, -5.3582, 105.2321, 'Gedung Serbaguna POLINELA'],
    [jurnalis.id, -5.3588, 105.2330, 'Area Liputan GSG'],
    [videografer.id, -5.3590, 105.2335, 'Posko Media Sosial'],
  ] as [number, number, number, string][]) {
    await prisma.location.upsert({
      where: { userId },
      update: { latitude: lat, longitude: lng, address, isOnline: true },
      create: { userId, latitude: lat, longitude: lng, address, isOnline: true },
    });
  }

  await prisma.location.upsert({
    where: { userId: admin.id },
    update: {
      latitude: -5.3585,
      longitude: 105.2345,
      address: 'Posko Humas Rektorat Lt. 1',
      isOnline: true,
    },
    create: {
      userId: admin.id,
      latitude: -5.3585,
      longitude: 105.2345,
      address: 'Posko Humas Rektorat Lt. 1',
      isOnline: true,
    },
  });

  await prisma.location.upsert({
    where: { userId: jurnalis.id },
    update: {
      latitude: -5.3592,
      longitude: 105.2358,
      address: 'Gedung Rektorat Lantai 1',
      isOnline: true,
    },
    create: {
      userId: jurnalis.id,
      latitude: -5.3592,
      longitude: 105.2358,
      address: 'Gedung Rektorat Lantai 1',
      isOnline: true,
    },
  });

  const scheduleDate = new Date();
  scheduleDate.setHours(0, 0, 0, 0);
  for (const row of [
    { userId: admin.id, date: scheduleDate, startTime: '08:00', endTime: '16:00', notes: 'Koordinator piket pagi' },
    { userId: jurnalis.id, date: scheduleDate, startTime: '08:00', endTime: '16:00', notes: 'Piket liputan kampus' },
    { userId: staff.id, date: scheduleDate, startTime: '13:00', endTime: '20:00', notes: 'Dokumentasi sore' },
  ]) {
    const exists = await prisma.dutySchedule.findFirst({
      where: { userId: row.userId, date: row.date, startTime: row.startTime },
    });
    if (!exists) await prisma.dutySchedule.create({ data: row });
  }

  const existingReport = await prisma.report.findFirst({
    where: { title: 'Laporan Kegiatan Dies Natalis' },
  });
  if (!existingReport) {
  await prisma.report.create({
    data: {
      title: 'Laporan Kegiatan Dies Natalis',
      category: 'Kegiatan',
      date: new Date(),
      picId: admin.id,
      summary: 'Kegiatan berjalan lancar dengan dokumentasi lengkap.',
      status: 'Selesai',
    },
  });
  }

  // Perbaiki data lama: hapus duplikat & pastikan PIC terdaftar sebagai anggota (sinkron mobile)
  const duplicateActivities = await prisma.activity.findMany({
    where: { title: 'Liputan Dies Natalis POLINELA', deletedAt: null },
    orderBy: { id: 'asc' },
    skip: 1,
  });
  for (const dup of duplicateActivities) {
    await prisma.activity.update({
      where: { id: dup.id },
      data: { deletedAt: new Date() },
    });
  }

  const activitiesNeedingPic = await prisma.activity.findMany({
    where: { deletedAt: null },
    select: { id: true, picId: true, members: { select: { userId: true } } },
  });
  for (const act of activitiesNeedingPic) {
    if (!act.members.some((m) => m.userId === act.picId)) {
      await prisma.activityMember.create({
        data: {
          activityId: act.id,
          userId: act.picId,
          role: 'PIC Lapangan',
          checkInStatus: CheckInStatus.MISSED,
        },
      });
    }
  }

  console.log('Seed selesai:', { admin: admin.username, activity: activity.title });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });