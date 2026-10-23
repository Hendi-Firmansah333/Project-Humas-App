import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EquipmentLoansService } from '../src/equipment-loans/equipment-loans.service';
import { ActivitiesService } from '../src/activities/activities.service';
import { mapActivityForMobile } from '../src/common/mappers/mobile.mapper';

async function runTests() {
  console.log('--- STARTING INVENTARIS + PENUGASAN END-TO-END INTEGRATION TEST ---');
  const app = await NestFactory.createApplicationContext(AppModule, { logger: false });
  const prisma = app.get(PrismaService);
  const loanService = app.get(EquipmentLoansService);
  const actService = app.get(ActivitiesService);

  // Setup test user (PIC Tim Humas)
  let testUser = await prisma.user.findFirst({ where: { role: 'USER' } });
  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        username: 'test_humas_member',
        password: 'dummyPassword123',
        fullName: 'Ahmad Tim Humas',
        email: 'ahmad@polinela.ac.id',
        role: 'USER',
        roleLabel: 'Tim Humas',
        phone: '08123456789',
      },
    });
  }

  let adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        username: 'test_kepala_humas',
        password: 'dummyPassword123',
        fullName: 'Kepala Humas',
        email: 'kepala@polinela.ac.id',
        role: 'SUPER_ADMIN',
        roleLabel: 'Kepala Humas',
      },
    });
  }

  console.log('\n[TEST 1] Tambah Master Inventaris: 2 Unit Kamera Sony A7 IV');
  const equipment = await prisma.equipment.create({
    data: {
      name: 'Kamera Sony A7 IV Test',
      code: `EQ-TEST-${Date.now()}`,
      category: 'Kamera & Audio',
      brand: 'Sony',
      serialNumber: 'SN-SONY-001',
      total: 2,
      broken: 0,
      storage: 'Lemari Kamera A',
      status: 'AKTIF',
    },
  });

  const eqDetails = await loanService.findOneEquipment(equipment.id);
  console.log(`Hasil TEST 1: Total = ${eqDetails.total}, Tersedia = ${eqDetails.available}`);
  if (eqDetails.total !== 2 || eqDetails.available !== 2) {
    throw new Error('TEST 1 FAILED');
  }

  const testDate = '2026-09-15';

  console.log('\n[TEST 2] Buat Kegiatan A (08:00 - 12:00) & Tugaskan 1 Unit Kamera');
  const activityA = await prisma.activity.create({
    data: {
      title: 'Kegiatan A Peliputan Pagi',
      category: 'Liputan',
      date: new Date(`${testDate}T00:00:00.000Z`),
      startTime: '08:00',
      endTime: '12:00',
      location: 'Gedung Utama Polinela',
      description: 'Peliputan pagi',
      picId: testUser.id,
      status: 'DISETUJUI',
    },
  });

  await actService.assignTeam(activityA.id, testUser.id, [], [
    { equipmentId: equipment.id, quantity: 1 },
  ]);

  const availOverlap = await loanService.checkAvailability(testDate, '09:00', '11:00');
  const eqAvailB = availOverlap.find((e) => e.id === equipment.id);
  console.log(`Hasil TEST 2 & Check Bentrok (09:00 - 11:00): Sisa Tersedia = ${eqAvailB?.available} Unit`);
  if (eqAvailB?.available !== 1) {
    throw new Error(`TEST 2 FAILED: expected 1 available but got ${eqAvailB?.available}`);
  }

  console.log('\n[TEST 3] Buat Kegiatan B (09:00 - 11:00) Minta 2 Kamera (Waktu Bentrok)');
  let rejectedAsExpected = false;
  let activityBId: number | null = null;
  try {
    const activityB = await prisma.activity.create({
      data: {
        title: 'Kegiatan B Peliputan Siang',
        category: 'Liputan',
        date: new Date(`${testDate}T00:00:00.000Z`),
        startTime: '09:00',
        endTime: '11:00',
        location: 'Aula Polinela',
        description: 'Peliputan siang',
        picId: testUser.id,
        status: 'DISETUJUI',
      },
    });
    activityBId = activityB.id;

    await actService.assignTeam(activityB.id, testUser.id, [], [
      { equipmentId: equipment.id, quantity: 2 },
    ]);
  } catch (err: any) {
    rejectedAsExpected = true;
    console.log(`Hasil TEST 3: Ditolak dengan pesan: "${err.message}"`);
  }
  // cleanup B even if not rejected
  if (activityBId) {
    await prisma.activity.delete({ where: { id: activityBId } }).catch(() => {});
  }
  if (!rejectedAsExpected) {
    throw new Error('TEST 3 FAILED: Bentrok tidak menolak!');
  }

  console.log('\n[TEST 4] Buat Kegiatan C (14:00 - 16:00) Minta 2 Kamera (Waktu Berbeda / Bebas)');
  const activityC = await prisma.activity.create({
    data: {
      title: 'Kegiatan C Peliputan Sore',
      category: 'Liputan',
      date: new Date(`${testDate}T00:00:00.000Z`),
      startTime: '14:00',
      endTime: '16:00',
      location: 'Gedung GSG Polinela',
      description: 'Peliputan sore',
      picId: testUser.id,
      status: 'DISETUJUI',
    },
  });

  await actService.assignTeam(activityC.id, testUser.id, [], [
    { equipmentId: equipment.id, quantity: 2 },
  ]);
  console.log('Hasil TEST 4: Berhasil ditugaskan karena waktu tidak bentrok!');

  console.log('\n[TEST 5] Mapping Mobile Tim Humas');
  const activityADetails = await prisma.activity.findUnique({
    where: { id: activityA.id },
    include: {
      pic: { select: { fullName: true, username: true } },
      members: { include: { user: { select: { fullName: true } } } },
      media: true,
      loans: {
        include: {
          items: {
            include: {
              equipment: true,
            },
          },
        },
      },
    },
  });

  const mobileData = mapActivityForMobile(activityADetails as any, false, testUser.id);
  console.log('Hasil TEST 5: Assigned equipments in Mobile payload:', JSON.stringify(mobileData.assignedEquipments, null, 2));
  if (mobileData.assignedEquipments.length === 0 || mobileData.assignedEquipments[0].quantity !== 1) {
    throw new Error(`TEST 5 FAILED: expected 1 equipment with qty 1, got ${JSON.stringify(mobileData.assignedEquipments)}`);
  }
  console.log('Hasil TEST 5: OK!');

  console.log('\n[TEST 8] Syarat Verifikasi Kegiatan: Belum dikembalikan -> Ditolak');
  await prisma.activityMember.updateMany({
    where: { activityId: activityA.id },
    data: { checkInTime: '08:05', checkInStatus: 'SUCCESS' },
  });
  await prisma.media.create({
    data: {
      activityId: activityA.id,
      uploaderId: adminUser.id,
      fileType: 'application/link',
      fileName: 'Google Drive Dokumentasi',
      fileUrl: 'https://drive.google.com/test',
    },
  });

  let verifRejected = false;
  try {
    await actService.submitVerification(activityA.id, adminUser.id);
  } catch (err: any) {
    verifRejected = true;
    console.log(`Hasil TEST 8: Ditolak dengan pesan: "${err.message}"`);
  }
  if (!verifRejected) {
    throw new Error('TEST 8 FAILED: Verifikasi seharusnya ditolak jika alat belum dikembalikan');
  }

  console.log('\n[TEST 6] Pengembalian Alat Kondisi BAIK menggunakan update()');
  const loanA = await prisma.equipmentLoan.findFirst({
    where: { activityId: activityA.id },
    include: { items: true },
  });

  if (loanA && loanA.items.length > 0) {
    await loanService.update(loanA.id, {
      returnItems: [
        {
          loanItemId: loanA.items[0].id,
          returnedQuantity: 1,
          returnCondition: 'BAIK' as any,
        },
      ],
    });
    console.log('Hasil TEST 6: Pengembalian alat berhasil diproses!');
  }

  const eqAfterReturn = await loanService.findOneEquipment(equipment.id);
  console.log(`Hasil TEST 6: Alat dikembalikan. Total = ${eqAfterReturn.total}, Rusak = ${eqAfterReturn.broken}, Tersedia = ${eqAfterReturn.available}`);

  console.log('\n[TEST 9] Verifikasi Ulang Setelah Alat Dikembalikan');
  const verifiedAct = await actService.submitVerification(activityA.id, adminUser.id);
  console.log(`Hasil TEST 9: Status kegiatan berhasil diperbarui ke: ${verifiedAct?.status}`);
  if (verifiedAct?.status !== 'MENUNGGU_PERSETUJUAN_AKHIR') {
    throw new Error(`TEST 9 FAILED: expected MENUNGGU_PERSETUJUAN_AKHIR but got ${verifiedAct?.status}`);
  }

  // Cleanup test data
  console.log('\nCleaning up test data...');
  await prisma.equipmentLoanItem.deleteMany({ where: { loan: { activityId: { in: [activityA.id, activityC.id] } } } });
  await prisma.equipmentLoan.deleteMany({ where: { activityId: { in: [activityA.id, activityC.id] } } });
  await prisma.media.deleteMany({ where: { activityId: { in: [activityA.id, activityC.id] } } });
  await prisma.activityMember.deleteMany({ where: { activityId: { in: [activityA.id, activityC.id] } } });
  await prisma.activity.deleteMany({ where: { id: { in: [activityA.id, activityC.id] } } });
  await prisma.equipment.delete({ where: { id: equipment.id } });

  console.log('\n========================================');
  console.log('ALL TESTS PASSED SUCCESSFULLY! 100% OK');
  console.log('========================================');

  await app.close();
}

runTests().catch((e) => {
  console.error('TEST ERROR:', e.message || e);
  process.exit(1);
});
