import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'activity' | 'content' | 'loan' | 'user';
}

export default function StatusBadge({ status, type = 'activity' }: StatusBadgeProps) {
  let badgeClass = 'bg-[#ECEEF0] text-[#67686D] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
  let label = status;

  const upper = (status || '').toUpperCase().replace(/\s+/g, '_');

  switch (upper) {
    case 'MENUNGGU_VALIDASI':
      badgeClass = 'bg-[#FEF3C7] text-[#E99710] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Menunggu Validasi';
      break;
    case 'MENUNGGU_VERIFIKASI_ADMIN':
    case 'MENUNGGU_VERIFIKASI':
    case 'MENUNGGU_PERSETUJUAN':
    case 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS':
      badgeClass = 'bg-[#FEF3C7] text-[#E99710] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Menunggu Persetujuan';
      break;
    case 'DISETUJUI':
    case 'APPROVED':
    case 'TERJADWAL':
      badgeClass = 'bg-[#C0FFEA] text-[#10B981] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'TERJADWAL' ? 'Terjadwal' : 'Disetujui';
      break;
    case 'DITOLAK':
    case 'REJECTED':
      badgeClass = 'bg-[#FFF0F3] text-[#B8484A] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Ditolak';
      break;
    case 'GPS_INVALID':
    case 'INVALID':
      badgeClass = 'bg-[#FFF0F3] text-[#B8484A] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'GPS Invalid';
      break;
    case 'BELUM_DIMULAI':
      badgeClass = 'bg-[#E0F7F9] text-[#007985] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Belum Dimulai';
      break;
    case 'AKAN_DATANG':
    case 'MENUNGGU_PELAKSANAAN':
      badgeClass = 'bg-[#E0F7F9] text-[#007985] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'MENUNGGU_PELAKSANAAN' ? 'Menunggu Pelaksanaan' : 'Akan Datang';
      break;
    case 'DITUGASKAN':
      badgeClass = 'bg-[#E0E7FF] text-[#67686D] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Ditugaskan';
      break;
    case 'SEDANG_DIKERJAKAN':
    case 'SEDANG_BERLANGSUNG':
    case 'BERLANGSUNG':
    case 'PROSES':
      badgeClass = 'bg-[#E0F7F9] text-[#007985] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'SEDANG_DIKERJAKAN' ? 'Sedang Dikerjakan' : upper === 'PROSES' ? 'Proses' : 'Sedang Berlangsung';
      break;
    case 'SIAP_DIREVIEW':
    case 'MENUNGGU':
    case 'MENUNGGU_REVIEW':
    case 'MENUNGGU_PERSETUJUAN_AKHIR':
      badgeClass = 'bg-[#FEF3C7] text-[#E99710] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'SIAP_DIREVIEW' ? 'Siap Direview' : upper === 'MENUNGGU_PERSETUJUAN_AKHIR' ? 'Menunggu Persetujuan Akhir' : 'Menunggu Review';
      break;
    case 'SUDAH_TAYANG':
    case 'SELESAI':
    case 'PUBLISHED':
    case 'SUCCESS':
      badgeClass = 'bg-[#C0FFEA] text-[#10B981] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'SUDAH_TAYANG' ? 'Sudah Tayang' : upper === 'PUBLISHED' ? 'Published' : 'Selesai';
      break;
    case 'PERLU_PERBAIKAN':
    case 'PERLU_DIPERBAIKI':
    case 'PERLU_REVISI':
    case 'DIKEMBALIKAN':
    case 'REVISI':
    case 'REVISION':
      badgeClass = 'bg-[#FFF0F3] text-[#B8484A] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'PERLU_PERBAIKAN' ? 'Perlu Perbaikan' : upper === 'PERLU_DIPERBAIKI' ? 'Perlu Diperbaiki' : upper === 'PERLU_REVISI' ? 'Perlu Revisi' : 'Dikembalikan / Revisi';
      break;
    case 'DRAFT':
      badgeClass = 'bg-[#ECEEF0] text-[#67686D] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Draft';
      break;
    case 'DIPINJAM':
    case 'SEDANG_DIPINJAM':
      badgeClass = 'bg-[#E0F7F9] text-[#007985] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Sedang Dipinjam';
      break;
    case 'TERLAMBAT':
    case 'MISSED':
      badgeClass = 'bg-[#FEF5E7] text-[#E99710] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = upper === 'MISSED' ? 'Missed' : 'Terlambat';
      break;
    case 'DIBATALKAN':
      badgeClass = 'bg-[#FFF0F3] text-[#B8484A] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Dibatalkan';
      break;
    case 'AKTIF':
      badgeClass = 'bg-[#C0FFEA] text-[#10B981] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Aktif';
      break;
    case 'NONAKTIF':
      badgeClass = 'bg-[#FFF0F3] text-[#B8484A] font-semibold px-3 py-1 rounded-full text-xs inline-flex items-center gap-1.5';
      label = 'Nonaktif';
      break;
  }

  return <span className={badgeClass}>{label}</span>;
}
